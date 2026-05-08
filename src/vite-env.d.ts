/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_DIRECT?: string;
  /** Dev only: origin Vite proxies `/aitools/*` (and friends) to (e.g. ngrok tunnel). */
  readonly VITE_DEV_PROXY_TARGET?: string;
  /**
   * Path before API routes. Default `/aitools/wellness`. Set to empty string if routes are at host root.
   */
  readonly VITE_WELLNESS_API_PREFIX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
