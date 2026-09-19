import React, { useState, useCallback } from 'react';
import {
  FlaskConical,
  Hash,
  FileText,
  Database,
  Activity,
  Gauge,
  CheckCircle,
  AlertCircle,
  Loader2,
  Upload,
} from 'lucide-react';
import { useExperimentStore } from '../store/experimentStore';
import { api } from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type DataSource = 'simulated' | 'uploaded';

interface FormState {
  name: string;
  description: string;
  dataSource: DataSource;
  activities: string[];
  sampleRate: number;
}

interface ValidationErrors {
  name?: string;
  activities?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_ACTIVITIES = [
  'Walking',
  'Standing',
  'Sitting',
  'Running',
  'Lying Down',
];

const ACTIVITY_ICONS: Record<string, string> = {
  Walking: '🚶',
  Standing: '🧍',
  Sitting: '🪑',
  Running: '🏃',
  'Lying Down': '🛌',
};

function generateExperimentId(): string {
  const now = new Date();
  const stamp = now.getFullYear().toString().slice(-2) +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).toUpperCase().slice(2, 7);
  return `EXP-${stamp}-${rand}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ExperimentSetup: React.FC = () => {
  const { setExperiment, nextStep } = useExperimentStore();

  const [experimentId] = useState<string>(generateExperimentId);

  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    dataSource: 'simulated',
    activities: ['Walking', 'Standing', 'Sitting'],
    sampleRate: 50,
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, name: e.target.value }));
      if (errors.name) setErrors((er) => ({ ...er, name: undefined }));
    },
    [errors.name],
  );

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, description: e.target.value }));
    },
    [],
  );

  const handleDataSourceChange = useCallback(
    (src: DataSource) => {
      setForm((f) => ({ ...f, dataSource: src }));
    },
    [],
  );

  const handleActivityToggle = useCallback(
    (activity: string) => {
      setForm((f) => {
        const next = f.activities.includes(activity)
          ? f.activities.filter((a) => a !== activity)
          : [...f.activities, activity];
        return { ...f, activities: next };
      });
      if (errors.activities) setErrors((er) => ({ ...er, activities: undefined }));
    },
    [errors.activities],
  );

  const handleSampleRateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, sampleRate: Number(e.target.value) }));
    },
    [],
  );

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};
    if (!form.name.trim()) {
      newErrors.name = 'Experiment name is required.';
    } else if (form.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters.';
    }
    if (form.activities.length === 0) {
      newErrors.activities = 'Select at least one activity.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setServerError(null);
      if (!validate()) return;

      setLoading(true);
      try {
        const payload = {
          name: form.name.trim(),
          description: form.description.trim(),
          data_source: form.dataSource,
          activities: form.activities,
          sample_rate_hz: form.sampleRate,
        };

        const created = await api.createExperiment(payload);
        setExperiment(created);
        setSuccess(true);

        // Advance to step 2 after a short delay so user sees success state
        setTimeout(() => {
          nextStep();
        }, 1200);
      } catch (err: unknown) {
        setServerError(
          err instanceof Error ? err.message : 'Failed to create experiment. Please try again.',
        );
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, experimentId],
  );

  // ── Success state ─────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-100">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-[#172B4D]">Experiment Created!</h2>
        <p className="text-[#718096] text-center max-w-sm">
          Your experiment has been set up successfully. Proceeding to data collection…
        </p>
        <div className="px-5 py-3 rounded-xl bg-green-50 border border-green-200 font-mono text-green-700 text-sm tracking-wider">
          {experimentId}
        </div>
        <Loader2 className="w-5 h-5 text-[#3978E8] animate-spin" />
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#3978E8] bg-opacity-10">
          <FlaskConical className="w-6 h-6 text-[#3978E8]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#172B4D]">Experiment Setup</h1>
          <p className="text-sm text-[#718096]">Configure your activity recognition experiment</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        {/* Experiment Name */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E5EAF2] p-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-[#172B4D] mb-2">
            <FlaskConical className="w-4 h-4 text-[#3978E8]" />
            Experiment Name
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={handleNameChange}
            placeholder="e.g., Morning Activity Session"
            className={`w-full px-4 py-2.5 rounded-lg border text-[#172B4D] text-sm outline-none transition-all focus:ring-2 focus:ring-[#3978E8] focus:ring-opacity-30 ${
              errors.name
                ? 'border-red-400 bg-red-50'
                : 'border-[#E5EAF2] bg-[#F7F9FC] focus:border-[#3978E8]'
            }`}
          />
          {errors.name && (
            <p className="flex items-center gap-1 mt-1.5 text-xs text-red-500">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Experiment ID */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E5EAF2] p-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-[#172B4D] mb-2">
            <Hash className="w-4 h-4 text-[#718096]" />
            Experiment ID
            <span className="ml-2 text-xs font-normal text-[#718096]">(auto-generated)</span>
          </label>
          <input
            type="text"
            value={experimentId}
            readOnly
            className="w-full px-4 py-2.5 rounded-lg border border-[#E5EAF2] bg-[#F7F9FC] text-[#718096] text-sm font-mono cursor-not-allowed"
          />
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E5EAF2] p-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-[#172B4D] mb-2">
            <FileText className="w-4 h-4 text-[#3978E8]" />
            Description
            <span className="ml-2 text-xs font-normal text-[#718096]">(optional)</span>
          </label>
          <textarea
            value={form.description}
            onChange={handleDescriptionChange}
            rows={3}
            placeholder="Briefly describe the purpose of this experiment…"
            className="w-full px-4 py-2.5 rounded-lg border border-[#E5EAF2] bg-[#F7F9FC] text-[#172B4D] text-sm outline-none resize-none transition-all focus:ring-2 focus:ring-[#3978E8] focus:ring-opacity-30 focus:border-[#3978E8]"
          />
        </div>

        {/* Data Source */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E5EAF2] p-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-[#172B4D] mb-4">
            <Database className="w-4 h-4 text-[#3978E8]" />
            Data Source
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            {/* Simulated */}
            <button
              type="button"
              onClick={() => handleDataSourceChange('simulated')}
              className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                form.dataSource === 'simulated'
                  ? 'border-[#3978E8] bg-blue-50'
                  : 'border-[#E5EAF2] bg-[#F7F9FC] hover:border-[#3978E8] hover:bg-blue-50'
              }`}
            >
              <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${form.dataSource === 'simulated' ? 'bg-[#3978E8]' : 'bg-[#E5EAF2]'}`}>
                <Activity className={`w-5 h-5 ${form.dataSource === 'simulated' ? 'text-white' : 'text-[#718096]'}`} />
              </div>
              <div>
                <p className={`text-sm font-semibold ${form.dataSource === 'simulated' ? 'text-[#3978E8]' : 'text-[#172B4D]'}`}>Simulated Data</p>
                <p className="text-xs text-[#718096]">Generate synthetic sensor readings</p>
              </div>
              <div className={`ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center ${form.dataSource === 'simulated' ? 'border-[#3978E8]' : 'border-[#E5EAF2]'}`}>
                {form.dataSource === 'simulated' && <div className="w-2 h-2 rounded-full bg-[#3978E8]" />}
              </div>
            </button>

            {/* Upload */}
            <button
              type="button"
              onClick={() => handleDataSourceChange('uploaded')}
              className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                form.dataSource === 'uploaded'
                  ? 'border-[#3978E8] bg-blue-50'
                  : 'border-[#E5EAF2] bg-[#F7F9FC] hover:border-[#3978E8] hover:bg-blue-50'
              }`}
            >
              <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${form.dataSource === 'uploaded' ? 'bg-[#3978E8]' : 'bg-[#E5EAF2]'}`}>
                <Upload className={`w-5 h-5 ${form.dataSource === 'uploaded' ? 'text-white' : 'text-[#718096]'}`} />
              </div>
              <div>
                <p className={`text-sm font-semibold ${form.dataSource === 'uploaded' ? 'text-[#3978E8]' : 'text-[#172B4D]'}`}>Upload CSV</p>
                <p className="text-xs text-[#718096]">Import your own sensor data</p>
              </div>
              <div className={`ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center ${form.dataSource === 'uploaded' ? 'border-[#3978E8]' : 'border-[#E5EAF2]'}`}>
                {form.dataSource === 'uploaded' && <div className="w-2 h-2 rounded-full bg-[#3978E8]" />}
              </div>
            </button>
          </div>
        </div>

        {/* Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E5EAF2] p-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-[#172B4D] mb-4">
            <Activity className="w-4 h-4 text-[#3978E8]" />
            Activities to Recognize
            <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ALL_ACTIVITIES.map((activity) => {
              const checked = form.activities.includes(activity);
              return (
                <button
                  key={activity}
                  type="button"
                  onClick={() => handleActivityToggle(activity)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    checked
                      ? 'border-[#3978E8] bg-blue-50 text-[#3978E8]'
                      : 'border-[#E5EAF2] bg-[#F7F9FC] text-[#718096] hover:border-[#3978E8]'
                  }`}
                >
                  <span className="text-base">{ACTIVITY_ICONS[activity]}</span>
                  <span className="truncate">{activity}</span>
                  {checked && <CheckCircle className="w-3.5 h-3.5 ml-auto shrink-0" />}
                </button>
              );
            })}
          </div>
          {errors.activities && (
            <p className="flex items-center gap-1 mt-2 text-xs text-red-500">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.activities}
            </p>
          )}
          <p className="mt-3 text-xs text-[#718096]">
            {form.activities.length} of {ALL_ACTIVITIES.length} activities selected
          </p>
        </div>

        {/* Sample Rate */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E5EAF2] p-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-[#172B4D] mb-4">
            <Gauge className="w-4 h-4 text-[#3978E8]" />
            Sample Rate
            <span className="ml-auto text-sm font-bold text-[#3978E8]">{form.sampleRate} Hz</span>
          </label>
          <input
            type="range"
            min={10}
            max={200}
            step={5}
            value={form.sampleRate}
            onChange={handleSampleRateChange}
            className="w-full h-2 rounded-full accent-[#3978E8] cursor-pointer"
          />
          <div className="flex justify-between text-xs text-[#718096] mt-1.5">
            <span>10 Hz</span>
            <span>100 Hz</span>
            <span>200 Hz</span>
          </div>
          <div className="mt-3 flex gap-2">
            {[10, 25, 50, 100, 200].map((hz) => (
              <button
                key={hz}
                type="button"
                onClick={() => setForm((f) => ({ ...f, sampleRate: hz }))}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  form.sampleRate === hz
                    ? 'bg-[#3978E8] text-white'
                    : 'bg-[#F7F9FC] border border-[#E5EAF2] text-[#718096] hover:border-[#3978E8]'
                }`}
              >
                {hz}
              </button>
            ))}
          </div>
        </div>

        {/* Server Error */}
        {serverError && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Error</p>
              <p className="text-sm text-red-600">{serverError}</p>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#3978E8] text-white font-semibold text-sm shadow-md hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Experiment…
            </>
          ) : (
            <>
              <FlaskConical className="w-4 h-4" />
              Create Experiment
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ExperimentSetup;
