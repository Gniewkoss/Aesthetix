"""
YOLOv8n-seg body segmentation → silhouette-based features.

Key improvement over v1: when `pose` is provided, measurement rows are
anchored to actual MediaPipe landmark positions instead of fixed body-height
fractions. This fixes the main regression seen when training on real images
where people are not fully upright or fill the frame differently.

New features (v2, total 29):
  neck_width_norm, waist_concavity, hip_drop_norm,
  taper_uniformity, calf_width_mean, conditioning_gradient
"""
from __future__ import annotations
import numpy as np
import cv2
from dataclasses import dataclass, field
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from pipeline.pose_estimator import PoseFeatures

try:
    from ultralytics import YOLO
    _yolo_available = True
except ImportError:
    _yolo_available = False

_yolo_model = None
_YOLO_MODEL_PATH = "yolov8n-seg.pt"


@dataclass
class SegmentationFeatures:
    # Silhouette geometry
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
    # Texture / conditioning proxies
    body_brightness_mean: float = 0.0
    body_brightness_std: float = 0.0
    edge_density_upper: float = 0.0
    edge_density_lower: float = 0.0
    # New v2 features
    neck_width_norm: float = 0.0
    waist_concavity: float = 0.0
    hip_drop_norm: float = 0.0
    taper_uniformity: float = 0.0
    calf_width_mean: float = 0.0
    conditioning_gradient: float = 0.0
    detected: bool = False


def _get_yolo() -> Optional[object]:
    global _yolo_model
    if not _yolo_available:
        return None
    if _yolo_model is None:
        _yolo_model = YOLO(_YOLO_MODEL_PATH)
    return _yolo_model


def _mask_row_width(mask: np.ndarray, row_frac: float) -> float:
    """Fraction of non-zero pixels in a single horizontal slice."""
    h, w = mask.shape
    row = int(h * row_frac)
    row = max(0, min(h - 1, row))
    line = mask[row, :]
    width = float(np.sum(line > 0))
    return width / w


def _row_range_mean_width(mask: np.ndarray, start_frac: float, end_frac: float,
                           samples: int = 10) -> float:
    fracs = np.linspace(start_frac, end_frac, samples)
    return float(np.mean([_mask_row_width(mask, f) for f in fracs]))


def _half_mask_width(mask: np.ndarray, row_frac: float, side: str) -> float:
    h, w = mask.shape
    row = int(h * row_frac)
    row = max(0, min(h - 1, row))
    line = mask[row, :]
    cols = np.where(line > 0)[0]
    if len(cols) == 0:
        return 0.0
    mid = (cols[0] + cols[-1]) / 2
    if side == "left":
        half = cols[cols < mid]
    else:
        half = cols[cols >= mid]
    return len(half) / w


def _contour_irregularity(mask: np.ndarray) -> float:
    """
    Perimeter / (2 * sqrt(pi * area)) - 1 (isoperimetric quotient).
    Higher values = more irregular silhouette = more muscle definition / striations.
    """
    contours, _ = cv2.findContours(
        mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return 0.0
    c = max(contours, key=cv2.contourArea)
    area = cv2.contourArea(c)
    perimeter = cv2.arcLength(c, True)
    if area < 1:
        return 0.0
    return float(perimeter / (2 * np.sqrt(np.pi * area))) - 1.0


def _edge_density(img_gray: np.ndarray, mask: np.ndarray,
                  start_frac: float, end_frac: float) -> float:
    """Canny edge pixel density within body mask slice (conditioning proxy)."""
    h = img_gray.shape[0]
    r0, r1 = int(h * start_frac), int(h * end_frac)
    region_gray = img_gray[r0:r1, :]
    region_mask = mask[r0:r1, :]
    edges = cv2.Canny(region_gray, 40, 120)
    masked_edges = edges & (region_mask > 0).astype(np.uint8) * 255
    pixel_count = float(np.sum(region_mask > 0)) + 1
    return float(np.sum(masked_edges > 0)) / pixel_count


def _taper_uniformity(mask: np.ndarray, shl_frac: float, hip_frac: float,
                      n_slices: int = 12) -> float:
    """
    Std dev of the widths between shoulder and hip.
    Low std = uniform cylindrical torso.
    High std = pronounced waist or uneven taper → good physique indicator.
    """
    fracs = np.linspace(shl_frac, hip_frac, n_slices)
    widths = np.array([_mask_row_width(mask, f) for f in fracs])
    if widths.mean() < 1e-6:
        return 0.0
    return float(np.std(widths) / (widths.mean() + 1e-9))


def _landmark_row_fracs(pose: "PoseFeatures", h: int) -> dict:
    """
    Derive anatomically-correct row fractions from MediaPipe landmarks.
    Returns dict with keys: shl, chest, wst, hip, arm, thigh, neck, calf
    All values are fractions of the FULL image height (0-1).
    """
    from pipeline.pose_estimator import (
        LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_HIP, RIGHT_HIP,
        LEFT_KNEE, RIGHT_KNEE, LEFT_ANKLE, RIGHT_ANKLE, NOSE,
    )
    lm = pose.landmarks
    vis = pose.visibility

    def lm_y(idx: int) -> float:
        return float(lm[idx][1]) if vis[idx] > 0.3 else -1.0

    shl_y_l = lm_y(LEFT_SHOULDER)
    shl_y_r = lm_y(RIGHT_SHOULDER)
    hip_y_l = lm_y(LEFT_HIP)
    hip_y_r = lm_y(RIGHT_HIP)
    knee_y_l = lm_y(LEFT_KNEE)
    knee_y_r = lm_y(RIGHT_KNEE)
    ankle_y_l = lm_y(LEFT_ANKLE)
    ankle_y_r = lm_y(RIGHT_ANKLE)
    nose_y = lm_y(NOSE)

    # Use only visible landmarks
    shl_y_vals = [v for v in [shl_y_l, shl_y_r] if v >= 0]
    hip_y_vals = [v for v in [hip_y_l, hip_y_r] if v >= 0]
    knee_y_vals = [v for v in [knee_y_l, knee_y_r] if v >= 0]
    ankle_y_vals = [v for v in [ankle_y_l, ankle_y_r] if v >= 0]

    if not shl_y_vals or not hip_y_vals:
        return {}  # Signals caller to use fallback fractions

    shl_y = float(np.mean(shl_y_vals))
    hip_y = float(np.mean(hip_y_vals))
    knee_y = float(np.mean(knee_y_vals)) if knee_y_vals else hip_y + (hip_y - shl_y) * 0.55
    ankle_y = float(np.mean(ankle_y_vals)) if ankle_y_vals else knee_y + (knee_y - hip_y) * 0.9

    torso_h = hip_y - shl_y
    if torso_h < 0.05:
        return {}  # Landmarks too close → unreliable

    neck_y = (nose_y + shl_y) / 2 if nose_y >= 0 else shl_y - torso_h * 0.08

    return {
        "neck":  max(0.01, neck_y),
        "shl":   shl_y,
        "chest": shl_y + torso_h * 0.26,
        "wst":   shl_y + torso_h * 0.62,
        "hip":   hip_y,
        "arm":   shl_y + torso_h * 0.38,
        "thigh": hip_y + (knee_y - hip_y) * 0.35,
        "calf":  knee_y + (ankle_y - knee_y) * 0.40,
    }


def extract_segmentation_features(
    img_bgr: np.ndarray,
    pose: "PoseFeatures | None" = None,
) -> SegmentationFeatures:
    """
    Run YOLO segmentation on the image.
    When `pose` is provided its landmark y-coordinates anchor the measurement
    rows, giving anatomically accurate widths regardless of how the person
    fills the frame (partially cropped, different zoom, tilt).
    """
    feats = SegmentationFeatures()
    model = _get_yolo()

    if model is None:
        return feats

    h, w = img_bgr.shape[:2]
    results = model(img_bgr, verbose=False)

    # Pick the largest person mask
    best_mask: Optional[np.ndarray] = None
    best_area = 0.0
    for r in results:
        if r.masks is None:
            continue
        for i, cls in enumerate(r.boxes.cls):
            if int(cls) != 0:   # COCO class 0 = person
                continue
            m = r.masks.data[i].cpu().numpy()
            m_resized = cv2.resize(m, (w, h), interpolation=cv2.INTER_NEAREST)
            area = float(np.sum(m_resized > 0.5))
            if area > best_area:
                best_area = area
                best_mask = (m_resized > 0.5).astype(np.uint8)

    if best_mask is None or best_area < 100:
        return feats

    feats.detected = True

    # ── Body bounding box within mask ─────────────────────────────────────────
    rows = np.where(best_mask.any(axis=1))[0]
    cols = np.where(best_mask.any(axis=0))[0]
    if len(rows) == 0 or len(cols) == 0:
        return feats

    body_h = rows[-1] - rows[0] + 1
    body_w = cols[-1] - cols[0] + 1
    feats.body_mask_area_norm = best_area / (h * w)
    feats.aspect_ratio = body_h / max(body_w, 1)

    # ── Choose measurement row fractions ─────────────────────────────────────
    # Primary path: landmark-guided (anatomically correct)
    # Fallback: heuristic body-bbox fractions (v1 behaviour)

    def body_row_frac(frac: float) -> float:
        return (rows[0] + body_h * frac) / h

    landmark_fracs: dict = {}
    if pose is not None and pose.detected and len(pose.landmarks) >= 29:
        landmark_fracs = _landmark_row_fracs(pose, h)

    if landmark_fracs:
        neck_frac  = landmark_fracs["neck"]
        shl_frac   = landmark_fracs["shl"]
        chest_frac = landmark_fracs["chest"]
        wst_frac   = landmark_fracs["wst"]
        hip_frac   = landmark_fracs["hip"]
        arm_frac   = landmark_fracs["arm"]
        thigh_frac = landmark_fracs["thigh"]
        calf_frac  = landmark_fracs["calf"]
    else:
        neck_frac  = body_row_frac(0.05)
        shl_frac   = body_row_frac(0.15)
        chest_frac = body_row_frac(0.22)
        wst_frac   = body_row_frac(0.42)
        hip_frac   = body_row_frac(0.55)
        arm_frac   = body_row_frac(0.28)
        thigh_frac = body_row_frac(0.65)
        calf_frac  = body_row_frac(0.75)

    # ── Width measurements ────────────────────────────────────────────────────
    feats.silhouette_shoulder_width = _mask_row_width(best_mask, shl_frac)
    feats.chest_width_norm          = _mask_row_width(best_mask, chest_frac)
    feats.silhouette_waist_width    = _mask_row_width(best_mask, wst_frac)
    feats.silhouette_hip_width      = _mask_row_width(best_mask, hip_frac)
    feats.neck_width_norm           = _mask_row_width(best_mask, neck_frac)

    shl_w = feats.silhouette_shoulder_width + 1e-9
    wst_w = feats.silhouette_waist_width
    hip_w = feats.silhouette_hip_width

    feats.shoulder_to_waist_sil = wst_w / shl_w
    feats.waist_to_hip_sil      = wst_w / max(hip_w, 1e-9)
    feats.waist_to_chest_ratio  = wst_w / max(feats.chest_width_norm, 1e-9)
    feats.v_taper_raw           = (shl_w - wst_w) / shl_w

    if landmark_fracs:
        up_start = shl_frac
        up_end   = wst_frac
        lo_start = hip_frac
        lo_end   = min(calf_frac + 0.05, 0.98)
    else:
        up_start = body_row_frac(0.05)
        up_end   = body_row_frac(0.45)
        lo_start = body_row_frac(0.55)
        lo_end   = body_row_frac(0.95)

    feats.upper_body_width_mean = _row_range_mean_width(best_mask, up_start, up_end)
    feats.lower_body_width_mean = _row_range_mean_width(best_mask, lo_start, lo_end)

    # ── Upper arm widths ──────────────────────────────────────────────────────
    # _half_mask_width returns half-body-width at arm level (torso + arm).
    # Subtract half the neck width (torso-only reference) to get arm protrusion.
    arm_left_raw  = _half_mask_width(best_mask, arm_frac, "left")
    arm_right_raw = _half_mask_width(best_mask, arm_frac, "right")
    half_neck = feats.neck_width_norm / 2 if feats.neck_width_norm > 0.01 else shl_w * 0.14
    feats.upper_arm_width_left  = max(0.01, arm_left_raw  - half_neck)
    feats.upper_arm_width_right = max(0.01, arm_right_raw - half_neck)
    avg_arm = (feats.upper_arm_width_left + feats.upper_arm_width_right) / 2 + 1e-9
    feats.arm_width_symmetry = abs(
        feats.upper_arm_width_left - feats.upper_arm_width_right) / avg_arm

    # ── Thigh widths ──────────────────────────────────────────────────────────
    feats.thigh_width_left  = _half_mask_width(best_mask, thigh_frac, "left")
    feats.thigh_width_right = _half_mask_width(best_mask, thigh_frac, "right")
    avg_thigh = (feats.thigh_width_left + feats.thigh_width_right) / 2 + 1e-9
    feats.thigh_width_symmetry = abs(
        feats.thigh_width_left - feats.thigh_width_right) / avg_thigh

    # ── Contour irregularity ──────────────────────────────────────────────────
    feats.contour_irregularity = _contour_irregularity(best_mask)

    # ── Texture / conditioning ────────────────────────────────────────────────
    img_gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    masked_pixels = img_gray[best_mask > 0]
    if len(masked_pixels) > 0:
        feats.body_brightness_mean = float(np.mean(masked_pixels)) / 255.0
        feats.body_brightness_std  = float(np.std(masked_pixels))  / 255.0

    feats.edge_density_upper = _edge_density(img_gray, best_mask, up_start, up_end)
    feats.edge_density_lower = _edge_density(img_gray, best_mask, lo_start,
                                              min(lo_end, 0.98))

    # ── New v2 features ───────────────────────────────────────────────────────

    # waist_concavity: minimum width between shoulder and hip / shoulder width
    n_slices = 16
    waist_zone_fracs = np.linspace(shl_frac + 0.01, hip_frac - 0.01, n_slices)
    waist_widths = np.array([_mask_row_width(best_mask, f) for f in waist_zone_fracs])
    min_waist_w = float(np.min(waist_widths)) if len(waist_widths) > 0 else wst_w
    feats.waist_concavity = max(0.0, 1.0 - min_waist_w / shl_w)

    # hip_drop_norm: hip protrusion beyond waist
    feats.hip_drop_norm = max(0.0, float(hip_w - min_waist_w) / (shl_w + 1e-9))

    # taper_uniformity: consistency of taper (low = uniform cylinder, high = defined waist)
    feats.taper_uniformity = _taper_uniformity(best_mask, shl_frac, hip_frac)

    # calf_width_mean: mean width at calf region (only meaningful when lower body visible)
    calf_end = min(calf_frac + 0.06, 0.98)
    calf_widths = [_mask_row_width(best_mask, f)
                   for f in np.linspace(calf_frac, calf_end, 6)]
    feats.calf_width_mean = float(np.mean(calf_widths)) if any(w > 0 for w in calf_widths) else 0.0

    # conditioning_gradient: how much more defined upper body is vs lower body
    feats.conditioning_gradient = feats.edge_density_upper - feats.edge_density_lower

    # ── Close-crop normalization ───────────────────────────────────────────────
    # When the person fills too much of the frame (close-up / upper-body shot),
    # absolute width measurements exceed the training distribution.
    # Scale all absolute widths so silhouette_shoulder_width ≈ 0.36 (full-body ref).
    # Ratio-based features (v_taper_raw, shoulder_to_waist_sil, waist_concavity,
    # taper_uniformity) are scale-invariant and are NOT changed.
    _TARGET_SHL = 0.36
    if feats.silhouette_shoulder_width > 0.42:
        _scale = _TARGET_SHL / feats.silhouette_shoulder_width
        for _attr in (
            "silhouette_shoulder_width", "silhouette_waist_width",
            "silhouette_hip_width", "chest_width_norm", "neck_width_norm",
            "upper_body_width_mean", "lower_body_width_mean",
            "upper_arm_width_left", "upper_arm_width_right",
            "thigh_width_left", "thigh_width_right", "calf_width_mean",
        ):
            setattr(feats, _attr, getattr(feats, _attr) * _scale)
        # Recompute waist_to_chest_ratio with scaled values
        feats.waist_to_chest_ratio = feats.silhouette_waist_width / max(
            feats.chest_width_norm, 1e-9)

    return feats
