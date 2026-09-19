# ORBITAL — Human Activity Intelligence (HAI)
### AI-Powered On-board BAS Experiment Monitoring Prototype

[![SIH26174](https://img.shields.io/badge/SIH-26174-blue.svg)](https://sih.gov.in)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141.1-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react)](https://reactjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-1.9.0-F7931E.svg?logo=scikit-learn)](https://scikit-learn.org)
[![Status](https://img.shields.io/badge/Status-Prototype%20Demonstrator-amber.svg)](#disclaimer)

---

## 🌌 Overview

**ORBITAL — Human Activity Intelligence** is a hackathon prototype developed for **SIH26174: AI Human Activity Recognition for On-board BAS Experiments**. It provides an end-to-end, reproducible software architecture for capturing, classifying, analyzing, and documenting human physical activity states from 6-Degree-of-Freedom (6-DoF) inertial measurement units (IMUs).

Designed with a clean, aerospace-grade light user interface and a hands-free **ORBITAL Voice** assistant, the system demonstrates how AI pipelines can support biological and physical sciences experiments in simulated microgravity and habitat environments.

> [!WARNING]
> **Prototype Disclaimer**: This software is an academic demonstration and engineering prototype. It uses synthetic and simulated laboratory IMU datasets. It does **not** claim flight-certified operational status, live astronaut telemetry validation, or real spacecraft integration.

---

## 🎯 Key Features

- **Strict 5-Step Workflow**: Guided mission stepper ensuring valid experiment configuration, telemetry ingestion, AI inference, analysis, and report generation.
- **ORBITAL Voice Assistant**: Floating voice operator utilizing the browser Web Speech API for hands-free navigation, stream control, and telemetry explanations with full text fallback.
- **6-DoF Kinematic Telemetry**: Live browser-side simulation engine synthesizing tri-axial accelerometer ($m/s^2$) and gyroscope ($rad/s$) signals.
- **Machine Learning Pipeline**: Random Forest classifier operating on 48 statistical features extracted from 2-second sliding windows (50% overlap).
- **Interactive Telemetry Analytics**: Dynamic Recharts visualizations featuring activity timelines, pie charts, confidence distributions, and live waveform monitors.
- **Reproducible Reporting & Export**: Downloadable plain-text experiment summaries and CSV prediction records.

---

## 🔄 Five-Step Mission Workflow

```
[ Step 1: Setup ] ──► [ Step 2: Ingestion ] ──► [ Step 3: AI Inference ] ──► [ Step 4: Analysis ] ──► [ Step 5: Report ]
  Configure experiment   Simulate / Upload CSV     Windowing & 48-Features   Timelines & Dist.       Export Report & CSV
```

1. **Step 1 — Experiment Setup**: Configure mission name, unique session ID, data source mode (simulated/upload), activity classes, and sampling frequency (10–200 Hz).
2. **Step 2 — Data Collection**: Ingest sensor telemetry via the real-time simulation engine (50 Hz) or upload a verified 6-axis CSV.
3. **Step 3 — AI Activity Recognition**: Slice time series into 2-second windows (100 samples with 50% overlap), extract 48 statistical features, and execute Random Forest inference.
4. **Step 4 — Results & Analysis**: Inspect chronological activity ribbons, duration distributions, average confidence scores, and time-share statistics.
5. **Step 5 — Report & Export**: Generate comprehensive text reports detailing session parameters, dataset disclosures, and download results as CSV.

---

## 🎙️ ORBITAL Voice Commands

The floating voice assistant provides hands-free operation:

| Category | Example Voice Commands | Action |
| :--- | :--- | :--- |
| **Navigation** | `"Go to data collection"`, `"Next step"`, `"Go back"` | Moves between the 5 workflow steps |
| **Simulation** | `"Start simulation"`, `"Pause simulation"`, `"Reset"` | Controls the live telemetry stream |
| **Inspection** | `"Show current activity"`, `"Summarize experiment"` | Speaks latest classified state & confidence |
| **Education** | `"Explain sensor readings"`, `"How does the AI work?"` | Explains 6-DoF telemetry & 48-feature RF model |

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────┐
│               Frontend (React 18 + Vite)               │
│  - WorkflowStepper (5 Steps)   - SensorChart (Recharts)│
│  - ORBITAL Voice Assistant     - Zustand Store         │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP JSON / Multipart
┌───────────────────────────▼────────────────────────────┐
│               Backend (FastAPI + Python 3.11)          │
│  - /api/experiments  - /api/predict  - /api/upload     │
│  - Lifespan ModelLoader (activity_pipeline.pkl)        │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│              ML Pipeline (Scikit-Learn)                │
│  - 2s Sliding Window (100 samples, 50% step)           │
│  - 48 Statistical Features (Mean, Std, RMS, Kurtosis)  │
│  - StandardScaler + RandomForestClassifier (100 trees) │
└────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
orbital/
├── backend/
│   ├── app/
│   │   ├── api/             # API routes: experiments, predict, upload, reports
│   │   ├── models/          # Singleton ML pipeline loader
│   │   ├── schemas/         # Pydantic request/response contracts
│   │   ├── services/        # Business logic: experiment, ML, and report services
│   │   ├── utils/           # Shared 48-feature extraction module
│   │   └── main.py          # FastAPI app entry point with CORS & lifespan
│   └── requirements.txt     # Pinned Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI: WorkflowStepper, SensorChart, VoiceAssistant
│   │   ├── layouts/         # AppLayout, Sidebar, Topbar
│   │   ├── pages/           # 5 Workflow steps: Setup, Ingestion, Inference, Analysis, Report
│   │   ├── services/        # Typed API client (api.ts)
│   │   ├── store/           # Zustand global state (experimentStore.ts)
│   │   ├── types/           # TypeScript interfaces & types
│   │   └── utils/           # Simulation engine (simulationEngine.ts)
│   ├── package.json
│   └── vite.config.ts
├── ml/
│   ├── generate_demo_data.py # Synthetic 15,000-sample IMU generator
│   └── train_pipeline.py     # Reproducible Random Forest training pipeline
├── models/
│   └── activity_pipeline.pkl # Trained pipeline artifact
├── tests/
│   └── test_api.py           # Automated integration test suite
├── docs/                     # Extended architectural guides
├── README.md                 # Project manifesto
└── .gitignore
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.11+**
- **Node.js v20+** and **npm**

### 1. Clone Repository
```bash
git clone https://github.com/Ozair-aly/orbital-hai.git
cd orbital-hai
```

### 2. Backend Setup & Model Generation
```bash
# Generate synthetic dataset (15,000 samples)
python ml/generate_demo_data.py

# Train Random Forest pipeline
python ml/train_pipeline.py

# Run automated integration tests
python tests/test_api.py

# Start FastAPI server
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📄 License & Attribution

Developed for **Smart India Hackathon (SIH26174)**.
Author: **Ozair Ali** (`ozairalibaig8@gmail.com`).
Released under the MIT License.
