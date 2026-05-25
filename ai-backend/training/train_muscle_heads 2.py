"""
Stage 3 Training: Per-muscle regression heads.

Training data sources (in order of trust):
  1. Synthetic features (generate_synthetic.py) → base distribution
  2. Pairwise labels (pairwise_collector.py) → ranking constraints
  3. Manual labels (data/manual_labels.jsonl) → absolute anchor points

Pipeline:
  1. Load train/val split from data/train.jsonl (existing 56-feature format)
  2. Compute backbone embeddings for each sample
     (For synthetic data without images: use random projection as placeholder)
  3. Build (backbone_emb || handcrafted_feats) → 416-dim input tensors
  4. Train each muscle head independently with combined loss:
        L = NLL(Gaussian) + λ_huber * Huber
  5. Validation: MAE per muscle + ranking accuracy on pairwise split
  6. Save artifacts/models/muscle_heads.pt

Run:
  python -m training.train_muscle_heads --data data/train.jsonl --epochs 300

Training note on synthetic data:
  Synthetic samples don't have real images, so backbone embeddings are
  zero-initialized (the model learns to rely on handcrafted features first).
  Once real images accumulate, re-run with --use-real-images to compute
  actual DINOv2 embeddings and fine-tune.
"""
from __future__ import annotations

import argparse
import json
import os
import random
from pathlib import Path
from typing import Optional

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset, random_split

from models.muscle_heads.head_model import (
    MuscleHeadEnsemble, MUSCLE_GROUPS, HEAD_INPUT_DIM,
    combined_head_loss, save_ensemble, SCORE_MIN, SCORE_MAX,
)
from pipeline.feature_extractor import FEATURE_NAMES
from pipeline.region_features import FEATURE_DIM
from models.backbones.dinov2_extractor import EMBED_DIM

SYNTHETIC_LABEL_MAP = {
    "abs_definition":     "abs",
    "arm_thickness":      "biceps",
    "chest_development":  "chest",
    "shoulder_width":     "shoulders",
    "back_width":         "lats",
    "quad_development":   "quads",
    "calf_development":   "calves",
    # triceps ≈ arm_thickness (no separate label in current synthetic data)
}


class MuscleHeadDataset(Dataset):
    """
    Dataset for muscle head training.

    Each sample: {
      "backbone_emb": (EMBED_DIM,) float32
      "hand_crafted": (FEATURE_DIM,) float32
      "labels":  dict[muscle_name → float] — ordinal 0-5 rescaled to 0-10
      "weight":  float — sample trust weight
    }
    """

    def __init__(
        self,
        records: list[dict],
        embed_dim: int = EMBED_DIM,
        feat_dim: int = FEATURE_DIM,
    ):
        self.samples = records
        self.embed_dim = embed_dim
        self.feat_dim = feat_dim

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> dict:
        rec = self.samples[idx]
        backbone = np.array(rec.get("backbone_emb",
                                    np.zeros(self.embed_dim)), dtype=np.float32)
        hand     = np.array(rec.get("hand_crafted",
                                    np.zeros(self.feat_dim)), dtype=np.float32)
        feat     = np.concatenate([backbone, hand])   # (416,)
        labels   = rec.get("labels", {})
        weight   = float(rec.get("weight", 1.0))
        return {
            "features": torch.from_numpy(feat),
            "labels":   labels,
            "weight":   weight,
        }


def _load_records_from_jsonl(path: str) -> list[dict]:
    """Load and convert existing 56-feature JSONL format to MuscleHead format."""
    records = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            rec = json.loads(line)

            # Map existing synthetic labels → per-muscle labels (0-10 scale)
            labels: dict[str, Optional[float]] = {}
            for src_key, muscle in SYNTHETIC_LABEL_MAP.items():
                val = rec.get("labels", {}).get(src_key)
                if val is not None and val != -1:
                    # Existing labels are ordinal 0-5 → rescale to 0-10
                    labels[muscle] = float(np.clip(float(val) * 2.0, SCORE_MIN, SCORE_MAX))

            # triceps ≈ arm_thickness
            if "biceps" in labels:
                labels["triceps"] = labels["biceps"]

            # Hand-crafted features: proxy from 56-feat vector statistics
            features = rec.get("features", [])
            if len(features) == 56:
                hand_crafted = _proxy_handcrafted_from_56feat(features)
            else:
                hand_crafted = np.zeros(FEATURE_DIM, dtype=np.float32)

            records.append({
                "backbone_emb": np.zeros(EMBED_DIM, dtype=np.float32),
                "hand_crafted": hand_crafted,
                "labels": labels,
                "weight": float(rec.get("weight", 0.5)),
            })
    return records


def _proxy_handcrafted_from_56feat(features: list) -> np.ndarray:
    """
    Map the 56-feature vector to a rough approximation of the 32-dim
    handcrafted feature vector. Used for synthetic data (no real images).
    """
    f = np.array(features, dtype=np.float32)
    names = FEATURE_NAMES

    def get(name: str, default: float = 0.0) -> float:
        try:
            return float(f[names.index(name)])
        except ValueError:
            return default

    edge_u      = get("edge_density_upper", 0.05)
    edge_l      = get("edge_density_lower", 0.05)
    contour     = get("contour_irregularity", 0.05)
    bstd        = get("body_brightness_std", 0.08)
    arm_sym     = get("arm_width_symmetry", 0.005)
    wst_conc    = get("waist_concavity", 0.18)
    cond_g      = get("conditioning_gradient", 0.02)

    hand = np.zeros(FEATURE_DIM, dtype=np.float32)
    hand[0]  = edge_u * 100.0           # edge_sharpness proxy
    hand[1]  = edge_u                   # edge_mean
    hand[2]  = min(1.0, edge_u * 5.0)  # strong_edge_ratio
    hand[6]  = contour                  # texture_density proxy
    hand[8]  = get("body_brightness_mean", 0.55)
    hand[9]  = bstd
    hand[12] = bstd * 0.5              # vascularity proxy
    hand[14] = 0.3                     # skin saturation (neutral)
    hand[16] = float(np.clip(1.0 - arm_sym * 20.0, 0, 1))  # symmetry
    hand[21] = contour * 0.5           # separation_score
    hand[22] = cond_g                  # conditioning_gradient
    return hand


def train_muscle_heads(
    data_path: str = "data/train.jsonl",
    epochs: int = 300,
    batch_size: int = 64,
    lr: float = 1e-3,
    val_split: float = 0.15,
    output_path: str = "artifacts/models/muscle_heads.pt",
    seed: int = 42,
) -> dict:
    torch.manual_seed(seed)
    np.random.seed(seed)
    random.seed(seed)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[train_heads] device={device}")

    records = _load_records_from_jsonl(data_path)
    print(f"[train_heads] Loaded {len(records)} records from {data_path}")

    n_val  = max(1, int(len(records) * val_split))
    n_train = len(records) - n_val
    train_recs, val_recs = random_split(records, [n_train, n_val],
                                        generator=torch.Generator().manual_seed(seed))
    train_ds = MuscleHeadDataset(list(train_recs))
    val_ds   = MuscleHeadDataset(list(val_recs))

    model = MuscleHeadEnsemble(input_dim=HEAD_INPUT_DIM).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    best_val_loss = float("inf")
    best_state    = None
    patience      = 40
    no_improve    = 0
    history: dict = {"train": [], "val": []}

    for epoch in range(1, epochs + 1):
        # ── Training ────────────────────────────────────────────────────
        model.train()
        train_losses = []
        train_dl = DataLoader(train_ds, batch_size=batch_size, shuffle=True)

        for batch in train_dl:
            feats = batch["features"].to(device)
            w     = batch["weight"].to(device)
            labels_dict = batch["labels"]

            total_loss = torch.zeros(1, device=device)
            n_muscles  = 0

            for muscle in MUSCLE_GROUPS:
                if muscle not in labels_dict:
                    continue
                y_raw = labels_dict[muscle]
                # Skip samples where this muscle is None / missing
                if isinstance(y_raw, (list, torch.Tensor)):
                    y_t = torch.as_tensor(y_raw, dtype=torch.float32).to(device)
                else:
                    continue
                valid = ~torch.isnan(y_t) & (y_t >= 0)
                if valid.sum() == 0:
                    continue

                mean, lv = model.heads[muscle](feats)
                loss = combined_head_loss(mean.squeeze(), lv.squeeze(),
                                          y_t, mask=valid)
                total_loss = total_loss + loss * w[valid].mean()
                n_muscles += 1

            if n_muscles > 0:
                loss_val = total_loss / n_muscles
                optimizer.zero_grad()
                loss_val.backward()
                nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                optimizer.step()
                train_losses.append(loss_val.item())

        scheduler.step()

        # ── Validation ──────────────────────────────────────────────────
        model.eval()
        val_losses, val_maes = [], []
        val_dl = DataLoader(val_ds, batch_size=batch_size)

        with torch.no_grad():
            for batch in val_dl:
                feats  = batch["features"].to(device)
                labels_dict = batch["labels"]
                for muscle in MUSCLE_GROUPS:
                    if muscle not in labels_dict:
                        continue
                    y_raw = labels_dict[muscle]
                    if isinstance(y_raw, (list, torch.Tensor)):
                        y_t = torch.as_tensor(y_raw, dtype=torch.float32).to(device)
                    else:
                        continue
                    valid = ~torch.isnan(y_t) & (y_t >= 0)
                    if valid.sum() == 0:
                        continue
                    mean, lv = model.heads[muscle](feats)
                    val_losses.append(
                        combined_head_loss(mean.squeeze(), lv.squeeze(), y_t, valid).item()
                    )
                    val_maes.append(
                        torch.abs(mean.squeeze()[valid] - y_t[valid]).mean().item()
                    )

        tl = float(np.mean(train_losses)) if train_losses else 0.0
        vl = float(np.mean(val_losses)) if val_losses else 0.0
        vm = float(np.mean(val_maes)) if val_maes else 0.0
        history["train"].append(tl)
        history["val"].append(vl)

        if vl < best_val_loss:
            best_val_loss = vl
            no_improve = 0
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}
        else:
            no_improve += 1

        if epoch % 50 == 0 or epoch <= 5:
            print(f"[train_heads] epoch={epoch:3d} "
                  f"train_loss={tl:.4f} val_loss={vl:.4f} val_mae={vm:.3f}")

        if no_improve >= patience:
            print(f"[train_heads] Early stopping at epoch {epoch}")
            break

    if best_state is not None:
        model.load_state_dict({k: v.to(device) for k, v in best_state.items()})

    save_ensemble(model, output_path)
    print(f"[train_heads] Saved → {output_path}")
    return {"best_val_loss": best_val_loss, "history": history}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data",    default="data/train.jsonl")
    parser.add_argument("--epochs",  type=int, default=300)
    parser.add_argument("--batch",   type=int, default=64)
    parser.add_argument("--lr",      type=float, default=1e-3)
    parser.add_argument("--output",  default="artifacts/models/muscle_heads.pt")
    parser.add_argument("--seed",    type=int, default=42)
    args = parser.parse_args()

    train_muscle_heads(
        data_path=args.data,
        epochs=args.epochs,
        batch_size=args.batch,
        lr=args.lr,
        output_path=args.output,
        seed=args.seed,
    )
