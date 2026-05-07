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
import { usePhcSession } from '@/context/PhcSessionContext';
import { getPhcCopy } from '@/i18n/phcCopy';

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

interface StressPresentation {
  index: number;
  metricBadge: 'NORMAL' | 'MODERATE' | 'HIGH' | 'UNKNOWN';
  levelWord: string;
  rowStatus: 'NORMAL' | 'MODERATE' | 'HIGH' | 'UNKNOWN';
}

function getHeartRateBand(hr: number): string {
  if (!Number.isFinite(hr) || hr <= 0) return 'UNKNOWN';
  if (hr < 60) return 'LOW';
  if (hr > 100) return 'HIGH';
  return 'NORMAL';
}

function getBpBand(systolic: number, diastolic: number) {
  let systolicStatus = 'NORMAL';
  let diastolicStatus = 'NORMAL';
  if (!Number.isFinite(systolic) || systolic <= 0) systolicStatus = 'UNKNOWN';
  else
  if (systolic < 90) systolicStatus = 'LOW';
  else if (systolic >= 130) systolicStatus = 'HIGH';
  else if (systolic >= 120) systolicStatus = 'ELEVATED';
  if (!Number.isFinite(diastolic) || diastolic <= 0) diastolicStatus = 'UNKNOWN';
  else
  if (diastolic < 60) diastolicStatus = 'LOW';
  else if (diastolic >= 80) diastolicStatus = 'HIGH';
  return { systolicStatus, diastolicStatus };
}

function getStressPresentation(stress: CombinedReportData['rppg']['stress']): StressPresentation {
  const idx = Number(stress.index ?? 0);
  const level = String(stress.level || 'unknown').toLowerCase();
  const metricBadge: StressPresentation['metricBadge'] =
    level === 'low' ? 'NORMAL' : level === 'moderate' ? 'MODERATE' : level === 'high' ? 'HIGH' : 'UNKNOWN';
  return {
    index: Number.isFinite(idx) ? idx : 0,
    metricBadge,
    levelWord: level ? level.charAt(0).toUpperCase() + level.slice(1) : 'Unknown',
    rowStatus: metricBadge,
  };
}

function buildBioCareActualLayer(report: CombinedReportData) {
  const rg = report.rppg!;
  const api = report.apiHealthData;

  const heartRate = Number(api?.heart_rate ?? rg.vitals.heartRate.value ?? 0);
  const heartRateStatus = getHeartRateBand(heartRate);

  const bpSys = Number(api?.bp_systolic ?? 0);
  const bpDia = Number(api?.bp_diastolic ?? 0);
  const { systolicStatus, diastolicStatus } = getBpBand(bpSys, bpDia);

  const breathingRate = Number(rg.vitals.breathingRate.value ?? 0);
  const breathingRateStatus =
    !Number.isFinite(breathingRate) || breathingRate <= 0 ? 'UNKNOWN' : breathingRate < 12 ? 'LOW' : breathingRate > 20 ? 'HIGH' : 'NORMAL';

  const signalQualityDec = clamp(Number(rg.vitals.signalQuality.value ?? 0), 0, 1);
  const signalQualityStatus = signalQualityDec >= 0.86 ? 'EXCELLENT' : signalQualityDec >= 0.71 ? 'GOOD' : 'FAIR';

  const sdnn = Number(rg.hrv.sdnn?.value ?? 0);
  const rmssd = Number(rg.hrv.rmssd?.value ?? 0);
  const pnn20 = Number(rg.hrv.pnn20?.value ?? 0);
  const pnn50 = Number(rg.hrv.pnn50?.value ?? 0);
  const sdnnStatus = rg.hrv.sdnn?.status ?? 'UNKNOWN';
  const rmssdStatus = rg.hrv.rmssd?.status ?? 'UNKNOWN';
  const pnn20Status = rg.hrv.pnn20?.status ?? 'UNKNOWN';
  const pnn50Status = rg.hrv.pnn50?.status ?? 'UNKNOWN';

  const sympathovagalBalance = rg.stress.sympathovagalBalance ?? null;
  const stress = getStressPresentation(rg.stress);

  const nlDisp = rg.hrv.nonlinear
    ? {
        sd1Val: Number(rg.hrv.nonlinear.sd1.value ?? 0),
        sd2Val: Number(rg.hrv.nonlinear.sd2.value ?? 0),
        sd1Sd2Ratio: rg.hrv.nonlinear.sd1Sd2Ratio,
        sampleEntropyVal: rg.hrv.nonlinear.sampleEntropy.value,
        dfaVal: rg.hrv.nonlinear.dfaAlpha1.value,
        dfaReliable: rg.hrv.nonlinear.dfaAlpha1.reliable,
        sd1Desc: rg.hrv.nonlinear.sd1.description,
        sd2Desc: rg.hrv.nonlinear.sd2.description,
        sampleDesc: rg.hrv.nonlinear.sampleEntropy.description,
        dfaDesc: rg.hrv.nonlinear.dfaAlpha1.description,
      }
    : null;

  const sd1FallbackApprox =
    rg.hrv.rmssd?.value !== undefined ? Math.round((rmssd / Math.sqrt(2)) * 10) / 10 : 0;

  let breathingRateSdDisp: number | undefined;
  if (rg.hrv.respiratoryExtended) {
    breathingRateSdDisp = rg.hrv.respiratoryExtended.breathingRateSd.value;
  }

  const breatheMeanDisp =
    rg.hrv.respiratoryExtended?.breathingRateMean.value ?? rg.vitals.breathingRate.value;

  const compSdnn = rg.stress.components?.sdnn ?? sdnn;
  const compRmssd = rg.stress.components?.rmssd ?? rmssd;

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
  const { language } = usePhcSession();
  const color = getStatusColorCode(status);
  const normalizedStatus = status.toUpperCase();
  const translatedStatus =
    language === 'gu'
      ? ({
          NORMAL: 'સામાન્ય',
          GOOD: 'સારું',
          EXCELLENT: 'ઉત્તમ',
          LOW: 'ઓછું',
          HIGH: 'વધુ',
          FAIR: 'મધ્યમ',
          MODERATE: 'મધ્યમ',
          POOR: 'નબળું',
          WARNING: 'ચેતવણી',
          ELEVATED: 'વધેલું',
          UNKNOWN: 'અજ્ઞાત',
        } as Record<string, string>)[normalizedStatus] ?? status
      : status;

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
      {translatedStatus}
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
  const {
    language,
    patient,
    bioCareReport,
    setBioCareReport,
    resetPatientFlow,
  } = usePhcSession();
  const t = getPhcCopy(language);

  const [report, setReport] = useState<CombinedReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [downloading, setDownloading] = useState(false);
  const [clinicalInputs, setClinicalInputs] = useState({
    bpSystolic: '',
    bpDiastolic: '',
    sugar: '',
    spo2: '',
    ecg: '',
    bmi: '',
  });
  const [clinicalSaveStatus, setClinicalSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');
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

  // Load report data from navigation state or in-memory PHC session.
  useEffect(() => {
    if (location.state && location.state.success) {
      const reportData = location.state as CombinedReportData;
      setReport(reportData);
      setBioCareReport(reportData);
    } else if (bioCareReport) {
      setReport(bioCareReport);
    } else {
      setError(t.noReport);
    }

    setUsername(patient?.username ?? '');
  }, [bioCareReport, location.state, patient?.username, setBioCareReport, t.noReport]);

  const handleNextPerson = () => {
    resetPatientFlow();
    navigate('/profile', { replace: true });
  };

  const setClinicalField = (field: keyof typeof clinicalInputs, value: string) => {
    setClinicalSaveStatus('idle');
    setClinicalInputs((prev) => ({ ...prev, [field]: value }));
  };

  const handleClinicalSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!patient?.userId) {
      setClinicalSaveStatus('error');
      return;
    }

    setClinicalSaveStatus('saving');
    try {
      const payload = {
        user_id: patient.userId,
        report_language: language === 'gu' ? 'gu' : 'en',
        locale: language === 'gu' ? 'gu-IN' : 'en-US',
        scan_timestamp: report?.rppg.metadata.timestamp,
        bp_systolic: clinicalInputs.bpSystolic ? Number(clinicalInputs.bpSystolic) : null,
        bp_diastolic: clinicalInputs.bpDiastolic ? Number(clinicalInputs.bpDiastolic) : null,
        sugar: clinicalInputs.sugar ? Number(clinicalInputs.sugar) : null,
        spo2: clinicalInputs.spo2 ? Number(clinicalInputs.spo2) : null,
        ecg: clinicalInputs.ecg.trim() || null,
        bmi: clinicalInputs.bmi ? Number(clinicalInputs.bmi) : null,
      };
      const response = await fetch(
        `${baseApiUrl}/aitools/wellness/v2/health/scan/${patient.userId}/clinical-inputs`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      setClinicalSaveStatus('saved');
    } catch (err) {
      console.error('Failed to save clinical inputs:', err);
      setClinicalSaveStatus('error');
    }
  };

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
    return [{ type: 'info', text: t.fallbackInsight }];
  }, [report?.aiReport, t.fallbackInsight]);

  // Use AI report recommendations from report (includes merged API data)
  const recommendations = useMemo(() => {
    const aiData = report?.aiReport;
    if (aiData?.recommendations && aiData.recommendations.length > 0) return aiData.recommendations;
    return [t.fallbackRecommendation];
  }, [report?.aiReport, t.fallbackRecommendation]);

  const actualLayer = useMemo(() => {
    if (!report?.rppg) return null;
    try {
      return buildBioCareActualLayer(report);
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
    summary: t.fallbackSummary,
    insights: [t.fallbackInsight],
    recommendations: [t.fallbackRecommendationScan],
    riskFactors: [] as string[],
    disclaimer: t.fallbackDisclaimer,
  };

  // Vitals from processed scan/backend data. Missing values remain visibly empty/unknown.
  const fallbackHr = report?.apiHealthData?.heart_rate ?? rppg.vitals.heartRate.value;
  const fallbackSys = report?.apiHealthData?.bp_systolic ?? 0;
  const fallbackDia = report?.apiHealthData?.bp_diastolic ?? 0;

  const heartRateValue = actualLayer?.heartRate ?? fallbackHr;
  const heartRateStatus = actualLayer?.heartRateStatus ?? getHeartRateBand(fallbackHr);
  const scanDuration = report?.apiHealthData?.scan_duration_seconds ?? rppg.metadata.scanDurationSeconds;

  const bpSystolic = actualLayer?.bpSys ?? fallbackSys;
  const bpDiastolic = actualLayer?.bpDia ?? fallbackDia;
  const { systolicStatus, diastolicStatus } = actualLayer
    ? { systolicStatus: actualLayer.systolicStatus, diastolicStatus: actualLayer.diastolicStatus }
    : getBpBand(bpSystolic, bpDiastolic);

  const nl = rppg.hrv.nonlinear;
  const re = rppg.hrv.respiratoryExtended;
  const stress = rppg.stress;
  const stressPresentation = useMemo(() => actualLayer?.stress ?? getStressPresentation(stress), [
    actualLayer,
    stress,
  ]);
  const sympathDisplay =
    actualLayer?.sympathovagalBalance ?? (stress.sympathovagalBalance ?? null);

  const si = report?.sectionInsights;

  const breatheMeanDisplay =
    actualLayer?.breatheMeanDisp ?? re?.breathingRateMean?.value ?? rppg.vitals.breathingRate.value;

  const rmssdForSd1Approx = actualLayer?.rmssd ?? rppg.hrv.rmssd?.value ?? 0;
  const sd1FallbackApproxRow =
    actualLayer?.sd1FallbackApprox ??
    (rmssdForSd1Approx > 0 ? Math.round((rmssdForSd1Approx / Math.sqrt(2)) * 10) / 10 : 0);

  const breathingRateSdShown = actualLayer?.breathingRateSdDisp ?? re?.breathingRateSd?.value ?? 0;
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
          <h3 style={{ color: '#111827', margin: '0 0 8px 0', fontSize: '1.25rem' }}>{t.errorTitle}</h3>
          <p style={{ color: '#6B7280', margin: '0 0 20px 0' }}>{error}</p>
          <button
            onClick={handleNextPerson}
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
            {t.returnToRegistration}
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
          <p style={{ color: '#6B7280', fontSize: '1rem' }}>{t.loadingReport}</p>
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
          onClick={() => navigate('/facescan')}
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
          {t.back}
        </button>
      </div>

      {/* Report content (captured for PDF) */}
      <div ref={reportRef} style={{ margin: '0 auto' }}>
        {/* Header with title and download button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ color: '#111827', fontSize: '1.875rem', fontWeight: 700, margin: '0 0 4px 0' }}>
              {t.bioCareReport}
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
                {t.preparedFor}: <span style={{ fontWeight: 700 }}>{username}</span>
              </p>
            )}
            <p style={{ color: '#9CA3AF', fontSize: '0.875rem', margin: 0 }}>
              {t.biometricAnalysis}
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
            {downloading ? t.generatingPdf : t.downloadPdf}
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
                  {t.scanNoticeTitle}
                </p>
                <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#1E40AF', lineHeight: 1.55 }}>
                  {t.scanNotice}
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
                  <strong>{t.bioCare}:</strong> {t.wellnessIndicators}
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
              {t.standardConditions}
            </p>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.76rem', color: '#6B7280', lineHeight: 1.55 }}>
              <li>{t.lighting}</li>
              <li>{t.stillPosture}</li>
              <li>{t.noEyewear}</li>
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
            title={t.heartRate}
            value={heartRateValue.toFixed(1)}
            unit="BPM"
            status={heartRateStatus}
            icon={<Heart size={20} />}
            color="#EF4444"
          />
          <MetricCard
            title={t.systolicBp}
            value={bpSystolic.toFixed(1)}
            unit="mmHg"
            status={systolicStatus}
            icon={<Activity size={20} />}
            color="#3B82F6"
          />
          <MetricCard
            title={t.diastolicBp}
            value={bpDiastolic.toFixed(1)}
            unit="mmHg"
            status={diastolicStatus}
            icon={<Activity size={20} />}
            color="#8B5CF6"
          />
          <MetricCard
            title={t.breathingRate}
            value={actualLayer?.breathingRate ?? rppg.vitals.breathingRate.value}
            unit="breaths/min"
            status={actualLayer?.breathingRateStatus ?? rppg.vitals.breathingRate.status}
            icon={<Wind size={20} />}
            color="#00B8D4"
          />
          <MetricCard
            title={t.recoveryScore}
            value={stressPresentation.index}
            unit="/100"
            status={stressPresentation.metricBadge}
            icon={<Activity size={20} />}
            color="#F59E0B"
          />
          <MetricCard
            title={t.signalQuality}
            value={((actualLayer?.signalQualityDec ?? rppg.vitals.signalQuality.value) * 100).toFixed(0)}
            unit="%"
            status={actualLayer?.signalQualityStatus ?? rppg.vitals.signalQuality.status}
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
                {t.waveform}
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
                  {t.noWaveform}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
              <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
                {t.duration}: {scanDuration}s
              </span>
              <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
                {t.samples}: {rppg.metadata.samplesCollected}
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
                {t.aiInsights}
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
                    {t.riskFactors}
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
                  {t.recoveryTimeDomain}
                </h3>
              </div>
              <p style={{ color: '#9CA3AF', fontSize: '0.8rem', margin: '0 0 0 30px', lineHeight: 1.4 }}>
                {t.recoveryTimeDescription}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <HrvRow label="SDNN" value={actualLayer?.sdnn ?? rppg.hrv.sdnn.value} unit="ms" status={actualLayer?.sdnnStatus ?? rppg.hrv.sdnn.status} description={`${t.normalRange}: 50-100 ms`} />
              <HrvRow label="RMSSD" value={actualLayer?.rmssd ?? rppg.hrv.rmssd.value} unit="ms" status={actualLayer?.rmssdStatus ?? rppg.hrv.rmssd.status} description={`${t.normalRange}: 20-50 ms · ${t.parasympatheticIndicator}`} />
              <HrvRow label="pNN20" value={actualLayer?.pnn20 ?? rppg.hrv.pnn20?.value ?? 0} unit="%" status={actualLayer?.pnn20Status ?? rppg.hrv.pnn20?.status ?? 'NORMAL'} description={`${t.normalRange}: 5-60% · ${t.beatVariationDescription}`} />
              <HrvRow label="pNN50" value={actualLayer?.pnn50 ?? rppg.hrv.pnn50.value} unit="%" status={actualLayer?.pnn50Status ?? rppg.hrv.pnn50.status} description={`${t.normalRange}: 3-25% · ${t.shortRecordingNote}`} />

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
                  <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>{t.rrCollected}</span>
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
                <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>{t.recordingQuality}</span>
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
                    <span style={{ color: '#3B82F6', fontSize: '0.75rem', fontWeight: 600 }}>{t.aiInsight}</span>
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
                  {t.nonlinearRecovery}
                </h3>
              </div>
              <p style={{ color: '#9CA3AF', fontSize: '0.8rem', margin: '0 0 0 30px', lineHeight: 1.4 }}>
                {t.nonlinearDescription}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {actualLayer?.nlDisp ? (
                <>
                  <HrvRow label="SD1" value={actualLayer.nlDisp.sd1Val} unit="ms" description={actualLayer.nlDisp.sd1Desc} />
                  <HrvRow label="SD2" value={actualLayer.nlDisp.sd2Val} unit="ms" description={actualLayer.nlDisp.sd2Desc} />
                  <HrvRow label="SD1/SD2 Ratio" value={Number.isFinite(actualLayer.nlDisp.sd1Sd2Ratio) ? actualLayer.nlDisp.sd1Sd2Ratio.toFixed(3) : 'N/A'} />
                  <HrvRow
                    label="Sample Entropy"
                    value={actualLayer.nlDisp.sampleEntropyVal !== null && Number.isFinite(actualLayer.nlDisp.sampleEntropyVal) ? actualLayer.nlDisp.sampleEntropyVal.toFixed(3) : 'N/A'}
                    description={actualLayer.nlDisp.sampleDesc}
                  />
                  <HrvRow
                    label="DFA Alpha1"
                    value={actualLayer.nlDisp.dfaVal !== null && Number.isFinite(actualLayer.nlDisp.dfaVal) ? actualLayer.nlDisp.dfaVal.toFixed(3) : 'N/A'}
                    description={actualLayer.nlDisp.dfaDesc}
                    status={actualLayer.nlDisp.dfaReliable ? 'GOOD' : 'FAIR'}
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
                    <span style={{ color: '#3B82F6', fontSize: '0.75rem', fontWeight: 600 }}>{t.aiInsight}</span>
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
                  {t.relaxationBreathing}
                </h3>
              </div>
              <p style={{ color: '#9CA3AF', fontSize: '0.8rem', margin: '0 0 0 30px', lineHeight: 1.4 }}>
                {t.relaxationDescription}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Stress */}
              <HrvRow
                label={t.relaxationBreathing}
                value={stressPresentation.levelWord}
                status={stressPresentation.rowStatus}
              />
              <HrvRow label={t.recoveryScore} value={stressPresentation.index} unit="/100" />

              {sympathDisplay !== undefined && sympathDisplay !== null && (
                <HrvRow
                  label="Sympathovagal Balance"
                  value={sympathDisplay.toFixed(3)}
                    description="ln(SDNN) / ln(RMSSD)"
                  status={
                    sympathDisplay < 1.0 ? 'NORMAL' : sympathDisplay < 1.5 ? 'MODERATE' : 'HIGH'
                  }
                />
              )}

              {(actualLayer?.stressComponents || stress.components) && (
                <div style={{ padding: '12px 20px', backgroundColor: '#F9FAFB', borderRadius: '12px' }}>
                  <span style={{ color: '#6B7280', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>{t.components}</span>
                  <span style={{ color: '#374151', fontSize: '0.85rem' }}>
                    SDNN:{' '}
                    {(actualLayer?.stressComponents?.sdnn ?? stress.components?.sdnn ?? 0).toFixed(1)} ms
                    &nbsp;|&nbsp; RMSSD:{' '}
                    {(actualLayer?.stressComponents?.rmssd ?? stress.components?.rmssd ?? 0).toFixed(1)} ms
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
                  {t.respiratoryMetrics}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <HrvRow
                    label={t.breathingRate}
                    value={breatheMeanDisplay}
                    unit="breaths/min"
                    status={actualLayer?.breathingRateStatus ?? rppg.vitals.breathingRate.status}
                  />
                  {re && breathingRateSdShown > 0 && (
                    <HrvRow label={t.breathingRateSd} value={breathingRateSdShown.toFixed(1)} unit="breaths/min" />
                  )}
                  {re && (
                    <>
                      <HrvRow
                        label={t.breathingStability}
                        value={re.stability.charAt(0).toUpperCase() + re.stability.slice(1)}
                        status={re.stability === 'stable' ? 'NORMAL' : re.stability === 'variable' ? 'MODERATE' : 'HIGH'}
                      />
                      {re.breathCyclesDetected > 0 && (
                        <HrvRow label={t.breathCycles} value={re.breathCyclesDetected} />
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
                    <span style={{ color: '#3B82F6', fontSize: '0.75rem', fontWeight: 600 }}>{t.aiInsight}</span>
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
              {t.recommendations}
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
                {t.aiSummary}
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
                Eros GPT
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
              {t.disclaimer}
            </span>
          </div>
          <p style={{ color: '#9CA3AF', fontSize: '0.8rem', margin: 0, lineHeight: 1.6 }}>
            {t.disclaimerText}
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
            {t.scanDate}: {new Date(rppg.metadata.timestamp).toLocaleString()}
          </span>
          <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
            <Info size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            {t.informationalOnly}
          </span>
        </div>
      </div>
      {/* End of PDF capture area */}

      <form
        onSubmit={handleClinicalSubmit}
        style={{
          maxWidth: 1100,
          margin: '24px auto 0',
          backgroundColor: '#ffffff',
          border: '1px solid #E5E7EB',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <h3 style={{ color: '#111827', fontSize: '1.125rem', fontWeight: 700, margin: '0 0 6px' }}>
            {t.clinicalInputs}
          </h3>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: 0 }}>
            {t.clinicalInputsSubtitle}
          </p>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 14,
          }}
          className="clinical-grid"
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#374151', fontSize: 13, fontWeight: 700 }}>
            {t.originalBp} {t.systolic}
            <input
              value={clinicalInputs.bpSystolic}
              onChange={(e) => setClinicalField('bpSystolic', e.target.value)}
              type="number"
              inputMode="decimal"
              placeholder="120"
              style={{ border: '1px solid #D1D5DB', borderRadius: 10, padding: '11px 12px', fontSize: 15 }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#374151', fontSize: 13, fontWeight: 700 }}>
            {t.originalBp} {t.diastolic}
            <input
              value={clinicalInputs.bpDiastolic}
              onChange={(e) => setClinicalField('bpDiastolic', e.target.value)}
              type="number"
              inputMode="decimal"
              placeholder="80"
              style={{ border: '1px solid #D1D5DB', borderRadius: 10, padding: '11px 12px', fontSize: 15 }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#374151', fontSize: 13, fontWeight: 700 }}>
            {t.sugar}
            <input
              value={clinicalInputs.sugar}
              onChange={(e) => setClinicalField('sugar', e.target.value)}
              type="number"
              inputMode="decimal"
              placeholder="110"
              style={{ border: '1px solid #D1D5DB', borderRadius: 10, padding: '11px 12px', fontSize: 15 }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#374151', fontSize: 13, fontWeight: 700 }}>
            {t.spo2}
            <input
              value={clinicalInputs.spo2}
              onChange={(e) => setClinicalField('spo2', e.target.value)}
              type="number"
              inputMode="decimal"
              placeholder="98"
              style={{ border: '1px solid #D1D5DB', borderRadius: 10, padding: '11px 12px', fontSize: 15 }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#374151', fontSize: 13, fontWeight: 700 }}>
            {t.ecg}
            <input
              value={clinicalInputs.ecg}
              onChange={(e) => setClinicalField('ecg', e.target.value)}
              type="text"
              placeholder={t.ecgPlaceholder}
              style={{ border: '1px solid #D1D5DB', borderRadius: 10, padding: '11px 12px', fontSize: 15 }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#374151', fontSize: 13, fontWeight: 700 }}>
            {t.bmi}
            <input
              value={clinicalInputs.bmi}
              onChange={(e) => setClinicalField('bmi', e.target.value)}
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="24.2"
              style={{ border: '1px solid #D1D5DB', borderRadius: 10, padding: '11px 12px', fontSize: 15 }}
            />
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
          <button
            type="submit"
            disabled={clinicalSaveStatus === 'saving'}
            style={{
              backgroundColor: clinicalSaveStatus === 'saving' ? '#9CA3AF' : '#00B8D4',
              color: '#fff',
              border: 'none',
              padding: '12px 22px',
              borderRadius: 12,
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: clinicalSaveStatus === 'saving' ? 'not-allowed' : 'pointer',
            }}
          >
            {clinicalSaveStatus === 'saving' ? t.saving : t.saveClinicalInputs}
          </button>
          {clinicalSaveStatus === 'saved' && (
            <span style={{ color: '#059669', fontSize: 14, fontWeight: 700 }}>{t.saved}</span>
          )}
          {clinicalSaveStatus === 'error' && (
            <span style={{ color: '#DC2626', fontSize: 14, fontWeight: 700 }}>{t.saveFailed}</span>
          )}
        </div>
      </form>

      {/* Next patient action */}
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
        <button
          onClick={handleNextPerson}
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
          {t.nextPerson}
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
          .clinical-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default FaceReportPage;
