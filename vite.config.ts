import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const GATEWAY_ORIGIN =
    env.VITE_DEV_PROXY_TARGET || 'http://192.168.1.171:6007'

  return {
  base: '/wellness/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['@mui/material', '@mui/icons-material'],
  },
  plugins: [
    react(),
    tailwindcss(),
    // ✅ Plugins only go here
  ],
  // ✅ These are top-level options, NOT inside plugins
  optimizeDeps: {
    include: ['@mui/icons-material/ArrowDropDown'],
  },
  assetsInclude: ['**/*.tflite', '**/*.gz'],
  server: {
    host: true,
    port: 5179,
    proxy: {
      // Dev: browser calls /aitools/* same-origin; proxy forwards to GATEWAY_ORIGIN
      // (defaults to the gateway, override locally via VITE_DEV_PROXY_TARGET).
      // Rewrite absolute backend redirects → relative so the browser never follows cross-origin.
      // Eternal LangChain routes at API root (Postman); same gateway target as /aitools
      '/users': { target: GATEWAY_ORIGIN, changeOrigin: true, secure: GATEWAY_ORIGIN.startsWith('https://') },
      '/chat': { target: GATEWAY_ORIGIN, changeOrigin: true, secure: GATEWAY_ORIGIN.startsWith('https://') },
      '/reports': { target: GATEWAY_ORIGIN, changeOrigin: true, secure: GATEWAY_ORIGIN.startsWith('https://') },
      '/numerology': { target: GATEWAY_ORIGIN, changeOrigin: true, secure: GATEWAY_ORIGIN.startsWith('https://') },
      '/vedastro': { target: GATEWAY_ORIGIN, changeOrigin: true, secure: GATEWAY_ORIGIN.startsWith('https://') },
      '/analysis': { target: GATEWAY_ORIGIN, changeOrigin: true, secure: GATEWAY_ORIGIN.startsWith('https://') },
      '/face_reading': { target: GATEWAY_ORIGIN, changeOrigin: true, secure: GATEWAY_ORIGIN.startsWith('https://') },
      '/health': { target: GATEWAY_ORIGIN, changeOrigin: true, secure: GATEWAY_ORIGIN.startsWith('https://') },
      '/welcome': { target: GATEWAY_ORIGIN, changeOrigin: true, secure: GATEWAY_ORIGIN.startsWith('https://') },
      '/healing': { target: GATEWAY_ORIGIN, changeOrigin: true, secure: GATEWAY_ORIGIN.startsWith('https://') },
      '/bio': { target: GATEWAY_ORIGIN, changeOrigin: true, secure: GATEWAY_ORIGIN.startsWith('https://') },
      '/aitools': {
        target: GATEWAY_ORIGIN,
        changeOrigin: true,
        secure: GATEWAY_ORIGIN.startsWith('https://'),
        configure(proxy) {
          proxy.on('proxyRes', (proxyRes) => {
            const code = proxyRes.statusCode
            const loc = proxyRes.headers.location
            if (!code || code < 300 || code >= 400 || !loc) return
            try {
              const absolute = new URL(loc, GATEWAY_ORIGIN)
              if (
                absolute.origin === new URL(GATEWAY_ORIGIN).origin &&
                absolute.pathname.startsWith('/aitools')
              ) {
                proxyRes.headers.location = `${absolute.pathname}${absolute.search}`
              }
            } catch {
              /* ignore bad Location */
            }
          })
        },
      },
    },
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '192.168.1.171',
      '*.ngrok-free.dev',  // Allow all ngrok free domains
      'microtonal-jacquetta-unepigrammatically.ngrok-free.dev',
      'shakticloud.ai',  // Your specific ngrok
      'ungrammatical-skimpily-doretha.ngrok-free.dev',
      'removable-nervily-ervin.ngrok-free.dev'
    ]
  },
  worker: {
    format: 'es',
  },
  preview: {
    host: true,
    port: 5179,
    allowedHosts: "all"
  },
  }
})