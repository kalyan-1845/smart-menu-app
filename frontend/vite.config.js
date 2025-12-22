import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    // This forces the app to use only one version of React
    dedupe: ['react', 'react-dom'],
  },
})