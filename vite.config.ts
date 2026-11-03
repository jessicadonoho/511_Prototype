import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base: './' keeps every asset URL relative, so the build works on GitHub Pages
// (https://<user>.github.io/<repo>/), Netlify, Vercel, or any static folder
// without editing this file. HashRouter handles the routes.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  worker: { format: 'es' },
  build: { chunkSizeWarningLimit: 6000 },
})
