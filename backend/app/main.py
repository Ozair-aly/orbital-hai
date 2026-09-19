"""
ORBITAL — Human Activity Intelligence
SIH26174 Backend Entry Point

This file boots the FastAPI application.  Every route is registered here via
APIRouter includes so that each file stays focused on a single responsibility.

What FastAPI does:
  FastAPI is a modern Python web framework.  It converts Python functions into
  HTTP endpoints — the browser sends a request, the function runs, and FastAPI
  sends the result back as JSON.

CORS (Cross-Origin Resource Sharing):
  Browsers block requests from one origin (e.g. localhost:5173) to a different
  origin (localhost:8000) unless the server explicitly allows it.
  CORSMiddleware tells the browser "requests from the frontend are fine".
"""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import experiments, predict, upload, reports
from app.models.model_loader import ModelLoader

load_dotenv()  # read .env file if present

# ---------------------------------------------------------------------------
# Lifespan — runs once at startup and once at shutdown
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the ML model when the server starts up."""
    model_path = os.getenv("ORBITAL_MODEL_PATH", "../models/activity_pipeline.pkl")
    ModelLoader.load(model_path)          # warm-up the singleton
    print(f"[ORBITAL] Model loaded from {model_path}")
    yield
    print("[ORBITAL] Shutting down.")

# ---------------------------------------------------------------------------
# App definition
# ---------------------------------------------------------------------------
app = FastAPI(
    title="ORBITAL — Human Activity Intelligence API",
    description=(
        "SIH26174 prototype backend. "
        "Provides experiment management, sensor data processing, "
        "ML-based activity recognition, and report generation. "
        "This is a demonstration system using synthetic data."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — allow the Vite dev server and production build to talk to us
# ---------------------------------------------------------------------------
raw_origins = os.getenv(
    "ORBITAL_CORS_ORIGINS",
    "http://localhost:5173,http://localhost:4173",
)
origins = [o.strip() for o in raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(experiments.router, prefix="/api/experiments", tags=["Experiments"])
app.include_router(predict.router,     prefix="/api",             tags=["Prediction"])
app.include_router(upload.router,      prefix="/api",             tags=["Upload"])
app.include_router(reports.router,     prefix="/api",             tags=["Reports"])

# ---------------------------------------------------------------------------
# Health check — the frontend polls this to confirm the backend is alive
# ---------------------------------------------------------------------------
@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "service": "ORBITAL HAI API",
        "model_loaded": ModelLoader.is_loaded(),
    }
