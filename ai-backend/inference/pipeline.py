"""
End-to-end multi-stage inference pipeline (v3).

Pipeline stages:
  1. Preprocess + alignment       (existing preprocessor)
  2. Pose estimation              (MediaPipe)
  3. Segmentation                 (YOLO / MediaPipe mask)
  4. Region cropping              (region_cropper.py)
  5. Backbone embedding           (DINOv2 / EfficientNet)
  6. Hand-crafted features        (region_features.py)
  7. Per-muscle head inference    (MuscleHeadEnsemble or heuristic)
  8. Ranking calibration          (optional, if ranking model loaded)
  9. Aggregation                  (AggregationModel or heuristic)
  10. Response assembly

Model loading strategy:
  - Models loaded lazily on first call (singleton per process)
  - Falls back gracefully at each stage if model files absent
  - Config via env vars: PHYSIQUE_MODEL_DIR, PHYSIQUE_BACKBONE
"""
from __future__ import annotations

import os
import time
from dataclasses import dataclass, field
from typing import Optional

import numpy as np
import torch

from pipeline.preprocessor import preprocess_with_alignment
from pipeline.segmenter import extract_segmentation_features
from pipeline.feature_extractor import (
    build_feature_vector, feature_vector_to_numpy, FEATURE_NAMES,
)
from pipeline.pose_estimator import PoseFeatures
from pipeline.region_cropper import crop_regions, RegionCropBundle
from pipeline.region_features import (
    extract_region_features, extract_symmetry_pair, FEATURE_DIM,
)
from models.backbones.dinov2_extractor import BackboneExtractor, EMBED_DIM
from models.muscle_heads.head_model import (
    MuscleHeadEnsemble, load_ensemble, mc_dropout_predict,
    MUSCLE_GROUPS, HEAD_INPUT_DIM, SCORE_MIN, SCORE_MAX,
)
from models.aggregation.aggregation_model import (
    PhysiqueResult,
    estimate_bf_heuristic,
    infer_training_level,
    compute_proportions_score,
    load_aggregation_model,
)

MODEL_DIR = os.getenv("PHYSIQUE_MODEL_DIR", "artifacts/models")
MC_SAMPLES = int(os.getenv("PHYSIQUE_MC_SAMPLES", "20"))
USE_NEW_PIPELINE = os.getenv("PHYSIQUE_V3_PIPELINE", "1").lower() not in ("0", "false", "no")


# ── Model registry (singletons, lazy-loaded) ──────────────────────────────────

_backbone: Optional[BackboneExtractor] = None
_muscle_heads: Optional[MuscleHeadEnsemble] = None
_device: Optional[torch.device] = None


def _get_device() -> torch.device:
    global _device
    if _device is None:
        _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    return _device


def _get_backbone() -> BackboneExtractor:
    global _backbone
    if _backbone is None:
        _backbone = BackboneExtractor.load(device=_get_device())
        print(f"[pipeline] Backbone loaded: {_backbone.name}")
    return _backbone


def _get_muscle_heads() -> Optional[MuscleHeadEnsemble]:
    global _muscle_heads
    if _muscle_heads is not None:
        return _muscle_heads
    path = os.path.join(MODEL_DIR, "muscle_heads.pt")
    if not os.path.exists(path):
        return None
    try:
        _muscle_heads = load_ensemble(path, device=_get_device())
        print(f"[pipeline] Muscle heads loaded from {path}")
    except Exception as e:
        print(f"[pipeline] Muscle heads failed to load ({e}), using heuristic")
    return _muscle_heads


# ── Region → feature vector ────────────────────────────────────────────────────

def _region_to_feature_vec(
    region_name: str,
    bundle: RegionCropBundle,
    backbone: BackboneExtractor,
) -> Optional[np.ndarray]:
    """
    Get the (EMBED_DIM + FEATURE_DIM = 416) feature vector for a named region.
    Returns None if the region is not visible.
    """
    crop_map = {
        "chest":     bundle.chest,
        "abs":       bundle.abs,
        "biceps":    bundle.left_bicep,   # use left; right checked for symmetry
        "triceps":   bundle.right_bicep,  # tricep region proxied via upper arm
        "shoulders": bundle.shoulders,
        "lats":      bundle.lats,
        "quads":     bundle.quads,
        "calves":    bundle.calves,
    }

    crop = crop_map.get(region_name)
    if crop is None or not crop.is_visible:
        return None

    backbone_emb = backbone.embed_crop(crop.image)             # (384,)
    hand_crafted = extract_region_features(crop)               # (32,)
    return np.concatenate([backbone_emb, hand_crafted])        # (416,)


# ── Heuristic muscle scores from existing v2 features ────────────────────────

def _heuristic_muscle_scores(
    fv_dict: dict,
    pose_type: str,
) -> tuple[dict[str, float], dict[str, float]]:
    """
    Fallback heuristic scores (0-10 scale) when muscle head models are absent.
    Derived from the existing 56-feature vector with improved formulas.
    """
    def clamp(v: float) -> float:
        return float(np.clip(v, SCORE_MIN, SCORE_MAX))

    edge_u   = fv_dict.get("edge_density_upper", 0.05)
    edge_l   = fv_dict.get("edge_density_lower", 0.05)
    contour  = fv_dict.get("contour_irregularity", 0.05)
    arm_w    = (fv_dict.get("upper_arm_width_left", 0.055) +
                fv_dict.get("upper_arm_width_right", 0.055)) / 2
    thigh_w  = (fv_dict.get("thigh_width_left", 0.08) +
                fv_dict.get("thigh_width_right", 0.08)) / 2
    chest_w  = fv_dict.get("chest_width_norm", 0.24)
    shl_w    = fv_dict.get("silhouette_shoulder_width", 0.28)
    wst_w    = fv_dict.get("silhouette_waist_width", 0.22)
    wst_conc = fv_dict.get("waist_concavity", 0.18)
    vtaper   = fv_dict.get("v_taper_raw", 0.35)
    calf_w   = fv_dict.get("calf_width_mean", 0.065)
    cond_g   = fv_dict.get("conditioning_gradient", 0.02)

    conditioning = min(10.0, (edge_u + contour) * 25.0 + cond_g * 8.0)
    separation   = min(10.0, (edge_u + edge_l) * 30.0)

    scores = {
        "chest":     clamp((chest_w - 0.18) * 60.0 + conditioning * 0.3),
        "abs":       clamp(wst_conc * 18.0 + conditioning * 0.4),
        "biceps":    clamp((arm_w - 0.04) * 130.0 + separation * 0.2),
        "triceps":   clamp((arm_w - 0.04) * 110.0 + edge_u * 12.0),
        "shoulders": clamp((shl_w - 0.22) * 70.0 + edge_u * 15.0),
        "lats":      clamp(vtaper * 15.0 + separation * 0.25)
                     if pose_type in ("back", "mixed") else 5.0,
        "quads":     clamp((thigh_w - 0.06) * 90.0 + edge_l * 12.0),
        "calves":    clamp((calf_w - 0.05) * 100.0 + edge_l * 10.0),
    }

    # uncertainty: fixed 2.0 for heuristic (no confidence model)
    uncertainties = {name: 2.0 for name in MUSCLE_GROUPS}
    return scores, uncertainties


# ── Main inference function ─────────────────────────────────────────────────

def run_pipeline(
    images_b64: list[str],
    metadata: Optional[dict] = None,   # {height_cm, weight_kg, age, sex}
    mc_samples: int = MC_SAMPLES,
    debug: bool = False,
) -> PhysiqueResult:
    """
    Full multi-stage inference. Accepts 1-3 base64 images (front/side/back).

    Returns a PhysiqueResult with all per-muscle scores, BF%, training level, etc.
    """
    t0 = time.time()
    metadata = metadata or {}

    per_image_data = []
    pose_types_seen = []

    for b64 in images_b64:
        try:
            img, pose = preprocess_with_alignment(b64, remove_bg=True)
        except Exception as e:
            if debug:
                print(f"[pipeline] Image decode failed: {e}")
            continue

        seg = extract_segmentation_features(img, pose)
        fv  = build_feature_vector(pose, seg)
        arr = feature_vector_to_numpy(fv)

        body_mask = None
        if pose.segmentation_mask is not None:
            body_mask = pose.segmentation_mask
        elif hasattr(seg, "_raw_mask"):
            body_mask = seg._raw_mask

        bundle = crop_regions(img, pose, body_mask=body_mask)

        per_image_data.append({
            "img":    img,
            "pose":   pose,
            "seg":    seg,
            "arr":    arr,
            "bundle": bundle,
            "fv_dict": {name: float(arr[i]) for i, name in enumerate(FEATURE_NAMES)},
        })
        pose_types_seen.append(pose.pose_type)

    if not per_image_data:
        return _empty_result()

    # Determine dominant pose type
    pose_priority = {"mixed": 4, "back": 3, "side": 2, "front": 1, "unknown": 0}
    if len(set(pose_types_seen)) > 1:
        pose_type = "mixed"
    else:
        pose_type = max(pose_types_seen, key=lambda pt: pose_priority.get(pt, 0))

    # Aggregate feature vectors (mean across views)
    all_arrs = [d["arr"] for d in per_image_data]
    agg_arr  = np.mean(np.stack(all_arrs, axis=0), axis=0).astype(np.float32)
    agg_fv   = {name: float(agg_arr[i]) for i, name in enumerate(FEATURE_NAMES)}

    # Confidence: mean landmark visibility
    confidence = float(np.mean([d["pose"].landmark_visibility_mean
                                for d in per_image_data]))

    # Pick best bundle (front view preferred for most muscles)
    best_data = max(per_image_data,
                    key=lambda d: len(d["bundle"].visible_regions()))

    # ── Stage 5-6: Backbone embedding + per-region features ────────────────
    backbone = _get_backbone()
    muscle_heads = _get_muscle_heads()

    if muscle_heads is not None and USE_NEW_PIPELINE:
        scores, uncertainties = _nn_muscle_scores(
            best_data["bundle"], backbone, muscle_heads,
            mc_samples=mc_samples, device=_get_device(),
        )
    else:
        scores, uncertainties = _heuristic_muscle_scores(agg_fv, pose_type)

    # ── Symmetry score ────────────────────────────────────────────────────
    bundle = best_data["bundle"]
    sym_score = extract_symmetry_pair(bundle.left_bicep, bundle.right_bicep) \
                if (bundle.left_bicep and bundle.right_bicep) else 0.9

    # ── Body fat estimation ───────────────────────────────────────────────
    bf_mean, bf_low, bf_high, bf_conf = estimate_bf_heuristic(
        v_taper=agg_fv.get("v_taper_raw", 0.35),
        waist_concavity=agg_fv.get("waist_concavity", 0.18),
        conditioning_gradient=agg_fv.get("conditioning_gradient", 0.02),
        muscular_separation=float(scores.get("abs", 5.0)),
        waist_softness=max(0, 5.0 - float(scores.get("abs", 5.0)) * 0.5),
        edge_density_upper=agg_fv.get("edge_density_upper", 0.05),
        height_cm=metadata.get("height_cm"),
        weight_kg=metadata.get("weight_kg"),
        age=metadata.get("age"),
        sex=metadata.get("sex", "male"),
    )

    # ── Training level ────────────────────────────────────────────────────
    training_level, level_probs = infer_training_level(scores, bf_mean)

    # ── Proportions score ──────────────────────────────────────────────────
    s2w = agg_fv.get("shoulder_to_waist_sil",
                     agg_fv.get("shoulder_width_norm", 0.28) /
                     max(0.01, agg_fv.get("silhouette_waist_width", 0.22)))
    proportions = compute_proportions_score(scores, s2w, sym_score)

    # ── Overall physique score ────────────────────────────────────────────
    valid_scores = [v for v in scores.values() if v is not None]
    overall = float(np.mean(valid_scores)) if valid_scores else 5.0

    visible_regions = best_data["bundle"].visible_regions()

    elapsed = round((time.time() - t0) * 1000)
    if debug:
        print(f"[pipeline] elapsed={elapsed}ms pose={pose_type} "
              f"conf={confidence:.2f} backbone={backbone.name} "
              f"heads={'nn' if muscle_heads else 'heuristic'}")

    return PhysiqueResult(
        muscle_scores=scores,
        muscle_uncertainties=uncertainties,
        overall_score=round(overall, 2),
        overall_confidence=round(confidence, 3),
        bf_pct_mean=bf_mean,
        bf_pct_low=bf_low,
        bf_pct_high=bf_high,
        bf_confidence=bf_conf,
        training_level=training_level,
        training_level_probs=level_probs,
        proportions_score=proportions,
        symmetry_score=round(sym_score, 3),
        pose_type=pose_type,
        visible_regions=visible_regions,
    )


def _nn_muscle_scores(
    bundle: RegionCropBundle,
    backbone: BackboneExtractor,
    heads: MuscleHeadEnsemble,
    mc_samples: int,
    device: torch.device,
) -> tuple[dict[str, float], dict[str, float]]:
    """Run neural network heads with MC dropout uncertainty."""
    scores = {}
    uncertainties = {}

    for muscle in MUSCLE_GROUPS:
        feat = _region_to_feature_vec(muscle, bundle, backbone)
        if feat is None:
            scores[muscle] = 5.0      # unknown → neutral
            uncertainties[muscle] = 3.0
            continue

        x = torch.from_numpy(feat).float().unsqueeze(0).to(device)
        head = heads.heads.get(muscle)
        if head is None:
            scores[muscle] = 5.0
            uncertainties[muscle] = 3.0
            continue

        score, aleat, epist = mc_dropout_predict(head, x, n_samples=mc_samples)
        scores[muscle] = round(score, 2)
        # Total uncertainty: combine aleatoric + epistemic
        uncertainties[muscle] = round(float(np.sqrt(aleat**2 + epist**2)), 2)

    return scores, uncertainties


def _empty_result() -> PhysiqueResult:
    neutral_scores = {m: 5.0 for m in MUSCLE_GROUPS}
    neutral_unc    = {m: 5.0 for m in MUSCLE_GROUPS}
    return PhysiqueResult(
        muscle_scores=neutral_scores,
        muscle_uncertainties=neutral_unc,
        overall_score=5.0,
        overall_confidence=0.0,
        bf_pct_mean=20.0,
        bf_pct_low=15.0,
        bf_pct_high=25.0,
        bf_confidence=0.0,
        training_level=2,
        training_level_probs=[0.1, 0.6, 0.2, 0.07, 0.03],
        proportions_score=5.0,
        symmetry_score=1.0,
        pose_type="unknown",
        visible_regions=[],
    )
