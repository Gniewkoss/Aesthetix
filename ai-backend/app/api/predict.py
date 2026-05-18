"""
POST /predict-score
Direct inference from a pre-computed feature vector.
Used for debugging, A/B testing, and offline batch scoring.
"""
from __future__ import annotations
import numpy as np
from fastapi import APIRouter, HTTPException
from app.schema import PredictRequest, PredictResponse, RawMeasurementResponse
from models.measurement_model import predictions_to_dict
from models.registry import get_model
from pipeline.feature_extractor import feature_vector_to_numpy

router = APIRouter()


@router.post("/predict-score", response_model=PredictResponse)
async def predict_score(req: PredictRequest) -> PredictResponse:
    model = get_model()
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="No trained model available. POST /train-model first.",
        )

    features = feature_vector_to_numpy(req.features).reshape(1, -1)
    pose_type_map = {0: "front", 1: "back", 2: "side", 3: "mixed"}
    pose_type = pose_type_map.get(int(req.features.pose_type_encoded), "front")

    try:
        pred = model.predict(features)[0]
        raw_dict = predictions_to_dict(pred, pose_type)
        measurements = RawMeasurementResponse(**raw_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    landmark_vis = req.features.landmark_visibility_mean
    confidence = float(np.clip(landmark_vis, 0, 1))

    from models.registry import get_model as _gm, _registry
    version = _registry.get_active_version() or "unknown"

    return PredictResponse(
        raw_measurements=measurements,
        confidence=round(confidence, 3),
        model_version=version,
    )
