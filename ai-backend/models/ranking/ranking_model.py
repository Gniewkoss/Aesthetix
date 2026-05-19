"""
Ranking model for pairwise / triplet learning.

Why ranking instead of regression:
  - No ground-truth absolute scores needed
  - Works with "image A has better biceps than image B" labels
  - More robust to labeler calibration differences
  - Naturally accumulates from user feedback loops

Architecture:
  Shared encoder (DINOv2 embeddings + handcrafted features → 128-dim)
  → Per-muscle embedding (64-dim)
  → Ranking head (scalar score per muscle)

Training modes:
  1. Contrastive (SimCSE-style): same-person crops → positive pairs
  2. Pairwise ranking: A > B for muscle M → Bradley-Terry loss
  3. Triplet: anchor, better, worse → triplet margin loss

The ranking model produces RELATIVE scores. These are calibrated to [0,10]
using isotonic regression on a held-out set with manual absolute labels.
"""
from __future__ import annotations

from pathlib import Path
from typing import Optional

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

from models.backbones.dinov2_extractor import EMBED_DIM
from pipeline.region_features import FEATURE_DIM
from models.muscle_heads.head_model import MUSCLE_GROUPS

RANK_INPUT_DIM = EMBED_DIM + FEATURE_DIM   # 416
RANK_EMBED_DIM = 64
MARGIN_TRIPLET = 2.0
MARGIN_PAIRWISE = 1.0
TEMPERATURE = 0.07    # NT-Xent contrastive temperature


class RankingEncoder(nn.Module):
    """
    Shared encoder: 416 → 128 → 64-dim L2-normalized embedding.
    Used as the backbone for all muscle ranking tasks.
    """

    def __init__(self, input_dim: int = RANK_INPUT_DIM, dropout_p: float = 0.3):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.LayerNorm(128),
            nn.GELU(),
            nn.Dropout(dropout_p),
            nn.Linear(128, RANK_EMBED_DIM),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """x: (B, 416). Returns (B, 64) L2-normalized."""
        return F.normalize(self.net(x), dim=-1)


class RankingHead(nn.Module):
    """
    Converts 64-dim embedding to a scalar ranking score.
    Each muscle group has its own RankingHead.
    """

    def __init__(self):
        super().__init__()
        self.score = nn.Linear(RANK_EMBED_DIM, 1)

    def forward(self, emb: torch.Tensor) -> torch.Tensor:
        """emb: (B, 64). Returns (B, 1)."""
        return self.score(emb)


class RankingModel(nn.Module):
    """
    Full ranking model: shared encoder + per-muscle ranking heads.

    At inference: produces a relative ranking score per muscle that
    is then calibrated to absolute [0,10] by the aggregation layer.
    """

    def __init__(self, input_dim: int = RANK_INPUT_DIM, dropout_p: float = 0.3):
        super().__init__()
        self.encoder = RankingEncoder(input_dim, dropout_p)
        self.heads = nn.ModuleDict({
            name: RankingHead() for name in MUSCLE_GROUPS
        })

    def encode(self, x: torch.Tensor) -> torch.Tensor:
        """Shared embedding. x: (B, 416). Returns (B, 64)."""
        return self.encoder(x)

    def score(self, x: torch.Tensor, muscle: str) -> torch.Tensor:
        """End-to-end score for a single muscle. Returns (B, 1)."""
        emb = self.encoder(x)
        return self.heads[muscle](emb)

    def score_all(
        self, x: torch.Tensor
    ) -> dict[str, torch.Tensor]:
        """Score all muscles at once. Returns {muscle: (B, 1)}."""
        emb = self.encoder(x)
        return {name: head(emb) for name, head in self.heads.items()}


# ── Loss functions ──────────────────────────────────────────────────────────

def pairwise_ranking_loss(
    score_a: torch.Tensor,
    score_b: torch.Tensor,
    preferred: torch.Tensor,
    margin: float = MARGIN_PAIRWISE,
) -> torch.Tensor:
    """
    Bradley-Terry pairwise ranking loss.

    preferred: +1 if A is better, -1 if B is better.
    L = E[ max(0, margin - preferred * (score_A - score_B)) ]

    Gradient pushes score_A > score_B when preferred=+1.
    """
    diff = preferred * (score_a.squeeze(-1) - score_b.squeeze(-1))
    return F.relu(margin - diff).mean()


def triplet_loss(
    anchor: torch.Tensor,
    positive: torch.Tensor,
    negative: torch.Tensor,
    margin: float = MARGIN_TRIPLET,
) -> torch.Tensor:
    """
    Triplet margin loss on score scalars.

    anchor: score for reference image
    positive: score for image with BETTER development than anchor
    negative: score for image with WORSE development than anchor

    L = max(0, margin - (positive - anchor)) + max(0, margin - (anchor - negative))

    Pushes positive > anchor + margin AND anchor > negative + margin.
    """
    loss_pos = F.relu(margin - (positive.squeeze() - anchor.squeeze()))
    loss_neg = F.relu(margin - (anchor.squeeze() - negative.squeeze()))
    return (loss_pos + loss_neg).mean()


def contrastive_nt_xent_loss(
    emb_a: torch.Tensor,
    emb_b: torch.Tensor,
    temperature: float = TEMPERATURE,
) -> torch.Tensor:
    """
    NT-Xent contrastive loss (SimCLR style).

    emb_a, emb_b: (B, 64) L2-normalized embeddings of positive pairs.
    Diagonal = positive pairs; off-diagonal = negatives within the batch.

    L = -log[ exp(sim(a_i, b_i)/τ) / Σ_j exp(sim(a_i, b_j)/τ) ]

    Used during representation pretraining on augmented pairs of the
    SAME person's crops (same person = positive; different person = negative).
    """
    B = emb_a.shape[0]
    emb = torch.cat([emb_a, emb_b], dim=0)           # (2B, 64)
    sim = torch.mm(emb, emb.T) / temperature          # (2B, 2B)

    # Mask out self-similarity
    mask = torch.eye(2 * B, device=emb.device, dtype=torch.bool)
    sim = sim.masked_fill(mask, -1e9)

    # Positive pairs: (i, i+B) and (i+B, i)
    labels = torch.arange(B, device=emb.device)
    labels = torch.cat([labels + B, labels])           # (2B,)

    return F.cross_entropy(sim, labels)


def combined_ranking_loss(
    model: RankingModel,
    batch: dict,
    lambda_contrastive: float = 0.3,
    lambda_ranking: float = 0.7,
) -> torch.Tensor:
    """
    Combined loss for a mixed batch containing:
      - "contrastive_pairs": (feat_a, feat_b, muscle) — same-person augmentations
      - "pairwise": (feat_a, feat_b, preferred, muscle) — labeled comparisons
      - "triplet": (anchor, positive, negative, muscle) — triplet comparisons

    Returns scalar total loss.
    """
    total = torch.zeros(1, device=next(model.parameters()).device)
    n_terms = 0

    if "contrastive_pairs" in batch and batch["contrastive_pairs"]:
        for fa, fb, muscle in batch["contrastive_pairs"]:
            ea = model.encode(fa)
            eb = model.encode(fb)
            total = total + contrastive_nt_xent_loss(ea, eb) * lambda_contrastive
            n_terms += 1

    if "pairwise" in batch and batch["pairwise"]:
        for fa, fb, pref, muscle in batch["pairwise"]:
            sa = model.score(fa, muscle)
            sb = model.score(fb, muscle)
            total = total + pairwise_ranking_loss(sa, sb, pref) * lambda_ranking
            n_terms += 1

    if "triplet" in batch and batch["triplet"]:
        for anc, pos, neg, muscle in batch["triplet"]:
            sa = model.score(anc, muscle)
            sp = model.score(pos, muscle)
            sn = model.score(neg, muscle)
            total = total + triplet_loss(sa, sp, sn) * lambda_ranking
            n_terms += 1

    return total / max(1, n_terms)


# ── Score calibration via isotonic regression ──────────────────────────────

class RankingCalibrator:
    """
    Maps raw ranking scores → calibrated [0, 10] absolute scores.

    Fitted on a small set of manually labeled images where we have
    both the raw ranking model output AND a human absolute score (1-10).
    Uses isotonic regression to preserve rank order while fitting absolute scale.
    """

    def __init__(self):
        from sklearn.isotonic import IsotonicRegression
        self._calibrators: dict[str, IsotonicRegression] = {}

    def fit(self, muscle: str, raw_scores: np.ndarray,
            absolute_labels: np.ndarray) -> None:
        from sklearn.isotonic import IsotonicRegression
        ir = IsotonicRegression(out_of_bounds="clip", y_min=0.0, y_max=10.0)
        ir.fit(raw_scores, absolute_labels)
        self._calibrators[muscle] = ir

    def calibrate(self, muscle: str, raw_score: float) -> float:
        if muscle not in self._calibrators:
            # Linear fallback: assume raw ~ [−5, 5] → [0, 10]
            return float(np.clip((raw_score + 5.0) * 1.0, 0.0, 10.0))
        return float(self._calibrators[muscle].predict([raw_score])[0])

    def save(self, path: str) -> None:
        import joblib
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self._calibrators, path)

    @classmethod
    def load(cls, path: str) -> "RankingCalibrator":
        import joblib
        obj = cls()
        obj._calibrators = joblib.load(path)
        return obj


# ── Persistence ────────────────────────────────────────────────────────────

def save_ranking_model(model: RankingModel, path: str) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    torch.save({
        "state_dict": model.state_dict(),
        "muscle_groups": MUSCLE_GROUPS,
    }, path)


def load_ranking_model(path: str,
                       device: Optional[torch.device] = None) -> RankingModel:
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    ckpt = torch.load(path, map_location=device)
    model = RankingModel()
    model.load_state_dict(ckpt["state_dict"])
    model.eval()
    return model.to(device)
