/**
 * HeartRateChart - Smooth area chart showing heart rate over time
 */
import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export interface HeartRateDataPoint {
  time: number;
  hr: number;
  sqi: number;
}

export interface HeartRateChartProps {
  data: HeartRateDataPoint[];
  height?: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: number;
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const hr = payload[0]?.value;
    return (
      <div
        style={{
          backgroundColor: '#121212',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '0.75rem',
          color: '#fff',
          fontSize: '0.875rem',
        }}
      >
        <div style={{ color: '#00B8D4', fontWeight: 600, marginBottom: '0.25rem' }}>
          {hr} BPM
        </div>
        <div style={{ color: '#9CA3AF' }}>
          Time: {label?.toFixed(1)}s
        </div>
      </div>
    );
  }
  return null;
};

export const HeartRateChart: React.FC<HeartRateChartProps> = ({ 
  data, 
  height = 250 
}) => {
  // Format data for display
  const chartData = useMemo(() => {
    return data.map((point) => ({
      time: Math.round(point.time * 10) / 10, // Round to 1 decimal
      hr: Math.round(point.hr),
    }));
  }, [data]);

  // Calculate min/max for Y axis with padding
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [50, 120];
    const hrs = chartData.map((d) => d.hr);
    const min = Math.min(...hrs);
    const max = Math.max(...hrs);
    const padding = Math.max(5, (max - min) * 0.2);
    return [Math.max(40, Math.floor(min - padding)), Math.ceil(max + padding)];
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#121212',
          borderRadius: '0.5rem',
          color: '#9CA3AF',
        }}
      >
        No heart rate data available
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
        >
          <defs>
            <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00B8D4" stopOpacity={0.6} />
              <stop offset="50%" stopColor="#00B8D4" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#00B8D4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#2D2D2D"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            stroke="#6B7280"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickLine={{ stroke: '#6B7280' }}
            axisLine={{ stroke: '#333' }}
            label={{
              value: 'Time (seconds)',
              position: 'insideBottom',
              offset: -5,
              fill: '#9CA3AF',
              fontSize: 12,
            }}
          />
          <YAxis
            stroke="#6B7280"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickLine={{ stroke: '#6B7280' }}
            axisLine={{ stroke: '#333' }}
            domain={yDomain}
            label={{
              value: 'BPM',
              angle: -90,
              position: 'insideLeft',
              fill: '#9CA3AF',
              fontSize: 12,
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="hr"
            stroke="#00B8D4"
            strokeWidth={2}
            fill="url(#hrGradient)"
            animationDuration={800}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HeartRateChart;
