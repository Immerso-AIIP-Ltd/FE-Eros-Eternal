import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Vibration from "../../assets/result-images/add_reaction.png";
import Aura from "../../assets/result-images/background_replace.png";
import StarMap from "../../assets/result-images/brightness_5.png";
import Flame from "../../assets/result-images/mode_heat.png";
import Kosha from "../../assets/result-images/clinical_notes.png";
import Longevity from "../../assets/result-images/ecg_heart.png";

const ArrowIcon = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
    <path
      d="M2 10 L10 2 M10 2 H5 M10 2 V7"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const cardsData = [
  { id: 2, icon: Vibration, title: "Vibrational Frequency", description: "Analyze your energetic resonance and frequency levels.", reportType: "vibrational_frequency", route: "/vibrational-frequency" },
  { id: 3, icon: Aura, title: "Aura Profile", description: "Discover the colors and layers of your personal aura field.", reportType: "aura_profile", route: "/aura-profile" },
  { id: 4, icon: StarMap, title: "Star Map", description: "Map your celestial alignment and cosmic origin points.", reportType: "star_map", route: "/star-map" },
  { id: 5, icon: Flame, title: "Flame Score", description: "Measure your inner vitality and passionate drive.", reportType: "flame_score", route: "/flame-score" },
  { id: 6, icon: Kosha, title: "Kosha Map", description: "Navigate the five layers of your physical and spiritual body.", reportType: "kosha_map", route: "/kosha-map" },
  { id: 7, icon: Longevity, title: "Longevity Blueprint", description: "Actionable insights for a longer, healthier, conscious life.", reportType: "longevity_blueprint", route: "/longevity-blueprint" },
];

const WellnessCard = ({ icon, title, description, hasReport, loading, onCardClick }: any) => {
  const displayButtonText = loading ? "..." : hasReport ? "View report" : "Generate";

  return (
    <div
      onClick={onCardClick}
      style={{
        borderRadius: "18px",
        padding: "18px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        cursor: "pointer",
        // RESTORED GRADIENT
        background: "linear-gradient(139.22deg, #ffffff 44.67%, #00b8f8 241.29%)",
        boxShadow: "8px 4px 25px 0 rgba(0, 0, 0, 0.06)",
        border: "1px solid rgba(255,255,255,0.9)",
        height: "100%",
        transition: "all 0.2s ease",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <div style={{ width: 34, height: 34, borderRadius: "10px", background: "#9DCAE6", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px" }}>
        <img src={icon} alt={title} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
      <div>
        <h3 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: 700, color: "#1a2a3a" }}>{title}</h3>
        <p style={{ margin: 0, fontSize: "11.5px", color: "#6b8aa0", lineHeight: 1.45 }}>{description}</p>
      </div>
      <div style={{ marginTop: "auto" }}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onCardClick(); }}
          style={{ 
            display: "inline-flex", alignItems: "center", gap: "6px", background: "#9dcae6", 
            border: "none", borderRadius: "20px", padding: "7px 15px", color: "#fff", 
            fontSize: "11.5px", fontWeight: 600, cursor: "pointer",
            boxShadow: "0 4px 10px rgba(74, 164, 227, 0.2)"
          }}
        >
          {displayButtonText}
          <ArrowIcon />
        </button>
      </div>
    </div>
  );
};

export default function ErosWellnessReports() {
  const navigate = useNavigate();
  const [reportStatuses, setReportStatuses] = useState<Record<string, boolean>>({});
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const userId = localStorage.getItem("userId") || localStorage.getItem("user_id");

  useEffect(() => {
    const fetchStatuses = async () => {
      if (!userId) { setLoadingStatuses(false); return; }
      const statuses: Record<string, boolean> = {};
      try {
        await Promise.all(cardsData.map(async (card) => {
          const res = await fetch(`https://unrefrangible-eddy-magnanimously.ngrok-free.dev/aitools/wellness/v2/reports/individual_report/?user_id=${userId}&report_type=${card.reportType}`);
          const data = await res.json();
          statuses[card.reportType] = !!(data.success && data.data?.report_data);
        }));
        setReportStatuses(statuses);
      } finally { setLoadingStatuses(false); }
    };
    fetchStatuses();
  }, [userId]);

  return (
    <div style={{
      height: "100vh",
      width: "100vw",
      background: "#FFFFFFF",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
      padding: "20px",
      boxSizing: "border-box",
      fontFamily: "'Poppins', sans-serif"
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');`}</style>

      <header style={{ textAlign: "center", marginBottom: "4vh" }}>
        <h1 style={{ margin: 0, fontSize: "min(34px, 5.5vh)", fontWeight: 700, color: "#0d1f2d", lineHeight: 1.2 }}>
          EROS Wellness Intelligence Reports
        </h1>
        <p style={{ margin: "1vh auto 0", fontSize: "13px", color: "#7a99b0", maxWidth: "450px" }}>
          Advanced AI-powered reports decoding your energy, soul alignment, and inner potential.
        </p>
      </header>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "18px",
        width: "100%",
        maxWidth: "880px",
        maxHeight: "70vh", 
      }}>
        {cardsData.map((card) => (
          <WellnessCard
            key={card.id}
            {...card}
            hasReport={reportStatuses[card.reportType]}
            loading={loadingStatuses}
            onCardClick={() => {
                if (reportStatuses[card.reportType]) {
                    navigate("/view-report", { state: { reportType: card.reportType, userId, title: card.title } });
                } else { navigate(card.route); }
            }}
          />
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns"] { grid-template-columns: repeat(2, 1fr) !important; overflow-y: auto; }
        }
        @media (max-width: 480px) {
          div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
          h1 { font-size: 24px !important; }
        }
      `}</style>
    </div>
  );
}