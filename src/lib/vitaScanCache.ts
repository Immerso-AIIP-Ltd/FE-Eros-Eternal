/** localStorage key written by FaceScanner / FaceReportPage after a completed Vita Scan */
export const FACE_REPORT_STORAGE_KEY = "faceReportData";

/** Alternate key used by some flows (e.g. VitaScanReport page). */
export const LATEST_HEALTH_SCAN_KEY = "latestHealthScan";

export function hasVitaScanReportCached(): boolean {
  try {
    const raw = localStorage.getItem(FACE_REPORT_STORAGE_KEY);
    if (raw && raw !== "null" && raw !== "undefined") {
      const p = JSON.parse(raw) as Record<string, unknown>;
      if (p.success === true || p.success === "true") return true;
      if (p.rppg && typeof p.rppg === "object") return true;
      if (p.aiReport && typeof p.aiReport === "object") return true;
    }
    const alt = localStorage.getItem(LATEST_HEALTH_SCAN_KEY);
    if (alt && alt !== "null") {
      const h = JSON.parse(alt) as Record<string, unknown>;
      if (h?.ai_report || h?.aiReport || h?.health_data) return true;
    }
    return false;
  } catch {
    return false;
  }
}
