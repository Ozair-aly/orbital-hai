"""
ML Service — wraps the ModelLoader and feature extraction into one clean call.

Inference flow:
  raw readings → feature extraction → sklearn pipeline → labels + probabilities
"""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import List

from app.models.model_loader import ModelLoader
from app.schemas.schemas import ActivityPrediction, PredictResponse
from app.utils.feature_extraction import extract_features_from_readings


ACTIVITY_CLASSES = ["Walking", "Standing", "Sitting", "Running", "Lying Down"]


def run_prediction(experiment_id: str, readings: List[dict]) -> PredictResponse:
    """
    Full inference pipeline.

    1. Extract features from sliding windows over `readings`.
    2. Run the sklearn pipeline to get predicted labels and probabilities.
    3. Wrap results in a PredictResponse schema.
    """
    t0 = time.perf_counter()

    # Step 1 — feature extraction
    feature_matrix, window_meta = extract_features_from_readings(readings)

    # Step 2 — model prediction
    labels, probs = ModelLoader.predict(feature_matrix)

    # The pipeline knows the class order via pipeline.classes_
    pipeline    = ModelLoader.get_pipeline()
    class_names = list(pipeline.classes_)

    # Step 3 — build structured predictions
    predictions: List[ActivityPrediction] = []
    for idx, (label, prob_row, (ts, te)) in enumerate(
        zip(labels, probs, window_meta)
    ):
        confidence   = float(prob_row.max())
        prob_dict    = {c: round(float(p), 4) for c, p in zip(class_names, prob_row)}
        predictions.append(
            ActivityPrediction(
                window_index    = idx,
                timestamp_start = ts,
                timestamp_end   = te,
                predicted       = str(label),
                confidence      = round(confidence, 4),
                probabilities   = prob_dict,
            )
        )

    elapsed_ms = (time.perf_counter() - t0) * 1000

    return PredictResponse(
        experiment_id       = experiment_id,
        predictions         = predictions,
        processing_time_ms  = round(elapsed_ms, 2),
        model_version       = ModelLoader.get_version(),
    )
