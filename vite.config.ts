import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: '.',
  base: process.env.NODE_ENV === 'production' ? '/wgslCanvas/' : '/',
  build: {
    outDir: 'dist-demo',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    open: true
  }
});