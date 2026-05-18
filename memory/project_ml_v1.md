---
name: project-ml-v1
description: PhysiqueMax AI ML pipeline v2 status — 56-feature vector, pose-guided segmentation, requires retraining for v4 model
metadata:
  type: project
---

# ML Pipeline Status (v2 — 2026-05-18)

## Current Active Model
- **xgboost-v3-lsp-cv** — ACTIVE (but uses stale 50-feature cache)
- After rebuilding feature cache and retraining, this will be replaced by v4

## Feature Vector
- **v1**: 50 features (xgboost-v1, v2, v3 models trained on this)
- **v2**: 56 features — 6 new segmentation features added:
  `neck_width_norm, waist_concavity, hip_drop_norm, taper_uniformity, calf_width_mean, conditioning_gradient`
- All v1 pkl models are **incompatible** with v2 pipeline — must retrain

## Root Cause of v3 Regression (MAE 0.56 vs v2's 0.35)
Fixed fraction segmentation: the segmenter was measuring shoulder/waist/hip at
fixed body-height fractions (15%, 42%, 55%) that break for non-standard poses.
In LSP dataset with varied poses this produced noisy, wrong features.

## Key v2 Improvements Implemented (2026-05-18)
1. **Pose-guided segmentation** — `segmenter.py`: uses actual MediaPipe landmark y-positions
   to anchor width measurement rows (instead of fixed fractions)
2. **Pose alignment** — `preprocessor.py`: `align_with_pose()` rotates image so shoulders are horizontal
3. **Background removal** — `preprocessor.py`: uses MediaPipe segmentation mask (free from pose detection) to neutralize background before YOLO
4. **MediaPipe segmentation enabled** — `pose_estimator.py`: `enable_segmentation=True`, mask in PoseFeatures
5. **6 new features** — see above
6. **StandardScaler in models** — both XGBoost and MLP pipelines now include scaler
7. **View-aware null masking** — `measurement_model.py`: `VIEW_INVISIBLE` dict forces null for physically-invisible targets per pose type (fixes back_width/lat_flare MAE for front-view images)
8. **Residual MLP** — deeper architecture with `ResidualBlock` + LayerNorm + mixed precision training
9. **Gaussian noise + Scale + Mixup augmentation** — `augment.py`: more diverse training set
10. **F1/Confusion Matrix metrics** — `evaluate.py`: per-class F1, confusion matrix export
11. **k-fold CV + class balancing** — `train.py`: `--kfold N`, `compute_class_balanced_weights()`
12. **Feature cache invalidation** — `dataset.py` auto-deletes 50-feature cache entries

## Next Step to Improve Model
1. Delete old feature cache: `rm artifacts/feature_cache/*.npz`
2. Retrain with new pipeline:
   `python -m training.train --dataset data/train.jsonl --model xgboost --trials 50 --run-name xgboost-v4`
3. For k-fold evaluation first:
   `python -m training.train --dataset data/train.jsonl --kfold 5`

## Expected Improvements After Retraining
- `back_width` MAE: 1.46 → ~0.4 (view-aware nulling for front images)
- `lat_flare` MAE: 1.24 → ~0.3 (same)
- Ratio targets: +20-30% (pose-guided landmark anchoring)
- Ordinal targets: +10-15% within-1 accuracy (better augmentation)

**Why:**
The fixed-fraction segmentation was measuring shoulder/waist/hip at wrong positions
for non-standard poses. Now pose landmarks anchor every measurement.

**How to apply:**
Always use `preprocess_with_alignment()` + `extract_segmentation_features(img, pose)`
— never call `extract_segmentation_features(img)` without the pose parameter.
