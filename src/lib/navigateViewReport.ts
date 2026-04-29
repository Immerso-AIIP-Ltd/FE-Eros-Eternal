import type { NavigateFunction } from "react-router-dom";
import { getWellnessStoredUserId } from "@/lib/wellnessUserId";

/** Opens individual report viewer with query params so refresh still works. */
export function navigateToViewReport(
  navigate: NavigateFunction,
  options: {
    reportType: string;
    userId?: string | null;
    title?: string;
    scrollToRecommendations?: boolean;
  },
): void {
  const userId = options.userId ?? getWellnessStoredUserId();
  if (!userId) return;
  const qs = new URLSearchParams({
    report_type: options.reportType,
    user_id: userId,
  });
  navigate(`/view-report?${qs.toString()}`, {
    state: {
      reportType: options.reportType,
      userId,
      title: options.title,
      scrollToRecommendations: options.scrollToRecommendations,
    },
  });
}
