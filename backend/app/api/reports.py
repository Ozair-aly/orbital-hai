"""API routes — report generation and CSV results export."""
from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse, StreamingResponse
from app.services import experiment_service as svc
from app.services.report_service import compute_results, generate_report
import io, csv

router = APIRouter()

@router.post("/experiments/{experiment_id}/report")
def build_report(experiment_id: str):
    exp = svc.get_experiment(experiment_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    preds   = svc.get_predictions(experiment_id)
    results = compute_results(exp, preds)
    return generate_report(exp, results)

@router.get("/experiments/{experiment_id}/export/csv")
def export_csv(experiment_id: str):
    """Download prediction results as CSV."""
    exp = svc.get_experiment(experiment_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    preds = svc.get_predictions(experiment_id)
    if not preds:
        raise HTTPException(status_code=404, detail="No predictions yet for this experiment.")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "window_index", "timestamp_start", "timestamp_end",
        "predicted_activity", "confidence",
    ])
    for p in preds:
        writer.writerow([
            p.window_index, p.timestamp_start, p.timestamp_end,
            p.predicted, p.confidence,
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.read()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{experiment_id}_results.csv"'},
    )
