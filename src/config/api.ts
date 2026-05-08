/**
 * API base URL
 *
 * - Default: browser calls the configured API gateway directly.
 * - Set VITE_API_DIRECT=false only when you intentionally want local dev to use the Vite proxy.
 * - VITE_API_BASE_URL can override the default gateway at build/dev time.
 * - If VITE_API_BASE_URL includes `/aitools/wellness`, normalize it because
 *   existing endpoint strings already include that service prefix.
 */

const defaultApiBaseUrl = "https://apigateway.erosuniverse.com/aitools/wellness";

function normalizeApiBaseUrl(url: string) {
  return url.replace(/\/+$/, "").replace(/\/aitools\/wellness$/, "");
}

export const baseApiUrl =
  import.meta.env.DEV && import.meta.env.VITE_API_DIRECT === "false"
    ? ""
    : normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl);
