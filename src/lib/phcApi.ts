import { baseApiUrl } from "@/config/api";
import type { AppLanguage, PhcPatient } from "@/context/PhcSessionContext";
import type { CombinedReportData } from "@/types/rppg";

const API_PREFIX = "/aitools/wellness/v2";

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
};

export interface SignupPayload {
  full_name: string;
  aadhaar_number: string;
  phone_number: string;
  password: string;
  gender?: string;
  date_of_birth?: string;
  time_of_birth?: string;
  place_of_birth?: string;
  current_location?: string;
  preferred_language: AppLanguage;
}

export interface LoginPayload {
  aadhaar_number: string;
  password: string;
}

export interface BioCareReportListItem {
  report_id: string;
  report_type: string;
  scan_timestamp: string;
  report_language?: AppLanguage | string;
  summary?: string;
  metrics?: {
    heart_rate?: number;
    bp_systolic?: number;
    bp_diastolic?: number;
    signal_quality?: number;
  };
  report_data?: CombinedReportData | Record<string, unknown>;
}

function endpoint(path: string) {
  return `${baseApiUrl}${API_PREFIX}${path}`;
}

async function parseJsonResponse<T>(response: Response): Promise<ApiEnvelope<T>> {
  const text = await response.text();
  let payload: ApiEnvelope<T>;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(text || `HTTP ${response.status}`);
  }

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || payload.error || `HTTP ${response.status}`);
  }

  return payload;
}

function pickUserId(data: Record<string, any>) {
  return data.user_id ?? data.userId ?? data.id;
}

export function normalizePatient(
  raw: Record<string, any>,
  fallback: Partial<PhcPatient> = {},
): PhcPatient {
  const data = raw.data && typeof raw.data === "object" ? raw.data : raw;
  const userId = pickUserId(data);
  if (!userId) {
    throw new Error("Backend did not return user_id.");
  }

  return {
    userId: String(userId),
    username:
      data.full_name ??
      data.username ??
      data.name ??
      fallback.username ??
      "Patient",
    phoneNumber:
      data.phone_number ??
      data.phoneNumber ??
      fallback.phoneNumber ??
      "",
    aadhaarLast4: data.aadhaar_last4 ?? fallback.aadhaarLast4,
    gender: data.gender ?? fallback.gender,
    dateOfBirth:
      data.date_of_birth ??
      data.dateOfBirth ??
      fallback.dateOfBirth,
    timeOfBirth:
      data.time_of_birth ??
      data.timeOfBirth ??
      fallback.timeOfBirth,
    placeOfBirth:
      data.place_of_birth ??
      data.placeOfBirth ??
      fallback.placeOfBirth,
    currentLocation:
      data.current_location ??
      data.currentLocation ??
      fallback.currentLocation,
    preferredLanguage:
      data.preferred_language ??
      data.preferredLanguage ??
      fallback.preferredLanguage,
    hasBioCareReports:
      data.has_bio_care_reports ??
      data.hasBioCareReports ??
      fallback.hasBioCareReports,
    isFirstScanRequired:
      data.is_first_scan_required ??
      data.isFirstScanRequired ??
      fallback.isFirstScanRequired,
  };
}

export async function signupPatient(payload: SignupPayload): Promise<PhcPatient> {
  const response = await fetch(endpoint("/auth/signup"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await parseJsonResponse<Record<string, any>>(response);
  return normalizePatient(result.data ?? {}, {
    username: payload.full_name,
    phoneNumber: payload.phone_number,
    aadhaarLast4: payload.aadhaar_number.slice(-4),
    gender: payload.gender,
    dateOfBirth: payload.date_of_birth,
    timeOfBirth: payload.time_of_birth,
    placeOfBirth: payload.place_of_birth,
    currentLocation: payload.current_location,
    preferredLanguage: payload.preferred_language,
    isFirstScanRequired: true,
  });
}

export async function loginPatient(payload: LoginPayload): Promise<PhcPatient> {
  const response = await fetch(endpoint("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await parseJsonResponse<Record<string, any>>(response);
  return normalizePatient(result.data ?? {}, {
    aadhaarLast4: payload.aadhaar_number.slice(-4),
    phoneNumber: payload.password,
  });
}

export async function listBioCareReports(userId: string) {
  const response = await fetch(
    endpoint(`/health/scan/${encodeURIComponent(userId)}/reports?report_type=bio_care`),
  );
  const result = await parseJsonResponse<BioCareReportListItem[]>(response);
  return Array.isArray(result.data) ? result.data : [];
}

export async function getBioCareReport(userId: string, reportId: string) {
  const response = await fetch(
    endpoint(
      `/health/scan/${encodeURIComponent(userId)}/reports/${encodeURIComponent(reportId)}`,
    ),
  );
  const result = await parseJsonResponse<{ report_data?: CombinedReportData } & Record<string, any>>(
    response,
  );
  return result.data;
}
