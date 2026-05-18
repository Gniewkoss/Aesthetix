"""
Image preprocessing: decode, normalize lighting, resize, detect pose view.

v2 additions:
  - align_with_pose(): rotate image so shoulders are horizontal (max ±15°).
    Consistent pose alignment makes all width measurements stable across
    photos taken at different angles or where subjects stand slightly tilted.
  - remove_background(): use the MediaPipe segmentation mask (already computed
    by pose_estimator) to zero out the background before YOLO segmentation.
    This prevents spurious edges/textures in the background from polluting
    edge_density and brightness features.
"""
from __future__ import annotations
import base64
import io
import math
import cv2
import numpy as np
from PIL import Image, ImageEnhance
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from pipeline.pose_estimator import PoseFeatures

TARGET_SIZE = (640, 640)
MAX_PIXEL_DIM = 1280
_BG_FILL = (128, 128, 128)   # Mid-grey background for removed pixels


def decode_base64_image(b64: str) -> np.ndarray:
    """Decode base64 → BGR numpy array."""
    if "," in b64:
        b64 = b64.split(",", 1)[1]
    data = base64.b64decode(b64)
    pil = Image.open(io.BytesIO(data)).convert("RGB")
    return cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)


def resize_to_max(img: np.ndarray, max_dim: int = MAX_PIXEL_DIM) -> np.ndarray:
    h, w = img.shape[:2]
    scale = min(max_dim / max(h, w), 1.0)
    if scale < 1.0:
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    return img


def normalize_lighting(img: np.ndarray) -> np.ndarray:
    """
    CLAHE on L channel (Lab) to reduce harsh shadows and camera-specific exposure.
    Critical for consistent body-fat / conditioning estimates.
    """
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2Lab)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_eq = clahe.apply(l)
    lab_eq = cv2.merge([l_eq, a, b])
    return cv2.cvtColor(lab_eq, cv2.COLOR_Lab2BGR)


def crop_to_person(img: np.ndarray, body_box: tuple | None) -> np.ndarray:
    """If a bounding box is provided, crop with 10% margin."""
    if body_box is None:
        return img
    h, w = img.shape[:2]
    x1, y1, x2, y2 = body_box
    margin_x = int((x2 - x1) * 0.10)
    margin_y = int((y2 - y1) * 0.10)
    x1 = max(0, x1 - margin_x)
    y1 = max(0, y1 - margin_y)
    x2 = min(w, x2 + margin_x)
    y2 = min(h, y2 + margin_y)
    return img[y1:y2, x1:x2]


def align_with_pose(img: np.ndarray,
                    pose: "PoseFeatures",
                    max_angle_deg: float = 15.0) -> np.ndarray:
    """
    Rotate the image so that the shoulder line is horizontal.

    Consistent pose alignment ensures that silhouette width measurements are
    taken at anatomically correct horizontal slices regardless of how the
    subject is standing. Without this, a 5° lean changes the apparent waist
    width by ~8%.

    Only corrects tilts within ±max_angle_deg to avoid over-rotating
    ambiguous poses.
    """
    if not pose.detected or len(pose.landmarks) < 13:
        return img

    from pipeline.pose_estimator import LEFT_SHOULDER, RIGHT_SHOULDER
    lm = pose.landmarks
    vis = pose.visibility

    ls_vis = vis[LEFT_SHOULDER]
    rs_vis = vis[RIGHT_SHOULDER]
    if ls_vis < 0.4 or rs_vis < 0.4:
        return img

    ls = lm[LEFT_SHOULDER]
    rs = lm[RIGHT_SHOULDER]

    # Angle of shoulder line from horizontal
    dx = rs[0] - ls[0]
    dy = rs[1] - ls[1]
    angle_deg = math.degrees(math.atan2(dy, dx))

    if abs(angle_deg) > max_angle_deg:
        return img   # Too tilted — could be a side pose, don't rotate

    if abs(angle_deg) < 1.0:
        return img   # Already level — skip

    h, w = img.shape[:2]
    cx, cy = w / 2.0, h / 2.0
    M = cv2.getRotationMatrix2D((cx, cy), angle_deg, 1.0)
    aligned = cv2.warpAffine(img, M, (w, h),
                              flags=cv2.INTER_LINEAR,
                              borderMode=cv2.BORDER_REFLECT_101)
    return aligned


def remove_background(img: np.ndarray,
                      seg_mask: np.ndarray,
                      threshold: float = 0.4,
                      fill_color: tuple = _BG_FILL) -> np.ndarray:
    """
    Use a segmentation mask (float32, 0-1) to replace background with a
    neutral mid-grey. Applied before YOLO segmentation to remove spurious
    background textures from edge density and brightness features.

    The mask comes from MediaPipe Pose (enable_segmentation=True) and is
    free — no extra inference cost.
    """
    h, w = img.shape[:2]
    if seg_mask.shape[:2] != (h, w):
        seg_mask = cv2.resize(seg_mask, (w, h), interpolation=cv2.INTER_LINEAR)

    person_mask = (seg_mask >= threshold).astype(np.uint8)
    # Dilate slightly to avoid cutting edge pixels
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    person_mask = cv2.dilate(person_mask, kernel, iterations=1)

    bg = np.full_like(img, fill_color, dtype=np.uint8)
    mask3 = np.stack([person_mask] * 3, axis=-1)
    return np.where(mask3 > 0, img, bg)


def preprocess(b64: str, body_box: tuple | None = None) -> np.ndarray:
    """Full preprocessing pipeline for a single image (no pose alignment)."""
    img = decode_base64_image(b64)
    img = resize_to_max(img)
    img = normalize_lighting(img)
    img = crop_to_person(img, body_box)
    return img


def preprocess_with_alignment(b64: str,
                               body_box: tuple | None = None,
                               remove_bg: bool = True) -> tuple[np.ndarray, "PoseFeatures"]:
    """
    Extended pipeline: decode → resize → CLAHE → crop →
    pose estimate → align → optional bg removal.

    Returns (preprocessed_img, pose_features) so the caller can reuse
    the pose features for segmentation without a second MediaPipe call.

    `remove_bg=True` replaces background with mid-grey using the MediaPipe
    segmentation mask. This dramatically reduces false edges in the edge
    density features for images with busy backgrounds.
    """
    from pipeline.pose_estimator import extract_pose_features

    img = decode_base64_image(b64)
    img = resize_to_max(img)
    img = normalize_lighting(img)
    img = crop_to_person(img, body_box)

    # First pose pass on raw image
    pose = extract_pose_features(img)

    # Correct tilt when both shoulders are visible
    if pose.detected:
        img = align_with_pose(img, pose)
        # Re-run pose on the aligned image for accurate landmark coordinates
        pose = extract_pose_features(img)

    # Optional: replace background with neutral grey
    if remove_bg and pose.detected and pose.segmentation_mask is not None:
        img = remove_background(img, pose.segmentation_mask)

    return img, pose


def detect_pose_view(images_bgr: list[np.ndarray]) -> str:
    """
    Heuristic classification of camera angle.
    Returns 'front' | 'back' | 'side' | 'mixed'.
    """
    if len(images_bgr) == 1:
        return "front"
    if len(images_bgr) >= 3:
        return "mixed"
    return "front"
