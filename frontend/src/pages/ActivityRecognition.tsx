import { useState } from 'react';
import {
  BrainCircuit,
  Cpu,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Clock,
  Layers,
  TrendingUp,
} from 'lucide-react';
import { useExperimentStore } from '../store/experimentStore';
import { runPrediction, getResults } from '../services/api';

export function ActivityRecognition() {
  const {
    experiment,
    readings,
    predictions,
    setPredictions,
    setResults,
    nextStep,
    health,
  } = useExperimentStore();

  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [procTime, setProcTime] = useState<number | null>(null);
  const [modelVersion, setModelVersion] = useState<string | null>(null);

  const minRequired = 100;
  const hasData = readings.length >= minRequired;

  const handleRunInference = async () => {
    if (!experiment) {
      setError('No active experiment. Please start at Step 1.');
      return;
    }
    if (!hasData) {
      setError(`Insufficient data: ${readings.length} samples collected, but at least ${minRequired} samples are required for windowing.`);
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const res = await runPrediction(experiment.id, readings);
      setPredictions(res.predictions);
      setProcTime(res.processing_time_ms);
      setModelVersion(res.model_version);

      // Pre-fetch results summary for step 4
      try {
        const fullResults = await getResults(experiment.id);
        setResults(fullResults);
      } catch (err) {
        console.warn('Could not auto-fetch results summary:', err);
      }
    } catch (err: any) {
      setError(err.message || 'Error running model inference on backend.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Activity colors and badges
  const getActivityBadge = (act: string) => {
    switch (act) {
      case 'Walking':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Running':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Standing':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Sitting':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Lying Down':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const latestPred = predictions.length > 0 ? predictions[predictions.length - 1] : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EFF4FD] text-[#3978E8] uppercase tracking-wider">
              Step 03 / Machine Learning Inference
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#FFF8E6] text-[#946200] border border-[#FFE7A3]">
              Random Forest Model (48-Features)
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#172B4D]">
            AI Human Activity Recognition Pipeline
          </h1>
          <p className="text-xs text-[#718096] mt-0.5">
            Sliding Time Window: 2.0s (100 samples) | Overlap: 50% (50 samples)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunInference}
            disabled={analyzing || !hasData}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white transition-all shadow-sm ${
              analyzing
                ? 'bg-blue-400 cursor-wait'
                : hasData
                ? 'bg-[#3978E8] hover:bg-blue-600'
                : 'bg-[#CBD5E1] cursor-not-allowed text-[#718096]'
            }`}
          >
            <BrainCircuit size={16} className={analyzing ? 'animate-spin' : ''} />
            <span>{analyzing ? 'Classifying Windows...' : 'Execute AI Recognition'}</span>
          </button>

          {predictions.length > 0 && (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs bg-[#22C55E] text-white hover:bg-green-600 shadow-sm transition-all"
            >
              <span>View Results</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Model & System Health Alert */}
      {!health.model_loaded && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-800">
          <AlertCircle size={18} className="text-[#F59E0B] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Model Status Notice</p>
            <p className="mt-0.5">
              The backend indicates the model pipeline is being initialized or loaded. If you just trained a new checkpoint, the model will be warm on the next API call.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-800">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Inference Error</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Pipeline Status & KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5EAF2] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#718096] mb-1">
            <span className="text-xs font-semibold uppercase">Telemetry Ingested</span>
            <Layers size={16} className="text-[#3978E8]" />
          </div>
          <p className="text-xl font-bold text-[#172B4D]">{readings.length} samples</p>
          <p className="text-[11px] text-[#718096] mt-0.5">
            {hasData ? 'Optimal for windowing' : `Need ${minRequired - readings.length} more`}
          </p>
        </div>

        <div className="bg-white border border-[#E5EAF2] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#718096] mb-1">
            <span className="text-xs font-semibold uppercase">Windows Extracted</span>
            <Cpu size={16} className="text-[#8B5CF6]" />
          </div>
          <p className="text-xl font-bold text-[#172B4D]">{predictions.length} windows</p>
          <p className="text-[11px] text-[#718096] mt-0.5">
            {predictions.length > 0 ? `${predictions.length * 2}s total duration` : 'Awaiting inference'}
          </p>
        </div>

        <div className="bg-white border border-[#E5EAF2] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#718096] mb-1">
            <span className="text-xs font-semibold uppercase">Latency / Speed</span>
            <Clock size={16} className="text-[#F59E0B]" />
          </div>
          <p className="text-xl font-bold text-[#172B4D]">
            {procTime ? `${procTime.toFixed(1)} ms` : '--'}
          </p>
          <p className="text-[11px] text-[#718096] mt-0.5">
            {modelVersion ? `Version: ${modelVersion}` : 'Single-pass inference'}
          </p>
        </div>

        <div className="bg-white border border-[#E5EAF2] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#718096] mb-1">
            <span className="text-xs font-semibold uppercase">Latest Predicted Class</span>
            <TrendingUp size={16} className="text-[#10B981]" />
          </div>
          <p className="text-xl font-bold text-[#172B4D]">
            {latestPred ? latestPred.predicted : 'None'}
          </p>
          <p className="text-[11px] text-[#718096] mt-0.5">
            {latestPred ? `${(latestPred.confidence * 100).toFixed(1)}% Confidence` : 'Pending execution'}
          </p>
        </div>
      </div>

      {/* Main Prediction Table & Probabilities */}
      <div className="bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#E5EAF2]">
          <div>
            <h3 className="text-sm font-bold text-[#172B4D]">Time-Window Classification Log</h3>
            <p className="text-xs text-[#718096]">
              Detailed activity labels and class-probability vectors computed per 2s window
            </p>
          </div>
          <span className="text-xs font-medium text-[#718096]">
            Showing {predictions.length} windowed predictions
          </span>
        </div>

        {predictions.length === 0 ? (
          <div className="py-12 text-center">
            <BrainCircuit size={40} className="mx-auto text-[#CBD5E1] mb-2" />
            <p className="text-sm font-semibold text-[#172B4D]">No Activities Classified Yet</p>
            <p className="text-xs text-[#718096] max-w-md mx-auto mt-1">
              Click "Execute AI Recognition" above to pass the 6-axis sensor stream through feature extraction (48 statistical features) and the trained Random Forest classifier.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5EAF2] text-[#718096] bg-[#F7F9FC]">
                  <th className="py-2.5 px-3">Window #</th>
                  <th className="py-2.5 px-3">Time Range</th>
                  <th className="py-2.5 px-3">Predicted Activity</th>
                  <th className="py-2.5 px-3">Model Confidence</th>
                  <th className="py-2.5 px-3">Class Probabilities</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F4F8]">
                {predictions.map((p) => (
                  <tr key={p.window_index} className="hover:bg-[#FAFBFD]">
                    <td className="py-2 px-3 font-mono font-semibold text-[#172B4D]">
                      W-{String(p.window_index + 1).padStart(3, '0')}
                    </td>
                    <td className="py-2 px-3 font-mono text-[#718096]">
                      {p.timestamp_start.toFixed(1)}s - {p.timestamp_end.toFixed(1)}s
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getActivityBadge(
                          p.predicted
                        )}`}
                      >
                        {p.predicted}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-[#E5EAF2] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#3978E8] h-full rounded-full"
                            style={{ width: `${p.confidence * 100}%` }}
                          />
                        </div>
                        <span className="font-mono font-semibold text-[#172B4D]">
                          {(p.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                        {Object.entries(p.probabilities || {}).map(([cName, cProb]) => (
                          <span
                            key={cName}
                            className={`px-1.5 py-0.5 rounded ${
                              cName === p.predicted
                                ? 'bg-blue-50 text-[#3978E8] font-bold border border-blue-200'
                                : 'bg-[#F7F9FC] text-[#718096]'
                            }`}
                          >
                            {cName.slice(0, 4)}: {(cProb * 100).toFixed(0)}%
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Honest Scientific Disclaimer */}
      <div className="bg-[#FFF8E6] border border-[#FFE7A3] rounded-xl p-4 text-xs text-[#946200]">
        <p className="font-bold flex items-center gap-1.5 mb-1">
          <Sparkles size={14} className="text-[#F59E0B]" />
          Demonstration Prototype Ground Truth Note
        </p>
        <p className="leading-relaxed">
          The classifications displayed above are computed by a standard Scikit-learn Random Forest model trained on synthetic, rule-based inertial profiles. These metrics demonstrate the end-to-end data pipeline for SIH26174 and must not be interpreted as validated microgravity aerospace flight data.
        </p>
      </div>
    </div>
  );
}
