# Setup & Installation Guide — ORBITAL (SIH26174)

Step-by-step instructions for configuring, running, testing, and deploying the ORBITAL prototype.

---

## 1. Prerequisites

Ensure your host workstation has the following installed:
- **Python**: 3.11 or later
- **Node.js**: 20.0 or later
- **npm**: 10.0 or later
- **Git**: 2.30+

---

## 2. Environment Setup

### 2.1 Backend Setup
Open a terminal in the project root:

```bash
# Optional: Create and activate virtual environment
python -m venv .venv

# On Windows PowerShell:
.venv\Scripts\Activate.ps1
# On macOS / Linux:
source .venv/bin/activate

# Install Python dependencies
python -m pip install -r backend/requirements.txt
```

### 2.2 Model Training & Asset Generation
```bash
# 1. Generate 15,000 synthetic sensor samples
python ml/generate_demo_data.py

# 2. Extract features and train the Random Forest pipeline
python ml/train_pipeline.py
```
This produces `models/activity_pipeline.pkl`.

### 2.3 Automated Testing
```bash
# Execute integration test suite
python tests/test_api.py
```

### 2.4 Running the FastAPI Backend
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
Test that the server is alive:
```bash
curl http://127.0.0.1:8000/health
```

---

## 3. Frontend Setup

In a second terminal window:

```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```

Visit **http://localhost:5173** in Google Chrome or Microsoft Edge (recommended for Web Speech API support).

---

## 4. Production Build

To build the optimized static assets:

```bash
cd frontend
npm run build
```
Assets will be generated in `frontend/dist/`.
