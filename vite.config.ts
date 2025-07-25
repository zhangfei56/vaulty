import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
  preview: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      keep_classnames: true,
      keep_fnames: true,
    },
  },
  optimizeDeps: {
    include: ['sql.js'],
  },
  assetsInclude: ['**/*.wasm'],
});
