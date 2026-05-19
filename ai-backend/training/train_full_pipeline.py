"""
Full Pipeline Training Orchestrator.

Runs all 5 training stages in sequence with proper checkpointing:

  Stage 1: (Skipped if not running own pose/seg training)
           Use pretrained MediaPipe / YOLO as-is.

  Stage 2: Backbone representation learning (optional, if DINOv2 weights available)
           → Run contrastive learning on body crop pairs if image data exists
           → Skip if using DINOv2 frozen backbone (default)

  Stage 3: Supervised muscle head training
           → Uses synthetic + manual labels
           → Outputs: artifacts/models/muscle_heads.pt

  Stage 4: Ranking fine-tuning
           → Uses pairwise comparison data (if available)
           → Outputs: artifacts/models/ranking_model.pt

  Stage 5: Calibration
           → Fits BF estimation calibration
           → Fits ranking → absolute score calibration (isotonic regression)
           → Outputs: artifacts/models/calibration.pkl

Run full pipeline:
  python -m training.train_full_pipeline

Run from specific stage:
  python -m training.train_full_pipeline --from-stage 3

Run MVP (just stage 3 with synthetic data, no images needed):
  python -m training.train_full_pipeline --mvp
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path


def ensure_synthetic_data(
    n_samples: int = 2000,
    output: str = "data/train.jsonl",
) -> bool:
    """Generate synthetic training data if not present."""
    if Path(output).exists():
        with open(output) as f:
            n = sum(1 for line in f if line.strip())
        if n >= n_samples // 2:
            print(f"[pipeline] Using existing {n} synthetic samples at {output}")
            return True

    print(f"[pipeline] Generating {n_samples} synthetic samples → {output}")
    Path(output).parent.mkdir(parents=True, exist_ok=True)
    result = subprocess.run(
        [sys.executable, "-m", "training.generate_synthetic",
         "--n-samples", str(n_samples),
         "--output", output],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        print(f"[pipeline] Synthetic data generation failed:\n{result.stderr}")
        return False
    print(f"[pipeline] Synthetic data ready at {output}")
    return True


def stage3_supervised(args: argparse.Namespace) -> bool:
    """Stage 3: Train per-muscle heads on synthetic + manual labels."""
    from training.train_muscle_heads import train_muscle_heads

    data_path   = args.data or "data/train.jsonl"
    output_path = args.models_dir + "/muscle_heads.pt"

    # Merge manual labels if available
    manual_path = "data/manual_labels.jsonl"
    if Path(manual_path).exists() and Path(data_path).exists():
        merged_path = "data/train_merged.jsonl"
        print(f"[pipeline] Merging {data_path} + {manual_path} → {merged_path}")
        with open(merged_path, "w") as out:
            for src in [data_path, manual_path]:
                with open(src) as f:
                    out.write(f.read())
        data_path = merged_path

    if not Path(data_path).exists():
        if not ensure_synthetic_data(output=data_path):
            return False

    metrics = train_muscle_heads(
        data_path=data_path,
        epochs=args.epochs,
        output_path=output_path,
    )
    print(f"[pipeline] Stage 3 done. val_loss={metrics.get('best_val_loss', '?'):.4f}")
    return True


def stage4_ranking(args: argparse.Namespace) -> bool:
    """Stage 4: Ranking fine-tuning with pairwise labels."""
    from training.train_ranking import train_ranking

    pairs_path = args.pairs or "data/pairwise_labels.jsonl"
    if not Path(pairs_path).exists():
        print(f"[pipeline] No pairwise data at {pairs_path}. "
              "Stage 4 skipped. Run pairwise_collector.py to collect labels.")
        return True   # Not a failure — just no data yet

    result = train_ranking(
        pairs_path=pairs_path,
        feature_cache_dir=args.feature_cache or "data/feature_cache",
        epochs=args.ranking_epochs,
        output_model=args.models_dir + "/ranking_model.pt",
    )
    if result.get("skipped"):
        print(f"[pipeline] Stage 4 skipped: {result.get('reason')}")
    else:
        print(f"[pipeline] Stage 4 done. loss={result.get('best_loss', '?'):.4f}")
    return True


def stage5_calibration(args: argparse.Namespace) -> bool:
    """
    Stage 5: Calibration.

    If manual absolute labels exist (data/manual_labels.jsonl with
    absolute_score field), fit isotonic regression for ranking calibration.
    Otherwise, skip gracefully.
    """
    import joblib
    import numpy as np

    manual_path = "data/manual_labels.jsonl"
    if not Path(manual_path).exists():
        print("[pipeline] Stage 5 skipped: no manual labels for calibration.")
        return True

    records = []
    with open(manual_path) as f:
        for line in f:
            rec = json.loads(line.strip())
            if "absolute_score" in rec and "muscle" in rec:
                records.append(rec)

    if len(records) < 20:
        print(f"[pipeline] Stage 5: only {len(records)} manual labels "
              "(need ≥20). Skipping calibration.")
        return True

    from models.ranking.ranking_model import RankingCalibrator
    from models.muscle_heads.head_model import MUSCLE_GROUPS

    calib = RankingCalibrator()
    from collections import defaultdict
    by_muscle: dict = defaultdict(lambda: ([], []))
    for rec in records:
        muscle = rec["muscle"]
        if muscle in MUSCLE_GROUPS:
            by_muscle[muscle][0].append(rec.get("raw_score", 5.0))
            by_muscle[muscle][1].append(rec["absolute_score"])

    for muscle, (raw, absolute) in by_muscle.items():
        if len(raw) >= 5:
            calib.fit(muscle, np.array(raw), np.array(absolute))
            print(f"[pipeline] Calibrated {muscle} with {len(raw)} samples")

    calib_path = args.models_dir + "/ranking_calibrator.pkl"
    calib.save(calib_path)
    print(f"[pipeline] Stage 5 done → {calib_path}")
    return True


def run_full_pipeline(args: argparse.Namespace) -> None:
    Path(args.models_dir).mkdir(parents=True, exist_ok=True)
    Path("data").mkdir(exist_ok=True)

    from_stage = args.from_stage

    if not args.mvp:
        print("\n=== PhysiqueMax ML Training Pipeline ===\n")

    stages = [
        (3, "Supervised muscle head training", stage3_supervised),
        (4, "Ranking fine-tuning",              stage4_ranking),
        (5, "Calibration",                      stage5_calibration),
    ]

    for stage_num, stage_name, stage_fn in stages:
        if stage_num < from_stage:
            continue
        print(f"\n── Stage {stage_num}: {stage_name} ──")
        ok = stage_fn(args)
        if not ok:
            print(f"[pipeline] Stage {stage_num} failed. Stopping.")
            sys.exit(1)

    print("\n✓ Full pipeline complete.\n")
    print(f"  Muscle heads: {args.models_dir}/muscle_heads.pt")
    print(f"  Ranking model: {args.models_dir}/ranking_model.pt (if pairwise data)")
    print(f"  Calibration: {args.models_dir}/ranking_calibrator.pkl (if manual labels)")
    print(f"\nSet PHYSIQUE_MODEL_DIR={args.models_dir} to use these models.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="PhysiqueMax full ML pipeline training"
    )
    parser.add_argument("--from-stage",     type=int, default=3, choices=[3, 4, 5])
    parser.add_argument("--mvp",            action="store_true",
                        help="MVP mode: stage 3 only, synthetic data only")
    parser.add_argument("--data",           default=None,
                        help="Path to training data JSONL")
    parser.add_argument("--pairs",          default=None,
                        help="Path to pairwise labels JSONL")
    parser.add_argument("--feature-cache",  default="data/feature_cache")
    parser.add_argument("--models-dir",     default="artifacts/models")
    parser.add_argument("--epochs",         type=int, default=300)
    parser.add_argument("--ranking-epochs", type=int, default=100)
    args = parser.parse_args()

    if args.mvp:
        args.from_stage = 3
        args.ranking_epochs = 0

    run_full_pipeline(args)
