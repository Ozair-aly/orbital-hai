"""
Feature Extraction — the bridge between raw sensor readings and the ML model.

Why feature extraction?
  The ML model cannot look at a raw time series and understand it.  Instead we
  break the stream into short windows (e.g. 2 seconds) and compute summary
  numbers (mean, std, range …) for each window.  Those numbers are called
  *features* and they become the input to the classifier.

IMPORTANT: This exact same function is used during both training AND inference.
  If the features differ between training and inference the model produces
  garbage predictions.  Having one shared module prevents that mistake.
"""

from __future__ import annotations

from typing import List

import numpy as np
import pandas as pd


# ---------------------------------------------------------------------------
# Configuration — must match ml/train_pipeline.py
# ---------------------------------------------------------------------------
WINDOW_SIZE    = 100   # samples per window  (2 s at 50 Hz)
WINDOW_OVERLAP = 50    # samples to step forward (50 % overlap)
SENSOR_COLS    = ["acc_x", "acc_y", "acc_z", "gyro_x", "gyro_y", "gyro_z"]


def extract_features_from_window(window: pd.DataFrame) -> np.ndarray:
    """
    Compute statistical features from one window of sensor data.

    Returns a 1-D array of length 48 (6 signals × 8 statistics).

    The 8 statistics per signal are:
        mean, std, min, max, range, rms, skewness, kurtosis
    """
    feats: List[float] = []

    for col in SENSOR_COLS:
        s = window[col].values.astype(float)

        mean_ = float(np.mean(s))
        std_  = float(np.std(s))
        min_  = float(np.min(s))
        max_  = float(np.max(s))
        rng_  = max_ - min_
        rms_  = float(np.sqrt(np.mean(s ** 2)))

        # Higher-order statistics
        demeaned = s - mean_
        n        = len(s)
        skew_    = float(np.mean(demeaned ** 3) / (std_ ** 3 + 1e-9))
        kurt_    = float(np.mean(demeaned ** 4) / (std_ ** 4 + 1e-9))

        feats.extend([mean_, std_, min_, max_, rng_, rms_, skew_, kurt_])

    return np.array(feats, dtype=float)


def extract_features_from_readings(readings: List[dict]) -> tuple[np.ndarray, list]:
    """
    Slide a window over a list of sensor-reading dicts and extract features.

    Args:
        readings: list of dicts with keys:
                  timestamp, acc_x, acc_y, acc_z, gyro_x, gyro_y, gyro_z

    Returns:
        feature_matrix : shape (n_windows, 48)
        window_meta    : list of (timestamp_start, timestamp_end) per window
    """
    df = pd.DataFrame(readings)

    # Ensure required columns exist
    missing = [c for c in SENSOR_COLS if c not in df.columns]
    if missing:
        raise ValueError(f"Missing sensor columns: {missing}")

    feature_rows = []
    window_meta  = []

    i = 0
    while i + WINDOW_SIZE <= len(df):
        win = df.iloc[i : i + WINDOW_SIZE]
        feature_rows.append(extract_features_from_window(win))
        t_start = float(win["timestamp"].iloc[0])
        t_end   = float(win["timestamp"].iloc[-1])
        window_meta.append((t_start, t_end))
        i += WINDOW_OVERLAP

    if not feature_rows:
        raise ValueError(
            f"Not enough data to form even one window.  "
            f"Need at least {WINDOW_SIZE} readings, got {len(df)}."
        )

    return np.vstack(feature_rows), window_meta
