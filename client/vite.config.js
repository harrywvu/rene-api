import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/assess': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      '/assess': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
