import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: [
      "nonpopularly-thankless-keshia.ngrok-free.dev",
      ".ngrok-free.dev",
      "localhost"
    ],
    proxy: {
      '/api': {
        target: 'https://plant-disease-identifier-3bxa.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/uploads': {
        target: 'https://plant-disease-identifier-3bxa.onrender.com',
        changeOrigin: true,
      },
    },
  },
})
