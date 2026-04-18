import { useState, useEffect, useMemo, useCallback } from 'preact/hooks';
import type { AppContext, AppInstance } from '../../types/plugin';
import type {
  GlobalSettings,
  FontSize,
  Appearance,
  PerformanceProfilePreset,
  ReaderImageModePreset,
  OfflinePreferencePreset,
} from '../../types/settings';
import { PLUGIN_API_VERSION } from '../../types/plugin';
import { AppRegistry } from '@core/plugins/registry';
import { mergeImportedSettings, pickGlobalSettingsShape, replaceImportedSettings } from '@core/utils/settings-import';
import { parseHomeFavoriteIds, favoriteIdsToJson } from '@core/utils/home-favorites';
import { getAppVersion, getAppBuild } from '../../version';
import { getLastNetworkError, clearLastNetworkError } from '@core/services/network-last-error';

const FONT_OPTIONS: { value: FontSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const APPEARANCE_OPTIONS: { value: Appearance; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const PERFORMANCE_OPTIONS: { value: PerformanceProfilePreset; label: string; hint: string }[] = [
  { value: 'normal', label: 'Normal', hint: 'Default network and cache behavior.' },
  { value: 'lowPower', label: 'Low power', hint: 'Fewer parallel requests, longer cache reuse, lighter shadows (e-ink / Kindle).' },
];

const READER_IMAGE_OPTIONS: { value: ReaderImageModePreset; label: string; hint: string }[] = [
  { value: 'full', label: 'Full', hint: 'Show thumbnails where available.' },
  { value: 'lazy', label: 'Lazy', hint: 'Load images after layout (default-friendly).' },
  { value: 'text', label: 'Text only', hint: 'Hide strip and recipe thumbnails to save decode time.' },
];

const OFFLINE_OPTIONS: { value: OfflinePreferencePreset; label: string; hint: string }[] = [
  { value: 'preferCache', label: 'Prefer cache', hint: 'Use cached feeds when the network fails; reader apps may show a Stale label.' },
  { value: 'ask', label: 'Ask', hint: 'On failure, offer Retry before using cache where supported.' },
  { value: 'block', label: 'Block', hint: 'Avoid network when offline (navigator.onLine is false); show offline message.' },
];

function SettingsApp(context: AppContext): AppInstance {
  function SettingsUI() {
    const settingsSvc = context.services.settings;
    const storage = context.services.storage;
    const [settings, setSettings] = useState<GlobalSettings>(() => settingsSvc.get());
    const [clearCacheMessage, setClearCacheMessage] = useState<string | null>(null);
    const [importText, setImportText] = useState('');
    const [importMerge, setImportMerge] = useState(true);
    const [importMessage, setImportMessage] = useState<string | null>(null);
    const [storageKeyCount, setStorageKeyCount] = useState<number | null>(null);
    const [diagMessage, setDiagMessage] = useState<string | null>(null);

    useEffect(() => {
      setSettings(settingsSvc.get());
    }, [settingsSvc]);

    const refreshDiag = useCallback(async () => {
      try {
        const keys = await storage.keys();
        setStorageKeyCount(keys.length);
      } catch {
        setStorageKeyCount(null);
      }
    }, [storage]);

    useEffect(() => {
      void refreshDiag();
    }, [refreshDiag]);

    const update = (partial: Partial<GlobalSettings>) => {
      const next = { ...settings, ...partial };
      setSettings(next);
      void settingsSvc.set(partial);
    };

    const handleClearCaches = async () => {
      setClearCacheMessage(null);
      try {
        const keys = await storage.keys();
        const appPrefixes = ['news:', 'reddit:', 'comics:', 'weather:', 'dictionary:', 'finance:', 'blog:'];
        let cleared = 0;
        for (const key of keys) {
          if (key === 'global-settings') continue;
          if (appPrefixes.some((p) => key.startsWith(p))) {
            await storage.remove(key);
            cleared++;
          }
        }
        setClearCacheMessage(cleared > 0 ? `Cleared ${cleared} cache entries.` : 'No app caches to clear.');
      } catch {
        setClearCacheMessage('Could not clear caches.');
      }
      void refreshDiag();
    };

    const exportJson = () => {
      const blob = new Blob([JSON.stringify(settingsSvc.get(), null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'libreink-settings.json';
      a.click();
      URL.revokeObjectURL(a.href);
    };

    const runImport = async () => {
      setImportMessage(null);
      try {
        const raw = JSON.parse(importText) as unknown;
        const picked = pickGlobalSettingsShape(raw);
        const merged = importMerge
          ? mergeImportedSettings({ ...settingsSvc.get(), ...picked })
          : replaceImportedSettings(picked);
        await settingsSvc.set(merged as Partial<GlobalSettings>);
        setSettings(settingsSvc.get());
        setImportMessage('Settings imported.');
      } catch {
        setImportMessage('Invalid JSON or incompatible data.');
      }
    };

    const allDescriptors = useMemo(
      () => AppRegistry.getAllAppDescriptors().filter((a) => a.id !== 'settings'),
      []
    );
    const favoriteIds = useMemo(() => parseHomeFavoriteIds(settings.homeFavoriteAppIds), [settings.homeFavoriteAppIds]);

    const toggleFavorite = (id: string) => {
      let next = [...favoriteIds];
      if (next.includes(id)) next = next.filter((x) => x !== id);
      else if (next.length < 8) next.push(id);
      update({ homeFavoriteAppIds: favoriteIdsToJson(next) });
    };

    const applyOutdoor = () => {
      update({
        appearance: 'light',
        theme: 'highContrast',
        fontSize: 'large',
        pixelOptics: 'highContrastText',
      });
    };

    const applyNight = () => {
      update({
        appearance: 'dark',
        theme: 'normal',
        fontSize: 'medium',
        pixelOptics: 'standard',
      });
    };

    const quietStartStr = `${String(Math.floor(settings.quietHoursStartMinutes / 60)).padStart(2, '0')}:${String(settings.quietHoursStartMinutes % 60).padStart(2, '0')}`;
    const quietEndStr = `${String(Math.floor(settings.quietHoursEndMinutes / 60)).padStart(2, '0')}:${String(settings.quietHoursEndMinutes % 60).padStart(2, '0')}`;

    const setQuietStartFromInput = (hhmm: string) => {
      const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
      if (!m) return;
      const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
      const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
      update({ quietHoursStartMinutes: h * 60 + min });
    };

    const setQuietEndFromInput = (hhmm: string) => {
      const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
      if (!m) return;
      const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
      const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
      update({ quietHoursEndMinutes: h * 60 + min });
    };

    return (
      <div class="settings-app">
        <section class="panel">
          <h2 class="panel-title">Font size</h2>
          {FONT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              class={`btn ${settings.fontSize === opt.value ? 'btn-active' : ''}`}
              onClick={() => update({ fontSize: opt.value })}
              onTouchEnd={(e) => { e.preventDefault(); update({ fontSize: opt.value }); }}
            >
              {opt.label}
            </button>
          ))}
        </section>
        <section class="panel">
          <h2 class="panel-title">Appearance</h2>
          {APPEARANCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              class={`btn ${settings.appearance === opt.value ? 'btn-active' : ''}`}
              onClick={() => update({ appearance: opt.value })}
              onTouchEnd={(e) => { e.preventDefault(); update({ appearance: opt.value }); }}
            >
              {opt.label}
            </button>
          ))}
        </section>
        <section class="panel">
          <h2 class="panel-title">Display presets</h2>
          <p class="panel-description">One-tap bundles for common e-ink situations.</p>
          <button type="button" class="btn" onClick={applyOutdoor} onTouchEnd={(e) => { e.preventDefault(); applyOutdoor(); }}>
            Outdoor / bright
          </button>
          <button type="button" class="btn" onClick={applyNight} onTouchEnd={(e) => { e.preventDefault(); applyNight(); }}>
            Night
          </button>
        </section>
        <section class="panel">
          <h2 class="panel-title">Performance</h2>
          <p class="panel-description">Tune for slow devices and e-ink. Low power limits concurrent network requests and extends cache lifetime.</p>
          {PERFORMANCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              class={`btn ${settings.performanceProfile === opt.value ? 'btn-active' : ''}`}
              onClick={() => update({ performanceProfile: opt.value })}
              onTouchEnd={(e) => { e.preventDefault(); update({ performanceProfile: opt.value }); }}
              title={opt.hint}
            >
              {opt.label}
            </button>
          ))}
        </section>
        <section class="panel">
          <h2 class="panel-title">Reader images</h2>
          <p class="panel-description">Reddit list thumbnails, comic strips, and recipe photos.</p>
          {READER_IMAGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              class={`btn ${settings.readerImageMode === opt.value ? 'btn-active' : ''}`}
              onClick={() => update({ readerImageMode: opt.value })}
              onTouchEnd={(e) => { e.preventDefault(); update({ readerImageMode: opt.value }); }}
              title={opt.hint}
            >
              {opt.label}
            </button>
          ))}
        </section>
        <section class="panel">
          <h2 class="panel-title">Offline behavior</h2>
          <p class="panel-description">How reader apps use the network and cache when a request fails.</p>
          {OFFLINE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              class={`btn ${settings.offlinePreference === opt.value ? 'btn-active' : ''}`}
              onClick={() => update({ offlinePreference: opt.value })}
              onTouchEnd={(e) => { e.preventDefault(); update({ offlinePreference: opt.value }); }}
              title={opt.hint}
            >
              {opt.label}
            </button>
          ))}
        </section>
        <section class="panel">
          <h2 class="panel-title">Quiet hours</h2>
          <p class="panel-description">Local time window: status bar clock updates less often (when slow clock is on). Use 24h times.</p>
          <label class="settings-checkbox-row">
            <input
              type="checkbox"
              checked={settings.quietHoursEnabled}
              onChange={() => update({ quietHoursEnabled: !settings.quietHoursEnabled })}
            />
            Enable quiet hours
          </label>
          <label class="settings-checkbox-row">
            <input
              type="checkbox"
              checked={settings.quietHoursSlowClock}
              onChange={() => update({ quietHoursSlowClock: !settings.quietHoursSlowClock })}
            />
            Slower clock updates during quiet hours (5 min)
          </label>
          <p class="panel-description">Start (inclusive)</p>
          <input
            type="text"
            class="input"
            defaultValue={quietStartStr}
            key={quietStartStr}
            onBlur={(e) => setQuietStartFromInput((e.target as HTMLInputElement).value)}
            aria-label="Quiet hours start HH:MM"
          />
          <p class="panel-description">End (exclusive if range does not wrap)</p>
          <input
            type="text"
            class="input"
            defaultValue={quietEndStr}
            key={quietEndStr}
            onBlur={(e) => setQuietEndFromInput((e.target as HTMLInputElement).value)}
            aria-label="Quiet hours end HH:MM"
          />
        </section>
        <section class="panel">
          <h2 class="panel-title">Home pinned apps</h2>
          <p class="panel-description">Up to 8 tiles shown in a Pinned row (removed from the main grid).</p>
          <ul class="list settings-fav-list">
            {allDescriptors.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  class={`btn ${favoriteIds.includes(d.id) ? 'btn-active' : ''}`}
                  onClick={() => toggleFavorite(d.id)}
                >
                  {favoriteIds.includes(d.id) ? 'Pinned: ' : 'Pin: '}
                  {d.name}
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section class="panel">
          <h2 class="panel-title">Data</h2>
          <p class="panel-description">Clear cached data for Reddit, Comics, Weather, etc.</p>
          <button type="button" class="btn" onClick={handleClearCaches} onTouchEnd={(e) => { e.preventDefault(); handleClearCaches(); }}>Clear all caches</button>
          {clearCacheMessage && <p class="settings-import-message" role="status">{clearCacheMessage}</p>}
          <h3 class="panel-title" style={{ marginTop: '1rem' }}>Export settings</h3>
          <p class="panel-description">Download all global settings as JSON.</p>
          <button type="button" class="btn" onClick={exportJson}>Download JSON</button>
          <h3 class="panel-title" style={{ marginTop: '1rem' }}>Import settings</h3>
          <p class="panel-description">Paste JSON. Merge keeps keys not listed in the file; replace overwrites from file then fills defaults.</p>
          <label class="settings-checkbox-row">
            <input type="checkbox" checked={importMerge} onChange={() => setImportMerge((m) => !m)} />
            Merge with current
          </label>
          <textarea
            class="input settings-import-textarea"
            rows={6}
            value={importText}
            onInput={(e) => setImportText((e.target as HTMLTextAreaElement).value)}
            placeholder="{ ... }"
            aria-label="Settings JSON"
          />
          <button type="button" class="btn" onClick={() => void runImport()}>Apply import</button>
          {importMessage && <p class="settings-import-message" role="status">{importMessage}</p>}
        </section>
        <section class="panel">
          <h2 class="panel-title">Diagnostics</h2>
          <p class="panel-description">Read-only; useful on Kindle when there is no dev console.</p>
          <ul class="list settings-diag-list">
            <li><strong>Version</strong> {getAppVersion()}</li>
            <li><strong>Build</strong> {getAppBuild()}</li>
            <li><strong>Profile</strong> {settings.performanceProfile}</li>
            <li><strong>Reader images</strong> {settings.readerImageMode}</li>
            <li><strong>Storage keys</strong> {storageKeyCount == null ? '…' : String(storageKeyCount)}</li>
            <li><strong>User agent</strong> {typeof navigator !== 'undefined' ? navigator.userAgent : 'n/a'}</li>
            <li><strong>Last network error</strong> {getLastNetworkError() || '—'}</li>
          </ul>
          <button
            type="button"
            class="btn"
            onClick={() => {
              clearLastNetworkError();
              setDiagMessage('Cleared last network error.');
              void refreshDiag();
            }}
          >
            Clear last network error
          </button>
          <button type="button" class="btn" onClick={() => void refreshDiag()}>Refresh counts</button>
          {diagMessage && <p class="settings-import-message" role="status">{diagMessage}</p>}
        </section>
        <section class="panel">
          <h2 class="panel-title">About</h2>
          <p class="panel-description">
            LibreInk v{getAppVersion()} (build {getAppBuild()}). Lightweight shell for e-ink and low-spec devices.
          </p>
        </section>
      </div>
    );
  }

  return {
    render: () => <SettingsUI />,
    getTitle: () => 'Settings',
  };
}

export const settingsApp = {
  id: 'settings',
  name: 'Settings',
  icon: '🔧',
  category: 'system' as const,
  apiVersion: PLUGIN_API_VERSION,
  metadata: { permissions: [] },
  launch: SettingsApp,
};
