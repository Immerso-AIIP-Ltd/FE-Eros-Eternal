/** localStorage key written by FaceScanner / FaceReportPage after a completed Vita Scan */
export const FACE_REPORT_STORAGE_KEY = "faceReportData";

export function hasVitaScanReportCached(): boolean {
  try {
    const raw = localStorage.getItem(FACE_REPORT_STORAGE_KEY);
    if (!raw) return false;
    const p = JSON.parse(raw) as { success?: boolean; rppg?: unknown };
    if (p.success === true) return true;
    if (p.rppg && typeof p.rppg === "object") return true;
    return false;
  } catch {
    return false;
  }
}
