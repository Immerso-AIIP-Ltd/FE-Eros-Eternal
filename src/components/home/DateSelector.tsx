// src/components/DateSelector.tsx
import React from 'react';

export const DateSelector: React.FC = () => {
  const dates = [
    { date: "20 August", active: false },
    { date: "21 August", active: true },
    { date: "22 August", active: false },
    { date: "23 August", active: false },
    { date: "24 August", active: false },
    { date: "25 August", active: false },
  ];

  return (
    <div
      className="d-flex gap-2 pb-2"
      style={{
        overflowX: 'auto',
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE/Edge
        WebkitOverflowScrolling: 'touch',
        padding: '0 2px',
        marginTop:"30px"
        // margin: '0 -2px', 
      }}
    >
      {/* Hide scrollbar in WebKit browsers */}
      <style >{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {dates.map((item, index) => (
        <button
          key={index}
          className="btn flex-shrink-0"
          style={{
            padding: '0.6rem 1rem',
            minWidth: '100px', // Prevents squishing
            backgroundColor: item.active ? '#00b8f8' : '#2a2e30',
            color: item.active ? 'black' : '#9ca3af',
            border: 'none',
            borderRadius: '9999px', // pill shape
            fontSize: '0.875rem',
            fontWeight: item.active ? '600' : '400',
            whiteSpace: 'nowrap',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!item.active) {
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.backgroundColor = '#3a3e40';
            }
          }}
          onMouseLeave={(e) => {
            if (!item.active) {
              e.currentTarget.style.color = '#9ca3af';
              e.currentTarget.style.backgroundColor = '#2a2e30';
            }
          }}
        >
          {item.date}
        </button>
      ))}
    </div>
  );
};

export default DateSelector;