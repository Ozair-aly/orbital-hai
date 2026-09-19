# API Documentation — ORBITAL REST Services

The ORBITAL backend exposes a high-performance RESTful API built with **FastAPI**. Interactive OpenAPI documentation is accessible at `/docs` or `/redoc` when the server is running.

**Base URL**: `http://localhost:8000`

---

## 1. System Health

### `GET /health`
Returns backend connectivity and ML model loading status.

#### Response `200 OK`
```json
{
  "status": "ok",
  "service": "ORBITAL HAI API",
  "model_loaded": true
}
```

---

## 2. Experiment Management

### `GET /api/experiments`
Lists all active and stored experiment sessions.

#### Response `200 OK`
```json
{
  "experiments": [
    {
      "id": "c6a28e93-b09e-4361-9c60-a23bf0100de5",
      "name": "Microgravity Gait Simulation 01",
      "description": "Demonstrating 5-class kinematic recognition",
      "data_source": "simulated",
      "activities": ["Walking", "Standing", "Sitting", "Running", "Lying Down"],
      "sample_rate_hz": 50,
      "status": "created",
      "created_at": "2026-09-19T05:40:00Z",
      "updated_at": "2026-09-19T05:40:00Z"
    }
  ],
  "total": 1
}
```

### `POST /api/experiments`
Initializes a new experiment configuration.

#### Request Body
```json
{
  "name": "Astronaut Exercise Monitoring Session",
  "description": "Treadmill and resistance simulation",
  "data_source": "simulated",
  "activities": ["Walking", "Standing", "Sitting", "Running", "Lying Down"],
  "sample_rate_hz": 50
}
```

#### Response `201 Created`
Returns the created `ExperimentOut` object with a generated UUID and timestamps.

### `GET /api/experiments/{experiment_id}`
Retrieves session metadata by ID.

---

## 3. Machine Learning Inference

### `POST /api/predict`
Ingests an array of 6-DoF sensor readings, partitions them into 2-second windows (100 samples with 50% overlap), and returns predicted activities with probability vectors.

#### Request Body
```json
{
  "experiment_id": "c6a28e93-b09e-4361-9c60-a23bf0100de5",
  "readings": [
    {
      "timestamp": 0.0,
      "acc_x": 0.051,
      "acc_y": 0.012,
      "acc_z": 9.814,
      "gyro_x": 0.002,
      "gyro_y": 0.005,
      "gyro_z": -0.001
    }
  ]
}
```

#### Response `200 OK`
```json
{
  "experiment_id": "c6a28e93-b09e-4361-9c60-a23bf0100de5",
  "predictions": [
    {
      "window_index": 0,
      "timestamp_start": 0.0,
      "timestamp_end": 2.0,
      "predicted": "Standing",
      "confidence": 0.985,
      "probabilities": {
        "Walking": 0.01,
        "Running": 0.00,
        "Standing": 0.985,
        "Sitting": 0.005,
        "Lying Down": 0.00
      }
    }
  ],
  "processing_time_ms": 14.2,
  "model_version": "rf-v1-1789794578",
  "note": "Synthetic demonstration data only."
}
```

---

## 4. Telemetry CSV Upload

### `POST /api/upload`
Uploads and validates an external CSV file with multipart form data.

#### Form Parameters
- `experiment_id` (string)
- `file` (multipart file, must end in `.csv`)

#### Required CSV Headers
`timestamp, acc_x, acc_y, acc_z, gyro_x, gyro_y, gyro_z`

#### Response `200 OK`
```json
{
  "experiment_id": "c6a28e93-b09e-4361-9c60-a23bf0100de5",
  "rows_received": 1500,
  "columns": ["timestamp", "acc_x", "acc_y", "acc_z", "gyro_x", "gyro_y", "gyro_z"],
  "preview": [...],
  "warnings": []
}
```

---

## 5. Analytics & Reports

### `GET /api/experiments/{experiment_id}/results`
Computes consolidated duration, window counts, and average confidence per activity.

### `POST /api/experiments/{experiment_id}/report`
Compiles an ASCII-formatted mission summary report with full dataset disclosures.

### `GET /api/experiments/{experiment_id}/export/csv`
Streams prediction records as a downloadable `.csv` file attachment.
