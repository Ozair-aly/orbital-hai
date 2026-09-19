"""
test_api.py — Integration and endpoint test suite for ORBITAL backend.
"""

import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from fastapi.testclient import TestClient
from app.main import app
from app.models.model_loader import ModelLoader

# Initialize model explicitly for test environment if needed
model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models", "activity_pipeline.pkl"))
ModelLoader.load(model_path)

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["model_loaded"] is True

def test_experiment_lifecycle():
    # 1. Create experiment
    payload = {
        "name": "Integration Test Experiment",
        "description": "Validating complete automated workflow",
        "data_source": "simulated",
        "activities": ["Walking", "Standing", "Sitting", "Running", "Lying Down"],
        "sample_rate_hz": 50
    }
    create_res = client.post("/api/experiments", json=payload)
    assert create_res.status_code == 201
    exp = create_res.json()
    exp_id = exp["id"]
    assert exp["name"] == payload["name"]

    # 2. Get experiment
    get_res = client.get(f"/api/experiments/{exp_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == exp_id

    # 3. Simulate 120 sensor readings (>= 100 for windowing)
    readings = []
    for i in range(120):
        t = i / 50.0
        readings.append({
            "timestamp": t,
            "acc_x": 0.05,
            "acc_y": 0.02,
            "acc_z": 9.81,
            "gyro_x": 0.01,
            "gyro_y": 0.01,
            "gyro_z": 0.01
        })

    predict_payload = {
        "experiment_id": exp_id,
        "readings": readings
    }
    pred_res = client.post("/api/predict", json=predict_payload)
    assert pred_res.status_code == 200
    pred_data = pred_res.json()
    assert len(pred_data["predictions"]) > 0
    first_pred = pred_data["predictions"][0]
    assert "predicted" in first_pred
    assert "confidence" in first_pred

    # 4. Results check
    results_res = client.get(f"/api/experiments/{exp_id}/results")
    assert results_res.status_code == 200
    res_data = results_res.json()
    assert res_data["total_windows"] == len(pred_data["predictions"])
    assert len(res_data["activity_summary"]) > 0

    # 5. Report generation
    report_res = client.post(f"/api/experiments/{exp_id}/report")
    assert report_res.status_code == 200
    report_data = report_res.json()
    assert "report_text" in report_data
    assert "ORBITAL — Human Activity Intelligence" in report_data["report_text"]

    # 6. CSV export
    csv_res = client.get(f"/api/experiments/{exp_id}/export/csv")
    assert csv_res.status_code == 200
    assert "window_index,timestamp_start" in csv_res.text

    print("\n[PASSED] All ORBITAL API integration tests passed successfully!")

if __name__ == "__main__":
    test_health()
    test_experiment_lifecycle()
