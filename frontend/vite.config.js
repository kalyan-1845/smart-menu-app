import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Ensure the base is set to root unless you are hosting on a subpath
  base: '/', 
  build: {
    outDir: 'dist',
  }
})