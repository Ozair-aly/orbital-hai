# Changelog — ORBITAL (SIH26174)

All notable changes to this project will be documented in this file.

---

## [1.0.0] — 2026-09-19

### Added
- **Core Architecture**:
  - FastAPI backend with lifespan model loading and CORS middleware.
  - React 18 frontend with Vite, Tailwind CSS v4, Lucide icons, and Recharts.
  - Zustand global state store synchronizing all 5 mission workflow steps.
- **Workflow Steps**:
  - **Step 1 — Experiment Setup**: Configuration of name, auto-generated ID, source type, target activity selection, and sampling frequency slider.
  - **Step 2 — Data Collection**: Ingestion via 50 Hz real-time browser simulation engine and drag-and-drop 6-axis CSV upload with sanitization.
  - **Step 3 — AI Activity Recognition**: 2-second sliding windowing (50% overlap), 48 statistical feature extractions, and Random Forest classification.
  - **Step 4 — Results & Analysis**: Sequential activity timeline ribbon, duration distribution donut chart, average confidence bars, and tabular summaries.
  - **Step 5 — Report & Export**: Synthesis of plain-text mission summaries with compliance disclosures, downloadable `.txt` report, and raw CSV results.
- **ORBITAL Voice Assistant**:
  - Floating operator widget utilizing browser Web Speech API for speech recognition and audio synthesis.
  - Command parsing for step navigation, simulation controls, and telemetry explanations.
  - Safe whitelist execution and resilient text input fallback.
- **Machine Learning Pipeline**:
  - `generate_demo_data.py`: Synthesizes 15,000 labeled 6-DoF IMU samples across 5 activity states.
  - `train_pipeline.py`: Trains and serializes `StandardScaler` + `RandomForestClassifier` pipeline.
  - Unified feature extractor (`feature_extraction.py`) guaranteeing parity between training and serving.
- **Testing & Documentation**:
  - Automated integration test suite (`tests/test_api.py`) verifying all 7 API endpoints.
  - Full suite of architectural and developer guides (`README.md`, `ARCHITECTURE.md`, `API_DOCUMENTATION.md`, `ML_PIPELINE.md`, `VOICE_ASSISTANT.md`, `SETUP_GUIDE.md`, `CONTRIBUTING.md`).
