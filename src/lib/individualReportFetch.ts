import { eternalUserIdHeaders, wellnessApiUrl } from "@/config/api";
import { hasWellnessIndividualReport } from "@/lib/wellnessReportPayload";

/** Dedupes concurrent GETs and reuses the last JSON per user + report_type (avoids duplicate 307/follow-up rows from Strict Mode or staggered mounts). */
const inflight = new Map<string, Promise<unknown>>();
const settled = new Map<string, unknown>();

export function invalidateIndividualReportCache(
  userId?: string,
  reportType?: string,
) {
  if (userId != null && reportType != null) {
    settled.delete(`${userId}:${reportType}`);
    return;
  }
  settled.clear();
}

export function fetchIndividualReportJson(
  userId: string,
  reportType: string,
): Promise<unknown> {
  const key = `${userId}:${reportType}`;

  if (settled.has(key)) {
    return Promise.resolve(settled.get(key));
  }

  const existing = inflight.get(key);
  if (existing) return existing;

  const url = `${wellnessApiUrl("/reports/individual_report")}?report_type=${encodeURIComponent(reportType)}`;

  const p = fetch(url, { headers: eternalUserIdHeaders(userId) })
    .then((r) => r.json())
    .then((data) => {
      // Do not cache "no report" payloads — after generating on the server, UI must refetch.
      if (hasWellnessIndividualReport(data as { success?: boolean; data?: { report_data?: unknown } })) {
        settled.set(key, data);
      }
      return data;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, p);
  return p;
}
