/**
 * API base URL
 *
 * - Local dev: default "" so requests are same-origin `/aitools/...` and Vite proxies (see vite.config).
 * - Set VITE_API_DIRECT=true only if the gateway allowlists your origin for CORS.
 * - Production / direct mode: VITE_API_BASE_URL or gateway default.
 */

const remoteDefault = "https://eu-dev-apigateway.erosuniverse.com";

export const baseApiUrl =
  import.meta.env.DEV && import.meta.env.VITE_API_DIRECT !== "true"
    ? ""
    : import.meta.env.VITE_API_BASE_URL || remoteDefault;
