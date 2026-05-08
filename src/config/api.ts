/**
 * API base URL
 *
 * - Default: browser calls the configured API gateway directly.
 * - Set VITE_API_DIRECT=false only when you intentionally want local dev to use the Vite proxy.
 * - VITE_API_BASE_URL can override the default gateway at build/dev time.
 */

const defaultApiBaseUrl = "https://eu-dev-apigateway.erosuniverse.com";

export const baseApiUrl =
  import.meta.env.DEV && import.meta.env.VITE_API_DIRECT === "false"
    ? ""
    : (import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl).replace(/\/+$/, "");
