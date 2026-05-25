"""
Stage 4: Per-Region Hand-Crafted Feature Extraction.

For each RegionCrop we produce a 32-dimensional feature vector of interpretable
visual proxies — things that correlate with muscle development WITHOUT needing
direct muscle-mass labels:

  edge_sharpness         — Laplacian variance (high = defined muscles)
  edge_mean              — mean Sobel magnitude
  texture_density        — LBP histogram entropy (surface texture complexity)
  separation_score       — ratio of strong edges to total edges (muscle separation)
  brightness_mean        — normalized mean luminance
  brightness_std         — local illumination variance
  contrast_ratio         — 90th/10th percentile brightness ratio
  vascularity_proxy      — high-frequency brightness variation (vein detection proxy)
  skin_saturation        — mean S channel in HSV (muscle fullness proxy)
  contour_complexity     — perimeter^2 / area of body silhouette in the crop
  local_contrast_entropy — entropy of local contrast map
  symmetry_score         — left-right pixel correlation within the crop
  aspect_ratio           — crop height / width (shape info)
  fill_ratio             — fraction of mask that is body pixels
  gradient_orientation   — dominant gradient angle (muscle fiber direction proxy)
  ...  (padded to 32 with zero-filled reserved slots)
"""
from __future__ import annotations

import math
from typing import Optional

import cv2
import numpy as np
from skimage.feature import local_binary_pattern

from pipeline.region_cropper import RegionCrop, CROP_SIZE

FEATURE_DIM = 32
LBP_RADIUS  = 3
LBP_POINTS  = 8 * LBP_RADIUS


def extract_region_features(crop: RegionCrop) -> np.ndarray:
    """
    Returns a FEATURE_DIM-dimensional float32 vector for a single RegionCrop.
    If crop.is_visible is False, returns a zero vector (no inference needed).
    """
    if not crop.is_visible:
        return np.zeros(FEATURE_DIM, dtype=np.float32)

    img  = crop.image            # (H, W, 3) uint8 BGR
    mask = crop.mask             # (H, W) float32 0-1 or None

    gray  = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
    hsv   = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)

    # Apply mask (set background to 0.5 so background doesn't pollute stats)
    if mask is not None:
        bg_mask = (mask < 0.5)
        gray_m  = gray.copy()
        gray_m[bg_mask] = 0.5
    else:
        gray_m = gray
        bg_mask = np.zeros_like(gray, dtype=bool)

    body_pixels = gray_m[~bg_mask] if mask is not None else gray_m.ravel()
    n_body = max(1, body_pixels.size)

    # ── 1. Edge / sharpness features ─────────────────────────────────────────
    lap = cv2.Laplacian(gray_m, cv2.CV_32F)
    sobel_x = cv2.Sobel(gray_m, cv2.CV_32F, 1, 0, ksize=3)
    sobel_y = cv2.Sobel(gray_m, cv2.CV_32F, 0, 1, ksize=3)
    sobel_mag = np.sqrt(sobel_x**2 + sobel_y**2)

    edge_sharpness  = float(lap.var())                             # f0
    edge_mean       = float(sobel_mag.mean())                      # f1
    strong_edge_ratio = float((sobel_mag > 0.05).sum() / max(1, (~bg_mask).sum()))  # f2
    edge_std        = float(sobel_mag.std())                       # f3

    # Gradient orientation: dominant angle bin (0=hor, 1=diag, 2=vert)
    angle = np.arctan2(np.abs(sobel_y), np.abs(sobel_x) + 1e-8)
    hist_ang, _ = np.histogram(angle.ravel(), bins=8, range=(0, math.pi / 2),
                               density=True)
    orient_entropy = float(_entropy(hist_ang + 1e-8))              # f4
    dominant_angle  = float(hist_ang.argmax() / 7.0)              # f5

    # ── 2. Texture features (LBP) ─────────────────────────────────────────────
    gray_u8 = (gray_m * 255).clip(0, 255).astype(np.uint8)
    lbp = local_binary_pattern(gray_u8, LBP_POINTS, LBP_RADIUS, method="uniform")
    lbp_hist, _ = np.histogram(lbp.ravel(), bins=LBP_POINTS + 2,
                               range=(0, LBP_POINTS + 2), density=True)
    texture_density = float(_entropy(lbp_hist + 1e-8))            # f6
    texture_mean    = float(lbp_hist.mean())                       # f7

    # ── 3. Brightness / illumination features ─────────────────────────────────
    brightness_mean = float(body_pixels.mean())                    # f8
    brightness_std  = float(body_pixels.std())                     # f9
    p10 = float(np.percentile(body_pixels, 10))
    p90 = float(np.percentile(body_pixels, 90))
    contrast_ratio  = float(p90 / (p10 + 1e-3))                   # f10
    contrast_entropy = float(_entropy(
        np.histogram(body_pixels, bins=32, density=True)[0] + 1e-8)) # f11

    # ── 4. Vascularity proxy ──────────────────────────────────────────────────
    # High-pass filter: difference between original and blurred
    blur = cv2.GaussianBlur(gray_m, (5, 5), 0)
    highfreq = np.abs(gray_m - blur)
    vascularity_proxy = float(highfreq[~bg_mask].mean()
                              if mask is not None else highfreq.mean()) # f12
    vascularity_var   = float(highfreq.var())                     # f13

    # ── 5. Color / saturation (skin fullness proxy) ────────────────────────────
    sat = hsv[:, :, 1] / 255.0
    skin_saturation = float(sat[~bg_mask].mean()
                            if mask is not None else sat.mean()) # f14
    val = hsv[:, :, 2] / 255.0
    skin_value_mean = float(val[~bg_mask].mean()
                             if mask is not None else val.mean()) # f15

    # ── 6. Symmetry score ─────────────────────────────────────────────────────
    half = CROP_SIZE // 2
    left_half  = gray_m[:, :half]
    right_half = np.fliplr(gray_m[:, half:])
    min_w = min(left_half.shape[1], right_half.shape[1])
    sym_corr = float(np.corrcoef(
        left_half[:, :min_w].ravel(),
        right_half[:, :min_w].ravel()
    )[0, 1])
    symmetry_score = float(np.clip((sym_corr + 1.0) / 2.0, 0, 1)) # f16

    # ── 7. Silhouette / shape features ────────────────────────────────────────
    if mask is not None:
        binary = (mask > 0.5).astype(np.uint8)
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL,
                                        cv2.CHAIN_APPROX_SIMPLE)
        if contours:
            c = max(contours, key=cv2.contourArea)
            area = max(1, cv2.contourArea(c))
            peri = cv2.arcLength(c, True)
            contour_complexity = float(peri**2 / (4 * math.pi * area))  # circularity^-1
        else:
            contour_complexity = 1.0
        fill_ratio = float(binary.mean())                          # f18
    else:
        contour_complexity = 1.0
        fill_ratio = 0.6
    contour_complexity = float(np.clip(contour_complexity, 1.0, 10.0))  # f17

    aspect_ratio = 1.0   # always 1.0 after square-crop — reserved for original AR
                          # f19

    # ── 8. Local contrast map entropy ─────────────────────────────────────────
    local_std = cv2.GaussianBlur(gray_m**2, (9, 9), 0) - \
                cv2.GaussianBlur(gray_m, (9, 9), 0)**2
    local_std = np.sqrt(np.abs(local_std))
    lce = float(_entropy(
        np.histogram(local_std.ravel(), bins=16, density=True)[0] + 1e-8))  # f20

    # ── 9. Muscle separation score ─────────────────────────────────────────────
    # Laplacian Zero-Crossing density (muscle boundary indicator)
    lap_sign = np.sign(lap)
    zcr_mask = np.abs(np.diff(lap_sign, axis=1)) > 1.0
    separation_score = float(zcr_mask.mean())                      # f21

    # ── 10. Conditioning gradient (top-to-bottom brightness fall-off) ─────────
    row_means = gray_m.mean(axis=1)           # shape (H,)
    n_rows = len(row_means)
    if n_rows > 4:
        top_q   = row_means[:n_rows // 4].mean()
        bot_q   = row_means[3 * n_rows // 4:].mean()
        conditioning_gradient = float(top_q - bot_q)              # f22
    else:
        conditioning_gradient = 0.0

    # ── Assemble vector ────────────────────────────────────────────────────────
    feats = np.array([
        edge_sharpness,          # f0
        edge_mean,               # f1
        strong_edge_ratio,       # f2
        edge_std,                # f3
        orient_entropy,          # f4
        dominant_angle,          # f5
        texture_density,         # f6
        texture_mean,            # f7
        brightness_mean,         # f8
        brightness_std,          # f9
        contrast_ratio,          # f10
        contrast_entropy,        # f11
        vascularity_proxy,       # f12
        vascularity_var,         # f13
        skin_saturation,         # f14
        skin_value_mean,         # f15
        symmetry_score,          # f16
        contour_complexity,      # f17
        fill_ratio,              # f18
        aspect_ratio,            # f19
        lce,                     # f20
        separation_score,        # f21
        conditioning_gradient,   # f22
        # reserved (pads to FEATURE_DIM=32)
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
    ], dtype=np.float32)

    assert len(feats) == FEATURE_DIM
    return np.nan_to_num(feats, nan=0.0, posinf=1.0, neginf=0.0)


def extract_symmetry_pair(left_crop: RegionCrop,
                          right_crop: RegionCrop) -> float:
    """
    Compute bilateral symmetry between matching left/right muscle crops
    (e.g., left_bicep vs right_bicep).

    Returns a symmetry score in [0, 1] where 1 = perfect symmetry.
    """
    if not left_crop.is_visible or not right_crop.is_visible:
        return 1.0   # unknown → assume symmetric

    lf = extract_region_features(left_crop)
    rf = extract_region_features(right_crop)

    # Compare edge/texture/brightness features (first 16)
    diff = np.abs(lf[:16] - rf[:16])
    max_val = np.maximum(np.abs(lf[:16]), np.abs(rf[:16])) + 1e-6
    relative_diff = (diff / max_val).mean()
    return float(np.clip(1.0 - relative_diff, 0.0, 1.0))


def _entropy(p: np.ndarray) -> float:
    p = p / (p.sum() + 1e-12)
    return float(-np.sum(p * np.log(p + 1e-12)))
