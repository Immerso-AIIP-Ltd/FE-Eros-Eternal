// src/components/ProSection.tsx
import React from 'react';

export const ProSection: React.FC = () => {
  return (
    <div
      className="position-fixed bottom-0 start-0 m-3"
      style={{
        width: '256px', // w-64 ≈ 16rem = 256px
        zIndex: 1000,
      }}
    >
      {/* Main PRO Card */}
      <div
        className="rounded-4 p-4"
        style={{
          backgroundColor: '#1e2123',
        }}
      >
        {/* Title */}
        <h3
          className="mb-2"
          style={{
            fontWeight: 600,
            color: 'white',
          }}
        >
          Go unlimited with PRO
        </h3>

        {/* Description */}
        <p
          className="text-secondary mb-4"
          style={{
            fontSize: '0.875rem', // text-sm
            color: '#9ca3af', // gray-400
          }}
        >
          Get your AI Saas Project to another level and start doing more with Horizon AI Boilerplate PRO!
        </p>

        {/* CTA Button */}
        <button
          className="btn w-100 py-2 rounded-3"
          style={{
            backgroundColor: '#00b8f8',
            color: 'black',
            fontWeight: 500,
            fontSize: '1rem',
          }}
        >
          Get started with PRO
        </button>

        {/* User Info Card */}
        <div
          className="d-flex align-items-center gap-3 mt-4 p-3 rounded-3"
          style={{
            backgroundColor: '#2a2e30',
          }}
        >
          {/* Avatar */}
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-black text-center"
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#00b8f8',
              fontSize: '0.875rem',
              fontWeight: 'bold',
            }}
          >
            AJ
          </div>

          {/* Name */}
          <div className="flex-grow-1">
            <div
              className="mb-0"
              style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'white',
              }}
            >
              Adam Johns
            </div>
          </div>

          {/* Arrow Button */}
          <button
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{
              width: '24px',
              height: '24px',
              backgroundColor: '#00b8f8',
              border: 'none',
            }}
          >
            <span
              style={{
                color: 'black',
                fontSize: '0.75rem',
                fontWeight: 'bold',
              }}
            >
              →
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProSection;