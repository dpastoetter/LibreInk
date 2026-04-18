import type { GlobalSettings } from '../../types/settings';

/** Local clock minutes from midnight (0–1439). */
export function getLocalMinutesFromMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * True when `now` falls in the quiet window. Supports overnight ranges (e.g. 22:00–07:00).
 */
export function isQuietHoursActive(now: Date, settings: Pick<GlobalSettings, 'quietHoursEnabled' | 'quietHoursStartMinutes' | 'quietHoursEndMinutes'>): boolean {
  if (!settings.quietHoursEnabled) return false;
  const m = getLocalMinutesFromMidnight(now);
  const a = Math.max(0, Math.min(1439, Math.floor(settings.quietHoursStartMinutes)));
  const b = Math.max(0, Math.min(1439, Math.floor(settings.quietHoursEndMinutes)));
  if (a === b) return false;
  if (a < b) {
    return m >= a && m < b;
  }
  return m >= a || m < b;
}
