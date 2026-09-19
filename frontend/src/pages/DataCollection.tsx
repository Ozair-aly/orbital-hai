import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Upload,
  Radio,
  FileCheck,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useExperimentStore } from '../store/experimentStore';
import { generateBatch } from '../utils/simulationEngine';
import { SensorChart } from '../components/SensorChart';
import { uploadCSV } from '../services/api';
import type { SensorReading } from '../types';

export function DataCollection() {
  const {
    experiment,
    readings,
    addReadings,
    clearReadings,
    simRunning,
    setSimRunning,
    nextStep,
    setUploadWarnings,
    uploadWarnings,
  } = useExperimentStore();

  const [activeTab, setActiveTab] = useState<'stream' | 'upload'>(
    experiment?.data_source === 'uploaded' ? 'upload' : 'stream'
  );
  const [sampleCounter, setSampleCounter] = useState<number>(readings.length);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync sample counter if readings already exist
  useEffect(() => {
    setSampleCounter(readings.length);
  }, [readings.length]);

  // Real-time sensor stream simulation tick
  useEffect(() => {
    if (!simRunning) return;

    const interval = setInterval(() => {
      // 5 samples every 100ms simulates 50 Hz streaming telemetry
      const newBatch: SensorReading[] = generateBatch(sampleCounter, 5);
      addReadings(newBatch);
      setSampleCounter((prev) => prev + 5);
    }, 100);

    return () => clearInterval(interval);
  }, [simRunning, sampleCounter, addReadings]);

  const handleToggleSim = () => {
    setSimRunning(!simRunning);
  };

  const handleResetSim = () => {
    setSimRunning(false);
    clearReadings();
    setSampleCounter(0);
    setUploadSuccessMsg(null);
    setUploadError(null);
  };

  // CSV File upload handler
  const handleFileUpload = async (file: File) => {
    if (!experiment) {
      setUploadError('No experiment session found. Please configure Step 1 first.');
      return;
    }
    if (!file.name.endsWith('.csv')) {
      setUploadError('Invalid file type. Please upload a standard sensor .csv file.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccessMsg(null);

    try {
      const res = await uploadCSV(experiment.id, file);
      setUploadWarnings(res.warnings || []);
      setUploadSuccessMsg(`Successfully imported ${res.rows_received.toLocaleString()} sensor telemetry rows!`);

      // Convert preview rows into frontend readings store format
      if (res.preview && res.preview.length > 0) {
        const parsed: SensorReading[] = res.preview.map((row: any) => ({
          timestamp: Number(row.timestamp || 0),
          acc_x: Number(row.acc_x || 0),
          acc_y: Number(row.acc_y || 0),
          acc_z: Number(row.acc_z || 0),
          gyro_x: Number(row.gyro_x || 0),
          gyro_y: Number(row.gyro_y || 0),
          gyro_z: Number(row.gyro_z || 0),
        }));
        addReadings(parsed);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Error processing CSV file upload.');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [experiment]);

  const recentRows = readings.slice(-4);
  const minRequired = 100;
  const hasEnoughData = readings.length >= minRequired;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner: Experiment Context */}
      <div className="bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EFF4FD] text-[#3978E8] uppercase tracking-wider">
              Step 02 / Telemetry Ingestion
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#FFF8E6] text-[#946200] border border-[#FFE7A3]">
              Synthetic Demonstration
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#172B4D]">
            {experiment?.name || 'Orbital Telemetry Stream'}
          </h1>
          <p className="text-xs text-[#718096] mt-0.5">
            ID: <span className="font-mono text-[#172B4D]">{experiment?.id || 'EXP-DEMO-001'}</span> | Target Sampling: {experiment?.sample_rate_hz || 50} Hz
          </p>
        </div>

        {/* Action button to proceed to Step 3 */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-[#172B4D]">
              {readings.length} / {minRequired} Samples
            </p>
            <p className="text-[11px] text-[#718096]">
              {hasEnoughData ? 'Ready for inference' : 'Need >= 100 samples'}
            </p>
          </div>
          <button
            onClick={nextStep}
            disabled={!hasEnoughData}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs transition-all ${
              hasEnoughData
                ? 'bg-[#3978E8] text-white hover:bg-blue-600 shadow-sm'
                : 'bg-[#E5EAF2] text-[#718096] cursor-not-allowed'
            }`}
          >
            <span>Proceed to AI Analysis</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Main Mode Tabs & Telemetry Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Controls & Ingestion Mode */}
        <div className="space-y-6">
          <div className="bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#172B4D] mb-3 flex items-center gap-2">
              <Layers size={16} className="text-[#3978E8]" />
              Data Ingestion Mode
            </h2>

            <div className="flex rounded-lg bg-[#F7F9FC] p-1 border border-[#E5EAF2] mb-4">
              <button
                onClick={() => setActiveTab('stream')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'stream'
                    ? 'bg-white text-[#3978E8] shadow-xs'
                    : 'text-[#718096] hover:text-[#172B4D]'
                }`}
              >
                <Radio size={14} />
                Live Sensor Simulation
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'upload'
                    ? 'bg-white text-[#3978E8] shadow-xs'
                    : 'text-[#718096] hover:text-[#172B4D]'
                }`}
              >
                <Upload size={14} />
                Upload CSV
              </button>
            </div>

            {/* Simulated Data Controls */}
            {activeTab === 'stream' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-lg bg-[#F7F9FC] border border-[#E5EAF2]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-[#718096]">Stream Status:</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        simRunning
                          ? 'bg-green-100 text-green-700'
                          : readings.length > 0
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {simRunning ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                          Streaming Active
                        </>
                      ) : readings.length > 0 ? (
                        'Stream Paused'
                      ) : (
                        'Standby'
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center mt-3">
                    <div className="bg-white p-2 rounded border border-[#E5EAF2]">
                      <p className="text-[10px] uppercase font-semibold text-[#718096]">Total Readings</p>
                      <p className="text-lg font-bold text-[#172B4D]">{readings.length}</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-[#E5EAF2]">
                      <p className="text-[10px] uppercase font-semibold text-[#718096]">Elapsed Time</p>
                      <p className="text-lg font-bold text-[#3978E8]">
                        {(readings.length / 50).toFixed(1)}s
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleToggleSim}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-xs text-white transition-all shadow-sm ${
                      simRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#3978E8] hover:bg-blue-600'
                    }`}
                  >
                    {simRunning ? (
                      <>
                        <Pause size={14} />
                        Pause Stream
                      </>
                    ) : (
                      <>
                        <Play size={14} />
                        {readings.length > 0 ? 'Resume Stream' : 'Start Simulation'}
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleResetSim}
                    className="p-2.5 rounded-lg border border-[#E5EAF2] hover:bg-[#F7F9FC] text-[#718096] transition-colors"
                    title="Reset Simulation Data"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Upload CSV Controls */}
            {activeTab === 'upload' && (
              <div className="space-y-4">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#CBD5E1] hover:border-[#3978E8] rounded-xl p-6 text-center cursor-pointer bg-[#F7F9FC] transition-colors"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <Upload size={28} className="mx-auto text-[#718096] mb-2" />
                  <p className="text-xs font-bold text-[#172B4D]">Click or drag & drop CSV</p>
                  <p className="text-[11px] text-[#718096] mt-1">
                    Expected columns: acc_x, acc_y, acc_z, gyro_x, gyro_y, gyro_z
                  </p>
                </div>

                {uploading && (
                  <p className="text-xs text-center text-[#3978E8] font-semibold animate-pulse">
                    Parsing and validating telemetry CSV...
                  </p>
                )}

                {uploadSuccessMsg && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-xs text-green-700">
                    <FileCheck size={16} />
                    <span>{uploadSuccessMsg}</span>
                  </div>
                )}

                {uploadError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
                    <AlertTriangle size={16} />
                    <span>{uploadError}</span>
                  </div>
                )}

                {uploadWarnings.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <AlertTriangle size={14} />
                      Validation Notes:
                    </p>
                    {uploadWarnings.map((w, idx) => (
                      <p key={idx}>• {w}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Info Box */}
          <div className="bg-[#F7F9FC] border border-[#E5EAF2] rounded-xl p-4 text-xs text-[#718096]">
            <p className="font-semibold text-[#172B4D] mb-1 flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#3978E8]" />
              Simulation Engine Architecture
            </p>
            <p className="leading-relaxed">
              Synthesizes realistic periodic gait kinematics (walking bounce, running impacts, microgravity drifts, seated stillness) aligned with the Random Forest 48-feature training distributions.
            </p>
          </div>
        </div>

        {/* Right 2 Columns: Telemetry Visualizer & Live Readout */}
        <div className="lg:col-span-2 space-y-6">
          {/* Real-time Recharts Component */}
          <SensorChart readings={readings} maxPoints={50} />

          {/* Real-time Tabular Telemetry Preview */}
          <div className="bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-sm overflow-x-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#718096] mb-3 flex items-center justify-between">
              <span>Latest 6-Axis Telemetry Samples</span>
              <span className="font-normal normal-case text-[#3978E8]">{readings.length} total captured</span>
            </h3>

            {recentRows.length === 0 ? (
              <p className="text-xs text-[#A0AEC0] italic py-4 text-center">
                Awaiting telemetry stream to populate registers...
              </p>
            ) : (
              <table className="w-full text-xs text-left border-collapse font-mono">
                <thead>
                  <tr className="border-b border-[#E5EAF2] text-[#718096] bg-[#F7F9FC]">
                    <th className="py-2 px-3">Timestamp</th>
                    <th className="py-2 px-3 text-[#EF4444]">Acc X</th>
                    <th className="py-2 px-3 text-[#10B981]">Acc Y</th>
                    <th className="py-2 px-3 text-[#3978E8]">Acc Z</th>
                    <th className="py-2 px-3 text-[#F59E0B]">Gyro X</th>
                    <th className="py-2 px-3 text-[#8B5CF6]">Gyro Y</th>
                    <th className="py-2 px-3 text-[#06B6D4]">Gyro Z</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRows.map((r, i) => (
                    <tr key={i} className="border-b border-[#F0F4F8] hover:bg-[#FAFBFD]">
                      <td className="py-1.5 px-3 font-semibold text-[#172B4D]">{r.timestamp?.toFixed(2)}s</td>
                      <td className="py-1.5 px-3">{r.acc_x?.toFixed(3)}</td>
                      <td className="py-1.5 px-3">{r.acc_y?.toFixed(3)}</td>
                      <td className="py-1.5 px-3 font-semibold">{r.acc_z?.toFixed(3)}</td>
                      <td className="py-1.5 px-3">{r.gyro_x?.toFixed(3)}</td>
                      <td className="py-1.5 px-3">{r.gyro_y?.toFixed(3)}</td>
                      <td className="py-1.5 px-3">{r.gyro_z?.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
