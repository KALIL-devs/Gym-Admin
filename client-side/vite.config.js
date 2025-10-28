import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // ⭐ CRITICAL FIX: Ensures relative paths are used for assets
  build: {
    outDir: 'dist', // Ensures output is consistent
  }
});