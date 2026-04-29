// src/pages/ResultPage.tsx
import React from "react";

// Import components
import Header from "@/components/layout/Header";
import LuckSection from "@/components/home/LuckSection";
import ExploreSection from "@/components/home/ExploreSection";
import ErosWellnessReports from "@/components/home/ErosWellnessReports";
import VitaScanBanner from "@/components/home/VitaScanBanner";
import FooterPage from "@/components/home/Footer";

const ResultPage: React.FC = () => {
  return (
    <div
      style={{
        background:
          "linear-gradient(to bottom, #E0F2FE 0%, #F0F9FF 20%, #FFFFFF 55%)",
        color: "#1a1a2e",
        width: "100%",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      <style>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        ::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        * {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }

        :root {
          --result-max-width: 1200px;
          --result-gutter: 48px;
          --result-section-pad: 48px;
          --result-bottom-pad: 64px;
          --result-nav-offset: 84px; /* keeps anchor scroll nicely spaced */
          --result-grid-gap: 24px;
        }

        @media (min-width: 768px) {
          :root { --result-gutter: 32px; }
        }

        @media (min-width: 1024px) {
          :root { --result-gutter: 64px; --result-section-pad: 80px; }
        }

        /* Desktop-only: let sections expand to fill wide screens (was 100px by mistake → crushed layout). */
        @media (min-width: 1440px) {
          :root {
            --result-max-width: min(100%, 1400px);
            --result-gutter: 64px;
            --result-section-pad: 72px;
          }
        }

        @media (min-width: 1680px) {
          :root {
            --result-max-width: 1480px;
            --result-gutter: 72px;
            --result-section-pad: 76px;
          }
        }

        .result-container {
          width: 100%;
          max-width: var(--result-max-width);
          margin: 0 auto;
          padding-inline: var(--result-gutter);
        }

        .result-section {
          padding-block: var(--result-section-pad);
        }

        /* Make in-page navbar scrolling land cleanly */
        #vita-scan, #reports, #lucky, #explore {
          scroll-margin-top: var(--result-nav-offset);
        }

        body { overflow-x: hidden; }

        /* Keep Header padding consistent with page gutters (no max-width lock) */
        .eros-nav-container,
        .eros-inner,
        .eros-body {
          padding-inline: var(--result-gutter) !important;
        }

        /* Prevent embedded sections from adding side padding */
        .vsb-wrap { padding: 0 !important; }

        /* Header height follows content — no full-viewport min-height (avoids huge vertical gaps). */
        #header { min-height: 0; }
      `}</style>
      {/* Main Content Area */}
      <main
        className="flex-grow-1 d-flex flex-column"
        style={{
          minWidth: 0,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Content Container */}
        <div
          className="flex-grow-1"
          style={{
            maxWidth: "100%",
            paddingBottom: "var(--result-bottom-pad)",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div id="header">
            <Header layoutDensity={"compact" as const} />
          </div>

          <div id="vita-scan" className="result-container result-section">
            <VitaScanBanner embedded onGetStarted={() => {}} />
          </div>

          <div id="reports" className="result-container result-section">
            <ErosWellnessReports embedded />
          </div>

          <div id="lucky" className="result-container result-section">
            <LuckSection embedded />
          </div>

          <div id="explore" className="result-container result-section">
            <ExploreSection embedded />
          </div>
          <div id="footer">
            <FooterPage />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResultPage;
