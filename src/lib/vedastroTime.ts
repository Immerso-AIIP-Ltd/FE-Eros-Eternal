/**
 * Vedastro API expects time of birth as strict 24h `HH:MM` (two-digit hour and minute).
 * Normalizes profile strings, optional seconds, 12h with AM/PM, and Unicode digits.
 */
export function normalizeVedastroTob(raw: string): string {
  const s = raw.normalize("NFKC").trim().replace(/\u00a0/g, " ");
  // 12h with optional space before AM/PM
  const ampmMatch = /^(\d{1,2})[:.](\d{1,2})(?::\d{1,2})?\s*([AaPp][Mm])?$/.exec(
    s.replace(/\s+/g, " ").trim(),
  );
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const min = parseInt(ampmMatch[2], 10);
    const ap = ampmMatch[3]?.toUpperCase();
    if (ap === "PM" && h !== 12) h += 12;
    if (ap === "AM" && h === 12) h = 0;
    if (h < 0 || h > 23 || min < 0 || min > 59) {
      throw new Error(`Invalid time of birth: ${raw}`);
    }
    const p2 = (n: number) => n.toString().padStart(2, "0");
    return `${p2(h)}:${p2(min)}`;
  }

  // 24h: HH:MM or HH:MM:SS or H:MM (dots as separator)
  const m = /^(\d{1,2})[:.](\d{1,2})(?::(\d{1,2}))?$/.exec(
    s.replace(/\s+/g, "").replace(/[.\u00b7]/g, ":"),
  );
  if (!m) {
    throw new Error(`Invalid time of birth: ${raw}`);
  }
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) {
    throw new Error(`Invalid time of birth: ${raw}`);
  }
  const p2 = (n: number) => n.toString().padStart(2, "0");
  return `${p2(h)}:${p2(min)}`;
}
