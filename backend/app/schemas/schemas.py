"""
Pydantic Schemas — the "shape" of every request and response.

Think of a schema as a contract: the frontend promises to send data in this
shape, and the backend promises to reply in this shape.  Pydantic validates
every field automatically and returns a clear error if something is wrong.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------

class DataSource(str, Enum):
    simulated = "simulated"
    uploaded  = "uploaded"

class ExperimentStatus(str, Enum):
    created    = "created"
    collecting = "collecting"
    analysing  = "analysing"
    completed  = "completed"

class ActivityClass(str, Enum):
    walking    = "Walking"
    standing   = "Standing"
    sitting    = "Sitting"
    running    = "Running"
    lying_down = "Lying Down"
    unknown    = "Unknown"


# ---------------------------------------------------------------------------
# Sensor reading — one row of CSV / one streaming sample
# ---------------------------------------------------------------------------

class SensorReading(BaseModel):
    timestamp: float = Field(..., description="Unix timestamp (seconds)")
    acc_x: float
    acc_y: float
    acc_z: float
    gyro_x: float
    gyro_y: float
    gyro_z: float


# ---------------------------------------------------------------------------
# Experiment
# ---------------------------------------------------------------------------

class ExperimentCreate(BaseModel):
    name:        str        = Field(..., min_length=1, max_length=120)
    description: str        = Field("", max_length=500)
    data_source: DataSource = DataSource.simulated
    activities:  List[str]  = Field(
        default_factory=lambda: ["Walking","Standing","Sitting","Running","Lying Down"]
    )
    sample_rate_hz: int     = Field(50, ge=10, le=200)

class ExperimentOut(BaseModel):
    id:             str
    name:           str
    description:    str
    data_source:    DataSource
    activities:     List[str]
    sample_rate_hz: int
    status:         ExperimentStatus
    created_at:     datetime
    updated_at:     datetime

class ExperimentList(BaseModel):
    experiments: List[ExperimentOut]
    total:       int


# ---------------------------------------------------------------------------
# Prediction
# ---------------------------------------------------------------------------

class PredictRequest(BaseModel):
    experiment_id: str
    readings:      List[SensorReading] = Field(..., min_length=1)

class ActivityPrediction(BaseModel):
    window_index:   int
    timestamp_start: float
    timestamp_end:  float
    predicted:      str
    confidence:     float                          # 0.0 – 1.0
    probabilities:  Dict[str, float]               # all class probs

class PredictResponse(BaseModel):
    experiment_id: str
    predictions:   List[ActivityPrediction]
    processing_time_ms: float
    model_version: str
    note:          str = "Synthetic demonstration data only."


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------

class UploadResponse(BaseModel):
    experiment_id: str
    rows_received: int
    columns:       List[str]
    preview:       List[Dict[str, Any]]            # first 5 rows
    warnings:      List[str]


# ---------------------------------------------------------------------------
# Results
# ---------------------------------------------------------------------------

class ActivitySummary(BaseModel):
    activity:        str
    count:           int
    total_seconds:   float
    percentage:      float
    avg_confidence:  float

class ExperimentResults(BaseModel):
    experiment_id:    str
    total_windows:    int
    duration_seconds: float
    activity_summary: List[ActivitySummary]
    predictions:      List[ActivityPrediction]
    generated_at:     datetime


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------

class ReportRequest(BaseModel):
    experiment_id: str
    include_raw:   bool = False

class ReportOut(BaseModel):
    experiment_id: str
    report_text:   str
    generated_at:  datetime
