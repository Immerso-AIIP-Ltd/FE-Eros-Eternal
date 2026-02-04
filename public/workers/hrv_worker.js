/**
 * HRV Worker - Heart Rate Variability, Respiratory Rate, and Stress Analysis
 * 
 * Processes RR intervals to compute:
 * - Time-domain HRV: SDNN, RMSSD, pNN50
 * - Nonlinear HRV: SD1, SD2 (Poincaré plot)
 * - Respiratory Rate from RR interval variability
 * - Stress Index from sympathovagal balance
 */

// Configuration
const MIN_RR_INTERVALS = 10;           // Minimum RR intervals needed for analysis
const MAX_RR_MS = 2000;                // Max valid RR interval (30 BPM)
const MIN_RR_MS = 300;                 // Min valid RR interval (200 BPM)
const SAMPLING_RATE = 30;              // Video sampling rate (Hz)

// State
let rrIntervals = [];                  // Buffer of RR intervals in ms
let lastPeakTime = 0;                  // Timestamp of last detected peak
let isRunning = false;
let lowPowerMode = false;

// Current metrics
let currentMetrics = {
    sdnn: 0,
    rmssd: 0,
    pnn50: 0,
    sd1: 0,
    sd2: 0,
    respiratoryRate: 0,
    stressIndex: 0,
    stressLevel: 'unknown',
    recordingClass: 'insufficient_data'
};

self.onmessage = (e) => {
    const { type, payload } = e.data;
    
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
            self.postMessage({ type: 'full_data', payload: getFullData() });
            break;
    }
};

function handleInit() {
    rrIntervals = [];
    lastPeakTime = 0;
    isRunning = true;
    currentMetrics = {
        sdnn: 0,
        rmssd: 0,
        pnn50: 0,
        sd1: 0,
        sd2: 0,
        respiratoryRate: 0,
        stressIndex: 0,
        stressLevel: 'unknown',
        recordingClass: 'insufficient_data'
    };
    self.postMessage({ type: 'initDone' });
}

function handleReset() {
    rrIntervals = [];
    lastPeakTime = 0;
    currentMetrics = {
        sdnn: 0,
        rmssd: 0,
        pnn50: 0,
        sd1: 0,
        sd2: 0,
        respiratoryRate: 0,
        stressIndex: 0,
        stressLevel: 'unknown',
        recordingClass: 'insufficient_data'
    };
}

/**
 * Process incoming HR data to extract RR intervals
 * Payload: { hr: number, timestamp: number, sqi: number, isValid: boolean }
 */
function handleHrData(payload) {
    const { hr, timestamp, sqi, isValid } = payload;
    
    if (!isValid || hr <= 0 || sqi < 0.38) {
        return;
    }
    
    // Convert HR to RR interval (ms)
    const rrInterval = 60000 / hr;
    
    // Validate RR interval
    if (rrInterval < MIN_RR_MS || rrInterval > MAX_RR_MS) {
        return;
    }
    
    // Add to buffer
    rrIntervals.push(rrInterval);
    
    // Keep only last 5 minutes of data (max ~300 beats at 60 BPM)
    const maxIntervals = 600;
    if (rrIntervals.length > maxIntervals) {
        rrIntervals.shift();
    }
    
    // Calculate metrics if we have enough data
    if (rrIntervals.length >= MIN_RR_INTERVALS) {
        calculateMetrics();
        
        // Send updated metrics
        self.postMessage({
            type: 'metrics',
            payload: currentMetrics
        });
    }
}

/**
 * Calculate all HRV, respiratory, and stress metrics
 */
function calculateMetrics() {
    const validRR = rrIntervals.filter(rr => rr >= MIN_RR_MS && rr <= MAX_RR_MS);
    
    if (validRR.length < MIN_RR_INTERVALS) {
        return;
    }
    
    // Time domain HRV
    currentMetrics.sdnn = calculateSDNN(validRR);
    currentMetrics.rmssd = calculateRMSSD(validRR);
    currentMetrics.pnn50 = calculatePNN50(validRR);
    
    // Nonlinear HRV (Poincaré plot)
    const { sd1, sd2 } = calculatePoincare(validRR);
    currentMetrics.sd1 = sd1;
    currentMetrics.sd2 = sd2;
    
    // Respiratory rate estimation
    currentMetrics.respiratoryRate = estimateRespiratoryRate(validRR);
    
    // Stress analysis
    const stressAnalysis = calculateStressIndex(validRR, currentMetrics.rmssd);
    currentMetrics.stressIndex = stressAnalysis.stressIndex;
    currentMetrics.stressLevel = stressAnalysis.stressLevel;
    
    // Recording classification
    currentMetrics.recordingClass = classifyRecording(validRR.length);
}

/**
 * SDNN - Standard Deviation of NN (normal-to-normal) intervals
 * Overall variability measure
 */
function calculateSDNN(rrIntervals) {
    const mean = rrIntervals.reduce((a, b) => a + b, 0) / rrIntervals.length;
    const variance = rrIntervals.reduce((sum, rr) => sum + Math.pow(rr - mean, 2), 0) / rrIntervals.length;
    return Math.sqrt(variance);
}

/**
 * RMSSD - Root Mean Square of Successive Differences
 * Parasympathetic activity indicator
 */
function calculateRMSSD(rrIntervals) {
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

/**
 * pNN50 - Percentage of successive RR intervals that differ by more than 50ms
 * Another parasympathetic indicator
 */
function calculatePNN50(rrIntervals) {
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

/**
 * Poincaré plot analysis - SD1 and SD2
 * SD1: Short-term variability (parasympathetic)
 * SD2: Long-term variability (sympathetic + parasympathetic)
 */
function calculatePoincare(rrIntervals) {
    if (rrIntervals.length < 2) {
        return { sd1: 0, sd2: 0 };
    }
    
    // Create pairs: (RR_n, RR_{n+1})
    const pairs = [];
    for (let i = 0; i < rrIntervals.length - 1; i++) {
        pairs.push([rrIntervals[i], rrIntervals[i + 1]]);
    }
    
    // Calculate differences and sums
    const diffs = pairs.map(p => p[1] - p[0]);
    const sums = pairs.map(p => p[1] + p[0]);
    
    // SD1 = sqrt(variance of differences) / sqrt(2)
    const meanDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const varDiff = diffs.reduce((sum, d) => sum + Math.pow(d - meanDiff, 2), 0) / diffs.length;
    const sd1 = Math.sqrt(varDiff / 2);
    
    // SD2 = sqrt(variance of sums) / sqrt(2)
    const meanSum = sums.reduce((a, b) => a + b, 0) / sums.length;
    const varSum = sums.reduce((sum, s) => sum + Math.pow(s - meanSum, 2), 0) / sums.length;
    const sd2 = Math.sqrt(varSum / 2);
    
    return { sd1, sd2 };
}

/**
 * Estimate respiratory rate from RR interval variability
 * Uses peak detection in the respiratory frequency range (0.1-0.5 Hz = 6-30 breaths/min)
 */
function estimateRespiratoryRate(rrIntervals) {
    if (rrIntervals.length < 20) {
        // Fallback: use simple heuristic based on HR variability
        const meanRR = rrIntervals.reduce((a, b) => a + b, 0) / rrIntervals.length;
        const hr = 60000 / meanRR;
        // Typical respiratory rate is 1/4 to 1/5 of heart rate
        return Math.round(hr / 4.5);
    }
    
    // Calculate successive differences (RSA - Respiratory Sinus Arrhythmia)
    const diffs = [];
    for (let i = 1; i < rrIntervals.length; i++) {
        diffs.push(rrIntervals[i] - rrIntervals[i - 1]);
    }
    
    // Count zero crossings as proxy for respiratory cycles
    let zeroCrossings = 0;
    for (let i = 1; i < diffs.length; i++) {
        if ((diffs[i] > 0 && diffs[i - 1] <= 0) || (diffs[i] < 0 && diffs[i - 1] >= 0)) {
            zeroCrossings++;
        }
    }
    
    // Convert to breaths per minute
    // Each respiratory cycle = 2 zero crossings
    const duration = rrIntervals.reduce((a, b) => a + b, 0) / 1000; // seconds
    const respiratoryRate = (zeroCrossings / 2) * (60 / duration);
    
    // Clamp to realistic range
    return Math.max(8, Math.min(30, Math.round(respiratoryRate)));
}

/**
 * Calculate stress index from HRV metrics
 * Uses RMSSD as primary parasympathetic indicator
 */
function calculateStressIndex(rrIntervals, rmssd) {
    const meanRR = rrIntervals.reduce((a, b) => a + b, 0) / rrIntervals.length;
    const hr = 60000 / meanRR;
    
    // Calculate sympathovagal balance proxy
    // Lower RMSSD = higher sympathetic activity = more stress
    // Normal RMSSD ranges: 15-25ms (stressed), 25-50ms (moderate), 50+ (relaxed)
    
    let stressLevel;
    let stressIndex;
    
    // Normalize RMSSD to 0-100 stress scale (inverted)
    // RMSSD of 15 = high stress (100), RMSSD of 80 = low stress (0)
    const normalizedRMSSD = Math.max(15, Math.min(80, rmssd));
    stressIndex = 100 - ((normalizedRMSSD - 15) / 65 * 100);
    
    // Classify stress level
    if (rmssd < 25) {
        stressLevel = 'high';
    } else if (rmssd < 40) {
        stressLevel = 'moderate';
    } else {
        stressLevel = 'low';
    }
    
    return { stressIndex, stressLevel };
}

/**
 * Classify recording duration for HRV analysis validity
 */
function classifyRecording(numIntervals) {
    // Rough estimation: 60 BPM = 60 intervals per minute
    if (numIntervals < 30) {
        return 'ultra-short';  // < 30 seconds
    } else if (numIntervals < 150) {
        return 'short-term';   // 30 seconds - 2.5 minutes
    } else {
        return 'standard';     // > 2.5 minutes
    }
}

/**
 * Get full data including RR intervals and respiratory details
 */
function getFullData() {
    const validRR = rrIntervals.filter(rr => rr >= MIN_RR_MS && rr <= MAX_RR_MS);

    // Respiratory stats
    let breathingRates = [];
    if (validRR.length >= 20) {
        // Sliding window respiratory rate estimation
        const windowSize = 15;
        for (let i = 0; i <= validRR.length - windowSize; i++) {
            const windowRR = validRR.slice(i, i + windowSize);
            const diffs = [];
            for (let j = 1; j < windowRR.length; j++) {
                diffs.push(windowRR[j] - windowRR[j - 1]);
            }
            let zc = 0;
            for (let j = 1; j < diffs.length; j++) {
                if ((diffs[j] > 0 && diffs[j - 1] <= 0) || (diffs[j] < 0 && diffs[j - 1] >= 0)) {
                    zc++;
                }
            }
            const dur = windowRR.reduce((a, b) => a + b, 0) / 1000;
            const rr = (zc / 2) * (60 / dur);
            breathingRates.push(Math.max(8, Math.min(30, rr)));
        }
    }

    const brMean = breathingRates.length > 0
        ? breathingRates.reduce((a, b) => a + b, 0) / breathingRates.length
        : currentMetrics.respiratoryRate;
    const brSd = breathingRates.length > 1
        ? Math.sqrt(breathingRates.reduce((s, v) => s + Math.pow(v - brMean, 2), 0) / breathingRates.length)
        : 0;
    const brCv = brMean > 0 ? brSd / brMean : 0;

    // Count breath cycles from zero crossings
    let breathCycles = 0;
    if (validRR.length >= 2) {
        const diffs = [];
        for (let i = 1; i < validRR.length; i++) {
            diffs.push(validRR[i] - validRR[i - 1]);
        }
        let zc = 0;
        for (let i = 1; i < diffs.length; i++) {
            if ((diffs[i] > 0 && diffs[i - 1] <= 0) || (diffs[i] < 0 && diffs[i - 1] >= 0)) {
                zc++;
            }
        }
        breathCycles = Math.floor(zc / 2);
    }

    let stability = 'stable';
    if (brCv > 0.2) stability = 'variable';
    if (brCv > 0.4) stability = 'irregular';

    return {
        metrics: currentMetrics,
        rr_intervals: validRR.slice(),
        respiratory: {
            breathing_rate_mean: parseFloat(brMean.toFixed(1)),
            breathing_rate_sd: parseFloat(brSd.toFixed(1)),
            breathing_rate_cv: parseFloat(brCv.toFixed(3)),
            stability: stability,
            breath_cycles_detected: breathCycles
        }
    };
}
