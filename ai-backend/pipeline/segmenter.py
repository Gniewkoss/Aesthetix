"""
YOLOv8n-seg body segmentation → silhouette-based features.

Uses the COCO 'person' class (class 0) to extract body mask,
then derives width measurements at multiple heights.
"""
from __future__ import annotations
import numpy as np
import cv2
from dataclasses import dataclass
from typing import Optional

try:
    from ultralytics import YOLO
    _yolo_available = True
except ImportError:
    _yolo_available = False

_yolo_model = None
_YOLO_MODEL_PATH = "yolov8n-seg.pt"  # Auto-downloaded on first run


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
    """Width of left or right half of the body at a given row."""
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


def extract_segmentation_features(img_bgr: np.ndarray) -> SegmentationFeatures:
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

    # Map fraction within body bounding box, not full image
    def body_row_frac(global_frac: float) -> float:
        return (rows[0] + body_h * global_frac) / h

    # ── Width measurements at anatomical landmarks ─────────────────────────────
    # Shoulder = ~15% down from body top
    # Chest    = ~22% down
    # Waist    = ~42% down
    # Hip      = ~55% down
    # Thigh    = ~65% down
    # Knee     = ~80% down

    shl_frac  = body_row_frac(0.15)
    chest_frac = body_row_frac(0.22)
    wst_frac  = body_row_frac(0.42)
    hip_frac  = body_row_frac(0.55)
    thigh_frac = body_row_frac(0.65)

    feats.silhouette_shoulder_width = _mask_row_width(best_mask, shl_frac)
    feats.chest_width_norm = _mask_row_width(best_mask, chest_frac)
    feats.silhouette_waist_width = _mask_row_width(best_mask, wst_frac)
    feats.silhouette_hip_width = _mask_row_width(best_mask, hip_frac)

    shl_w = feats.silhouette_shoulder_width + 1e-9
    feats.shoulder_to_waist_sil = feats.silhouette_waist_width / shl_w
    feats.waist_to_hip_sil = feats.silhouette_waist_width / max(feats.silhouette_hip_width, 1e-9)
    feats.waist_to_chest_ratio = feats.silhouette_waist_width / max(feats.chest_width_norm, 1e-9)

    # V-taper: shoulder vs waist ratio (higher = better taper)
    feats.v_taper_raw = (shl_w - feats.silhouette_waist_width) / shl_w

    feats.upper_body_width_mean = _row_range_mean_width(
        best_mask, body_row_frac(0.05), body_row_frac(0.45))
    feats.lower_body_width_mean = _row_range_mean_width(
        best_mask, body_row_frac(0.55), body_row_frac(0.95))

    # ── Upper arm widths (left vs right) ──────────────────────────────────────
    arm_frac = body_row_frac(0.28)
    feats.upper_arm_width_left  = _half_mask_width(best_mask, arm_frac, "left")
    feats.upper_arm_width_right = _half_mask_width(best_mask, arm_frac, "right")
    avg_arm = (feats.upper_arm_width_left + feats.upper_arm_width_right) / 2 + 1e-9
    feats.arm_width_symmetry = abs(
        feats.upper_arm_width_left - feats.upper_arm_width_right) / avg_arm

    # ── Thigh widths ──────────────────────────────────────────────────────────
    feats.thigh_width_left  = _half_mask_width(best_mask, thigh_frac, "left")
    feats.thigh_width_right = _half_mask_width(best_mask, thigh_frac, "right")
    avg_thigh = (feats.thigh_width_left + feats.thigh_width_right) / 2 + 1e-9
    feats.thigh_width_symmetry = abs(
        feats.thigh_width_left - feats.thigh_width_right) / avg_thigh

    # ── Contour irregularity (muscle definition proxy) ────────────────────────
    feats.contour_irregularity = _contour_irregularity(best_mask)

    # ── Texture / conditioning ────────────────────────────────────────────────
    img_gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    masked_pixels = img_gray[best_mask > 0]
    if len(masked_pixels) > 0:
        feats.body_brightness_mean = float(np.mean(masked_pixels)) / 255.0
        feats.body_brightness_std  = float(np.std(masked_pixels))  / 255.0

    feats.edge_density_upper = _edge_density(img_gray, best_mask,
                                              body_row_frac(0.05), body_row_frac(0.50))
    feats.edge_density_lower = _edge_density(img_gray, best_mask,
                                              body_row_frac(0.50), body_row_frac(0.95))

    return feats
