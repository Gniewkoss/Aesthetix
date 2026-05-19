"""
Pairwise Comparison Labeling Tool.

Collects human annotations of the form:
  "Image A has better {muscle} development than Image B"

Two interfaces:
  1. CLI (terminal): shows image paths, asks Y/N for each comparison
  2. FastAPI endpoint: /label/pairwise — for integration into admin UI

Output format (data/pairwise_labels.jsonl):
  {
    "id_a": "uuid_or_path",
    "id_b": "uuid_or_path",
    "muscle": "biceps",
    "preferred": "a",      // "a" | "b" | "equal"
    "confidence": 1.0,     // labeler confidence 0-1
    "labeler": "user_id",
    "ts": 1716000000
  }

Sampling strategy:
  - Sample pairs that maximize information gain:
    * Prefer pairs with closest current predicted scores (uncertainty reduction)
    * Sample across all muscle groups proportionally
    * Avoid redundant pairs (already compared)

Usage (CLI):
  python -m training.labeling.pairwise_collector \\
    --images-dir data/images/ \\
    --output data/pairwise_labels.jsonl \\
    --muscle biceps

Usage (batch, random sampling):
  python -m training.labeling.pairwise_collector \\
    --random-pairs 100 \\
    --images-dir data/images/
"""
from __future__ import annotations

import argparse
import json
import os
import random
import time
import uuid
from pathlib import Path
from typing import Optional

SUPPORTED_MUSCLES = [
    "chest", "abs", "biceps", "triceps",
    "shoulders", "lats", "quads", "calves",
]

OUTPUT_PATH = "data/pairwise_labels.jsonl"


def load_existing_pairs(output_path: str) -> set[tuple]:
    """Load existing pairs to avoid re-labeling."""
    seen: set[tuple] = set()
    p = Path(output_path)
    if not p.exists():
        return seen
    with open(p) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
                seen.add((rec["id_a"], rec["id_b"], rec["muscle"]))
                seen.add((rec["id_b"], rec["id_a"], rec["muscle"]))
            except (json.JSONDecodeError, KeyError):
                pass
    return seen


def save_label(
    output_path: str,
    id_a: str,
    id_b: str,
    muscle: str,
    preferred: str,
    confidence: float = 1.0,
    labeler: str = "anonymous",
) -> None:
    """Append a single pairwise label to the JSONL file."""
    rec = {
        "id_a": id_a,
        "id_b": id_b,
        "muscle": muscle,
        "preferred": preferred,
        "confidence": confidence,
        "labeler": labeler,
        "ts": int(time.time()),
    }
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "a") as f:
        f.write(json.dumps(rec) + "\n")


def sample_pairs_informative(
    image_ids: list[str],
    scores: Optional[dict[str, dict[str, float]]],  # {id → {muscle → score}}
    muscle: str,
    n: int = 10,
    seen: Optional[set] = None,
) -> list[tuple[str, str]]:
    """
    Sample pairs that maximize information gain.

    Strategy:
      1. If scores available: prefer pairs with closest predicted scores
         (most uncertain comparisons → most informative labels)
      2. Else: random sampling

    Returns list of (id_a, id_b) tuples.
    """
    seen = seen or set()
    available = [(a, b) for i, a in enumerate(image_ids)
                 for b in image_ids[i + 1:]
                 if (a, b, muscle) not in seen]

    if not available:
        return []

    if scores is not None:
        # Sort by closeness of predicted scores
        def score_diff(pair: tuple) -> float:
            a, b = pair
            sa = scores.get(a, {}).get(muscle, 5.0)
            sb = scores.get(b, {}).get(muscle, 5.0)
            return abs(sa - sb)

        available.sort(key=score_diff)
        # Pick mostly close pairs (informative) but sample some random (exploration)
        n_informative = int(n * 0.7)
        n_random      = n - n_informative
        pairs = available[:n_informative]
        if available[n_informative:]:
            pairs += random.sample(available[n_informative:],
                                   min(n_random, len(available[n_informative:])))
    else:
        pairs = random.sample(available, min(n, len(available)))

    return pairs


def run_cli_labeling(
    images_dir: str,
    output_path: str = OUTPUT_PATH,
    muscle: str = "biceps",
    n_pairs: int = 20,
    labeler: str = "anonymous",
) -> None:
    """
    Interactive CLI labeling session.
    Shows image paths and asks the labeler to compare them.
    """
    images_dir_path = Path(images_dir)
    image_paths = sorted(list(images_dir_path.glob("*.jpg")) +
                         list(images_dir_path.glob("*.png")) +
                         list(images_dir_path.glob("*.jpeg")))

    if len(image_paths) < 2:
        print(f"Need at least 2 images in {images_dir}. Found {len(image_paths)}.")
        return

    image_ids = [str(p) for p in image_paths]
    seen      = load_existing_pairs(output_path)
    pairs     = sample_pairs_informative(image_ids, None, muscle, n=n_pairs, seen=seen)

    print(f"\n=== Pairwise Labeling: {muscle.upper()} ===")
    print(f"Comparing {len(pairs)} pairs. Press:")
    print("  a = Image A is better")
    print("  b = Image B is better")
    print("  e = Equal / can't tell")
    print("  s = Skip\n")

    labeled = 0
    for id_a, id_b in pairs:
        print(f"\nPair {labeled + 1}/{len(pairs)}")
        print(f"  A: {id_a}")
        print(f"  B: {id_b}")

        while True:
            try:
                choice = input("  Comparison [a/b/e/s]: ").strip().lower()
            except (EOFError, KeyboardInterrupt):
                print(f"\nStopped. Saved {labeled} labels.")
                return

            if choice == "s":
                break
            if choice in ("a", "b", "e", "equal"):
                pref = "a" if choice == "a" else ("b" if choice == "b" else "equal")
                save_label(output_path, id_a, id_b, muscle, pref, labeler=labeler)
                labeled += 1
                break
            print("  Invalid input. Use a/b/e/s.")

    print(f"\nDone. Saved {labeled} new labels to {output_path}")
    print(f"Total labels: {labeled + len(seen) // 3}")


def generate_synthetic_pairs_from_jsonl(
    train_jsonl: str = "data/train.jsonl",
    output_path: str = "data/pairwise_labels.jsonl",
    n_pairs_per_muscle: int = 500,
    seed: int = 42,
) -> None:
    """
    Bootstrap pairwise labels from synthetic JSONL data.

    Since synthetic data has ground-truth labels, we can generate
    synthetic pairwise comparisons: if label(A, muscle) > label(B, muscle),
    then A is preferred for that muscle.

    These are used for initial ranking model training before real labels exist.
    """
    random.seed(seed)

    records = []
    with open(train_jsonl) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            rec = json.loads(line)
            rec["_id"] = rec.get("scan_id", str(uuid.uuid4()))
            records.append(rec)

    if len(records) < 10:
        print(f"Not enough records in {train_jsonl}")
        return

    LABEL_MAP = {
        "chest":     "chest_development",
        "abs":       "abs_definition",
        "biceps":    "arm_thickness",
        "triceps":   "arm_thickness",
        "shoulders": "shoulder_width",
        "lats":      "back_width",
        "quads":     "quad_development",
        "calves":    "calf_development",
    }

    n_written = 0
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w") as f_out:
        for muscle, label_key in LABEL_MAP.items():
            # Get records that have this label
            valid = [r for r in records
                     if r.get("labels", {}).get(label_key) not in (None, -1)]
            if len(valid) < 2:
                continue

            pairs = [(random.choice(valid), random.choice(valid))
                     for _ in range(n_pairs_per_muscle)]

            for a, b in pairs:
                if a["_id"] == b["_id"]:
                    continue
                la = float(a["labels"].get(label_key, 0))
                lb = float(b["labels"].get(label_key, 0))
                if abs(la - lb) < 0.5:
                    pref = "equal"
                elif la > lb:
                    pref = "a"
                else:
                    pref = "b"

                rec = {
                    "id_a": a["_id"],
                    "id_b": b["_id"],
                    "muscle": muscle,
                    "preferred": pref,
                    "confidence": min(1.0, abs(la - lb) / 5.0 + 0.2),
                    "labeler": "synthetic",
                    "ts": int(time.time()),
                }
                f_out.write(json.dumps(rec) + "\n")
                n_written += 1

    print(f"[pairwise] Generated {n_written} synthetic pairs → {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="cmd")

    # CLI labeling
    cli_p = sub.add_parser("label", help="Interactive CLI labeling")
    cli_p.add_argument("--images-dir", required=True)
    cli_p.add_argument("--output",  default=OUTPUT_PATH)
    cli_p.add_argument("--muscle",  default="biceps",
                       choices=SUPPORTED_MUSCLES)
    cli_p.add_argument("--n-pairs", type=int, default=20)
    cli_p.add_argument("--labeler", default="anonymous")

    # Synthetic bootstrap
    syn_p = sub.add_parser("synthetic", help="Bootstrap from synthetic JSONL")
    syn_p.add_argument("--input",  default="data/train.jsonl")
    syn_p.add_argument("--output", default=OUTPUT_PATH)
    syn_p.add_argument("--n-per-muscle", type=int, default=500)

    args = parser.parse_args()

    if args.cmd == "label":
        run_cli_labeling(
            args.images_dir, args.output, args.muscle,
            args.n_pairs, args.labeler,
        )
    elif args.cmd == "synthetic":
        generate_synthetic_pairs_from_jsonl(
            args.input, args.output, args.n_per_muscle,
        )
    else:
        parser.print_help()
