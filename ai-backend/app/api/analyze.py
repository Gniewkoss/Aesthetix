"""
POST /analyze-body
Receives base64 images → runs CV pipeline → returns RawMeasurementResponse.

v2 pipeline:
  1. preprocess_with_alignment():
       decode → resize → CLAHE → pose estimate →
       align shoulders to horizontal → re-run pose →
       optional background removal
  2. extract_segmentation_features(img, pose):
       landmark-guided width measurements (no more fixed body fractions)
  3. Aggregate across multiple images (smart multi-view handling)
  4. ML model or heuristic fallback
"""
from __future__ import annotations
import os
import uuid
import time
import numpy as np
from fastapi import APIRouter, HTTPException, status

from app.schema import AnalyzeRequest, AnalyzeResponse, RawMeasurementResponse
from pipeline.preprocessor import preprocess_with_alignment
from pipeline.segmenter import extract_segmentation_features
from pipeline.feature_extractor import (
    build_feature_vector, feature_vector_to_numpy, aggregate_multi_image_features,
    FEATURE_NAMES,
)
from models.measurement_model import (
    predictions_to_dict,
    heuristic_from_features,
    blend_prediction_dicts,
    N_FEATURES,
)
from models.registry import get_model

router = APIRouter()

_MODEL_VERSION = "cv-v2"

# Index of landmark_visibility_mean in FEATURE_NAMES (used for confidence)
_VIS_IDX = FEATURE_NAMES.index("landmark_visibility_mean")


@router.post("/analyze-body", response_model=AnalyzeResponse)
async def analyze_body(req: AnalyzeRequest) -> AnalyzeResponse:
    scan_id = req.scan_id or str(uuid.uuid4())
    t0 = time.time()

    # ── 1. Preprocess + extract features from each image ─────────────────────
    per_image_features = []
    pose_types_seen = []
    confidence_vals = []

    for b64 in req.image_base64s:
        try:
            # v2: pose-aligned + optional background removal in one call
            img, pose = preprocess_with_alignment(b64, remove_bg=True)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Image decode failed: {e}")

        # Landmark-guided segmentation (passes pose so widths are anatomically correct)
        seg = extract_segmentation_features(img, pose)
        fv = build_feature_vector(pose, seg)
        arr = feature_vector_to_numpy(fv)
        per_image_features.append(arr)
        pose_types_seen.append(pose.pose_type)
        confidence_vals.append(float(pose.landmark_visibility_mean))

    if not per_image_features:
        raise HTTPException(status_code=422, detail="No processable images provided")

    # ── 2. Aggregate features across multiple images ─────────────────────────
    agg_features = aggregate_multi_image_features(per_image_features, pose_types_seen)

    # Determine dominant pose type
    pose_priority = ["mixed", "back", "side", "front", "unknown"]
    pose_type = "front"
    for pt in pose_priority:
        if pt in pose_types_seen:
            pose_type = pt
            break
    if len(set(pose_types_seen)) > 1:
        pose_type = "mixed"

    # Confidence: mean landmark visibility across images
    confidence = float(np.mean(confidence_vals)) if confidence_vals else 0.0

    # ── 3. Predict measurements (heuristic + optional ML blend) ───────────────
    fv_dict = {name: float(agg_features[i]) for i, name in enumerate(FEATURE_NAMES)}
    heur_dict = heuristic_from_features(fv_dict)
    use_heuristic_only = os.getenv("ANALYZE_HEURISTIC_ONLY", "").lower() in (
        "1", "true", "yes",
    )
    ml_weight = float(os.getenv("ANALYZE_ML_BLEND_WEIGHT", "0.65"))
    debug = os.getenv("ANALYZE_DEBUG", "").lower() in ("1", "true", "yes")
    model = get_model()
    model_mode = "heuristic"

    # Debug: log key CV features so we can diagnose bad results
    if debug:
        seg_detected = bool(fv_dict.get("body_mask_area_norm", 0) > 0.01)
        print(f"[debug] seg_detected={seg_detected} "
              f"sil_shl={fv_dict.get('silhouette_shoulder_width', 0):.3f} "
              f"sil_wst={fv_dict.get('silhouette_waist_width', 0):.3f} "
              f"sil_hip={fv_dict.get('silhouette_hip_width', 0):.3f} "
              f"waist_conc={fv_dict.get('waist_concavity', 0):.3f} "
              f"v_taper={fv_dict.get('v_taper_raw', 0):.3f} "
              f"edge_u={fv_dict.get('edge_density_upper', 0):.3f} "
              f"arm_w={(fv_dict.get('upper_arm_width_left',0)+fv_dict.get('upper_arm_width_right',0))/2:.3f}")
        print(f"[debug] heur abs={heur_dict.get('abs_definition')} "
              f"v_taper={heur_dict.get('v_taper_visibility')} "
              f"shl_w={heur_dict.get('shoulder_width')} "
              f"s2w={heur_dict.get('shoulder_to_waist_ratio')}")

    if model is not None and not use_heuristic_only:
        try:
            n_feat = agg_features.shape[0]
            if n_feat != N_FEATURES:
                raise ValueError(
                    f"Feature count mismatch: pipeline={n_feat}, "
                    f"model expects {N_FEATURES}. Retrain the model."
                )
            pred = model.predict(agg_features.reshape(1, -1))[0]
            ml_dict = predictions_to_dict(pred, pose_type)
            if debug:
                print(f"[debug] ml   abs={ml_dict.get('abs_definition')} "
                      f"v_taper={ml_dict.get('v_taper_visibility')} "
                      f"shl_w={ml_dict.get('shoulder_width')} "
                      f"s2w={ml_dict.get('shoulder_to_waist_ratio')}")
            raw_dict = blend_prediction_dicts(
                ml_dict, heur_dict, pose_type, ml_weight=ml_weight,
            )
            model_mode = "blend"
        except Exception as e:
            print(f"[analyze] Model prediction failed: {e}, using heuristics")
            raw_dict = heur_dict
            confidence = min(confidence, 0.5)
    else:
        raw_dict = heur_dict
        if model is not None and use_heuristic_only:
            model_mode = "heuristic-only"

    # ── 4. Build response ─────────────────────────────────────────────────────
    try:
        measurements = RawMeasurementResponse(**raw_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Response assembly failed: {e}")

    elapsed_ms = int((time.time() - t0) * 1000)
    print(f"[analyze] scan={scan_id} pose={pose_type} "
          f"conf={confidence:.2f} elapsed={elapsed_ms}ms "
          f"model={model_mode}")

    return AnalyzeResponse(
        scan_id=scan_id,
        raw_measurements=measurements,
        confidence=round(confidence, 3),
        model_version=_MODEL_VERSION,
    )
