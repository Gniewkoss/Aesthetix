"""
Dataset management: load JSONL training data, extract features, build tensors.

Dataset format (JSONL, one sample per line):
  See data/schema.json for full schema.
  Key fields: image_paths[], labels{}, metadata{}

Bootstrap strategy for first 500 samples:
  1. Run existing users' images through GPT-4o to get RawMeasurementResponse labels.
  2. Store as .jsonl with source="gpt4o_bootstrap".
  3. Have trainers review / correct ~50-100 samples; mark source="trainer".
  4. Train XGBoost on combined dataset (trainer labels weighted 3×).
  5. As model improves, use it to label new images and review corrections.
"""
from __future__ import annotations
import json
import os
import cv2
import numpy as np
from pathlib import Path
from typing import Optional
from dataclasses import asdict

from pipeline.preprocessor import preprocess, preprocess_with_alignment
from pipeline.pose_estimator import extract_pose_features
from pipeline.segmenter import extract_segmentation_features
from pipeline.feature_extractor import build_feature_vector, feature_vector_to_numpy
from models.measurement_model import TARGETS, TARGET_NAMES, NULL_SENTINEL, NULLABLE_TARGETS

DATA_ROOT = Path(os.getenv("DATA_ROOT", "data"))


def resolve_image_path(path: str) -> str:
    """Resolve image path relative to DATA_ROOT or cwd."""
    p = Path(path)
    if p.is_file():
        return str(p)
    for base in (DATA_ROOT, Path.cwd(), Path.cwd() / "data"):
        candidate = base / path
        if candidate.is_file():
            return str(candidate)
    return str(p)


def load_jsonl(path: str) -> list[dict]:
    samples = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line:
                samples.append(json.loads(line))
    return samples


def labels_to_target_vector(labels: dict) -> np.ndarray:
    """Convert labels dict → float32 array of shape (N_TARGETS,)."""
    vec = np.zeros(len(TARGETS), dtype=np.float32)
    for i, (name, typ, lo, hi) in enumerate(TARGETS):
        val = labels.get(name)
        if val is None:
            vec[i] = NULL_SENTINEL
        else:
            vec[i] = float(val)
    return vec


SOURCE_WEIGHTS = {
    "trainer": 3.0,
    "gpt4o_bootstrap": 1.0,
    "model_labeled": 1.0,
    "user_corrected": 2.0,
    "pose_dataset_bootstrap": 0.5,
}


def process_sample(sample: dict, cache_dir: Optional[str] = None) -> Optional[tuple]:
    """
    Process one dataset sample → (feature_vec, target_vec, weight).
    Returns None if processing fails.

    If the sample contains a pre-computed "feature_vector" (list of 50 floats),
    the image pipeline is skipped — useful for synthetic or pose-dataset-derived data.
    """
    source = sample.get("source", "gpt4o_bootstrap")
    weight = SOURCE_WEIGHTS.get(source, 1.0)

    # Fast path: pre-computed feature vector (synthetic / pose bootstrap data)
    if "feature_vector" in sample:
        fv = sample["feature_vector"]
        if len(fv) in (50, 56):   # Accept both v1 (50) and v2 (56) feature vectors
            features = np.array(fv, dtype=np.float32)
            labels = sample.get("labels", {})
            targets = labels_to_target_vector(labels)
            cache_key = sample.get("image_id", "")
            if cache_dir and cache_key:
                cache_path = Path(cache_dir) / f"{cache_key}.npz"
                cache_path.parent.mkdir(parents=True, exist_ok=True)
                np.savez(cache_path, features=features, targets=targets,
                         weight=np.array(weight))
            return features, targets, weight

    image_paths = sample.get("image_paths", [])
    if not image_paths:
        return None

    cache_key = sample.get("image_id", "")
    cache_path = Path(cache_dir) / f"{cache_key}.npz" if cache_dir else None
    if cache_path and cache_path.exists():
        npz = np.load(cache_path)
        feats_cached = npz["features"]
        # Invalidate v1 cache (50 features) — v2 pipeline produces 56 features
        if feats_cached.shape[0] == 50:
            cache_path.unlink(missing_ok=True)
        else:
            return feats_cached, npz["targets"], float(npz["weight"])

    # Process each image, aggregate features
    per_image_features = []
    for path in image_paths:
        resolved = resolve_image_path(path)
        if not os.path.exists(resolved):
            continue
        try:
            with open(resolved, "rb") as f:
                b64 = __import__("base64").b64encode(f.read()).decode()
            # v2: pose-aligned + background removal for cleaner feature extraction
            img, pose = preprocess_with_alignment(b64, remove_bg=True)
        except Exception:
            try:
                img = cv2.imread(resolved)
                if img is None:
                    continue
                pose = extract_pose_features(img)
            except Exception:
                continue

        # Landmark-guided segmentation (pose passed explicitly)
        seg = extract_segmentation_features(img, pose)
        fv = build_feature_vector(pose, seg)
        per_image_features.append(feature_vector_to_numpy(fv))

    if not per_image_features:
        return None

    features = np.mean(np.stack(per_image_features, axis=0), axis=0)

    labels = sample.get("labels", {})
    targets = labels_to_target_vector(labels)

    source = sample.get("source", "gpt4o_bootstrap")
    weight = SOURCE_WEIGHTS.get(source, 1.0)

    if cache_path:
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        np.savez(cache_path, features=features, targets=targets, weight=np.array(weight))

    return features, targets, weight


def build_dataset(jsonl_path: str, cache_dir: Optional[str] = None,
                  max_samples: Optional[int] = None) -> tuple:
    """
    Load JSONL dataset → (X, y, weights) numpy arrays.
    Skips failed samples with a warning.
    """
    samples = load_jsonl(jsonl_path)
    if max_samples:
        samples = samples[:max_samples]

    X_list, y_list, w_list = [], [], []
    for i, sample in enumerate(samples):
        result = process_sample(sample, cache_dir)
        if result is None:
            print(f"[dataset] Skipping sample {i}: processing failed")
            continue
        features, targets, weight = result
        X_list.append(features)
        y_list.append(targets)
        w_list.append(weight)

    if not X_list:
        raise ValueError(f"No valid samples found in {jsonl_path}")

    X = np.stack(X_list, axis=0)
    y = np.stack(y_list, axis=0)
    w = np.array(w_list, dtype=np.float32)
    print(f"[dataset] Loaded {len(X)} samples from {jsonl_path}")
    return X, y, w


