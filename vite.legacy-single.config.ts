/**
 * Builds a single IIFE bundle for Kindle/legacy (no SystemJS, no polyfill).
 * One script tag = one file; works on browsers that fail on System.import or ES modules.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'src/core'),
      '@apps': path.resolve(__dirname, 'src/apps'),
      '@types': path.resolve(__dirname, 'src/types'),
      'virtual:pwa-register': path.resolve(__dirname, 'src/stub-pwa.ts'),
    },
  },
  define: {
    'import.meta.env.LEGACY': 'true',
    'import.meta.env.PROD': 'true',
  },
  build: {
    target: 'es2015',
    minify: true,
    emptyOutDir: false,
    outDir: 'dist',
    lib: {
      entry: path.resolve(__dirname, 'src/main.tsx'),
      name: 'OpenInk',
      formats: ['iife'],
      fileName: () => 'assets/openink-legacy-single.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        assetFileNames: 'assets/openink-legacy-single.[ext]',
      },
    },
    cssCodeSplit: true,
  },
});
