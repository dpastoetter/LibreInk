#!/usr/bin/env node
/** Copy Stockfish worker and WASM from node_modules to public for dev and build. */
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src = join(root, 'node_modules', 'stockfish.js');
const dest = join(root, 'public');

if (!existsSync(src)) {
  console.warn('stockfish.js not found in node_modules; chess engine will use fallback.');
  process.exit(0);
}
const destDir = dest;
if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
copyFileSync(join(src, 'stockfish.wasm.js'), join(destDir, 'stockfish.wasm.js'));
copyFileSync(join(src, 'stockfish.wasm'), join(destDir, 'stockfish.wasm'));
console.log('Copied Stockfish worker to public/');
