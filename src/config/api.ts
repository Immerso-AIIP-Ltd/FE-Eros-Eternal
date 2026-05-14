/**
 * Wellness gateway HTTP API
 *
 * **Production:** requests go to the wellness API gateway (absolute URL below).
 *
 * **Local dev (`vite`):** defaults to same-origin `/aitools/wellness/prod/...` so the
 * browser talks to the Vite dev server only; Vite proxies `/aitools` to your backend
 * (see `vite.config.ts` → `VITE_DEV_PROXY_TARGET`). That avoids CORS: the gateway
 * often allows only specific origins (e.g. `http://localhost:3000`), not `5179`.
 *
 * - Force direct browser → gateway in dev (needs matching CORS on server):
 *   `VITE_WELLNESS_DIRECT=true` and optionally `VITE_WELLNESS_API_BASE_URL`.
 * - Override base URL (any mode): `VITE_WELLNESS_API_BASE_URL` (no trailing slash).
 */

const wellnessApiBaseDefault =
  "https://apigateway.erosuniverse.com/aitools/wellness/prod";

function resolveWellnessApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_WELLNESS_API_BASE_URL;
  if (fromEnv) return String(fromEnv).replace(/\/$/, "");

  const dev = import.meta.env.DEV;
  const forceDirect = import.meta.env.VITE_WELLNESS_DIRECT === "true";

  if (dev && !forceDirect) {
    return "/aitools/wellness/prod";
  }

  return wellnessApiBaseDefault;
}

export const wellnessApiBaseUrl = resolveWellnessApiBaseUrl();

export function wellnessApiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${wellnessApiBaseUrl}${p}`;
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
