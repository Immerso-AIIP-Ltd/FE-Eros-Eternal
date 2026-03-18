import { useState } from "react";
import ErosLogo from "../../assets/LogoEros.png";
import { useNavigate } from 'react-router-dom';

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

const chatTabs = [
  { label: "Reports",   Icon: ReportsIcon   },
  { label: "Health",    Icon: HealthIcon    },
  { label: "Astrology", Icon: AstrologyIcon },
  { label: "Tarots",    Icon: TarotsIcon    },
  { label: "Face Read", Icon: FaceReadIcon  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export const Header = () => {
  const navigate = useNavigate();
  const [chatInput, setChatInput] = useState("");
  const [activeTab, setActiveTab] = useState("Reports");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleSend = () => {
    // Add your message sending logic here
    console.log("Message sent!");
    
    // Navigate to the chat page
    navigate('/ai-chat');
  };
  
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    const nav = document.querySelector(".eros-nav") as HTMLElement | null;
    const navHeight = nav?.getBoundingClientRect().height ?? 0;
    const computedStyle = window.getComputedStyle(element);
    const paddingTop = Number.parseFloat(computedStyle.paddingTop || "0") || 0;
    const y = element.getBoundingClientRect().top + window.scrollY - navHeight - 0 + paddingTop;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    setMobileNavOpen(false);
  };


  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Geist:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .eros-root {
          width: 100%;
          background: #f0f8ff;
          font-family: 'Poppins', sans-serif;
          overflow-x: hidden;
          position: relative;
          box-sizing: border-box;
          min-height: 100vh;
        }

        /* Desktop only: relaxed root height so content flows naturally */
        @media (min-width: 1024px) {
          .eros-root { min-height: auto; }
        }

        /* ── NAVBAR ── */
        .eros-nav {
          width: 100%;
          height: var(--eros-nav-h, 70px);
          background: #ffffff;
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 4px 25px 0 rgba(0,0,0,0.07);
          box-sizing: border-box;
        }
        .eros-nav-container {
          width: 100%;
          height: 100%;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 clamp(16px, 5vw, 80px);
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
        .eros-nav-toggle {
          display: none;
          width: 42px;
          height: 42px;
          border-radius: 10px;
          border: 1px solid rgba(0,0,0,0.08);
          background: rgba(255,255,255,0.9);
          cursor: pointer;
          align-items: center;
          justify-content: center;
        }

        .eros-mobile-panel {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: rgba(255,255,255,0.98);
          border-bottom: 1px solid rgba(0,0,0,0.06);
          box-shadow: 0 12px 24px rgba(0,0,0,0.08);
          padding: 12px 0;
        }
        .eros-mobile-panel.open { display: block; }
        .eros-mobile-links {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 0 clamp(16px, 5vw, 80px);
        }
        .eros-mobile-link {
          padding: 10px 10px;
          border-radius: 10px;
          font-size: 14px;
          color: #1f2937;
          cursor: pointer;
          user-select: none;
        }
        .eros-mobile-link:hover { background: rgba(157,202,230,0.22); }
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
          padding: 0 80px;
          box-sizing: border-box;
          flex: 1;
          min-height: calc(100vh - var(--eros-nav-h, 70px));
          display: flex;
          height: calc(100vh - var(--eros-nav-h, 70px));
        }
        @media (min-width: 1024px) {
          .eros-body {
            min-height: auto;
            height: auto;
          }
        }
        .eros-inner {
          width: 100%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding-top: clamp(16px, 3vh, 32px);
          padding-bottom: clamp(16px, 3vh, 32px);
          gap: clamp(14px, 2.2vh, 28px);
          max-height: calc(100vh - var(--eros-nav-h, 70px));
          min-height: 100%;
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
          margin-bottom: 0;
        }
        .eros-title {
          font-family: 'Geist', 'Poppins', sans-serif;
          font-weight: 600;
          font-size: clamp(28px, 3.2vw, 40px);
          letter-spacing: -1.5px;
          line-height: 1.2;
          text-align: center;
          max-width: 600px;
          margin: 0;
        }
        .eros-title-line {
          display: block;
        }
        .eros-title-line1 {
          white-space: nowrap;
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
          font-size: clamp(13px, 1.15vw, 15px);
          font-weight: 400;
          color: #475569;
          opacity: 0.7;
          text-align: center;
          line-height: 1.65;
          max-width: 560px;
          margin: 0;
        }

        /* ── CHAT SECTION ── */
        .eros-chat-section {
          width: 100%;
          max-width: min(640px, 100%);
          display: flex;
          flex-direction: column;
          gap: 14px;
          align-items: flex-start;
          margin-top: clamp(36px, 6vh, 88px);
        }

        /* Laptop/tablet: equal top/bottom spacing in viewport */
        @media (min-width: 768px) and (max-width: 1439px) {
          .eros-body {
            min-height: calc(100vh - var(--eros-nav-h, 70px));
            height: calc(100vh - var(--eros-nav-h, 70px));
            align-items: center;
          }
          .eros-inner {
            max-height: calc(100vh - var(--eros-nav-h, 70px));
            min-height: 100%;
            justify-content: center;
            padding-top: clamp(22px, 4vh, 44px);
            padding-bottom: clamp(22px, 4vh, 44px);
          }
          .eros-chat-section {
            margin-top: 100px;
          }
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
          padding: 7px 18px;
          width: 124px;
          justify-content: center;
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
          background: rgba(157,202,230,0.72);
          border: 1px solid rgba(157,202,230,0.55);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,0.6),
            0 8px 32px rgba(157,202,230,0.28),
            0 2px 8px rgba(0,0,0,0.04);
          overflow: hidden;
          position: relative;
        }
        .eros-chat-outer::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 62%);
          pointer-events: none;
          z-index: 0;
          border-radius: 22px;
        }
        .eros-chat-inner-wrap {
          position: relative;
          z-index: 1;
          padding: 12px 12px 12px;
          background: transparent;
        }

        /* ── FREE TRIAL ROW ── */
        .eros-trial-row {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 0 6px;
          margin-bottom: 8px;
        }
        .eros-trial-text {
          font-size: 13px;
          font-weight: 400;
          color: #1a1a1a;
          letter-spacing: -0.1px;
          line-height: 1.6;
        }

        /* ── CHAT INPUT CARD ── */
        .eros-chat-card {
          position: relative;
          width: 100%;
          background: rgba(255,255,255,0.98);
          border: 1px solid rgba(15, 23, 42, 0.10);
          border-radius: 16px;
          min-height: 96px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          margin-top: 0;
          box-shadow: 0 6px 18px rgba(15,23,42,0.06);
        }
        .eros-chat-ta {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          font-family: 'Poppins', sans-serif;
          font-size: 13.5px;
          font-weight: 400;
          color: #222;
          resize: none;
          line-height: 1.6;
          min-height: 46px;
          max-height: 84px;
          padding: 12px 14px 6px;
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
          padding: 8px 10px 10px;
        }
        .eros-chat-left { display: flex; align-items: center; gap: 8px; }
        .eros-chat-right { display: flex; align-items: center; gap: 8px; }
        .eros-action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 12px;
          border: 1px solid rgba(15, 23, 42, 0.10);
          border-radius: 24px;
          background: rgba(255,255,255,0.70);
          cursor: pointer;
          font-family: 'Poppins', sans-serif;
          font-size: 12.5px;
          font-weight: 400;
          color: #555;
          transition: background 0.15s;
          height: 32px;
          white-space: nowrap;
        }
        .eros-action-btn:hover { background: rgba(157,202,230,0.18); }
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
  padding: 0 16px; /* Pill shape */
  
  /* Background and Border */
  background-color: #9dcae6; 
  border: none;
  border-radius: 100px; /* Ensures a perfect pill shape */
  
  /* Text and Icon Styling */
  color: #ffffff; 
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  font-weight: 500;
  
  /* Sizing */
  height: 32px;
  min-width: 88px;
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
          .eros-body { padding: 0 40px; }
        }
        @media (max-width: 900px) {
          .eros-nav { padding: 0 24px; }
          .eros-nav-links { display: none; }
          .eros-nav-toggle { display: inline-flex; }
          .eros-body { padding: 0 20px; }
          .eros-title { font-size: clamp(24px, 4vw, 32px); }
        }
        @media (max-width: 600px) {
          .eros-nav { height: 68px; }
          :root { --eros-nav-h: 68px; }
          .eros-title { font-size: 24px; letter-spacing: -0.8px; }
        }
        @media (max-width: 380px) {
          .eros-title-line1 { white-space: normal; }
        }

        /* Short-height laptops: reduce vertical density so everything fits */
        @media (max-height: 820px) and (min-width: 900px) {
          .eros-inner {
            padding-top: 14px;
            padding-bottom: 14px;
            gap: 14px;
          }
          .eros-title { font-size: 36px; }
          .eros-subtitle { font-size: 14px; }
          .eros-chat-card { min-height: 88px; }
          .eros-chat-ta { min-height: 44px; max-height: 64px; }
        }

        /* Very short heights: compress a bit more to avoid overflow */
        @media (max-height: 740px) and (min-width: 900px) {
          .eros-title { font-size: 32px; }
          .eros-subtitle { font-size: 13px; }
          .eros-tabs { gap: 18px; }
          .eros-tab { height: 34px; padding: 6px 14px; font-size: 13px; width: 116px; }
          .eros-chat-card { min-height: 80px; margin-top: 8px; }
          .eros-chat-ta { min-height: 40px; max-height: 58px; padding: 10px 14px 4px; }
          .eros-chat-actions { padding: 4px 10px 10px; }
        }

        /* Large desktops: scale up spacing/controls */
        @media (min-width: 1440px) and (min-height: 860px) {
          .eros-nav-container { padding-inline: 64px; }
          .eros-body { padding-inline: 64px; }

          .eros-inner {
            justify-content: flex-start;
            padding-top: 34px;
            padding-bottom: 28px;
            gap: 22px;
          }
          .eros-title { font-size: clamp(54px, 3.4vw, 64px); max-width: 840px; }
          .eros-subtitle { font-size: 17.5px; max-width: 720px; }
          .eros-tabs { gap: 28px; }
          .eros-tab { height: 42px; padding: 8px 18px; font-size: 14px; width: 140px; }
          .eros-chat-section {
            width: min(44vw, 760px);
            max-width: min(760px, 100%);
            margin: 0 auto;
            align-items: center;
          }
          .eros-chat-outer { width: 100%; }
          .eros-chat-card { min-height: 108px; }
          .eros-chat-ta { min-height: 56px; max-height: 90px; font-size: 15px; }
        }

        @media (min-width: 1680px) and (min-height: 900px) {
          .eros-title { font-size: clamp(60px, 3.2vw, 72px); }
          .eros-subtitle { font-size: 18px; }
          .eros-nav-container { padding-inline: 80px; }
          .eros-body { padding-inline: 80px; }
          .eros-chat-section { width: min(44vw, 860px); max-width: min(860px, 100%); }
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
                  onClick={() => scrollToSection(link.id)}
                >
                  {link.label}
                </span>
              ))}
            </div>

            <div className="eros-nav-right">
              <button
                type="button"
                className="eros-nav-toggle"
                aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
                onClick={() => setMobileNavOpen((v) => !v)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round">
                  {mobileNavOpen ? (
                    <>
                      <path d="M18 6L6 18" />
                      <path d="M6 6l12 12" />
                    </>
                  ) : (
                    <>
                      <path d="M4 7h16" />
                      <path d="M4 12h16" />
                      <path d="M4 17h16" />
                    </>
                  )}
                </svg>
              </button>
              <button className="eros-rasi-btn" onClick={() => navigate('/rasi-chart')}>
                Rasi Chart
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
                </svg>
              </button>
            </div>
          </div>

          <div className={`eros-mobile-panel${mobileNavOpen ? " open" : ""}`}>
            <div className="eros-mobile-links">
              {[
                { label: "Header", id: "header" },
                { label: "Vita Scan", id: "vita-scan" },
                { label: "Reports", id: "reports" },
                { label: "Lucky Section", id: "lucky" },
                { label: "Explore Sections", id: "explore" },
                { label: "About", id: "footer" },
              ].map((link) => (
                <div
                  key={link.label}
                  className="eros-mobile-link"
                  role="button"
                  tabIndex={0}
                  onClick={() => scrollToSection(link.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") scrollToSection(link.id);
                  }}
                >
                  {link.label}
                </div>
              ))}
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
                <span className="eros-title-line eros-title-line1">
                  <span className="eros-title-grad">EROS Wellness</span>
                  <span className="eros-title-dark"> – AI-driven</span>
                </span>
                <span className="eros-title-line eros-title-dark">holistic growth.</span>
              </h1>
              <p className="eros-subtitle">
                Your personal AI spiritual companion — illuminating your path through astrology,
                energy readings, and ancient wisdom tailored uniquely for you.
              </p>
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
                        <button type="button" className="eros-action-btn">
                          <AttachIcon /> Attach
                        </button>
                      </div>
                      <div className="eros-chat-right">
                        <button type="button" className="eros-action-btn">
                          <VoiceIcon /> Voice
                        </button>
                        <button type="button" className="eros-send-btn" aria-label="Send" onClick={handleSend}>
                          <SendIcon /> Send
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