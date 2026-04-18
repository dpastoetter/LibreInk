/**
 * Builds a single IIFE bundle for Kindle/legacy (no SystemJS, no polyfill).
 * Transpiled to ES5 via Babel so old engines (e.g. Kindle Silk) can parse and run it.
 * Targets ES5 (basic JavaScript) for maximum Kindle compatibility.
 */
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import babel from '@rollup/plugin-babel';

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
  define: {
    'import.meta.env.PROD': 'true',
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
    'import.meta.env.VITE_APP_BUILD': JSON.stringify(appBuild),
  },
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: { compress: { passes: 1 }, format: { comments: false } },
    sourcemap: false,
    emptyOutDir: true,
    outDir: 'dist',
    lib: {
      entry: path.resolve(__dirname, 'src/legacy-entry.ts'),
      name: 'LibreInk',
      formats: ['iife'],
      fileName: () => 'assets/openink-legacy-single.js',
    },
    rollupOptions: {
      plugins: [
        babel({
          babelHelpers: 'bundled',
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
          exclude: /node_modules/,
          presets: [
            [
              '@babel/preset-env',
              {
                targets: { ie: 9 },
                modules: false,
              },
            ],
          ],
        }),
      ],
      output: {
        inlineDynamicImports: true,
        assetFileNames: 'assets/openink-legacy-single.[ext]',
      },
    },
    cssCodeSplit: true,
  },
});
