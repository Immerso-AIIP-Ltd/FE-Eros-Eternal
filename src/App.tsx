// src/App.tsx

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; // ✅ Only import once
import ErosChatUI from "./ErosChatUI";
import SplashScreen from "./SplashScreen";
import SoulProfilePage from "./SoulProfilePage";
import EternalAIPage from "./EternalAIPage";
import ResultPage from "./ResultPage";
import RecordVoice from "./RecordVoice";
import ChatPage from "./ChatPage";
import HomePage from "./HomePage";
import TarrotCard from "./TarrotCard";
import HarmonyIndexPage from "./HarmonyIndexPage";
import PalmReadingPage from "./PalmReadingPage";
import VibrationTool from "./VibrationTool";
import DailyReportsPage from "./DailyReportsPage";
import HealingModal from "./HealingModal";
import AiChat from "./AiChat";
import AgeTrack from "./AgeTrack";
import TarotFlow from "./TarrotFlow";
import PalmFlow from "./PalmFlow";
import FaceReading from "./FaceReading";
import HarmonyIndex from "./HarmonyIndex";
import RelationshipCompatibility from "./RelationCompatability";
import PalmUploadPage from "./PalmUpload";
import PalmReadingReportPage from "./PalmReport";
import FaceUploadPage from "./FaceUpload";
import FaceReadingReportPage from "./FaceReportPage";
import RasiChartPage from "./RasiChartPage";

const App: React.FC = () => {
  return (
    <Router>
      <div className="app overflow-fix">
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/chat" element={<ErosChatUI />} />
          <Route path="/profile" element={<SoulProfilePage />} />
          <Route path="/aipage" element={<EternalAIPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/record" element={<RecordVoice />} />

          <Route path="/ques" element={<ChatPage />} />
          <Route path="/home" element={<HomePage />} />
          {/* <Route path="/card" element={<TarrotCard />} /> */}
          <Route path="/card" element={<TarotFlow />} />
          <Route path="/palmcard" element={<PalmFlow />} />
          <Route path="/palm" element={<PalmReadingPage />} />

          <Route path="/vibrational-frequency" element={<VibrationTool />} />
          <Route path="/report" element={<DailyReportsPage />} />
          <Route path="/card" element={<TarrotCard />} />
          <Route path="/palm" element={<PalmReadingPage />} />
          <Route path="/facereading" element={<FaceReading />} />
          <Route path="/harmoneyi" element={<HarmonyIndex />} />
          <Route path="/relation" element={<RelationshipCompatibility />} />
          <Route path="/upload" element={<PalmUploadPage />} />
          <Route path="/palm-report" element={<PalmReadingReportPage />} />
          <Route path="/face-upload" element={<FaceUploadPage />} />
          <Route path="/face-report" element={<FaceReadingReportPage />} />
          <Route path="/rasi-chart" element={<RasiChartPage />} />

          <Route path="/harmony" element={<HarmonyIndexPage />} />
          <Route path="/vibrational-frequency" element={<VibrationTool />} />
          <Route path="/Healing" element={<HealingModal />} />
          <Route path="/ai-chat" element={<AiChat />} />
          <Route path="/age-tracker" element={<AgeTrack />} />

          <Route path="/harmony" element={<HarmonyIndexPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
