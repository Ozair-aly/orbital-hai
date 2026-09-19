"""
Model Loader — singleton that keeps the trained sklearn pipeline in memory.

Why a singleton?
  Loading a .pkl file from disk every time a prediction is requested would be
  slow.  Instead we load once at startup and keep the object in memory for the
  entire lifetime of the server.

What is a .pkl file?
  Python's joblib library can serialise (save) any Python object — including a
  trained sklearn Pipeline — to a binary file.  When we load it back we get
  the exact same object with all learned parameters intact.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

import joblib
import numpy as np


class ModelLoader:
    _pipeline = None          # the loaded sklearn Pipeline
    _version:  str = "none"
    _path:     str = ""

    @classmethod
    def load(cls, path: str) -> bool:
        """Load the pipeline from disk.  Returns True on success."""
        abs_path = Path(path).resolve()
        if not abs_path.exists():
            print(f"[ModelLoader] WARNING — model file not found: {abs_path}")
            print("[ModelLoader] Run ml/train_pipeline.py first.")
            cls._pipeline = None
            cls._version  = "untrained"
            return False

        cls._pipeline = joblib.load(str(abs_path))
        cls._path     = str(abs_path)
        cls._version  = f"rf-v1-{abs_path.stat().st_mtime:.0f}"
        print(f"[ModelLoader] Loaded pipeline: {cls._version}")
        return True

    @classmethod
    def is_loaded(cls) -> bool:
        return cls._pipeline is not None

    @classmethod
    def get_pipeline(cls):
        return cls._pipeline

    @classmethod
    def get_version(cls) -> str:
        return cls._version

    @classmethod
    def predict(cls, feature_matrix: np.ndarray):
        """
        Run prediction.

        Args:
            feature_matrix: 2-D numpy array, shape (n_windows, n_features).

        Returns:
            predicted labels (array of str) and probability matrix.
        """
        if cls._pipeline is None:
            raise RuntimeError(
                "Model is not loaded.  Run ml/train_pipeline.py first, "
                "then restart the backend."
            )
        labels = cls._pipeline.predict(feature_matrix)
        probs  = cls._pipeline.predict_proba(feature_matrix)
        return labels, probs
