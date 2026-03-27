import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'

const GATEWAY_ORIGIN = 'https://eu-dev-apigateway.erosuniverse.com'

// https://vite.dev/config/
export default defineConfig({
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
    proxy: {
      // Dev: browser calls /aitools/* same-origin; proxy hits gateway.
      // Rewrite absolute gateway redirects → relative so the browser never follows cross-origin.
      '/aitools': {
        target: GATEWAY_ORIGIN,
        changeOrigin: true,
        secure: true,
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
    allowedHosts: [
      ".shakticloud.ai"
    ]
  }
})