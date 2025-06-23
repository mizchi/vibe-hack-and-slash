import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    outDir: 'dist-browser'
  },
  esbuild: {
    target: 'esnext',
    supported: {
      'top-level-await': true
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
      supported: {
        'top-level-await': true
      }
    },
    include: [
      'stream-browserify',
      'events',
      'buffer',
      'util',
      'assert',
      'os-browserify',
      'tty-browserify',
      'path-browserify',
      'process',
      'react-dom'
    ]
  },
  resolve: {
    alias: {
      stream: 'stream-browserify',
      events: 'events',
      buffer: 'buffer',
      util: 'util',
      assert: 'assert',
      os: 'os-browserify',
      tty: 'tty-browserify',
      path: 'path-browserify',
      process: 'process/browser'
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env.FORCE_COLOR': JSON.stringify('true'),
    global: 'globalThis',
  },
  server: {
    port: 3000
  }
});