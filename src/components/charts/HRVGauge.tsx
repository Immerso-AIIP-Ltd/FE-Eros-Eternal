/**
 * HRVGauge - Horizontal gauge/bar showing HRV status
 */
import React from 'react';
import { getStatusColorCode } from '../../utils/rppgHelpers';

export interface HRVGaugeProps {
  value: number;
  unit: string;
  status: 'LOW' | 'NORMAL' | 'HIGH';
  label: string;
  min?: number;
  max?: number;
}

export const HRVGauge: React.FC<HRVGaugeProps> = ({
  value,
  unit,
  status,
  label,
  min = 0,
  max = 150,
}) => {
  // Calculate percentage for the bar fill
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  
  // Get color based on status
  const statusColor = getStatusColorCode(status);
  
  // Badge color mapping
  const getBadgeStyle = (status: string): React.CSSProperties => {
    switch (status.toUpperCase()) {
      case 'NORMAL':
      case 'GOOD':
        return {
          backgroundColor: '#10B981',
          color: '#000',
        };
      case 'LOW':
      case 'HIGH':
      case 'WARNING':
        return {
          backgroundColor: '#EF4444',
          color: '#fff',
        };
      default:
        return {
          backgroundColor: '#6B7280',
          color: '#fff',
        };
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#121212',
        padding: '1rem',
        borderRadius: '0.5rem',
        border: '1px solid #2D2D2D',
      }}
    >
      {/* Header with label and value */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
        }}
      >
        <span style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              color: '#fff',
              fontSize: '1.25rem',
              fontWeight: 700,
            }}
          >
            {value}
          </span>
          <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
            {unit}
          </span>
        </div>
      </div>

      {/* Gauge bar */}
      <div
        style={{
          height: '8px',
          backgroundColor: '#2D2D2D',
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '0.75rem',
          position: 'relative',
        }}
      >
        {/* Background segments for reference */}
        <div
          style={{
            position: 'absolute',
            left: '0%',
            width: '33.3%',
            height: '100%',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderRight: '1px solid #333',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '33.3%',
            width: '33.3%',
            height: '100%',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderRight: '1px solid #333',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '66.6%',
            width: '33.4%',
            height: '100%',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
          }}
        />
        
        {/* Actual value bar */}
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            backgroundColor: statusColor,
            borderRadius: '4px',
            transition: 'width 0.5s ease-out, background-color 0.3s ease',
            position: 'relative',
            zIndex: 1,
          }}
        />
        
        {/* Marker for optimal range (typically 20-100 for HRV) */}
        <div
          style={{
            position: 'absolute',
            left: '13.3%', // ~20ms mark
            width: '53.3%', // ~80ms range
            height: '100%',
            borderLeft: '2px dashed #10B981',
            borderRight: '2px dashed #10B981',
            top: 0,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      </div>

      {/* Footer with status badge */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ color: '#6B7280', fontSize: '0.75rem' }}>
          Range: {min}-{max} {unit}
        </span>
        <span
          style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            ...getBadgeStyle(status),
          }}
        >
          {status}
        </span>
      </div>
    </div>
  );
};

export default HRVGauge;
