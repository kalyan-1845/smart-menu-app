import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // ✅ ADD THIS: Forces scripts to load from the root domain
  base: '/', 
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // ✅ ADD THIS: Organizes assets clearly
    assetsDir: 'assets', 
  }
});