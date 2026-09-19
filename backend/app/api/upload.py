"""API routes — CSV upload."""
import io
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from app.schemas.schemas import UploadResponse
from app.services import experiment_service as svc
import pandas as pd

router = APIRouter()

REQUIRED_COLS = {"timestamp", "acc_x", "acc_y", "acc_z", "gyro_x", "gyro_y", "gyro_z"}
MAX_ROWS      = 50_000

@router.post("/upload", response_model=UploadResponse)
async def upload_csv(
    experiment_id: str = Form(...),
    file: UploadFile = File(...),
):
    exp = svc.get_experiment(experiment_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted.")

    contents = await file.read()
    warnings = []

    try:
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {e}")

    # Validate columns
    missing = REQUIRED_COLS - set(df.columns)
    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"CSV is missing required columns: {sorted(missing)}"
        )

    if len(df) > MAX_ROWS:
        df = df.head(MAX_ROWS)
        warnings.append(f"File truncated to {MAX_ROWS} rows.")

    # Drop NaN rows
    before = len(df)
    df = df.dropna(subset=list(REQUIRED_COLS))
    after  = len(df)
    if after < before:
        warnings.append(f"Dropped {before - after} rows with missing values.")

    if len(df) == 0:
        raise HTTPException(status_code=422, detail="No valid rows remain after cleaning.")

    readings = df[list(REQUIRED_COLS)].to_dict(orient="records")
    svc.store_readings(experiment_id, readings)

    preview = df.head(5).to_dict(orient="records")

    return UploadResponse(
        experiment_id = experiment_id,
        rows_received = len(df),
        columns       = list(df.columns),
        preview       = preview,
        warnings      = warnings,
    )
