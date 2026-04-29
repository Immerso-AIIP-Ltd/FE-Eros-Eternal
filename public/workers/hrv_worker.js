/**
 * HRV Worker - Heart Rate Variability, Respiratory Rate, Stress Analysis,
 * Frequency Domain, Nonlinear Metrics (Sample Entropy, DFA Alpha1)
 *
 * Matches final_scanner.py output structure.
 */

// Configuration
const MIN_RR_INTERVALS = 10;
const MAX_RR_MS = 2000;
const MIN_RR_MS = 300;

// State
let rrIntervals = [];
let isRunning = false;
let lowPowerMode = false;

const defaultFrequencyDomain = { vlf: 0, lf: 0, hf: 0, tp: 0, lfHfRatio: 0 };
const defaultNonlinear = { sd1: 0, sd2: 0, sd1Sd2Ratio: 0, sampleEntropy: null, dfaAlpha1: null, dfaAlpha1Reliable: false };
const defaultRespiratoryExtended = { breathingRateMean: 0, breathingRateSd: 0, breathingRateCv: 0, stability: 'stable', breathCyclesDetected: 0 };
const defaultStressAnalysis = { sympathovagalBalance: null, stressLevel: 'unknown', stressIndex: 0, stressDescription: 'Insufficient HRV data' };

let currentMetrics = {
  sdnn: 0, rmssd: 0, pnn50: 0, pnn20: 0, sd1: 0, sd2: 0,
  respiratoryRate: 0, stressLevel: 'unknown', stressIndex: 0,
  recordingClass: 'insufficient_data',
  frequencyDomain: Object.assign({}, defaultFrequencyDomain),
  nonlinear: Object.assign({}, defaultNonlinear),
  respiratoryExtended: Object.assign({}, defaultRespiratoryExtended),
  stressAnalysis: Object.assign({}, defaultStressAnalysis),
};

function resetMetrics() {
  return {
    sdnn: 0, rmssd: 0, pnn50: 0, pnn20: 0, sd1: 0, sd2: 0,
    respiratoryRate: 0, stressLevel: 'unknown', stressIndex: 0,
    recordingClass: 'insufficient_data',
    frequencyDomain: Object.assign({}, defaultFrequencyDomain),
    nonlinear: Object.assign({}, defaultNonlinear),
    respiratoryExtended: Object.assign({}, defaultRespiratoryExtended),
    stressAnalysis: Object.assign({}, defaultStressAnalysis),
  };
}

// Worker message handler
self.onmessage = function(e) {
  var type = e.data.type;
  var payload = e.data.payload;

  switch (type) {
    case 'init':
      handleInit();
      break;
    case 'hr_data':
      handleHrData(payload);
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
      // Recalculate with full precision for final report
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

function handleHrData(payload) {
  var hr = payload.hr;
  var sqi = payload.sqi;
  var isValid = payload.isValid;

  if (!isValid || hr <= 0 || sqi < 0.38) return;

  var rrInterval = 60000 / hr;
  if (rrInterval < MIN_RR_MS || rrInterval > MAX_RR_MS) return;

  rrIntervals.push(rrInterval);
  if (rrIntervals.length > 600) rrIntervals.shift();

  if (rrIntervals.length >= MIN_RR_INTERVALS) {
    calculateMetrics(false);
    self.postMessage({ type: 'metrics', payload: currentMetrics });
  }
}

function calculateMetrics(isFinal) {
  var validRR = rrIntervals.filter(function(rr) { return rr >= MIN_RR_MS && rr <= MAX_RR_MS; });
  if (validRR.length < MIN_RR_INTERVALS) return;

  try {
    // Time domain
    currentMetrics.sdnn = calculateSDNN(validRR);
    currentMetrics.rmssd = calculateRMSSD(validRR);
    currentMetrics.pnn50 = calculatePNN50(validRR);
    currentMetrics.pnn20 = calculatePNNx(validRR, 20);

    // Poincare
    var poincare = calculatePoincare(validRR);
    currentMetrics.sd1 = poincare.sd1;
    currentMetrics.sd2 = poincare.sd2;

    // Nonlinear
    var se = null, dfa = null;
    if (isFinal) {
      if (validRR.length >= 10) se = calculateSampleEntropy(validRR, 2, 0.2);
      if (validRR.length >= 16) dfa = calculateDFA(validRR);
    }
    currentMetrics.nonlinear = {
      sd1: poincare.sd1,
      sd2: poincare.sd2,
      sd1Sd2Ratio: poincare.sd2 > 0 ? poincare.sd1 / poincare.sd2 : 0,
      sampleEntropy: se !== null ? se : (currentMetrics.nonlinear ? currentMetrics.nonlinear.sampleEntropy : null),
      dfaAlpha1: dfa !== null ? dfa : (currentMetrics.nonlinear ? currentMetrics.nonlinear.dfaAlpha1 : null),
      dfaAlpha1Reliable: validRR.length >= 100,
    };

    // Respiratory
    currentMetrics.respiratoryRate = estimateRespiratoryRate(validRR);
    currentMetrics.respiratoryExtended = calculateRespiratoryExtended(validRR, currentMetrics.respiratoryRate);

    // Frequency domain (only compute on final or every 30 intervals)
    if (isFinal || validRR.length % 30 === 0) {
      currentMetrics.frequencyDomain = calculateFrequencyDomain(validRR);
    }

    // Stress analysis using sympathovagal balance
    var lfHf = currentMetrics.frequencyDomain ? currentMetrics.frequencyDomain.lfHfRatio : 0;
    currentMetrics.stressAnalysis = calculateStressAnalysis(currentMetrics.sdnn, currentMetrics.rmssd, lfHf);
    currentMetrics.stressIndex = currentMetrics.stressAnalysis.stressIndex;
    currentMetrics.stressLevel = currentMetrics.stressAnalysis.stressLevel;

    currentMetrics.recordingClass = classifyRecording(validRR.length);
  } catch (err) {
    console.error('[HRV Worker] calculateMetrics error:', err);
  }
}

// ==================== TIME DOMAIN ====================

function calculateSDNN(rr) {
  var mean = rr.reduce(function(a, b) { return a + b; }, 0) / rr.length;
  var variance = rr.reduce(function(sum, v) { return sum + (v - mean) * (v - mean); }, 0) / rr.length;
  return Math.sqrt(variance);
}

function calculateRMSSD(rr) {
  if (rr.length < 2) return 0;
  var sum = 0, count = 0;
  for (var i = 1; i < rr.length; i++) {
    var diff = rr[i] - rr[i - 1];
    sum += diff * diff;
    count++;
  }
  return Math.sqrt(sum / count);
}

function calculatePNN50(rr) {
  if (rr.length < 2) return 0;
  var count = 0, total = 0;
  for (var i = 1; i < rr.length; i++) {
    if (Math.abs(rr[i] - rr[i - 1]) > 50) count++;
    total++;
  }
  return total > 0 ? (count / total) * 100 : 0;
}

/**
 * Generalized pNNx: percentage of successive RR differences exceeding x ms.
 * pNN20 is more suitable for rPPG-derived RR intervals.
 */
function calculatePNNx(rr, thresholdMs) {
  if (rr.length < 2) return 0;
  var count = 0, total = 0;
  for (var i = 1; i < rr.length; i++) {
    if (Math.abs(rr[i] - rr[i - 1]) > thresholdMs) count++;
    total++;
  }
  return total > 0 ? (count / total) * 100 : 0;
}

// ==================== POINCARE ====================

function calculatePoincare(rr) {
  if (rr.length < 2) return { sd1: 0, sd2: 0 };
  var diffs = [], sums = [];
  for (var i = 0; i < rr.length - 1; i++) {
    diffs.push(rr[i + 1] - rr[i]);
    sums.push(rr[i + 1] + rr[i]);
  }
  var meanDiff = diffs.reduce(function(a, b) { return a + b; }, 0) / diffs.length;
  var varDiff = diffs.reduce(function(s, d) { return s + (d - meanDiff) * (d - meanDiff); }, 0) / diffs.length;
  var sd1 = Math.sqrt(varDiff / 2);
  var meanSum = sums.reduce(function(a, b) { return a + b; }, 0) / sums.length;
  var varSum = sums.reduce(function(s, v) { return s + (v - meanSum) * (v - meanSum); }, 0) / sums.length;
  var sd2 = Math.sqrt(varSum / 2);
  return { sd1: sd1, sd2: sd2 };
}

function generatePoincareData(rr) {
  var data = [];
  for (var i = 0; i < rr.length - 1; i++) {
    data.push({ x: rr[i], y: rr[i + 1] });
  }
  return data;
}

// ==================== FREQUENCY DOMAIN (FFT) ====================

function calculateFrequencyDomain(rr) {
  if (rr.length < 20) return Object.assign({}, defaultFrequencyDomain);

  try {
    var interpFs = 4;
    var cumTime = [0];
    for (var i = 1; i < rr.length; i++) {
      cumTime.push(cumTime[i - 1] + rr[i - 1] / 1000);
    }
    var totalTime = cumTime[cumTime.length - 1];
    var nSamples = Math.floor(totalTime * interpFs);
    if (nSamples < 16) return Object.assign({}, defaultFrequencyDomain);

    // Linear interpolation to uniform sampling
    var uniformRR = [];
    var j = 0;
    for (var i = 0; i < nSamples; i++) {
      var t = i / interpFs;
      while (j < cumTime.length - 2 && cumTime[j + 1] < t) j++;
      if (j >= cumTime.length - 1) break;
      var frac = (t - cumTime[j]) / (cumTime[j + 1] - cumTime[j] || 1);
      uniformRR.push(rr[j] + frac * (rr[Math.min(j + 1, rr.length - 1)] - rr[j]));
    }
    if (uniformRR.length < 16) return Object.assign({}, defaultFrequencyDomain);

    // Remove mean
    var mean = uniformRR.reduce(function(a, b) { return a + b; }, 0) / uniformRR.length;
    var detrended = uniformRR.map(function(v) { return v - mean; });

    // Zero-pad to next power of 2
    var fftSize = 1;
    while (fftSize < detrended.length) fftSize *= 2;
    if (fftSize < 256) fftSize = 256;

    var real = new Float64Array(fftSize);
    var imag = new Float64Array(fftSize);

    // Hanning window
    for (var i = 0; i < detrended.length; i++) {
      var w = 0.5 * (1 - Math.cos(2 * Math.PI * i / (detrended.length - 1)));
      real[i] = detrended[i] * w;
    }

    fft(real, imag);

    // PSD
    var freqRes = interpFs / fftSize;
    var halfN = Math.floor(fftSize / 2);
    var vlf = 0, lf = 0, hf = 0;

    for (var i = 0; i <= halfN; i++) {
      var f = i * freqRes;
      var power = (real[i] * real[i] + imag[i] * imag[i]) / (fftSize * interpFs);
      if (i !== 0 && i !== halfN) power *= 2;
      var p = power * freqRes;
      if (f > 0.003 && f <= 0.04) vlf += p;
      else if (f > 0.04 && f <= 0.15) lf += p;
      else if (f > 0.15 && f <= 0.4) hf += p;
    }

    var tp = vlf + lf + hf;
    var lfHfRatio = hf > 0 ? lf / hf : 0;

    return {
      vlf: Math.round(vlf * 1000) / 1000,
      lf: Math.round(lf * 1000) / 1000,
      hf: Math.round(hf * 1000) / 1000,
      tp: Math.round(tp * 1000) / 1000,
      lfHfRatio: Math.round(lfHfRatio * 100) / 100,
    };
  } catch (err) {
    console.error('[HRV Worker] Frequency domain error:', err);
    return Object.assign({}, defaultFrequencyDomain);
  }
}

// In-place Cooley-Tukey FFT (radix-2)
function fft(real, imag) {
  var n = real.length;
  if (n <= 1) return;

  // Bit-reversal permutation
  var j = 0;
  for (var i = 1; i < n; i++) {
    var bit = n >> 1;
    while (j & bit) { j ^= bit; bit >>= 1; }
    j ^= bit;
    if (i < j) {
      var tmp = real[i]; real[i] = real[j]; real[j] = tmp;
      tmp = imag[i]; imag[i] = imag[j]; imag[j] = tmp;
    }
  }

  // Butterfly
  for (var len = 2; len <= n; len *= 2) {
    var halfLen = len / 2;
    var angle = -2 * Math.PI / len;
    var wReal = Math.cos(angle);
    var wImag = Math.sin(angle);

    for (var i = 0; i < n; i += len) {
      var curReal = 1, curImag = 0;
      for (var k = 0; k < halfLen; k++) {
        var tReal = curReal * real[i + k + halfLen] - curImag * imag[i + k + halfLen];
        var tImag = curReal * imag[i + k + halfLen] + curImag * real[i + k + halfLen];
        real[i + k + halfLen] = real[i + k] - tReal;
        imag[i + k + halfLen] = imag[i + k] - tImag;
        real[i + k] += tReal;
        imag[i + k] += tImag;
        var newCurReal = curReal * wReal - curImag * wImag;
        curImag = curReal * wImag + curImag * wReal;
        curReal = newCurReal;
      }
    }
  }
}

// ==================== SAMPLE ENTROPY ====================

function calculateSampleEntropy(rr, m, rFactor) {
  var n = rr.length;
  if (n < 10) return null;

  try {
    var mean = rr.reduce(function(a, b) { return a + b; }, 0) / n;
    var variance = rr.reduce(function(s, v) { return s + (v - mean) * (v - mean); }, 0) / n;
    var std = Math.sqrt(variance);
    var r = rFactor * std;
    if (r === 0) return null;

    // Count matches for template length m
    var B = 0;
    for (var i = 0; i < n - m; i++) {
      for (var j = i + 1; j < n - m; j++) {
        var match = true;
        for (var k = 0; k < m; k++) {
          if (Math.abs(rr[i + k] - rr[j + k]) > r) { match = false; break; }
        }
        if (match) B++;
      }
    }

    // Count matches for template length m+1
    var A = 0;
    for (var i = 0; i < n - m - 1; i++) {
      for (var j = i + 1; j < n - m - 1; j++) {
        var match = true;
        for (var k = 0; k < m + 1; k++) {
          if (Math.abs(rr[i + k] - rr[j + k]) > r) { match = false; break; }
        }
        if (match) A++;
      }
    }

    if (B === 0) return null;
    return -Math.log(A / B);
  } catch (err) {
    return null;
  }
}

// ==================== DFA ALPHA1 ====================

function calculateDFA(rr) {
  var n = rr.length;
  if (n < 16) return null;

  try {
    var mean = rr.reduce(function(a, b) { return a + b; }, 0) / n;

    // Integrate
    var y = [];
    var cumSum = 0;
    for (var i = 0; i < n; i++) {
      cumSum += rr[i] - mean;
      y.push(cumSum);
    }

    var minBox = 4;
    var maxBox = Math.min(16, Math.floor(n / 4));
    if (maxBox < minBox) return null;

    var logN = [], logF = [];

    for (var boxSize = minBox; boxSize <= maxBox; boxSize++) {
      var numBoxes = Math.floor(n / boxSize);
      if (numBoxes < 1) continue;

      var totalVariance = 0;
      for (var b = 0; b < numBoxes; b++) {
        var start = b * boxSize;
        // Linear detrend
        var sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (var ii = 0; ii < boxSize; ii++) {
          var yVal = y[start + ii];
          sumX += ii;
          sumY += yVal;
          sumXY += ii * yVal;
          sumX2 += ii * ii;
        }
        var denom = boxSize * sumX2 - sumX * sumX;
        var slope = denom !== 0 ? (boxSize * sumXY - sumX * sumY) / denom : 0;
        var intercept = (sumY - slope * sumX) / boxSize;

        var residualVar = 0;
        for (var ii = 0; ii < boxSize; ii++) {
          var trend = slope * ii + intercept;
          var diff = y[start + ii] - trend;
          residualVar += diff * diff;
        }
        totalVariance += residualVar / boxSize;
      }

      var F = Math.sqrt(totalVariance / numBoxes);
      if (F > 0) {
        logN.push(Math.log(boxSize));
        logF.push(Math.log(F));
      }
    }

    if (logN.length < 2) return null;

    // Linear regression
    var nPts = logN.length;
    var sX = 0, sY = 0, sXY = 0, sX2 = 0;
    for (var i = 0; i < nPts; i++) {
      sX += logN[i];
      sY += logF[i];
      sXY += logN[i] * logF[i];
      sX2 += logN[i] * logN[i];
    }
    var alpha = (nPts * sXY - sX * sY) / (nPts * sX2 - sX * sX);
    return isFinite(alpha) ? Math.round(alpha * 1000) / 1000 : null;
  } catch (err) {
    return null;
  }
}

// ==================== RESPIRATORY ====================

function estimateRespiratoryRate(rr) {
  if (rr.length < 20) {
    var meanRR = rr.reduce(function(a, b) { return a + b; }, 0) / rr.length;
    return Math.round(60000 / meanRR / 4.5);
  }
  var diffs = [];
  for (var i = 1; i < rr.length; i++) diffs.push(rr[i] - rr[i - 1]);
  var zc = 0;
  for (var i = 1; i < diffs.length; i++) {
    if ((diffs[i] > 0 && diffs[i - 1] <= 0) || (diffs[i] < 0 && diffs[i - 1] >= 0)) zc++;
  }
  var duration = rr.reduce(function(a, b) { return a + b; }, 0) / 1000;
  var rate = (zc / 2) * (60 / duration);
  return Math.max(8, Math.min(30, Math.round(rate)));
}

function calculateRespiratoryExtended(rr, breathingRateMean) {
  var duration = rr.reduce(function(a, b) { return a + b; }, 0) / 1000;
  var windowSize = Math.min(20, Math.floor(rr.length / 2));
  var rates = [];

  if (windowSize >= 10) {
    var step = Math.max(1, Math.floor(windowSize / 2));
    for (var i = 0; i <= rr.length - windowSize; i += step) {
      rates.push(estimateRespiratoryRate(rr.slice(i, i + windowSize)));
    }
  }

  var sd = 0, cv = 0;
  if (rates.length >= 2) {
    var mean = rates.reduce(function(a, b) { return a + b; }, 0) / rates.length;
    sd = Math.sqrt(rates.reduce(function(s, r) { return s + (r - mean) * (r - mean); }, 0) / rates.length);
    cv = mean > 0 ? sd / mean : 0;
  }

  var stability = 'stable';
  if (cv > 0.3) stability = 'unstable';
  else if (cv > 0.15 || breathingRateMean > 18) stability = 'variable';

  return {
    breathingRateMean: breathingRateMean,
    breathingRateSd: Math.round(sd * 10) / 10,
    breathingRateCv: Math.round(cv * 1000) / 1000,
    stability: stability,
    breathCyclesDetected: Math.round(duration * breathingRateMean / 60),
  };
}

// ==================== STRESS ANALYSIS ====================

function calculateStressAnalysis(sdnn, rmssd, lfHfRatio) {
  var sympathovagalBalance = null;
  if (sdnn > 0 && rmssd > 0) {
    sympathovagalBalance = Math.round((Math.log(sdnn) / Math.log(rmssd)) * 1000) / 1000;
  }

  var stressLevel = 'unknown';
  var stressDescription = 'Insufficient HRV data';

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

  var stressIndex = 50;
  if (rmssd > 0) {
    var norm = Math.max(15, Math.min(80, rmssd));
    stressIndex = 100 - ((norm - 15) / 65 * 100);
  }

  return {
    sympathovagalBalance: sympathovagalBalance,
    stressLevel: stressLevel,
    stressIndex: stressIndex,
    stressDescription: stressDescription,
  };
}

// ==================== RECORDING CLASS ====================

function classifyRecording(numIntervals) {
  if (numIntervals < 30) return 'ultra-short';
  if (numIntervals < 150) return 'short-term';
  return 'standard';
}
