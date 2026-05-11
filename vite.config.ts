import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'

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
  ],

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
      '*.ngrok-free.dev',
      'microtonal-jacquetta-unepigrammatically.ngrok-free.dev',
      'shakticloud.ai',
      'ungrammatical-skimpily-doretha.ngrok-free.dev',
      'removable-nervily-ervin.ngrok-free.dev',
      'wellness-phc.erosuniverse.com'
    ]
  },

  worker: {
    format: 'es',
  },

  preview: {
    host: true,
    port: 5179,
    allowedHosts: true
  }
})