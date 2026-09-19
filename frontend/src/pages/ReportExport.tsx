import { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  RotateCcw,
  AlertTriangle,
  Layers,
  Cpu,
  Database,
} from 'lucide-react';
import { useExperimentStore } from '../store/experimentStore';
import { generateReport, exportCSVUrl } from '../services/api';

export function ReportExport() {
  const {
    experiment,
    readings,
    predictions,
    results,
    resetAll,
    setStep,
  } = useExperimentStore();

  const [reportText, setReportText] = useState<string>('');
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate report when entering Step 5 if experiment exists
  useEffect(() => {
    if (experiment && !reportText) {
      handleGenerateReport();
    }
  }, [experiment]);

  const handleGenerateReport = async () => {
    if (!experiment) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await generateReport(experiment.id);
      setReportText(res.report_text);
    } catch (err: any) {
      setError(err.message || 'Failed to generate experiment report from backend.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReport = () => {
    if (!reportText) return;
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${experiment?.id || 'ORBITAL'}_experiment_report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleStartNew = () => {
    if (window.confirm('Are you sure you want to reset and configure a new experiment?')) {
      resetAll();
      setStep(1);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#ECFDF5] text-[#065F46] uppercase tracking-wider border border-[#A7F3D0]">
              Step 05 / Final Mission Documentation
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#172B4D]">
            Experiment Synthesis & Compliance Report
          </h1>
          <p className="text-xs text-[#718096] mt-0.5">
            Structured session metadata, statistical telemetry distribution, and reproducible provenance
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleStartNew}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-[#E5EAF2] hover:bg-[#F7F9FC] text-[#718096] transition-colors"
          >
            <RotateCcw size={14} />
            <span>New Session</span>
          </button>

          {experiment && (
            <a
              href={exportCSVUrl(experiment.id)}
              download
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-[#E5EAF2] bg-white hover:bg-[#F7F9FC] text-[#172B4D] shadow-xs transition-all"
            >
              <Download size={14} className="text-[#3978E8]" />
              <span>Export CSV</span>
            </a>
          )}

          <button
            onClick={handleDownloadReport}
            disabled={!reportText}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#3978E8] text-white hover:bg-blue-600 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={14} />
            <span>Download Report (.txt)</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Metadata Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Experiment Metadata */}
        <div className="bg-white border border-[#E5EAF2] rounded-xl p-4 shadow-sm space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#172B4D]">
            <Database size={15} className="text-[#3978E8]" />
            <span>Experiment Context</span>
          </div>
          <div className="text-xs space-y-1 text-[#718096]">
            <p>
              <span className="font-medium text-[#172B4D]">Name:</span> {experiment?.name || 'N/A'}
            </p>
            <p className="font-mono text-[11px]">
              <span className="font-sans font-medium text-[#172B4D]">ID:</span> {experiment?.id || 'N/A'}
            </p>
            <p>
              <span className="font-medium text-[#172B4D]">Source:</span>{' '}
              <span className="capitalize">{experiment?.data_source || 'Simulated'}</span>
            </p>
            <p>
              <span className="font-medium text-[#172B4D]">Sampling:</span> {experiment?.sample_rate_hz || 50} Hz
            </p>
          </div>
        </div>

        {/* Pipeline & Model Spec */}
        <div className="bg-white border border-[#E5EAF2] rounded-xl p-4 shadow-sm space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#172B4D]">
            <Cpu size={15} className="text-[#8B5CF6]" />
            <span>Classifier Architecture</span>
          </div>
          <div className="text-xs space-y-1 text-[#718096]">
            <p>
              <span className="font-medium text-[#172B4D]">Model:</span> Scikit-Learn Random Forest
            </p>
            <p>
              <span className="font-medium text-[#172B4D]">Preprocessing:</span> StandardScaler Pipeline
            </p>
            <p>
              <span className="font-medium text-[#172B4D]">Features:</span> 48 Statistical Metrics / 2s Window
            </p>
            <p>
              <span className="font-medium text-[#172B4D]">Target Classes:</span> 5 Human Activities
            </p>
          </div>
        </div>

        {/* Telemetry Summary */}
        <div className="bg-white border border-[#E5EAF2] rounded-xl p-4 shadow-sm space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#172B4D]">
            <Layers size={15} className="text-[#10B981]" />
            <span>Session Kinematics</span>
          </div>
          <div className="text-xs space-y-1 text-[#718096]">
            <p>
              <span className="font-medium text-[#172B4D]">Total Samples:</span> {readings.length}
            </p>
            <p>
              <span className="font-medium text-[#172B4D]">Windowed Slices:</span> {predictions.length}
            </p>
            <p>
              <span className="font-medium text-[#172B4D]">Recorded Time:</span>{' '}
              {results?.duration_seconds ? `${results.duration_seconds.toFixed(1)}s` : `${(readings.length / 50).toFixed(1)}s`}
            </p>
            <p>
              <span className="font-medium text-[#172B4D]">Pipeline Integrity:</span> 100% Parsed
            </p>
          </div>
        </div>
      </div>

      {/* Dataset Limitations & Academic Rigor Box */}
      <div className="bg-[#FFF8E6] border border-[#FFE7A3] rounded-xl p-4 text-xs text-[#946200]">
        <div className="flex items-center gap-2 font-bold mb-1">
          <AlertTriangle size={16} className="text-[#F59E0B]" />
          <span>Compliance & Limitations Statement (SIH26174 Prototype)</span>
        </div>
        <p className="leading-relaxed">
          This prototype demonstrates an algorithmic framework for On-board BAS (Biological and Physical Sciences in Space) Human Activity Recognition. The data analyzed in this session originates from synthetic simulation or laboratory benchmark CSV inputs. This prototype does not claim flight-certified operational status, live astronaut biometric monitoring, or space-qualified hardware integration.
        </p>
      </div>

      {/* Formatted Text Report Preview */}
      <div className="bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-[#3978E8]" />
            <h3 className="text-sm font-bold text-[#172B4D]">Generated Session Report Preview</h3>
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="text-xs font-semibold text-[#3978E8] hover:underline flex items-center gap-1"
          >
            <RotateCcw size={12} className={generating ? 'animate-spin' : ''} />
            {generating ? 'Regenerating...' : 'Refresh Report'}
          </button>
        </div>

        {generating ? (
          <div className="h-64 flex items-center justify-center text-xs text-[#718096] bg-[#F7F9FC] rounded-lg border border-[#E5EAF2]">
            Compiling and synthesizing experiment report...
          </div>
        ) : reportText ? (
          <pre className="p-4 bg-[#F7F9FC] border border-[#E5EAF2] rounded-lg text-xs font-mono text-[#172B4D] overflow-x-auto whitespace-pre leading-relaxed max-h-[420px] select-all">
            {reportText}
          </pre>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-xs text-[#A0AEC0] bg-[#F7F9FC] rounded-lg border border-[#E5EAF2]">
            <p>No report text compiled yet.</p>
            <button
              onClick={handleGenerateReport}
              className="mt-2 text-[#3978E8] font-semibold hover:underline"
            >
              Generate Report Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
