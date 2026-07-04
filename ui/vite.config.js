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
    },
  },
})
