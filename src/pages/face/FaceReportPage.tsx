// FaceReportPage.tsx
import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  BarChart3,
  Waves,
  Download,
} from 'lucide-react';
import type { CombinedReportData } from '@/types/rppg';
import { getStatusColorCode } from '@/utils/rppgHelpers';

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
      pdf.save(`Vita-Health-Report-${timestamp}.pdf`);
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
    }
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

  // Helper: determine heart rate status
  const getHeartRateStatus = (hr: number): string => {
    if (hr < 60) return 'LOW';
    if (hr > 100) return 'HIGH';
    return 'NORMAL';
  };

  // Helper: determine blood pressure status
  const getBpStatus = (systolic: number, diastolic: number) => {
    let systolicStatus = 'NORMAL';
    let diastolicStatus = 'NORMAL';
    if (systolic < 90) systolicStatus = 'LOW';
    else if (systolic >= 130) systolicStatus = 'HIGH';
    else if (systolic >= 120) systolicStatus = 'ELEVATED';
    if (diastolic < 60) diastolicStatus = 'LOW';
    else if (diastolic >= 80) diastolicStatus = 'HIGH';
    return { systolicStatus, diastolicStatus };
  };

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

  // Override vitals with API health data from report
  const heartRateValue = report?.apiHealthData?.heart_rate ?? rppg.vitals.heartRate.value;
  const heartRateStatus = report?.apiHealthData?.heart_rate
    ? getHeartRateStatus(report.apiHealthData.heart_rate)
    : rppg.vitals.heartRate.status;
  const scanDuration = report?.apiHealthData?.scan_duration_seconds ?? rppg.metadata.scanDurationSeconds;

  // Blood pressure from API health data
  const bpSystolic = report?.apiHealthData?.bp_systolic ?? 0;
  const bpDiastolic = report?.apiHealthData?.bp_diastolic ?? 0;
  const { systolicStatus, diastolicStatus } = getBpStatus(bpSystolic, bpDiastolic);

  // New metrics
  const fd = rppg.hrv.frequencyDomain;
  const nl = rppg.hrv.nonlinear;
  const re = rppg.hrv.respiratoryExtended;
  const stress = rppg.stress;
  const si = report?.sectionInsights;

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
              Health Scan Report
            </h1>
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
            title="Heart Rate"
            value={heartRateValue.toFixed(1)}
            unit="BPM"
            status={heartRateStatus}
            icon={<Heart size={20} />}
            color="#EF4444"
          />
          <MetricCard
            title="BP Systolic"
            value={bpSystolic.toFixed(1)}
            unit="mmHg"
            status={systolicStatus}
            icon={<Activity size={20} />}
            color="#3B82F6"
          />
          <MetricCard
            title="BP Diastolic"
            value={bpDiastolic.toFixed(1)}
            unit="mmHg"
            status={diastolicStatus}
            icon={<Activity size={20} />}
            color="#8B5CF6"
          />
          <MetricCard
            title="Breathing Rate"
            value={rppg.vitals.breathingRate.value}
            unit="breaths/min"
            status={rppg.vitals.breathingRate.status}
            icon={<Wind size={20} />}
            color="#00B8D4"
          />
          <MetricCard
            title="Stress Index"
            value={rppg.stress.index}
            unit="/100"
            status={rppg.stress.level === 'low' ? 'LOW' : rppg.stress.level === 'moderate' ? 'MODERATE' : 'HIGH'}
            icon={<Activity size={20} />}
            color="#F59E0B"
          />
          <MetricCard
            title="Signal Quality"
            value={(rppg.vitals.signalQuality.value * 100).toFixed(0)}
            unit="%"
            status={rppg.vitals.signalQuality.status}
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

        {/* HRV Section: Time Domain + Frequency Domain - 2 columns */}
        <div
          className="content-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            marginBottom: '24px',
          }}
        >
          {/* HRV Time Domain */}
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
                  HRV Time Domain
                </h3>
              </div>
              <p style={{ color: '#9CA3AF', fontSize: '0.8rem', margin: '0 0 0 30px', lineHeight: 1.4 }}>
                Statistical measures of beat-to-beat interval variation over time. Higher values generally indicate better autonomic flexibility.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <HrvRow label="SDNN (Standard Deviation)" value={rppg.hrv.sdnn.value} unit="ms" status={rppg.hrv.sdnn.status} description="Normal range: 50–100 ms" />
              <HrvRow label="RMSSD (Root Mean Square)" value={rppg.hrv.rmssd.value} unit="ms" status={rppg.hrv.rmssd.status} description="Normal range: 20–50 ms · Parasympathetic indicator" />
              <HrvRow label="pNN20 (Beat-to-Beat Variation)" value={rppg.hrv.pnn20.value} unit="%" status={rppg.hrv.pnn20.status} description="Normal range: 5–60% · % of successive RR differences > 20 ms" />
              <HrvRow label="pNN50 (Successive Differences)" value={rppg.hrv.pnn50.value} unit="%" status={rppg.hrv.pnn50.status} description="Normal range: 3–25% · May show 0% in short rPPG recordings" />

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

          {/* HRV Frequency Domain */}
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
                <BarChart3 size={20} style={{ color: '#8B5CF6' }} />
                <h3 style={{ color: '#111827', fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                  HRV Frequency Domain
                </h3>
              </div>
              <p style={{ color: '#9CA3AF', fontSize: '0.8rem', margin: '0 0 0 30px', lineHeight: 1.4 }}>
                Spectral analysis of heart rate oscillations. Each band covers a frequency range (Hz); power (ms²) indicates the strength of oscillations in that band.
              </p>
            </div>
            {fd ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Column headers for clarity */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 20px',
                    borderBottom: '1px solid #E5E7EB',
                  }}
                >
                  <span style={{ color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Band (Frequency Range)
                  </span>
                  <span style={{ color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Power (ms²)
                  </span>
                </div>
                <HrvRow label="VLF · 0.003–0.04 Hz" value={fd.vlf.toFixed(2)} unit="ms²" description="Very Low Frequency" />
                <HrvRow label="LF · 0.04–0.15 Hz" value={fd.lf.toFixed(2)} unit="ms²" description="Low Frequency · Sympathetic + Parasympathetic" />
                <HrvRow label="HF · 0.15–0.4 Hz" value={fd.hf.toFixed(2)} unit="ms²" description="High Frequency · Parasympathetic (vagal) tone" />
                <HrvRow label="Total Power (all bands)" value={fd.tp.toFixed(2)} unit="ms²" />
                <HrvRow
                  label="LF/HF Ratio"
                  value={fd.lfHfRatio.toFixed(2)}
                  status={fd.lfHfRatio < 1.0 ? 'NORMAL' : fd.lfHfRatio < 2.0 ? 'MODERATE' : 'HIGH'}
                  description="Sympathovagal balance indicator (unitless)"
                />

                {/* Visual bar breakdown */}
                <div style={{ padding: '12px 20px', backgroundColor: '#F9FAFB', borderRadius: '12px' }}>
                  <span style={{ color: '#6B7280', fontSize: '0.8rem', display: 'block', marginBottom: '8px' }}>
                    Power Distribution
                  </span>
                  <div style={{ display: 'flex', height: '24px', borderRadius: '6px', overflow: 'hidden' }}>
                    {fd.tp > 0 ? (
                      <>
                        <div style={{ width: `${(fd.vlf / fd.tp) * 100}%`, backgroundColor: '#93C5FD', minWidth: '2px' }} title={`VLF: ${((fd.vlf / fd.tp) * 100).toFixed(1)}%`} />
                        <div style={{ width: `${(fd.lf / fd.tp) * 100}%`, backgroundColor: '#8B5CF6', minWidth: '2px' }} title={`LF: ${((fd.lf / fd.tp) * 100).toFixed(1)}%`} />
                        <div style={{ width: `${(fd.hf / fd.tp) * 100}%`, backgroundColor: '#10B981', minWidth: '2px' }} title={`HF: ${((fd.hf / fd.tp) * 100).toFixed(1)}%`} />
                      </>
                    ) : (
                      <div style={{ width: '100%', backgroundColor: '#E5E7EB' }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#93C5FD', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#93C5FD', display: 'inline-block' }} /> VLF
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#8B5CF6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#8B5CF6', display: 'inline-block' }} /> LF
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#10B981', display: 'inline-block' }} /> HF
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: '#9CA3AF', fontSize: '0.875rem', padding: '20px', textAlign: 'center' }}>
                Insufficient data for frequency domain analysis. A longer scan is required.
              </div>
            )}

            {/* GPT Section Insight */}
            {si?.frequencyDomain && (
              <div
                style={{
                  marginTop: '12px',
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
                  {si.frequencyDomain}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Nonlinear HRV + Stress Analysis - 2 columns */}
        <div
          className="content-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            marginBottom: '24px',
          }}
        >
          {/* Nonlinear HRV */}
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
                  Nonlinear HRV Analysis
                </h3>
              </div>
              <p style={{ color: '#9CA3AF', fontSize: '0.8rem', margin: '0 0 0 30px', lineHeight: 1.4 }}>
                Complexity and fractal measures of heart rate dynamics. These capture patterns not visible in standard time/frequency analysis.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {nl ? (
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
                  <HrvRow label="SD1" value={rppg.hrv.sdnn.value > 0 ? (rppg.hrv.rmssd.value / Math.sqrt(2)).toFixed(1) : '0'} unit="ms" description="Short-term HRV variability" />
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

          {/* Stress Analysis + Respiratory */}
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
                  Stress & Respiratory Analysis
                </h3>
              </div>
              <p style={{ color: '#9CA3AF', fontSize: '0.8rem', margin: '0 0 0 30px', lineHeight: 1.4 }}>
                Autonomic stress indicators derived from HRV and breathing pattern analysis. Lower stress index and stable breathing indicate better recovery capacity.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Stress */}
              <HrvRow
                label="Stress Level"
                value={stress.level.charAt(0).toUpperCase() + stress.level.slice(1)}
                status={stress.level === 'low' ? 'NORMAL' : stress.level === 'moderate' ? 'MODERATE' : stress.level === 'high' ? 'HIGH' : 'NORMAL'}
              />
              <HrvRow label="Stress Index" value={stress.index} unit="/100" />

              {stress.sympathovagalBalance !== undefined && stress.sympathovagalBalance !== null && (
                <HrvRow
                  label="Sympathovagal Balance"
                  value={stress.sympathovagalBalance.toFixed(3)}
                  description="ln(SDNN) / ln(RMSSD) ratio"
                  status={stress.sympathovagalBalance < 1.0 ? 'NORMAL' : stress.sympathovagalBalance < 1.5 ? 'MODERATE' : 'HIGH'}
                />
              )}

              {stress.components && (
                <div style={{ padding: '12px 20px', backgroundColor: '#F9FAFB', borderRadius: '12px' }}>
                  <span style={{ color: '#6B7280', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Components</span>
                  <span style={{ color: '#374151', fontSize: '0.85rem' }}>
                    SDNN: {stress.components.sdnn.toFixed(1)} ms &nbsp;|&nbsp; RMSSD: {stress.components.rmssd.toFixed(1)} ms
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
                    value={re?.breathingRateMean.value || rppg.vitals.breathingRate.value}
                    unit="breaths/min"
                    status={rppg.vitals.breathingRate.status}
                  />
                  {re && re.breathingRateSd.value > 0 && (
                    <HrvRow label="Breathing Rate SD" value={re.breathingRateSd.value.toFixed(1)} unit="breaths/min" />
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
                GPT-4 Powered
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
            This report is AI-generated and for informational purposes only. It does not constitute
            medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider
            for medical concerns. Do not disregard professional medical advice based on these readings.
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
          Discover More insights into your Vita Scan and interact to get more deeper insights
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
