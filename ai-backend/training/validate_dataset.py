"""Validate train.jsonl before training."""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

from models.measurement_model import TARGET_NAMES, TARGET_RANGE, TARGET_TYPES
from training.dataset import resolve_image_path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", default="data/train.jsonl")
    args = parser.parse_args()

    path = Path(args.dataset)
    if not path.exists():
        print(f"ERROR: {path} not found", file=sys.stderr)
        sys.exit(1)

    samples = []
    with path.open() as f:
        for i, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                samples.append(json.loads(line))
            except json.JSONDecodeError as e:
                print(f"Line {i}: invalid JSON — {e}", file=sys.stderr)
                sys.exit(1)

    if not samples:
        print("ERROR: empty dataset", file=sys.stderr)
        sys.exit(1)

    missing_images = 0
    bad_labels = 0
    sources = Counter(s.get("source", "gpt4o_bootstrap") for s in samples)

    for s in samples:
        # Samples with pre-computed feature_vector skip image path validation
        has_feature_vector = (
            "feature_vector" in s and len(s["feature_vector"]) == 50
        )
        if not has_feature_vector:
            for p in s.get("image_paths", []):
                if not Path(resolve_image_path(p)).exists():
                    missing_images += 1
                    print(f"  missing: {p} (id={s.get('image_id')})")

        labels = s.get("labels", {})
        for name in TARGET_NAMES:
            val = labels.get(name)
            if val is None:
                continue
            lo, hi = TARGET_RANGE[name]
            if TARGET_TYPES[name] == "ordinal":
                if not (lo <= int(val) <= hi):
                    bad_labels += 1
                    print(f"  out of range {name}={val} (id={s.get('image_id')})")
            elif not (lo <= float(val) <= hi):
                bad_labels += 1
                print(f"  out of range {name}={val} (id={s.get('image_id')})")

    print(f"Samples: {len(samples)}")
    print(f"Sources: {dict(sources)}")
    print(f"Trainer-labeled: {sources.get('trainer', 0)} (weighted 3× in training)")
    print(f"Missing image files: {missing_images}")
    print(f"Out-of-range labels: {bad_labels}")

    if missing_images:
        sys.exit(1)
    if len(samples) < 30:
        print("WARNING: <30 samples — model will overfit. Target 200+ bootstrap + 50 trainer.")
    elif len(samples) < 100:
        print("OK for first experiment. Target 200+ for production quality.")


if __name__ == "__main__":
    main()
