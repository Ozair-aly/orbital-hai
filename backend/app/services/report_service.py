"""
Report Service — generates a plain-text experiment report from session data.

In a production system this might produce a PDF (via reportlab / weasyprint).
For this prototype we produce a structured text report that the frontend can
display and the user can download as a .txt file.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List

from app.schemas.schemas import (
    ActivityPrediction,
    ActivitySummary,
    ExperimentOut,
    ExperimentResults,
    ReportOut,
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def compute_results(
    experiment: ExperimentOut,
    predictions: List[ActivityPrediction],
) -> ExperimentResults:
    """Aggregate predictions into per-activity summaries."""
    if not predictions:
        return ExperimentResults(
            experiment_id    = experiment.id,
            total_windows    = 0,
            duration_seconds = 0.0,
            activity_summary = [],
            predictions      = [],
            generated_at     = _now(),
        )

    total = len(predictions)

    # Duration from first window start to last window end
    duration = predictions[-1].timestamp_end - predictions[0].timestamp_start

    # Count windows per activity
    counts:  dict = {}
    conf_sum:dict = {}
    for p in predictions:
        counts[p.predicted]   = counts.get(p.predicted, 0) + 1
        conf_sum[p.predicted] = conf_sum.get(p.predicted, 0.0) + p.confidence

    # Each window ≈ 2 s (WINDOW_SIZE=100 at 50 Hz)
    window_seconds = 2.0

    summaries: List[ActivitySummary] = []
    for act, cnt in sorted(counts.items()):
        summaries.append(
            ActivitySummary(
                activity       = act,
                count          = cnt,
                total_seconds  = round(cnt * window_seconds, 1),
                percentage     = round(100.0 * cnt / total, 1),
                avg_confidence = round(conf_sum[act] / cnt, 3),
            )
        )

    return ExperimentResults(
        experiment_id    = experiment.id,
        total_windows    = total,
        duration_seconds = round(duration, 2),
        activity_summary = summaries,
        predictions      = predictions,
        generated_at     = _now(),
    )


def generate_report(
    experiment: ExperimentOut,
    results: ExperimentResults,
) -> ReportOut:
    """Build a human-readable text report."""
    lines: List[str] = []
    sep = "=" * 60

    lines += [
        sep,
        "  ORBITAL — Human Activity Intelligence",
        "  Experiment Report  (SIH26174 Prototype)",
        sep,
        "",
        f"Experiment Name : {experiment.name}",
        f"Experiment ID   : {experiment.id}",
        f"Description     : {experiment.description or 'N/A'}",
        f"Data Source     : {experiment.data_source.value}",
        f"Sample Rate     : {experiment.sample_rate_hz} Hz",
        f"Status          : {experiment.status.value}",
        f"Created At      : {experiment.created_at.isoformat()}",
        f"Report At       : {results.generated_at.isoformat()}",
        "",
        sep,
        "  DATASET INFORMATION",
        sep,
        "",
        "  ⚠  This experiment uses SYNTHETIC demonstration data.",
        "  Results do NOT represent validated real-world performance.",
        "  Do not use these metrics for aerospace or safety decisions.",
        "",
        f"Total Windows Analysed : {results.total_windows}",
        f"Total Duration         : {results.duration_seconds:.1f} s",
        "",
        sep,
        "  ACTIVITY RECOGNITION RESULTS",
        sep,
        "",
        f"{'Activity':<15} {'Windows':>7} {'Time(s)':>8} {'Pct%':>6} {'Avg Conf':>9}",
        "-" * 50,
    ]

    for s in results.activity_summary:
        lines.append(
            f"{s.activity:<15} {s.count:>7} {s.total_seconds:>8.1f} "
            f"{s.percentage:>6.1f} {s.avg_confidence:>9.3f}"
        )

    lines += [
        "",
        sep,
        "  MODEL INFORMATION",
        sep,
        "",
        "  Algorithm  : Random Forest Classifier (scikit-learn)",
        "  Training   : Synthetic demonstration dataset (labeled by rule)",
        "  Features   : 48 statistical features per 2-second window",
        "  Classes    : Walking | Standing | Sitting | Running | Lying Down",
        "",
        "  ⚠  Accuracy metrics shown are from the synthetic training split.",
        "  They do not represent real astronaut or on-orbit performance.",
        "",
        sep,
        "  END OF REPORT",
        sep,
    ]

    return ReportOut(
        experiment_id = experiment.id,
        report_text   = "\n".join(lines),
        generated_at  = results.generated_at,
    )
