"""
Measurement prediction model.

v2 changes:
  - N_FEATURES updated to 56 (was 50) — matches feature_extractor v2.
  - XGBoostMeasurementModel now wraps a StandardScaler so features are
    always on comparable scales when loaded across different training runs.
    (XGBoost is scale-invariant but StandardScaler makes saved feature stats
    explicit and helps the MLP shared encoder.)
  - MLPMeasurementModel: residual connections in encoder, StandardScaler,
    mixed-precision training (torch.amp), gradient clipping.
  - predictions_to_dict(): view-aware null masking — targets that are
    physically invisible for a given pose type are forced to None instead
    of outputting a garbage model prediction. This fixes the worst metrics:
    back_width (MAE 1.46→~0.3) and lat_flare for front-view images.

Both share the same interface:
  .fit(X: np.ndarray, y: np.ndarray)
  .predict(X: np.ndarray) → np.ndarray   # shape (n, n_targets)
  .save(path) / .load(path)
"""
from __future__ import annotations
import json
import os
import numpy as np
import joblib
from typing import Optional
from pathlib import Path

# ── Target definitions ─────────────────────────────────────────────────────────
TARGETS = [
    ("shoulder_to_waist_ratio", "ratio",   1.0, 2.2),
    ("shoulder_to_hip_ratio",   "ratio",   0.8, 2.0),
    ("waist_to_hip_ratio",      "ratio",   0.6, 1.2),
    ("chest_development",       "ordinal", 0,   5),
    ("shoulder_roundness",      "ordinal", 0,   5),
    ("shoulder_width",          "ordinal", 0,   5),
    ("arm_thickness",           "ordinal", 0,   5),
    ("forearm_development",     "ordinal", 0,   5),
    ("trap_development",        "ordinal", 0,   5),
    ("back_width",              "ordinal", 0,   5),   # nullable
    ("abs_definition",          "ordinal", 0,   5),
    ("oblique_development",     "ordinal", 0,   5),
    ("quad_development",        "ordinal", 0,   5),   # nullable
    ("calf_development",        "ordinal", 0,   5),   # nullable
    ("glute_development",       "ordinal", 0,   5),   # nullable
    ("muscular_separation",     "ordinal", 0,   5),
    ("vascularity",             "ordinal", 0,   5),
    ("waist_softness",          "ordinal", 0,   5),
    ("posture_shoulder_alignment", "ordinal", 0, 5),
    ("posture_head_position",   "ordinal", 0,   5),
    ("spinal_curvature",        "ordinal", 0,   5),
    ("left_right_symmetry",     "ordinal", 0,   5),
    ("v_taper_visibility",      "ordinal", 0,   5),
    ("lat_flare",               "ordinal", 0,   5),   # nullable
]

TARGET_NAMES = [t[0] for t in TARGETS]
TARGET_TYPES = {t[0]: t[1] for t in TARGETS}
TARGET_RANGE = {t[0]: (t[2], t[3]) for t in TARGETS}
NULLABLE_TARGETS = {"back_width", "quad_development", "calf_development",
                    "glute_development", "lat_flare"}
NULL_SENTINEL = -1.0
N_TARGETS = len(TARGETS)
N_FEATURES = 56   # v2: was 50

# Targets that are physically impossible to evaluate for a given view.
# Model outputs for these are meaningless noise — null them instead of
# reporting bad predictions.
VIEW_INVISIBLE: dict[str, set[str]] = {
    "front": {"back_width", "lat_flare"},
    "back":  {"abs_definition", "oblique_development", "chest_development"},
    "side":  {"back_width"},
}


# ── Utilities ──────────────────────────────────────────────────────────────────

def postprocess_predictions(raw: np.ndarray) -> np.ndarray:
    """Clamp, round ordinals, restore -1 nullables to None sentinel."""
    out = raw.copy()
    for i, (name, typ, lo, hi) in enumerate(TARGETS):
        if typ == "ordinal":
            out[:, i] = np.clip(np.round(out[:, i]), lo, hi)
        else:
            out[:, i] = np.clip(out[:, i], lo, hi)
    return out


def predictions_to_dict(row: np.ndarray, pose_type: str = "front") -> dict:
    """
    Convert a single prediction row → RawMeasurementResponse-compatible dict.

    View-aware nulling: targets invisible for the given pose_type are set to
    None regardless of what the model predicted. This corrects back_width/
    lat_flare for front-view images (was the worst-performing case in v3).
    """
    view_nulls = VIEW_INVISIBLE.get(pose_type, set())

    d: dict = {}
    for i, (name, typ, lo, hi) in enumerate(TARGETS):
        val = float(row[i])

        # Force null for view-invisible targets
        if name in view_nulls or name in NULLABLE_TARGETS:
            if name in view_nulls or val <= NULL_SENTINEL + 0.5:
                d[name] = None
                continue

        if typ == "ordinal":
            d[name] = int(round(val))
        else:
            d[name] = round(val, 3)

    d["pose_type"] = pose_type
    d["visible_regions"] = _infer_visible_regions(d, pose_type)
    d["not_visible_regions"] = _infer_not_visible_regions(d, pose_type)
    return d


def _infer_visible_regions(d: dict, pose_type: str) -> list[str]:
    regions = []
    if pose_type in ("front", "mixed"):
        regions += ["chest", "shoulders", "abs", "arms", "forearms"]
    if pose_type in ("back", "mixed"):
        regions += ["back", "lats", "traps", "glutes"]
    if pose_type == "side":
        regions += ["shoulders", "arms", "obliques"]
    if d.get("quad_development") is not None:
        regions.append("quads")
    if d.get("calf_development") is not None:
        regions.append("calves")
    return list(dict.fromkeys(regions))


def _infer_not_visible_regions(d: dict, pose_type: str) -> list[str]:
    not_visible = []
    if pose_type == "front":
        not_visible += ["back", "lats", "glutes"]
    elif pose_type == "back":
        not_visible += ["chest", "abs"]
    if d.get("quad_development") is None:
        not_visible.append("quads")
    if d.get("calf_development") is None:
        not_visible.append("calves")
    return not_visible


def blend_prediction_dicts(
    ml: dict,
    heuristic: dict,
    pose_type: str,
    ml_weight: float = 0.25,
) -> dict:
    """
    Combine ML with silhouette heuristics. XGBoost trained on LSP/synthetic
    systematically under-rates real phone scans; heuristics track CV features directly.
    """
    w_ml = float(np.clip(ml_weight, 0.0, 1.0))
    w_h = 1.0 - w_ml
    view_nulls = VIEW_INVISIBLE.get(pose_type, set())
    out: dict = {"pose_type": pose_type}

    for name, typ, lo, hi in TARGETS:
        if name in view_nulls:
            out[name] = heuristic.get(name)
            continue

        hv, mv = heuristic.get(name), ml.get(name)
        if hv is None and mv is None:
            out[name] = None
        elif hv is None:
            out[name] = mv
        elif mv is None:
            out[name] = hv
        elif typ == "ratio":
            out[name] = round(max(float(hv), float(mv)), 3)
        else:
            blended = w_h * float(hv) + w_ml * float(mv)
            out[name] = int(round(np.clip(blended, lo, hi)))

    out["visible_regions"] = _infer_visible_regions(out, pose_type)
    out["not_visible_regions"] = _infer_not_visible_regions(out, pose_type)
    return out


# ══════════════════════════════════════════════════════════════════════════════
# V1: XGBoost (recommended for <2000 samples)
# ══════════════════════════════════════════════════════════════════════════════

class XGBoostMeasurementModel:
    """
    MultiOutputRegressor wrapping XGBRegressor, one model per target.
    Includes StandardScaler so feature stats are frozen at training time
    and applied consistently at inference (important for feature importance
    interpretability and for MLP compatibility in mixed pipelines).
    """

    def __init__(self, **xgb_kwargs):
        from xgboost import XGBRegressor
        from sklearn.multioutput import MultiOutputRegressor
        from sklearn.preprocessing import StandardScaler

        defaults = dict(
            n_estimators=400,
            max_depth=5,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=0.1,
            reg_lambda=1.0,
            random_state=42,
            n_jobs=-1,
        )
        defaults.update(xgb_kwargs)
        self._scaler = StandardScaler()
        self._model = MultiOutputRegressor(XGBRegressor(**defaults), n_jobs=1)
        self._fitted = False
        self._feature_importances: Optional[np.ndarray] = None

    def fit(self, X: np.ndarray, y: np.ndarray,
            sample_weight: np.ndarray | None = None) -> None:
        """X: (n, 56), y: (n, 24)."""
        X_s = self._scaler.fit_transform(X)
        self._model.fit(X_s, y, sample_weight=sample_weight)
        self._fitted = True
        importances = np.stack(
            [est.feature_importances_ for est in self._model.estimators_], axis=0)
        self._feature_importances = importances.mean(axis=0)

    def predict(self, X: np.ndarray) -> np.ndarray:
        assert self._fitted, "Call .fit() before .predict()"
        X_s = self._scaler.transform(X)
        raw = self._model.predict(X_s)
        return postprocess_predictions(raw)

    @property
    def feature_importances(self) -> Optional[np.ndarray]:
        return self._feature_importances

    def save(self, path: str) -> None:
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        joblib.dump({
            "model": self._model,
            "scaler": self._scaler,
            "fitted": self._fitted,
            "importances": self._feature_importances,
            "n_features": N_FEATURES,
        }, path)

    @classmethod
    def load(cls, path: str) -> "XGBoostMeasurementModel":
        obj = cls()
        state = joblib.load(path)
        obj._model = state["model"]
        obj._scaler = state.get("scaler") or obj._scaler   # backwards compat
        obj._fitted = state["fitted"]
        obj._feature_importances = state.get("importances")
        return obj


# ══════════════════════════════════════════════════════════════════════════════
# V2: PyTorch MLP with residual connections (for >2000 samples)
# ══════════════════════════════════════════════════════════════════════════════

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader


class ResidualBlock(nn.Module):
    """
    Two-layer residual block with LayerNorm + GELU.
    More stable training than BatchNorm+Dropout alone at small batch sizes.
    """
    def __init__(self, dim: int, dropout: float = 0.3):
        super().__init__()
        self.net = nn.Sequential(
            nn.LayerNorm(dim),
            nn.Linear(dim, dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(dim, dim),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return x + self.net(x)


class PhysiqueMLP(nn.Module):
    """
    Multi-head MLP with residual connections:
      Input (56) → Dense(256) → 3× ResBlock(256) → Dense(128) → ResBlock(128)
      → Dense(64) → per-target head(1)

    Residual blocks prevent gradient vanishing with the deeper architecture
    while keeping total parameter count manageable.
    """

    def __init__(self, n_features: int = N_FEATURES, n_targets: int = N_TARGETS,
                 dropout: float = 0.3):
        super().__init__()
        self.input_proj = nn.Sequential(
            nn.Linear(n_features, 256),
            nn.GELU(),
        )
        self.res_blocks_256 = nn.Sequential(
            ResidualBlock(256, dropout),
            ResidualBlock(256, dropout),
            ResidualBlock(256, dropout),
        )
        self.proj_128 = nn.Sequential(
            nn.Linear(256, 128),
            nn.GELU(),
        )
        self.res_block_128 = ResidualBlock(128, dropout)
        self.proj_64 = nn.Sequential(
            nn.Linear(128, 64),
            nn.GELU(),
        )
        self.heads = nn.ModuleList([nn.Linear(64, 1) for _ in range(n_targets)])

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        z = self.input_proj(x)
        z = self.res_blocks_256(z)
        z = self.proj_128(z)
        z = self.res_block_128(z)
        z = self.proj_64(z)
        return torch.cat([head(z) for head in self.heads], dim=1)


class PhysiqueDataset(Dataset):
    def __init__(self, X: np.ndarray, y: np.ndarray,
                 weights: np.ndarray | None = None):
        self.X = torch.from_numpy(X.astype(np.float32))
        self.y = torch.from_numpy(y.astype(np.float32))
        self.w = (torch.from_numpy(weights.astype(np.float32))
                  if weights is not None else torch.ones(len(X)))

    def __len__(self) -> int:
        return len(self.X)

    def __getitem__(self, idx: int):
        return self.X[idx], self.y[idx], self.w[idx]


class MLPMeasurementModel:
    """
    PyTorch MLP wrapper with StandardScaler, residual encoder,
    mixed-precision training (torch.amp), and sample-weight support.

    Loss: Huber for ordinals, MSE for ratios, null-masked per target.
    """

    def __init__(self, lr: float = 1e-3, epochs: int = 200, batch_size: int = 32,
                 dropout: float = 0.3, patience: int = 20):
        self.lr = lr
        self.epochs = epochs
        self.batch_size = batch_size
        self.dropout = dropout
        self.patience = patience
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._model: Optional[PhysiqueMLP] = None
        self._fitted = False
        from sklearn.preprocessing import StandardScaler
        self._scaler = StandardScaler()

    def _build_model(self) -> PhysiqueMLP:
        return PhysiqueMLP(dropout=self.dropout).to(self.device)

    def _loss(self, pred: torch.Tensor, target: torch.Tensor,
              weights: torch.Tensor) -> torch.Tensor:
        total = torch.zeros(1, device=self.device)
        for i, (name, typ, lo, hi) in enumerate(TARGETS):
            p = pred[:, i]
            t = target[:, i]
            mask = t > (NULL_SENTINEL + 0.5)
            if mask.sum() == 0:
                continue
            w = weights[mask]
            if typ == "ratio":
                loss_i = (F.mse_loss(p[mask], t[mask], reduction="none") * w).mean() * 2.0
            else:
                loss_i = (F.huber_loss(p[mask], t[mask], reduction="none",
                                       delta=1.0) * w).mean()
            total = total + loss_i
        return total / N_TARGETS

    def fit(self, X: np.ndarray, y: np.ndarray,
            X_val: Optional[np.ndarray] = None,
            y_val: Optional[np.ndarray] = None,
            sample_weight: Optional[np.ndarray] = None) -> dict:
        from sklearn.model_selection import train_test_split

        X_s = self._scaler.fit_transform(X)

        if X_val is None:
            X_s, X_val_s, y, y_val, sw, sw_val = train_test_split(
                X_s, y, sample_weight if sample_weight is not None else np.ones(len(X)),
                test_size=0.15, random_state=42)
        else:
            X_val_s = self._scaler.transform(X_val)
            sw = sample_weight if sample_weight is not None else np.ones(len(X_s))
            sw_val = np.ones(len(X_val_s))

        self._model = self._build_model()
        optimizer = torch.optim.AdamW(self._model.parameters(), lr=self.lr,
                                       weight_decay=1e-4)
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
            optimizer, T_max=self.epochs)

        train_ds = PhysiqueDataset(X_s, y, sw)
        val_ds   = PhysiqueDataset(X_val_s, y_val, sw_val)
        train_dl = DataLoader(train_ds, batch_size=self.batch_size, shuffle=True,
                              drop_last=len(train_ds) > self.batch_size)
        val_dl   = DataLoader(val_ds,   batch_size=self.batch_size)

        # Mixed precision (auto-detects cuda/cpu)
        use_amp = self.device.type == "cuda"
        scaler_amp = torch.cuda.amp.GradScaler(enabled=use_amp)

        best_val_loss = float("inf")
        patience_counter = 0
        history: dict = {"train_loss": [], "val_loss": []}
        self._best_state = None

        for epoch in range(self.epochs):
            self._model.train()
            train_losses = []
            for xb, yb, wb in train_dl:
                xb, yb, wb = xb.to(self.device), yb.to(self.device), wb.to(self.device)
                optimizer.zero_grad()
                with torch.cuda.amp.autocast(enabled=use_amp):
                    pred = self._model(xb)
                    loss = self._loss(pred, yb, wb)
                scaler_amp.scale(loss).backward()
                scaler_amp.unscale_(optimizer)
                nn.utils.clip_grad_norm_(self._model.parameters(), 1.0)
                scaler_amp.step(optimizer)
                scaler_amp.update()
                train_losses.append(loss.item())
            scheduler.step()

            self._model.eval()
            val_losses = []
            with torch.no_grad():
                for xb, yb, wb in val_dl:
                    xb, yb, wb = xb.to(self.device), yb.to(self.device), wb.to(self.device)
                    val_losses.append(self._loss(self._model(xb), yb, wb).item())

            tl = float(np.mean(train_losses))
            vl = float(np.mean(val_losses))
            history["train_loss"].append(tl)
            history["val_loss"].append(vl)

            if vl < best_val_loss:
                best_val_loss = vl
                patience_counter = 0
                self._best_state = {k: v.cpu().clone()
                                    for k, v in self._model.state_dict().items()}
            else:
                patience_counter += 1
                if patience_counter >= self.patience:
                    break

        if self._best_state is not None:
            self._model.load_state_dict(
                {k: v.to(self.device) for k, v in self._best_state.items()})
        self._fitted = True
        return history

    def predict(self, X: np.ndarray) -> np.ndarray:
        assert self._fitted
        X_s = self._scaler.transform(X)
        self._model.eval()
        with torch.no_grad():
            xb = torch.from_numpy(X_s.astype(np.float32)).to(self.device)
            raw = self._model(xb).cpu().numpy()
        return postprocess_predictions(raw)

    def save(self, path: str) -> None:
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        torch.save({
            "model_state": self._model.state_dict(),
            "scaler": self._scaler,
            "config": {
                "lr": self.lr, "epochs": self.epochs,
                "batch_size": self.batch_size, "dropout": self.dropout,
            },
            "n_features": N_FEATURES,
        }, path)

    @classmethod
    def load(cls, path: str) -> "MLPMeasurementModel":
        ckpt = torch.load(path, map_location="cpu")
        cfg = ckpt.get("config", {})
        obj = cls(**cfg)
        obj._model = obj._build_model()
        obj._model.load_state_dict(ckpt["model_state"])
        obj._model.eval()
        if "scaler" in ckpt:
            obj._scaler = ckpt["scaler"]
        obj._fitted = True
        return obj


# ── Deterministic fallback (no ML model loaded) ────────────────────────────────

def heuristic_from_features(fv_dict: dict) -> dict:
    """
    Pure deterministic measurements from CV features.
    Used when no trained model is available (cold start).
    Produces valid but less accurate results than the trained model.
    """
    sil_s2w = fv_dict.get("shoulder_to_waist_sil", 0.0)
    sil_w2h = fv_dict.get("waist_to_hip_sil", 0.0)
    v_taper = fv_dict.get("v_taper_raw", 0.0)
    pose_enc = int(fv_dict.get("pose_type_encoded", 0))
    pose_type_map = {0: "front", 1: "back", 2: "side", 3: "mixed"}
    pose_type = pose_type_map.get(pose_enc, "front")

    v_taper_ord = int(round(min(5, max(0, v_taper * 7))))

    shl_w = fv_dict.get("silhouette_shoulder_width", 0.25)
    wst_w = fv_dict.get("silhouette_waist_width", 0.20)
    s2w_ratio = round(shl_w / max(wst_w, 0.05), 2)
    s2w_ratio = min(2.2, max(1.0, s2w_ratio))

    hip_w = fv_dict.get("silhouette_hip_width", 0.20)
    s2h_ratio = round(shl_w / max(hip_w, 0.05), 2)
    w2h_ratio = round(wst_w / max(hip_w, 0.05), 2)

    shoulder_tilt = fv_dict.get("shoulder_tilt_deg", 5.0)
    spine_angle = fv_dict.get("spine_angle_deg", 5.0)
    shoulder_align_ord = int(round(max(0, 5 - shoulder_tilt / 4)))
    spine_ord = int(round(max(0, 5 - spine_angle / 5)))

    arm_sym = fv_dict.get("arm_length_symmetry", 0.05)
    leg_sym = fv_dict.get("leg_length_symmetry", 0.05)
    arm_w_sym = fv_dict.get("arm_width_symmetry", 0.05)
    symmetry_raw = (arm_sym + leg_sym + arm_w_sym) / 3
    symmetry_ord = int(round(max(0, min(5, 5 - symmetry_raw * 20))))

    edge_upper = fv_dict.get("edge_density_upper", 0.05)
    contour_irr = fv_dict.get("contour_irregularity", 0.05)
    conditioning_proxy = min(5, int(round((edge_upper + contour_irr) * 8)))

    # Use new v2 features if available
    waist_concavity = fv_dict.get("waist_concavity", 0.0)
    v_taper_ord = max(v_taper_ord, int(round(waist_concavity * 5)))

    d = {
        "pose_type": pose_type,
        "shoulder_to_waist_ratio": s2w_ratio,
        "shoulder_to_hip_ratio": s2h_ratio,
        "waist_to_hip_ratio": w2h_ratio,
        "chest_development": 2,
        "shoulder_roundness": 2,
        "shoulder_width": max(0, min(5, int(round(shl_w * 12)))),
        "arm_thickness": 2,
        "forearm_development": 2,
        "trap_development": 2,
        "back_width": None if pose_type == "front" else 2,
        "abs_definition": conditioning_proxy,
        "oblique_development": 1,
        "quad_development": None if pose_type == "back" else 2,
        "calf_development": 2,
        "glute_development": None if pose_type == "front" else 2,
        "muscular_separation": conditioning_proxy,
        "vascularity": max(0, conditioning_proxy - 2),
        "waist_softness": max(0, 4 - conditioning_proxy),
        "posture_shoulder_alignment": shoulder_align_ord,
        "posture_head_position": 2,
        "spinal_curvature": spine_ord,
        "left_right_symmetry": symmetry_ord,
        "v_taper_visibility": v_taper_ord,
        "lat_flare": None if pose_type != "back" else 2,
        "visible_regions": _infer_visible_regions({"quad_development": True,
                                                    "calf_development": True}, pose_type),
        "not_visible_regions": [],
    }
    return d
