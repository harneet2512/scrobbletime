import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    fs: {
      allow: ['../..'],
    },
  },
  publicDir: resolve(__dirname, '../../output'),
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ScrobbleTime',
      formats: ['iife'],
      fileName: () => 'scrobbletime.js',
    },
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
    minify: 'terser',
    target: 'es2020',
  },
});
