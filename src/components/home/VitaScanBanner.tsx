import { useNavigate } from "react-router-dom";

// ─── Figma Assets ─────────────────────────────────────────────────────────────
const imgPersonFrame  = "https://www.figma.com/api/mcp/asset/05ef58b7-a30e-4712-baf3-82250eebb43a";
const imgArrowIcon    = "https://www.figma.com/api/mcp/asset/7a3946b0-4e43-46c0-b5a9-f2cc2ad096ad";
const imgScanOverlay  = "https://www.figma.com/api/mcp/asset/231c2ba0-d19d-4d46-a44a-47c3a2a1a327";

interface VitaScanBannerProps {
  onGetStarted?: () => void;
}

export default function VitaScanBanner({ onGetStarted }: VitaScanBannerProps) {
  const navigate = useNavigate();

  const handleClick = () => {
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

        /* "Vita Scan" label */
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
          object-fit: contain;
          flex-shrink: 0;
        }

        /* ── RIGHT IMAGE ── */
        .vsb-right {
          /* Figma: w-322.723 h-345.375, flex-shrink-0 */
          flex: 0 0 clamp(220px, 26vw, 323px);
          height: clamp(230px, 28vw, 345px);
          position: relative;
          overflow: visible;
        }

        /* Base person photo */
        .vsb-photo {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          pointer-events: none;
          display: block;
        }

        /* White frosted panel at bottom (Figma: bg-white/30, rounded-bl-36 rounded-br-35) */
        .vsb-frost {
          position: absolute;
          left: -12.78px;
          bottom: 0;
          width: calc(100% + 14px);
          height: 54.6%; /* 188.46 / 345.38 */
          background: rgba(255, 255, 255, 0.3);
          border-radius: 0 0 35px 36px;
          pointer-events: none;
        }

        /* Scan overlay on top (Group 5) — positioned -14px left, full 350×350 */
        .vsb-overlay {
          position: absolute;
          left: -14px;
          top: 0;
          width: calc(100% + 26px);
          height: calc(100% + 4px);
          object-fit: cover;
          pointer-events: none;
          display: block;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .vsb-wrap { padding: 24px 32px 40px; }
          .vsb-card  { padding: 40px 36px 32px; gap: 24px; flex-direction: column; }
          .vsb-left  { max-width: 100%; }
          .vsb-right { flex: 0 0 220px; height: 220px; align-self: center; }
          .vsb-heading { font-size: clamp(24px, 4vw, 36px); }
        }
        @media (max-width: 600px) {
          .vsb-wrap { padding: 16px 16px 32px; }
          .vsb-card  { padding: 28px 20px 24px; border-radius: 16px; }
          .vsb-heading { font-size: 24px; }
          .vsb-desc  { font-size: 14px; }
          .vsb-right { flex: 0 0 180px; height: 180px; }
        }
      `}</style>

      <div className="vsb-wrap">
        <div className="vsb-card">

          {/* ── LEFT ── */}
          <div className="vsb-left">
            <p className="vsb-label">Vita Scan</p>

            <h2 className="vsb-heading">
              Unlock AI-Powered Vitality &amp; Health Intelligence
            </h2>

            <p className="vsb-desc">
              Leverage the power of AI automation to streamline operations,
              enhance customer satisfaction, and drive exponential business growth.
            </p>

            <div className="vsb-btn-wrap">
              <button className="vsb-btn" onClick={handleClick}>
                Get Started
                <img src={imgArrowIcon} alt="" className="vsb-btn-arrow" />
              </button>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="vsb-right">
            {/* Base person image */}
            <img src={imgPersonFrame} alt="Vita Scan AI" className="vsb-photo" />

            {/* Frosted white panel bottom */}
            <div className="vsb-frost" />

            {/* Scan glow overlay */}
            <img src={imgScanOverlay} alt="" className="vsb-overlay" />
          </div>

        </div>
      </div>
    </>
  );
}