import { describe, it, expect } from 'vitest';
import { pickGlobalSettingsShape, mergeImportedSettings } from './settings-import';
import { DEFAULT_SETTINGS } from '../../types/settings';

describe('settings-import', () => {
  it('pickGlobalSettingsShape ignores unknown keys', () => {
    const p = pickGlobalSettingsShape({ zoom: 1.2, evil: 'x', appearance: 'dark' });
    expect(p.zoom).toBe(1.2);
    expect(p.appearance).toBe('dark');
    expect((p as Record<string, unknown>).evil).toBeUndefined();
  });

  it('mergeImportedSettings fills defaults', () => {
    const m = mergeImportedSettings({ zoom: 0.9 });
    expect(m.zoom).toBe(0.9);
    expect(m.appearance).toBe(DEFAULT_SETTINGS.appearance);
    expect(m.homeFavoriteAppIds).toBe(DEFAULT_SETTINGS.homeFavoriteAppIds);
  });
});
