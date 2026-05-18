"""
POST /analyze-body
Receives base64 images → runs CV pipeline → returns RawMeasurementResponse.

The response is identical in schema to what the Supabase Edge Function
(callAnalyze) returns, so the existing TypeScript parseMeasurements() works
without any changes.
"""
from __future__ import annotations
import uuid
import time
import numpy as np
from fastapi import APIRouter, HTTPException, status

from app.schema import AnalyzeRequest, AnalyzeResponse, RawMeasurementResponse
from pipeline.preprocessor import preprocess
from pipeline.pose_estimator import extract_pose_features
from pipeline.segmenter import extract_segmentation_features
from pipeline.feature_extractor import (
    build_feature_vector, feature_vector_to_numpy, aggregate_multi_image_features,
)
from models.measurement_model import predictions_to_dict, heuristic_from_features
from models.registry import get_model

router = APIRouter()

_MODEL_VERSION = "cv-v1"


@router.post("/analyze-body", response_model=AnalyzeResponse)
async def analyze_body(req: AnalyzeRequest) -> AnalyzeResponse:
    scan_id = req.scan_id or str(uuid.uuid4())
    t0 = time.time()

    # ── 1. Preprocess + extract features from each image ─────────────────────
    per_image_features = []
    pose_types_seen = []

    for b64 in req.image_base64s:
        try:
            img = preprocess(b64)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Image decode failed: {e}")

        pose = extract_pose_features(img)
        seg = extract_segmentation_features(img)
        fv = build_feature_vector(pose, seg)
        per_image_features.append(feature_vector_to_numpy(fv))
        pose_types_seen.append(pose.pose_type)

    if not per_image_features:
        raise HTTPException(status_code=422, detail="No processable images provided")

    # ── 2. Aggregate features across multiple images ─────────────────────────
    agg_features = aggregate_multi_image_features(per_image_features)

    # Determine dominant pose type
    pose_priority = ["mixed", "back", "side", "front", "unknown"]
    pose_type = "front"
    for pt in pose_priority:
        if pt in pose_types_seen:
            pose_type = pt
            break
    if len(set(pose_types_seen)) > 1:
        pose_type = "mixed"

    # ── 3. Predict measurements with trained model ─────────────────────────────
    model = get_model()
    confidence = 0.0

    if model is not None:
        try:
            pred = model.predict(agg_features.reshape(1, -1))[0]
            raw_dict = predictions_to_dict(pred, pose_type)
            # Confidence: mean landmark visibility (proxy for prediction quality)
            landmark_vis_idx = 23  # landmark_visibility_mean in FEATURE_NAMES
            confidence = float(np.clip(agg_features[landmark_vis_idx], 0, 1))
        except Exception as e:
            # Fall back to heuristics if model fails (should not happen in prod)
            print(f"[analyze] Model prediction failed: {e}, using heuristics")
            model = None

    if model is None:
        fv_dict = {
            "shoulder_to_waist_sil": float(agg_features[30]),
            "silhouette_shoulder_width": float(agg_features[27]),
            "silhouette_waist_width": float(agg_features[28]),
            "silhouette_hip_width": float(agg_features[29]),
            "arm_length_symmetry": float(agg_features[8]),
            "leg_length_symmetry": float(agg_features[11]),
            "arm_width_symmetry": float(agg_features[39]),
            "shoulder_tilt_deg": float(agg_features[12]),
            "spine_angle_deg": float(agg_features[14]),
            "v_taper_raw": float(agg_features[32]),
            "edge_density_upper": float(agg_features[47]),
            "contour_irregularity": float(agg_features[36]),
            "body_brightness_mean": float(agg_features[46]),
            "pose_type_encoded": int(agg_features[49]),
        }
        raw_dict = heuristic_from_features(fv_dict)
        confidence = 0.5  # Lower confidence for heuristic path

    # ── 4. Build response ─────────────────────────────────────────────────────
    try:
        measurements = RawMeasurementResponse(**raw_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Response assembly failed: {e}")

    elapsed_ms = int((time.time() - t0) * 1000)
    print(f"[analyze] scan={scan_id} pose={pose_type} "
          f"conf={confidence:.2f} elapsed={elapsed_ms}ms "
          f"model={'ml' if model else 'heuristic'}")

    return AnalyzeResponse(
        scan_id=scan_id,
        raw_measurements=measurements,
        confidence=round(confidence, 3),
        model_version=_MODEL_VERSION,
    )
