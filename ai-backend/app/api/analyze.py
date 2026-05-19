"""
POST /analyze-body
Receives base64 images → runs CV pipeline → returns RawMeasurementResponse.

v3 pipeline (default when PHYSIQUE_V3_PIPELINE=1):
  1. preprocess_with_alignment() — pose + alignment
  2. Region cropping (region_cropper.py) — 9 anatomical regions
  3. DINOv2/EfficientNet backbone embedding per region
  4. Hand-crafted features per region (edge, texture, vascularity)
  5. Per-muscle head inference with MC-dropout uncertainty
  6. Aggregation → overall score, BF%, training level
  Response includes both legacy raw_measurements AND new v3 fields.

v2 pipeline (PHYSIQUE_V3_PIPELINE=0):
  Landmark-guided segmentation → 56-feature vector → XGBoost/MLP blend
"""
from __future__ import annotations
import os
import uuid
import time
import numpy as np
from fastapi import APIRouter, HTTPException, status

from app.schema import (
    AnalyzeRequest, AnalyzeResponse, RawMeasurementResponse,
    V3Analysis, MuscleScores, MuscleUncertainties, BodyFatEstimate,
)

router = APIRouter()

_USE_V3 = os.getenv("PHYSIQUE_V3_PIPELINE", "1").lower() not in ("0", "false", "no")
_DEBUG  = os.getenv("ANALYZE_DEBUG", "").lower() in ("1", "true", "yes")


@router.post("/analyze-body", response_model=AnalyzeResponse)
async def analyze_body(req: AnalyzeRequest) -> AnalyzeResponse:
    scan_id = req.scan_id or str(uuid.uuid4())
    t0 = time.time()

    if _USE_V3:
        return await _analyze_v3(req, scan_id, t0)
    else:
        return await _analyze_v2(req, scan_id, t0)


# ── V3: Multi-stage pipeline ──────────────────────────────────────────────────

async def _analyze_v3(
    req: AnalyzeRequest,
    scan_id: str,
    t0: float,
) -> AnalyzeResponse:
    from inference.pipeline import run_pipeline
    from models.aggregation.aggregation_model import MUSCLE_GROUPS

    try:
        result = run_pipeline(
            images_b64=req.image_base64s,
            metadata=req.metadata,
            debug=_DEBUG,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"V3 pipeline failed: {e}")

    # ── Build legacy RawMeasurementResponse (backward compat) ─────────────
    raw = _v3_result_to_raw(result)

    # ── Build v3 extended response ─────────────────────────────────────────
    bf_low  = result.bf_pct_low
    bf_high = result.bf_pct_high
    bf_disp = f"{bf_low:.0f}–{bf_high:.0f}%"

    v3 = V3Analysis(
        muscle_scores=MuscleScores(**{
            k: result.muscle_scores.get(k) for k in MuscleScores.model_fields
        }),
        muscle_uncertainties=MuscleUncertainties(**{
            k: result.muscle_uncertainties.get(k) for k in MuscleUncertainties.model_fields
        }),
        body_fat=BodyFatEstimate(
            mean=result.bf_pct_mean,
            low=bf_low,
            high=bf_high,
            confidence=result.bf_confidence,
            display=bf_disp,
        ),
        training_level=result.training_level,
        training_level_probs=result.training_level_probs,
        overall_score=result.overall_score,
        proportions_score=result.proportions_score,
        symmetry_score=result.symmetry_score,
    )

    elapsed_ms = int((time.time() - t0) * 1000)
    if _DEBUG:
        print(f"[analyze-v3] scan={scan_id} pose={result.pose_type} "
              f"conf={result.overall_confidence:.2f} elapsed={elapsed_ms}ms")

    return AnalyzeResponse(
        scan_id=scan_id,
        raw_measurements=raw,
        v3=v3,
        confidence=round(result.overall_confidence, 3),
        model_version="cv-v3-multi-stage",
    )


def _v3_result_to_raw(result) -> RawMeasurementResponse:
    """
    Map PhysiqueResult → legacy RawMeasurementResponse.

    Muscle scores (0-10) are rescaled to ordinal 0-5 for backward compatibility
    with the existing TypeScript app scoring engine.
    """
    from models.aggregation.aggregation_model import PhysiqueResult

    def to_ordinal(v: float, max_score: float = 10.0) -> int:
        """0-10 → 0-5 ordinal."""
        return int(round(np.clip(v / max_score * 5.0, 0, 5)))

    s = result.muscle_scores
    u_mean = float(np.mean([v for v in result.muscle_uncertainties.values()]))

    chest_ord    = to_ordinal(s.get("chest", 5.0))
    abs_ord      = to_ordinal(s.get("abs", 5.0))
    bicep_ord    = to_ordinal(s.get("biceps", 5.0))
    tricep_ord   = to_ordinal(s.get("triceps", 5.0))
    shl_ord      = to_ordinal(s.get("shoulders", 5.0))
    lats_ord     = to_ordinal(s.get("lats", 5.0)) if "back" in result.pose_type or result.pose_type == "mixed" else None
    quad_ord     = to_ordinal(s.get("quads", 5.0)) if "quads" in result.visible_regions else None
    calf_ord     = to_ordinal(s.get("calves", 5.0)) if "calves" in result.visible_regions else None
    overall_cond = to_ordinal(result.overall_score)

    return RawMeasurementResponse(
        pose_type=result.pose_type,
        visible_regions=result.visible_regions,
        not_visible_regions=[m for m in ["chest", "abs", "biceps", "shoulders",
                                          "lats", "quads", "calves"]
                              if m not in result.visible_regions],
        chest_development=chest_ord,
        shoulder_width=shl_ord,
        shoulder_roundness=max(0, shl_ord - 1),
        arm_thickness=bicep_ord,
        forearm_development=max(0, bicep_ord - 1),
        trap_development=2,
        back_width=lats_ord,
        abs_definition=abs_ord,
        oblique_development=max(0, abs_ord - 1),
        quad_development=quad_ord,
        calf_development=calf_ord,
        glute_development=None,
        muscular_separation=overall_cond,
        vascularity=max(0, overall_cond - 2),
        waist_softness=max(0, 5 - abs_ord),
        posture_shoulder_alignment=int(round(result.symmetry_score * 4)),
        posture_head_position=3,
        spinal_curvature=3,
        left_right_symmetry=int(round(result.symmetry_score * 5)),
        v_taper_visibility=to_ordinal(s.get("lats", 5.0)) if s.get("lats") else 2,
        lat_flare=lats_ord,
    )


# ── V2: Legacy 56-feature pipeline ────────────────────────────────────────────

async def _analyze_v2(
    req: AnalyzeRequest,
    scan_id: str,
    t0: float,
) -> AnalyzeResponse:
    """Original v2 pipeline — kept for rollback / A-B testing."""
    import numpy as np
    from pipeline.preprocessor import preprocess_with_alignment
    from pipeline.segmenter import extract_segmentation_features
    from pipeline.feature_extractor import (
        build_feature_vector, feature_vector_to_numpy,
        aggregate_multi_image_features, FEATURE_NAMES,
    )
    from models.measurement_model import (
        predictions_to_dict, heuristic_from_features,
        blend_prediction_dicts, N_FEATURES,
    )
    from models.registry import get_model

    per_image_features = []
    pose_types_seen = []
    confidence_vals = []

    for b64 in req.image_base64s:
        try:
            img, pose = preprocess_with_alignment(b64, remove_bg=True)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Image decode failed: {e}")

        seg = extract_segmentation_features(img, pose)
        fv  = build_feature_vector(pose, seg)
        arr = feature_vector_to_numpy(fv)
        per_image_features.append(arr)
        pose_types_seen.append(pose.pose_type)
        confidence_vals.append(float(pose.landmark_visibility_mean))

    if not per_image_features:
        raise HTTPException(status_code=422, detail="No processable images provided")

    agg_features = aggregate_multi_image_features(per_image_features, pose_types_seen)

    pose_priority = ["mixed", "back", "side", "front", "unknown"]
    pose_type = "front"
    for pt in pose_priority:
        if pt in pose_types_seen:
            pose_type = pt
            break
    if len(set(pose_types_seen)) > 1:
        pose_type = "mixed"

    confidence  = float(np.mean(confidence_vals)) if confidence_vals else 0.0
    fv_dict     = {name: float(agg_features[i]) for i, name in enumerate(FEATURE_NAMES)}
    heur_dict   = heuristic_from_features(fv_dict)

    use_heuristic_only = os.getenv("ANALYZE_HEURISTIC_ONLY", "").lower() in (
        "1", "true", "yes",
    )
    ml_weight = float(os.getenv("ANALYZE_ML_BLEND_WEIGHT", "0.65"))
    model     = get_model()
    raw_dict  = heur_dict
    model_mode = "heuristic"

    if model is not None and not use_heuristic_only:
        try:
            n_feat = agg_features.shape[0]
            if n_feat != N_FEATURES:
                raise ValueError(f"Feature count mismatch: {n_feat} != {N_FEATURES}")
            pred    = model.predict(agg_features.reshape(1, -1))[0]
            ml_dict = predictions_to_dict(pred, pose_type)
            raw_dict = blend_prediction_dicts(
                ml_dict, heur_dict, pose_type, ml_weight=ml_weight)
            model_mode = "blend"
        except Exception as e:
            print(f"[analyze-v2] Model failed: {e}, using heuristics")
            raw_dict  = heur_dict
            confidence = min(confidence, 0.5)

    try:
        measurements = RawMeasurementResponse(**raw_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Response assembly failed: {e}")

    elapsed_ms = int((time.time() - t0) * 1000)
    print(f"[analyze-v2] scan={scan_id} pose={pose_type} "
          f"conf={confidence:.2f} elapsed={elapsed_ms}ms model={model_mode}")

    return AnalyzeResponse(
        scan_id=scan_id,
        raw_measurements=measurements,
        confidence=round(confidence, 3),
        model_version="cv-v2",
    )
