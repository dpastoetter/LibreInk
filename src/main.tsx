import { render } from 'preact';
import { createStorageService } from './core/services/storage';
import { createNetworkService } from './core/services/network';
import { createThemeService } from './core/services/theme';
import { createSettingsService } from './core/services/settings';
import { setRootFallback, LOAD_ERROR_MESSAGE } from './core/utils/fallback-ui';
import { Shell } from './core/kernel/shell';
import { registerAllApps } from './apps/registry';
import { DEFAULT_SETTINGS } from './types/settings';
import './index.css';

/** Legacy loader contract: set by legacy.html so the app can report errors or mounted state. */
interface LegacyWindow {
  __openinkMounted?: boolean;
  __openinkFallback?: (msg: string) => void;
  __openinkError?: string;
}

function showLegacyFallback(error: unknown): void {
  const win = typeof window !== 'undefined' ? (window as unknown as LegacyWindow) : null;
  if (!win) return;
  win.__openinkMounted = true;
  win.__openinkError = error != null ? String(error) : LOAD_ERROR_MESSAGE;
  if (win.__openinkFallback) {
    win.__openinkFallback(win.__openinkError);
  } else {
    const root = document.getElementById('root');
    if (root) setRootFallback(root, win.__openinkError);
  }
}

// Register PWA service worker only on http/https; skip on Kindle/Silk and similar browsers that show "invalid protocol" or don't support SW.
const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
const isKindleOrRestricted = /\b(Kindle|Silk|Oasis)\b/i.test(ua);
const canUseSW =
  import.meta.env.PROD &&
  !isKindleOrRestricted &&
  'serviceWorker' in navigator &&
  (location.protocol === 'https:' || (location.protocol === 'http:' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')));
if (canUseSW) {
  import('virtual:pwa-register')
    .then(({ registerSW }) => registerSW({ immediate: true }))
    .catch(() => {});
}

let storage: ReturnType<typeof createStorageService>;
let network: ReturnType<typeof createNetworkService>;
let theme: ReturnType<typeof createThemeService>;
let settings: ReturnType<typeof createSettingsService>;
try {
  storage = createStorageService();
  network = createNetworkService();
  theme = createThemeService(DEFAULT_SETTINGS);
  settings = createSettingsService(storage, theme);
  registerAllApps();

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isLegacyPath = /legacy\.html$/i.test(pathname);
  const isLegacyBundle = typeof import.meta.env.LEGACY !== 'undefined' && import.meta.env.LEGACY;
  if (isLegacyPath && !isLegacyBundle) {
    // Modern bundle running with legacy URL = wrong file served; leave the inline message.
  } else {
    init().catch(showLegacyFallback);
  }
} catch (e) {
  showLegacyFallback(e);
}

function renderShell(root: HTMLElement) {
  render(
    <Shell
      services={{
        storage,
        network,
        theme,
        settings,
      }}
    />,
    root
  );
  if (typeof window !== 'undefined') (window as unknown as { __openinkMounted?: boolean }).__openinkMounted = true;
}

async function init() {
  const root = document.getElementById('root');
  if (!root) return;
  try {
    const loadTimeout = 5000;
    await Promise.race([
      settings.load().catch(() => ({ ...DEFAULT_SETTINGS })),
      new Promise<void>((resolve) => setTimeout(resolve, loadTimeout)),
    ]);
    renderShell(root);
  } catch (e) {
    showLegacyFallback(e);
  }
}
