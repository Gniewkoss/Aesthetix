"""
Data augmentation for physique images.

Key insight: horizontal flip + swap of left/right labels is the most
valuable augmentation — it effectively doubles the dataset and teaches
the model that left/right are symmetric.

All augmentations must be consistent across the label space:
  - Flip:    swap L/R measurement labels (arm_width_symmetry stays same magnitude)
  - Lighting: doesn't affect structure labels, only affects conditioning estimates
  - Rotation: affects posture angles — labels must be updated accordingly
"""
from __future__ import annotations
import numpy as np
import cv2
import random
from typing import Optional

try:
    import albumentations as A
    _albu_available = True
except ImportError:
    _albu_available = False


def build_augmentation_pipeline(training: bool = True):
    if not _albu_available or not training:
        return None
    return A.Compose([
        A.HorizontalFlip(p=0.5),
        A.RandomBrightnessContrast(brightness_limit=0.25, contrast_limit=0.25, p=0.7),
        A.HueSaturationValue(hue_shift_limit=10, sat_shift_limit=20, val_shift_limit=15, p=0.4),
        A.GaussNoise(var_limit=(5, 25), p=0.3),
        A.Rotate(limit=10, border_mode=cv2.BORDER_REFLECT, p=0.4),
        A.RandomScale(scale_limit=0.15, p=0.3),
        A.CoarseDropout(max_holes=4, max_height=32, max_width=32, p=0.2),
    ])


def augment_feature_vector(features: np.ndarray, flip: bool = False,
                            brightness_delta: float = 0.0,
                            rotation_deg: float = 0.0) -> np.ndarray:
    """
    Apply augmentation directly to the feature vector (post-extraction).
    This is much faster than re-running the full CV pipeline per augment.

    Feature vector layout (index from FEATURE_NAMES):
      arm_length_symmetry [8], leg_length_symmetry [11],
      arm_width_symmetry [39], thigh_width_symmetry [42],
      shoulder_height_diff_norm [16], body_brightness_mean [46]
    """
    feat = features.copy()

    if flip:
        # Swap left/right lengths (indices 6-7, 9-10)
        feat[6], feat[7] = feat[7].copy(), feat[6].copy()  # arm lengths
        feat[9], feat[10] = feat[10].copy(), feat[9].copy()  # leg lengths
        # Swap upper arm widths (37-38)
        feat[37], feat[38] = feat[38].copy(), feat[37].copy()
        # Swap thigh widths (40-41)
        feat[40], feat[41] = feat[41].copy(), feat[40].copy()
        # Symmetry magnitudes are unchanged after flip

    if brightness_delta != 0.0:
        # Only affects conditioning/texture features (indices 46-49)
        feat[46] = np.clip(feat[46] + brightness_delta, 0.0, 1.0)

    if rotation_deg != 0.0:
        # Shoulder tilt and spine angle change with rotation
        rad = np.deg2rad(rotation_deg)
        feat[12] = feat[12] + abs(rotation_deg)  # shoulder_tilt_deg
        feat[14] = feat[14] + abs(rotation_deg)  # spine_angle_deg

    return feat


def augment_labels(labels: np.ndarray, flip: bool = False,
                   rotation_deg: float = 0.0) -> np.ndarray:
    """
    Update label vector to match augmented feature vector.
    Only posture-related and symmetry labels change.

    Labels order: see models.measurement_model.TARGETS
    """
    lbl = labels.copy()

    if flip:
        # left_right_symmetry (index 21) stays the same — magnitude is symmetric
        # posture_shoulder_alignment (index 18) stays the same
        pass

    if abs(rotation_deg) > 3:
        # Slight rotation → posture labels worsen slightly
        posture_idx = 18  # posture_shoulder_alignment
        lbl[posture_idx] = max(0, lbl[posture_idx] - 0.5)

    return lbl


def generate_augmented_batch(X: np.ndarray, y: np.ndarray,
                              augment_factor: int = 3) -> tuple:
    """
    Expand dataset with augmented copies.
    augment_factor=3 → dataset grows 3× (original + 2 augmented copies).
    """
    X_out, y_out = [X], [y]
    n = len(X)

    for _ in range(augment_factor - 1):
        X_aug = np.zeros_like(X)
        y_aug = np.zeros_like(y)
        for i in range(n):
            flip = random.random() > 0.5
            rot = random.uniform(-8, 8)
            bright = random.uniform(-0.1, 0.1)
            X_aug[i] = augment_feature_vector(X[i], flip=flip,
                                               brightness_delta=bright,
                                               rotation_deg=rot)
            y_aug[i] = augment_labels(y[i], flip=flip, rotation_deg=rot)
        X_out.append(X_aug)
        y_out.append(y_aug)

    return np.concatenate(X_out, axis=0), np.concatenate(y_out, axis=0)
