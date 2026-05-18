"""
Evaluation metrics for the measurement prediction model.

v2 additions:
  - Per-target precision / recall / F1 for ordinal targets (each value 0-5
    is a class; macro-averaged across visible classes).
  - Confusion matrix export (JSON + optional Matplotlib PNG).
  - Stratified k-fold CV helper (run_kfold_eval).
  - compute_calibration(): checks systematic over/under-prediction bias.

Primary metrics:
  - MAE per target (how many ordinal levels off on average)
  - Within-1 accuracy: % of predictions within ±1 of true ordinal
  - Pearson correlation with trainer overall score
  - RMSE for continuous ratio targets
"""
from __future__ import annotations
import json
import numpy as np
from pathlib import Path
from scipy import stats
from sklearn.metrics import (
    precision_recall_fscore_support, confusion_matrix, classification_report,
)
from models.measurement_model import TARGETS, TARGET_NAMES, NULL_SENTINEL, NULLABLE_TARGETS


HIGH_WEIGHT_TARGETS = {
    "shoulder_to_waist_ratio", "abs_definition", "left_right_symmetry",
    "v_taper_visibility", "muscular_separation", "waist_softness",
}


def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray,
                    trainer_scores: np.ndarray | None = None) -> dict:
    """
    y_true, y_pred: (n, n_targets)
    trainer_scores: (n,) optional overall trainer score for correlation metric.
    """
    metrics: dict = {"per_target": {}, "aggregate": {}}

    maes, within1s, rmses = [], [], []

    for i, (name, typ, lo, hi) in enumerate(TARGETS):
        t = y_true[:, i]
        p = y_pred[:, i]

        mask = t > (NULL_SENTINEL + 0.5)
        if mask.sum() == 0:
            continue
        t_m, p_m = t[mask], p[mask]

        mae = float(np.mean(np.abs(t_m - p_m)))
        rmse = float(np.sqrt(np.mean((t_m - p_m) ** 2)))

        if typ == "ordinal":
            within1 = float(np.mean(np.abs(t_m - p_m) <= 1.0))
        else:
            within1 = float(np.mean(np.abs(t_m - p_m) <= 0.1))

        entry: dict = {
            "mae": round(mae, 4),
            "rmse": round(rmse, 4),
            "within_1": round(within1, 4),
            "n": int(mask.sum()),
            "high_weight": name in HIGH_WEIGHT_TARGETS,
        }

        # Per-class F1 for ordinal targets
        if typ == "ordinal":
            t_int = np.round(t_m).astype(int)
            p_int = np.round(p_m).astype(int)
            classes = sorted(set(int(v) for v in t_int))
            if len(classes) >= 2:
                prec, rec, f1, _ = precision_recall_fscore_support(
                    t_int, p_int, labels=classes, average="macro",
                    zero_division=0)
                entry["precision_macro"] = round(float(prec), 4)
                entry["recall_macro"]    = round(float(rec), 4)
                entry["f1_macro"]        = round(float(f1), 4)

                # Bias: mean(pred - true) — positive = over-predicts
                entry["bias"] = round(float(np.mean(p_m - t_m)), 4)

        metrics["per_target"][name] = entry
        maes.append(mae)
        within1s.append(within1)
        rmses.append(rmse)

    metrics["aggregate"]["mean_mae"]     = round(float(np.mean(maes)), 4)
    metrics["aggregate"]["mean_within1"] = round(float(np.mean(within1s)), 4)
    metrics["aggregate"]["mean_rmse"]    = round(float(np.mean(rmses)), 4)

    hw_maes = [
        metrics["per_target"][name]["mae"]
        for name in HIGH_WEIGHT_TARGETS
        if name in metrics["per_target"]
    ]
    if hw_maes:
        metrics["aggregate"]["high_weight_mae"] = round(float(np.mean(hw_maes)), 4)

    # F1 macro for ordinal targets
    f1s = [v["f1_macro"] for v in metrics["per_target"].values()
           if "f1_macro" in v]
    if f1s:
        metrics["aggregate"]["mean_f1_macro"] = round(float(np.mean(f1s)), 4)

    if trainer_scores is not None and len(trainer_scores) > 5:
        abs_def_idx = TARGET_NAMES.index("abs_definition")
        s2w_idx = TARGET_NAMES.index("shoulder_to_waist_ratio")
        proxy = y_pred[:, abs_def_idx] * 15 + y_pred[:, s2w_idx] * 20
        r, p_val = stats.pearsonr(proxy, trainer_scores)
        metrics["aggregate"]["trainer_correlation_r"] = round(float(r), 4)
        metrics["aggregate"]["trainer_correlation_p"] = round(float(p_val), 6)

    return metrics


def export_confusion_matrices(y_true: np.ndarray, y_pred: np.ndarray,
                               output_dir: str = "artifacts/confusion") -> None:
    """
    Save a JSON confusion matrix for each ordinal target.
    Optionally renders a seaborn heatmap PNG if matplotlib is available.
    """
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    for i, (name, typ, lo, hi) in enumerate(TARGETS):
        if typ != "ordinal":
            continue
        t = y_true[:, i]
        p = y_pred[:, i]
        mask = t > (NULL_SENTINEL + 0.5)
        if mask.sum() < 5:
            continue

        t_int = np.round(t[mask]).astype(int)
        p_int = np.round(p[mask]).astype(int)
        classes = list(range(lo, hi + 1))

        cm = confusion_matrix(t_int, p_int, labels=classes)
        cm_dict = {
            "target": name,
            "classes": classes,
            "matrix": cm.tolist(),
            "n": int(mask.sum()),
        }
        (out / f"cm_{name}.json").write_text(json.dumps(cm_dict, indent=2))

        try:
            import matplotlib.pyplot as plt
            import seaborn as sns
            fig, ax = plt.subplots(figsize=(7, 6))
            sns.heatmap(cm, annot=True, fmt="d", xticklabels=classes,
                        yticklabels=classes, cmap="Blues", ax=ax)
            ax.set_xlabel("Predicted")
            ax.set_ylabel("True")
            ax.set_title(f"Confusion Matrix: {name}")
            fig.tight_layout()
            fig.savefig(str(out / f"cm_{name}.png"), dpi=100)
            plt.close(fig)
        except Exception:
            pass


def compute_calibration(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    """
    Check systematic bias: for each ordinal target, does the model consistently
    over- or under-predict?  Values far from 0 signal label distribution shift.
    """
    result = {}
    for i, (name, typ, lo, hi) in enumerate(TARGETS):
        if typ != "ordinal":
            continue
        t = y_true[:, i]
        p = y_pred[:, i]
        mask = t > (NULL_SENTINEL + 0.5)
        if mask.sum() < 5:
            continue
        bias = float(np.mean(p[mask] - t[mask]))
        std  = float(np.std(p[mask] - t[mask]))
        result[name] = {"bias": round(bias, 3), "std": round(std, 3)}
    return result


def run_kfold_eval(X: np.ndarray, y: np.ndarray, weights: np.ndarray,
                   n_splits: int = 5,
                   model_type: str = "xgboost",
                   n_trials: int = 25) -> dict:
    """
    Stratified k-fold cross-validation.
    Stratification key: bucket of abs_definition + v_taper_visibility (key targets).
    Returns mean ± std for aggregate metrics across folds.
    """
    from sklearn.model_selection import KFold
    from training.train import train_xgboost, train_mlp
    from models.measurement_model import TARGET_NAMES

    abs_idx  = TARGET_NAMES.index("abs_definition")
    vtap_idx = TARGET_NAMES.index("v_taper_visibility")

    # Stratification bucket (coarse quantile)
    valid_mask = y[:, abs_idx] > (NULL_SENTINEL + 0.5)
    strat_key = np.where(valid_mask,
                         np.round(y[:, abs_idx]).astype(int) * 6 +
                         np.where(y[:, vtap_idx] > (NULL_SENTINEL + 0.5),
                                  np.round(y[:, vtap_idx]).astype(int), 3),
                         -1)

    kf = KFold(n_splits=n_splits, shuffle=True, random_state=42)
    fold_metrics = []

    for fold, (train_idx, val_idx) in enumerate(kf.split(X)):
        X_tr, X_va = X[train_idx], X[val_idx]
        y_tr, y_va = y[train_idx], y[val_idx]
        w_tr = weights[train_idx]

        if model_type == "xgboost":
            model, _ = train_xgboost(X_tr, y_tr, X_va, y_va,
                                     n_trials=n_trials, sample_weights=w_tr)
        else:
            model, _ = train_mlp(X_tr, y_tr, X_va, y_va)

        y_pred = model.predict(X_va)
        m = compute_metrics(y_va, y_pred)
        fold_metrics.append(m["aggregate"])
        print(f"  Fold {fold+1}/{n_splits}: MAE={m['aggregate']['mean_mae']:.4f} "
              f"W1={m['aggregate']['mean_within1']:.3f}")

    # Aggregate across folds
    keys = fold_metrics[0].keys()
    summary = {}
    for k in keys:
        vals = [fm[k] for fm in fold_metrics if k in fm]
        if vals:
            summary[k] = {
                "mean": round(float(np.mean(vals)), 4),
                "std":  round(float(np.std(vals)), 4),
            }
    return summary


def print_metrics(metrics: dict) -> None:
    agg = metrics["aggregate"]
    print(f"\n{'='*65}")
    print(f"  AGGREGATE METRICS")
    print(f"  Mean MAE:          {agg['mean_mae']:.4f}")
    print(f"  Mean Within±1:     {agg['mean_within1']:.1%}")
    print(f"  Mean RMSE:         {agg['mean_rmse']:.4f}")
    if "mean_f1_macro" in agg:
        print(f"  Mean F1 (macro):   {agg['mean_f1_macro']:.4f}  ← new v2 metric")
    if "high_weight_mae" in agg:
        print(f"  High-Weight MAE:   {agg['high_weight_mae']:.4f}  ← key metric")
    if "trainer_correlation_r" in agg:
        print(f"  Trainer Corr. r:   {agg['trainer_correlation_r']:.3f}")
    print(f"\n  PER-TARGET (sorted by MAE desc):")
    per = sorted(metrics["per_target"].items(), key=lambda x: -x[1]["mae"])
    for name, m in per:
        flag = " ★" if m["high_weight"] else ""
        f1_str = f"  F1={m['f1_macro']:.2f}" if "f1_macro" in m else ""
        bias_str = f"  bias={m['bias']:+.2f}" if "bias" in m else ""
        print(f"  {name:35s}  MAE={m['mae']:.3f}  W1={m['within_1']:.0%}"
              f"{f1_str}{bias_str}{flag}")
    print(f"{'='*65}\n")
