// src/pages/ResultPage.tsx
import React from 'react';

// Import components
import Header from "@/components/layout/Header";
import LuckSection from "@/components/home/LuckSection";
import ExploreSection from "@/components/home/ExploreSection";
import ErosWellnessReports from "@/components/home/ErosWellnessReports";
import VitaScanBanner from '@/components/home/VitaScanBanner';

const ResultPage: React.FC = () => {
  return (
    <div
      className="d-flex flex-column vh-100 vw-100 mainParent"
      style={{
        backgroundColor: '#f8f8fa',
        color: '#1a1a2e',
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
    >
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
          <Header />
          <VitaScanBanner onGetStarted={() => {}} />
          <ErosWellnessReports />
          <LuckSection />
          <ExploreSection />
        </div>
      </main>
    </div>
  );
};

export default ResultPage;
