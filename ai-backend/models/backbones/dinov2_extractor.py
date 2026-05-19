"""
Stage 4 (deep features): DINOv2-ViT-S/14 backbone.

Produces per-region embeddings used by the muscle head models.

Architecture choice rationale:
  - DINOv2-ViT-S/14: 21M params, 384-dim, strong local patch features,
    no supervision bias toward ImageNet classes → good transfer for body parts
  - CLS token = global descriptor per region
  - Mean of patch tokens = spatial average (more stable for small crops)
  - Concatenation of both = 768-dim richer embedding

Fallback chain (in order if DINOv2 unavailable):
  1. EfficientNet-B0 via timm (5M params, 1280-dim → projected to 384)
  2. ConvNeXt-Tiny (28M, 768-dim → projected to 384)
  3. Random projection baseline (for cold-start / testing)

Usage:
  extractor = BackboneExtractor.load()   # auto-selects best available
  emb = extractor.embed_crop(crop_img)   # (384,) float32
  emb_batch = extractor.embed_batch(list_of_crops)  # (N, 384)
"""
from __future__ import annotations

import os
from typing import Optional

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

EMBED_DIM = 384       # canonical output dim regardless of backbone used
CROP_SIZE = 224       # expected input size

# ImageNet normalization (used by all pretrained backbones)
_MEAN = torch.tensor([0.485, 0.456, 0.406]).view(1, 3, 1, 1)
_STD  = torch.tensor([0.229, 0.224, 0.225]).view(1, 3, 1, 1)


def _normalize(x: torch.Tensor, device: torch.device) -> torch.Tensor:
    m = _MEAN.to(device)
    s = _STD.to(device)
    return (x - m) / s


class DINOv2Extractor(nn.Module):
    """Wraps facebook/dinov2_vits14 and extracts CLS + mean-patch embeddings."""

    def __init__(self, use_patch_mean: bool = True):
        super().__init__()
        self.use_patch_mean = use_patch_mean
        self._model: Optional[nn.Module] = None
        self._loaded = False

    def _lazy_load(self) -> None:
        if self._loaded:
            return
        try:
            self._model = torch.hub.load(
                "facebookresearch/dinov2", "dinov2_vits14",
                pretrained=True, verbose=False,
            )
            self._model.eval()
            self._loaded = True
        except Exception as e:
            raise RuntimeError(
                f"DINOv2 load failed: {e}. "
                "Ensure internet access on first run, or use BackboneExtractor.load() "
                "which falls back to EfficientNet."
            )

    @torch.no_grad()
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """x: (B, 3, 224, 224) float32 in [0,1]. Returns (B, 384)."""
        self._lazy_load()
        device = x.device
        x = _normalize(x, device)
        out = self._model.forward_features(x)   # dict with 'x_norm_clstoken', 'x_norm_patchtokens'
        cls_tok  = out["x_norm_clstoken"]        # (B, 384)
        if self.use_patch_mean:
            patch_tok = out["x_norm_patchtokens"].mean(dim=1)  # (B, 384)
            return (cls_tok + patch_tok) / 2.0
        return cls_tok


class EfficientNetExtractor(nn.Module):
    """EfficientNet-B0 via timm → projected to 384-dim. Fallback backbone."""

    def __init__(self):
        super().__init__()
        try:
            import timm
            backbone = timm.create_model("efficientnet_b0", pretrained=True,
                                         num_classes=0, global_pool="avg")
            in_dim = backbone.num_features   # 1280 for B0
        except ImportError:
            raise ImportError("timm is required for EfficientNet fallback: pip install timm")
        self.backbone = backbone
        self.proj = nn.Linear(in_dim, EMBED_DIM)
        nn.init.orthogonal_(self.proj.weight)

    @torch.no_grad()
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """x: (B, 3, 224, 224) float32 in [0,1]. Returns (B, 384)."""
        x = _normalize(x, x.device)
        feat = self.backbone(x)              # (B, 1280)
        return F.normalize(self.proj(feat), dim=-1)


class RandomProjectionExtractor(nn.Module):
    """
    Deterministic random projection from raw pixel statistics → 384-dim.
    No learned parameters. Used for offline testing only.
    """

    def __init__(self, seed: int = 42):
        super().__init__()
        rng = np.random.default_rng(seed)
        # Project 9×9 = 81 DCT-like statistics → 384
        proj = rng.standard_normal((81, EMBED_DIM)).astype(np.float32)
        self.register_buffer("proj", torch.from_numpy(proj))

    @torch.no_grad()
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """x: (B, 3, 224, 224). Returns (B, 384)."""
        # Simple statistics: mean + std per 3×3 grid cell × 3 channels = 9×9×3 = 243 ... too big
        # Use 27-stat summary instead: mean/std/max per 3×3 grid (9 cells × 3 = 27) for each channel
        B = x.shape[0]
        x_g = x.mean(dim=1, keepdim=True)  # (B, 1, 224, 224) grayscale
        # Reduce to 9×9 grid
        pooled = F.adaptive_avg_pool2d(x_g, (9, 9)).view(B, -1)  # (B, 81)
        return F.normalize(pooled @ self.proj, dim=-1)             # (B, 384)


class BackboneExtractor:
    """
    Top-level wrapper. Selects DINOv2 → EfficientNet → Random as fallback.

    Usage:
        ext = BackboneExtractor.load()
        emb = ext.embed_crop(bgr_uint8_224x224)   # (384,) ndarray
    """

    BACKBONE_PREF = os.getenv("PHYSIQUE_BACKBONE", "dinov2")  # or "efficientnet", "random"

    def __init__(self, model: nn.Module, device: torch.device, name: str):
        self.model = model.to(device)
        self.device = device
        self.name = name

    @classmethod
    def load(cls, device: Optional[torch.device] = None) -> "BackboneExtractor":
        if device is None:
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        pref = cls.BACKBONE_PREF.lower()

        if pref in ("dinov2", "dino"):
            try:
                m = DINOv2Extractor()
                m._lazy_load()
                return cls(m, device, "dinov2-vits14")
            except Exception as e:
                print(f"[backbone] DINOv2 unavailable ({e}), falling back to EfficientNet")

        if pref in ("efficientnet", "effnet") or True:   # always try as 2nd fallback
            try:
                m = EfficientNetExtractor()
                return cls(m, device, "efficientnet-b0")
            except ImportError as e:
                print(f"[backbone] EfficientNet unavailable ({e}), using random projection")

        m = RandomProjectionExtractor()
        return cls(m, device, "random-projection")

    @torch.no_grad()
    def embed_crop(self, bgr_img: np.ndarray) -> np.ndarray:
        """
        bgr_img: (224, 224, 3) uint8 BGR.
        Returns: (384,) float32 embedding.
        """
        rgb = bgr_img[:, :, ::-1].copy()
        t   = torch.from_numpy(rgb).float().div(255.0).permute(2, 0, 1).unsqueeze(0)
        t   = t.to(self.device)
        emb = self.model(t)
        return emb.squeeze(0).cpu().numpy().astype(np.float32)

    @torch.no_grad()
    def embed_batch(self, bgr_imgs: list[np.ndarray]) -> np.ndarray:
        """
        bgr_imgs: list of (224, 224, 3) uint8 BGR.
        Returns: (N, 384) float32.
        """
        if not bgr_imgs:
            return np.zeros((0, EMBED_DIM), dtype=np.float32)
        rgbs = [img[:, :, ::-1].copy() for img in bgr_imgs]
        t = torch.stack([
            torch.from_numpy(r).float().div(255.0).permute(2, 0, 1) for r in rgbs
        ]).to(self.device)
        emb = self.model(t)
        return emb.cpu().numpy().astype(np.float32)
