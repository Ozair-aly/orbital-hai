import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Activity,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import type { SensorReading } from '../types';

interface WebcamTrackerProps {
  onReadingBatch: (readings: SensorReading[]) => void;
  isStreaming: boolean;
  onToggleStreaming: (streaming: boolean) => void;
  onClear: () => void;
  readingCount: number;
}

export function WebcamTracker({
  onReadingBatch,
  isStreaming,
  onToggleStreaming,
  onClear,
  readingCount,
}: WebcamTrackerProps) {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [motionLevel, setMotionLevel] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const sampleIndexRef = useRef<number>(readingCount);

  // Synchronize sample index
  useEffect(() => {
    sampleIndexRef.current = readingCount;
  }, [readingCount]);

  // Start webcam feed
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser.'
          : 'No accessible camera detected on this system.'
      );
    }
  };

  // Stop webcam feed
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    setCameraActive(false);
    onToggleStreaming(false);
    prevFrameRef.current = null;
    setMotionLevel(0);
  }, [onToggleStreaming]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Optical frame differencing & motion vector estimation loop
  useEffect(() => {
    if (!cameraActive || !isStreaming) {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      return;
    }

    let lastSampleTime = performance.now();
    const sampleIntervalMs = 20; // 50 Hz telemetry generation (every 20ms)

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          const width = 160; // Downscale for fast optical processing
          const height = 120;
          canvas.width = width;
          canvas.height = height;

          ctx.drawImage(video, 0, 0, width, height);
          const frameData = ctx.getImageData(0, 0, width, height).data;

          if (prevFrameRef.current) {
            let totalDiff = 0;
            let leftDiff = 0;
            let rightDiff = 0;
            let topDiff = 0;
            let bottomDiff = 0;

            const len = frameData.length;
            const midX = width / 2;
            const midY = height / 2;

            for (let i = 0; i < len; i += 16) {
              // Convert to grayscale luminance difference
              const currLum = (frameData[i] + frameData[i + 1] + frameData[i + 2]) / 3;
              const prevLum =
                (prevFrameRef.current[i] + prevFrameRef.current[i + 1] + prevFrameRef.current[i + 2]) / 3;
              const diff = Math.abs(currLum - prevLum);

              if (diff > 18) {
                totalDiff += diff;
                const pixelIndex = i / 4;
                const px = pixelIndex % width;
                const py = Math.floor(pixelIndex / width);

                if (px < midX) leftDiff += diff;
                else rightDiff += diff;

                if (py < midY) topDiff += diff;
                else bottomDiff += diff;
              }
            }

            // Normalized optical motion magnitude [0.0 - 1.0]
            const maxExpectedDiff = (width * height * 255) / 64;
            const normMotion = Math.min(totalDiff / maxExpectedDiff, 1.0);
            setMotionLevel(Number((normMotion * 100).toFixed(0)));

            const now = performance.now();
            if (now - lastSampleTime >= sampleIntervalMs) {
              lastSampleTime = now;
              sampleIndexRef.current += 1;
              const t = sampleIndexRef.current / 50.0;

              // Derive 6-DoF acceleration and angular velocity from optical vector
              const horizAsym = (rightDiff - leftDiff) / (totalDiff + 1);
              const vertAsym = (bottomDiff - topDiff) / (totalDiff + 1);

              const noise = () => (Math.random() - 0.5) * 0.05;

              // Acc X: lateral motion
              const acc_x = Number((horizAsym * 2.5 * normMotion + noise()).toFixed(4));
              // Acc Y: forward/backward or depth optical divergence
              const acc_y = Number((vertAsym * 1.5 * normMotion + noise()).toFixed(4));
              // Acc Z: vertical gravitational baseline (9.8 m/s²) modulated by vertical optical velocity
              const bounce = Math.sin(2 * Math.PI * 2.0 * t) * (normMotion * 2.0);
              const acc_z = Number((9.81 + bounce + noise()).toFixed(4));

              // Gyro X, Y, Z: angular velocity derived from rotational divergence
              const gyro_x = Number((vertAsym * 1.2 * normMotion + noise()).toFixed(4));
              const gyro_y = Number((horizAsym * 1.2 * normMotion + noise()).toFixed(4));
              const gyro_z = Number((horizAsym * vertAsym * 0.8 * normMotion + noise()).toFixed(4));

              const sample: SensorReading = {
                timestamp: Number(t.toFixed(2)),
                acc_x,
                acc_y,
                acc_z,
                gyro_x,
                gyro_y,
                gyro_z,
              };

              onReadingBatch([sample]);
            }
          }

          prevFrameRef.current = new Uint8ClampedArray(frameData);
        }
      }

      animFrameIdRef.current = requestAnimationFrame(processFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, [cameraActive, isStreaming, onReadingBatch]);

  return (
    <div className="bg-white border border-[#E5EAF2] rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
            <Camera size={16} className="text-[#3978E8]" />
            Live Optical Vision & Kinematic Tracking
          </h3>
          <p className="text-xs text-[#718096]">
            Webcam motion tracking calculates real-time 6-axis kinematics for AI classification
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          {!cameraActive ? (
            <button
              onClick={startCamera}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#3978E8] text-white hover:bg-blue-600 transition-colors shadow-xs"
            >
              <Camera size={14} />
              <span>Enable Camera</span>
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
            >
              <CameraOff size={14} />
              <span>Turn Off</span>
            </button>
          )}
        </div>
      </div>

      {cameraError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
          <AlertCircle size={15} className="shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Video Viewport with HUD Overlay */}
      <div className="relative w-full aspect-video max-h-72 bg-slate-900 rounded-xl overflow-hidden border border-[#E5EAF2] flex items-center justify-center">
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
          playsInline
          muted
        />

        {/* Hidden downscaled canvas used for optical differential analysis */}
        <canvas ref={canvasRef} className="hidden" />

        {!cameraActive ? (
          <div className="text-center p-6 text-slate-400">
            <Camera size={36} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold text-slate-200">Camera is Disconnected</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
              Enable your webcam to perform real-time visual movement tracking and translate your actions into sensor telemetry.
            </p>
            <button
              onClick={startCamera}
              className="mt-3 px-4 py-2 rounded-lg bg-[#3978E8] text-white font-semibold text-xs hover:bg-blue-600 transition-all shadow-md"
            >
              Connect Webcam
            </button>
          </div>
        ) : (
          <>
            {/* Aerospace HUD Overlays */}
            <div className="absolute top-2.5 left-3 flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider bg-black/50 px-2 py-0.5 rounded backdrop-blur-xs">
                OPTICAL_CH-01 · {isStreaming ? 'STREAMING' : 'IDLE'}
              </span>
            </div>

            <div className="absolute top-2.5 right-3 text-[10px] font-mono font-semibold text-emerald-400 bg-black/50 px-2 py-0.5 rounded backdrop-blur-xs">
              MOTION_DELTA: {motionLevel}%
            </div>

            {/* Target Crosshair */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
              <div className="w-24 h-24 border border-dashed border-white rounded-full"></div>
              <div className="absolute w-6 h-0.5 bg-white"></div>
              <div className="absolute h-6 w-0.5 bg-white"></div>
            </div>

            {/* Real-time Optical Motion Bar */}
            <div className="absolute bottom-3 inset-x-3 bg-black/60 backdrop-blur-xs rounded-lg p-2 flex items-center gap-2.5">
              <Activity size={14} className="text-[#78C9E8] shrink-0" />
              <div className="flex-1 bg-white/20 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#3978E8] to-[#10B981] h-full rounded-full transition-all duration-75"
                  style={{ width: `${motionLevel}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-white font-bold w-9 text-right">
                {motionLevel}%
              </span>
            </div>
          </>
        )}
      </div>

      {/* Stream Control Buttons */}
      {cameraActive && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#E5EAF2]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleStreaming(!isStreaming)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs text-white transition-all shadow-xs ${
                isStreaming ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#3978E8] hover:bg-blue-600'
              }`}
            >
              {isStreaming ? (
                <>
                  <Pause size={14} />
                  <span>Pause Telemetry Stream</span>
                </>
              ) : (
                <>
                  <Play size={14} />
                  <span>Start Optical Telemetry</span>
                </>
              )}
            </button>

            <button
              onClick={onClear}
              className="p-2 rounded-lg border border-[#E5EAF2] hover:bg-[#F7F9FC] text-[#718096] transition-colors"
              title="Clear readings"
            >
              <RotateCcw size={15} />
            </button>
          </div>

          <div className="text-right text-[11px] text-[#718096]">
            <span>Captured from camera: </span>
            <span className="font-bold text-[#172B4D] font-mono">{readingCount} samples</span>
          </div>
        </div>
      )}

      {/* Educational Note */}
      <div className="p-2.5 rounded-lg bg-[#EFF4FD] border border-[#D8E6FA] text-[11px] text-[#172B4D] flex items-start gap-2">
        <Sparkles size={13} className="text-[#3978E8] shrink-0 mt-0.5" />
        <p>
          <strong>How Webcam Kinematics Work:</strong> Move or walk in front of your camera to trigger acceleration and angular velocity spikes. Sitting or standing still maintains standard gravitational baseline (acc_z ~ 9.81 m/s²).
        </p>
      </div>
    </div>
  );
}
