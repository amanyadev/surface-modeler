import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    target: 'es2022',
  },
  resolve: {
    alias: {
      '@half-edge/kernel': path.resolve(__dirname, '../../packages/kernel/dist'),
    },
  },
  optimizeDeps: {
    include: ['@half-edge/kernel'],
  },
});