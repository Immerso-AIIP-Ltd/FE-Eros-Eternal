// src/components/ExploreSection.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Import images
import tarot from '../tarrotfull.png';
import harmonyindex from '../harmonyindex.png';
import palm from '../palm.png';
import facescan from '../facescan.png';
import angel from '../vintage.png';

interface ExploreItem {
  title: string;
  subtitle: string;
  image: string;
  onClick?: () => void;
  locked: boolean;
}

export const ExploreSection: React.FC = () => {
  const navigate = useNavigate();

  const items: ExploreItem[] = [
    {
      title: "Tarot Reading",
      subtitle: "Love tarot reading for singles and couples",
      image: tarot,
      onClick: () => navigate('/card'),
      locked: false,
    },
    {
      title: "Palmistry",
      subtitle: "Unlock insights and energy balance through the wisdom of your palms",
      image: palm,
      onClick: () => navigate('/palmcard'),
      locked: false,
    },
    {
      title: "Harmony Index",
      subtitle: "Discover your true biological age and vitality",
      image: harmonyindex,
      onClick: () => navigate('/harmoneyi'),
      locked: false,
    },
    {
      title: "Face Scan",
      subtitle: "Face Scan for your spiritual journey",
      image: facescan,
      onClick: () => navigate('/facereading'),
      locked: false,
    },
    // {
    //   title: "Angel Cards",
    //   subtitle: "Angel guidance for your spiritual journey",
    //   image: angel,
    //   onClick: undefined,
    //   locked: true,
    // },
  ];

  return (
    <div>
      {/* Header */}
      <h2
        className="mb-0"
        style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#ffffff',
          fontFamily:"Poppins"
        }}
      >
        Explore More
      </h2>

      {/* Horizontal Scroll Container */}
      <div
        className="horizontal-scroll"
        style={{
          display: 'flex',
          overflowX: 'auto',
          gap: '1rem',
          padding: '0 0.5rem',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          whiteSpace: 'nowrap',
          marginTop: '1rem',
          paddingBottom: '1rem',
        }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className="card-item"
            onClick={item.onClick}
            role="button"
            tabIndex={item.onClick ? 0 : -1}
            aria-label={item.locked ? `${item.title} - Coming Soon` : item.title}
            style={{
              minWidth: '300px',
              flexShrink: 0,
              borderRadius: '12px',
              backgroundColor: '#1e2123',
              overflow: 'hidden',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              cursor: item.onClick ? 'pointer' : 'not-allowed',
              position: 'relative',
              fontFamily:"DM Sans",
              fontSize:"16px",
            }}
            onMouseEnter={(e) => {
              if (item.onClick) {
                e.currentTarget.style.backgroundColor = '#2a2e30';
              }
            }}
            onMouseLeave={(e) => {
              if (item.onClick) {
                e.currentTarget.style.backgroundColor = '#1e2123';
              }
            }}
          >
            {/* Image */}
            <img
              src={item.image}
              alt={item.title}
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                // marginTop:"20px"
              }}
            />

            {/* Text Content */}
            <div
              className="text-content"
              style={{
                padding: '1rem',
              }}
            >
              <h3
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'white',
                  marginBottom: '0.5rem',
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#9ca3af',
                  margin: 0,
                }}
              >
                {item.subtitle}
              </p>
            </div>

            {/* Lock Overlay */}
            {item.locked && (
              <div
                className="lock-overlay"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 70%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  padding: '16px',
                  textAlign: 'center',
                  color: 'white',
                  zIndex: 10,
                }}
              >
                <i
                  className="bi bi-lock-fill"
                  style={{ fontSize: '2rem', color: '#ccc', marginBottom: '8px' }}
                ></i>
                <p
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  Coming Soon
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Injected Styles */}
      <style jsx>{`
        .horizontal-scroll::-webkit-scrollbar {
          display: none;
        }

        .card-item:hover {
          transform: scale(1.02);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }

        .card-item img {
          width: 100%;
          height: 200px;
          object-fit: conatin;
        }

        .card-item .text-content {
          padding: 1rem;
        }

        .card-item h3 {
          font-size: 0.9rem;
          font-weight: 600;
          color: white;
          margin-bottom: 0.5rem;
        }

        .card-item p {
          font-size: 0.75rem;
          color: #9ca3af;
          margin: 0;
        }

        .lock-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 70%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: center;
          padding: 16px;
          text-align: center;
          color: white;
          z-index: 10;
        }

        .lock-overlay i {
          font-size: 2rem;
          color: #ccc;
          margin-bottom: 8px;
        }

        .lock-overlay p {
          font-size: 0.95rem;
          font-weight: 500;
          margin: 0;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
};

export default ExploreSection;