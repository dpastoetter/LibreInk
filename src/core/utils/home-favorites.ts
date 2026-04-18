import type { AppDescriptor } from '../../types/plugin';

const MAX_FAVORITES = 8;

/** Parse `homeFavoriteAppIds` JSON from settings. */
export function parseHomeFavoriteIds(json: string | undefined): string[] {
  if (!json || !json.trim()) return [];
  try {
    const arr = JSON.parse(json) as unknown;
    if (!Array.isArray(arr)) return [];
    const out: string[] = [];
    for (const x of arr) {
      if (typeof x === 'string' && x.length > 0 && x.length < 64 && /^[a-z0-9-]+$/i.test(x) && !out.includes(x)) {
        out.push(x);
      }
      if (out.length >= MAX_FAVORITES) break;
    }
    return out;
  } catch {
    return [];
  }
}

export function favoriteIdsToJson(ids: string[]): string {
  return JSON.stringify(ids.slice(0, MAX_FAVORITES));
}

/** Resolve descriptors in favorite order; drop unknown ids. */
export function resolvePinnedDescriptors(all: AppDescriptor[], favoriteIds: string[]): AppDescriptor[] {
  const byId = new Map(all.map((a) => [a.id, a]));
  const out: AppDescriptor[] = [];
  for (const id of favoriteIds) {
    const d = byId.get(id);
    if (d) out.push(d);
  }
  return out;
}
