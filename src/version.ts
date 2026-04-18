/** Build-time strings from Vite `define` (see vite.config.ts). */

export function getAppVersion(): string {
  const v = import.meta.env.VITE_APP_VERSION;
  return typeof v === 'string' && v.length > 0 ? v : '0.1.1';
}

export function getAppBuild(): string {
  const b = import.meta.env.VITE_APP_BUILD;
  return typeof b === 'string' && b.length > 0 ? b : 'dev';
}
