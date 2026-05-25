"""
Evaluation metrics for the PhysiqueMax ML pipeline.

Covers:
  - MAE / RMSE per muscle group
  - Spearman rank correlation (ranking quality)
  - Pairwise ranking accuracy (how often the model gets A > B correct)
  - Expected Calibration Error (ECE) for uncertainty quantification
  - Coverage probability (are 90% CIs actually 90%?)
"""
from __future__ import annotations

from typing import Optional
import numpy as np


def mae(y_true: np.ndarray, y_pred: np.ndarray,
        mask: Optional[np.ndarray] = None) -> float:
    """Mean Absolute Error, optionally masked for missing labels."""
    if mask is not None:
        y_true = y_true[mask]
        y_pred = y_pred[mask]
    if len(y_true) == 0:
        return float("nan")
    return float(np.mean(np.abs(y_true - y_pred)))


def rmse(y_true: np.ndarray, y_pred: np.ndarray,
         mask: Optional[np.ndarray] = None) -> float:
    if mask is not None:
        y_true = y_true[mask]
        y_pred = y_pred[mask]
    if len(y_true) == 0:
        return float("nan")
    return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))


def spearman_rho(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Spearman rank correlation. Measures ranking quality, not absolute accuracy."""
    from scipy.stats import spearmanr
    if len(y_true) < 3:
        return float("nan")
    rho, _ = spearmanr(y_true, y_pred)
    return float(rho)


def pairwise_ranking_accuracy(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    min_diff: float = 0.5,
) -> float:
    """
    Fraction of pairs (i,j) where the model correctly identifies which is better.

    Only considers pairs where true difference ≥ min_diff (avoids ties).
    Range: [0, 1]. 0.5 = random; 1.0 = perfect.
    """
    n = len(y_true)
    correct = 0
    total   = 0
    for i in range(n):
        for j in range(i + 1, n):
            d_true = y_true[i] - y_true[j]
            if abs(d_true) < min_diff:
                continue
            d_pred = y_pred[i] - y_pred[j]
            if (d_true > 0) == (d_pred > 0):
                correct += 1
            total += 1
    return correct / max(1, total)


def ece(
    y_true: np.ndarray,
    y_mean: np.ndarray,
    y_std: np.ndarray,
    n_bins: int = 10,
) -> float:
    """
    Expected Calibration Error for Gaussian uncertainty estimates.

    Checks whether the fraction of true values falling within the predicted
    confidence intervals matches the stated confidence level.

    Perfect calibration: ECE = 0.0
    Target: ECE < 0.10
    """
    # Use z-score: if calibrated, z ~ N(0,1)
    z = (y_true - y_mean) / (y_std + 1e-8)
    from scipy.stats import norm

    confidences = np.linspace(0.1, 0.9, n_bins)
    errors = []
    for conf in confidences:
        z_thresh = norm.ppf((1 + conf) / 2)
        empirical = float(np.mean(np.abs(z) <= z_thresh))
        errors.append(abs(empirical - conf))

    return float(np.mean(errors))


def coverage_probability(
    y_true: np.ndarray,
    y_low: np.ndarray,
    y_high: np.ndarray,
) -> float:
    """Fraction of true values within [y_low, y_high] CI. Should be ≈ 0.9 for 90% CI."""
    return float(np.mean((y_true >= y_low) & (y_true <= y_high)))


def per_muscle_metrics(
    true_scores: dict[str, list],
    pred_scores: dict[str, list],
    pred_stds:   Optional[dict[str, list]] = None,
) -> dict[str, dict]:
    """
    Compute MAE, RMSE, Spearman, Ranking Accuracy per muscle group.

    Args:
        true_scores: {muscle → list of ground-truth scores}
        pred_scores: {muscle → list of predicted scores}
        pred_stds:   {muscle → list of predicted std devs} (optional)
    """
    results = {}
    for muscle in true_scores:
        yt = np.array(true_scores[muscle], dtype=float)
        yp = np.array(pred_scores.get(muscle, []), dtype=float)

        if len(yt) == 0 or len(yp) == 0 or len(yt) != len(yp):
            continue

        valid = ~(np.isnan(yt) | np.isnan(yp))
        m: dict = {
            "n_samples": int(valid.sum()),
            "mae":       mae(yt, yp, valid),
            "rmse":      rmse(yt, yp, valid),
            "spearman":  spearman_rho(yt[valid], yp[valid]),
            "rank_acc":  pairwise_ranking_accuracy(yt[valid], yp[valid]),
        }

        if pred_stds is not None and muscle in pred_stds:
            ys = np.array(pred_stds[muscle], dtype=float)
            if len(ys) == len(yt):
                m["ece"] = ece(yt[valid], yp[valid], ys[valid])

        results[muscle] = m
    return results


def print_metrics_table(metrics: dict[str, dict]) -> None:
    """Pretty-print per-muscle metrics table."""
    muscles = sorted(metrics.keys())
    header = f"{'Muscle':<12} {'N':>5} {'MAE':>6} {'RMSE':>6} {'Spearman':>9} {'Rank Acc':>9}"
    print("\n" + header)
    print("─" * len(header))
    for m in muscles:
        r = metrics[m]
        print(f"{m:<12} {r.get('n_samples',0):>5} "
              f"{r.get('mae', float('nan')):>6.3f} "
              f"{r.get('rmse', float('nan')):>6.3f} "
              f"{r.get('spearman', float('nan')):>9.3f} "
              f"{r.get('rank_acc', float('nan')):>9.3f}")
    print()
