"""
POST /train-model
Triggers training on a dataset. Runs synchronously for small datasets
(<500 samples, ~2 min), returns model version and metrics.

For large datasets, run training/train.py directly on the server or
submit it as a background job (Celery, Modal, etc.).
"""
from __future__ import annotations
import os
import time
from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.schema import TrainRequest, TrainResponse

router = APIRouter()

_training_status: dict = {}


@router.post("/train-model", response_model=TrainResponse)
async def train_model(req: TrainRequest, background_tasks: BackgroundTasks) -> TrainResponse:
    if not os.path.exists(req.dataset_path):
        raise HTTPException(status_code=404,
                            detail=f"Dataset not found: {req.dataset_path}")

    if req.model_type not in ("xgboost", "mlp"):
        raise HTTPException(status_code=400,
                            detail="model_type must be 'xgboost' or 'mlp'")

    run_name = req.run_name or f"{req.model_type}-{int(time.time())}"

    try:
        from training.train import run_training
        result = run_training(
            dataset_path=req.dataset_path,
            model_type=req.model_type,
            n_trials=req.n_trials,
            test_size=req.test_size,
            run_name=run_name,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {e}")

    return TrainResponse(
        run_id=result["version"],
        model_path=result["model_path"],
        metrics=result["metrics"],
        model_version=result["version"],
    )


@router.get("/train-model/versions")
async def list_model_versions():
    from models.registry import list_versions
    return {"versions": list_versions()}


@router.post("/train-model/activate/{version}")
async def activate_version(version: str):
    from models.registry import _registry, list_versions
    versions = list_versions()
    if not any(v["version"] == version for v in versions):
        raise HTTPException(status_code=404, detail=f"Version not found: {version}")
    import json
    from models.registry import REGISTRY_FILE
    reg = json.loads(REGISTRY_FILE.read_text())
    for v in reg:
        reg[v]["active"] = v == version
    REGISTRY_FILE.write_text(json.dumps(reg, indent=2))
    _registry._cache.clear()
    return {"activated": version}
