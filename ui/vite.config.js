import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/app/',
  server: {
    proxy: {
      '/service': 'http://localhost:5000',
      '/audio': 'http://localhost:5000',
      '/sl_icons': 'http://localhost:5000',
      '/app/favicon-32x32.png': 'http://localhost:5000/favicon-32x32.png',
      '/app/favicon-16x16.png': 'http://localhost:5000/favicon-16x16.png',
      '/app/apple-touch-icon.png': 'http://localhost:5000/apple-touch-icon.png',
    },
  },
})
