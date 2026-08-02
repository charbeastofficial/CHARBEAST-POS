import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths so the built dist/index.html loads correctly from
  // Electron's file:// protocol, not just from an http server root.
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    port: 3001,
  },
})
