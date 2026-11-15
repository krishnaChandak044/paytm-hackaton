import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const backendTarget = process.env.BACKEND_URL || 'http://127.0.0.1:8001'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/health': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/v1': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/demo': {
        target: backendTarget,
        changeOrigin: true,
      },
    },
  },
})

