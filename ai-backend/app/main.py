"""
PhysiqueMax AI Backend — FastAPI entrypoint.

Architecture summary:
  POST /analyze-body  → CV pipeline → ML model → RawMeasurementResponse
  POST /train-model   → dataset → XGBoost/MLP → registered model
  POST /predict-score → feature vector → model → RawMeasurementResponse

The response from /analyze-body is identical to what the Supabase Edge Function
'analyze' returns. No TypeScript client changes required.
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.analyze import router as analyze_router
from app.api.train import router as train_router
from app.api.predict import router as predict_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm up MediaPipe and YOLO at startup to avoid cold-start latency on first request
    print("[startup] Warming up CV models...")
    try:
        from pipeline.pose_estimator import get_pose_detector
        get_pose_detector()
        print("[startup] MediaPipe Pose ready")
    except Exception as e:
        print(f"[startup] MediaPipe warmup failed: {e}")

    try:
        from pipeline.segmenter import _get_yolo
        _get_yolo()
        print("[startup] YOLOv8 ready")
    except Exception as e:
        print(f"[startup] YOLO warmup failed: {e}")

    # Pre-load the active model
    try:
        from models.registry import get_model
        model = get_model()
        if model:
            print("[startup] ML model loaded")
        else:
            print("[startup] No trained model found — heuristic fallback active")
    except Exception as e:
        print(f"[startup] Model load failed: {e}")

    yield
    print("[shutdown] Cleanup complete")


app = FastAPI(
    title="PhysiqueMax AI Backend",
    version="1.0.0",
    description="Computer vision physique analysis — no LLMs, fully deterministic",
    lifespan=lifespan,
)

# CORS: allow the mobile app and Supabase Edge Functions
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:8081,https://your-supabase-project.supabase.co"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router, tags=["inference"])
app.include_router(train_router, tags=["training"])
app.include_router(predict_router, tags=["inference"])


@app.get("/health")
async def health():
    from models.registry import get_model, _registry
    model = get_model()
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "active_version": _registry.get_active_version(),
    }


@app.get("/")
async def root():
    return {"service": "PhysiqueMax AI", "docs": "/docs"}
