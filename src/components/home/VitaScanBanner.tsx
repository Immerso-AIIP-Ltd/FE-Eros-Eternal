import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import vitaBackground from "@/assets/result-images/vitabackground.png";
import {
  FACE_REPORT_STORAGE_KEY,
  hasVitaScanReportCached,
} from "@/lib/vitaScanCache";

/** Same arrow as ErosWellnessReports `ArrowIcon` — inline SVG (no external asset). */
const ArrowIcon = () => (
  <svg
    className="vsb-btn-arrow"
    viewBox="0 0 12 12"
    fill="none"
    aria-hidden
  >
    <path
      d="M2 10 L10 2 M10 2 H5 M10 2 V7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface VitaScanBannerProps {
  onGetStarted?: () => void;
  embedded?: boolean;
}

export default function VitaScanBanner({ onGetStarted, embedded = false }: VitaScanBannerProps) {
  const navigate = useNavigate();
  const [hasCachedReport, setHasCachedReport] = useState(() => hasVitaScanReportCached());

  useEffect(() => {
    const refresh = () => setHasCachedReport(hasVitaScanReportCached());
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === FACE_REPORT_STORAGE_KEY ||
        e.key === "latestHealthScan" ||
        e.key === null
      ) {
        refresh();
      }
    };
    const onVitaUpdated = () => refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener("vitaScanUpdated", onVitaUpdated);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("vitaScanUpdated", onVitaUpdated);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const handleClick = () => {
    if (hasCachedReport) {
      navigate("/face-report");
      return;
    }
    onGetStarted?.();
    navigate("/facescan");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Alexandria:wght@400;500;600&family=Anybody:wght@400;500;600&family=Poppins:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        /* ── outer wrapper: Figma padding pt-32 pb-64 px-110 ── */
        .vsb-wrap {
          width: 100%;
          padding: 32px 110px 64px;
        }
        .vsb-wrap.vsb-embedded {
          padding: 0;
        }

        /* ── the card itself ── */
        .vsb-card {
          width: 100%;
          /* Figma: max-width 1220px implied by layout, let it fill */
          border: 1px solid #e6e6e6;
          border-radius: 24px;
          /* Figma gradient: white → blue corner */
          background:
            linear-gradient(152.85deg, #ffffff 48.73%, #4893fc 251.51%),
            #ffffff;
          overflow: hidden;
          display: flex;
          align-items: center;
          gap: 36px;
          justify-content: space-between;
          padding: 54px 64px 38px 64px;
          position: relative;
        }

        /* ── LEFT CONTENT ── */
        .vsb-left {
          flex: 1 0 0;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 20px;
          align-items: flex-start;
          position: relative;
          z-index: 1;
          /* Figma: w-[678px] at 1220px wide — let it flex */
          max-width: 678px;
        }

        /* "Bio Care" label */
        .vsb-label {
          font-family: 'Anybody', sans-serif;
          font-weight: 500;
          font-size: 16px;
          color: #050505;
          letter-spacing: -0.32px;
          line-height: normal;
          margin: 0;
          font-variation-settings: 'wdth' 100;
        }

        /* Main heading */
        .vsb-heading {
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          font-style: normal;
          font-size: clamp(28px, 3.2vw, 48px);
          color: #050505;
          letter-spacing: -0.96px;
          line-height: 1.15;
          margin: 0;
          max-width: 531px;
        }

        /* Description */
        .vsb-desc {
          font-family: 'Alexandria', sans-serif;
          font-weight: 500;
          font-size: 16px;
          color: rgba(71, 85, 105, 0.8);
          letter-spacing: -0.32px;
          line-height: normal;
          margin: 0;
          max-width: 582px;
        }

        /* Button wrapper has py-16 from Figma */
        .vsb-btn-wrap {
          padding: 16px 0;
        }

        /* Get Started button */
        .vsb-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 46px;
          padding: 0 20px;
          background: #9dcae6;
          border: none;
          border-radius: 30px;
          font-family: 'Alexandria', sans-serif;
          font-weight: 400;
          font-size: 16px;
          color: #ffffff;
          white-space: nowrap;
          cursor: pointer;
          position: relative;
          /* Figma inset glow */
          // box-shadow: inset 0px 0px 9px 1px #6dc7ff;
          transition: opacity 0.18s, transform 0.18s;
          overflow: hidden;
        }
        .vsb-btn:hover {
          opacity: 0.9;
          transform: scale(1.02);
        }
        .vsb-btn-arrow {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          display: block;
        }

        /* ── RIGHT IMAGE (vitabackground.png — square composite) ── */
        .vsb-right {
          flex: 0 0 clamp(200px, 26vw, 323px);
          width: clamp(200px, 26vw, 323px);
          aspect-ratio: 1;
          height: auto;
          position: relative;
          overflow: hidden;
          border-radius: 24px;
          margin-left: auto;
        }

        /* When embedded in /result (full-width sections), let text flex more */
        .vsb-wrap.vsb-embedded .vsb-left {
          max-width: none;
        }

        .vsb-photo {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          pointer-events: none;
          display: block;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .vsb-wrap { padding: 24px 32px 40px; }
          .vsb-card  { padding: 40px 36px 32px; gap: 24px; flex-direction: column; }
          .vsb-left  { max-width: 100%; }
          .vsb-right { flex: 0 0 220px; width: 220px; align-self: center; }
          .vsb-heading { font-size: clamp(24px, 4vw, 36px); }
        }
        @media (max-width: 600px) {
          .vsb-wrap { padding: 16px 16px 32px; }
          .vsb-card  { padding: 28px 20px 24px; border-radius: 16px; }
          .vsb-heading { font-size: 24px; }
          .vsb-desc  { font-size: 14px; }
          .vsb-right { flex: 0 0 180px; width: 180px; }
        }
      `}</style>

      <div className={`vsb-wrap${embedded ? " vsb-embedded" : ""}`}>
        <div className="vsb-card">

          {/* ── LEFT ── */}
          <div className="vsb-left">
            <p className="vsb-label">Bio Care</p>

            <h2 className="vsb-heading">
              Unlock AI-Powered Vitality &amp; Health Intelligence
            </h2>

            <p className="vsb-desc">
              Leverage the power of AI automation to streamline operations,
              enhance customer satisfaction, and drive exponential business growth.
            </p>

            <div className="vsb-btn-wrap">
              <button type="button" className="vsb-btn" onClick={handleClick}>
                {hasCachedReport ? "View Report" : "Get Started"}
                <ArrowIcon />
              </button>
            </div>
          </div>

          {/* ── RIGHT ── local composite: portrait + scan + frame */}
          <div className="vsb-right">
            <img
              src={vitaBackground}
              alt="Bio Care — AI facial vitality analysis"
              className="vsb-photo"
            />
          </div>

        </div>
      </div>
    </>
  );
}