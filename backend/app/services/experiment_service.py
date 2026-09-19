"""
Experiment Service — in-memory store for experiment sessions.

In a production system this would use a database (PostgreSQL, SQLite, etc.).
For this prototype we keep everything in a Python dict so there are no
external dependencies and the code stays readable.

Key concept — what is a "service"?
  A service is a module that contains business logic.  The API route
  (api/experiments.py) handles HTTP; this service handles the actual work.
  Keeping them separate makes each file easy to test and understand.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

from app.schemas.schemas import (
    DataSource,
    ExperimentCreate,
    ExperimentOut,
    ExperimentStatus,
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


# In-memory store: experiment_id → dict
_store: Dict[str, dict] = {}

# Per-experiment sensor readings and predictions
_readings:    Dict[str, list] = {}
_predictions: Dict[str, list] = {}


# ---------------------------------------------------------------------------
# CRUD helpers
# ---------------------------------------------------------------------------

def create_experiment(data: ExperimentCreate) -> ExperimentOut:
    exp_id = str(uuid.uuid4())
    now    = _now()
    record = {
        "id":             exp_id,
        "name":           data.name,
        "description":    data.description,
        "data_source":    data.data_source,
        "activities":     data.activities,
        "sample_rate_hz": data.sample_rate_hz,
        "status":         ExperimentStatus.created,
        "created_at":     now,
        "updated_at":     now,
    }
    _store[exp_id]      = record
    _readings[exp_id]   = []
    _predictions[exp_id] = []
    return ExperimentOut(**record)


def get_experiment(exp_id: str) -> Optional[ExperimentOut]:
    rec = _store.get(exp_id)
    return ExperimentOut(**rec) if rec else None


def list_experiments() -> List[ExperimentOut]:
    return [ExperimentOut(**r) for r in _store.values()]


def update_status(exp_id: str, status: ExperimentStatus) -> None:
    if exp_id in _store:
        _store[exp_id]["status"]     = status
        _store[exp_id]["updated_at"] = _now()


# ---------------------------------------------------------------------------
# Readings helpers (used by upload and predict routes)
# ---------------------------------------------------------------------------

def store_readings(exp_id: str, readings: list) -> None:
    _readings.setdefault(exp_id, []).extend(readings)
    update_status(exp_id, ExperimentStatus.collecting)


def get_readings(exp_id: str) -> list:
    return _readings.get(exp_id, [])


def store_predictions(exp_id: str, preds: list) -> None:
    _predictions[exp_id] = preds
    update_status(exp_id, ExperimentStatus.completed)


def get_predictions(exp_id: str) -> list:
    return _predictions.get(exp_id, [])
