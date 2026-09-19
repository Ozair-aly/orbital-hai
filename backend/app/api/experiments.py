"""API routes — Experiment CRUD."""
from fastapi import APIRouter, HTTPException
from app.schemas.schemas import ExperimentCreate, ExperimentList, ExperimentOut
from app.services import experiment_service as svc

router = APIRouter()

@router.get("", response_model=ExperimentList)
def list_experiments():
    exps = svc.list_experiments()
    return ExperimentList(experiments=exps, total=len(exps))

@router.post("", response_model=ExperimentOut, status_code=201)
def create_experiment(payload: ExperimentCreate):
    return svc.create_experiment(payload)

@router.get("/{experiment_id}", response_model=ExperimentOut)
def get_experiment(experiment_id: str):
    exp = svc.get_experiment(experiment_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return exp

@router.get("/{experiment_id}/results")
def get_results(experiment_id: str):
    from app.services.report_service import compute_results
    exp  = svc.get_experiment(experiment_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    preds = svc.get_predictions(experiment_id)
    return compute_results(exp, preds)

@router.post("/{experiment_id}/report")
def create_report(experiment_id: str):
    from app.schemas.schemas import ReportRequest
    from app.services.report_service import compute_results, generate_report
    exp  = svc.get_experiment(experiment_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    preds   = svc.get_predictions(experiment_id)
    results = compute_results(exp, preds)
    return generate_report(exp, results)
