import vitaBackground from "../../assets/result-images/vitabackground.png";

const ArrowIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2 11 L11 2 M11 2 H5.5 M11 2 V7.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function VitaScanBanner({ onGetStarted }) {
  return (
    <div
      style={{
        background: "linear-gradient(160deg, #deeefa 0%, #c8e4f5 40%, #bcd9f0 100%)",
        borderRadius: "24px",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: "240px",
        maxWidth: "960px",
        width: "100%",
        margin: "0 auto",
        boxShadow: "0 4px 24px rgba(74, 164, 227, 0.1), 0 1px 6px rgba(74, 164, 227, 0.06)",
        border: "1px solid rgba(255,255,255,0.8)",
        position: "relative",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        .vita-get-btn:hover {
          transform: scale(1.03);
          box-shadow: 0 6px 20px rgba(74, 164, 227, 0.5) !important;
        }
        .vita-get-btn { transition: all 0.2s ease; }
      `}</style>

      {/* Left Content */}
      <div
        style={{
          padding: "44px 40px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "16px",
          flex: "1",
          maxWidth: "58%",
          zIndex: 1,
        }}
      >
        {/* Label */}
        <span
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "#5a7a90",
            letterSpacing: "0.01em",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Vita Scan
        </span>

        {/* Heading */}
        <h2
          style={{
            margin: 0,
            fontSize: "clamp(26px, 3.2vw, 38px)",
            fontWeight: 500,
            color: "#0d1f2d",
            lineHeight: 1.15,
            fontFamily: "'Inter', sans-serif",
            letterSpacing: "-0.02em",
          }}
        >
          Unlock AI-Powered<br />
          Vitality & Health<br />
          Intelligence
        </h2>

        {/* Description */}
        <p
          style={{
            margin: 0,
            fontSize: "13.5px",
            color: "#5a7a90",
            lineHeight: 1.7,
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 400,
            maxWidth: "380px",
          }}
        >
          Leverage the power of AI automation to streamline operations, enhance customer satisfaction, and drive exponential business growth.
        </p>

        {/* Button */}
        <div style={{ marginTop: "4px" }}>
          <button
            className="vita-get-btn"
            onClick={onGetStarted}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "9px",
              background: "linear-gradient(135deg, #6dcff6 0%, #3aaee0 100%)",
              border: "none",
              borderRadius: "50px",
              padding: "13px 28px",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 700,
              fontFamily: "'Poppins', sans-serif",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(58, 174, 224, 0.4)",
              letterSpacing: "0.01em",
            }}
          >
            Get Started
            <ArrowIcon />
          </button>
        </div>
      </div>

      {/* Right — Image centered vertically */}
      <div
        style={{
          flex: "0 0 42%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          alignSelf: "stretch",
          paddingRight: "24px",
        }}
      >
        {/* Scan frame corners */}
        <div
          style={{
            position: "absolute",
            width: "200px",
            height: "230px",
            zIndex: 2,
            pointerEvents: "none",
          }}
        >
          {/* Top-left corner */}
          <div style={{ position: "absolute", top: 0, left: 0, width: 28, height: 28,
            borderTop: "2.5px solid rgba(255,255,255,0.85)", borderLeft: "2.5px solid rgba(255,255,255,0.85)",
            borderRadius: "4px 0 0 0" }} />
          {/* Top-right corner */}
          <div style={{ position: "absolute", top: 0, right: 0, width: 28, height: 28,
            borderTop: "2.5px solid rgba(255,255,255,0.85)", borderRight: "2.5px solid rgba(255,255,255,0.85)",
            borderRadius: "0 4px 0 0" }} />
          {/* Bottom-left corner */}
          <div style={{ position: "absolute", bottom: 0, left: 0, width: 28, height: 28,
            borderBottom: "2.5px solid rgba(255,255,255,0.85)", borderLeft: "2.5px solid rgba(255,255,255,0.85)",
            borderRadius: "0 0 0 4px" }} />
          {/* Bottom-right corner */}
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 28, height: 28,
            borderBottom: "2.5px solid rgba(255,255,255,0.85)", borderRight: "2.5px solid rgba(255,255,255,0.85)",
            borderRadius: "0 0 4px 0" }} />
        </div>

        {/* Girl Image */}
        <img
          src={vitaBackground}
          alt="Vita Scan AI"
          style={{
            height: "100%",
            maxHeight: "260px",
            width: "auto",
            objectFit: "contain",
            objectPosition: "center center",
            position: "relative",
            zIndex: 1,
            display: "block",
          }}
        />
      </div>
    </div>
  );
}