"""
Evaluation metrics for the measurement prediction model.

Primary metrics:
  - MAE per target (how many ordinal levels off on average)
  - Within-1 accuracy: % of predictions within ±1 of true ordinal (practical threshold)
  - Pearson correlation with trainer overall score (end-to-end quality)
  - RMSE for continuous ratio targets

Targets that matter most:
  - should_to_waist_ratio   → drives V-taper score (high weight)
  - abs_definition          → drives body fat estimate (high weight)
  - left_right_symmetry     → drives symmetry score (high weight)
"""
from __future__ import annotations
import numpy as np
from scipy import stats
from models.measurement_model import TARGETS, TARGET_NAMES, NULL_SENTINEL, NULLABLE_TARGETS


HIGH_WEIGHT_TARGETS = {
    "shoulder_to_waist_ratio", "abs_definition", "left_right_symmetry",
    "v_taper_visibility", "muscular_separation", "waist_softness",
}


def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray,
                    trainer_scores: np.ndarray | None = None) -> dict:
    """
    y_true, y_pred: (n, n_targets)
    trainer_scores: (n,) optional overall trainer score for correlation metric
    """
    metrics: dict = {"per_target": {}, "aggregate": {}}

    maes, within1s, rmses = [], [], []

    for i, (name, typ, lo, hi) in enumerate(TARGETS):
        t = y_true[:, i]
        p = y_pred[:, i]

        # Exclude null sentinels from evaluation
        mask = t > (NULL_SENTINEL + 0.5)
        if mask.sum() == 0:
            continue
        t_m, p_m = t[mask], p[mask]

        mae = float(np.mean(np.abs(t_m - p_m)))
        rmse = float(np.sqrt(np.mean((t_m - p_m) ** 2)))

        if typ == "ordinal":
            within1 = float(np.mean(np.abs(t_m - p_m) <= 1.0))
        else:
            # For ratios, "within 0.1" is the practical threshold
            within1 = float(np.mean(np.abs(t_m - p_m) <= 0.1))

        metrics["per_target"][name] = {
            "mae": round(mae, 4),
            "rmse": round(rmse, 4),
            "within_1": round(within1, 4),
            "n": int(mask.sum()),
            "high_weight": name in HIGH_WEIGHT_TARGETS,
        }
        maes.append(mae)
        within1s.append(within1)
        rmses.append(rmse)

    metrics["aggregate"]["mean_mae"] = round(float(np.mean(maes)), 4)
    metrics["aggregate"]["mean_within1"] = round(float(np.mean(within1s)), 4)
    metrics["aggregate"]["mean_rmse"] = round(float(np.mean(rmses)), 4)

    # Weighted MAE for high-priority targets
    hw_maes = [
        metrics["per_target"][name]["mae"]
        for name in HIGH_WEIGHT_TARGETS
        if name in metrics["per_target"]
    ]
    if hw_maes:
        metrics["aggregate"]["high_weight_mae"] = round(float(np.mean(hw_maes)), 4)

    # Correlation with trainer overall score
    if trainer_scores is not None and len(trainer_scores) > 5:
        # Use abs_definition + shoulder_to_waist_ratio as a proxy overall score
        abs_def_idx = TARGET_NAMES.index("abs_definition")
        s2w_idx = TARGET_NAMES.index("shoulder_to_waist_ratio")
        proxy = y_pred[:, abs_def_idx] * 15 + y_pred[:, s2w_idx] * 20
        r, p_val = stats.pearsonr(proxy, trainer_scores)
        metrics["aggregate"]["trainer_correlation_r"] = round(float(r), 4)
        metrics["aggregate"]["trainer_correlation_p"] = round(float(p_val), 6)

    return metrics


def print_metrics(metrics: dict) -> None:
    agg = metrics["aggregate"]
    print(f"\n{'='*60}")
    print(f"  AGGREGATE METRICS")
    print(f"  Mean MAE:          {agg['mean_mae']:.4f}")
    print(f"  Mean Within±1:     {agg['mean_within1']:.1%}")
    print(f"  Mean RMSE:         {agg['mean_rmse']:.4f}")
    if "high_weight_mae" in agg:
        print(f"  High-Weight MAE:   {agg['high_weight_mae']:.4f}  ← key metric")
    if "trainer_correlation_r" in agg:
        print(f"  Trainer Corr. r:   {agg['trainer_correlation_r']:.3f}")
    print(f"\n  PER-TARGET (sorted by MAE desc):")
    per = sorted(metrics["per_target"].items(), key=lambda x: -x[1]["mae"])
    for name, m in per:
        flag = " ★" if m["high_weight"] else ""
        print(f"  {name:35s}  MAE={m['mae']:.3f}  W1={m['within_1']:.0%}{flag}")
    print(f"{'='*60}\n")
