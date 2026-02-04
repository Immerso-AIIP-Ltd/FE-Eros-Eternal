/**
 * HRV Worker - Heart Rate Variability, Respiratory Rate, and Stress Analysis
 */

// Types
interface HrvMetrics {
  sdnn: number;
  rmssd: number;
  pnn50: number;
  sd1: number;
  sd2: number;
  respiratoryRate: number;
  stressLevel: 'low' | 'moderate' | 'high' | 'unknown';
  stressIndex: number;
  recordingClass: 'insufficient_data' | 'ultra-short' | 'short-term' | 'standard';
}

interface HrDataPayload {
  hr: number;
  timestamp: number;
  sqi: number;
  isValid: boolean;
}

// Configuration
const MIN_RR_INTERVALS = 10;
const MAX_RR_MS = 2000;
const MIN_RR_MS = 300;

// State
let rrIntervals: number[] = [];
let isRunning = false;
let lowPowerMode = false;

let currentMetrics: HrvMetrics = {
  sdnn: 0,
  rmssd: 0,
  pnn50: 0,
  sd1: 0,
  sd2: 0,
  respiratoryRate: 0,
  stressLevel: 'unknown',
  stressIndex: 0,
  recordingClass: 'insufficient_data'
};

// Worker message handler
self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'init':
      handleInit();
      break;
    case 'hr_data':
      handleHrData(payload as HrDataPayload);
      break;
    case 'reset':
      handleReset();
      break;
    case 'setMode':
      lowPowerMode = payload.isLowPower;
      break;
    case 'get_metrics':
      self.postMessage({ type: 'metrics', payload: currentMetrics });
      break;
    case 'get_full_data':
      self.postMessage({
        type: 'full_data',
        payload: {
          metrics: currentMetrics,
          rrIntervals: rrIntervals.slice(),
          sampleCount: rrIntervals.length
        }
      });
      break;
  }
};

function handleInit() {
  rrIntervals = [];
  isRunning = true;
  currentMetrics = {
    sdnn: 0,
    rmssd: 0,
    pnn50: 0,
    sd1: 0,
    sd2: 0,
    respiratoryRate: 0,
    stressLevel: 'unknown',
    stressIndex: 0,
    recordingClass: 'insufficient_data'
  };
  self.postMessage({ type: 'initDone' });
}

function handleReset() {
  rrIntervals = [];
  currentMetrics = {
    sdnn: 0,
    rmssd: 0,
    pnn50: 0,
    sd1: 0,
    sd2: 0,
    respiratoryRate: 0,
    stressLevel: 'unknown',
    stressIndex: 0,
    recordingClass: 'insufficient_data'
  };
}

function handleHrData(payload: HrDataPayload) {
  const { hr, sqi, isValid } = payload;

  if (!isValid || hr <= 0 || sqi < 0.38) {
    return;
  }

  const rrInterval = 60000 / hr;

  if (rrInterval < MIN_RR_MS || rrInterval > MAX_RR_MS) {
    return;
  }

  rrIntervals.push(rrInterval);

  const maxIntervals = 600;
  if (rrIntervals.length > maxIntervals) {
    rrIntervals.shift();
  }

  if (rrIntervals.length >= MIN_RR_INTERVALS) {
    calculateMetrics();
    self.postMessage({
      type: 'metrics',
      payload: currentMetrics
    });
  }
}

function calculateMetrics() {
  const validRR = rrIntervals.filter(rr => rr >= MIN_RR_MS && rr <= MAX_RR_MS);

  if (validRR.length < MIN_RR_INTERVALS) {
    return;
  }

  currentMetrics.sdnn = calculateSDNN(validRR);
  currentMetrics.rmssd = calculateRMSSD(validRR);
  currentMetrics.pnn50 = calculatePNN50(validRR);

  const { sd1, sd2 } = calculatePoincare(validRR);
  currentMetrics.sd1 = sd1;
  currentMetrics.sd2 = sd2;

  currentMetrics.respiratoryRate = estimateRespiratoryRate(validRR);

  const stressAnalysis = calculateStressIndex(validRR, currentMetrics.rmssd);
  currentMetrics.stressIndex = stressAnalysis.stressIndex;
  currentMetrics.stressLevel = stressAnalysis.stressLevel;

  currentMetrics.recordingClass = classifyRecording(validRR.length);
}

function calculateSDNN(rrIntervals: number[]): number {
  const mean = rrIntervals.reduce((a, b) => a + b, 0) / rrIntervals.length;
  const variance = rrIntervals.reduce((sum, rr) => sum + Math.pow(rr - mean, 2), 0) / rrIntervals.length;
  return Math.sqrt(variance);
}

function calculateRMSSD(rrIntervals: number[]): number {
  if (rrIntervals.length < 2) return 0;

  let sumSquaredDiff = 0;
  let count = 0;

  for (let i = 1; i < rrIntervals.length; i++) {
    const diff = rrIntervals[i] - rrIntervals[i - 1];
    sumSquaredDiff += diff * diff;
    count++;
  }

  return Math.sqrt(sumSquaredDiff / count);
}

function calculatePNN50(rrIntervals: number[]): number {
  if (rrIntervals.length < 2) return 0;

  let count = 0;
  let total = 0;

  for (let i = 1; i < rrIntervals.length; i++) {
    if (Math.abs(rrIntervals[i] - rrIntervals[i - 1]) > 50) {
      count++;
    }
    total++;
  }

  return total > 0 ? (count / total) * 100 : 0;
}

function calculatePoincare(rrIntervals: number[]): { sd1: number; sd2: number } {
  if (rrIntervals.length < 2) {
    return { sd1: 0, sd2: 0 };
  }

  const diffs: number[] = [];
  const sums: number[] = [];

  for (let i = 0; i < rrIntervals.length - 1; i++) {
    diffs.push(rrIntervals[i + 1] - rrIntervals[i]);
    sums.push(rrIntervals[i + 1] + rrIntervals[i]);
  }

  const meanDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const varDiff = diffs.reduce((sum, d) => sum + Math.pow(d - meanDiff, 2), 0) / diffs.length;
  const sd1 = Math.sqrt(varDiff / 2);

  const meanSum = sums.reduce((a, b) => a + b, 0) / sums.length;
  const varSum = sums.reduce((sum, s) => sum + Math.pow(s - meanSum, 2), 0) / sums.length;
  const sd2 = Math.sqrt(varSum / 2);

  return { sd1, sd2 };
}

function estimateRespiratoryRate(rrIntervals: number[]): number {
  if (rrIntervals.length < 20) {
    const meanRR = rrIntervals.reduce((a, b) => a + b, 0) / rrIntervals.length;
    const hr = 60000 / meanRR;
    return Math.round(hr / 4.5);
  }

  const diffs: number[] = [];
  for (let i = 1; i < rrIntervals.length; i++) {
    diffs.push(rrIntervals[i] - rrIntervals[i - 1]);
  }

  let zeroCrossings = 0;
  for (let i = 1; i < diffs.length; i++) {
    if ((diffs[i] > 0 && diffs[i - 1] <= 0) || (diffs[i] < 0 && diffs[i - 1] >= 0)) {
      zeroCrossings++;
    }
  }

  const duration = rrIntervals.reduce((a, b) => a + b, 0) / 1000;
  const respiratoryRate = (zeroCrossings / 2) * (60 / duration);

  return Math.max(8, Math.min(30, Math.round(respiratoryRate)));
}

function calculateStressIndex(rrIntervals: number[], rmssd: number): { stressIndex: number; stressLevel: 'low' | 'moderate' | 'high' | 'unknown' } {
  let stressLevel: 'low' | 'moderate' | 'high' | 'unknown';

  const normalizedRMSSD = Math.max(15, Math.min(80, rmssd));
  const stressIndex = 100 - ((normalizedRMSSD - 15) / 65 * 100);

  if (rmssd < 25) {
    stressLevel = 'high';
  } else if (rmssd < 40) {
    stressLevel = 'moderate';
  } else {
    stressLevel = 'low';
  }

  return { stressIndex, stressLevel };
}

function classifyRecording(numIntervals: number): 'insufficient_data' | 'ultra-short' | 'short-term' | 'standard' {
  if (numIntervals < 30) {
    return 'ultra-short';
  } else if (numIntervals < 150) {
    return 'short-term';
  } else {
    return 'standard';
  }
}

export {};
