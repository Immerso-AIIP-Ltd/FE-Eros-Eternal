/**
 * HRV Worker - Heart Rate Variability, Respiratory Rate, Stress Analysis,
 * Frequency Domain, Nonlinear Metrics (Sample Entropy, DFA Alpha1)
 */

// Types
interface FrequencyDomainMetrics {
  vlf: number;
  lf: number;
  hf: number;
  tp: number;
  lfHfRatio: number;
}

interface NonlinearMetrics {
  sd1: number;
  sd2: number;
  sd1Sd2Ratio: number;
  sampleEntropy: number | null;
  dfaAlpha1: number | null;
  dfaAlpha1Reliable: boolean;
}

interface RespiratoryExtended {
  breathingRateMean: number;
  breathingRateSd: number;
  breathingRateCv: number;
  stability: 'stable' | 'variable' | 'unstable';
  breathCyclesDetected: number;
}

interface StressAnalysisData {
  sympathovagalBalance: number | null;
  stressLevel: 'low' | 'moderate' | 'high' | 'unknown';
  stressIndex: number;
  stressDescription: string;
}

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
  // New metrics
  frequencyDomain: FrequencyDomainMetrics;
  nonlinear: NonlinearMetrics;
  respiratoryExtended: RespiratoryExtended;
  stressAnalysis: StressAnalysisData;
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
let scanDurationSeconds = 40;

const defaultFrequencyDomain: FrequencyDomainMetrics = { vlf: 0, lf: 0, hf: 0, tp: 0, lfHfRatio: 0 };
const defaultNonlinear: NonlinearMetrics = { sd1: 0, sd2: 0, sd1Sd2Ratio: 0, sampleEntropy: null, dfaAlpha1: null, dfaAlpha1Reliable: false };
const defaultRespiratoryExtended: RespiratoryExtended = { breathingRateMean: 0, breathingRateSd: 0, breathingRateCv: 0, stability: 'stable', breathCyclesDetected: 0 };
const defaultStressAnalysis: StressAnalysisData = { sympathovagalBalance: null, stressLevel: 'unknown', stressIndex: 0, stressDescription: 'Insufficient HRV data' };

let currentMetrics: HrvMetrics = {
  sdnn: 0, rmssd: 0, pnn50: 0, sd1: 0, sd2: 0,
  respiratoryRate: 0, stressLevel: 'unknown', stressIndex: 0,
  recordingClass: 'insufficient_data',
  frequencyDomain: { ...defaultFrequencyDomain },
  nonlinear: { ...defaultNonlinear },
  respiratoryExtended: { ...defaultRespiratoryExtended },
  stressAnalysis: { ...defaultStressAnalysis },
};

function resetMetrics(): HrvMetrics {
  return {
    sdnn: 0, rmssd: 0, pnn50: 0, sd1: 0, sd2: 0,
    respiratoryRate: 0, stressLevel: 'unknown', stressIndex: 0,
    recordingClass: 'insufficient_data',
    frequencyDomain: { ...defaultFrequencyDomain },
    nonlinear: { ...defaultNonlinear },
    respiratoryExtended: { ...defaultRespiratoryExtended },
    stressAnalysis: { ...defaultStressAnalysis },
  };
}

// Worker message handler
self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'init':
      if (payload?.scanDuration) scanDurationSeconds = payload.scanDuration;
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
      // Recalculate everything with full precision for final report
      if (rrIntervals.length >= MIN_RR_INTERVALS) {
        calculateMetrics(true);
      }
      self.postMessage({
        type: 'full_data',
        payload: {
          metrics: currentMetrics,
          rrIntervals: rrIntervals.slice(),
          sampleCount: rrIntervals.length,
          poincareData: generatePoincareData(rrIntervals),
        }
      });
      break;
  }
};

function handleInit() {
  rrIntervals = [];
  isRunning = true;
  currentMetrics = resetMetrics();
  self.postMessage({ type: 'initDone' });
}

function handleReset() {
  rrIntervals = [];
  currentMetrics = resetMetrics();
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
    calculateMetrics(false);
    self.postMessage({
      type: 'metrics',
      payload: currentMetrics
    });
  }
}

function calculateMetrics(isFinal: boolean) {
  const validRR = rrIntervals.filter(rr => rr >= MIN_RR_MS && rr <= MAX_RR_MS);

  if (validRR.length < MIN_RR_INTERVALS) {
    return;
  }

  // Time domain
  currentMetrics.sdnn = calculateSDNN(validRR);
  currentMetrics.rmssd = calculateRMSSD(validRR);
  currentMetrics.pnn50 = calculatePNN50(validRR);

  // Poincare (SD1/SD2)
  const { sd1, sd2 } = calculatePoincare(validRR);
  currentMetrics.sd1 = sd1;
  currentMetrics.sd2 = sd2;

  // Nonlinear
  currentMetrics.nonlinear = {
    sd1,
    sd2,
    sd1Sd2Ratio: sd2 > 0 ? sd1 / sd2 : 0,
    sampleEntropy: (isFinal && validRR.length >= 10) ? calculateSampleEntropy(validRR) : currentMetrics.nonlinear.sampleEntropy,
    dfaAlpha1: (isFinal && validRR.length >= 16) ? calculateDFA(validRR) : currentMetrics.nonlinear.dfaAlpha1,
    dfaAlpha1Reliable: validRR.length >= 100,
  };

  // Respiratory
  currentMetrics.respiratoryRate = estimateRespiratoryRate(validRR);
  currentMetrics.respiratoryExtended = calculateRespiratoryExtended(validRR, currentMetrics.respiratoryRate);

  // Frequency domain (only compute on final or every 30 intervals for performance)
  if (isFinal || validRR.length % 30 === 0) {
    currentMetrics.frequencyDomain = calculateFrequencyDomain(validRR);
  }

  // Stress analysis using sympathovagal balance
  currentMetrics.stressAnalysis = calculateStressAnalysis(
    currentMetrics.sdnn, currentMetrics.rmssd, currentMetrics.frequencyDomain.lfHfRatio
  );
  currentMetrics.stressIndex = currentMetrics.stressAnalysis.stressIndex;
  currentMetrics.stressLevel = currentMetrics.stressAnalysis.stressLevel;

  currentMetrics.recordingClass = classifyRecording(validRR.length);
}

// ==================== TIME DOMAIN ====================

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

// ==================== POINCARE (SD1/SD2) ====================

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

function generatePoincareData(rrIntervals: number[]): { x: number; y: number }[] {
  const data: { x: number; y: number }[] = [];
  for (let i = 0; i < rrIntervals.length - 1; i++) {
    data.push({ x: rrIntervals[i], y: rrIntervals[i + 1] });
  }
  return data;
}

// ==================== FREQUENCY DOMAIN (FFT) ====================

function calculateFrequencyDomain(rrIntervals: number[]): FrequencyDomainMetrics {
  if (rrIntervals.length < 20) {
    return { ...defaultFrequencyDomain };
  }

  try {
    // Interpolate RR intervals to uniform 4 Hz sampling
    const interpFs = 4; // Hz
    const cumTime: number[] = [0];
    for (let i = 1; i < rrIntervals.length; i++) {
      cumTime.push(cumTime[i - 1] + rrIntervals[i - 1] / 1000);
    }
    const totalTime = cumTime[cumTime.length - 1];
    const nSamples = Math.floor(totalTime * interpFs);

    if (nSamples < 16) return { ...defaultFrequencyDomain };

    // Linear interpolation to uniform sampling
    const uniformRR: number[] = [];
    let j = 0;
    for (let i = 0; i < nSamples; i++) {
      const t = i / interpFs;
      while (j < cumTime.length - 2 && cumTime[j + 1] < t) j++;
      if (j >= cumTime.length - 1) break;
      const frac = (t - cumTime[j]) / (cumTime[j + 1] - cumTime[j] || 1);
      uniformRR.push(rrIntervals[j] + frac * (rrIntervals[j + 1] - rrIntervals[j]));
    }

    if (uniformRR.length < 16) return { ...defaultFrequencyDomain };

    // Remove mean (detrend)
    const mean = uniformRR.reduce((a, b) => a + b, 0) / uniformRR.length;
    const detrended = uniformRR.map(v => v - mean);

    // Zero-pad to next power of 2
    let fftSize = 1;
    while (fftSize < detrended.length) fftSize *= 2;
    fftSize = Math.max(fftSize, 256); // minimum 256 for resolution

    const real = new Float64Array(fftSize);
    const imag = new Float64Array(fftSize);

    // Apply Hanning window
    for (let i = 0; i < detrended.length; i++) {
      const window = 0.5 * (1 - Math.cos(2 * Math.PI * i / (detrended.length - 1)));
      real[i] = detrended[i] * window;
    }

    // FFT
    fft(real, imag);

    // Calculate PSD (one-sided, normalized)
    const freqResolution = interpFs / fftSize;
    const halfN = Math.floor(fftSize / 2);
    const psd: number[] = [];
    const freqs: number[] = [];

    for (let i = 0; i <= halfN; i++) {
      freqs.push(i * freqResolution);
      const power = (real[i] * real[i] + imag[i] * imag[i]) / (fftSize * interpFs);
      psd.push(i === 0 || i === halfN ? power : 2 * power);
    }

    // Band integration
    let vlf = 0, lf = 0, hf = 0;
    for (let i = 0; i < freqs.length; i++) {
      const f = freqs[i];
      const p = psd[i] * freqResolution;
      if (f > 0.003 && f <= 0.04) vlf += p;
      else if (f > 0.04 && f <= 0.15) lf += p;
      else if (f > 0.15 && f <= 0.4) hf += p;
    }

    const tp = vlf + lf + hf;
    const lfHfRatio = hf > 0 ? lf / hf : 0;

    return {
      vlf: Math.round(vlf * 100) / 100,
      lf: Math.round(lf * 100) / 100,
      hf: Math.round(hf * 100) / 100,
      tp: Math.round(tp * 100) / 100,
      lfHfRatio: Math.round(lfHfRatio * 100) / 100,
    };
  } catch {
    return { ...defaultFrequencyDomain };
  }
}

// In-place Cooley-Tukey FFT (radix-2)
function fft(real: Float64Array, imag: Float64Array) {
  const n = real.length;
  if (n <= 1) return;

  // Bit-reversal permutation
  let j = 0;
  for (let i = 1; i < n; i++) {
    let bit = n >> 1;
    while (j & bit) {
      j ^= bit;
      bit >>= 1;
    }
    j ^= bit;
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]];
    }
  }

  // FFT butterfly
  for (let len = 2; len <= n; len *= 2) {
    const halfLen = len / 2;
    const angle = -2 * Math.PI / len;
    const wReal = Math.cos(angle);
    const wImag = Math.sin(angle);

    for (let i = 0; i < n; i += len) {
      let curReal = 1, curImag = 0;
      for (let k = 0; k < halfLen; k++) {
        const tReal = curReal * real[i + k + halfLen] - curImag * imag[i + k + halfLen];
        const tImag = curReal * imag[i + k + halfLen] + curImag * real[i + k + halfLen];
        real[i + k + halfLen] = real[i + k] - tReal;
        imag[i + k + halfLen] = imag[i + k] - tImag;
        real[i + k] += tReal;
        imag[i + k] += tImag;
        const newCurReal = curReal * wReal - curImag * wImag;
        curImag = curReal * wImag + curImag * wReal;
        curReal = newCurReal;
      }
    }
  }
}

// ==================== SAMPLE ENTROPY ====================

function calculateSampleEntropy(rrIntervals: number[], m: number = 2, rFactor: number = 0.2): number | null {
  const n = rrIntervals.length;
  if (n < 10) return null;

  try {
    const std = Math.sqrt(
      rrIntervals.reduce((sum, v) => {
        const mean = rrIntervals.reduce((a, b) => a + b, 0) / n;
        return sum + (v - mean) * (v - mean);
      }, 0) / n
    );
    const r = rFactor * std;

    if (r === 0) return null;

    // Count matches for template length m
    let B = 0;
    for (let i = 0; i < n - m; i++) {
      for (let j = i + 1; j < n - m; j++) {
        let match = true;
        for (let k = 0; k < m; k++) {
          if (Math.abs(rrIntervals[i + k] - rrIntervals[j + k]) > r) {
            match = false;
            break;
          }
        }
        if (match) B++;
      }
    }

    // Count matches for template length m+1
    let A = 0;
    for (let i = 0; i < n - m - 1; i++) {
      for (let j = i + 1; j < n - m - 1; j++) {
        let match = true;
        for (let k = 0; k < m + 1; k++) {
          if (Math.abs(rrIntervals[i + k] - rrIntervals[j + k]) > r) {
            match = false;
            break;
          }
        }
        if (match) A++;
      }
    }

    if (B === 0) return null;
    return -Math.log(A / B);
  } catch {
    return null;
  }
}

// ==================== DFA ALPHA1 ====================

function calculateDFA(rrIntervals: number[]): number | null {
  const n = rrIntervals.length;
  if (n < 16) return null;

  try {
    const mean = rrIntervals.reduce((a, b) => a + b, 0) / n;

    // Integrate: cumulative sum of deviations from mean
    const y: number[] = [];
    let cumSum = 0;
    for (let i = 0; i < n; i++) {
      cumSum += rrIntervals[i] - mean;
      y.push(cumSum);
    }

    // Window sizes for alpha1 (short-term: 4 to 16)
    const minBox = 4;
    const maxBox = Math.min(16, Math.floor(n / 4));

    if (maxBox < minBox) return null;

    const logN: number[] = [];
    const logF: number[] = [];

    for (let boxSize = minBox; boxSize <= maxBox; boxSize++) {
      const numBoxes = Math.floor(n / boxSize);
      if (numBoxes < 1) continue;

      let totalVariance = 0;

      for (let b = 0; b < numBoxes; b++) {
        const start = b * boxSize;
        const segment = y.slice(start, start + boxSize);

        // Linear detrend (least squares fit)
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (let i = 0; i < boxSize; i++) {
          sumX += i;
          sumY += segment[i];
          sumXY += i * segment[i];
          sumX2 += i * i;
        }
        const slope = (boxSize * sumXY - sumX * sumY) / (boxSize * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / boxSize;

        // Residual variance
        let residualVar = 0;
        for (let i = 0; i < boxSize; i++) {
          const trend = slope * i + intercept;
          residualVar += (segment[i] - trend) * (segment[i] - trend);
        }
        totalVariance += residualVar / boxSize;
      }

      const F = Math.sqrt(totalVariance / numBoxes);
      if (F > 0) {
        logN.push(Math.log(boxSize));
        logF.push(Math.log(F));
      }
    }

    if (logN.length < 2) return null;

    // Linear regression of log(F) vs log(n) for alpha1
    const nPts = logN.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < nPts; i++) {
      sumX += logN[i];
      sumY += logF[i];
      sumXY += logN[i] * logF[i];
      sumX2 += logN[i] * logN[i];
    }
    const alpha = (nPts * sumXY - sumX * sumY) / (nPts * sumX2 - sumX * sumX);

    return isFinite(alpha) ? Math.round(alpha * 1000) / 1000 : null;
  } catch {
    return null;
  }
}

// ==================== RESPIRATORY ====================

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

function calculateRespiratoryExtended(rrIntervals: number[], breathingRateMean: number): RespiratoryExtended {
  const duration = rrIntervals.reduce((a, b) => a + b, 0) / 1000; // seconds

  // Estimate per-window breathing rates for SD/CV
  const windowSize = Math.min(20, Math.floor(rrIntervals.length / 2));
  const rates: number[] = [];

  if (windowSize >= 10) {
    for (let i = 0; i <= rrIntervals.length - windowSize; i += Math.max(1, Math.floor(windowSize / 2))) {
      const windowRR = rrIntervals.slice(i, i + windowSize);
      rates.push(estimateRespiratoryRate(windowRR));
    }
  }

  let breathingRateSd = 0;
  let breathingRateCv = 0;
  if (rates.length >= 2) {
    const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
    breathingRateSd = Math.sqrt(rates.reduce((sum, r) => sum + (r - mean) * (r - mean), 0) / rates.length);
    breathingRateCv = mean > 0 ? breathingRateSd / mean : 0;
  }

  let stability: 'stable' | 'variable' | 'unstable' = 'stable';
  if (breathingRateCv > 0.3) stability = 'unstable';
  else if (breathingRateCv > 0.15 || breathingRateMean > 18) stability = 'variable';

  const breathCyclesDetected = Math.round(duration * breathingRateMean / 60);

  return {
    breathingRateMean,
    breathingRateSd: Math.round(breathingRateSd * 10) / 10,
    breathingRateCv: Math.round(breathingRateCv * 1000) / 1000,
    stability,
    breathCyclesDetected,
  };
}

// ==================== STRESS ANALYSIS ====================

function calculateStressAnalysis(sdnn: number, rmssd: number, lfHfRatio: number): StressAnalysisData {
  // Sympathovagal balance: ln(SDNN) / ln(RMSSD)
  let sympathovagalBalance: number | null = null;
  if (sdnn > 0 && rmssd > 0) {
    sympathovagalBalance = Math.round((Math.log(sdnn) / Math.log(rmssd)) * 1000) / 1000;
  }

  let stressLevel: 'low' | 'moderate' | 'high' | 'unknown' = 'unknown';
  let stressDescription = 'Insufficient HRV data';

  if (sympathovagalBalance !== null) {
    if (sympathovagalBalance < 1.0) {
      stressLevel = 'low';
      stressDescription = 'Relaxed state, parasympathetic dominance';
    } else if (sympathovagalBalance < 1.5) {
      stressLevel = 'moderate';
      stressDescription = 'Balanced autonomic tone';
    } else {
      stressLevel = 'high';
      stressDescription = 'Elevated stress, sympathetic dominance';
    }
  }

  // Stress index: combines RMSSD and sympathovagal balance
  let stressIndex = 50;
  if (rmssd > 0) {
    const normalizedRMSSD = Math.max(15, Math.min(80, rmssd));
    stressIndex = 100 - ((normalizedRMSSD - 15) / 65 * 100);
  }

  return { sympathovagalBalance, stressLevel, stressIndex, stressDescription };
}

// ==================== RECORDING CLASS ====================

function classifyRecording(numIntervals: number): 'insufficient_data' | 'ultra-short' | 'short-term' | 'standard' {
  if (numIntervals < 30) return 'ultra-short';
  if (numIntervals < 150) return 'short-term';
  return 'standard';
}

export {};
