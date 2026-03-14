import { useState, useEffect, useCallback, useContext } from 'preact/hooks';
import type { AppContext, AppInstance } from '../../types/plugin';
import { PLUGIN_API_VERSION } from '../../types/plugin';
import { formatTimeWithSecondsLegacy } from '@core/utils/date';
import { AppHeaderActionsContext } from '@core/kernel/AppHeaderActionsContext';

export interface WorldClockZone {
  id: string;
  label: string;
  offsetMinutes: number;
}

const DEFAULT_ZONES: WorldClockZone[] = [
  { id: 'utc', label: 'UTC', offsetMinutes: 0 },
  { id: 'new-york', label: 'New York', offsetMinutes: -300 },
  { id: 'london', label: 'London', offsetMinutes: 0 },
  { id: 'berlin', label: 'Berlin', offsetMinutes: 60 },
  { id: 'tokyo', label: 'Tokyo', offsetMinutes: 540 },
];

function parseWorldClockZones(json: string | undefined): WorldClockZone[] {
  if (!json || !json.trim()) return [...DEFAULT_ZONES];
  try {
    const arr = JSON.parse(json) as unknown;
    if (!Array.isArray(arr)) return [...DEFAULT_ZONES];
    const out: WorldClockZone[] = [];
    for (const x of arr) {
      if (x && typeof x === 'object' && typeof (x as WorldClockZone).id === 'string' && typeof (x as WorldClockZone).label === 'string' && typeof (x as WorldClockZone).offsetMinutes === 'number') {
        out.push({ id: (x as WorldClockZone).id, label: (x as WorldClockZone).label, offsetMinutes: (x as WorldClockZone).offsetMinutes });
      }
    }
    return out.length ? out : [...DEFAULT_ZONES];
  } catch {
    return [...DEFAULT_ZONES];
  }
}

function worldClockZonesToJson(zones: WorldClockZone[]): string {
  return JSON.stringify(zones);
}

function formatTime(offsetMinutes: number): string {
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const local = new Date(utc + offsetMinutes * 60000);
  if (typeof import.meta.env.LEGACY !== 'undefined' && import.meta.env.LEGACY) return formatTimeWithSecondsLegacy(local);
  return local.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function slug(id: string): string {
  return id.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 32) || 'zone';
}

function WorldClockApp(context: AppContext): AppInstance {
  const { settings } = context.services;
  const backRef: { current: { canGoBack: () => boolean; goBack: () => void } | null } = { current: null };

  function WorldClockUI() {
    const [zones, setZones] = useState<WorldClockZone[]>(() => parseWorldClockZones(settings.get().worldClockZones));
    const [editMode, setEditMode] = useState(false);
    const [addLabel, setAddLabel] = useState('');
    const [addOffsetHours, setAddOffsetHours] = useState('');
    const [, setTick] = useState(0);
    const setHeaderActions = useContext(AppHeaderActionsContext);

    backRef.current = {
      canGoBack: () => editMode,
      goBack: () => setEditMode(false),
    };

    const persistZones = useCallback(
      (next: WorldClockZone[]) => {
        setZones(next);
        settings.set({ worldClockZones: worldClockZonesToJson(next) });
      },
      [settings]
    );

    const removeZone = (zone: WorldClockZone) => {
      persistZones(zones.filter((z) => z.id !== zone.id));
    };

    const addZone = () => {
      const label = addLabel.trim();
      if (!label) return;
      const hours = Number(addOffsetHours.trim());
      if (!Number.isFinite(hours) || hours < -14 || hours > 14) return;
      const offsetMinutes = Math.round(hours * 60);
      const id = slug(label) || 'zone-' + Date.now().toString(36);
      if (zones.some((z) => z.id === id)) return;
      persistZones([...zones, { id, label, offsetMinutes }]);
      setAddLabel('');
      setAddOffsetHours('');
    };

    /* 2s tick: fewer re-renders on low-spec / Kindle. */
    useEffect(() => {
      const t = setInterval(() => setTick((n) => n + 1), 2000);
      return () => clearInterval(t);
    }, []);

    useEffect(() => {
      if (!setHeaderActions) return;
      const node = (
        <button
          type="button"
          class="btn"
          onClick={() => setEditMode((e) => !e)}
          aria-label={editMode ? 'Done editing' : 'Edit zones'}
          title={editMode ? 'Done' : 'Edit'}
        >
          {editMode ? 'Done' : 'Edit'}
        </button>
      );
      setHeaderActions(node);
      return () => setHeaderActions(null);
    }, [setHeaderActions, editMode]);

    const localOffset = -new Date().getTimezoneOffset();
    const displayZones = [{ id: '_local', label: 'Local', offsetMinutes: localOffset }, ...zones];

    return (
      <div class="worldclock-app">
        <p class="widget-hint">Clocks update every 2s. No network.</p>
        {editMode && (
          <div class="worldclock-add">
            <input
              type="text"
              class="input worldclock-add-label"
              placeholder="Label (e.g. Tokyo)"
              value={addLabel}
              onInput={(e) => setAddLabel((e.target as HTMLInputElement).value)}
            />
            <input
              type="text"
              class="input worldclock-add-offset"
              placeholder="UTC offset (hours, e.g. 9 or -5)"
              value={addOffsetHours}
              onInput={(e) => setAddOffsetHours((e.target as HTMLInputElement).value)}
              onKeyDown={(e) => e.key === 'Enter' && addZone()}
            />
            <button type="button" class="btn" onClick={addZone}>Add</button>
          </div>
        )}
        <ul class="worldclock-list" aria-live="polite">
          {displayZones.map((z) => (
            <li key={z.id} class="worldclock-row">
              <span class="worldclock-label">{z.label}</span>
              <span class="worldclock-time">{formatTime(z.offsetMinutes)}</span>
              {editMode && z.id !== '_local' && (
                <button
                  type="button"
                  class="btn btn-small worldclock-delete"
                  onClick={() => removeZone(z)}
                  aria-label={`Remove ${z.label}`}
                  title="Remove"
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return {
    render: () => <WorldClockUI />,
    getTitle: () => 'World clock',
    canGoBack: () => backRef.current?.canGoBack?.() ?? false,
    goBack: () => backRef.current?.goBack?.(),
  };
}

export const worldclockApp = {
  id: 'worldclock',
  name: 'World clock',
  icon: '🌐',
  category: 'system' as const,
  apiVersion: PLUGIN_API_VERSION,
  metadata: {},
  launch: WorldClockApp,
};
