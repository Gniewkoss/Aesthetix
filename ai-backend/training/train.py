"""
Full training pipeline:
  1. Load dataset
  2. Augment
  3. Split train/val/test
  4. Optuna hyperparameter search (XGBoost) OR fixed MLP training
  5. Evaluate
  6. Register model in registry

Usage:
  python -m training.train --dataset data/train.jsonl --model xgboost --trials 50
  python -m training.train --dataset data/train.jsonl --model mlp --epochs 300
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
from training.evaluate import compute_metrics, print_metrics
from models.measurement_model import XGBoostMeasurementModel, MLPMeasurementModel
from models.registry import register_model

ARTIFACTS_DIR = Path(os.getenv("MODEL_DIR", "artifacts/models"))


def train_xgboost(X_train: np.ndarray, y_train: np.ndarray,
                  X_val: np.ndarray, y_val: np.ndarray,
                  n_trials: int = 50, sample_weights: np.ndarray | None = None) -> tuple:
    """Optuna hyperparameter search + final XGBoost training."""
    import optuna
    optuna.logging.set_verbosity(optuna.logging.WARNING)

    from models.measurement_model import XGBoostMeasurementModel, postprocess_predictions

    def objective(trial: optuna.Trial) -> float:
        params = {
            "n_estimators": trial.suggest_int("n_estimators", 200, 800),
            "max_depth": trial.suggest_int("max_depth", 3, 8),
            "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.2, log=True),
            "subsample": trial.suggest_float("subsample", 0.6, 1.0),
            "colsample_bytree": trial.suggest_float("colsample_bytree", 0.5, 1.0),
            "reg_alpha": trial.suggest_float("reg_alpha", 0.0, 2.0),
            "reg_lambda": trial.suggest_float("reg_lambda", 0.5, 3.0),
            "min_child_weight": trial.suggest_int("min_child_weight", 1, 10),
        }
        model = XGBoostMeasurementModel(**params)
        model.fit(X_train, y_train)
        pred = model.predict(X_val)
        # Minimize MAE on high-weight targets
        from models.measurement_model import TARGETS, NULL_SENTINEL
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
    study = optuna.create_study(direction="minimize")
    study.optimize(objective, n_trials=n_trials, show_progress_bar=True)

    best_params = study.best_params
    print(f"[train] Best params: {best_params}")
    print(f"[train] Best MAE: {study.best_value:.4f}")

    model = XGBoostMeasurementModel(**best_params)
    model.fit(X_train, y_train)
    return model, best_params


def train_mlp(X_train: np.ndarray, y_train: np.ndarray,
              X_val: np.ndarray, y_val: np.ndarray,
              epochs: int = 300, lr: float = 1e-3,
              batch_size: int = 32) -> tuple:
    model = MLPMeasurementModel(lr=lr, epochs=epochs, batch_size=batch_size, patience=30)
    history = model.fit(X_train, y_train, X_val=X_val, y_val=y_val)
    return model, history


def run_training(dataset_path: str, model_type: str = "xgboost",
                 n_trials: int = 50, test_size: float = 0.2,
                 augment_factor: int = 3, run_name: str | None = None,
                 cache_dir: str | None = "artifacts/feature_cache") -> dict:
    print(f"[train] Loading dataset: {dataset_path}")
    X, y, weights = build_dataset(dataset_path, cache_dir=cache_dir)
    print(f"[train] Dataset: {len(X)} samples, {X.shape[1]} features, {y.shape[1]} targets")

    # Train/val/test split
    X_trainval, X_test, y_trainval, y_test, w_trainval, w_test = train_test_split(
        X, y, weights, test_size=test_size, random_state=42)
    X_train, X_val, y_train, y_val = train_test_split(
        X_trainval, y_trainval, test_size=0.15, random_state=42)

    # Augment training set
    if augment_factor > 1:
        print(f"[train] Augmenting {len(X_train)} → ~{len(X_train)*augment_factor} samples")
        X_train, y_train = generate_augmented_batch(X_train, y_train, augment_factor)

    # Train
    t0 = time.time()
    if model_type == "xgboost":
        model, extra = train_xgboost(X_train, y_train, X_val, y_val, n_trials)
    else:
        model, extra = train_mlp(X_train, y_train, X_val, y_val)
    elapsed = time.time() - t0
    print(f"[train] Training complete in {elapsed:.1f}s")

    # Evaluate on held-out test set
    y_pred = model.predict(X_test)
    metrics = compute_metrics(y_test, y_pred)
    metrics["training_seconds"] = round(elapsed, 1)
    metrics["n_train"] = int(len(X_train))
    metrics["n_test"] = int(len(X_test))
    print_metrics(metrics)

    # Save model
    version = run_name or f"{model_type}-{int(time.time())}"
    model_path = str(ARTIFACTS_DIR / f"{version}.pkl" if model_type == "xgboost"
                     else ARTIFACTS_DIR / f"{version}.pt")
    model.save(model_path)
    print(f"[train] Saved model to {model_path}")

    # Register in registry
    register_model(
        version=version,
        path=model_path,
        model_type=model_type,
        metrics=metrics["aggregate"],
        set_active=True,
    )
    print(f"[train] Registered version '{version}' as active")

    # Save metrics report
    report_path = ARTIFACTS_DIR / f"{version}_metrics.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(metrics, indent=2))

    return {
        "version": version,
        "model_path": model_path,
        "metrics": metrics["aggregate"],
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", required=True)
    parser.add_argument("--model", default="xgboost", choices=["xgboost", "mlp"])
    parser.add_argument("--trials", type=int, default=50)
    parser.add_argument("--epochs", type=int, default=300)
    parser.add_argument("--augment-factor", type=int, default=3)
    parser.add_argument("--run-name", default=None)
    args = parser.parse_args()

    run_training(
        dataset_path=args.dataset,
        model_type=args.model,
        n_trials=args.trials,
        augment_factor=args.augment_factor,
        run_name=args.run_name,
    )
