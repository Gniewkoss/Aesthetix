"""
Model versioning registry.

Stores model artifacts locally (and optionally S3) with semantic versions.
Loaded model is cached in-process; hot-reload triggered by file mtime change.
"""
from __future__ import annotations
import os
import json
import time
from pathlib import Path
from typing import Optional, Literal, Union

from models.measurement_model import XGBoostMeasurementModel, MLPMeasurementModel

MODEL_DIR = Path(os.getenv("MODEL_DIR", "artifacts/models"))
REGISTRY_FILE = MODEL_DIR / "registry.json"

ModelType = Union[XGBoostMeasurementModel, MLPMeasurementModel]


class ModelRegistry:
    def __init__(self):
        self._cache: dict[str, tuple[ModelType, float]] = {}  # version → (model, mtime)
        self._active_version: Optional[str] = None

    def _registry(self) -> dict:
        if REGISTRY_FILE.exists():
            return json.loads(REGISTRY_FILE.read_text())
        return {}

    def _save_registry(self, reg: dict) -> None:
        REGISTRY_FILE.parent.mkdir(parents=True, exist_ok=True)
        REGISTRY_FILE.write_text(json.dumps(reg, indent=2))

    def register(self, version: str, model_path: str,
                 model_type: str, metrics: dict,
                 set_active: bool = True) -> None:
        reg = self._registry()
        reg[version] = {
            "path": model_path,
            "type": model_type,
            "metrics": metrics,
            "registered_at": time.time(),
            "active": False,
        }
        if set_active:
            for v in reg:
                reg[v]["active"] = False
            reg[version]["active"] = True
            self._active_version = version
        self._save_registry(reg)

    def get_active_version(self) -> Optional[str]:
        reg = self._registry()
        for version, meta in reg.items():
            if meta.get("active"):
                return version
        return None

    def load(self, version: Optional[str] = None) -> Optional[ModelType]:
        if version is None:
            version = self.get_active_version()
        if version is None:
            return None

        reg = self._registry()
        if version not in reg:
            return None

        meta = reg[version]
        path = meta["path"]
        mtime = Path(path).stat().st_mtime if Path(path).exists() else 0

        cached = self._cache.get(version)
        if cached and cached[1] == mtime:
            return cached[0]

        model_type = meta.get("type", "xgboost")
        if model_type == "xgboost":
            model = XGBoostMeasurementModel.load(path)
        else:
            model = MLPMeasurementModel.load(path)

        self._cache[version] = (model, mtime)
        return model

    def list_versions(self) -> list[dict]:
        reg = self._registry()
        return [{"version": v, **meta} for v, meta in reg.items()]


_registry = ModelRegistry()


def get_model() -> Optional[ModelType]:
    return _registry.load()


def register_model(version: str, path: str, model_type: str,
                   metrics: dict, set_active: bool = True) -> None:
    _registry.register(version, path, model_type, metrics, set_active)


def list_versions() -> list[dict]:
    return _registry.list_versions()
