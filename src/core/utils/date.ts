/**
 * Legacy-safe date/time formatting (Kindle/ReKindle: Intl and toLocaleString
 * options are unreliable; use manual string building).
 */

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function pad2(n: number): string {
  return n < 10 ? '0' + n : String(n);
}

/** Time as HH:MM (24h). Safe on legacy/Kindle. */
export function formatTimeLegacy(d: Date): string {
  return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}

/** Time as HH:MM:SS (24h). Safe on legacy/Kindle. */
export function formatTimeWithSecondsLegacy(d: Date): string {
  return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
}

/** Date as M/D/YYYY. Safe on legacy/Kindle. */
export function formatDateLegacy(d: Date): string {
  return d.getMonth() + 1 + '/' + d.getDate() + '/' + d.getFullYear();
}

/** Weekday as short label (Sun, Mon, ...). Safe on legacy/Kindle. */
export function formatWeekdayShortLegacy(d: Date): string {
  return WEEKDAY_SHORT[d.getDay()] ?? '?';
}
