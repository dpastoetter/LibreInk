import type { GlobalSettings } from '../../types/settings';
import type { NetworkFetchOptions, NetworkService } from '../../types/services';
import { recordNetworkFailure } from './network-last-error';

const MAX_CONCURRENT_NORMAL = 6;
const MAX_CONCURRENT_LOW_POWER = 2;

/** Wrapper around fetch with concurrency limits (stricter in low power) and in-flight GET dedupe (skipped when `signal` is set). */
export function createNetworkService(getSettings: () => GlobalSettings): NetworkService {
  let active = 0;
  const queue: Array<() => void> = [];
  const inFlight = new Map<string, Promise<Response>>();

  function maxConcurrent(): number {
    return getSettings().performanceProfile === 'lowPower' ? MAX_CONCURRENT_LOW_POWER : MAX_CONCURRENT_NORMAL;
  }

  function acquire(): Promise<void> {
    if (active < maxConcurrent()) {
      active++;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      queue.push(() => {
        active++;
        resolve();
      });
    });
  }

  function release(): void {
    active--;
    const next = queue.shift();
    if (next) next();
  }

  async function rawFetch(url: string, options?: RequestInit): Promise<Response> {
    try {
      const res = await fetch(url, {
        ...options,
        credentials: 'omit',
        mode: 'cors',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res;
    } catch (e) {
      recordNetworkFailure(url, e);
      throw e;
    }
  }

  async function queuedFetch(url: string, options?: RequestInit): Promise<Response> {
    await acquire();
    try {
      return await rawFetch(url, options);
    } finally {
      release();
    }
  }

  function dedupeKey(url: string, options?: RequestInit): string | null {
    if (options?.signal != null) return null;
    const method = (options?.method ?? 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') return null;
    if (options?.body != null && options.body !== '') return null;
    return `${method} ${url}`;
  }

  function assertOnlineForFetch(): void {
    if (getSettings().offlinePreference !== 'block') return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      throw new Error('Offline (settings block network when device reports offline)');
    }
  }

  const impl: NetworkService = {
    async fetch(url: string, options?: RequestInit): Promise<Response> {
      assertOnlineForFetch();
      const key = dedupeKey(url, options);
      if (key == null) {
        return queuedFetch(url, options);
      }
      let p = inFlight.get(key);
      if (!p) {
        p = queuedFetch(url, options).finally(() => {
          inFlight.delete(key);
        });
        inFlight.set(key, p);
      }
      const res = await p;
      if (typeof res.clone === 'function') {
        return res.clone();
      }
      return res;
    },

    async fetchText(url: string, options?: NetworkFetchOptions): Promise<string> {
      const res = await impl.fetch(url, options?.signal ? { signal: options.signal } : undefined);
      return res.text();
    },

    async fetchJson<T>(url: string, options?: NetworkFetchOptions): Promise<T> {
      const res = await impl.fetch(url, options?.signal ? { signal: options.signal } : undefined);
      return res.json() as Promise<T>;
    },
  };

  return impl;
}
