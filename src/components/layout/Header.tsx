import { useState, useEffect } from "react";
import ErosLogo from "../../assets/LogoEros.png";
import { useNavigate } from 'react-router-dom';
import Vibration from "../../assets/result-images/add_reaction.png";
import Aura from "../../assets/result-images/background_replace.png";
import StarMap from "../../assets/result-images/brightness_5.png";
import Flame from "../../assets/result-images/mode_heat.png";
import Kosha from "../../assets/result-images/clinical_notes.png";
import Longevity from "../../assets/result-images/ecg_heart.png";

// ── SVG Icon Components (chat tabs etc.) ───────────────────────────────────────

const ReportsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3h18v18H3zM9 9h6M9 12h6M9 15h4"/>
  </svg>
);

const HealthIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);

const AstrologyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
);

const TarotsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2"/>
    <path d="M12 6v4M10 8h4"/>
    <path d="M9 14h6M9 17h4"/>
  </svg>
);

const FaceReadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
    <line x1="9" y1="9" x2="9.01" y2="9"/>
    <line x1="15" y1="9" x2="15.01" y2="9"/>
  </svg>
);

const AttachIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
  </svg>
);

const VoiceIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
    <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
  </svg>
);

const SendIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24"  fill="none " stroke="#FFFFFF" strokeWidth="1.8"  strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const TimerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fe842b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 7v5l3 3"/>
    <path d="M9 2h6"/>
  </svg>
);

// const ErosLogo = () => (
//   <svg width="120" height="40" viewBox="0 0 120 40" fill="none">
//     <text x="0" y="22" fontFamily="Georgia, serif" fontSize="22" fontWeight="700" letterSpacing="1">
//       <tspan fill="#9dcae6">E</tspan>
//       <tspan fill="#c9a0c4">R</tspan>
//       <tspan fill="#e0b7c0">O</tspan>
//       <tspan fill="#a097c7">S</tspan>
//     </text>
//     <text x="1" y="35" fontFamily="'Poppins', sans-serif" fontSize="9" fontWeight="300" fill="#aaa" letterSpacing="3">wellness</text>
//   </svg>
// );

// ── Data ──────────────────────────────────────────────────────────────────────

const cardsData = [
  // { id: 1, icon: ..., title: "Vita Scan", reportType: "vita_scan", route: "/vita-scan" },
  { id: 2, icon: Vibration,   title: "Vibrational\nfrequency", reportType: "vibrational_frequency", route: "/vibrational-frequency" },
  { id: 3, icon: Aura,        title: "Aura Profile",          reportType: "aura_profile",         route: "/aura-profile" },
  { id: 4, icon: StarMap,     title: "Star Map",              reportType: "star_map",             route: "/star-map" },
  { id: 5, icon: Flame,       title: "Flame Score",           reportType: "flame_score",          route: "/flame-score" },
  { id: 6, icon: Kosha,       title: "Kosha Map",             reportType: "kosha_map",            route: "/kosha-map" },
  { id: 7, icon: Longevity,   title: "Longevity\nBlueprint",  reportType: "longevity_blueprint",   route: "/longevity-blueprint" },
];

const chatTabs = [
  { label: "Reports",   Icon: ReportsIcon   },
  { label: "Health",    Icon: HealthIcon    },
  { label: "Astrology", Icon: AstrologyIcon },
  { label: "Tarots",    Icon: TarotsIcon    },
  { label: "Face Read", Icon: FaceReadIcon  },
];

// ── Component ─────────────────────────────────────────────────────────────────

const REPORT_STATUS_API = "https://unrefrangible-eddy-magnanimously.ngrok-free.dev/aitools/wellness/v2/reports/individual_report/";

export const Header = () => {
  const navigate = useNavigate();
  const [chatInput, setChatInput] = useState("");
  const [activeTab, setActiveTab] = useState("Reports");
  const [reportStatuses, setReportStatuses] = useState<Record<string, boolean>>({});
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const userId = localStorage.getItem("userId") || localStorage.getItem("user_id");

  useEffect(() => {
    const fetchStatuses = async () => {
      if (!userId) { setLoadingStatuses(false); return; }
      const statuses: Record<string, boolean> = {};
      try {
        await Promise.all(cardsData.map(async (card) => {
          const res = await fetch(`${REPORT_STATUS_API}?user_id=${userId}&report_type=${card.reportType}`);
          const data = await res.json();
          statuses[card.reportType] = !!(data.success && data.data?.report_data);
        }));
        setReportStatuses(statuses);
      } finally {
        setLoadingStatuses(false);
      }
    };
    fetchStatuses();
  }, [userId]);

  const handleCardAction = (card: (typeof cardsData)[number]) => {
    const hasReport = reportStatuses[card.reportType];
    if (hasReport) {
      navigate("/view-report", { state: { reportType: card.reportType, userId, title: card.title.replace(/\n/g, " ") } });
    } else {
      navigate(card.route);
    }
  };
  const handleSend = () => {
    // Add your message sending logic here
    console.log("Message sent!");
    
    // Navigate to the chat page
    navigate('/ai-chat');
  };
  

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Geist:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .eros-root {
          width: 100%;
          // height: 100vh;
          background: #f0f8ff;
          font-family: 'Poppins', sans-serif;
          overflow-x: hidden;
          position: relative;
          box-sizing: border-box;
        }

        /* ── NAVBAR ── */
        .eros-nav {
          width: 100%;
          height: 70px;
          background: #ffffff;
          position: relative;
          z-index: 1000;
          box-shadow: 0 4px 25px 0 rgba(0,0,0,0.07);
          box-sizing: border-box;
        }
        .eros-nav-container {
          max-width: 1400px;
          width: 100%;
          height: 100%;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 80px;
          box-sizing: border-box;
        }
        .eros-nav-links {
          display: flex;
          gap: 32px;
          align-items: center;
        }
        .eros-nav-link {
          font-size: 15px;
          color: #6b7589;
          font-weight: 400;
          cursor: pointer;
          text-decoration: none;
          transition: color 0.15s;
        }
        .eros-nav-link:hover { color: #0a0a0a; }
        .eros-nav-right { display: flex; align-items: center; gap: 16px; }
        .eros-rasi-btn {
          background: #9dcae6;
          border: none;
          border-radius: 8px;
          padding: 0 22px;
          height: 46px;
          font-size: 15px;
          font-weight: 500;
          color: #fff;
          cursor: pointer;
          font-family: 'Poppins', sans-serif;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: opacity 0.18s, transform 0.18s;
          letter-spacing: 0.1px;
        }
        .eros-rasi-btn:hover { opacity: 0.88; transform: translateY(-1px); }
        .eros-rasi-btn svg { flex-shrink: 0; }

        /* ── BODY ─ */
        .eros-body {
          position: relative;
          z-index: 1;
          width: 100%;
          padding: 0 80px 80px;
          box-sizing: border-box;
          flex: 1
        }
        .eros-inner {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 40px;
        }

        /* ── AI ICON CIRCLE ── */
        .eros-ai-icon {
          width: 62px;
          height: 62px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 0 0 1px rgba(157,202,230,0.3), 0 4px 20px rgba(157,202,230,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0;
          flex-shrink: 0;
        }

        /* ── TITLE BLOCK ── */
        .eros-title-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          // padding-top: 14px;
          margin-bottom: 48px;
        }
        .eros-title {
          font-family: 'Geist', 'Poppins', sans-serif;
          font-weight: 600;
          font-size: 40px;
          letter-spacing: -1.5px;
          line-height: 1.2;
          text-align: center;
          max-width: 600px;
          margin: 0;
        }
        .eros-title-grad {
          background: linear-gradient(135deg, #9dcae6 0%, #e0b7c0 40%, #d29cb9 65%, #a097c7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .eros-title-dark {
          color: #0a0a0a;
          -webkit-text-fill-color: #0a0a0a;
        }
        .eros-subtitle {
          font-size: 15px;
          font-weight: 400;
          color: #475569;
          opacity: 0.7;
          text-align: center;
          line-height: 1.65;
          max-width: 560px;
          margin: 0;
        }

        /* ── CARDS ROW ── */
        .eros-cards-row {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          width: 100%;
          margin-bottom: 56px;
          justify-content: center;
        }
        .eros-card-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
          flex: 1;
          min-width: 0;
          max-width: 160px;
        }

        /* ── CARD BOX ── */
        .eros-card-box {
          width: 100%;
          border: 1.5px solid rgba(255,255,255,0.9);
          border-radius: 22px;
          background:
            linear-gradient(145deg, rgba(157,202,230,0.55) 0%, rgba(255,255,255,0.1) 75%),
            rgba(255,255,255,0.85);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: 0 4px 20px rgba(157,202,230,0.2), 0 1px 4px rgba(0,0,0,0.04);
          padding: 22px 14px 18px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }
        .eros-card-box:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(157,202,230,0.35), 0 2px 8px rgba(0,0,0,0.06);
        }
        .eros-card-icon-wrap {
          width: 32px;
          height: 32px;
          background: rgba(255,255,255,0.9);
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .eros-card-title {
          font-size: 12.5px;
          font-weight: 500;
          color: #0a0a0a;
          text-align: center;
          line-height: 1.55;
          white-space: pre-line;
          min-height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ── CARD BUTTON ── */
        .eros-card-btn {
          background: #9dcae6;
          border: none;
          border-radius: 27px;
          padding: 5px 18px;
          min-width: 110px;
          color: #ffffff;
          font-size: 13px;
          font-weight: 500;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(157,202,230,0.4);
          transition: opacity 0.18s, transform 0.18s, box-shadow 0.18s;
          white-space: nowrap;
          text-align: center;
          line-height: 1.7;
        }
        .eros-card-btn.view {
          background: linear-gradient(135deg, #9dcae6, #a097c7);
        }
        .eros-card-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(157,202,230,0.5);
        }

        /* ── CHAT SECTION ── */
        .eros-chat-section {
          width: 100%;
          max-width: 820px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          align-items: flex-start;
        }

        /* ── TABS ── */
        .eros-tabs-wrap {
          position: relative;
          width: 100%;
        }
        .eros-tabs {
          display: flex;
          gap: 40px;
          align-items: center;
          flex-wrap: nowrap;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: none;
        }
        .eros-tabs::-webkit-scrollbar { display: none; }
        .eros-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 38px;
          padding: 7px 18px 7px 14px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 100px;
          background: rgba(255,255,255,0.6);
          cursor: pointer;
          font-family: 'Poppins', sans-serif;
          font-size: 13.5px;
          font-weight: 400;
          color: #1e0e06;
          opacity: 0.75;
          white-space: nowrap;
          transition: background 0.16s, opacity 0.16s, box-shadow 0.16s, transform 0.16s;
          flex-shrink: 0;
          backdrop-filter: blur(8px);
        }
        .eros-tab:hover {
          background: rgba(255,255,255,0.9);
          opacity: 1;
          transform: translateY(-1px);
          box-shadow: 0 2px 10px rgba(157,202,230,0.25);
        }
        .eros-tab.active {
          background: rgba(255,255,255,0.95);
          opacity: 1;
          box-shadow: 0 2px 10px rgba(157,202,230,0.3);
          border-color: rgba(157,202,230,0.4);
        }
        .eros-tab-fade {
          position: absolute;
          right: 0; top: 0;
          width: 80px; height: 38px;
          background: linear-gradient(to left, #f0f8ff, transparent);
          pointer-events: none;
        }

        /* ── CHAT OUTER ── */
        .eros-chat-outer {
          width: 100%;
          border-radius: 22px;
          background: rgba(255,255,255,0.75);
          border: 1.5px solid rgba(255,255,255,0.9);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,0.6),
            0 8px 32px rgba(157,202,230,0.22),
            0 2px 8px rgba(0,0,0,0.04);
          overflow: hidden;
          position: relative;
        }
        .eros-chat-outer::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(157,202,230,0.12) 0%, rgba(255,255,255,0) 60%);
          pointer-events: none;
          z-index: 0;
          border-radius: 22px;
        }
        .eros-chat-inner-wrap {
          position: relative;
          z-index: 1;
          padding: 14px 10px 0;
          background:#9dcae6;
        }

        /* ── FREE TRIAL ROW ── */
        .eros-trial-row {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 0 6px;
          margin-bottom: 2px;
        }
        .eros-trial-text {
          font-size: 13.5px;
          font-weight: 400;
          color: #1a1a1a;
          letter-spacing: -0.1px;
          line-height: 1.6;
        }

        /* ── CHAT INPUT CARD ── */
        .eros-chat-card {
          position: relative;
          width: 100%;
          background: rgba(255,255,255,0.95);
          border: 1.5px solid rgba(220,220,220,0.4);
          border-radius: 18px;
          min-height: 100px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          margin-top: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .eros-chat-ta {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          font-family: 'Poppins', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: #222;
          resize: none;
          line-height: 1.6;
          min-height: 52px;
          max-height: 80px;
          padding: 12px 16px 4px;
          letter-spacing: -0.1px;
        }
        .eros-chat-ta::placeholder { color: #aaa; }


        .eros-logo {
  width: 120px;   /* adjust based on your design */
  height: auto;
  object-fit: contain;
}

        /* ── CHAT ACTIONS ── */
        .eros-chat-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 12px 12px;
        }
        .eros-chat-left { display: flex; align-items: center; gap: 8px; }
        .eros-chat-right { display: flex; align-items: center; gap: 8px; }
        .eros-action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 24px;
          background: transparent;
          cursor: pointer;
          font-family: 'Poppins', sans-serif;
          font-size: 12.5px;
          font-weight: 400;
          color: #555;
          transition: background 0.15s;
          height: 30px;
          white-space: nowrap;
        }
        .eros-action-btn:hover { background: rgba(157,202,230,0.1); }
        // .eros-send-btn {
        //     display: flex;
        //   align-items: center;
        //   gap: 6px;
        //   padding: 6px 14px;
        //   border: 1px solid rgba(0,0,0,0.1);
        //   border-radius: 24px;
        //   background: transparent;
        //   cursor: pointer;
        //   font-family: 'Poppins', sans-serif;
        //   font-size: 12.5px;
        //   font-weight: 400;
        //   color: #555;
        //   transition: background 0.15s;
        //   height: 30px;
        //   white-space: nowrap;
        //   background:"#9dcae6"
        // }

        .eros-send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 20px; /* Increased horizontal padding for the pill shape */
  
  /* Background and Border */
  background-color: #9dcae6; 
  border: none;
  border-radius: 100px; /* Ensures a perfect pill shape */
  
  /* Text and Icon Styling */
  color: #ffffff; 
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 500;
  
  /* Sizing */
  height: 38px;
  min-width: 100px;
  cursor: pointer;
  white-space: nowrap;
  
  /* Smooth interaction */
  transition: opacity 0.2s ease, transform 0.1s ease;
}

.eros-send-btn:hover {
  opacity: 0.9;
}

.eros-send-btn:active {
  transform: scale(0.98);
}
        .eros-send-btn:hover { transform: scale(1.08); opacity: 0.92; }

        /* ── RESPONSIVE ── */
        @media (max-width: 1100px) {
          .eros-nav { padding: 0 40px; }
          .eros-body { padding: 0 40px 80px; }
        }
        @media (max-width: 900px) {
          .eros-nav { padding: 0 24px; }
          .eros-nav-links { display: none; }
          .eros-body { padding: 0 20px 60px; }
          .eros-title { font-size: 30px; }
          .eros-cards-row { flex-wrap: wrap; justify-content: flex-start; }
          .eros-card-col { flex: 0 0 calc(33.3% - 10px); max-width: none; }
        }
        @media (max-width: 600px) {
          .eros-nav { height: 68px; }
          .eros-card-col { flex: 0 0 calc(50% - 8px); }
          .eros-title { font-size: 24px; letter-spacing: -0.8px; }
        }
      `}</style>

      <div className="eros-root">

        {/* ── NAVBAR ── */}
        <nav className="eros-nav">
          <div className="eros-nav-container">
            <img src={ErosLogo} alt="Eros Wellness Logo" className="eros-logo" />

            <div className="eros-nav-links">
              {[
                { label: "Header", id: "header" },
                { label: "Vita Scan", id: "vita-scan" },
                { label: "Reports", id: "reports" },
                { label: "Lucky Section", id: "lucky" },
                { label: "Explore Sections", id: "explore" },
                { label: "About", id: "footer" },
              ].map((link) => (
                <span 
                  key={link.label} 
                  className="eros-nav-link"
                  onClick={() => document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {link.label}
                </span>
              ))}
            </div>

            <div className="eros-nav-right">
              <button className="eros-rasi-btn" onClick={() => navigate('/rasi-chart')}>
                Rasi Chart
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
                </svg>
              </button>
            </div>
          </div>
        </nav>

        {/* ── BODY ── */}
        <div className="eros-body">
          <div className="eros-inner">

            {/* AI Icon Circle */}
            {/* <div className="eros-ai-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#9dcae6"/>
                    <stop offset="50%" stopColor="#d29cb9"/>
                    <stop offset="100%" stopColor="#a097c7"/>
                  </linearGradient>
                </defs>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="url(#aiGrad)" opacity="0.15"/>
                <path d="M8 12h8M12 8v8" stroke="url(#aiGrad)" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="3" stroke="url(#aiGrad)" strokeWidth="1.5" fill="none"/>
              </svg>
            </div> */}

            {/* Title + Subtitle */}
            <div className="eros-title-block">
              <h1 className="eros-title">
                <span className="eros-title-grad">EROS Wellness</span>
                <span className="eros-title-dark"> – AI-driven holistic growth.</span>
              </h1>
              <p className="eros-subtitle">
                Your personal AI spiritual companion — illuminating your path through astrology,
                energy readings, and ancient wisdom tailored uniquely for you.
              </p>
            </div>

            {/* ── CARDS ── */}
            <div className="eros-cards-row">
              {cardsData.map((card) => {
                const hasReport = reportStatuses[card.reportType];
                const buttonLabel = loadingStatuses ? "..." : hasReport ? "View report" : "Generate";
                return (
                  <div key={card.id} className="eros-card-col">
                    <div
                      className="eros-card-box"
                      onClick={() => handleCardAction(card)}
                      onKeyDown={(e) => e.key === "Enter" && handleCardAction(card)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="eros-card-icon-wrap">
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            maskImage: `url(${card.icon})`,
                            maskSize: "contain",
                            maskRepeat: "no-repeat",
                            maskPosition: "center",
                            WebkitMaskImage: `url(${card.icon})`,
                            WebkitMaskSize: "contain",
                            WebkitMaskRepeat: "no-repeat",
                            WebkitMaskPosition: "center",
                            backgroundColor: "#A097C7",
                          }}
                          title={card.title.replace(/\n/g, " ")}
                          aria-hidden
                        />
                      </div>
                      <div className="eros-card-title">{card.title}</div>
                    </div>
                    <button
                      type="button"
                      className={`eros-card-btn${hasReport ? " view" : ""}`}
                      onClick={(e) => { e.stopPropagation(); handleCardAction(card); }}
                    >
                      {buttonLabel}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* ── CHAT SECTION ── */}
            <div className="eros-chat-section">

              {/* Tabs */}
              <div className="eros-tabs-wrap">
                <div className="eros-tabs">
                  {chatTabs.map((tab) => (
                    <button
                      key={tab.label}
                      className={`eros-tab${activeTab === tab.label ? " active" : ""}`}
                      onClick={() => setActiveTab(tab.label)}
                    >
                      <tab.Icon />
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="eros-tab-fade" />
              </div>

              {/* Chat Outer */}
              <div className="eros-chat-outer">
                <div className="eros-chat-inner-wrap">

                  {/* Free Trial Row */}
                  <div className="eros-trial-row">
                    <TimerIcon />
                    <span className="eros-trial-text">Free Trial explore it soon</span>
                  </div>

                  {/* Chat Input Card */}
                  <div className="eros-chat-card">
                    <textarea
                      className="eros-chat-ta"
                      placeholder="Ask me anything..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      rows={2}
                    />
                    <div className="eros-chat-actions">
                      <div className="eros-chat-left">
                        <button className="eros-action-btn">
                          <AttachIcon /> Attach
                        </button>
                      </div>
                      <div className="eros-chat-right">
                        <button className="eros-action-btn">
                          <VoiceIcon /> Voice
                        </button>
                        <button className="eros-send-btn" aria-label="Send" onClick={handleSend}>
                          <SendIcon />Send
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </>
  );
};

export default Header;