---
name: project-ml-v1
description: PhysiqueMax AI ML pipeline status — 56-feature vector, v5 model trained on 2000 synthetic samples, model NOW ACTIVE
metadata:
  type: project
---

# ML Pipeline Status (v2 — updated 2026-05-18)

## Current Active Model
- **xgboost-v5** — ACTIVE — trained on 2000 samples × 56 features
- Previous v4 was trained on 50-feature data → dimension mismatch → NEVER used at inference

## Root Cause of v4 Failure (all versions before v5)
All training data had 50-feature vectors. The v2 pipeline produces 56-feature vectors.
At inference: `n_feat=56 == N_FEATURES=56` check passes, but the scaler was fit on 50 dims
→ `scaler.transform()` threw ValueError → caught by except → heuristic fallback.
**Result: ML model was never used. All predictions were pure heuristics.**

## v5 Fixes (2026-05-18)
1. **generate_synthetic.py** now produces 56-feature vectors (6 new v2 features added):
   `neck_width_norm [49], waist_concavity [50], hip_drop_norm [51],
    taper_uniformity [52], calf_width_mean [53], conditioning_gradient [54],
    pose_type_encoded [55]` (moved from old index 49)
2. **20 archetypes** (was 13): added pro_bodybuilder, elite_female, powerlifter,
   beginner_back, overweight_female, elite_male_side, advanced_male_side
3. **2000 training samples** regenerated with 56 features (was 600 with 50)
4. **dataset.py**: lazy pipeline imports (mediapipe/YOLO not needed for pre-computed data);
   rejects 50-feature vectors (only accepts 56)
5. **analyze.py**: ml_weight default raised 0.25 → 0.65 (model now trusted more)
6. **Label formulas improved**: waist_concavity and conditioning_gradient now contribute
   directly to abs_definition, v_taper_visibility, muscular_separation labels
7. **calf_development** now uses actual calf_width_mean feature (was approximated from thigh)

## Expected v5 Performance
- high_weight MAE target: ~0.30 (from 0.56 on v3, 0.60 on v4)
- Model is now actually used (not silently falling to heuristics)
- ml_weight=0.65 (was 0.25): ML dominates the blend

## Feature Vector Layout (56 features)
- **0-25**: Pose geometric (shoulder_width_norm through lower_body_visibility)
- **26-48**: Segmentation original (body_mask_area_norm through edge_density_lower)
- **49-54**: New v2 silhouette features (neck, waist_concavity, hip_drop, taper_uniformity, calf, cond_gradient)
- **55**: pose_type_encoded (was index 49 in v1)

## To Retrain from Scratch
```bash
# Generate fresh data
python -m training.generate_synthetic --n-samples 2000 --output data/train.jsonl

# Delete stale cache
rm -f artifacts/feature_cache/*.npz

# Retrain
python -m training.train --dataset data/train.jsonl --model xgboost --trials 80 --run-name xgboost-vN
```

## Why ml_weight Was Raised
0.25 was set conservatively because the model was broken (50-feature mismatch).
After fixing the pipeline, 0.65 trusts the ML model appropriately.
Set `ANALYZE_ML_BLEND_WEIGHT` env var to override.

**How to apply:**
Always use `--dataset data/train.jsonl` (56-feature data).
Never mix 50-feature and 56-feature data in the same training run.
