"""
train_pipeline.py — Train and Save the Activity Recognition Pipeline

PIPELINE OVERVIEW:
  1. Load labeled demo data (generate it first if needed)
  2. Slide a window of WINDOW_SIZE samples with 50% overlap
  3. Extract 48 statistical features per window
  4. Train a Random Forest classifier
  5. Evaluate on held-out test set (honest metrics)
  6. Save the trained pipeline with joblib

WHY RANDOM FOREST?
  - Works well on tabular features without hyperparameter tuning
  - Naturally provides class probabilities (used for confidence display)
  - Interpretable and reproducible
  - Appropriate for a synthetic demonstration dataset

The pipeline object is a StandardScaler + RandomForestClassifier wrapped in
sklearn.pipeline.Pipeline, so training and inference share identical
preprocessing automatically.
"""

import os
import sys

# Allow importing from backend utils (identical feature extraction)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from app.utils.feature_extraction import (
    WINDOW_SIZE,
    WINDOW_OVERLAP,
    SENSOR_COLS,
    extract_features_from_window,
)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
ROOT      = os.path.join(os.path.dirname(__file__), "..")
DATA_FILE = os.path.join(ROOT, "data", "demo_sensor_data.csv")
MODEL_DIR = os.path.join(ROOT, "models")
MODEL_OUT = os.path.join(MODEL_DIR, "activity_pipeline.pkl")


def build_windows(df: pd.DataFrame):
    """
    Slide a window over the DataFrame and return feature matrix + labels.

    Each window's label = the majority activity label in that window.
    (For synthetic data every window will be 100% one label.)
    """
    X_rows, y_rows = [], []
    i = 0
    while i + WINDOW_SIZE <= len(df):
        win    = df.iloc[i : i + WINDOW_SIZE]
        feats  = extract_features_from_window(win)
        label  = win["label"].mode()[0]          # majority class
        X_rows.append(feats)
        y_rows.append(label)
        i += WINDOW_OVERLAP
    return np.vstack(X_rows), np.array(y_rows)


def main():
    print("=" * 60)
    print("  ORBITAL ML Pipeline — Training")
    print("  Synthetic demonstration dataset")
    print("=" * 60)

    # ------------------------------------------------------------------
    # 1. Load data
    # ------------------------------------------------------------------
    if not os.path.exists(DATA_FILE):
        print(f"\n[ERROR] Data file not found: {DATA_FILE}")
        print("Run  python ml/generate_demo_data.py  first.\n")
        sys.exit(1)

    df = pd.read_csv(DATA_FILE)
    print(f"\nLoaded {len(df)} rows from {DATA_FILE}")
    print("Label distribution:")
    print(df["label"].value_counts().to_string())

    # ------------------------------------------------------------------
    # 2. Feature extraction
    # ------------------------------------------------------------------
    print(f"\nExtracting features (window={WINDOW_SIZE}, step={WINDOW_OVERLAP}) …")
    X, y = build_windows(df)
    print(f"Feature matrix shape: {X.shape}  ({X.shape[0]} windows × {X.shape[1]} features)")

    # ------------------------------------------------------------------
    # 3. Train / test split (stratified)
    # ------------------------------------------------------------------
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"Train: {len(X_train)} windows  |  Test: {len(X_test)} windows")

    # ------------------------------------------------------------------
    # 4. Build and train pipeline
    # ------------------------------------------------------------------
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("clf",    RandomForestClassifier(
            n_estimators=100,
            max_depth=None,
            random_state=42,
            n_jobs=-1,
        )),
    ])

    print("\nTraining Random Forest …")
    pipeline.fit(X_train, y_train)
    print("Training complete.")

    # ------------------------------------------------------------------
    # 5. Honest evaluation on held-out test set
    # ------------------------------------------------------------------
    y_pred = pipeline.predict(X_test)

    print("\n" + "=" * 60)
    print("  EVALUATION RESULTS  (synthetic demonstration data only)")
    print("  These numbers do NOT represent real-world performance.")
    print("=" * 60)
    print(classification_report(y_test, y_pred))

    print("Confusion matrix:")
    print(confusion_matrix(y_test, y_pred))

    # ------------------------------------------------------------------
    # 6. Save pipeline
    # ------------------------------------------------------------------
    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(pipeline, MODEL_OUT)
    print(f"\nPipeline saved -> {MODEL_OUT}")
    print("\nYou can now start the backend server.")


if __name__ == "__main__":
    main()
