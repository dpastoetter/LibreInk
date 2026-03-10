import type { GlobalSettings } from '../../types/settings';

export type ThemeListener = (settings: GlobalSettings) => void;

export interface ThemeService {
  getSettings(): GlobalSettings;
  subscribe(listener: ThemeListener): () => void;
  /** Called by SettingsService when settings change; not by apps directly. */
  applySettings(settings: GlobalSettings): void;
}

/** Holds current theme state and notifies subscribers; actual CSS is applied via document classes. */
export function createThemeService(initial: GlobalSettings): ThemeService {
  let settings = initial;
  const listeners = new Set<ThemeListener>();

  return {
    getSettings: () => ({ ...settings }),

    subscribe(listener: ThemeListener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    applySettings(next: GlobalSettings) {
      settings = next;
      try {
        const root = document.documentElement;
        if (root) {
          root.setAttribute('data-pixel-optics', next.pixelOptics);
          root.setAttribute('data-color-mode', next.colorMode);
          root.setAttribute('data-font-size', next.fontSize);
          root.setAttribute('data-theme', next.theme);
          root.setAttribute('data-appearance', next.appearance);
          const zoom = Math.max(0.5, Math.min(2, Number(next.zoom) || 1));
          root.style.setProperty('--zoom', String(zoom));
        }
        listeners.forEach((l) => l(settings));
      } catch (_) {
        // Old browsers (e.g. Kindle) may not support setAttribute or setProperty
      }
    },
  };
}
