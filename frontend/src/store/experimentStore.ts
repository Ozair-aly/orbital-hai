// experimentStore.ts — Global state management with Zustand.
//
// What is Zustand?
//   Zustand is a tiny state management library.  Think of it as a shared
//   JavaScript object that any component can read and update.  When the
//   object changes, only the components that use that piece of state
//   re-render automatically.
//
// Why do we need global state?
//   The five workflow steps are separate React components but they all need
//   to share the same data:
//     Step 1 creates the experiment → Step 2 collects readings →
//     Step 3 runs predictions → Step 4 shows results → Step 5 exports.
//   Without a shared store, we would have to pass data through dozens of
//   props which becomes unmanageable.

import { create } from 'zustand';
import type {
  Experiment,
  SensorReading,
  ActivityPrediction,
  ExperimentResults,
  HealthStatus,
} from '../types';

interface ExperimentStore {
  // ── Navigation ────────────────────────────────────────────────────────────
  currentStep: number;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  // ── Backend health ────────────────────────────────────────────────────────
  health: HealthStatus;
  setHealth: (h: HealthStatus) => void;

  // ── Current experiment ────────────────────────────────────────────────────
  experiment: Experiment | null;
  setExperiment: (e: Experiment | null) => void;

  // ── Sensor readings (live simulation or uploaded) ─────────────────────────
  readings: SensorReading[];
  addReadings: (r: SensorReading[]) => void;
  clearReadings: () => void;

  // ── Simulation state ──────────────────────────────────────────────────────
  simRunning: boolean;
  setSimRunning: (v: boolean) => void;

  // ── Predictions ───────────────────────────────────────────────────────────
  predictions: ActivityPrediction[];
  setPredictions: (p: ActivityPrediction[]) => void;

  // ── Results ───────────────────────────────────────────────────────────────
  results: ExperimentResults | null;
  setResults: (r: ExperimentResults | null) => void;

  // ── Upload state ──────────────────────────────────────────────────────────
  uploadWarnings: string[];
  setUploadWarnings: (w: string[]) => void;

  // ── Voice assistant ───────────────────────────────────────────────────────
  voiceOpen: boolean;
  setVoiceOpen: (v: boolean) => void;

  // ── Reset everything ──────────────────────────────────────────────────────
  resetAll: () => void;
}

export const useExperimentStore = create<ExperimentStore>((set) => ({
  currentStep: 1,
  setStep:  (step) => set({ currentStep: Math.min(Math.max(step, 1), 5) }),
  nextStep: ()     => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 5) })),
  prevStep: ()     => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),

  health: { status: 'checking', model_loaded: false },
  setHealth: (h) => set({ health: h }),

  experiment: null,
  setExperiment: (e) => set({ experiment: e }),

  readings: [],
  addReadings: (r) => set((s) => ({ readings: [...s.readings, ...r] })),
  clearReadings: () => set({ readings: [] }),

  simRunning: false,
  setSimRunning: (v) => set({ simRunning: v }),

  predictions: [],
  setPredictions: (p) => set({ predictions: p }),

  results: null,
  setResults: (r) => set({ results: r }),

  uploadWarnings: [],
  setUploadWarnings: (w) => set({ uploadWarnings: w }),

  voiceOpen: false,
  setVoiceOpen: (v) => set({ voiceOpen: v }),

  resetAll: () =>
    set({
      currentStep:    1,
      experiment:     null,
      readings:       [],
      simRunning:     false,
      predictions:    [],
      results:        null,
      uploadWarnings: [],
    }),
}));
