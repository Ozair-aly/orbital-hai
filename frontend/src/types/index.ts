// Central TypeScript types for the ORBITAL application.
// Having all types in one place means every component and service
// agrees on exactly what shape the data has.

export type DataSource = 'simulated' | 'uploaded';
export type ExperimentStatus = 'created' | 'collecting' | 'analysing' | 'completed';
export type ActivityClass = 'Walking' | 'Standing' | 'Sitting' | 'Running' | 'Lying Down' | 'Unknown';

export const WORKFLOW_STEPS = [
  { id: 1, label: 'Experiment Setup',    short: 'Setup'     },
  { id: 2, label: 'Data Collection',     short: 'Data'      },
  { id: 3, label: 'Activity Recognition',short: 'AI Model'  },
  { id: 4, label: 'Results & Analysis',  short: 'Results'   },
  { id: 5, label: 'Report & Export',     short: 'Report'    },
] as const;

export const DEFAULT_ACTIVITIES: ActivityClass[] = [
  'Walking', 'Standing', 'Sitting', 'Running', 'Lying Down',
];

// ─── Sensor & Prediction ────────────────────────────────────────────────────

export interface SensorReading {
  timestamp: number;
  acc_x: number;
  acc_y: number;
  acc_z: number;
  gyro_x: number;
  gyro_y: number;
  gyro_z: number;
}

export interface ActivityPrediction {
  window_index: number;
  timestamp_start: number;
  timestamp_end: number;
  predicted: string;
  confidence: number;
  probabilities: Record<string, number>;
}

// ─── Experiment ─────────────────────────────────────────────────────────────

export interface ExperimentConfig {
  name: string;
  description: string;
  data_source: DataSource;
  activities: string[];
  sample_rate_hz: number;
}

export interface Experiment extends ExperimentConfig {
  id: string;
  status: ExperimentStatus;
  created_at: string;
  updated_at: string;
}

// ─── Results ─────────────────────────────────────────────────────────────────

export interface ActivitySummary {
  activity: string;
  count: number;
  total_seconds: number;
  percentage: number;
  avg_confidence: number;
}

export interface ExperimentResults {
  experiment_id: string;
  total_windows: number;
  duration_seconds: number;
  activity_summary: ActivitySummary[];
  predictions: ActivityPrediction[];
  generated_at: string;
}

// ─── Upload ──────────────────────────────────────────────────────────────────

export interface UploadResponse {
  experiment_id: string;
  rows_received: number;
  columns: string[];
  preview: Record<string, number>[];
  warnings: string[];
}

// ─── Backend health ──────────────────────────────────────────────────────────

export interface HealthStatus {
  status: 'ok' | 'error' | 'checking';
  model_loaded: boolean;
}
