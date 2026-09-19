"""API routes — ML prediction."""
from fastapi import APIRouter, HTTPException
from app.schemas.schemas import PredictRequest, PredictResponse
from app.services import experiment_service as svc
from app.services.ml_service import run_prediction
from app.models.model_loader import ModelLoader

router = APIRouter()

@router.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest):
    if not ModelLoader.is_loaded():
        raise HTTPException(
            status_code=503,
            detail=(
                "ML model is not loaded. "
                "Run ml/train_pipeline.py then restart the backend."
            ),
        )
    exp = svc.get_experiment(payload.experiment_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    readings = [r.model_dump() for r in payload.readings]
    svc.store_readings(payload.experiment_id, readings)

    try:
        result = run_prediction(payload.experiment_id, readings)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    svc.store_predictions(payload.experiment_id, result.predictions)
    return result
