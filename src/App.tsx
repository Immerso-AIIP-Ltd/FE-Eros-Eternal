// src/App.tsx

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ErosChatUI from "./pages/chat/ErosChatUI";
import SplashScreen from "./pages/home/SplashScreen";
import SoulProfilePage from "./pages/profile/SoulProfilePage";
import EternalAIPage from "./pages/home/EternalAIPage";
import ResultPage from "./pages/reports/ResultPage";
import RecordVoice from "./pages/chat/RecordVoice";
import ChatPage from "./pages/chat/ChatPage";
import HomePage from "./pages/home/HomePage";
import TarrotCard from "./pages/tarot/TarrotCard";
import HarmonyIndexPage from "./pages/harmony/HarmonyIndexPage";
import PalmReadingPage from "./pages/palm/PalmReadingPage";
import VibrationTool from "./pages/wellness/VibrationTool";
import DailyReportsPage from "./pages/reports/DailyReportsPage";
import HealingModal from "./pages/other/HealingModal";
import AiChat from "./pages/chat/AiChat";
import AgeTrack from "./pages/other/AgeTrack";
import TarotFlow from "./pages/tarot/TarrotFlow";
import PalmFlow from "./pages/palm/PalmFlow";
import FaceReading from "./pages/face/FaceReading";
import HarmonyIndex from "./pages/harmony/HarmonyIndex";
import RelationshipCompatibility from "./pages/other/RelationCompatability";
import PalmUploadPage from "./pages/palm/PalmUpload";
import PalmReadingReportPage from "./pages/palm/PalmReport";
import FaceUploadPage from "./pages/face/FaceUpload";
import FaceReadingReportPage from "./pages/face/FaceReportPage";
import ViewReport from "./pages/reports/ViewReport";
import RasiChartPage from "./pages/wellness/RasiChartPage";
import StarMap from "./pages/wellness/StarMap";
import KoshaMap from "./pages/wellness/KoshaMap";
import AuraProfile from "./pages/wellness/AuraProfile";
import FlameScore from "./pages/wellness/FlameScore";
import LongevityTool from "./pages/wellness/longevityTool";
import FounderMsg from "./pages/other/FounderMsg";
import WellnessScreen from "./pages/home/WelnessScreen";
import ErosHome from "./pages/home/ErosHome";
import FaceScanner from "./components/FaceScanner/FaceScanner";
import VitaScanReport from "./pages/reports/VitaScanReport";
import FaceAnalyseReport from "./pages/face/FaceAnalyseReport";

const App: React.FC = () => {
  return (
    <Router>
      <div className="app overflow-fix">
        <Routes>
          <Route path="/" element={<WellnessScreen />} />
          <Route path="/chat" element={<ErosChatUI />} />
          <Route path="/profile" element={<SoulProfilePage />} />
          <Route path="/aipage" element={<EternalAIPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/record" element={<RecordVoice />} />
          <Route path="/eros-home" element={<ErosHome />} />
          <Route path="/ques" element={<ChatPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/facescan" element={<FaceScanner />} />
          <Route path="/card" element={<TarotFlow />} />
          <Route path="/palmcard" element={<PalmFlow />} />
          <Route path="/palm" element={<PalmReadingPage />} />
          <Route path="/vibrational-frequency" element={<VibrationTool />} />
          <Route path="/report" element={<DailyReportsPage />} />
          <Route path="/longevity-blueprint" element={<LongevityTool />} />
          <Route path="/facereading" element={<FaceReading />} />
          <Route path="/harmoneyi" element={<HarmonyIndex />} />
          <Route path="/relation" element={<RelationshipCompatibility />} />
          <Route path="/upload" element={<PalmUploadPage />} />
          <Route path="/palm-report" element={<PalmReadingReportPage />} />
          <Route path="/face-upload" element={<FaceUploadPage />} />
          <Route path="/face-report" element={<FaceReadingReportPage />} />
          <Route path="/face-analyse" element={<FaceAnalyseReport />} />
          <Route path="/rasi-chart" element={<RasiChartPage />} />
          <Route path="/star-map" element={<StarMap />} />
          <Route path="/kosha-map" element={<KoshaMap />} />
          <Route path="/aura-profile" element={<AuraProfile />} />
          <Route path="/flame-score" element={<FlameScore />} />
          <Route path="/founder" element={<FounderMsg />} />
          <Route path="/vita-scan" element={<VitaScanReport />} />
          <Route path="/harmony" element={<HarmonyIndexPage />} />
          <Route path="/Healing" element={<HealingModal />} />
          <Route path="/ai-chat" element={<AiChat />} />
          <Route path="/age-tracker" element={<AgeTrack />} />
          <Route path="/view-report" element={<ViewReport />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
