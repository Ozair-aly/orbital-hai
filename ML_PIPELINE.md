# Machine Learning Pipeline — ORBITAL (SIH26174)

This document details the data generation, feature engineering, model architecture, training protocol, and inference procedures utilized in the **ORBITAL** AI Activity Recognition module.

---

## 1. Pipeline Overview

```
Raw Telemetry (50 Hz)
   │ (acc_x, acc_y, acc_z, gyro_x, gyro_y, gyro_z)
   ▼
Sliding Windowing (Window = 100 samples, Overlap = 50 samples)
   │
   ▼
Statistical Feature Extraction (48 features per window)
   │
   ▼
StandardScaler Normalization
   │
   ▼
RandomForestClassifier (100 estimators, max_depth=None)
   │
   ▼
Activity Prediction & Probabilities Vector
```

---

## 2. Feature Extraction Matrix (48 Features)

For each 2-second time window (100 samples at 50 Hz), 8 statistical metrics are computed independently across all 6 raw degrees of freedom:

| Metric | Formula / Mathematical Description | Interpretability |
| :--- | :--- | :--- |
| **Mean** | $\mu = \frac{1}{N}\sum x_i$ | Static orientation / gravity component |
| **Std Dev** | $\sigma = \sqrt{\frac{1}{N}\sum (x_i - \mu)^2}$ | Energy and dynamic motion intensity |
| **Min** | $\min(X)$ | Extreme negative peak acceleration/velocity |
| **Max** | $\max(X)$ | Extreme positive peak acceleration/velocity |
| **Range** | $\max(X) - \min(X)$ | Total oscillation envelope |
| **RMS** | $\sqrt{\frac{1}{N}\sum x_i^2}$ | Root-mean-square kinetic power |
| **Skewness** | $\frac{\frac{1}{N}\sum (x_i - \mu)^3}{\sigma^3}$ | Asymmetry of kinetic impulse curve |
| **Kurtosis** | $\frac{\frac{1}{N}\sum (x_i - \mu)^4}{\sigma^4}$ | Heaviness of impact tails / jerk transients |

Total Feature Vector Length: $6 \text{ channels} \times 8 \text{ metrics} = 48 \text{ features}$.

---

## 3. Data Integrity & Reproducibility

### Shared Feature Extraction Module
To avoid training-serving skew, both `ml/train_pipeline.py` and `backend/app/services/ml_service.py` import the exact same feature extraction function from `backend/app/utils/feature_extraction.py`:
- `extract_features_from_window()`
- `extract_features_from_readings()`

### Training Dataset (Synthetic Demonstration)
Synthetic IMU signals are produced via `ml/generate_demo_data.py`:
- **Walking**: 1.8 Hz periodic oscillations with moderate acceleration amplitude ($0.6 \text{ m/s}^2$ bounce on $acc_z$).
- **Running**: 3.0 Hz high-frequency periodic impacts ($1.5 \text{ m/s}^2$ bounce, amplified angular rate).
- **Standing**: Gravitational vector localized along $acc_z \approx 9.81 \text{ m/s}^2$ with minimal variance.
- **Sitting**: Gravitational bias with subtle postural tilt.
- **Lying Down**: Gravitational alignment transferred onto $acc_x \approx 9.81 \text{ m/s}^2$.

---

## 4. Evaluation & Metrics

The model was evaluated using a stratified 80/20 train/test split on held-out synthetic test windows:

```
              precision    recall  f1-score   support

  Lying Down       1.00      1.00      1.00        12
     Running       1.00      1.00      1.00        12
     Sitting       1.00      1.00      1.00        12
    Standing       1.00      1.00      1.00        12
     Walking       1.00      1.00      1.00        12

    accuracy                           1.00        60
   macro avg       1.00      1.00      1.00        60
weighted avg       1.00      1.00      1.00        60
```

> [!NOTE]
> Perfect classification scores reflect the idealized synthetic waveforms generated for the demonstration prototype. In real microgravity habitat experiments, noise floors, sensor drift, and complex human kinetics will require transfer learning or fine-tuning on real astronaut biomechanical datasets.
