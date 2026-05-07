// src/App.tsx

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SoulProfilePage from "./pages/profile/SoulProfilePage";
import FaceReadingReportPage from "./pages/face/FaceReportPage";
import WellnessScreen from "./pages/home/WelnessScreen";
import FaceScanner from "./components/FaceScanner/FaceScanner";
import PasswordGate from "./components/auth/PasswordGate";
import { PhcSessionProvider } from "./context/PhcSessionContext";
import LanguageToggle from "./components/phc/LanguageToggle";

const App: React.FC = () => {
  return (
    <Router basename="/wellness">
      <PhcSessionProvider>
        <PasswordGate>
          <LanguageToggle />
          <div className="app overflow-fix">
            <Routes>
              <Route path="/" element={<WellnessScreen />} />
              <Route path="/profile" element={<SoulProfilePage />} />
              <Route path="/facescan" element={<FaceScanner />} />
              <Route path="/face-report" element={<FaceReadingReportPage />} />
              <Route path="/eros-home" element={<Navigate to="/facescan" replace />} />
              <Route path="/result" element={<Navigate to="/facescan" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </PasswordGate>
      </PhcSessionProvider>
    </Router>
  );
};

export default App;
