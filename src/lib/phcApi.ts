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
  phone_number: string;
  otp_verification_token: string;
  gender?: string;
  date_of_birth?: string;
  time_of_birth?: string;
  place_of_birth?: string;
  current_location?: string;
  preferred_language: AppLanguage;
}

export type OtpPurpose = "signup" | "login";

export interface SendOtpPayload {
  phone_number: string;
  purpose: OtpPurpose;
  preferred_language?: AppLanguage;
}

export interface SendOtpResult {
  otpRequestId: string;
  expiresInSeconds?: number;
  resendAfterSeconds?: number;
  isRegistered?: boolean;
}

export interface VerifyOtpPayload {
  phone_number: string;
  otp: string;
  otp_request_id?: string;
  purpose: OtpPurpose;
}

export interface VerifyOtpResult {
  otpVerificationToken?: string;
  patient?: PhcPatient;
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

function pickPatientPayload(data: Record<string, any>) {
  return data.patient ?? data.user ?? data.profile ?? data;
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

export async function sendOtp(payload: SendOtpPayload): Promise<SendOtpResult> {
  const response = await fetch(endpoint("/auth/otp/send"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await parseJsonResponse<Record<string, any>>(response);
  const data = result.data ?? {};
  const otpRequestId =
    data.otp_request_id ??
    data.otpRequestId ??
    data.request_id ??
    data.requestId ??
    data.verification_id ??
    data.verificationId ??
    "";

  return {
    otpRequestId: String(otpRequestId),
    expiresInSeconds:
      data.expires_in_seconds ?? data.expiresInSeconds ?? data.expires_in ?? data.expiresIn,
    resendAfterSeconds:
      data.resend_after_seconds ?? data.resendAfterSeconds ?? data.resend_after ?? data.resendAfter,
    isRegistered: data.is_registered ?? data.isRegistered,
  };
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResult> {
  const response = await fetch(endpoint("/auth/otp/verify"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await parseJsonResponse<Record<string, any>>(response);
  const data = result.data ?? {};
  const patientPayload = pickPatientPayload(data);
  const hasPatient = patientPayload && typeof patientPayload === "object" && pickUserId(patientPayload);

  return {
    otpVerificationToken:
      data.otp_verification_token ??
      data.otpVerificationToken ??
      data.verification_token ??
      data.verificationToken,
    patient: hasPatient
      ? normalizePatient(patientPayload, { phoneNumber: payload.phone_number })
      : undefined,
  };
}

export async function signupPatient(payload: SignupPayload): Promise<PhcPatient> {
  const response = await fetch(endpoint("/auth/signup"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await parseJsonResponse<Record<string, any>>(response);
  const data = result.data ?? {};
  return normalizePatient(pickPatientPayload(data), {
    username: payload.full_name,
    phoneNumber: payload.phone_number,
    gender: payload.gender,
    dateOfBirth: payload.date_of_birth,
    timeOfBirth: payload.time_of_birth,
    placeOfBirth: payload.place_of_birth,
    currentLocation: payload.current_location,
    preferredLanguage: payload.preferred_language,
    isFirstScanRequired: true,
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
