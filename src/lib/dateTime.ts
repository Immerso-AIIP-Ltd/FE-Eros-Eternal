const IST_TIME_ZONE = "Asia/Kolkata";

const hasExplicitTimeZone = (value: string) => {
  return /(?:z|[+-]\d{2}:?\d{2})$/i.test(value.trim());
};

function parseBackendTimestamp(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const looksLikeDateTime = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(trimmed);
  const normalized =
    looksLikeDateTime && !hasExplicitTimeZone(trimmed)
      ? `${trimmed.replace(" ", "T")}Z`
      : trimmed;

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatIstDateTime(value?: string | null) {
  if (!value) return "—";
  const date = parseBackendTimestamp(value);
  if (!date) return value;

  return date.toLocaleString("en-IN", {
    timeZone: IST_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
