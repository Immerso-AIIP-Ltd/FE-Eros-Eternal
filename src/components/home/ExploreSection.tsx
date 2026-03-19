// src/components/ExploreSection.tsx
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import tarot from "@/assets/images/lighttarrot.png";
import palm from "@/assets/images/lightpalm.png";
import harmonyindex from "@/assets/images/lightharmony.png";
import facescan from "@/assets/images/lightface.png";

interface ExploreItem {
  title: string;
  subtitle: string;
  image: string;
  onClick?: () => void;
  locked: boolean;
}

export const ExploreSection: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
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
    if (Math.abs(walk) > 5) setHasMoved(true);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  const items: ExploreItem[] = [
    {
      title: "Tarot Reading",
      subtitle: "Clarity through symbolic guidance and intuitive insight. Find direction and meaning for your path ahead.",
      image: tarot,
      onClick: () => navigate('/card'),
      locked: false,
    },
    {
      title: "Palmistry",
      subtitle: "Your hands reveal how you navigate life.Discover insights into your path, choices, and potential.",
      image: palm,
      onClick: () => navigate('/palmcard'),
      locked: false,
    },
    {
      title: "Harmony Index",
      subtitle: "Discover Your Inner Balance & Energy Alignment",
      image: harmonyindex,
      onClick: () => navigate('/harmoneyi'),
      locked: false,
    },
    {
      title: "Face Reading",
      subtitle: "Your face reflects your inner nature and life patterns. Discover traits, tendencies, and what shapes your path.",
      image: facescan,
      onClick: () => navigate('/facereading'),
      locked: false,
    },
  ];

  return (
    <div
      style={{
        padding: embedded ? 0 : "56px 24px 64px",
        backgroundColor: embedded ? "transparent" : "#ffffff",
        fontFamily: "'Poppins', sans-serif",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

        .explore-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          width: 100%;
          max-width: 100%;
          margin: 0;
          cursor: default;
        }

        .explore-card {
          background: #ffffff;
          border: 1px solid #ebebeb;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          position: relative;
        }

        .explore-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 28px rgba(0,0,0,0.11);
        }

        .explore-card-img {
          width: 100%;
          height: 200px;
          object-fit: cover;
          display: block;
          background: #f4f4f4;
          user-select: none;
          pointer-events: none;
        }

        .explore-card-body {
          padding: 18px 18px 22px;
        }

        .explore-card-title {
          font-size: 17px;
          font-weight: 500;
          color: #0d1020;
          margin: 0 0 8px;
          font-family: 'Poppins', sans-serif;
          line-height: 1.3;
          letter-spacing: -0.01em;
        }

        .explore-card-subtitle {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
          line-height: 1.6;
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
        }

        /* Scrollable on mobile */
        .explore-scroll-wrapper {
          display: none;
        }

        /* Lock overlay */
        .explore-lock-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #fff;
          z-index: 10;
          text-align: center;
        }

        @media (max-width: 1024px) {
          .explore-cards-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 600px) {
          .explore-cards-grid {
            display: none !important;
          }
          .explore-scroll-wrapper {
            display: flex !important;
            gap: 14px;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            padding-bottom: 8px;
            cursor: grab;
          }
          .explore-scroll-wrapper::-webkit-scrollbar { display: none; }
          .explore-scroll-wrapper .explore-card {
            flex: 0 0 80vw;
            min-width: 80vw;
            scroll-snap-align: start;
          }
          .explore-card-img {
            height: 160px !important;
          }
        }
      `}</style>

      {/* Centered Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "44px",
          maxWidth: "600px",
          margin: "0 auto 44px",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 600,
            color: "#0d1020",
            margin: "0 0 14px",
            letterSpacing: "-0.025em",
            fontFamily: "'Inter', sans-serif",
            lineHeight: 1.15,
          }}
        >
          Explore More
        </h1>
        <p
          style={{
            fontSize: "14.5px",
            color: "#8a8aa0",
            margin: 0,
            lineHeight: 1.65,
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 400,
          }}
        >
         Discover Destiny Through Tarot, Palms, Harmony & Face Insights
        </p>
      </div>

      {/* Desktop Grid — 4 cards */}
      <div className="explore-cards-grid">
        {items.map((item, index) => (
          <div
            key={index}
            className="explore-card"
            onClick={() => { if (item.onClick) item.onClick(); }}
            role="button"
            tabIndex={item.onClick ? 0 : -1}
            aria-label={item.locked ? `${item.title} - Coming Soon` : item.title}
          >
            <img
              src={item.image}
              alt={item.title}
              className="explore-card-img"
              draggable={false}
            />
            <div className="explore-card-body">
              <h3 className="explore-card-title">{item.title}</h3>
              <p className="explore-card-subtitle">{item.subtitle}</p>
            </div>
            {item.locked && (
              <div className="explore-lock-overlay">
                <i className="bi bi-lock-fill" style={{ fontSize: "2.5rem", color: "#ccc", marginBottom: "12px" }} />
                <p style={{ fontSize: "1rem", fontWeight: 500, margin: 0 }}>Coming Soon</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile horizontal scroll */}
      <div
        className="explore-scroll-wrapper"
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className="explore-card"
            onClick={() => { if (!hasMoved && item.onClick) item.onClick(); }}
          >
            <img
              src={item.image}
              alt={item.title}
              className="explore-card-img"
              draggable={false}
            />
            <div className="explore-card-body">
              <h3 className="explore-card-title">{item.title}</h3>
              <p className="explore-card-subtitle">{item.subtitle}</p>
            </div>
            {item.locked && (
              <div className="explore-lock-overlay">
                <i className="bi bi-lock-fill" style={{ fontSize: "2.5rem", color: "#ccc", marginBottom: "12px" }} />
                <p style={{ fontSize: "1rem", fontWeight: 500, margin: 0 }}>Coming Soon</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExploreSection;