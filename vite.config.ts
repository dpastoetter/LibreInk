import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [preact()],
  define: {
    'import.meta.env.LEGACY': 'true',
  },
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'src/core'),
      '@apps': path.resolve(__dirname, 'src/apps'),
      '@types': path.resolve(__dirname, 'src/types'),
      'virtual:pwa-register': path.resolve(__dirname, 'src/stub-pwa.ts'),
      '@core/icons/app-icons': path.resolve(__dirname, 'src/core/icons/app-icons-legacy.ts'),
      react: 'preact/compat',
      'react-dom': 'preact/compat',
    },
  },
  server: {
    host: true,
  },
  build: {
    target: 'es2015',
    minify: true,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
