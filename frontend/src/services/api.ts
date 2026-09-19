// api.ts — All communication with the FastAPI backend lives here.
//
// What is an API service module?
//   Instead of scattering fetch() calls across every component, we put them
//   all in one place.  If the backend URL changes, we update one file.
//   Every function returns typed data so TypeScript catches mistakes early.

import type {
  Experiment,
  ExperimentConfig,
  ExperimentResults,
  HealthStatus,
  ActivityPrediction,
  SensorReading,
  UploadResponse,
} from '../types';

// VITE_ prefix makes this variable visible in the browser bundle.
// Default to localhost:8000 so the app works without a .env file.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(detail?.detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Health ──────────────────────────────────────────────────────────────────
export const checkHealth = (): Promise<HealthStatus> =>
  request<HealthStatus>('/health');

// ─── Experiments ─────────────────────────────────────────────────────────────
export const listExperiments = (): Promise<{ experiments: Experiment[]; total: number }> =>
  request('/api/experiments');

export const createExperiment = (config: ExperimentConfig): Promise<Experiment> =>
  request('/api/experiments', {
    method: 'POST',
    body: JSON.stringify(config),
  });

export const getExperiment = (id: string): Promise<Experiment> =>
  request(`/api/experiments/${id}`);

export const getResults = (id: string): Promise<ExperimentResults> =>
  request(`/api/experiments/${id}/results`);

// ─── Prediction ──────────────────────────────────────────────────────────────
export const runPrediction = (
  experiment_id: string,
  readings: SensorReading[],
): Promise<{ experiment_id: string; predictions: ActivityPrediction[]; processing_time_ms: number; model_version: string; note: string }> =>
  request('/api/predict', {
    method: 'POST',
    body: JSON.stringify({ experiment_id, readings }),
  });

// ─── Upload ──────────────────────────────────────────────────────────────────
export const uploadCSV = async (
  experiment_id: string,
  file: File,
): Promise<UploadResponse> => {
  const form = new FormData();
  form.append('experiment_id', experiment_id);
  form.append('file', file);
  const res = await fetch(`${BASE_URL}/api/upload`, { method: 'POST', body: form });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(detail?.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
};

// ─── Report ──────────────────────────────────────────────────────────────────
export const generateReport = (id: string): Promise<{ experiment_id: string; report_text: string; generated_at: string }> =>
  request(`/api/experiments/${id}/report`, { method: 'POST' });

export const exportCSVUrl = (id: string) =>
  `${BASE_URL}/api/experiments/${id}/export/csv`;

export const api = {
  checkHealth,
  listExperiments,
  createExperiment,
  getExperiment,
  getResults,
  runPrediction,
  uploadCSV,
  generateReport,
  exportCSVUrl,
};
