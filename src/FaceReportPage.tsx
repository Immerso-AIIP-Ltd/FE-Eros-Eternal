// FaceReportPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
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
} from 'lucide-react';
import type { CombinedReportData } from './types/rppg';
import { getStatusColorCode } from './utils/rppgHelpers';

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

  useEffect(() => {
    // First, try to get data from navigation state
    if (location.state && location.state.success) {
      const reportData = location.state as CombinedReportData;
      setReport(reportData);

      // Save to localStorage for persistence
      localStorage.setItem('faceReportData', JSON.stringify(reportData));

      if (reportData.uploadedImage) {
        setUploadedImage(reportData.uploadedImage);
      }
    } else {
      // Try to load from localStorage if no navigation state
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

  // Use AI report insights with fallback
  const insights = useMemo(() => {
    const aiData = report?.aiReport;
    if (!aiData?.insights || aiData.insights.length === 0) {
      return [{ type: 'info', text: 'Complete a scan to receive AI-generated insights.' }];
    }
    return aiData.insights.map((insight: string) => {
      // Determine type based on content
      const text = insight.toLowerCase();
      let type = 'info';
      if (text.includes('good') || text.includes('excellent') || text.includes('normal') || text.includes('optimal')) {
        type = 'positive';
      } else if (text.includes('high') || text.includes('elevated') || text.includes('warning') || text.includes('risk')) {
        type = 'warning';
      }
      return { type, text: insight };
    });
  }, [report?.aiReport]);

  // Use AI report recommendations with fallback
  const recommendations = useMemo(() => {
    const aiData = report?.aiReport;
    if (!aiData?.recommendations || aiData.recommendations.length === 0) {
      return ['Complete a scan to receive personalized recommendations.'];
    }
    return aiData.recommendations;
  }, [report?.aiReport]);

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

  // Get AI report with fallbacks - MUST be before any conditional returns
  const aiReport = report?.aiReport || {
    summary: 'No AI analysis available. Please complete a scan to generate insights.',
    insights: ['Complete a health scan to receive personalized insights.'],
    recommendations: ['Scan for at least 30 seconds for best results.'],
    riskFactors: [],
    disclaimer: 'This report is AI-generated and for informational purposes only.',
  };

  // Convert timestamps to relative seconds for chart - MUST be before any conditional returns
  const chartData = useMemo(() => {
    if (!rppg.hrHistory || rppg.hrHistory.length === 0) return [];
    const startTime = rppg.hrHistory[0]?.time || 0;
    return rppg.hrHistory.map((point) => ({
      time: ((point.time - startTime) / 1000), // Convert to seconds from start
      hr: point.hr,
      sqi: point.sqi,
    }));
  }, [rppg.hrHistory]);

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
      {/* Header */}
      <div style={{margin: '0 auto' }}>
        {/* Back button and title */}
        <div style={{ marginBottom: '24px' }}>
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
              marginBottom: '16px',
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* {uploadedImage && (
              <img
                src={uploadedImage}
                alt="Profile"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid rgba(0, 184, 212, 0.5)',
                }}
              />
            )} */}
            <div>
              <h1 style={{ color: '#111827', fontSize: '1.875rem', fontWeight: 700, margin: '0 0 4px 0' }}>
                Health Scan Report
              </h1>
              <p style={{ color: '#9CA3AF', fontSize: '0.875rem', margin: 0 }}>
                Biometric analysis & monitoring
              </p>
            </div>
          </div>
        </div>

        {/* Top Metrics Row - 4 columns */}
        <div
          className="metrics-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <MetricCard
            title="Heart Rate"
            value={rppg.vitals.heartRate.value}
            unit="BPM"
            status={rppg.vitals.heartRate.status}
            icon={<Heart size={20} />}
            color="#EF4444"
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
                <ResponsiveContainer width="100%" height="100%">
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
                Duration: {rppg.metadata.scanDurationSeconds}s
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
              {insights.map((insight, index) => (
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

        {/* Bottom Section: HRV + Recommendations - 2 columns */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Clock size={20} style={{ color: '#F59E0B' }} />
              <h3 style={{ color: '#111827', fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                HRV Time Domain
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* SDNN */}
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
                    SDNN (Standard Deviation)
                  </span>
                  <span style={{ color: '#111827', fontSize: '1.25rem', fontWeight: 600 }}>
                    {rppg.hrv.sdnn.value} <span style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>ms</span>
                  </span>
                </div>
                <StatusBadge status={rppg.hrv.sdnn.status} />
              </div>

              {/* RMSSD */}
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
                    RMSSD (Root Mean Square)
                  </span>
                  <span style={{ color: '#111827', fontSize: '1.25rem', fontWeight: 600 }}>
                    {rppg.hrv.rmssd.value} <span style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>ms</span>
                  </span>
                </div>
                <StatusBadge status={rppg.hrv.rmssd.status} />
              </div>

              {/* pNN50 */}
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
                    pNN50 (Successive Differences)
                  </span>
                  <span style={{ color: '#111827', fontSize: '1.25rem', fontWeight: 600 }}>
                    {rppg.hrv.pnn50.value} <span style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>%</span>
                  </span>
                </div>
                <StatusBadge status={rppg.hrv.pnn50.status} />
              </div>

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
            </div>
          </div>

          {/* Recommendations */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #E5E7EB',
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Zap size={20} style={{ color: '#10B981' }} />
              <h3 style={{ color: '#111827', fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                Recommendations
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recommendations.map((rec, index) => (
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

            {/* Stress Description Box */}
            <div
              style={{
                marginTop: '20px',
                padding: '16px',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                borderRadius: '12px',
                border: '1px solid rgba(245, 158, 11, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Activity size={16} style={{ color: '#F59E0B' }} />
                <span style={{ color: '#F59E0B', fontSize: '0.875rem', fontWeight: 600 }}>
                  Stress Analysis
                </span>
              </div>
              <p style={{ color: '#374151', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                {rppg.stress.description}
              </p>
            </div>
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

        {/* Continue to Chat */}
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

        {/* Footer */}
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
