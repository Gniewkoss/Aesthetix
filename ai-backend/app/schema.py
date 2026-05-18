"""
Pydantic schemas.

RawMeasurementResponse mirrors src/vision/types.ts RawMeasurementResponse exactly —
the TypeScript app's parseMeasurements() expects this shape verbatim.
"""
from __future__ import annotations
from typing import Optional, List
from pydantic import BaseModel, Field


class RawMeasurementResponse(BaseModel):
    pose_type: str = "front"
    visible_regions: List[str] = []
    not_visible_regions: List[str] = []

    # Ratios (continuous, nullable)
    shoulder_to_waist_ratio: Optional[float] = None
    shoulder_to_hip_ratio: Optional[float] = None
    waist_to_hip_ratio: Optional[float] = None

    # Muscle development ordinals (0-5)
    chest_development: int = 1
    shoulder_roundness: int = 1
    shoulder_width: int = 1
    arm_thickness: int = 1
    forearm_development: int = 1
    trap_development: int = 1
    back_width: Optional[int] = None
    abs_definition: int = 1
    oblique_development: int = 1
    quad_development: Optional[int] = None
    calf_development: Optional[int] = None
    glute_development: Optional[int] = None

    # Composition ordinals
    muscular_separation: int = 1
    vascularity: int = 0
    waist_softness: int = 3

    # Posture ordinals (0-5, 5=perfect)
    posture_shoulder_alignment: int = 2
    posture_head_position: int = 2
    spinal_curvature: int = 2

    # Aesthetics ordinals
    left_right_symmetry: int = 2
    v_taper_visibility: int = 1
    lat_flare: Optional[int] = None


class FeatureVector(BaseModel):
    """Extracted CV features before ML prediction."""
    # Geometric (from pose landmarks)
    shoulder_width_norm: float = 0.0
    hip_width_norm: float = 0.0
    shoulder_to_hip_ratio_pose: float = 0.0
    torso_height_norm: float = 0.0
    leg_height_norm: float = 0.0
    upper_lower_ratio: float = 0.0
    left_arm_length_norm: float = 0.0
    right_arm_length_norm: float = 0.0
    arm_length_symmetry: float = 0.0
    left_leg_length_norm: float = 0.0
    right_leg_length_norm: float = 0.0
    leg_length_symmetry: float = 0.0
    shoulder_tilt_deg: float = 0.0
    hip_tilt_deg: float = 0.0
    spine_angle_deg: float = 0.0
    head_forward_offset: float = 0.0
    shoulder_height_diff_norm: float = 0.0
    left_elbow_angle: float = 0.0
    right_elbow_angle: float = 0.0
    elbow_angle_symmetry: float = 0.0
    left_knee_angle: float = 0.0
    right_knee_angle: float = 0.0
    knee_angle_symmetry: float = 0.0
    landmark_visibility_mean: float = 0.0
    upper_body_visibility: float = 0.0
    lower_body_visibility: float = 0.0
    # Silhouette (from segmentation mask)
    body_mask_area_norm: float = 0.0
    silhouette_shoulder_width: float = 0.0
    silhouette_waist_width: float = 0.0
    silhouette_hip_width: float = 0.0
    shoulder_to_waist_sil: float = 0.0
    waist_to_hip_sil: float = 0.0
    v_taper_raw: float = 0.0
    upper_body_width_mean: float = 0.0
    lower_body_width_mean: float = 0.0
    aspect_ratio: float = 0.0
    contour_irregularity: float = 0.0
    upper_arm_width_left: float = 0.0
    upper_arm_width_right: float = 0.0
    arm_width_symmetry: float = 0.0
    thigh_width_left: float = 0.0
    thigh_width_right: float = 0.0
    thigh_width_symmetry: float = 0.0
    chest_width_norm: float = 0.0
    waist_to_chest_ratio: float = 0.0
    # Texture / conditioning
    body_brightness_mean: float = 0.0
    body_brightness_std: float = 0.0
    edge_density_upper: float = 0.0
    edge_density_lower: float = 0.0
    pose_type_encoded: int = 0


class AnalyzeRequest(BaseModel):
    image_base64s: List[str] = Field(..., min_length=1, max_length=4)
    user_id: Optional[str] = None
    scan_id: Optional[str] = None


class AnalyzeResponse(BaseModel):
    scan_id: str
    raw_measurements: RawMeasurementResponse
    feature_vector: Optional[FeatureVector] = None
    confidence: float = 0.0
    model_version: str = "cv-v1"


class PredictRequest(BaseModel):
    features: FeatureVector


class PredictResponse(BaseModel):
    raw_measurements: RawMeasurementResponse
    confidence: float
    model_version: str


class TrainRequest(BaseModel):
    dataset_path: str
    model_type: str = "xgboost"   # "xgboost" | "mlp"
    n_trials: int = 50
    test_size: float = 0.2
    run_name: Optional[str] = None


class TrainResponse(BaseModel):
    run_id: str
    model_path: str
    metrics: dict
    model_version: str


class DatasetSample(BaseModel):
    """One labeled training sample."""
    image_id: str
    image_paths: List[str]
    pose_type: str
    labels: RawMeasurementResponse
    trainer_overall_score: Optional[float] = None
    trainer_notes: Optional[str] = None
    metadata: Optional[dict] = None
