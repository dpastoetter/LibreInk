/** Last fetch error for diagnostics (message only, truncated). */

let lastMessage = '';

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}

export function recordNetworkFailure(url: string, err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  let host = '';
  try {
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
      host = new URL(url).host;
    }
  } catch {
    /* ignore */
  }
  const prefix = host ? `${host} ` : '';
  lastMessage = truncate(`${prefix}${msg}`.replace(/\s+/g, ' ').trim(), 200);
}

export function getLastNetworkError(): string {
  return lastMessage;
}

export function clearLastNetworkError(): void {
  lastMessage = '';
}
