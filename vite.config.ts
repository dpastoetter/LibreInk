import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import legacy from '@vitejs/plugin-legacy';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    preact(),
    // Legacy build (nomodule) for Kindle and other browsers that don't support ES modules or modern JS.
    legacy({
      targets: ['defaults', 'not supports es6-module'],
      modernPolyfills: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: { globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'] },
      manifest: false, // we use public/manifest.json
    }),
  ],
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'src/core'),
      '@apps': path.resolve(__dirname, 'src/apps'),
      '@types': path.resolve(__dirname, 'src/types'),
    },
  },
  server: {
    host: true, // listen on 0.0.0.0 so other devices on your LAN can reach it
  },
  build: {
    target: 'es2015', // Kindle and other e-ink browsers often use older engines; es2015 maximizes compatibility
    minify: true,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
