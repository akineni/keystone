import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Served directly by Vite (dev server or `vite preview`), not by Laravel's
// public/ folder: its PHP dev server 404s any path under an existing
// directory before the router even runs, which broke client-side routing.
// Vite's own dev/preview servers proxy /api straight through to the Laravel
// backend, so the app always calls the same relative '/api/v1' in every mode.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
