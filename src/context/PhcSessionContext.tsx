import React, { createContext, useContext, useMemo, useState } from "react";
import type { CombinedReportData } from "@/types/rppg";

export type AppLanguage = "en" | "gu";

export interface PhcPatient {
  userId: string;
  username: string;
  phoneNumber: string;
  aadhaarLast4?: string;
  gender?: string;
  dateOfBirth?: string;
  timeOfBirth?: string;
  placeOfBirth?: string;
  currentLocation?: string;
  preferredLanguage?: AppLanguage;
  hasBioCareReports?: boolean;
  isFirstScanRequired?: boolean;
}

interface PhcSessionContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  patient: PhcPatient | null;
  setPatient: (patient: PhcPatient) => void;
  bioCareReport: CombinedReportData | null;
  setBioCareReport: (report: CombinedReportData | null) => void;
  resetPatientFlow: () => void;
}

const PhcSessionContext = createContext<PhcSessionContextValue | undefined>(
  undefined,
);

export function PhcSessionProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>("en");
  const [patient, setPatient] = useState<PhcPatient | null>(null);
  const [bioCareReport, setBioCareReport] = useState<CombinedReportData | null>(
    null,
  );

  const value = useMemo<PhcSessionContextValue>(
    () => ({
      language,
      setLanguage,
      patient,
      setPatient,
      bioCareReport,
      setBioCareReport,
      resetPatientFlow: () => {
        setPatient(null);
        setBioCareReport(null);
      },
    }),
    [bioCareReport, language, patient],
  );

  return (
    <PhcSessionContext.Provider value={value}>
      {children}
    </PhcSessionContext.Provider>
  );
}

export function usePhcSession() {
  const ctx = useContext(PhcSessionContext);
  if (!ctx) {
    throw new Error("usePhcSession must be used inside PhcSessionProvider");
  }
  return ctx;
}
