/**
 * API base URL
 *
 * - Local dev: default "" so requests are same-origin and Vite proxies (see vite.config).
 * - Set VITE_API_DIRECT=true only if the gateway allowlists your origin for CORS.
 * - Production / direct mode: VITE_API_BASE_URL or gateway default.
 *
 * Route prefix: many deployments mount the API under `/aitools/wellness` (not at the host root).
 * - Default prefix: `/aitools/wellness` (works with dev proxy to your tunnel).
 * - Postman-style root routes only: set `VITE_WELLNESS_API_PREFIX=` (empty) in `.env`.
 */

const remoteDefault = "https://eu-dev-apigateway.erosuniverse.com";

/** Default LAN gateway origin (no path). Full base = this + `wellnessApiPrefix` → `…/aitools/wellness`. */
const devApiOriginDefault = "http://192.168.1.171:6007";

export const baseApiUrl =
  import.meta.env.DEV && import.meta.env.VITE_API_DIRECT !== "true"
    ? ""
    : import.meta.env.VITE_API_BASE_URL ||
      (import.meta.env.DEV ? devApiOriginDefault : remoteDefault);

/**
 * Path segment before each route (e.g. `/users/profile` → `/aitools/wellness/users/profile`).
 * Override with `VITE_WELLNESS_API_PREFIX` (use empty string for API at host root).
 */
export const wellnessApiPrefix =
  import.meta.env.VITE_WELLNESS_API_PREFIX !== undefined
    ? String(import.meta.env.VITE_WELLNESS_API_PREFIX).replace(/\/$/, "")
    : "/aitools/wellness";

export function wellnessApiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${baseApiUrl}${wellnessApiPrefix}${p}`;
}

/** User id is sent in `x-user-id` (Eternal LangChain / Postman). */
export function eternalUserIdHeaders(
  userId: string | null | undefined,
  init?: { json?: boolean; extra?: Record<string, string> },
): Record<string, string> {
  const h: Record<string, string> = { ...(init?.extra ?? {}) };
  if (userId) h["x-user-id"] = userId;
  if (init?.json) h["Content-Type"] = "application/json";
  return h;
}
