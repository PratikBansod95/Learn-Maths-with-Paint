import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 4096,
  },
  server: {
    port: 5173,
    open: true,
  },
});
