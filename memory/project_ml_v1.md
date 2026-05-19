---
name: project-ml-v1
description: PhysiqueMax AI ML pipeline status — v3 multi-stage architecture built May 2026
metadata:
  type: project
---

# ML Pipeline Status (v3 — updated 2026-05-19)

## Current Architecture: Multi-Stage V3

**Why:** Previous v2 was monolithic (image → single XGBoost/MLP → all targets). This caused overfitting on lighting/pose, poor generalization, no per-muscle interpretability. V3 fixes this with a true multi-stage pipeline.

### V3 Pipeline Stages
1. **Preprocess + alignment** — existing `pipeline/preprocessor.py`
2. **Pose estimation** — MediaPipe 33 keypoints
3. **Region cropping** — `pipeline/region_cropper.py` — 9 anatomical regions (chest, abs, left_bicep, right_bicep, shoulders, lats, quads, calves, full_body)
4. **Backbone embedding** — `models/backbones/dinov2_extractor.py` — DINOv2-ViT-S/14 (384-dim) → EfficientNet-B0 fallback → random projection
5. **Hand-crafted features** — `pipeline/region_features.py` — 32-dim per region (edge sharpness, texture density, vascularity proxy, symmetry)
6. **Per-muscle heads** — `models/muscle_heads/head_model.py` — MuscleHeadEnsemble, 8 heads, 416→128→64→2 (mean, log_var), MC-dropout uncertainty
7. **Ranking model** — `models/ranking/ranking_model.py` — Siamese encoder, triplet loss + NT-Xent contrastive
8. **Aggregation** — `models/aggregation/aggregation_model.py` — overall score, BF% (with CI), training level (1-5)
9. **Inference orchestrator** — `inference/pipeline.py` — run_pipeline()

### New Files (2026-05-19)
- `pipeline/region_cropper.py` — keypoint-guided bounding boxes
- `pipeline/region_features.py` — 32-dim hand-crafted features
- `models/backbones/dinov2_extractor.py` — DINOv2 + fallbacks
- `models/muscle_heads/head_model.py` — per-muscle regression heads
- `models/ranking/ranking_model.py` — pairwise/triplet ranking
- `models/aggregation/aggregation_model.py` — final aggregation + BF heuristic
- `inference/pipeline.py` — end-to-end inference
- `training/train_muscle_heads.py` — Stage 3 training
- `training/train_ranking.py` — Stage 4 ranking fine-tuning
- `training/train_full_pipeline.py` — orchestrator
- `training/labeling/pairwise_collector.py` — pairwise label collection
- `configs/model_config.yaml` + `configs/training_config.yaml`
- `utils/metrics.py` + `utils/region_utils.py`

### Loss Functions
- **Per-muscle heads (Stage 3):** NLL_Gaussian + λ_huber × Huber(δ=1.0)
- **Ranking (Stage 4):** λ_pairwise × BradleyTerry + λ_contrastive × NT-Xent
- **Triplet:** max(0, margin - (pos-anc)) + max(0, margin - (anc-neg))
- **Aggregation:** Huber + NLL for physique/BF heads + CrossEntropy for training level

### API Changes
- `app/api/analyze.py` — now routes to v3 by default (`PHYSIQUE_V3_PIPELINE=1`)
- `app/schema.py` — added `V3Analysis`, `MuscleScores`, `MuscleUncertainties`, `BodyFatEstimate`
- Response has `v3` field alongside legacy `raw_measurements` (backward compat)

### MVP Training (no images needed)
```bash
# Generate synthetic data (56-feature, 2000 samples)
python -m training.generate_synthetic --n-samples 2000 --output data/train.jsonl

# Bootstrap pairwise labels from synthetic
python -m training.labeling.pairwise_collector synthetic \
  --input data/train.jsonl --output data/pairwise_labels.jsonl

# Train all stages
python -m training.train_full_pipeline --mvp
# OR just stage 3:
python -m training.train_muscle_heads --data data/train.jsonl --output artifacts/models/muscle_heads.pt
```

### Production Training (with real images)
```bash
# Cache backbone features offline
python -m utils.region_utils --images-dir data/images/

# Collect pairwise labels
python -m training.labeling.pairwise_collector label \
  --images-dir data/images/ --muscle biceps

# Full pipeline
python -m training.train_full_pipeline
```

### Environment Variables
- `PHYSIQUE_V3_PIPELINE=1` — enable v3 (default=1)
- `PHYSIQUE_BACKBONE=dinov2` — backbone choice (dinov2/efficientnet/random)
- `PHYSIQUE_MODEL_DIR=artifacts/models` — model files directory
- `PHYSIQUE_MC_SAMPLES=20` — MC dropout samples

### Previous V2 Status
- xgboost-v5 trained on 2000 × 56 features still available
- Falls back to v2 automatically when `PHYSIQUE_V3_PIPELINE=0`
- V2 heuristic fallback still active in v3 pipeline when no model files found

**How to apply:** Use `inference/pipeline.py:run_pipeline()` for all new analysis requests. The v3 models need training first; until then the pipeline falls back to v2 heuristics automatically.
