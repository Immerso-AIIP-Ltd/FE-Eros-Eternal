// src/components/ExploreSection.tsx
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Import images
import tarot from '../assets/explore/tarrot.png';
import harmonyindex from '../assets/explore/harmony.png';
import palm from '../assets/explore/palmistry.jpg';
import facescan from '../assets/explore/face.png';
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setHasMoved(false);
    setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollContainerRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    
    // If moved more than 5 pixels, consider it a drag
    if (Math.abs(walk) > 5) {
      setHasMoved(true);
    }
    
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const items: ExploreItem[] = [
    {
      title: "Tarot Reading",
      subtitle: "Love tarot reading for singles and couples",
      image: tarot,
      onClick: () => navigate('/card'),
      locked: false,
    },
    {
      title: "Palm Reading",
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
  ];

  return (
    <div style={{ 
      paddingBottom: '2rem', 
      width: '100vw',
      // paddingTop: '1rem',
      paddingLeft: '1rem',
      paddingRight: '1rem'
    }}>
      {/* Header */}
      <div className="header" style={{ 
        marginBottom: '1.5rem',
        paddingLeft: '1.5rem'
      }}>
        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: 600,
          color: '#ffffff',
          fontFamily: "Poppins, sans-serif",
          margin: 0,
          letterSpacing: '-0.02em',
        }}>
          Explore More
        </h1>
      </div>

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="cards-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          display: 'flex',
          gap: '24px',
          overflowX: 'auto',
          scrollBehavior: isDragging ? 'auto' : 'smooth',
          cursor: isDragging ? 'grabbing' : 'grab',
          paddingBottom: '2rem',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          width: '100%',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
        }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className="card-item"
            onClick={(e) => {
              // Only navigate if we haven't moved (not a drag)
              if (!hasMoved && item.onClick) {
                item.onClick();
              }
            }}
            role="button"
            tabIndex={item.onClick ? 0 : -1}
            aria-label={item.locked ? `${item.title} - Coming Soon` : item.title}
            style={{
              flex: '0 0 800px',
              width:"100vw",
              // minWidth: '320px',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              cursor: item.onClick && !isDragging ? 'pointer' : isDragging ? 'grabbing' : 'grab',
              position: 'relative',
              fontFamily: "DM Sans, sans-serif",
              fontSize: "16px",
              borderRadius: "16px",
              backgroundColor: "#1a1d1f",
              overflow: "hidden",
              height: '450px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            }}
            onMouseEnter={(e) => {
              if (item.onClick && !isDragging) {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
            }}
          >
            {/* Image */}
            <img
              src={item.image}
              alt={item.title}
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />

            {/* Gradient Overlay - Subtle */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.7) 85%, rgba(0,0,0,0.9) 100%)",
                zIndex: 1,
                pointerEvents: 'none',
              }}
            />

            {/* Text Content with Strong Blur */}
            <div
              className="text-content"
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "1.5rem 1.5rem 1.75rem",
                background: "rgba(15, 18, 20, 0.6)",
                backdropFilter: "blur(12px) saturate(180%)",
                WebkitBackdropFilter: "blur(12px) saturate(180%)",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                zIndex: 5,
                pointerEvents: 'none',
              }}
            >
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  marginBottom: '0.5rem',
                  fontFamily: "Poppins, sans-serif",
                  lineHeight: 1.3,
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  fontSize: '0.9rem',
                  color: 'rgba(255, 255, 255, 0.85)',
                  margin: 0,
                  lineHeight: 1.5,
                  fontFamily: "DM Sans, sans-serif",
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
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
                  background: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  color: 'white',
                  zIndex: 10,
                }}
              >
                <i
                  className="bi bi-lock-fill"
                  style={{ fontSize: '2.5rem', color: '#ccc', marginBottom: '12px' }}
                ></i>
                <p
                  style={{
                    fontSize: '1rem',
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
      <style>{`
        .cards-container::-webkit-scrollbar {
          display: none;
        }

        .card-item {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
                      box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @media (max-width: 1024px) {
          .cards-container {
            gap: 16px;
            padding: 0 1rem;
          }
          
          .card-item {
            flex: 0 0 280px;
            height: 340px;
          }
          
          .text-content {
            padding: 1.25rem;
          }
          
          h3 {
            font-size: 1.125rem;
          }
          
          p {
            font-size: 0.85rem;
          }
        }

        @media (max-width: 768px) {
          .cards-container {
            gap: 12px;
            padding: 0 0.75rem;
          }
          
          .card-item {
            flex: 0 0 260px;
            height: 320px;
          }
          
          .text-content {
            padding: 1.1rem;
          }
          
          h3 {
            font-size: 1.05rem;
          }
          
          p {
            font-size: 0.8rem;
          }
        }
        
        @media (max-width: 600px) {
          .cards-container {
            gap: 10px;
            padding: 0 0.5rem;
          }
          
          .card-item {
            flex: 0 0 240px;
            height: 300px;
          }
          
          h3 {
            font-size: 0.95rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ExploreSection;