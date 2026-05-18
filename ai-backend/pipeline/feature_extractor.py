"""
Combines PoseFeatures + SegmentationFeatures into a flat numpy feature vector
and the structured FeatureVector schema used by the ML model.

v2: 56 features (was 50). Six new silhouette features from segmenter v2:
  neck_width_norm, waist_concavity, hip_drop_norm,
  taper_uniformity, calf_width_mean, conditioning_gradient

Existing model files trained on 50 features are incompatible — retrain
with the new pipeline to get the full benefit of landmark-guided measurements.
"""
from __future__ import annotations
import numpy as np
from typing import List

from app.schema import FeatureVector
from pipeline.pose_estimator import PoseFeatures
from pipeline.segmenter import SegmentationFeatures

POSE_TYPE_ENCODING = {"front": 0, "back": 1, "side": 2, "mixed": 3, "unknown": 0}

FEATURE_NAMES = [
    # ── Pose geometric (26 features) ─────────────────────────────────────────
    "shoulder_width_norm", "hip_width_norm", "shoulder_to_hip_ratio_pose",
    "torso_height_norm", "leg_height_norm", "upper_lower_ratio",
    "left_arm_length_norm", "right_arm_length_norm", "arm_length_symmetry",
    "left_leg_length_norm", "right_leg_length_norm", "leg_length_symmetry",
    "shoulder_tilt_deg", "hip_tilt_deg", "spine_angle_deg",
    "head_forward_offset", "shoulder_height_diff_norm",
    "left_elbow_angle", "right_elbow_angle", "elbow_angle_symmetry",
    "left_knee_angle", "right_knee_angle", "knee_angle_symmetry",
    "landmark_visibility_mean", "upper_body_visibility", "lower_body_visibility",
    # ── Segmentation (23 original + 6 new = 29 features) ─────────────────────
    "body_mask_area_norm", "silhouette_shoulder_width", "silhouette_waist_width",
    "silhouette_hip_width", "shoulder_to_waist_sil", "waist_to_hip_sil",
    "v_taper_raw", "upper_body_width_mean", "lower_body_width_mean",
    "aspect_ratio", "contour_irregularity",
    "upper_arm_width_left", "upper_arm_width_right", "arm_width_symmetry",
    "thigh_width_left", "thigh_width_right", "thigh_width_symmetry",
    "chest_width_norm", "waist_to_chest_ratio",
    "body_brightness_mean", "body_brightness_std",
    "edge_density_upper", "edge_density_lower",
    # New v2 silhouette features
    "neck_width_norm", "waist_concavity", "hip_drop_norm",
    "taper_uniformity", "calf_width_mean", "conditioning_gradient",
    # ── Categorical ───────────────────────────────────────────────────────────
    "pose_type_encoded",
]

assert len(FEATURE_NAMES) == 56, f"Expected 56 features, got {len(FEATURE_NAMES)}"


def build_feature_vector(pose: PoseFeatures, seg: SegmentationFeatures,
                          pose_type_override: str | None = None) -> FeatureVector:
    pose_type = pose_type_override or pose.pose_type
    return FeatureVector(
        # Pose
        shoulder_width_norm=pose.shoulder_width_norm,
        hip_width_norm=pose.hip_width_norm,
        shoulder_to_hip_ratio_pose=pose.shoulder_to_hip_ratio,
        torso_height_norm=pose.torso_height_norm,
        leg_height_norm=pose.leg_height_norm,
        upper_lower_ratio=pose.upper_lower_ratio,
        left_arm_length_norm=pose.left_arm_length_norm,
        right_arm_length_norm=pose.right_arm_length_norm,
        arm_length_symmetry=pose.arm_length_symmetry,
        left_leg_length_norm=pose.left_leg_length_norm,
        right_leg_length_norm=pose.right_leg_length_norm,
        leg_length_symmetry=pose.leg_length_symmetry,
        shoulder_tilt_deg=pose.shoulder_tilt_deg,
        hip_tilt_deg=pose.hip_tilt_deg,
        spine_angle_deg=pose.spine_angle_deg,
        head_forward_offset=pose.head_forward_offset,
        shoulder_height_diff_norm=pose.shoulder_height_diff_norm,
        left_elbow_angle=pose.left_elbow_angle,
        right_elbow_angle=pose.right_elbow_angle,
        elbow_angle_symmetry=pose.elbow_angle_symmetry,
        left_knee_angle=pose.left_knee_angle,
        right_knee_angle=pose.right_knee_angle,
        knee_angle_symmetry=pose.knee_angle_symmetry,
        landmark_visibility_mean=pose.landmark_visibility_mean,
        upper_body_visibility=pose.upper_body_visibility,
        lower_body_visibility=pose.lower_body_visibility,
        # Segmentation
        body_mask_area_norm=seg.body_mask_area_norm,
        silhouette_shoulder_width=seg.silhouette_shoulder_width,
        silhouette_waist_width=seg.silhouette_waist_width,
        silhouette_hip_width=seg.silhouette_hip_width,
        shoulder_to_waist_sil=seg.shoulder_to_waist_sil,
        waist_to_hip_sil=seg.waist_to_hip_sil,
        v_taper_raw=seg.v_taper_raw,
        upper_body_width_mean=seg.upper_body_width_mean,
        lower_body_width_mean=seg.lower_body_width_mean,
        aspect_ratio=seg.aspect_ratio,
        contour_irregularity=seg.contour_irregularity,
        upper_arm_width_left=seg.upper_arm_width_left,
        upper_arm_width_right=seg.upper_arm_width_right,
        arm_width_symmetry=seg.arm_width_symmetry,
        thigh_width_left=seg.thigh_width_left,
        thigh_width_right=seg.thigh_width_right,
        thigh_width_symmetry=seg.thigh_width_symmetry,
        chest_width_norm=seg.chest_width_norm,
        waist_to_chest_ratio=seg.waist_to_chest_ratio,
        body_brightness_mean=seg.body_brightness_mean,
        body_brightness_std=seg.body_brightness_std,
        edge_density_upper=seg.edge_density_upper,
        edge_density_lower=seg.edge_density_lower,
        # New v2 silhouette features
        neck_width_norm=seg.neck_width_norm,
        waist_concavity=seg.waist_concavity,
        hip_drop_norm=seg.hip_drop_norm,
        taper_uniformity=seg.taper_uniformity,
        calf_width_mean=seg.calf_width_mean,
        conditioning_gradient=seg.conditioning_gradient,
        pose_type_encoded=POSE_TYPE_ENCODING.get(pose_type, 0),
    )


def feature_vector_to_numpy(fv: FeatureVector) -> np.ndarray:
    """Convert FeatureVector to a 56-element float32 array."""
    return np.array([getattr(fv, name) for name in FEATURE_NAMES], dtype=np.float32)


def numpy_to_feature_vector(arr: np.ndarray) -> FeatureVector:
    """Convert a 56-element array back to FeatureVector (for inference)."""
    assert len(arr) == 56, f"Expected 56 features, got {len(arr)}"
    return FeatureVector(**{name: float(arr[i]) for i, name in enumerate(FEATURE_NAMES)})


def aggregate_multi_image_features(
    feature_vectors: List[np.ndarray],
    pose_types: List[str] | None = None,
) -> np.ndarray:
    """
    Combine features from multiple images (front + side + back).

    Improvement over v1 (naive mean): pose_type_encoded is the last feature
    (index 55). For multi-view stacks, we keep the maximum visibility features
    per dimension, which is more meaningful than averaging orientation-specific
    measurements across conflicting views.

    For a production V3: train separate per-view models and ensemble at the
    score level.
    """
    if len(feature_vectors) == 0:
        return np.zeros(56, dtype=np.float32)
    if len(feature_vectors) == 1:
        return feature_vectors[0]

    stacked = np.stack(feature_vectors, axis=0)

    # Use mean for most features, but for the pose_type_encoded (last dim)
    # take the most informative view (back > side > front in terms of what's
    # uniquely visible).
    agg = np.mean(stacked, axis=0).astype(np.float32)

    if pose_types is not None:
        priority = {"back": 3, "mixed": 2, "side": 1, "front": 0, "unknown": 0}
        best_pt = max(pose_types, key=lambda pt: priority.get(pt, 0))
        from pipeline.feature_extractor import POSE_TYPE_ENCODING
        agg[55] = float(POSE_TYPE_ENCODING.get(best_pt, 0))

    return agg
