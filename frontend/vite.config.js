import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/', // 👈 This ensures assets load correctly from any URL depth
  server: {
    host: true, // 👈 THIS ALLOWS MOBILE ACCESS
    port: 5173
  },
  build: {
    outDir: 'dist',
  }
})
