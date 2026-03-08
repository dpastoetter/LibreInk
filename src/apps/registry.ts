import type { AppDescriptor, WebOSApp } from '../types/plugin';
import { AppRegistry } from '../core/plugins/registry';

/** Descriptor + lazy loader for each app. Keeps initial bundle small on low-spec e-ink. */
const LAZY_APPS: { descriptor: AppDescriptor; load: () => Promise<WebOSApp> }[] = [
  { descriptor: { id: 'calculator', name: 'Calculator', icon: '🔢', category: 'reader' }, load: () => import('./calculator').then((m) => m.calculatorApp) },
  { descriptor: { id: 'chess', name: 'Chess', icon: '♟️', category: 'game' }, load: () => import('./games/chess-app').then((m) => m.chessApp) },
  { descriptor: { id: 'comics', name: 'Comics', icon: '🗞️', category: 'reader' }, load: () => import('./comics').then((m) => m.comicsApp) },
  { descriptor: { id: 'dictionary', name: 'Dictionary', icon: '📖', category: 'reader' }, load: () => import('./dictionary').then((m) => m.dictionaryApp) },
  { descriptor: { id: 'finance', name: 'Finance', icon: '📈', category: 'network' }, load: () => import('./finance').then((m) => m.financeApp) },
  { descriptor: { id: 'minesweeper', name: 'Minesweeper', icon: '💣', category: 'game' }, load: () => import('./games/minesweeper-app').then((m) => m.minesweeperApp) },
  { descriptor: { id: 'news', name: 'News', icon: '📰', category: 'network' }, load: () => import('./news').then((m) => m.newsApp) },
  { descriptor: { id: 'racing', name: 'Racing', icon: '🏎️', category: 'game' }, load: () => import('./games/racing-app').then((m) => m.racingApp) },
  { descriptor: { id: 'reddit', name: 'Reddit', icon: '🔴', category: 'network' }, load: () => import('./reddit').then((m) => m.redditApp) },
  { descriptor: { id: 'stopwatch', name: 'Stopwatch', icon: '⏲️', category: 'system' }, load: () => import('./stopwatch').then((m) => m.stopwatchApp) },
  { descriptor: { id: 'sudoku', name: 'Sudoku', icon: '🔢', category: 'game' }, load: () => import('./games/sudoku-app').then((m) => m.sudokuApp) },
  { descriptor: { id: 'timer', name: 'Timer', icon: '⏱️', category: 'system' }, load: () => import('./timer').then((m) => m.timerApp) },
  { descriptor: { id: 'weather', name: 'Weather', icon: '🌤️', category: 'network' }, load: () => import('./weather').then((m) => m.weatherApp) },
  { descriptor: { id: 'worldclock', name: 'World clock', icon: '🌐', category: 'system' }, load: () => import('./worldclock').then((m) => m.worldclockApp) },
  { descriptor: { id: 'settings', name: 'Settings', icon: '⚙️', category: 'system' }, load: () => import('./settings').then((m) => m.settingsApp) },
];

/** Registers all built-in apps as lazy (load on first launch). Called once at startup. */
export function registerAllApps(): void {
  LAZY_APPS.forEach(({ descriptor, load }) => AppRegistry.registerLazy(descriptor, load));
}
