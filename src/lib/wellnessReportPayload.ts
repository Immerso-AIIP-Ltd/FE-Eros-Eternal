/**
 * individual_report API: treat as "generated" when success + non-empty report_data.
 * (Some report types nest scores without filling `assessment` the same way as vibrational_frequency.)
 */
export function hasWellnessIndividualReport(data: {
  success?: boolean | string | number;
  data?: { report_data?: unknown };
}): boolean {
  const ok =
    data.success === true ||
    data.success === "true" ||
    data.success === 1 ||
    data.success === "1";
  if (!ok || data.data?.report_data == null) return false;
  const rd = data.data.report_data;
  if (typeof rd === "string") return rd.trim().length > 0;
  if (Array.isArray(rd)) return rd.length > 0;
  if (typeof rd === "object" && rd !== null) {
    return Object.keys(rd as object).length > 0;
  }
  return true;
}
