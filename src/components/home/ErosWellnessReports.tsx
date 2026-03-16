import { useState } from "react";
import Vibration from "../../assets/result-images/add_reaction.png";
import Aura from "../../assets/result-images/add_reaction.png";
import StarMap from "../../assets/result-images/add_reaction.png";
import Flame from "../../assets/result-images/add_reaction.png";
import Kosha from "../../assets/result-images/add_reaction.png";
import Longevity from "../../assets/result-images/add_reaction.png";
import VitaScan from "../../assets/result-images/add_reaction.png";

const ArrowIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 10 L10 2 M10 2 H5 M10 2 V7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const cardsData = [
  {
    id: 2,
    icon: Vibration,
    title: "Vibrational Frequency",
    description: "Lorem ipsum dolor sit amet consectetur. Ac purus nulla mattis vel.",
    buttonText: "Get Started",
  },
  {
    id: 3,
    icon: Aura,
    title: "Aura Profile",
    description: "Lorem ipsum dolor sit amet consectetur. Ac purus nulla mattis vel.",
    buttonText: "Get Started",
  },
  {
    id: 4,
    icon: StarMap,
    title: "Star Map",
    description: "Lorem ipsum dolor sit amet consectetur. Ac purus nulla mattis vel.",
    buttonText: "Get Started",
  },
  {
    id: 5,
    icon: Flame,
    title: "Flame Score",
    description: "Lorem ipsum dolor sit amet consectetur. Ac purus nulla mattis vel.",
    buttonText: "Get Started",
  },
  {
    id: 6,
    icon: Kosha,
    title: "Kosha Map",
    description: "Lorem ipsum dolor sit amet consectetur. Ac purus nulla mattis vel.",
    buttonText: "Get Started",
  },
  {
    id: 7,
    icon: Longevity,
    title: "Longevity Blueprint",
    description: "Lorem ipsum dolor sit amet consectetur. Ac purus nulla mattis vel.",
    buttonText: "Get Started",
  },
];

const WellnessCard = ({ icon, title, description, buttonText, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        background: hovered
          ? "linear-gradient(145deg, #d6eefa 0%, #b8dff5 100%)"
          : "linear-gradient(145deg, #e8f6fd 0%, #ceeaf8 100%)",
        borderRadius: "20px",
        padding: "24px 22px 22px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        cursor: "pointer",
        transition: "all 0.25s ease",
        boxShadow: hovered
          ? "0 8px 28px rgba(74, 164, 227, 0.22), 0 2px 8px rgba(74, 164, 227, 0.1)"
          : "0 4px 16px rgba(74, 164, 227, 0.1), 0 1px 4px rgba(74, 164, 227, 0.06)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        border: "1px solid rgba(255,255,255,0.9)",
        minHeight: "180px",
      }}
    >
      {/* Icon Image */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "10px",
          background: "#9DCAE6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "6px",
          boxShadow: "0 2px 8px rgba(74, 164, 227, 0.15)",
        }}
      >
        <img
          src={icon}
          alt={title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </div>

      {/* Title & Description */}
      <div>
        <h3
          style={{
            margin: 0,
            fontSize: "15px",
            fontWeight: 700,
            color: "#1a2a3a",
            fontFamily: "'Poppins', sans-serif",
            lineHeight: 1.3,
            marginBottom: "6px",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "12.5px",
            color: "#6b8aa0",
            lineHeight: 1.55,
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 400,
          }}
        >
          {description}
        </p>
      </div>

      {/* Button */}
      <div style={{ marginTop: "auto" }}>
        <button
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            background: "linear-gradient(135deg, #89dbff 0%, #4aa4e3 100%)",
            border: "none",
            borderRadius: "20px",
            padding: "8px 18px",
            color: "#fff",
            fontSize: "12.5px",
            fontWeight: 600,
            fontFamily: "'Poppins', sans-serif",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(74, 164, 227, 0.35)",
            transition: "all 0.2s ease",
            letterSpacing: "0.01em",
          }}
        >
          {buttonText}
          <ArrowIcon />
        </button>
      </div>
    </div>
  );
};

export default function ErosWellnessReports() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f9fd",
        fontFamily: "'Poppins', sans-serif",
        padding: "48px 24px 60px",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(24px, 4vw, 34px)",
            fontWeight: 600,
            color: "#0d1f2d",
            fontFamily: "'Inter', sans-serif",
            lineHeight: 1.25,
          }}
        >
          EROS Wellness<br />Intelligence Reports
        </h1>
        <p
          style={{
            margin: "12px auto 0",
            fontSize: "13.5px",
            color: "#7a99b0",
            maxWidth: "360px",
            lineHeight: 1.6,
            fontWeight: 400,
          }}
        >
          Advanced AI-powered reports decoding your energy, soul alignment, and inner potential for conscious growth.
        </p>
      </div>

      {/* Card Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          maxWidth: "860px",
          margin: "0 auto",
        }}
      >
        {cardsData.map((card) => (
          <WellnessCard
            key={card.id}
            icon={card.icon}
            title={card.title}
            description={card.description}
            buttonText={card.buttonText}
            onClick={() => console.log(`Navigate to: ${card.title}`)}
          />
        ))}
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 700px) {
          div[style*="repeat(3, 1fr)"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 460px) {
          div[style*="repeat(3, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}