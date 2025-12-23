import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    // 🔒 Security: Prevents duplicate React instances
    dedupe: ['react', 'react-dom'],
    alias: {
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    }
  },
  build: {
    outDir: 'dist', // Ensures build files go to the correct folder for Netlify
    assetsDir: 'assets',
    emptyOutDir: true
  }
})