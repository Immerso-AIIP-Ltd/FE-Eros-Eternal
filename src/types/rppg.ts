/**
 * rPPG Types - TypeScript interfaces for FacePhys rPPG data
 */

// ============================================
// LEGACY TYPES (kept for backward compatibility)
// ============================================

export interface RppgVitals {
  heartRate: {
    value: number;
    unit: 'BPM';
    status: 'LOW' | 'NORMAL' | 'HIGH';
  };
  signalQuality: {
    value: number;
    percentage: number;
    status: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
  };
  breathingRate: {
    value: number;
    unit: 'breaths/min';
    status: 'LOW' | 'NORMAL' | 'HIGH';
  };
}

export interface RppgFrequencyDomain {
  vlf: number;
  lf: number;
  hf: number;
  tp: number;
  lfHfRatio: number;
}

export interface RppgNonlinear {
  sd1: { value: number; unit: 'ms'; description: string };
  sd2: { value: number; unit: 'ms'; description: string };
  sd1Sd2Ratio: number;
  sampleEntropy: { value: number | null; description: string };
  dfaAlpha1: { value: number | null; reliable: boolean; description: string };
}

export interface RppgRespiratoryExtended {
  breathingRateMean: { value: number; unit: 'breaths/min' };
  breathingRateSd: { value: number; unit: 'breaths/min' };
  breathingRateCv: number;
  stability: 'stable' | 'variable' | 'unstable';
  breathCyclesDetected: number;
}

export interface RppgHrv {
  sdnn: { value: number; unit: 'ms'; status: string };
  rmssd: { value: number; unit: 'ms'; status: string };
  pnn50: { value: number; unit: '%'; status: string };
  pnn20: { value: number; unit: '%'; status: string };
  recordingClass: 'insufficient_data' | 'ultra-short' | 'short-term' | 'standard';
  frequencyDomain?: RppgFrequencyDomain;
  nonlinear?: RppgNonlinear;
  respiratoryExtended?: RppgRespiratoryExtended;
  rrIntervalCount?: number;
}

export interface RppgStress {
  level: 'low' | 'moderate' | 'high' | 'unknown';
  index: number;
  description: string;
  sympathovagalBalance?: number | null;
  components?: { sdnn: number; rmssd: number };
}

export interface RppgMetadata {
  timestamp: string;
  scanDurationSeconds: number;
  samplesCollected: number;
}

export interface RppgMetrics {
  vitals: RppgVitals;
  hrv: RppgHrv;
  stress: RppgStress;
}

export interface HrHistoryPoint {
  time: number;
  hr: number;
  sqi: number;
}

export interface RppgReportData extends RppgMetrics {
  metadata: RppgMetadata;
  hrHistory: HrHistoryPoint[];
  rrIntervals?: number[];
  poincareData?: { x: number; y: number }[];
}

// ============================================
// NEW COMPREHENSIVE TYPES (FacePhys JSON Structure)
// ============================================

/**
 * Scan metadata from FacePhys analysis
 */
export interface ScanMetadata {
  timestamp: string;
  timestamp_iso: string;
  scan_duration_seconds: number;
  model: string;
  version: string;
}

/**
 * Vital sign measurement with value, unit, and status
 */
export interface VitalMeasurement {
  value: number;
  unit: string;
  status: 'LOW' | 'NORMAL' | 'HIGH' | 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
}

/**
 * Signal quality with both decimal and percentage representation
 */
export interface SignalQuality {
  value: number;
  percentage: number;
  status: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
}

/**
 * Complete vitals data structure
 */
export interface VitalsData {
  heart_rate: VitalMeasurement;
  signal_quality: SignalQuality;
  breathing_rate: VitalMeasurement;
}

/**
 * Time domain HRV metrics
 */
export interface TimeDomainHRV {
  sdnn: VitalMeasurement;
  rmssd: VitalMeasurement;
  pnn50: VitalMeasurement;
  pnn20: VitalMeasurement;
}

/**
 * Non-linear HRV metrics (for future expansion)
 */
export interface NonlinearHRV {
  sd1?: VitalMeasurement;
  sd2?: VitalMeasurement;
  sd1_sd2_ratio?: number;
}

/**
 * Respiratory analysis from HRV data
 */
export interface RespiratoryHRV {
  breathing_rate_mean: {
    value: number;
    unit: 'breaths/min';
  };
  breathing_rate_sd: {
    value: number;
    unit: 'breaths/min';
  };
  breathing_rate_cv: number;
  stability: 'stable' | 'variable' | 'unstable';
  breath_cycles_detected: number;
}

/**
 * RR intervals data
 */
export interface RRIntervals {
  count: number;
  values: number[];
  unit: 'seconds' | 'ms';
}

/**
 * Complete HRV data structure
 */
export interface HRVData {
  time_domain: TimeDomainHRV;
  nonlinear: NonlinearHRV;
  respiratory: RespiratoryHRV;
  rr_intervals: RRIntervals;
}

/**
 * Sympathovagal balance measurement
 */
export interface SympathovagalBalance {
  value: number;
  description: string;
}

/**
 * Stress analysis components
 */
export interface StressComponents {
  sdnn: number;
  rmssd: number;
}

/**
 * Complete stress analysis structure
 */
export interface StressAnalysis {
  sympathovagal_balance: SympathovagalBalance;
  stress_level: 'low' | 'moderate' | 'high' | 'unknown';
  stress_description: string;
  components: StressComponents;
}

/**
 * Ultra-short HRV recording metrics
 */
export interface UltraShortHRV {
  sdnn: number;
  rmssd: number;
  pnn50: number;
  recording_class: 'ultra-short' | 'short-term' | 'standard' | 'insufficient_data';
}

/**
 * Advanced metrics collection
 */
export interface AdvancedMetrics {
  ultra_short_hrv: UltraShortHRV;
}

/**
 * AI-generated health report
 */
export interface AIHealthReport {
  generated_at: string;
  report_text: string;
  disclaimer: string;
}

/**
 * Complete FacePhys report data structure
 */
export interface CompleteReportData {
  metadata: ScanMetadata;
  vitals: VitalsData;
  hrv: HRVData;
  stress_analysis: StressAnalysis;
  advanced_metrics: AdvancedMetrics;
  ai_health_report: AIHealthReport;
}

// ============================================
// UPDATED COMBINED REPORT DATA
// ============================================

/**
 * Combined report data including FacePhys rPPG results
 * Uses the new comprehensive types
 */
export interface CombinedReportData {
  success: boolean;
  uploadedImage: string;
  data: {
    face_analysis_text: string;
    spiritual_interpretation: string;
  };
  rppg: RppgReportData;
  /** Full FacePhys report data (new comprehensive structure) */
  facephysReport?: CompleteReportData;
  /** AI-generated health report from OpenAI */
  aiReport?: {
    summary: string;
    insights: string[];
    recommendations: string[];
    riskFactors: string[];
    disclaimer: string;
  };
  /** Per-section GPT insights (legacy payloads may include optional frequencyDomain; UI omits spectral bands.) */
  sectionInsights?: {
    timeDomain: string;
    nonlinear: string;
    stressRespiratory: string;
    frequencyDomain?: string;
  };
  /** Health data from backend API (merged after scan) */
  apiHealthData?: {
    heart_rate: number;
    bp_systolic: number;
    bp_diastolic: number;
    scan_duration_seconds: number;
  };
}

// ============================================
// WORKER MESSAGE TYPES
// ============================================

export interface InferenceWorkerMessage {
  type: 'init' | 'run' | 'result' | 'error' | 'initDone';
  payload?: {
    imgData?: Float32Array;
    dtVal?: number;
    timestamp?: number;
    value?: number;
    step?: number;
    time?: number;
    projOutput?: Record<string, Float32Array>;
  };
  msg?: string;
}

export interface PsdWorkerMessage {
  type: 'init' | 'run' | 'result' | 'error' | 'initDone';
  payload?: {
    inputData?: Float32Array;
    sqi?: number;
    hr?: number;
    freq?: number[];
    psd?: number[];
    peak?: number;
    time?: number;
  };
  msg?: string;
}

export interface HrvWorkerMessage {
  type: 'init' | 'hr_data' | 'reset' | 'get_metrics' | 'get_full_data' | 'metrics' | 'full_data' | 'initDone';
  payload?: {
    hr?: number;
    timestamp?: number;
    sqi?: number;
    isValid?: boolean;
    sdnn?: number;
    rmssd?: number;
    pnn50?: number;
    sd1?: number;
    sd2?: number;
    respiratoryRate?: number;
    stressLevel?: 'low' | 'moderate' | 'high' | 'unknown';
    stressIndex?: number;
    recordingClass?: 'insufficient_data' | 'ultra-short' | 'short-term' | 'standard';
    rrIntervals?: number[];
  };
}
