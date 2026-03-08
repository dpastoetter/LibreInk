/**
 * Shared constants for low-spec e-ink build.
 * Single source for CORS and cache TTLs to keep policy consistent and bundle small.
 */

/** CORS proxy used for cross-origin requests (Reddit, News, Comics, Finance). */
export const CORS_PROXY = 'https://corsproxy.io/?';

/** Cache TTL: 30 minutes (feeds, weather, comics RSS). */
export const CACHE_TTL_SHORT_MS = 30 * 60 * 1000;

/** Cache TTL: 24 hours (xkcd, long-lived API cache). */
export const CACHE_TTL_DAY_MS = 24 * 60 * 60 * 1000;
