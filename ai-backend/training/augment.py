"""
Data augmentation for physique images.

v2 improvements:
  - Gaussian noise injection: adds N(0, σ) to all features to simulate
    measurement noise from different cameras and detection confidence levels.
  - Scale augmentation: multiplies all width/height features by a random
    factor to simulate different camera distances and subject sizes.
  - Mixup: interpolates two random training samples. Standard technique to
    improve generalization; applied at the feature vector level.
  - generate_augmented_batch() now combines all three strategies.

Feature vector index reference: see feature_extractor.FEATURE_NAMES (56 features)
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


# ── Index groups for augmentations that need to know feature semantics ────────

# Width-like features (indices 1, 27-29, 33-34, 37-38, 40-41, 43-44, 50-52)
# These are multiplied together when simulating camera distance / body scale.
WIDTH_FEATURE_INDICES = [
    1,   # hip_width_norm
    27,  # silhouette_shoulder_width
    28,  # silhouette_waist_width
    29,  # silhouette_hip_width
    33,  # upper_body_width_mean
    34,  # lower_body_width_mean
    37,  # upper_arm_width_left
    38,  # upper_arm_width_right
    40,  # thigh_width_left
    41,  # thigh_width_right
    43,  # chest_width_norm
    50,  # neck_width_norm
    53,  # calf_width_mean
]

# Conditioning / texture features — perturb these independently
TEXTURE_FEATURE_INDICES = [45, 46, 47, 48]  # brightness_mean, std, edge_upper, edge_lower

# Symmetry features — flip swaps L/R pairs
LEFT_RIGHT_PAIRS = [
    (6, 7),    # left/right arm length
    (9, 10),   # left/right leg length
    (37, 38),  # left/right arm width
    (40, 41),  # left/right thigh width
]


def build_augmentation_pipeline(training: bool = True):
    if not _albu_available or not training:
        return None
    return A.Compose([
        A.HorizontalFlip(p=0.5),
        A.RandomBrightnessContrast(brightness_limit=0.30, contrast_limit=0.30, p=0.7),
        A.HueSaturationValue(hue_shift_limit=10, sat_shift_limit=25, val_shift_limit=20, p=0.4),
        A.GaussNoise(var_limit=(5, 40), p=0.4),
        A.Rotate(limit=12, border_mode=cv2.BORDER_REFLECT, p=0.4),
        A.RandomScale(scale_limit=0.20, p=0.35),
        A.CoarseDropout(max_holes=4, max_height=32, max_width=32, p=0.2),
        A.ImageCompression(quality_lower=60, quality_upper=95, p=0.2),
    ])


def augment_feature_vector(features: np.ndarray,
                            flip: bool = False,
                            brightness_delta: float = 0.0,
                            rotation_deg: float = 0.0,
                            noise_sigma: float = 0.0,
                            scale_factor: float = 1.0) -> np.ndarray:
    """
    Apply augmentation to a single 56-element feature vector.

    Parameters
    ----------
    flip:            horizontal flip → swap L/R feature pairs
    brightness_delta: shift body_brightness_mean [0-1]
    rotation_deg:    simulated rotation → increase tilt angles
    noise_sigma:     Gaussian noise σ added to all features
    scale_factor:    multiply all width-like features (simulates zoom)
    """
    feat = features.copy()

    if flip:
        for li, ri in LEFT_RIGHT_PAIRS:
            feat[li], feat[ri] = feat[ri].copy(), feat[li].copy()

    if brightness_delta != 0.0:
        feat[45] = float(np.clip(feat[45] + brightness_delta, 0.0, 1.0))

    if rotation_deg != 0.0:
        feat[12] = float(np.clip(feat[12] + abs(rotation_deg), 0.0, 30.0))  # shoulder_tilt
        feat[14] = float(np.clip(feat[14] + abs(rotation_deg), 0.0, 30.0))  # spine_angle

    if noise_sigma > 0.0:
        noise = np.random.normal(0.0, noise_sigma, size=feat.shape).astype(np.float32)
        feat = feat + noise
        # Keep angles non-negative (they represent absolute degrees)
        for idx in [12, 13, 14, 16, 17, 18, 19, 20, 21, 22]:
            feat[idx] = float(np.clip(feat[idx], 0.0, 180.0))
        # Keep proportion features in [0, 1]
        for idx in WIDTH_FEATURE_INDICES + TEXTURE_FEATURE_INDICES:
            feat[idx] = float(np.clip(feat[idx], 0.0, 1.0))

    if scale_factor != 1.0:
        for idx in WIDTH_FEATURE_INDICES:
            feat[idx] = float(np.clip(feat[idx] * scale_factor, 0.0, 1.0))

    return feat


def augment_labels(labels: np.ndarray,
                   flip: bool = False,
                   rotation_deg: float = 0.0) -> np.ndarray:
    """
    Update label vector to match augmented feature vector.
    Labels order: see models.measurement_model.TARGETS
    """
    lbl = labels.copy()

    if flip:
        # left_right_symmetry (index 21) magnitude is unchanged after horizontal flip
        pass

    if abs(rotation_deg) > 3:
        posture_idx = 18   # posture_shoulder_alignment
        lbl[posture_idx] = max(0.0, lbl[posture_idx] - 0.5)

    return lbl


def mixup_pair(x1: np.ndarray, y1: np.ndarray,
               x2: np.ndarray, y2: np.ndarray,
               alpha: float = 0.4) -> tuple[np.ndarray, np.ndarray]:
    """
    Mixup: λ*sample_1 + (1-λ)*sample_2 where λ ~ Beta(alpha, alpha).
    Applies to both features and labels; skip null sentinels (kept as -1).
    """
    lam = float(np.random.beta(alpha, alpha))
    x_mix = (lam * x1 + (1 - lam) * x2).astype(np.float32)
    y_mix = y1.copy()
    for i in range(len(y1)):
        # Only mix when both samples have a real value (not null sentinel)
        if y1[i] > -0.5 and y2[i] > -0.5:
            y_mix[i] = lam * y1[i] + (1 - lam) * y2[i]
    return x_mix, y_mix


def generate_augmented_batch(X: np.ndarray, y: np.ndarray,
                              augment_factor: int = 3,
                              noise_sigma: float = 0.018,
                              scale_range: tuple = (0.88, 1.12),
                              mixup_alpha: float = 0.35,
                              mixup_fraction: float = 0.25) -> tuple:
    """
    Expand dataset with augmented copies.

    augment_factor=3 → dataset grows 3× (original + 2 augmented copies).
    Each augmented copy applies a random combination of:
      - horizontal flip
      - brightness delta
      - rotation jitter
      - Gaussian feature noise (noise_sigma)
      - scale variation (scale_range)

    Additionally, mixup_fraction of the LAST augmented copy is replaced with
    Mixup samples for extra regularization.
    """
    X_out, y_out = [X], [y]
    n = len(X)

    for pass_idx in range(augment_factor - 1):
        X_aug = np.zeros_like(X)
        y_aug = np.zeros_like(y)
        for i in range(n):
            flip = random.random() > 0.5
            rot = random.uniform(-10, 10)
            bright = random.uniform(-0.12, 0.12)
            noise = noise_sigma * random.uniform(0.5, 1.5)
            scale = random.uniform(*scale_range)
            X_aug[i] = augment_feature_vector(
                X[i], flip=flip, brightness_delta=bright,
                rotation_deg=rot, noise_sigma=noise, scale_factor=scale)
            y_aug[i] = augment_labels(y[i], flip=flip, rotation_deg=rot)

        # Replace a fraction of the last copy with Mixup samples
        if pass_idx == augment_factor - 2 and n >= 4:
            n_mixup = max(1, int(n * mixup_fraction))
            idx1 = np.random.choice(n, n_mixup, replace=False)
            idx2 = np.random.choice(n, n_mixup, replace=False)
            for k, (i, j) in enumerate(zip(idx1, idx2)):
                X_aug[i], y_aug[i] = mixup_pair(
                    X[i], y[i], X[j], y[j], alpha=mixup_alpha)

        X_out.append(X_aug)
        y_out.append(y_aug)

    return np.concatenate(X_out, axis=0), np.concatenate(y_out, axis=0)
