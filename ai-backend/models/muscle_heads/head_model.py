"""
Stage 5: Per-Muscle Regression Heads with MC-Dropout Uncertainty.

Architecture per muscle group:
  Input: backbone_emb (384) + handcrafted_feats (32) = 416-dim
  → Linear(416, 128) → LayerNorm → GELU → Dropout(p)
  → Linear(128, 64)  → GELU → Dropout(p)
  → Linear(64, 2)    → [mean, log_var]

Output:
  score    ∈ [0, 10]  (clipped and calibrated)
  variance ∈ (0, ∞)   → std = exp(0.5 * log_var)

MC-Dropout uncertainty:
  At inference, keep dropout active, run N forward passes,
  compute empirical mean ± std over all predictions.
  Total uncertainty = aleatoric (log_var) + epistemic (MC variance)

Loss function:
  L = Σ [ (y - μ)² / (2σ²) + 0.5 * log(σ²) ]   (NLL Gaussian)
  + λ_huber * Huber(y, μ)                         (robustness term)
  + λ_rank  * max(0, margin - Δμ * label_sign)    (ranking constraint if pair available)

Training:
  - Stage 3: supervised on synthetic + manual labels → NLL + Huber
  - Stage 4: add pairwise ranking constraint on pairs (A better than B for muscle M)
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

from models.backbones.dinov2_extractor import EMBED_DIM
from pipeline.region_features import FEATURE_DIM

HEAD_INPUT_DIM = EMBED_DIM + FEATURE_DIM   # 384 + 32 = 416

MUSCLE_GROUPS = [
    "chest",
    "abs",
    "biceps",        # average of left/right
    "triceps",       # average of left/right (from shoulder/arm crop)
    "shoulders",
    "lats",
    "quads",
    "calves",
]

SCORE_MIN = 0.0
SCORE_MAX = 10.0


class MuscleHead(nn.Module):
    """
    Single muscle group regression head.

    Returns (mean, log_var) where:
      - mean: raw score (will be clipped to [0,10] at inference)
      - log_var: log of predicted variance (aleatoric uncertainty)
    """

    def __init__(self, input_dim: int = HEAD_INPUT_DIM, dropout_p: float = 0.35):
        super().__init__()
        self.dropout_p = dropout_p
        self.net = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.LayerNorm(128),
            nn.GELU(),
            nn.Dropout(dropout_p),
            nn.Linear(128, 64),
            nn.GELU(),
            nn.Dropout(dropout_p),
        )
        self.mean_head    = nn.Linear(64, 1)
        self.log_var_head = nn.Linear(64, 1)

        # Initialize log_var to predict log(1) = 0 → std=1 initially
        nn.init.zeros_(self.log_var_head.weight)
        nn.init.zeros_(self.log_var_head.bias)

    def forward(self, x: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
        """x: (B, HEAD_INPUT_DIM). Returns (mean: (B,1), log_var: (B,1))."""
        z        = self.net(x)
        mean     = self.mean_head(z)
        log_var  = self.log_var_head(z).clamp(-6, 4)   # var in [exp(-6), exp(4)]
        return mean, log_var


class MuscleHeadEnsemble(nn.Module):
    """
    Registry of all muscle group heads.

    Weights are stored separately per muscle so each can be
    fine-tuned or replaced independently.
    """

    def __init__(self, input_dim: int = HEAD_INPUT_DIM, dropout_p: float = 0.35):
        super().__init__()
        self.heads = nn.ModuleDict({
            name: MuscleHead(input_dim, dropout_p) for name in MUSCLE_GROUPS
        })
        self.input_dim = input_dim
        self.dropout_p = dropout_p

    def forward(
        self, features: dict[str, torch.Tensor]
    ) -> dict[str, tuple[torch.Tensor, torch.Tensor]]:
        """
        features: {muscle_name → (B, input_dim) tensor}
        Returns: {muscle_name → (mean (B,1), log_var (B,1))}
        """
        return {
            name: self.heads[name](feat)
            for name, feat in features.items()
            if name in self.heads
        }


# ── Loss functions ─────────────────────────────────────────────────────────────

def gaussian_nll_loss(
    mean: torch.Tensor,
    log_var: torch.Tensor,
    target: torch.Tensor,
    mask: Optional[torch.Tensor] = None,
) -> torch.Tensor:
    """
    L_nll = 0.5 * [ (y - μ)² / σ² + log(σ²) ]

    Jointly learns mean prediction AND uncertainty.
    mask: optional boolean tensor, True for valid samples.
    """
    var = torch.exp(log_var)
    loss = 0.5 * ((target - mean)**2 / (var + 1e-6) + log_var)
    if mask is not None:
        loss = loss[mask]
    return loss.mean()


def ranking_loss(
    score_a: torch.Tensor,
    score_b: torch.Tensor,
    preference: torch.Tensor,
    margin: float = 1.0,
) -> torch.Tensor:
    """
    Pairwise ranking loss (Bradley-Terry variant).

    preference: +1 if A is preferred (better), -1 if B is preferred.
    L = max(0, margin - preference * (score_a - score_b))

    Equivalent to a margin-based hinge loss on score differences.
    """
    diff = preference * (score_a.squeeze() - score_b.squeeze())
    return F.relu(margin - diff).mean()


def triplet_margin_loss(
    anchor: torch.Tensor,
    positive: torch.Tensor,
    negative: torch.Tensor,
    margin: float = 2.0,
) -> torch.Tensor:
    """
    Standard triplet loss on score space.
    anchor: score of reference image
    positive: score of image with better muscle development than anchor
    negative: score of image with worse development than anchor
    """
    d_pos = F.relu(anchor - positive + margin)   # anchor should score < positive
    d_neg = F.relu(negative - anchor + margin)   # anchor should score > negative
    return (d_pos + d_neg).mean()


def combined_head_loss(
    mean: torch.Tensor,
    log_var: torch.Tensor,
    target: torch.Tensor,
    mask: Optional[torch.Tensor] = None,
    lambda_huber: float = 0.5,
) -> torch.Tensor:
    """
    L = L_nll + λ_huber * L_huber

    NLL for uncertainty learning, Huber for robust regression.
    """
    nll  = gaussian_nll_loss(mean, log_var, target, mask)
    m    = mask if mask is not None else torch.ones_like(target, dtype=torch.bool)
    hub  = F.huber_loss(mean[m], target[m], delta=1.0)
    return nll + lambda_huber * hub


# ── Inference utilities ────────────────────────────────────────────────────────

@torch.no_grad()
def mc_dropout_predict(
    head: MuscleHead,
    x: torch.Tensor,
    n_samples: int = 20,
) -> tuple[float, float, float]:
    """
    Monte Carlo Dropout inference.

    Returns:
        score:       mean prediction over MC samples, clipped to [0, 10]
        aleatoric:   sqrt(mean predicted variance) — inherent noise
        epistemic:   std of MC mean predictions — model uncertainty
    """
    head.train()   # enable dropout
    means, vars_ = [], []
    for _ in range(n_samples):
        with torch.no_grad():
            m, lv = head(x)
        means.append(m.squeeze().item())
        vars_.append(torch.exp(lv).squeeze().item())
    head.eval()

    mc_mean      = float(np.mean(means))
    epistemic    = float(np.std(means))
    aleatoric    = float(np.sqrt(np.mean(vars_)))
    score        = float(np.clip(mc_mean, SCORE_MIN, SCORE_MAX))
    return score, aleatoric, epistemic


# ── Persistence ────────────────────────────────────────────────────────────────

def save_ensemble(model: MuscleHeadEnsemble, path: str) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    torch.save({
        "state_dict": model.state_dict(),
        "input_dim": model.input_dim,
        "dropout_p": model.dropout_p,
        "muscle_groups": MUSCLE_GROUPS,
    }, path)


def load_ensemble(path: str, device: Optional[torch.device] = None) -> MuscleHeadEnsemble:
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    ckpt = torch.load(path, map_location=device)
    model = MuscleHeadEnsemble(
        input_dim=ckpt.get("input_dim", HEAD_INPUT_DIM),
        dropout_p=ckpt.get("dropout_p", 0.35),
    )
    model.load_state_dict(ckpt["state_dict"])
    model.eval()
    return model.to(device)
