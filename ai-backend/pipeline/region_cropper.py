"""
Stage 3: Region Cropping — keypoint-guided bounding boxes for each muscle group.

MediaPipe 33-landmark skeleton → 9 anatomical regions:
  chest, abs, left_bicep, right_bicep, shoulders,
  lats (back-only), quads, calves, full_body

Each region returns:
  - cropped BGR image (padded to square, resized to CROP_SIZE)
  - binary mask (body pixels only, None if segmentation unavailable)
  - visibility score (mean landmark visibility for the region)
  - is_visible flag (False → skip inference for this region)
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Optional

import cv2
import numpy as np

from pipeline.pose_estimator import (
    PoseFeatures,
    LEFT_SHOULDER, RIGHT_SHOULDER,
    LEFT_ELBOW, RIGHT_ELBOW,
    LEFT_WRIST, RIGHT_WRIST,
    LEFT_HIP, RIGHT_HIP,
    LEFT_KNEE, RIGHT_KNEE,
    LEFT_ANKLE, RIGHT_ANKLE,
)

CROP_SIZE = 224          # pixels — matches ViT patch grid (14×14 patches of 16px)
VIS_THRESHOLD = 0.35     # landmark visibility below this → region marked not visible
PAD_RATIO = 0.15         # padding added around tight bounding box


@dataclass
class RegionCrop:
    name: str
    image: np.ndarray          # (CROP_SIZE, CROP_SIZE, 3) uint8 BGR
    mask: Optional[np.ndarray] # (CROP_SIZE, CROP_SIZE) float32 0-1, or None
    visibility: float          # mean landmark visibility
    is_visible: bool
    bbox_xyxy: tuple           # (x1, y1, x2, y2) in original pixel coords


@dataclass
class RegionCropBundle:
    chest: Optional[RegionCrop] = None
    abs: Optional[RegionCrop] = None
    left_bicep: Optional[RegionCrop] = None
    right_bicep: Optional[RegionCrop] = None
    shoulders: Optional[RegionCrop] = None
    lats: Optional[RegionCrop] = None
    quads: Optional[RegionCrop] = None
    calves: Optional[RegionCrop] = None
    full_body: Optional[RegionCrop] = None

    def visible_regions(self) -> list[str]:
        result = []
        for name in ("chest", "abs", "left_bicep", "right_bicep", "shoulders",
                     "lats", "quads", "calves", "full_body"):
            crop = getattr(self, name)
            if crop is not None and crop.is_visible:
                result.append(name)
        return result

    def as_dict(self) -> dict[str, RegionCrop]:
        return {
            name: getattr(self, name)
            for name in ("chest", "abs", "left_bicep", "right_bicep", "shoulders",
                         "lats", "quads", "calves", "full_body")
            if getattr(self, name) is not None
        }


def crop_regions(
    image: np.ndarray,
    pose: PoseFeatures,
    body_mask: Optional[np.ndarray] = None,
) -> RegionCropBundle:
    """
    Main entry point. Produces RegionCropBundle from a preprocessed image + pose.

    Args:
        image:      BGR uint8 (H, W, 3)
        pose:       PoseFeatures with .landmarks and .visibility
        body_mask:  optional (H, W) float32 segmentation mask from MediaPipe/YOLO
    """
    if not pose.detected or len(pose.landmarks) < 29:
        return _fallback_crops(image, body_mask)

    h, w = image.shape[:2]
    lm  = pose.landmarks    # list of (x_norm, y_norm)
    vis = pose.visibility   # list of float

    def px(idx: int) -> tuple[int, int]:
        x, y = lm[idx]
        return int(x * w), int(y * h)

    def v(idx: int) -> float:
        return vis[idx] if idx < len(vis) else 0.0

    ls, rs = px(LEFT_SHOULDER), px(RIGHT_SHOULDER)
    le, re = px(LEFT_ELBOW), px(RIGHT_ELBOW)
    lw, rw = px(LEFT_WRIST), px(RIGHT_WRIST)
    lh, rh = px(LEFT_HIP), px(RIGHT_HIP)
    lk, rk = px(LEFT_KNEE), px(RIGHT_KNEE)
    la, ra = px(LEFT_ANKLE), px(RIGHT_ANKLE)

    shl_span   = abs(rs[0] - ls[0])
    torso_span = max(1, abs((lh[1] + rh[1]) // 2 - (ls[1] + rs[1]) // 2))

    # ── chest ─────────────────────────────────────────────────────────────────
    # from shoulders down ~45% of torso height, full shoulder width + padding
    chest_vis  = (v(LEFT_SHOULDER) + v(RIGHT_SHOULDER)) / 2
    chest_top  = min(ls[1], rs[1]) - int(shl_span * 0.15)
    chest_bot  = min(ls[1], rs[1]) + int(torso_span * 0.45)
    chest_left = min(ls[0], rs[0]) - int(shl_span * 0.25)
    chest_right= max(ls[0], rs[0]) + int(shl_span * 0.25)
    chest_crop = _make_crop(image, body_mask, "chest",
                            chest_left, chest_top, chest_right, chest_bot,
                            chest_vis, h, w)

    # ── abs ───────────────────────────────────────────────────────────────────
    hip_mid_y  = (lh[1] + rh[1]) // 2
    abs_vis    = (v(LEFT_HIP) + v(RIGHT_HIP) + v(LEFT_SHOULDER) + v(RIGHT_SHOULDER)) / 4
    abs_top    = min(ls[1], rs[1]) + int(torso_span * 0.40)
    abs_bot    = hip_mid_y + int(torso_span * 0.10)
    abs_half   = int(shl_span * 0.40)
    mid_x      = (lh[0] + rh[0]) // 2
    abs_crop   = _make_crop(image, body_mask, "abs",
                            mid_x - abs_half, abs_top,
                            mid_x + abs_half, abs_bot,
                            abs_vis, h, w)

    # ── biceps (left/right upper arm) ─────────────────────────────────────────
    arm_w = max(12, int(abs(ls[0] - rs[0]) * 0.18))   # ~18% of shoulder span

    lb_vis  = (v(LEFT_SHOULDER) + v(LEFT_ELBOW)) / 2
    lb_cx   = (ls[0] + le[0]) // 2
    lb_cy   = (ls[1] + le[1]) // 2
    arm_len = max(20, int(math.dist(ls, le) * 1.1))
    lb_crop = _make_crop(image, body_mask, "left_bicep",
                         lb_cx - arm_w, lb_cy - arm_len // 2,
                         lb_cx + arm_w, lb_cy + arm_len // 2,
                         lb_vis, h, w)

    rb_vis  = (v(RIGHT_SHOULDER) + v(RIGHT_ELBOW)) / 2
    rb_cx   = (rs[0] + re[0]) // 2
    rb_cy   = (rs[1] + re[1]) // 2
    rb_crop = _make_crop(image, body_mask, "right_bicep",
                         rb_cx - arm_w, rb_cy - arm_len // 2,
                         rb_cx + arm_w, rb_cy + arm_len // 2,
                         rb_vis, h, w)

    # ── shoulders (wide crop around shoulder girdle) ───────────────────────────
    shl_vis  = (v(LEFT_SHOULDER) + v(RIGHT_SHOULDER)) / 2
    shl_pad  = int(shl_span * 0.30)
    shl_top  = min(ls[1], rs[1]) - int(shl_span * 0.35)
    shl_bot  = min(ls[1], rs[1]) + int(torso_span * 0.25)
    shl_crop = _make_crop(image, body_mask, "shoulders",
                          min(ls[0], rs[0]) - shl_pad,
                          shl_top,
                          max(ls[0], rs[0]) + shl_pad,
                          shl_bot,
                          shl_vis, h, w)

    # ── lats (back view only — wide torso crop for V-taper) ───────────────────
    lats_vis = (v(LEFT_SHOULDER) + v(RIGHT_SHOULDER) + v(LEFT_HIP) + v(RIGHT_HIP)) / 4
    lats_vis_adj = lats_vis if pose.pose_type in ("back", "mixed") else 0.0
    lat_pad  = int(shl_span * 0.45)
    lats_crop = _make_crop(image, body_mask, "lats",
                           min(ls[0], rs[0]) - lat_pad,
                           min(ls[1], rs[1]) - int(shl_span * 0.2),
                           max(ls[0], rs[0]) + lat_pad,
                           (lh[1] + rh[1]) // 2,
                           lats_vis_adj, h, w)

    # ── quads (thigh region) ──────────────────────────────────────────────────
    quad_vis = (v(LEFT_HIP) + v(RIGHT_HIP) + v(LEFT_KNEE) + v(RIGHT_KNEE)) / 4
    quad_top = (lh[1] + rh[1]) // 2
    quad_bot = (lk[1] + rk[1]) // 2 + int(abs(lk[1] - (lh[1] + rh[1]) // 2) * 0.15)
    quad_half = max(30, int(abs(lh[0] - rh[0]) * 0.75))
    quad_mid  = (lh[0] + rh[0]) // 2
    quads_crop = _make_crop(image, body_mask, "quads",
                            quad_mid - quad_half, quad_top,
                            quad_mid + quad_half, quad_bot,
                            quad_vis, h, w)

    # ── calves ────────────────────────────────────────────────────────────────
    calf_vis = (v(LEFT_KNEE) + v(RIGHT_KNEE) + v(LEFT_ANKLE) + v(RIGHT_ANKLE)) / 4
    calf_top = (lk[1] + rk[1]) // 2
    calf_bot = max(la[1], ra[1]) + int(abs(la[1] - lk[1]) * 0.10)
    calf_half = max(25, int(abs(lk[0] - rk[0]) * 0.75))
    calf_mid  = (lk[0] + rk[0]) // 2
    calves_crop = _make_crop(image, body_mask, "calves",
                             calf_mid - calf_half, calf_top,
                             calf_mid + calf_half, calf_bot,
                             calf_vis, h, w)

    # ── full body (global context) ────────────────────────────────────────────
    all_x = [ls[0], rs[0], lh[0], rh[0]]
    all_y = [min(ls[1], rs[1]), max(la[1], ra[1])]
    fb_vis = pose.landmark_visibility_mean
    fb_pad_x = int((max(all_x) - min(all_x)) * 0.12)
    full_crop = _make_crop(image, body_mask, "full_body",
                           min(all_x) - fb_pad_x, max(0, min(all_y) - 20),
                           max(all_x) + fb_pad_x, min(h - 1, max(all_y) + 10),
                           fb_vis, h, w)

    return RegionCropBundle(
        chest=chest_crop,
        abs=abs_crop,
        left_bicep=lb_crop,
        right_bicep=rb_crop,
        shoulders=shl_crop,
        lats=lats_crop,
        quads=quads_crop,
        calves=calves_crop,
        full_body=full_crop,
    )


def _make_crop(
    image: np.ndarray,
    mask: Optional[np.ndarray],
    name: str,
    x1: int, y1: int, x2: int, y2: int,
    visibility: float,
    h: int, w: int,
) -> RegionCrop:
    x1 = max(0, int(x1))
    y1 = max(0, int(y1))
    x2 = min(w - 1, int(x2))
    y2 = min(h - 1, int(y2))

    is_visible = visibility >= VIS_THRESHOLD and (x2 - x1) > 8 and (y2 - y1) > 8

    if not is_visible or x2 <= x1 or y2 <= y1:
        blank = np.zeros((CROP_SIZE, CROP_SIZE, 3), dtype=np.uint8)
        return RegionCrop(name, blank, None, visibility, False, (x1, y1, x2, y2))

    # Pad bounding box
    bw, bh = x2 - x1, y2 - y1
    px = int(bw * PAD_RATIO)
    py = int(bh * PAD_RATIO)
    x1p = max(0, x1 - px)
    y1p = max(0, y1 - py)
    x2p = min(w - 1, x2 + px)
    y2p = min(h - 1, y2 + py)

    crop_img  = image[y1p:y2p, x1p:x2p].copy()
    crop_mask = None
    if mask is not None:
        crop_mask = mask[y1p:y2p, x1p:x2p].copy()

    # Pad to square then resize
    crop_img  = _pad_to_square(crop_img)
    crop_img  = cv2.resize(crop_img, (CROP_SIZE, CROP_SIZE),
                           interpolation=cv2.INTER_LINEAR)

    if crop_mask is not None:
        crop_mask = _pad_to_square(crop_mask[..., np.newaxis]).squeeze(-1)
        crop_mask = cv2.resize(crop_mask, (CROP_SIZE, CROP_SIZE),
                               interpolation=cv2.INTER_NEAREST).astype(np.float32)

    return RegionCrop(
        name=name,
        image=crop_img,
        mask=crop_mask,
        visibility=float(visibility),
        is_visible=True,
        bbox_xyxy=(x1p, y1p, x2p, y2p),
    )


def _pad_to_square(arr: np.ndarray) -> np.ndarray:
    """Zero-pad any 2D/3D array to square along the shorter axis."""
    if arr.ndim == 2:
        h, w = arr.shape
        pad = abs(h - w)
        if h < w:
            arr = np.pad(arr, ((pad // 2, pad - pad // 2), (0, 0)))
        elif w < h:
            arr = np.pad(arr, ((0, 0), (pad // 2, pad - pad // 2)))
    else:
        h, w = arr.shape[:2]
        pad = abs(h - w)
        if h < w:
            arr = np.pad(arr, ((pad // 2, pad - pad // 2), (0, 0), (0, 0)))
        elif w < h:
            arr = np.pad(arr, ((0, 0), (pad // 2, pad - pad // 2), (0, 0)))
    return arr


def _fallback_crops(
    image: np.ndarray,
    body_mask: Optional[np.ndarray],
) -> RegionCropBundle:
    """No pose detected — return a single full-body crop, all others invisible."""
    h, w = image.shape[:2]
    fb = image.copy()
    mask = body_mask.copy() if body_mask is not None else None
    if mask is not None:
        mask = _pad_to_square(mask[..., np.newaxis]).squeeze(-1)
        mask = cv2.resize(mask, (CROP_SIZE, CROP_SIZE),
                          interpolation=cv2.INTER_NEAREST).astype(np.float32)
    fb = _pad_to_square(fb)
    fb = cv2.resize(fb, (CROP_SIZE, CROP_SIZE))
    full_crop = RegionCrop("full_body", fb, mask, 0.5, True, (0, 0, w - 1, h - 1))

    blank = RegionCrop("", np.zeros((CROP_SIZE, CROP_SIZE, 3), np.uint8),
                       None, 0.0, False, (0, 0, 0, 0))
    return RegionCropBundle(
        chest=blank, abs=blank, left_bicep=blank, right_bicep=blank,
        shoulders=blank, lats=blank, quads=blank, calves=blank,
        full_body=full_crop,
    )
