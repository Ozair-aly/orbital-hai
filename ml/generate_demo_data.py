"""
generate_demo_data.py — Synthetic Labeled Sensor Dataset Generator

This script creates a labeled CSV file that looks like real IMU (Inertial
Measurement Unit) data from a wearable sensor worn by a person doing
different activities.

HOW THE SYNTHETIC DATA IS GENERATED:
  We know roughly what a sensor should read for each activity:
    - Walking   : rhythmic oscillations in acc_z (step bounce), moderate gyro
    - Running   : bigger, faster oscillations in acc_z, strong gyro
    - Standing  : near-zero movement, mostly gravity on acc_z (≈ 9.8 m/s²)
    - Sitting   : similar to standing but slightly different tilt
    - Lying Down: gravity vector rotates to acc_x or acc_y

  We add realistic Gaussian noise so the data is not perfectly clean.

WHY SYNTHETIC?
  Real spacecraft IMU datasets for astronaut activity recognition are not
  publicly available.  Synthetic data lets us build and test the full pipeline.
  The model trained here is a DEMONSTRATION ONLY and cannot be used for
  real-world activity recognition without re-training on validated real data.
"""

import os
import numpy as np
import pandas as pd

# Output path
OUTPUT_DIR  = os.path.join(os.path.dirname(__file__), "..", "data")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "demo_sensor_data.csv")

SAMPLE_RATE   = 50          # Hz
SECONDS_EACH  = 60          # seconds of data per activity
NOISE_SCALE   = 0.05        # Gaussian noise standard deviation

SEED = 42
rng  = np.random.default_rng(SEED)


def generate_activity(name: str, n_samples: int, t_start: float) -> pd.DataFrame:
    """Generate n_samples of IMU readings for a given activity."""
    t = np.linspace(t_start, t_start + n_samples / SAMPLE_RATE, n_samples, endpoint=False)

    if name == "Walking":
        acc_x  = 0.1 * np.sin(2 * np.pi * 1.8 * t)          # lateral sway
        acc_y  = 0.2 * np.sin(2 * np.pi * 1.8 * t + 0.5)     # forward/back
        acc_z  = 9.8 + 0.6 * np.sin(2 * np.pi * 1.8 * t)     # vertical bounce
        gyro_x = 0.3 * np.sin(2 * np.pi * 1.8 * t)
        gyro_y = 0.2 * np.sin(2 * np.pi * 3.6 * t)
        gyro_z = 0.1 * np.cos(2 * np.pi * 1.8 * t)

    elif name == "Running":
        acc_x  = 0.3 * np.sin(2 * np.pi * 3.0 * t)
        acc_y  = 0.5 * np.sin(2 * np.pi * 3.0 * t + 0.3)
        acc_z  = 9.8 + 1.5 * np.sin(2 * np.pi * 3.0 * t)
        gyro_x = 0.8 * np.sin(2 * np.pi * 3.0 * t)
        gyro_y = 0.6 * np.sin(2 * np.pi * 6.0 * t)
        gyro_z = 0.4 * np.cos(2 * np.pi * 3.0 * t)

    elif name == "Standing":
        acc_x  = np.zeros(n_samples)
        acc_y  = np.zeros(n_samples)
        acc_z  = np.full(n_samples, 9.81)
        gyro_x = np.zeros(n_samples)
        gyro_y = np.zeros(n_samples)
        gyro_z = np.zeros(n_samples)

    elif name == "Sitting":
        acc_x  = np.full(n_samples, 0.1)                      # slight tilt
        acc_y  = np.zeros(n_samples)
        acc_z  = np.full(n_samples, 9.75)
        gyro_x = np.zeros(n_samples)
        gyro_y = np.zeros(n_samples)
        gyro_z = np.zeros(n_samples)

    elif name == "Lying Down":
        acc_x  = np.full(n_samples, 9.81)                     # lying on side
        acc_y  = np.zeros(n_samples)
        acc_z  = np.zeros(n_samples)
        gyro_x = np.zeros(n_samples)
        gyro_y = np.zeros(n_samples)
        gyro_z = np.zeros(n_samples)

    else:
        raise ValueError(f"Unknown activity: {name}")

    # Add realistic noise to all channels
    noise = lambda: rng.normal(0, NOISE_SCALE, n_samples)
    df = pd.DataFrame({
        "timestamp": t,
        "acc_x":     acc_x  + noise(),
        "acc_y":     acc_y  + noise(),
        "acc_z":     acc_z  + noise(),
        "gyro_x":    gyro_x + noise(),
        "gyro_y":    gyro_y + noise(),
        "gyro_z":    gyro_z + noise(),
        "label":     name,
    })
    return df


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    activities = ["Walking", "Running", "Standing", "Sitting", "Lying Down"]
    frames = []
    t_cursor = 0.0

    for act in activities:
        n = SAMPLE_RATE * SECONDS_EACH
        df = generate_activity(act, n, t_cursor)
        frames.append(df)
        t_cursor += SECONDS_EACH
        print(f"  Generated {len(df)} samples for '{act}'")

    combined = pd.concat(frames, ignore_index=True)
    combined.to_csv(OUTPUT_FILE, index=False)
    print(f"\nSaved {len(combined)} total rows -> {OUTPUT_FILE}")
    print("Label distribution:")
    print(combined["label"].value_counts().to_string())


if __name__ == "__main__":
    main()
