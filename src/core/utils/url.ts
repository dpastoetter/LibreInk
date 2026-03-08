/**
 * URL safety for links and resources from untrusted APIs (RSS, Reddit, etc.).
 * Only allow http/https to prevent javascript:, data:, or other schemes.
 */

const SAFE_PROTOCOLS = ['https:', 'http:'];

/**
 * Returns true if the URL is safe to use in href or img src (https or http only).
 */
export function isSafeUrl(url: unknown): boolean {
  if (typeof url !== 'string' || !url.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    return SAFE_PROTOCOLS.includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Returns url if safe, otherwise empty string (so href doesn't navigate to a bad scheme).
 */
export function sanitizeUrl(url: unknown): string {
  return isSafeUrl(url) ? (url as string).trim() : '';
}
