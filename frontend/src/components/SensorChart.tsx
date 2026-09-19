import { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { SensorReading } from '../types';

interface SensorChartProps {
  readings: SensorReading[];
  maxPoints?: number;
}

export function SensorChart({ readings, maxPoints = 50 }: SensorChartProps) {
  const [signalMode, setSignalMode] = useState<'accel' | 'gyro' | 'all'>('accel');

  // Take the most recent data points for smooth responsive rendering
  const displayData = readings.slice(-maxPoints).map((r, idx) => ({
    time: r.timestamp !== undefined ? Number(r.timestamp.toFixed(2)) : idx,
    acc_x: Number(r.acc_x.toFixed(2)),
    acc_y: Number(r.acc_y.toFixed(2)),
    acc_z: Number(r.acc_z.toFixed(2)),
    gyro_x: Number(r.gyro_x.toFixed(2)),
    gyro_y: Number(r.gyro_y.toFixed(2)),
    gyro_z: Number(r.gyro_z.toFixed(2)),
  }));

  return (
    <div className="bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-[#172B4D]">Live Sensor Telemetry Stream</h3>
          <p className="text-xs text-[#718096]">
            Visualizing latest {displayData.length} IMU readings (Sample rate: 50 Hz)
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#F7F9FC] p-1 rounded-lg border border-[#E5EAF2] self-start">
          <button
            onClick={() => setSignalMode('accel')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              signalMode === 'accel'
                ? 'bg-[#3978E8] text-white shadow-xs'
                : 'text-[#718096] hover:text-[#172B4D]'
            }`}
          >
            Accelerometer
          </button>
          <button
            onClick={() => setSignalMode('gyro')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              signalMode === 'gyro'
                ? 'bg-[#3978E8] text-white shadow-xs'
                : 'text-[#718096] hover:text-[#172B4D]'
            }`}
          >
            Gyroscope
          </button>
          <button
            onClick={() => setSignalMode('all')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              signalMode === 'all'
                ? 'bg-[#3978E8] text-white shadow-xs'
                : 'text-[#718096] hover:text-[#172B4D]'
            }`}
          >
            All 6-DoF
          </button>
        </div>
      </div>

      {displayData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center border border-dashed border-[#E5EAF2] rounded-lg bg-[#F7F9FC]">
          <p className="text-sm font-medium text-[#718096]">No telemetry streaming yet</p>
          <p className="text-xs text-[#A0AEC0] mt-1">Start simulation or upload a CSV to view waveforms</p>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F8" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11, fill: '#718096' }}
                tickLine={false}
                axisLine={{ stroke: '#E5EAF2' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#718096' }}
                tickLine={false}
                axisLine={{ stroke: '#E5EAF2' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E5EAF2',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  fontSize: '12px',
                }}
              />
              <Legend
                verticalAlign="top"
                height={30}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px' }}
              />

              {(signalMode === 'accel' || signalMode === 'all') && (
                <>
                  <Line
                    type="monotone"
                    dataKey="acc_x"
                    name="Acc X (m/s²)"
                    stroke="#EF4444"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="acc_y"
                    name="Acc Y (m/s²)"
                    stroke="#10B981"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="acc_z"
                    name="Acc Z (m/s²)"
                    stroke="#3978E8"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </>
              )}

              {(signalMode === 'gyro' || signalMode === 'all') && (
                <>
                  <Line
                    type="monotone"
                    dataKey="gyro_x"
                    name="Gyro X (rad/s)"
                    stroke="#F59E0B"
                    strokeWidth={1.5}
                    dot={false}
                    strokeDasharray={signalMode === 'all' ? '3 3' : undefined}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="gyro_y"
                    name="Gyro Y (rad/s)"
                    stroke="#8B5CF6"
                    strokeWidth={1.5}
                    dot={false}
                    strokeDasharray={signalMode === 'all' ? '3 3' : undefined}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="gyro_z"
                    name="Gyro Z (rad/s)"
                    stroke="#06B6D4"
                    strokeWidth={1.5}
                    dot={false}
                    strokeDasharray={signalMode === 'all' ? '3 3' : undefined}
                    isAnimationActive={false}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
