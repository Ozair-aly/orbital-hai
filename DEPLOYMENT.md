# Deployment Guide — ORBITAL (SIH26174)

This guide outlines several production and cloud deployment options for **ORBITAL — Human Activity Intelligence**, designed to keep the React frontend and FastAPI backend modular and independently scalable.

---

## 🚀 Option 1: Docker Compose (Recommended for Local Server, VPS, or EC2)

Deploy the entire stack with a single command on any server with Docker and Docker Compose installed:

```bash
# Clone the repository
git clone https://github.com/Ozair-aly/orbital-hai.git
cd orbital-hai

# Build and start both containers
docker compose up -d --build
```

- **Frontend Application**: `http://<your-server-ip>:3000`
- **FastAPI API**: `http://<your-server-ip>:8000`
- **API Documentation**: `http://<your-server-ip>:8000/docs`

---

## ☁️ Option 2: Free Cloud Tier (Vercel + Render)

### Step 1: Deploy Backend to Render (or Railway)
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New → Blueprint** or **Web Service**.
2. Connect your GitHub repository: `https://github.com/Ozair-aly/orbital-hai.git`.
3. Render will auto-detect [`render.yaml`](file:///C:/Users/NIDA%20RAHAMATH/.gemini/antigravity/scratch/orbital/render.yaml):
   - **Environment**: Python
   - **Build Command**: `pip install -r backend/requirements.txt && python ml/generate_demo_data.py && python ml/train_pipeline.py`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: `.`
4. Once deployed, note down your live API URL (e.g. `https://orbital-api.onrender.com`).

### Step 2: Deploy Frontend to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/) and click **Add New → Project**.
2. Import your GitHub repository: `https://github.com/Ozair-aly/orbital-hai.git`.
3. Configure settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**, add:
   - Key: `VITE_API_BASE_URL`
   - Value: `https://orbital-api.onrender.com` (your Render backend URL)
5. Click **Deploy**. Vercel will build and assign an HTTPS URL (e.g. `https://orbital-hai.vercel.app`).

---

## 🚢 Option 3: Google Cloud Run (Containerized Serverless)

If deploying to Google Cloud:

```bash
# 1. Build and push backend to Google Artifact Registry
gcloud builds submit --config=cloudbuild.yaml .

# 2. Deploy backend to Cloud Run
gcloud run deploy orbital-backend \
  --image gcr.io/[PROJECT_ID]/orbital-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# 3. Deploy frontend to Firebase Hosting or Cloud Run
cd frontend
npm run build
firebase deploy --only hosting
```

---

## 📋 Production Checklist

- [x] Responsive layout verified on mobile (375px), tablet (768px), and desktop (1440px).
- [x] CORS origins configured via `ORBITAL_CORS_ORIGINS`.
- [x] `VITE_API_BASE_URL` configured in production environment.
- [x] Static model artifact (`activity_pipeline.pkl`) included or generated at build time.
- [x] Web Speech API permissions configured to gracefully degrade to text on unsupported browsers or over HTTP.
- [x] Clear disclaimers indicating synthetic prototype status for SIH26174.
