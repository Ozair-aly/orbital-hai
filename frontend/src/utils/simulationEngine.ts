// simulationEngine.ts — Generates realistic synthetic IMU sensor readings.
//
// This runs entirely in the browser — no server needed for Step 2.
// It mimics what a real accelerometer + gyroscope would output for each
// activity, using the same signal patterns as the Python training data.

import type { SensorReading } from '../types';

type Activity = 'Walking' | 'Running' | 'Standing' | 'Sitting' | 'Lying Down';

// Activity cycle: change activity every N readings at 50 Hz
const CYCLE_DURATION = 150; // 3 seconds per activity

const SEQUENCE: Activity[] = [
  'Standing', 'Walking', 'Walking', 'Running', 'Walking',
  'Standing', 'Sitting', 'Sitting', 'Lying Down', 'Standing',
];

function noise(scale = 0.05) {
  return (Math.random() - 0.5) * 2 * scale;
}

export function generateReading(sampleIndex: number): SensorReading {
  const t = sampleIndex / 50; // seconds at 50 Hz
  const actIndex = Math.floor(sampleIndex / CYCLE_DURATION) % SEQUENCE.length;
  const act = SEQUENCE[actIndex];

  let acc_x = 0, acc_y = 0, acc_z = 9.81;
  let gyro_x = 0, gyro_y = 0, gyro_z = 0;

  switch (act) {
    case 'Walking':
      acc_x  = 0.10 * Math.sin(2 * Math.PI * 1.8 * t);
      acc_y  = 0.20 * Math.sin(2 * Math.PI * 1.8 * t + 0.5);
      acc_z  = 9.8  + 0.6 * Math.sin(2 * Math.PI * 1.8 * t);
      gyro_x = 0.30 * Math.sin(2 * Math.PI * 1.8 * t);
      gyro_y = 0.20 * Math.sin(2 * Math.PI * 3.6 * t);
      gyro_z = 0.10 * Math.cos(2 * Math.PI * 1.8 * t);
      break;
    case 'Running':
      acc_x  = 0.30 * Math.sin(2 * Math.PI * 3.0 * t);
      acc_y  = 0.50 * Math.sin(2 * Math.PI * 3.0 * t + 0.3);
      acc_z  = 9.8  + 1.5 * Math.sin(2 * Math.PI * 3.0 * t);
      gyro_x = 0.80 * Math.sin(2 * Math.PI * 3.0 * t);
      gyro_y = 0.60 * Math.sin(2 * Math.PI * 6.0 * t);
      gyro_z = 0.40 * Math.cos(2 * Math.PI * 3.0 * t);
      break;
    case 'Standing':
      acc_z = 9.81; gyro_x = 0; gyro_y = 0; gyro_z = 0;
      break;
    case 'Sitting':
      acc_x = 0.1; acc_z = 9.75;
      break;
    case 'Lying Down':
      acc_x = 9.81; acc_y = 0; acc_z = 0;
      break;
  }

  return {
    timestamp: t,
    acc_x:  +(acc_x  + noise()).toFixed(4),
    acc_y:  +(acc_y  + noise()).toFixed(4),
    acc_z:  +(acc_z  + noise()).toFixed(4),
    gyro_x: +(gyro_x + noise()).toFixed(4),
    gyro_y: +(gyro_y + noise()).toFixed(4),
    gyro_z: +(gyro_z + noise()).toFixed(4),
  };
}

/** Build a batch of N readings starting at sampleIndex */
export function generateBatch(startIndex: number, count: number): SensorReading[] {
  return Array.from({ length: count }, (_, i) => generateReading(startIndex + i));
}
