// src/pages/ResultPage.tsx
import React from 'react';

// Import components
import Header from "@/components/layout/Header";
import LuckSection from "@/components/home/LuckSection";
import ExploreSection from "@/components/home/ExploreSection";
import ErosWellnessReports from "@/components/home/ErosWellnessReports";
import VitaScanBanner from '@/components/home/VitaScanBanner';
import FooterPage from "@/components/home/FooterPage"

const ResultPage: React.FC = () => {
  return (
    <div
      style={{
        backgroundColor: '#f8f8fa',
        color: '#1a1a2e',
        width: '100%',
        minHeight: '100vh',
        // overflow:'hidden,
        overflowX: 'hidden',
        // overflowY:'scroll'
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
      `}</style>
      {/* Main Content Area */}
      <main
        className="flex-grow-1 d-flex flex-column"
        style={{
          minWidth: 0,
          position: 'relative',
          zIndex: 1,
          
        }}
      >
        {/* Content Container */}
        <div
          className="flex-grow-1"
          style={{
            maxWidth: '100%',
            paddingBottom: '2rem',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div id="header">
            <Header />
          </div>
          <div id="vita-scan">
            <VitaScanBanner onGetStarted={() => {}} />
          </div>
          <div id="reports">
            <ErosWellnessReports />
          </div>
          <div id="lucky">
            <LuckSection />
          </div>
          <div id="explore">
            <ExploreSection />
          </div>
          {/* <div id="footer">
            <FooterPage />
          </div> */}
        </div>
      </main>
    </div>
  );
};

export default ResultPage;
