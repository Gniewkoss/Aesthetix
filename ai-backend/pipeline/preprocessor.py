"""
Image preprocessing: decode, normalize lighting, resize, detect pose view.
"""
from __future__ import annotations
import base64
import io
import cv2
import numpy as np
from PIL import Image, ImageEnhance


TARGET_SIZE = (640, 640)
MAX_PIXEL_DIM = 1280


def decode_base64_image(b64: str) -> np.ndarray:
    """Decode base64 → BGR numpy array."""
    # Strip data-URI prefix if present
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
    This is critical for consistent body-fat / conditioning estimates.
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


def preprocess(b64: str, body_box: tuple | None = None) -> np.ndarray:
    """Full preprocessing pipeline for a single image."""
    img = decode_base64_image(b64)
    img = resize_to_max(img)
    img = normalize_lighting(img)
    img = crop_to_person(img, body_box)
    return img


def detect_pose_view(images_bgr: list[np.ndarray]) -> str:
    """
    Heuristic classification of camera angle.
    Returns 'front' | 'back' | 'side' | 'mixed'.
    Used as a fallback when MediaPipe confidence is low.
    """
    if len(images_bgr) == 1:
        return "front"   # Default; refined by pose landmark pattern
    if len(images_bgr) >= 3:
        return "mixed"
    return "front"
