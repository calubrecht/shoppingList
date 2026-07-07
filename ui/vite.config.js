import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Mirrors the production Apache RewriteRule (apacheConfig/kitchen.conf) that
// serves the app for the password-reset email's link; the token itself stays
// in the URL path and is read there client-side (App.jsx), since this is an
// internal rewrite with no client-visible redirect.
function resetPasswordLinkRewrite() {
  return {
    name: 'reset-password-link-rewrite',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (/^\/resetPassword\//.test(req.url)) req.url = '/app/'
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), resetPasswordLinkRewrite()],
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
