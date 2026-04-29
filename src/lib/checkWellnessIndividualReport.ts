import { fetchIndividualReportJson } from "@/lib/individualReportFetch";
import { hasWellnessIndividualReport } from "@/lib/wellnessReportPayload";

export async function checkWellnessIndividualReportExists(
  userId: string,
  reportType: string,
): Promise<boolean> {
  try {
    const data = await fetchIndividualReportJson(userId, reportType);
    return hasWellnessIndividualReport(
      data as { success?: boolean; data?: { report_data?: unknown } },
    );
  } catch {
    return false;
  }
}
