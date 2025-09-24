// src/pages/ResultPage.tsx
import React from 'react';

// Import components
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DateSelector from "./components/DateSelector";
import StatsCards from "./components/StatsCards";
import ReadingsSection from "./components/ReadingsSection";
import LuckSection from "./components/LuckSection";
import ExploreSection from "./components/ExploreSection";
import DailyReportsSection from "./components/DailyReportsSection";
import PopularSection from "./components/PopularSection";
// import PanchangComponent from './components/PanchangComponent';

const ResultPage: React.FC = () => {
  return (
    <div className="d-flex flex-column flex-lg-row vh-100 vw-100 mainParent" style={{ backgroundColor: '#050505', color: 'white' }}>
      {/* Sidebar - Always visible on desktop/tablet, mobile toggles */}
      <div
        className="flex-shrink-0 d-none d-lg-block"
        style={{
          width: '256px',
          height: '100vh',
          position: 'relative',
          zIndex: 100,
        }}
      >
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main
        className="flex-grow-1 d-flex flex-column overflow-auto"
        style={{
          minWidth: 0,
          // marginLeft: '256px', 
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Background Stars (Fixed) */}
        <div
          className="position-fixed w-100 h-100 pointer-events-none z-index-0"
          style={{
            top: 0,
            left: 0,
            background: 'black',
            zIndex: 0,
          }}
        >
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="position-absolute text-white star-blink"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                fontSize: `${Math.random() * 10 + 10}px`,
                opacity: Math.random() * 0.7 + 0.3,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${Math.random() * 5 + 1}s`,
              }}
            >
              ✦
            </div>
          ))}
        </div>

        {/* Content Container */}
        <div
          className="flex-grow-1 py-3 px-3 px-lg-4"
          style={{
            maxWidth: '100%',
            paddingBottom: '2rem',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Header />
          {/* <DateSelector /> */}
          <StatsCards />
          {/* <PanchangComponent /> */}
          {/* <ReadingsSection /> */}
          <LuckSection />
          <ExploreSection />
          {/* <DailyReportsSection /> */}
          {/* <PopularSection /> */}
        </div>
      </main>
    </div>
  );
};

export default ResultPage;