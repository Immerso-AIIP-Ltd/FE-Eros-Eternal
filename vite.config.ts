import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
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
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '*.ngrok-free.dev',  // Allow all ngrok free domains
      'microtonal-jacquetta-unepigrammatically.ngrok-free.dev',
      'shakticloud.ai',  // Your specific ngrok
      'ungrammatical-skimpily-doretha.ngrok-free.dev',
      'removable-nervily-ervin.ngrok-free.dev'
      'wellness-phc.erosuniverse.com'
    ]
  },
  worker: {
    format: 'es',
  },
  preview: {
    host: true,
    port: 5179,
    allowedHosts: "true"
  }
})
