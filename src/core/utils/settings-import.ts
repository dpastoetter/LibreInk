import type { GlobalSettings } from '../../types/settings';
import { DEFAULT_SETTINGS } from '../../types/settings';

const ROOT_KEYS = new Set<string>(Object.keys(DEFAULT_SETTINGS));

/** Shallow pick only known GlobalSettings keys from arbitrary JSON. */
export function pickGlobalSettingsShape(input: unknown): Partial<GlobalSettings> {
  if (input == null || typeof input !== 'object' || Array.isArray(input)) return {};
  const src = input as Record<string, unknown>;
  const out: Partial<GlobalSettings> = {};
  for (const key of ROOT_KEYS) {
    if (Object.prototype.hasOwnProperty.call(src, key)) {
      (out as Record<string, unknown>)[key] = src[key];
    }
  }
  return out;
}

/** Merge imported partial over defaults (missing keys use defaults). */
export function mergeImportedSettings(partial: Partial<GlobalSettings>): GlobalSettings {
  return { ...DEFAULT_SETTINGS, ...partial };
}

/** Replace: same as merge; missing keys still filled from defaults. */
export function replaceImportedSettings(partial: Partial<GlobalSettings>): GlobalSettings {
  return mergeImportedSettings(partial);
}
