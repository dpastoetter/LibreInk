import { describe, it, expect } from 'vitest';
import { getLocalMinutesFromMidnight, isQuietHoursActive } from './quiet-hours';

describe('quiet-hours', () => {
  it('getLocalMinutesFromMidnight', () => {
    const d = new Date(2020, 0, 1, 13, 30, 0);
    expect(getLocalMinutesFromMidnight(d)).toBe(13 * 60 + 30);
  });

  it('isQuietHoursActive same-day range', () => {
    const d = new Date(2020, 0, 1, 10, 0, 0);
    expect(
      isQuietHoursActive(d, {
        quietHoursEnabled: true,
        quietHoursStartMinutes: 9 * 60,
        quietHoursEndMinutes: 11 * 60,
      })
    ).toBe(true);
    expect(
      isQuietHoursActive(d, {
        quietHoursEnabled: true,
        quietHoursStartMinutes: 11 * 60,
        quietHoursEndMinutes: 12 * 60,
      })
    ).toBe(false);
  });

  it('isQuietHoursActive overnight range', () => {
    const late = new Date(2020, 0, 1, 23, 0, 0);
    const early = new Date(2020, 0, 1, 6, 0, 0);
    const cfg = {
      quietHoursEnabled: true,
      quietHoursStartMinutes: 22 * 60,
      quietHoursEndMinutes: 7 * 60,
    };
    expect(isQuietHoursActive(late, cfg)).toBe(true);
    expect(isQuietHoursActive(early, cfg)).toBe(true);
    const noon = new Date(2020, 0, 1, 12, 0, 0);
    expect(isQuietHoursActive(noon, cfg)).toBe(false);
  });

  it('disabled when quietHoursEnabled false', () => {
    const d = new Date(2020, 0, 1, 23, 0, 0);
    expect(
      isQuietHoursActive(d, {
        quietHoursEnabled: false,
        quietHoursStartMinutes: 22 * 60,
        quietHoursEndMinutes: 7 * 60,
      })
    ).toBe(false);
  });
});
