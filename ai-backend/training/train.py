"""
Full training pipeline:
  1. Load dataset
  2. Augment
  3. Split train/val/test
  4. Optuna HPO (XGBoost) OR fixed MLP training
  5. Evaluate (MAE, Within±1, F1-macro, confusion matrices)
  6. Register model in registry

Usage:
  python -m training.train --dataset data/train.jsonl --model xgboost --trials 50
  python -m training.train --dataset data/train.jsonl --model mlp --epochs 300
  python -m training.train --dataset data/train.jsonl --model xgboost --kfold 5

v2 changes:
  - Class-balanced sample weighting for ordinal targets: bins of abs_definition
    and v_taper_visibility are up-weighted when under-represented.
  - --kfold: runs stratified k-fold CV instead of a single train/test split.
  - --export-confusion: saves confusion matrix PNGs + JSON to artifacts/confusion/.
  - Mixed-precision MLP training moved to MLPMeasurementModel.fit().
  - Augment weights are repeated consistently with augmented X/y arrays.
"""
from __future__ import annotations
import argparse
import time
import json
import os
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split

from training.dataset import build_dataset
from training.augment import generate_augmented_batch
from training.evaluate import compute_metrics, print_metrics, export_confusion_matrices
from models.measurement_model import (
    XGBoostMeasurementModel, MLPMeasurementModel, TARGET_NAMES, NULL_SENTINEL,
)
from models.registry import register_model

ARTIFACTS_DIR = Path(os.getenv("MODEL_DIR", "artifacts/models"))


def compute_class_balanced_weights(y: np.ndarray,
                                    base_weight: np.ndarray) -> np.ndarray:
    """
    Boost under-represented ordinal bins in the key targets.
    abs_definition (index 10) and v_taper_visibility (index 22) drive the
    most user-facing scores. Rare classes (0-1 and 4-5) are up-weighted to
    force the model to learn extreme cases.
    """
    weights = base_weight.copy()
    key_target_indices = [10, 22]   # abs_definition, v_taper_visibility

    for idx in key_target_indices:
        vals = y[:, idx]
        mask = vals > (NULL_SENTINEL + 0.5)
        if mask.sum() < 10:
            continue
        valid_vals = np.round(vals[mask]).astype(int)
        # Frequency-inverse weighting: weight ∝ 1/count
        classes, counts = np.unique(valid_vals, return_counts=True)
        total = float(counts.sum())
        class_weight = {int(c): total / (len(classes) * cnt)
                        for c, cnt in zip(classes, counts)}
        for i in np.where(mask)[0]:
            v = int(round(vals[i]))
            weights[i] *= class_weight.get(v, 1.0)

    # Normalise so the mean weight stays 1.0
    weights = weights / (weights.mean() + 1e-9)
    return weights.astype(np.float32)


def train_xgboost(X_train: np.ndarray, y_train: np.ndarray,
                  X_val: np.ndarray, y_val: np.ndarray,
                  n_trials: int = 50,
                  sample_weights: np.ndarray | None = None) -> tuple:
    import optuna
    optuna.logging.set_verbosity(optuna.logging.WARNING)

    from models.measurement_model import TARGETS

    def objective(trial: optuna.Trial) -> float:
        params = {
            "n_estimators": trial.suggest_int("n_estimators", 200, 1000),
            "max_depth": trial.suggest_int("max_depth", 3, 8),
            "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.2, log=True),
            "subsample": trial.suggest_float("subsample", 0.6, 1.0),
            "colsample_bytree": trial.suggest_float("colsample_bytree", 0.5, 1.0),
            "reg_alpha": trial.suggest_float("reg_alpha", 0.0, 2.0),
            "reg_lambda": trial.suggest_float("reg_lambda", 0.5, 3.0),
            "min_child_weight": trial.suggest_int("min_child_weight", 1, 10),
            "gamma": trial.suggest_float("gamma", 0.0, 1.0),
        }
        model = XGBoostMeasurementModel(**params)
        model.fit(X_train, y_train, sample_weight=sample_weights)
        pred = model.predict(X_val)
        hw_indices = [i for i, (name, *_) in enumerate(TARGETS)
                      if name in {"shoulder_to_waist_ratio", "abs_definition",
                                  "left_right_symmetry", "v_taper_visibility",
                                  "muscular_separation", "waist_softness"}]
        maes = []
        for idx in hw_indices:
            mask = y_val[:, idx] > (NULL_SENTINEL + 0.5)
            if mask.sum() > 0:
                maes.append(np.mean(np.abs(y_val[mask, idx] - pred[mask, idx])))
        return float(np.mean(maes)) if maes else 1.0

    print(f"[train] Running {n_trials} Optuna trials...")
    study = optuna.create_study(direction="minimize",
                                sampler=optuna.samplers.TPESampler(seed=42))
    study.optimize(objective, n_trials=n_trials, show_progress_bar=True)

    best_params = study.best_params
    print(f"[train] Best params: {best_params}")
    print(f"[train] Best high-weight MAE: {study.best_value:.4f}")

    model = XGBoostMeasurementModel(**best_params)
    model.fit(X_train, y_train, sample_weight=sample_weights)
    return model, best_params


def train_mlp(X_train: np.ndarray, y_train: np.ndarray,
              X_val: np.ndarray, y_val: np.ndarray,
              epochs: int = 300, lr: float = 1e-3,
              batch_size: int = 32,
              sample_weight: np.ndarray | None = None) -> tuple:
    model = MLPMeasurementModel(lr=lr, epochs=epochs, batch_size=batch_size, patience=30)
    history = model.fit(X_train, y_train, X_val=X_val, y_val=y_val,
                        sample_weight=sample_weight)
    return model, history


def run_training(dataset_path: str,
                 model_type: str = "xgboost",
                 n_trials: int = 50,
                 test_size: float = 0.2,
                 augment_factor: int = 3,
                 run_name: str | None = None,
                 cache_dir: str | None = "artifacts/feature_cache",
                 export_confusion: bool = False,
                 class_balance: bool = True) -> dict:
    print(f"[train] Loading dataset: {dataset_path}")
    X, y, weights = build_dataset(dataset_path, cache_dir=cache_dir)
    print(f"[train] Dataset: {len(X)} samples, {X.shape[1]} features, {y.shape[1]} targets")

    if X.shape[1] != 56:
        print(f"[train] WARNING: expected 56 features, got {X.shape[1]}. "
              f"Re-extract feature cache after upgrading the pipeline.")

    # Class-balanced weights for ordinal targets
    if class_balance:
        weights = compute_class_balanced_weights(y, weights)
        print(f"[train] Class-balanced weights: min={weights.min():.2f} "
              f"max={weights.max():.2f} mean={weights.mean():.2f}")

    # Train / val / test split
    X_trainval, X_test, y_trainval, y_test, w_trainval, w_test = train_test_split(
        X, y, weights, test_size=test_size, random_state=42)
    X_train, X_val, y_train, y_val, w_train, w_val = train_test_split(
        X_trainval, y_trainval, w_trainval, test_size=0.15, random_state=42)

    n_samples = len(X)
    if n_samples < 30:
        print(f"[train] WARNING: only {n_samples} samples — high overfit risk. Target 200+.")
    elif n_samples < 100:
        print(f"[train] NOTE: {n_samples} samples — marginal; add trainer corrections.")

    # Augment training set
    if augment_factor > 1:
        print(f"[train] Augmenting {len(X_train)} → ~{len(X_train)*augment_factor} samples")
        X_train_aug, y_train_aug = generate_augmented_batch(
            X_train, y_train, augment_factor)
        w_train_aug = np.tile(w_train, augment_factor)
    else:
        X_train_aug, y_train_aug, w_train_aug = X_train, y_train, w_train

    # Train
    t0 = time.time()
    if model_type == "xgboost":
        model, extra = train_xgboost(X_train_aug, y_train_aug, X_val, y_val,
                                     n_trials, sample_weights=w_train_aug)
    else:
        model, extra = train_mlp(X_train_aug, y_train_aug, X_val, y_val,
                                 sample_weight=w_train_aug)
    elapsed = time.time() - t0
    print(f"[train] Training complete in {elapsed:.1f}s")

    # Evaluate on held-out test set
    y_pred = model.predict(X_test)
    metrics = compute_metrics(y_test, y_pred)
    metrics["training_seconds"] = round(elapsed, 1)
    metrics["n_train"] = int(len(X_train_aug))
    metrics["n_test"] = int(len(X_test))
    print_metrics(metrics)

    if export_confusion:
        print("[train] Exporting confusion matrices...")
        export_confusion_matrices(y_test, y_pred)

    # Save model
    version = run_name or f"{model_type}-{int(time.time())}"
    ext = ".pkl" if model_type == "xgboost" else ".pt"
    model_path = str(ARTIFACTS_DIR / f"{version}{ext}")
    model.save(model_path)
    print(f"[train] Saved model to {model_path}")

    register_model(
        version=version,
        path=model_path,
        model_type=model_type,
        metrics=metrics["aggregate"],
        set_active=True,
    )
    print(f"[train] Registered version '{version}' as active")

    report_path = ARTIFACTS_DIR / f"{version}_metrics.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(metrics, indent=2))

    return {
        "version": version,
        "model_path": model_path,
        "metrics": metrics["aggregate"],
    }


def run_kfold_training(dataset_path: str,
                       model_type: str = "xgboost",
                       n_splits: int = 5,
                       n_trials: int = 25,
                       augment_factor: int = 3,
                       cache_dir: str | None = "artifacts/feature_cache") -> dict:
    """
    Stratified k-fold evaluation for honest performance estimates.
    Does NOT save/register a model — call run_training() for that.
    """
    from training.evaluate import run_kfold_eval

    print(f"[train] Loading dataset: {dataset_path}")
    X, y, weights = build_dataset(dataset_path, cache_dir=cache_dir)
    print(f"[train] K-fold CV: {n_splits} folds, {len(X)} samples")

    if augment_factor > 1:
        X_aug, y_aug = generate_augmented_batch(X, y, augment_factor)
        w_aug = np.tile(weights, augment_factor)
    else:
        X_aug, y_aug, w_aug = X, y, weights

    summary = run_kfold_eval(X_aug, y_aug, w_aug,
                              n_splits=n_splits,
                              model_type=model_type,
                              n_trials=n_trials)

    print(f"\n[train] K-Fold Summary ({n_splits} folds):")
    for k, v in summary.items():
        print(f"  {k:25s}  {v['mean']:.4f} ± {v['std']:.4f}")

    return summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", required=True)
    parser.add_argument("--model", default="xgboost", choices=["xgboost", "mlp"])
    parser.add_argument("--trials", type=int, default=50)
    parser.add_argument("--epochs", type=int, default=300)
    parser.add_argument("--augment-factor", type=int, default=3)
    parser.add_argument("--run-name", default=None)
    parser.add_argument("--kfold", type=int, default=0,
                        help="Run k-fold CV instead of single train/test split")
    parser.add_argument("--export-confusion", action="store_true",
                        help="Save confusion matrix PNG + JSON for each ordinal target")
    parser.add_argument("--no-class-balance", action="store_true",
                        help="Disable class-balanced sample weighting")
    args = parser.parse_args()

    if args.kfold > 1:
        run_kfold_training(
            dataset_path=args.dataset,
            model_type=args.model,
            n_splits=args.kfold,
            n_trials=args.trials,
            augment_factor=args.augment_factor,
        )
    else:
        run_training(
            dataset_path=args.dataset,
            model_type=args.model,
            n_trials=args.trials,
            augment_factor=args.augment_factor,
            run_name=args.run_name,
            export_confusion=args.export_confusion,
            class_balance=not args.no_class_balance,
        )
