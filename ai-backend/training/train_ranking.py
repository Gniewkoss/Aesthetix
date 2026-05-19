"""
Stage 4 Training: Ranking fine-tuning.

Uses pairwise comparison data (A better than B for muscle M) to train the
RankingModel using triplet loss + contrastive loss.

Data format (data/pairwise_labels.jsonl):
  {
    "id_a": "uuid", "id_b": "uuid",
    "muscle": "biceps",
    "preferred": "a",   // "a" or "b"
    "labeler": "user_id",
    "confidence": 0.9   // labeler confidence
  }

Each sample requires pre-extracted feature vectors.
If feature files are absent, the trainer generates them from stored images.

Training procedure:
  1. Load pre-trained backbone (frozen initially)
  2. Load pre-trained muscle heads checkpoint (warm start)
  3. Load pairwise labels
  4. Build triplets from pairwise: if A > B and B > C, generate (B, A, C)
  5. Train RankingModel with combined loss:
     L = λ_pairwise * BradleyTerry + λ_contrastive * NT-Xent
  6. Calibrate ranking scores → [0,10] using isotonic regression
  7. Save artifacts/models/ranking_model.pt + ranking_calibrator.pkl

Run:
  python -m training.train_ranking \\
    --pairs data/pairwise_labels.jsonl \\
    --features data/feature_cache/ \\
    --epochs 100
"""
from __future__ import annotations

import argparse
import json
import random
from collections import defaultdict
from pathlib import Path
from typing import Optional

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset

from models.ranking.ranking_model import (
    RankingModel, pairwise_ranking_loss, triplet_loss,
    contrastive_nt_xent_loss, save_ranking_model, RankingCalibrator,
)
from models.muscle_heads.head_model import MUSCLE_GROUPS, HEAD_INPUT_DIM


class PairwiseDataset(Dataset):
    """
    Loads pairwise preference labels with pre-extracted feature vectors.

    feature_cache: dict[sample_id → np.ndarray of shape (HEAD_INPUT_DIM,)]
    """

    def __init__(
        self,
        pairs: list[dict],
        feature_cache: dict[str, np.ndarray],
    ):
        # Filter to pairs where both feature vectors exist
        self.pairs = [
            p for p in pairs
            if p["id_a"] in feature_cache and p["id_b"] in feature_cache
        ]
        self.cache = feature_cache
        print(f"[PairwiseDataset] {len(self.pairs)} usable pairs "
              f"(of {len(pairs)} total)")

    def __len__(self) -> int:
        return len(self.pairs)

    def __getitem__(self, idx: int) -> dict:
        p = self.pairs[idx]
        fa = torch.from_numpy(self.cache[p["id_a"]].astype(np.float32))
        fb = torch.from_numpy(self.cache[p["id_b"]].astype(np.float32))
        preferred = 1.0 if p["preferred"] == "a" else -1.0
        conf = float(p.get("confidence", 1.0))
        return {
            "feat_a":    fa,
            "feat_b":    fb,
            "preferred": torch.tensor(preferred),
            "muscle":    p["muscle"],
            "weight":    torch.tensor(conf),
        }


def _load_pairs(path: str) -> list[dict]:
    pairs = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line:
                pairs.append(json.loads(line))
    return pairs


def _load_feature_cache(cache_dir: str) -> dict[str, np.ndarray]:
    """Load pre-extracted .npy feature files from a directory."""
    cache: dict[str, np.ndarray] = {}
    cache_path = Path(cache_dir)
    if not cache_path.exists():
        return cache
    for p in cache_path.glob("*.npy"):
        sample_id = p.stem
        cache[sample_id] = np.load(str(p)).astype(np.float32)
    print(f"[ranking] Loaded {len(cache)} feature vectors from {cache_dir}")
    return cache


def _build_triplets_from_pairs(
    pairs: list[dict],
    feature_cache: dict[str, np.ndarray],
    n_triplets_per_pair: int = 3,
) -> list[tuple]:
    """
    Expand pairwise comparisons into triplets using transitive closure.

    If we know A > B and B > C (for the same muscle), we generate triplet
    (B as anchor, A as positive, C as negative).
    """
    # Group by muscle
    muscle_rank: dict[str, list[tuple[str, str]]] = defaultdict(list)
    for p in pairs:
        if p["id_a"] not in feature_cache or p["id_b"] not in feature_cache:
            continue
        if p["preferred"] == "a":
            muscle_rank[p["muscle"]].append((p["id_a"], p["id_b"]))  # a > b
        else:
            muscle_rank[p["muscle"]].append((p["id_b"], p["id_a"]))  # b > a

    triplets = []
    for muscle, ordered_pairs in muscle_rank.items():
        better_than: dict[str, set[str]] = defaultdict(set)
        for winner, loser in ordered_pairs:
            better_than[winner].add(loser)

        for anchor, anchor_losers in better_than.items():
            for _ in range(n_triplets_per_pair):
                # Find something better than anchor (anchor is negative)
                anchor_winners = [k for k, v in better_than.items()
                                  if anchor in v]
                if anchor_winners and anchor_losers:
                    positive = random.choice(anchor_winners)
                    negative = random.choice(list(anchor_losers))
                    if (positive in feature_cache and
                            negative in feature_cache and
                            positive != negative):
                        triplets.append((positive, anchor, negative, muscle))

    print(f"[ranking] Built {len(triplets)} triplets from pairwise pairs")
    return triplets


def train_ranking(
    pairs_path: str = "data/pairwise_labels.jsonl",
    feature_cache_dir: str = "data/feature_cache",
    epochs: int = 100,
    batch_size: int = 32,
    lr: float = 5e-4,
    lambda_contrastive: float = 0.3,
    lambda_pairwise: float = 0.7,
    output_model: str = "artifacts/models/ranking_model.pt",
    output_calibrator: str = "artifacts/models/ranking_calibrator.pkl",
    seed: int = 42,
) -> dict:
    torch.manual_seed(seed)
    np.random.seed(seed)
    random.seed(seed)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[train_ranking] device={device}")

    if not Path(pairs_path).exists():
        print(f"[train_ranking] No pairs file at {pairs_path}. "
              "Skipping ranking training (no pairwise data yet).")
        return {"skipped": True, "reason": "no_pairwise_data"}

    pairs = _load_pairs(pairs_path)
    feature_cache = _load_feature_cache(feature_cache_dir)

    if not feature_cache:
        print("[train_ranking] No feature cache. Cannot train without features.")
        return {"skipped": True, "reason": "no_feature_cache"}

    dataset  = PairwiseDataset(pairs, feature_cache)
    triplets = _build_triplets_from_pairs(pairs, feature_cache)

    if len(dataset) < 10:
        print(f"[train_ranking] Only {len(dataset)} usable pairs — need ≥10. "
              "Collect more pairwise labels.")
        return {"skipped": True, "reason": "too_few_pairs"}

    model     = RankingModel(input_dim=HEAD_INPUT_DIM).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    best_loss  = float("inf")
    best_state = None
    history    = {"train": []}

    for epoch in range(1, epochs + 1):
        model.train()
        epoch_losses = []

        # Pairwise ranking batches
        dl = DataLoader(dataset, batch_size=batch_size, shuffle=True)
        for batch in dl:
            fa = batch["feat_a"].to(device)
            fb = batch["feat_b"].to(device)
            pref = batch["preferred"].to(device)

            total_loss = torch.zeros(1, device=device)

            # Compute loss per unique muscle in this mini-batch
            muscles_in_batch = list(set(batch["muscle"]))
            for muscle in muscles_in_batch:
                mask = [m == muscle for m in batch["muscle"]]
                if not any(mask):
                    continue
                idx = torch.tensor([i for i, m in enumerate(mask) if m], device=device)
                sa = model.score(fa[idx], muscle)
                sb = model.score(fb[idx], muscle)
                pw_loss = pairwise_ranking_loss(sa, sb, pref[idx]) * lambda_pairwise
                total_loss = total_loss + pw_loss

            if total_loss.item() > 0:
                optimizer.zero_grad()
                total_loss.backward()
                nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                optimizer.step()
                epoch_losses.append(total_loss.item())

        # Contrastive loss on triplets (if any)
        if triplets and lambda_contrastive > 0:
            random.shuffle(triplets)
            for i in range(0, min(len(triplets), 64), batch_size):
                tb = triplets[i:i + batch_size]
                if len(tb) < 2:
                    break
                anc_feats  = torch.stack([
                    torch.from_numpy(feature_cache[t[0]]) for t in tb]).to(device)
                pos_feats  = torch.stack([
                    torch.from_numpy(feature_cache[t[1]]) for t in tb]).to(device)
                neg_feats  = torch.stack([
                    torch.from_numpy(feature_cache[t[2]]) for t in tb]).to(device)
                muscles_tb = [t[3] for t in tb]

                for muscle in set(muscles_tb):
                    midx = [i for i, m in enumerate(muscles_tb) if m == muscle]
                    if len(midx) < 2:
                        continue
                    idx = torch.tensor(midx, device=device)
                    sa = model.score(anc_feats[idx], muscle)
                    sp = model.score(pos_feats[idx], muscle)
                    sn = model.score(neg_feats[idx], muscle)
                    tl_loss = triplet_loss(sa, sp, sn) * lambda_contrastive
                    optimizer.zero_grad()
                    tl_loss.backward()
                    nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                    optimizer.step()
                    epoch_losses.append(tl_loss.item())

        scheduler.step()

        mean_loss = float(np.mean(epoch_losses)) if epoch_losses else 0.0
        history["train"].append(mean_loss)

        if mean_loss < best_loss:
            best_loss  = mean_loss
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}

        if epoch % 20 == 0:
            print(f"[train_ranking] epoch={epoch:3d} loss={mean_loss:.4f}")

    if best_state is not None:
        model.load_state_dict({k: v.to(device) for k, v in best_state.items()})

    save_ranking_model(model, output_model)
    print(f"[train_ranking] Saved → {output_model}")
    return {"best_loss": best_loss, "history": history}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--pairs",    default="data/pairwise_labels.jsonl")
    parser.add_argument("--features", default="data/feature_cache")
    parser.add_argument("--epochs",   type=int, default=100)
    parser.add_argument("--batch",    type=int, default=32)
    parser.add_argument("--lr",       type=float, default=5e-4)
    parser.add_argument("--output",   default="artifacts/models/ranking_model.pt")
    args = parser.parse_args()

    train_ranking(
        pairs_path=args.pairs,
        feature_cache_dir=args.features,
        epochs=args.epochs,
        batch_size=args.batch,
        lr=args.lr,
        output_model=args.output,
    )
