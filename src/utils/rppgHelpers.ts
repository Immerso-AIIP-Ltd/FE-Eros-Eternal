/**
 * rPPG Helper Functions - Utility functions for rPPG calculations and status determination
 */

import type { RppgVitals, RppgHrv, RppgStress } from '../types/rppg';

/**
 * Get Bootstrap badge color based on status
 */
export const getStatusColor = (status: string): string => {
  switch (status.toUpperCase()) {
    case 'GOOD':
    case 'EXCELLENT':
    case 'LOW':  // For stress, low is good
    case 'NORMAL':
      return 'success';
    case 'FAIR':
    case 'MODERATE':
      return 'warning';
    case 'POOR':
    case 'HIGH': // For stress, high is bad
    case 'WARNING':
      return 'danger';
    default:
      return 'secondary';
  }
};

/**
 * Get CSS color code based on status
 */
export const getStatusColorCode = (status: string): string => {
  switch (status.toUpperCase()) {
    case 'GOOD':
    case 'EXCELLENT':
    case 'LOW':
    case 'NORMAL':
      return '#10B981'; // green
    case 'FAIR':
    case 'MODERATE':
      return '#F59E0B'; // yellow/orange
    case 'POOR':
    case 'HIGH':
    case 'WARNING':
      return '#EF4444'; // red
    default:
      return '#6B7280'; // gray
  }
};

/**
 * Get stress level description
 */
export const getStressDescription = (level: string): string => {
  const descriptions: Record<string, string> = {
    low: 'Your body is in a calm, recovery-focused state. Your "rest and digest" system is active.',
    moderate: 'Balanced autonomic state with healthy adaptability to stress.',
    high: 'Your body is in a heightened alert state. The "fight or flight" system is active.',
    unknown: 'Insufficient data to determine stress state.',
  };
  return descriptions[level] || descriptions.unknown;
};

/**
 * Calculate heart rate status
 */
export const calculateHrStatus = (hr: number): 'LOW' | 'NORMAL' | 'HIGH' => {
  if (hr < 60) return 'LOW';
  if (hr > 100) return 'HIGH';
  return 'NORMAL';
};

/**
 * Calculate signal quality status
 */
export const calculateSqiStatus = (sqi: number): 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT' => {
  if (sqi >= 0.7) return 'EXCELLENT';
  if (sqi >= 0.5) return 'GOOD';
  if (sqi >= 0.38) return 'FAIR';
  return 'POOR';
};

/**
 * Calculate breathing rate status
 */
export const calculateBreathingStatus = (br: number): 'LOW' | 'NORMAL' | 'HIGH' => {
  if (br < 12) return 'LOW';
  if (br > 20) return 'HIGH';
  return 'NORMAL';
};

/**
 * Calculate SDNN status
 */
export const calculateSdnnStatus = (sdnn: number): string => {
  if (sdnn < 20) return 'LOW';
  if (sdnn > 100) return 'HIGH';
  return 'NORMAL';
};

/**
 * Calculate RMSSD status
 */
export const calculateRmssdStatus = (rmssd: number): string => {
  if (rmssd < 15) return 'LOW';
  if (rmssd > 100) return 'HIGH';
  return 'NORMAL';
};

/**
 * Calculate pNN50 status
 */
export const calculatePnn50Status = (pnn50: number): string => {
  if (pnn50 < 3) return 'LOW';
  if (pnn50 > 50) return 'HIGH';
  return 'NORMAL';
};

/**
 * Generate complete RppgVitals object from raw values
 */
export const generateVitals = (
  heartRate: number,
  signalQuality: number,
  breathingRate: number
): RppgVitals => ({
  heartRate: {
    value: Math.round(heartRate),
    unit: 'BPM',
    status: calculateHrStatus(heartRate),
  },
  signalQuality: {
    value: signalQuality,
    percentage: Math.round(signalQuality * 100),
    status: calculateSqiStatus(signalQuality),
  },
  breathingRate: {
    value: Math.round(breathingRate),
    unit: 'breaths/min',
    status: calculateBreathingStatus(breathingRate),
  },
});

/**
 * Generate complete RppgHrv object from raw values
 */
export const generateHrv = (
  sdnn: number,
  rmssd: number,
  pnn50: number,
  recordingClass: 'insufficient_data' | 'ultra-short' | 'short-term' | 'standard'
): RppgHrv => ({
  sdnn: {
    value: Math.round(sdnn * 10) / 10,
    unit: 'ms',
    status: calculateSdnnStatus(sdnn),
  },
  rmssd: {
    value: Math.round(rmssd * 10) / 10,
    unit: 'ms',
    status: calculateRmssdStatus(rmssd),
  },
  pnn50: {
    value: Math.round(pnn50 * 10) / 10,
    unit: '%',
    status: calculatePnn50Status(pnn50),
  },
  recordingClass,
});

/**
 * Generate complete RppgStress object from raw values
 */
export const generateStress = (
  level: 'low' | 'moderate' | 'high' | 'unknown',
  index: number
): RppgStress => ({
  level,
  index: Math.round(index),
  description: getStressDescription(level),
});

/**
 * Kalman Filter for face tracking stability
 */
export class KalmanFilter1D {
  private x: number;
  private p: number;
  private q: number;
  private r: number;

  constructor(initialValue: number, processNoise = 1e-2, measurementNoise = 5e-1) {
    this.x = initialValue;
    this.p = 1.0;
    this.q = processNoise;
    this.r = measurementNoise;
  }

  update(measurement: number): number {
    const pPred = this.p + this.q;
    const k = pPred / (pPred + this.r);
    this.x = this.x + k * (measurement - this.x);
    this.p = (1 - k) * pPred;
    return this.x;
  }

  reset(value: number): void {
    this.x = value;
    this.p = 1.0;
  }
}

/**
 * Calculate average from array of numbers
 */
export const calculateAverage = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
};

/**
 * Format time duration in seconds to readable string
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
};
