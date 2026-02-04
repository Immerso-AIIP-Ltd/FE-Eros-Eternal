/**
 * Worker exports for FacePhys rPPG integration
 */

// Worker types
export interface WorkerMessage {
  type: string;
  payload?: any;
}

export interface HrvMetrics {
  sdnn: number;
  rmssd: number;
  pnn50: number;
  sd1: number;
  sd2: number;
  respiratoryRate: number;
  stressLevel: 'low' | 'moderate' | 'high' | 'unknown';
  stressIndex: number;
  recordingClass: string;
}

export interface InferenceResult {
  step: number;
  value: number;
  time: number;
  projOutput: Record<string, Float32Array>;
  timestamp: number;
}

export interface PsdResult {
  sqi: number;
  hr: number;
  freq: number[];
  psd: number[];
  peak: number;
  time: number;
}

// Export worker paths for dynamic imports
export const WORKER_PATHS = {
  inference: './inference_worker.ts',
  psd: './psd_worker.ts',
  hrv: './hrv_worker.ts'
};
