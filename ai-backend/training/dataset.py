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

from pipeline.preprocessor import preprocess
from pipeline.pose_estimator import extract_pose_features
from pipeline.segmenter import extract_segmentation_features
from pipeline.feature_extractor import build_feature_vector, feature_vector_to_numpy
from models.measurement_model import TARGETS, TARGET_NAMES, NULL_SENTINEL, NULLABLE_TARGETS


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


def process_sample(sample: dict, cache_dir: Optional[str] = None) -> Optional[tuple]:
    """
    Process one dataset sample → (feature_vec, target_vec, weight).
    Returns None if processing fails.
    """
    image_paths = sample.get("image_paths", [])
    if not image_paths:
        return None

    cache_key = sample.get("image_id", "")
    cache_path = Path(cache_dir) / f"{cache_key}.npz" if cache_dir else None
    if cache_path and cache_path.exists():
        npz = np.load(cache_path)
        return npz["features"], npz["targets"], float(npz["weight"])

    # Process each image, aggregate features
    per_image_features = []
    for path in image_paths:
        if not os.path.exists(path):
            continue
        try:
            with open(path, "rb") as f:
                b64 = __import__("base64").b64encode(f.read()).decode()
            img = preprocess(b64)
        except Exception:
            try:
                img = cv2.imread(path)
                if img is None:
                    continue
            except Exception:
                continue

        pose = extract_pose_features(img)
        seg = extract_segmentation_features(img)
        fv = build_feature_vector(pose, seg)
        per_image_features.append(feature_vector_to_numpy(fv))

    if not per_image_features:
        return None

    features = np.mean(np.stack(per_image_features, axis=0), axis=0)

    labels = sample.get("labels", {})
    targets = labels_to_target_vector(labels)

    # Trainer-labeled samples get 3× weight vs GPT bootstrap labels
    source = sample.get("source", "gpt4o_bootstrap")
    weight = 3.0 if source == "trainer" else 1.0

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


def generate_bootstrap_labels(image_paths: list[str], openai_client) -> dict:
    """
    Use GPT-4o to generate initial labels for bootstrapping.
    Only needed until you have 200+ trainer-labeled samples.
    """
    import base64
    from constants import VISUAL_MEASUREMENT_PROMPT  # if accessible

    # Build messages with all images
    contents = []
    for path in image_paths:
        with open(path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode()
        contents.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{b64}", "detail": "high"}
        })
    contents.append({"type": "text", "text": VISUAL_MEASUREMENT_PROMPT})

    resp = openai_client.chat.completions.create(
        model="gpt-4o",
        max_tokens=1024,
        messages=[{"role": "user", "content": contents}],
        response_format={"type": "json_object"},
    )
    return json.loads(resp.choices[0].message.content)
