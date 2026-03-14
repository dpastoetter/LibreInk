/**
 * No-op in production. Only runs in dev (import.meta.env.DEV) to avoid
 * network overhead and failed requests on low-spec / Kindle devices.
 */
export function debugIngest(_payload: Record<string, unknown>): void {
  if (typeof import.meta.env.DEV === 'boolean' && !import.meta.env.DEV) return;
  try {
    fetch('http://127.0.0.1:7647/ingest/0cc433dc-bc56-4722-8dcd-55136a56519b', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fbf877' },
      body: JSON.stringify({ sessionId: 'fbf877', ..._payload, timestamp: Date.now() }),
    }).catch(() => {});
  } catch {
    /* no-op */
  }
}
