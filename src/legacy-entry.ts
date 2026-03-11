/**
 * Entry for the single-file legacy (ES5) build. Ensures regenerator-runtime
 * is loaded before the app so async/await works on old engines (e.g. Kindle).
 * Snake is loaded here so it is registered at startup and does not rely on
 * dynamic import(), which can fail on Kindle/Silk.
 */
import 'regenerator-runtime/runtime';
import { snakeApp } from './apps/games/snake-app';

declare global {
  interface Window {
    __openinkSnake?: typeof snakeApp;
  }
}
window.__openinkSnake = snakeApp;

import './main';
