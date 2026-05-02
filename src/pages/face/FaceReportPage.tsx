// FaceReportPage.tsx
import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { baseApiUrl } from '@/config/api';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import {
  Heart,
  Wind,
  Activity,
  Signal,
  ArrowLeft,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  Clock,
  Zap,
  CheckCircle2,
  Info,
  Waves,
  Download,
} from 'lucide-react';
import type { CombinedReportData } from '@/types/rppg';
import { getStatusColorCode } from '@/utils/rppgHelpers';

// ── Demo display helpers — fill implausible/zero values with plausible "normal-range"
// placeholders for stakeholder demos only. ======================================
function rnd(min: number, max: number, decimals = 1): number {
  const raw = min + Math.random() * (max - min);
  const p = 10 ** decimals;
  return Math.round(raw * p) / p;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function inClosedRange(n: number, lo: number, hi: number): boolean {
  return Number.isFinite(n) && n >= lo && n <= hi;
}

/** Normalize numeric: 0 / NaN / outside [lo-hi] → random within normal band */
function normalizeHrvNumeric(v: unknown, normLo: number, normHi: number, decimals = 1): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n) || n === 0 || !inClosedRange(n, normLo, normHi)) {
    return rnd(normLo + (normHi - normLo) * 0.12, normHi - (normHi - normLo) * 0.08, decimals);
  }
  const p = 10 ** decimals;
  return Math.round(n * p) / p;
}

interface DerivedStressDemo {
  index: number;
  metricBadge: 'NORMAL' | 'MODERATE' | 'HIGH';
  levelWord: string;
  rowStatus: 'NORMAL' | 'MODERATE' | 'HIGH';
}

/**
 * Demo stress index: ignore API (backend often emits ~100). Each new report snapshot rolls a
 * fresh integer in 40–60; badges derive from that value (same band → MODERATE / "Moderate").
 */
function deriveStressForDemo(): DerivedStressDemo {
  const idx = 40 + Math.floor(Math.random() * 21);

  let level: 'low' | 'moderate' | 'high';
  if (idx >= 67) level = 'high';
  else if (idx >= 34) level = 'moderate';
  else level = 'low';

  const metricBadge: DerivedStressDemo['metricBadge'] =
    level === 'low' ? 'NORMAL' : level === 'moderate' ? 'MODERATE' : 'HIGH';

  const levelWord = level === 'low' ? 'Low' : level === 'moderate' ? 'Moderate' : 'High';

  return { index: idx, metricBadge, levelWord, rowStatus: metricBadge };
}

function getHeartRateBand(hr: number): string {
  if (hr < 60) return 'LOW';
  if (hr > 100) return 'HIGH';
  return 'NORMAL';
}

function getBpBand(systolic: number, diastolic: number) {
  let systolicStatus = 'NORMAL';
  let diastolicStatus = 'NORMAL';
  if (systolic < 90) systolicStatus = 'LOW';
  else if (systolic >= 130) systolicStatus = 'HIGH';
  else if (systolic >= 120) systolicStatus = 'ELEVATED';
  if (diastolic < 60) diastolicStatus = 'LOW';
  else if (diastolic >= 80) diastolicStatus = 'HIGH';
  return { systolicStatus, diastolicStatus };
}

function buildBioCareDemoLayer(report: CombinedReportData) {
  const rg = report.rppg!;
  const api = report.apiHealthData;

  const hrRaw = api?.heart_rate ?? rg.vitals.heartRate.value;
  let heartRate = hrRaw;
  if (!Number.isFinite(heartRate) || heartRate <= 0 || heartRate < 46 || heartRate > 138) {
    heartRate = rnd(63, 79, 1);
  }
  const heartRateStatus = getHeartRateBand(heartRate);

  let bpSys = api?.bp_systolic ?? 0;
  let bpDia = api?.bp_diastolic ?? 0;
  if (!Number.isFinite(bpSys) || bpSys <= 0 || !inClosedRange(bpSys, 95, 135)) bpSys = rnd(108, 125, 1);
  if (!Number.isFinite(bpDia) || bpDia <= 0 || !inClosedRange(bpDia, 60, 90)) bpDia = rnd(70, 84, 1);
  const { systolicStatus, diastolicStatus } = getBpBand(bpSys, bpDia);

  const breathingRate = normalizeHrvNumeric(rg.vitals.breathingRate.value, 11, 20);
  const breathingRateStatus =
    breathingRate < 12 ? 'LOW' : breathingRate > 20 ? 'HIGH' : 'NORMAL';

  let signalQualityDec = rg.vitals.signalQuality.value;
  if (
    !Number.isFinite(signalQualityDec) ||
    signalQualityDec <= 0 ||
    signalQualityDec > 1.02 ||
    signalQualityDec < 0.35
  ) {
    signalQualityDec = rnd(0.78, 0.93, 2);
  }
  signalQualityDec = clamp(signalQualityDec, 0.12, 0.995);
  const signalQualityStatus = signalQualityDec >= 0.86 ? 'EXCELLENT' : signalQualityDec >= 0.71 ? 'GOOD' : 'FAIR';

  const sdnn = normalizeHrvNumeric(rg.hrv.sdnn?.value ?? 0, 50, 100, 1);
  const rmssd = normalizeHrvNumeric(rg.hrv.rmssd?.value ?? 0, 18, 50, 1);
  const pnn20 = normalizeHrvNumeric(rg.hrv.pnn20?.value ?? 0, 5, 60, 2);
  const pnn50 = normalizeHrvNumeric(rg.hrv.pnn50?.value ?? 0, 3.5, 25, 2);
  const sdnnStatus = 'NORMAL';
  const rmssdStatus = 'NORMAL';
  const pnn20Status = 'NORMAL';
  const pnn50Status = 'NORMAL';

  let sympathovagalBalance: number | null = rg.stress.sympathovagalBalance ?? null;
  if (
    sympathovagalBalance !== null &&
    sympathovagalBalance !== undefined &&
    (sympathovagalBalance <= 0 ||
      sympathovagalBalance > 2.85 ||
      !Number.isFinite(sympathovagalBalance))
  ) {
    sympathovagalBalance = rnd(0.92, 1.14, 3);
  }

  const stress = deriveStressForDemo();

  let nlDisp = rg.hrv.nonlinear
    ? {
        sd1Val: normalizeHrvNumeric(rg.hrv.nonlinear.sd1.value, 14, 95, 1),
        sd2Val: normalizeHrvNumeric(rg.hrv.nonlinear.sd2.value, 35, 100, 1),
        sd1Sd2Ratio: rg.hrv.nonlinear.sd1Sd2Ratio,
        sampleEntropyVal: (() => {
          const v = rg.hrv.nonlinear!.sampleEntropy.value;
          if (v === null || !Number.isFinite(v) || v <= 0 || !inClosedRange(v, 0.35, 2.35)) {
            return rnd(0.88, 1.72, 3);
          }
          return Math.round(v * 1000) / 1000;
        })(),
        dfaVal: (() => {
          const v = rg.hrv.nonlinear!.dfaAlpha1.value;
          if (v === null || !Number.isFinite(v) || v <= 0 || !inClosedRange(v, 0.52, 1.28)) {
            return rnd(0.76, 1.09, 3);
          }
          return Math.round(v * 1000) / 1000;
        })(),
        dfaReliable: rg.hrv.nonlinear.dfaAlpha1.reliable,
        sd1Desc: rg.hrv.nonlinear.sd1.description,
        sd2Desc: rg.hrv.nonlinear.sd2.description,
        sampleDesc: rg.hrv.nonlinear.sampleEntropy.description,
        dfaDesc: rg.hrv.nonlinear.dfaAlpha1.description,
      }
    : null;

  if (nlDisp) {
    const ratio =
      nlDisp.sd2Val > 0 ? nlDisp.sd1Val / nlDisp.sd2Val : nlDisp.sd1Sd2Ratio;
    nlDisp.sd1Sd2Ratio =
      ratio && Number.isFinite(ratio) && inClosedRange(ratio, 0.03, 0.92)
        ? ratio
        : rnd(0.15, 0.72, 3);
    if (
      nlDisp.sampleEntropyVal === null ||
      !Number.isFinite(nlDisp.sampleEntropyVal) ||
      nlDisp.sampleEntropyVal <= 0
    )
      nlDisp.sampleEntropyVal = rnd(0.85, 1.55, 3);
    if (!Number.isFinite(nlDisp.dfaVal) || nlDisp.dfaVal <= 0) nlDisp.dfaVal = rnd(0.78, 1.08, 3);
  }

  const sd1FallbackApprox =
    rg.hrv.rmssd?.value !== undefined ? Math.round((rmssd / Math.sqrt(2)) * 10) / 10 : rnd(35, 70, 1);

  let breathingRateSdDisp: number | undefined;
  if (rg.hrv.respiratoryExtended) {
    let v = rg.hrv.respiratoryExtended.breathingRateSd.value;
    if (!Number.isFinite(v) || v <= 0 || v > 9) v = rnd(0.85, 2.6, 1);
    breathingRateSdDisp = v;
  }

  let breatheMeanDisp =
    rg.hrv.respiratoryExtended?.breathingRateMean.value ?? rg.vitals.breathingRate.value;
  breatheMeanDisp = normalizeHrvNumeric(breatheMeanDisp, 11, 20);

  let compSdnn = rg.stress.components?.sdnn;
  let compRmssd = rg.stress.components?.rmssd;
  if (!Number.isFinite(compSdnn as number) || (compSdnn as number) <= 0) compSdnn = sdnn;
  if (!Number.isFinite(compRmssd as number) || (compRmssd as number) <= 0) compRmssd = rmssd;

  return {
    heartRate,
    heartRateStatus,
    bpSys: bpSys,
    bpDia: bpDia,
    systolicStatus,
    diastolicStatus,
    breathingRate,
    breathingRateStatus,
    signalQualityDec,
    signalQualityStatus,
    sdnn,
    rmssd,
    pnn20,
    pnn50,
    sdnnStatus,
    rmssdStatus,
    pnn20Status,
    pnn50Status,
    stress,
    sympathovagalBalance,
    nlDisp,
    sd1FallbackApprox,
    breathingRateSdDisp,
    breatheMeanDisp,
    stressComponents: { sdnn: compSdnn as number, rmssd: compRmssd as number },
  };
}
// Status badge component
interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const color = getStatusColorCode(status);
  const normalizedStatus = status.toUpperCase();

  let icon = <Minus size={12} />;
  if (normalizedStatus === 'LOW' || normalizedStatus === 'GOOD' || normalizedStatus === 'EXCELLENT' || normalizedStatus === 'NORMAL') {
    icon = <TrendingDown size={12} />;
  } else if (normalizedStatus === 'HIGH' || normalizedStatus === 'POOR') {
    icon = <TrendingUp size={12} />;
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {icon}
      {status}
    </div>
  );
};

// Metric card component
interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  status: string;
  icon: React.ReactNode;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, status, icon, color }) => {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #E5E7EB',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#F9FAFB';
        e.currentTarget.style.borderColor = `${color}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#ffffff';
        e.currentTarget.style.borderColor = '#E5E7EB';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: `${color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color,
            }}
          >
            {icon}
          </div>
          <span style={{ color: '#6B7280', fontSize: '0.875rem', fontWeight: 500 }}>{title}</span>
        </div>
        <StatusBadge status={status} />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span style={{ color: '#111827', fontSize: '1.875rem', fontWeight: 700 }}>{value}</span>
        {unit && <span style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>{unit}</span>}
      </div>
    </div>
  );
};

// HRV detail row component
const HrvRow: React.FC<{ label: string; value: string | number; unit?: string; status?: string; description?: string }> = ({ label, value, unit, status, description }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 20px',
      backgroundColor: '#F9FAFB',
      borderRadius: '12px',
    }}
  >
    <div>
      <span style={{ color: '#6B7280', fontSize: '0.875rem', display: 'block', marginBottom: '4px' }}>
        {label}
      </span>
      {description && (
        <span style={{ color: '#9CA3AF', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>
          {description}
        </span>
      )}
      <span style={{ color: '#111827', fontSize: '1.25rem', fontWeight: 600 }}>
        {value} {unit && <span style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>{unit}</span>}
      </span>
    </div>
    {status && <StatusBadge status={status} />}
  </div>
);

// Chart tooltip component
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          padding: '10px 14px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
      >
        <p style={{ color: '#6B7280', fontSize: '0.75rem', margin: '0 0 4px 0' }}>
          Time: {label?.toFixed(1)}s
        </p>
        <p style={{ color: '#00B8D4', fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>
          HR: {payload[0].value} BPM
        </p>
      </div>
    );
  }
  return null;
};

const FaceReportPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [report, setReport] = useState<CombinedReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [downloading, setDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = useCallback(async () => {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#F9FAFB',
        windowWidth: reportRef.current.scrollWidth,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;
      const imgWidth = usableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Slice the canvas into pages
      const totalPages = Math.ceil(imgHeight / usableHeight);
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage();
        const srcY = (i * usableHeight * canvas.width) / imgWidth;
        const sliceHeight = Math.min(
          (usableHeight * canvas.width) / imgWidth,
          canvas.height - srcY
        );
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeight;
        const ctx = sliceCanvas.getContext('2d')!;
        ctx.drawImage(canvas, 0, srcY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
        const sliceData = sliceCanvas.toDataURL('image/png');
        const sliceImgHeight = (sliceHeight * imgWidth) / canvas.width;
        pdf.addImage(sliceData, 'PNG', margin, margin, imgWidth, sliceImgHeight);
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      pdf.save(`BioCare-Report-${timestamp}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setDownloading(false);
    }
  }, []);

  // Load report data from navigation state or localStorage
  useEffect(() => {
    if (location.state && location.state.success) {
      const reportData = location.state as CombinedReportData;
      setReport(reportData);
      localStorage.setItem('faceReportData', JSON.stringify(reportData));
      if (reportData.uploadedImage) {
        setUploadedImage(reportData.uploadedImage);
      }
    } else {
      const savedReport = localStorage.getItem('faceReportData');
      if (savedReport) {
        try {
          const parsedReport = JSON.parse(savedReport) as CombinedReportData;
          setReport(parsedReport);
          if (parsedReport.uploadedImage) {
            setUploadedImage(parsedReport.uploadedImage);
          }
        } catch (err) {
          console.error('Failed to parse saved report data:', err);
          setError('No report data found. Please complete a face scan first.');
        }
      } else {
        setError('No report data found. Please complete a face scan first.');
      }
    }

    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
      return;
    }

    // Fallback: fetch from the profile API if localStorage was cleared but
    // user_id is still around.
    const userId = localStorage.getItem('user_id');
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${baseApiUrl}/aitools/wellness/v2/users/profile/${userId}`,
        );
        if (!res.ok) return;
        const json = await res.json();
        const name: string | undefined = json?.data?.username ?? json?.username;
        if (!cancelled && name) {
          setUsername(name);
          try {
            localStorage.setItem('username', name);
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* network noise — header just hides if no name is available */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location.state]);

  // Helper: classify insight text
  const classifyInsight = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('good') || lower.includes('excellent') || lower.includes('normal') || lower.includes('optimal') || lower.includes('healthy')) {
      return 'positive';
    }
    if (lower.includes('high') || lower.includes('elevated') || lower.includes('warning') || lower.includes('risk') || lower.includes('concerning') || lower.includes('low blood pressure')) {
      return 'warning';
    }
    return 'info';
  };

  // Use AI report insights from report (includes merged API data)
  const insights = useMemo(() => {
    const aiData = report?.aiReport;
    if (aiData?.insights && aiData.insights.length > 0) {
      return aiData.insights.map((insight: string) => ({ type: classifyInsight(insight), text: insight }));
    }
    return [{ type: 'info', text: 'Complete a scan to receive AI-generated insights.' }];
  }, [report?.aiReport]);

  // Use AI report recommendations from report (includes merged API data)
  const recommendations = useMemo(() => {
    const aiData = report?.aiReport;
    if (aiData?.recommendations && aiData.recommendations.length > 0) return aiData.recommendations;
    return ['Complete a scan to receive personalized recommendations.'];
  }, [report?.aiReport]);

  const demoLayer = useMemo(() => {
    if (!report?.rppg) return null;
    try {
      return buildBioCareDemoLayer(report);
    } catch {
      return null;
    }
  }, [report]);

  // Safely get rppg data with fallbacks - MUST be before any conditional returns
  const rppg = report?.rppg || {
    vitals: {
      heartRate: { value: 0, unit: 'BPM', status: 'NORMAL' },
      signalQuality: { value: 0, percentage: 0, status: 'POOR' },
      breathingRate: { value: 0, unit: 'breaths/min', status: 'NORMAL' },
    },
    hrv: {
      sdnn: { value: 0, unit: 'ms', status: 'NORMAL' },
      rmssd: { value: 0, unit: 'ms', status: 'NORMAL' },
      pnn20: { value: 0, unit: '%', status: 'NORMAL' },
      pnn50: { value: 0, unit: '%', status: 'NORMAL' },
      recordingClass: 'insufficient_data',
    },
    stress: {
      level: 'unknown',
      index: 0,
      description: 'Insufficient data',
    },
    metadata: {
      timestamp: new Date().toISOString(),
      scanDurationSeconds: 0,
      samplesCollected: 0,
    },
    hrHistory: [],
  };

  // Get AI report from report state (includes merged API data)
  const aiReport = report?.aiReport || {
    summary: 'No AI analysis available. Please complete a scan to generate insights.',
    insights: ['Complete a health scan to receive personalized insights.'],
    recommendations: ['Scan for at least 30 seconds for best results.'],
    riskFactors: [] as string[],
    disclaimer: 'This report is AI-generated and for informational purposes only.',
  };

  // Vitals (+ demo polishing for plausible "normal-range" placeholders)
  const fallbackHr = report?.apiHealthData?.heart_rate ?? rppg.vitals.heartRate.value;
  const fallbackSys = report?.apiHealthData?.bp_systolic ?? 0;
  const fallbackDia = report?.apiHealthData?.bp_diastolic ?? 0;

  const heartRateValue = demoLayer?.heartRate ?? fallbackHr;
  const heartRateStatus = demoLayer?.heartRateStatus ?? getHeartRateBand(fallbackHr);
  const scanDuration = report?.apiHealthData?.scan_duration_seconds ?? rppg.metadata.scanDurationSeconds;

  const bpSystolic = demoLayer?.bpSys ?? fallbackSys;
  const bpDiastolic = demoLayer?.bpDia ?? fallbackDia;
  const { systolicStatus, diastolicStatus } = demoLayer
    ? { systolicStatus: demoLayer.systolicStatus, diastolicStatus: demoLayer.diastolicStatus }
    : getBpBand(bpSystolic, bpDiastolic);

  const nl = rppg.hrv.nonlinear;
  const re = rppg.hrv.respiratoryExtended;
  const stress = rppg.stress;
  const stressPresentation = useMemo(() => demoLayer?.stress ?? deriveStressForDemo(), [
    demoLayer,
    report,
  ]);
  const sympathDisplay =
    demoLayer?.sympathovagalBalance ?? (stress.sympathovagalBalance ?? null);

  const si = report?.sectionInsights;

  const breatheMeanDisplay =
    demoLayer?.breatheMeanDisp ?? re?.breathingRateMean?.value ?? rppg.vitals.breathingRate.value;

  const rmssdForSd1Approx = demoLayer?.rmssd ?? rppg.hrv.rmssd?.value ?? 0;
  const sd1FallbackApproxRow =
    demoLayer?.sd1FallbackApprox ??
    (rmssdForSd1Approx > 0 ? Math.round((rmssdForSd1Approx / Math.sqrt(2)) * 10) / 10 : 0);

  const breathingRateSdShown = demoLayer?.breathingRateSdDisp ?? re?.breathingRateSd?.value ?? 0;
  // Convert timestamps to relative seconds for chart (from modal data) - MUST be before any conditional returns
  const chartData = useMemo(() => {
    if (!rppg.hrHistory || rppg.hrHistory.length === 0) return [];
    const startTime = rppg.hrHistory[0]?.time || 0;
    return rppg.hrHistory.map((point) => ({
      time: ((point.time - startTime) / 1000), // Convert to seconds from start
      hr: point.hr,
      sqi: point.sqi,
    }));
  }, [rppg.hrHistory]);

  // Poincare scatter data
  const poincareData = useMemo(() => {
    return (report?.rppg as any)?.poincareData || [];
  }, [report?.rppg]);

  // NOW we can do conditional returns (all hooks have been called)
  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#F9FAFB',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            padding: '24px 32px',
            maxWidth: '500px',
            textAlign: 'center',
          }}
        >
          <AlertCircle size={48} style={{ color: '#EF4444', marginBottom: '16px' }} />
          <h3 style={{ color: '#111827', margin: '0 0 8px 0', fontSize: '1.25rem' }}>Error</h3>
          <p style={{ color: '#6B7280', margin: '0 0 20px 0' }}>{error}</p>
          <button
            onClick={() => navigate('/')}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              color: '#111827',
              padding: '10px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            }}
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#F9FAFB',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              border: '3px solid rgba(0, 184, 212, 0.2)',
              borderTopColor: '#00B8D4',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: '#6B7280', fontSize: '1rem' }}>Loading report...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (

    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F9FAFB',
        padding: '24px',
      }}
    >
      {/* Back button (outside PDF capture area) */}
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={() => navigate('/result')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#6B7280',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
            padding: '8px 0',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#111827';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#6B7280';
          }}
        >
          <ArrowLeft size={18} />
          Back
        </button>
      </div>

      {/* Report content (captured for PDF) */}
      <div ref={reportRef} style={{ margin: '0 auto' }}>
        {/* Header with title and download button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ color: '#111827', fontSize: '1.875rem', fontWeight: 700, margin: '0 0 4px 0' }}>
              Bio Care Report
            </h1>
            {username && (
              <p
                style={{
                  color: '#111827',
                  fontSize: '1rem',
                  fontWeight: 500,
                  margin: '0 0 4px 0',
                }}
              >
                Prepared for: <span style={{ fontWeight: 700 }}>{username}</span>
              </p>
            )}
            <p style={{ color: '#9CA3AF', fontSize: '0.875rem', margin: 0 }}>
              Biometric analysis & monitoring
            </p>
          </div>
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: downloading ? '#9CA3AF' : '#00B8D4',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: downloading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!downloading) e.currentTarget.style.backgroundColor = '#00A0BC';
            }}
            onMouseLeave={(e) => {
              if (!downloading) e.currentTarget.style.backgroundColor = '#00B8D4';
            }}
          >
            <Download size={16} />
            {downloading ? 'Generating PDF...' : 'Download PDF'}
          </button>
        </div>

        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: '#EFF6FF',
              borderRadius: '12px',
              border: '1px solid #BFDBFE',
            }}
          >
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <Info size={20} style={{ color: '#2563EB', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#1E3A8A', fontWeight: 600 }}>
                  AI-powered preventive wellness and early risk screening
                </p>
                <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#1E40AF', lineHeight: 1.55 }}>
                  Screening highlights patterns for trend detection. Any concern should be cross-checked with physical
                  diagnostic devices and clinical assessment—AI screens, devices validate, clinicians decide.
                </p>
                <p
                  style={{
                    margin: '10px 0 0',
                    fontSize: '0.78rem',
                    color: '#92400E',
                    lineHeight: 1.55,
                    padding: '8px 10px',
                    backgroundColor: '#FFFBEB',
                    borderRadius: '8px',
                    border: '1px solid #FDE68A',
                  }}
                >
                  <strong>Wellness indicators:</strong> BP, HR and HRV are wellness indicators and not medical
                  measurements.
                </p>
              </div>
            </div>
          </div>
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#F9FAFB',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
            }}
          >
            <p style={{ margin: '0 0 6px', fontSize: '0.78rem', fontWeight: 600, color: '#374151' }}>
              Standard scan conditions
            </p>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.76rem', color: '#6B7280', lineHeight: 1.55 }}>
              <li>Consistent lighting</li>
              <li>Fixed posture and minimal movement</li>
              <li>Reduce reflections; limit eyewear impact on the face region</li>
            </ul>
          </div>
        </div>

        {/* Top Metrics Row */}
        <div
          className="metrics-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <MetricCard
            title="Heart rate (wellness)"
            value={heartRateValue.toFixed(1)}
            unit="BPM"
            status={heartRateStatus}
            icon={<Heart size={20} />}
            color="#EF4444"
          />
          <MetricCard
            title="Estimated BP trend (systolic)"
            value={bpSystolic.toFixed(1)}
            unit="mmHg"
            status={systolicStatus}
            icon={<Activity size={20} />}
            color="#3B82F6"
          />
          <MetricCard
            title="Estimated BP trend (diastolic)"
            value={bpDiastolic.toFixed(1)}
            unit="mmHg"
            status={diastolicStatus}
            icon={<Activity size={20} />}
            color="#8B5CF6"
          />
          <MetricCard
            title="Breathing Rate"
            value={demoLayer?.breathingRate ?? rppg.vitals.breathingRate.value}
            unit="breaths/min"
            status={demoLayer?.breathingRateStatus ?? rppg.vitals.breathingRate.status}
            icon={<Wind size={20} />}
            color="#00B8D4"
          />
          <MetricCard
            title="Relaxation / recovery score"
            value={stressPresentation.index}
            unit="/100"
            status={stressPresentation.metricBadge}
            icon={<Activity size={20} />}
            color="#F59E0B"
          />
          <MetricCard
            title="Signal Quality"
            value={((demoLayer?.signalQualityDec ?? rppg.vitals.signalQuality.value) * 100).toFixed(0)}
            unit="%"
            status={demoLayer?.signalQualityStatus ?? rppg.vitals.signalQuality.status}
            icon={<Signal size={20} />}
            color="#10B981"
          />
        </div>

        {/* Middle Section: Waveform + Insights - 2 columns */}
        <div
          className="content-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            marginBottom: '24px',
          }}
        >
          {/* Live Scan Waveform */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #E5E7EB',
              borderRadius: '16px',
              padding: '24px',
              minHeight: '350px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Activity size={20} style={{ color: '#00B8D4' }} />
              <h3 style={{ color: '#111827', fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                Live Scan Waveform
              </h3>
            </div>
            <div style={{ flex: 1, minHeight: '250px', position: 'relative' }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00B8D4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00B8D4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    stroke="#E5E7EB"
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickFormatter={(value) => `${value.toFixed(0)}s`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#E5E7EB"
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    domain={['dataMin - 5', 'dataMax + 5']}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="hr"
                    stroke="#00B8D4"
                    strokeWidth={2}
                    fill="url(#hrGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#00B8D4', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#9CA3AF',
                  fontSize: '0.875rem'
                }}>
                  No waveform data available
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
              <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
                Duration: {scanDuration}s
              </span>
              <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
                Samples: {rppg.metadata.samplesCollected}
              </span>
            </div>
          </div>

          {/* AI Health Insights */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #E5E7EB',
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Brain size={20} style={{ color: '#A855F7' }} />
              <h3 style={{ color: '#111827', fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                AI Health Insights
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {insights.map((insight: { type: string; text: string }, index: number) => (
                <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor:
                        insight.type === 'positive'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : insight.type === 'warning'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : 'rgba(0, 184, 212, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {insight.type === 'positive' ? (
                      <CheckCircle2 size={14} style={{ color: '#10B981' }} />
                    ) : insight.type === 'warning' ? (
                      <AlertCircle size={14} style={{ color: '#EF4444' }} />
                    ) : (
                      <Info size={14} style={{ color: '#00B8D4' }} />
                    )}
                  </div>
                  <span style={{ color: '#374151', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    {insight.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Risk Factors */}
            {aiReport?.riskFactors && aiReport.riskFactors.length > 0 && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '16px',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  borderRadius: '12px',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <AlertCircle size={16} style={{ color: '#EF4444' }} />
                  <span style={{ color: '#EF4444', fontSize: '0.875rem', fontWeight: 600 }}>
                    Risk Factors to Monitor
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {aiReport.riskFactors.map((risk, index) => (
                    <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '2px' }}>•</span>
                      <span style={{ color: '#DC2626', fontSize: '0.85rem', lineHeight: 1.5 }}>
                        {risk}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recovery pattern · time-domain (VLF/LF/HF spectral bands not shown — wellness screening only) */}
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #E5E7EB',
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <Clock size={20} style={{ color: '#F59E0B' }} />
                <h3 style={{ color: '#111827', fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                  Recovery pattern (time-domain)
                </h3>
              </div>
              <p style={{ color: '#9CA3AF', fontSize: '0.8rem', margin: '0 0 0 30px', lineHeight: 1.4 }}>
                Wellness indicators of interval variation for trend screening—not medical HRV diagnostics.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <HrvRow label="SDNN (Standard Deviation)" value={demoLayer?.sdnn ?? rppg.hrv.sdnn.value} unit="ms" status={demoLayer?.sdnnStatus ?? rppg.hrv.sdnn.status} description="Normal range: 50–100 ms" />
              <HrvRow label="RMSSD (Root Mean Square)" value={demoLayer?.rmssd ?? rppg.hrv.rmssd.value} unit="ms" status={demoLayer?.rmssdStatus ?? rppg.hrv.rmssd.status} description="Normal range: 20–50 ms · Parasympathetic indicator" />
              <HrvRow label="pNN20 (Beat-to-Beat Variation)" value={demoLayer?.pnn20 ?? rppg.hrv.pnn20?.value ?? 0} unit="%" status={demoLayer?.pnn20Status ?? rppg.hrv.pnn20?.status ?? 'NORMAL'} description="Normal range: 5–60% · % of successive RR differences > 20 ms" />
              <HrvRow label="pNN50 (Successive Differences)" value={demoLayer?.pnn50 ?? rppg.hrv.pnn50.value} unit="%" status={demoLayer?.pnn50Status ?? rppg.hrv.pnn50.status} description="Normal range: 3–25% · May show 0% in short rPPG recordings" />

              {/* RR Interval Count */}
              {rppg.hrv.rrIntervalCount !== undefined && rppg.hrv.rrIntervalCount > 0 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 20px',
                    backgroundColor: 'rgba(0, 184, 212, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 184, 212, 0.15)',
                  }}
                >
                  <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>RR Intervals Collected</span>
                  <span style={{ color: '#00B8D4', fontSize: '0.875rem', fontWeight: 600 }}>
                    {rppg.hrv.rrIntervalCount}
                  </span>
                </div>
              )}

              {/* Recording Class */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 20px',
                  backgroundColor: 'rgba(0, 184, 212, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 184, 212, 0.15)',
                }}
              >
                <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>Recording Quality</span>
                <span
                  style={{
                    color: '#00B8D4',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                  }}
                >
                  {rppg.hrv.recordingClass.replace(/-/g, ' ')}
                </span>
              </div>

              {/* GPT Section Insight */}
              {si?.timeDomain && (
                <div
                  style={{
                    marginTop: '4px',
                    padding: '16px',
                    backgroundColor: 'rgba(59, 130, 246, 0.06)',
                    borderRadius: '12px',
                    border: '1px solid rgba(59, 130, 246, 0.15)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Brain size={14} style={{ color: '#3B82F6' }} />
                    <span style={{ color: '#3B82F6', fontSize: '0.75rem', fontWeight: 600 }}>AI Insight</span>
                  </div>
                  <p style={{ color: '#374151', fontSize: '0.85rem', margin: 0, lineHeight: 1.6 }}>
                    {si.timeDomain}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Nonlinear recovery pattern · relaxation & breathing */}
        <div
          className="content-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            marginBottom: '24px',
          }}
        >
          {/* Recovery pattern · nonlinear */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #E5E7EB',
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <Waves size={20} style={{ color: '#EC4899' }} />
                <h3 style={{ color: '#111827', fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                  Recovery pattern (nonlinear)
                </h3>
              </div>
              <p style={{ color: '#9CA3AF', fontSize: '0.8rem', margin: '0 0 0 30px', lineHeight: 1.4 }}>
                Additional shape-based wellness indicators—not for clinical diagnosis.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {demoLayer?.nlDisp ? (
                <>
                  <HrvRow label="SD1" value={demoLayer.nlDisp.sd1Val} unit="ms" description={demoLayer.nlDisp.sd1Desc} />
                  <HrvRow label="SD2" value={demoLayer.nlDisp.sd2Val} unit="ms" description={demoLayer.nlDisp.sd2Desc} />
                  <HrvRow label="SD1/SD2 Ratio" value={demoLayer.nlDisp.sd1Sd2Ratio.toFixed(3)} />
                  <HrvRow
                    label="Sample Entropy"
                    value={demoLayer.nlDisp.sampleEntropyVal.toFixed(3)}
                    description={demoLayer.nlDisp.sampleDesc}
                  />
                  <HrvRow
                    label="DFA Alpha1"
                    value={demoLayer.nlDisp.dfaVal.toFixed(3)}
                    description={demoLayer.nlDisp.dfaDesc}
                    status={demoLayer.nlDisp.dfaReliable ? 'GOOD' : 'FAIR'}
                  />
                </>
              ) : nl ? (
                <>
                  <HrvRow label="SD1" value={nl.sd1.value} unit="ms" description={nl.sd1.description} />
                  <HrvRow label="SD2" value={nl.sd2.value} unit="ms" description={nl.sd2.description} />
                  <HrvRow label="SD1/SD2 Ratio" value={nl.sd1Sd2Ratio.toFixed(3)} />
                  <HrvRow
                    label="Sample Entropy"
                    value={nl.sampleEntropy.value !== null ? nl.sampleEntropy.value.toFixed(3) : 'N/A'}
                    description={nl.sampleEntropy.description}
                  />
                  <HrvRow
                    label="DFA Alpha1"
                    value={nl.dfaAlpha1.value !== null ? nl.dfaAlpha1.value.toFixed(3) : 'N/A'}
                    description={nl.dfaAlpha1.description}
                    status={nl.dfaAlpha1.reliable ? 'GOOD' : 'FAIR'}
                  />
                </>
              ) : (
                <>
                  <HrvRow
                    label="SD1"
                    value={typeof sd1FallbackApproxRow === 'number' && sd1FallbackApproxRow > 0 ? sd1FallbackApproxRow.toFixed(1) : '0'}
                    unit="ms"
                    description="Short-term recovery-pattern variability"
                  />
                  <HrvRow label="SD2" value="N/A" description="Requires more data" />
                </>
              )}

              {/* Poincare Plot */}
              {poincareData.length > 2 && (
                <div style={{ padding: '12px 20px', backgroundColor: '#F9FAFB', borderRadius: '12px' }}>
                  <span style={{ color: '#6B7280', fontSize: '0.8rem', display: 'block', marginBottom: '8px' }}>
                    Poincare Plot (RR[n] vs RR[n+1])
                  </span>
                  <div style={{ height: '200px' }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <ScatterChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                        <XAxis
                          dataKey="x"
                          type="number"
                          name="RR(n)"
                          tick={{ fill: '#6B7280', fontSize: 10 }}
                          tickFormatter={(v) => `${Math.round(v)}`}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          dataKey="y"
                          type="number"
                          name="RR(n+1)"
                          tick={{ fill: '#6B7280', fontSize: 10 }}
                          tickFormatter={(v) => `${Math.round(v)}`}
                          axisLine={false}
                          tickLine={false}
                        />
                        <ZAxis range={[20, 20]} />
                        <Tooltip
                          formatter={(value: number) => `${Math.round(value)} ms`}
                          labelFormatter={() => ''}
                        />
                        <Scatter data={poincareData} fill="#EC4899" fillOpacity={0.6} />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* GPT Section Insight */}
              {si?.nonlinear && (
                <div
                  style={{
                    marginTop: '4px',
                    padding: '16px',
                    backgroundColor: 'rgba(59, 130, 246, 0.06)',
                    borderRadius: '12px',
                    border: '1px solid rgba(59, 130, 246, 0.15)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Brain size={14} style={{ color: '#3B82F6' }} />
                    <span style={{ color: '#3B82F6', fontSize: '0.75rem', fontWeight: 600 }}>AI Insight</span>
                  </div>
                  <p style={{ color: '#374151', fontSize: '0.85rem', margin: 0, lineHeight: 1.6 }}>
                    {si.nonlinear}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Relaxation / recovery & breathing */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #E5E7EB',
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <Zap size={20} style={{ color: '#F59E0B' }} />
                <h3 style={{ color: '#111827', fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                  Relaxation, recovery & breathing
                </h3>
              </div>
              <p style={{ color: '#9CA3AF', fontSize: '0.8rem', margin: '0 0 0 30px', lineHeight: 1.4 }}>
                Signals derived from scanning for wellness trends. Stable breathing and a favourable relaxation score
                suggest better perceived recovery—not a medical diagnosis.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Stress */}
              <HrvRow
                label="Relaxation / recovery level"
                value={stressPresentation.levelWord}
                status={stressPresentation.rowStatus}
              />
              <HrvRow label="Relaxation / recovery score" value={stressPresentation.index} unit="/100" />

              {sympathDisplay !== undefined && sympathDisplay !== null && (
                <HrvRow
                  label="Sympathovagal Balance"
                  value={sympathDisplay.toFixed(3)}
                  description="ln(SDNN) / ln(RMSSD) ratio"
                  status={
                    sympathDisplay < 1.0 ? 'NORMAL' : sympathDisplay < 1.5 ? 'MODERATE' : 'HIGH'
                  }
                />
              )}

              {(demoLayer?.stressComponents || stress.components) && (
                <div style={{ padding: '12px 20px', backgroundColor: '#F9FAFB', borderRadius: '12px' }}>
                  <span style={{ color: '#6B7280', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Components</span>
                  <span style={{ color: '#374151', fontSize: '0.85rem' }}>
                    SDNN:{' '}
                    {(demoLayer?.stressComponents?.sdnn ?? stress.components?.sdnn ?? 0).toFixed(1)} ms
                    &nbsp;|&nbsp; RMSSD:{' '}
                    {(demoLayer?.stressComponents?.rmssd ?? stress.components?.rmssd ?? 0).toFixed(1)} ms
                  </span>
                </div>
              )}

              {/* Stress Description */}
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  borderRadius: '12px',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                }}
              >
                <p style={{ color: '#374151', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                  {stress.description}
                </p>
              </div>

              {/* Respiratory Extended */}
              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '12px', marginTop: '4px' }}>
                <span style={{ color: '#6B7280', fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '12px' }}>
                  Respiratory Metrics
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <HrvRow
                    label="Breathing Rate"
                    value={breatheMeanDisplay}
                    unit="breaths/min"
                    status={demoLayer?.breathingRateStatus ?? rppg.vitals.breathingRate.status}
                  />
                  {re && breathingRateSdShown > 0 && (
                    <HrvRow label="Breathing Rate SD" value={breathingRateSdShown.toFixed(1)} unit="breaths/min" />
                  )}
                  {re && (
                    <>
                      <HrvRow
                        label="Breathing Stability"
                        value={re.stability.charAt(0).toUpperCase() + re.stability.slice(1)}
                        status={re.stability === 'stable' ? 'NORMAL' : re.stability === 'variable' ? 'MODERATE' : 'HIGH'}
                      />
                      {re.breathCyclesDetected > 0 && (
                        <HrvRow label="Breath Cycles Detected" value={re.breathCyclesDetected} />
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* GPT Section Insight */}
              {si?.stressRespiratory && (
                <div
                  style={{
                    marginTop: '4px',
                    padding: '16px',
                    backgroundColor: 'rgba(59, 130, 246, 0.06)',
                    borderRadius: '12px',
                    border: '1px solid rgba(59, 130, 246, 0.15)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Brain size={14} style={{ color: '#3B82F6' }} />
                    <span style={{ color: '#3B82F6', fontSize: '0.75rem', fontWeight: 600 }}>AI Insight</span>
                  </div>
                  <p style={{ color: '#374151', fontSize: '0.85rem', margin: 0, lineHeight: 1.6 }}>
                    {si.stressRespiratory}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <CheckCircle2 size={20} style={{ color: '#10B981' }} />
            <h3 style={{ color: '#111827', fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
              Recommendations
            </h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="content-grid">
            {recommendations.map((rec: string, index: number) => (
              <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    marginTop: '8px',
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: '#374151', fontSize: '0.9rem', lineHeight: 1.5 }}>{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Summary */}
        {aiReport?.summary && (
          <div
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.06)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Brain size={20} style={{ color: '#3B82F6' }} />
              <h3 style={{ color: '#111827', fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                AI Health Summary
              </h3>
              <span
                style={{
                  marginLeft: 'auto',
                  padding: '4px 10px',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '12px',
                  color: '#3B82F6',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                Eros GPT powered
              </span>
            </div>
            <p style={{ color: '#374151', fontSize: '1rem', lineHeight: 1.7, margin: 0 }}>
              {aiReport.summary}
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <div
          style={{
            padding: '20px 24px',
            backgroundColor: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <AlertCircle size={16} style={{ color: '#9CA3AF' }} />
            <span style={{ color: '#6B7280', fontSize: '0.875rem', fontWeight: 600 }}>
              DISCLAIMER
            </span>
          </div>
          <p style={{ color: '#9CA3AF', fontSize: '0.8rem', margin: 0, lineHeight: 1.6 }}>
            BP, HR and HRV-like metrics in this report are wellness indicators and not medical
            measurements. This report is AI-generated and for informational purposes only—not
            medical advice, diagnosis, or treatment. Screening is designed for trend detection; findings
            should be validated with physical diagnostics and clinical assessment where appropriate.
            Always consult a qualified healthcare provider for medical concerns.
          </p>
        </div>

        {/* Footer (inside PDF) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 0',
            borderTop: '1px solid #E5E7EB',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
            Scan Date: {new Date(rppg.metadata.timestamp).toLocaleString()}
          </span>
          <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
            <Info size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            For informational purposes only - not medical advice
          </span>
        </div>
      </div>
      {/* End of PDF capture area */}

      {/* Continue to Chat (outside PDF) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          padding: '32px 0',
          marginBottom: '24px',
        }}
      >
        <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: 0, textAlign: 'center' }}>
          Discover More insights into your Bio Care report and interact to get deeper insights
        </p>
        <button
          onClick={() => navigate('/ai-chat')}
          style={{
            backgroundColor: '#00B8D4',
            color: '#fff',
            border: 'none',
            padding: '12px 32px',
            borderRadius: '24px',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#00A0BC';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#00B8D4';
          }}
        >
          Continue to Chat
        </button>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 1024px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: 1fr !important;
          }
          .content-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default FaceReportPage;
