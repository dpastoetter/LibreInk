import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readAppVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(path.join(__dirname, 'package.json'), 'utf8')) as { version?: string };
    return typeof pkg.version === 'string' ? pkg.version : '0.1.1';
  } catch {
    return '0.1.1';
  }
}

const appVersion = readAppVersion();
const appBuild =
  (typeof process !== 'undefined' && process.env.GITHUB_SHA && process.env.GITHUB_SHA.slice(0, 7)) ||
  new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
    'import.meta.env.VITE_APP_BUILD': JSON.stringify(appBuild),
  },
  plugins: [preact()],
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
