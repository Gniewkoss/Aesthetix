"""
Utility functions for region-based analysis.

Helpers for:
  - Converting between RegionCropBundle and feature cache format
  - Visualizing region bounding boxes on images
  - Building feature cache from image directories (offline preprocessing)
  - Score normalization and calibration utilities
"""
from __future__ import annotations

import os
import uuid
from pathlib import Path
from typing import Optional

import cv2
import numpy as np


def draw_region_boxes(
    image: np.ndarray,
    bundle_dict: dict,  # {region_name → RegionCrop}
    draw_labels: bool = True,
) -> np.ndarray:
    """
    Overlay colored bounding boxes for each region on the image.
    Useful for debugging region crops.
    """
    COLORS = {
        "chest":      (0, 255, 0),
        "abs":        (0, 200, 255),
        "left_bicep": (255, 100, 0),
        "right_bicep":(255, 50, 150),
        "shoulders":  (0, 100, 255),
        "lats":       (255, 200, 0),
        "quads":      (100, 255, 100),
        "calves":     (200, 100, 255),
        "full_body":  (128, 128, 128),
    }

    vis = image.copy()
    for name, crop in bundle_dict.items():
        if crop is None or not crop.is_visible:
            continue
        color = COLORS.get(name, (200, 200, 200))
        x1, y1, x2, y2 = crop.bbox_xyxy
        cv2.rectangle(vis, (x1, y1), (x2, y2), color, 2)
        if draw_labels:
            label = f"{name} ({crop.visibility:.2f})"
            cv2.putText(vis, label, (x1, max(0, y1 - 5)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
    return vis


def save_region_crops_to_disk(
    bundle_dict: dict,
    output_dir: str,
    prefix: str = "",
) -> dict[str, str]:
    """Save each region crop as a PNG file. Returns {region_name → file_path}."""
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    paths = {}
    for name, crop in bundle_dict.items():
        if crop is None or not crop.is_visible:
            continue
        filename = f"{prefix}{name}.png" if prefix else f"{name}.png"
        filepath = os.path.join(output_dir, filename)
        cv2.imwrite(filepath, crop.image)
        paths[name] = filepath
    return paths


def build_feature_cache_from_images(
    images_dir: str,
    output_dir: str = "data/feature_cache",
    remove_bg: bool = True,
) -> None:
    """
    Offline preprocessing: extract 416-dim feature vectors from all images
    and save to .npy files in output_dir.

    Each file: {image_stem}.npy → (416,) float32

    This avoids re-running DINOv2 at training time.

    Run before train_muscle_heads or train_ranking:
      python -m utils.region_utils --images-dir data/images/
    """
    from pipeline.preprocessor import preprocess_with_alignment
    from pipeline.segmenter import extract_segmentation_features
    from pipeline.region_cropper import crop_regions
    from pipeline.region_features import extract_region_features
    from models.backbones.dinov2_extractor import BackboneExtractor, EMBED_DIM
    from pipeline.feature_extractor import FEATURE_NAMES, build_feature_vector, feature_vector_to_numpy
    from pipeline.region_features import FEATURE_DIM
    from models.muscle_heads.head_model import MUSCLE_GROUPS

    Path(output_dir).mkdir(parents=True, exist_ok=True)
    backbone = BackboneExtractor.load()

    img_paths = (
        list(Path(images_dir).glob("*.jpg")) +
        list(Path(images_dir).glob("*.jpeg")) +
        list(Path(images_dir).glob("*.png"))
    )
    print(f"[cache] Processing {len(img_paths)} images from {images_dir}")

    for img_path in img_paths:
        out_path = Path(output_dir) / f"{img_path.stem}.npy"
        if out_path.exists():
            continue

        try:
            with open(img_path, "rb") as f:
                import base64
                b64 = base64.b64encode(f.read()).decode()

            img, pose = preprocess_with_alignment(b64, remove_bg=remove_bg)
            seg = extract_segmentation_features(img, pose)
            fv_arr = feature_vector_to_numpy(build_feature_vector(pose, seg))

            body_mask = pose.segmentation_mask
            bundle = crop_regions(img, pose, body_mask=body_mask)

            # Use biceps region as canonical feature vector for this image
            # (or full_body if biceps not visible)
            from pipeline.region_cropper import RegionCrop, CROP_SIZE

            muscle_feats = {}
            for muscle in MUSCLE_GROUPS:
                crop_map = {
                    "chest":     bundle.chest,
                    "abs":       bundle.abs,
                    "biceps":    bundle.left_bicep,
                    "triceps":   bundle.right_bicep,
                    "shoulders": bundle.shoulders,
                    "lats":      bundle.lats,
                    "quads":     bundle.quads,
                    "calves":    bundle.calves,
                }
                crop = crop_map.get(muscle)
                if crop is None or not crop.is_visible:
                    feat = np.zeros(EMBED_DIM + FEATURE_DIM, dtype=np.float32)
                else:
                    bb_emb = backbone.embed_crop(crop.image)
                    hc     = extract_region_features(crop)
                    feat   = np.concatenate([bb_emb, hc])
                muscle_feats[muscle] = feat

            # Save as dict of arrays (one .npy per muscle per image would be cleaner,
            # but for simplicity, save mean across muscles as a single canonical vector)
            all_feats = np.stack(list(muscle_feats.values()), axis=0)  # (8, 416)
            np.save(str(out_path), all_feats)

        except Exception as e:
            print(f"[cache] Failed {img_path.name}: {e}")
            continue

    print(f"[cache] Done. {len(img_paths)} images processed → {output_dir}")


def normalize_scores(
    scores: dict[str, float],
    min_val: float = 0.0,
    max_val: float = 10.0,
) -> dict[str, float]:
    """Clip all scores to [min_val, max_val]."""
    return {
        k: float(np.clip(v, min_val, max_val)) if v is not None else None
        for k, v in scores.items()
    }


def scores_to_stars(score: float, max_stars: int = 5) -> str:
    """Convert [0-10] score to star string for display (e.g., '★★★☆☆')."""
    n_full = int(round(score / 10.0 * max_stars))
    n_full = max(0, min(max_stars, n_full))
    return "★" * n_full + "☆" * (max_stars - n_full)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--images-dir", required=True)
    parser.add_argument("--output-dir", default="data/feature_cache")
    args = parser.parse_args()
    build_feature_cache_from_images(args.images_dir, args.output_dir)
