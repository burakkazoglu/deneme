import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/assets/',
  build: {
    outDir: 'public/assets',
    emptyOutDir: true,
    assetsDir: '',
    cssCodeSplit: false,
    rollupOptions: {
      input: 'src/main.jsx',
      output: {
        entryFileNames: 'app.js',
        assetFileNames: 'app.[ext]',
        inlineDynamicImports: true
      }
    }
  }
});
