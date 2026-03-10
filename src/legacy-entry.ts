/**
 * Entry for the single-file legacy (ES5) build. Ensures regenerator-runtime
 * is loaded before the app so async/await works on old engines (e.g. Kindle).
 * Dynamic import of main so any load/parse error is caught and shown on page.
 */
import 'regenerator-runtime/runtime';
import('./main').catch(function (e: unknown) {
  const w = typeof window !== 'undefined' ? (window as Window & { __openinkFallback?: (m: string) => void; __openinkMounted?: boolean }) : null;
  if (w) {
    w.__openinkMounted = true;
    if (w.__openinkFallback) w.__openinkFallback(e != null ? String(e) : 'App failed to load.');
  }
});
