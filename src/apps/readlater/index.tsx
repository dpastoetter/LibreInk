import { useState, useEffect, useCallback } from 'preact/hooks';
import type { AppContext, AppInstance } from '../../types/plugin';
import { PLUGIN_API_VERSION } from '../../types/plugin';
import { sanitizeUrl, isSafeUrl } from '@core/utils/url';

export const READLATER_STORAGE_KEY = 'readlater:list';
const STORAGE_KEY = READLATER_STORAGE_KEY;

export interface ReadLaterItem {
  id: string;
  title: string;
  url: string;
  createdAt: number;
}

export function normalizeReadLaterStorage(raw: unknown): ReadLaterItem[] {
  if (typeof raw === 'string') {
    try {
      return normalizeReadLaterStorage(JSON.parse(raw) as unknown);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];
  const out: ReadLaterItem[] = [];
  for (const x of raw) {
    if (!x || typeof x !== 'object') continue;
    const o = x as Record<string, unknown>;
    if (typeof o.id !== 'string' || typeof o.title !== 'string' || typeof o.url !== 'string' || typeof o.createdAt !== 'number') continue;
    if (!isSafeUrl(o.url)) continue;
    out.push({ id: o.id, title: o.title.slice(0, 500), url: o.url, createdAt: o.createdAt });
  }
  return out;
}

function ReadLaterApp(context: AppContext): AppInstance {
  const { storage } = context.services;

  function ReadLaterUI() {
    const [items, setItems] = useState<ReadLaterItem[]>([]);
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [msg, setMsg] = useState<string | null>(null);

    const load = useCallback(async () => {
      const raw = await storage.get<unknown>(STORAGE_KEY);
      setItems(normalizeReadLaterStorage(raw));
    }, [storage]);

    useEffect(() => {
      load();
    }, [load]);

    const persist = async (next: ReadLaterItem[]) => {
      await storage.set(STORAGE_KEY, next);
      setItems(next);
    };

    const add = async () => {
      setMsg(null);
      const t = title.trim();
      const u = sanitizeUrl(url.trim());
      if (!t || !u) {
        setMsg('Enter a title and a valid http(s) URL.');
        return;
      }
      const id = `rl_${Date.now()}`;
      await persist([{ id, title: t, url: u, createdAt: Date.now() }, ...items]);
      setTitle('');
      setUrl('');
      setMsg('Saved.');
    };

    const remove = async (id: string) => {
      await persist(items.filter((x) => x.id !== id));
    };

    const open = (u: string) => {
      const s = sanitizeUrl(u);
      if (!s) return;
      try {
        window.open(s, '_blank', 'noopener,noreferrer');
      } catch {
        setMsg('Open blocked. Copy the URL from the link.');
      }
    };

    return (
      <div class="readlater-app">
        <p class="widget-hint">Save links to open later. Opens in a new tab when the browser allows.</p>
        <div class="readlater-form">
          <input class="input" placeholder="Title" value={title} onInput={(e) => setTitle((e.target as HTMLInputElement).value)} aria-label="Title" />
          <input class="input" placeholder="https://…" value={url} onInput={(e) => setUrl((e.target as HTMLInputElement).value)} aria-label="URL" />
          <button type="button" class="btn" onClick={() => void add()}>
            Add
          </button>
        </div>
        {msg && <p class="settings-import-message" role="status">{msg}</p>}
        <ul class="list">
          {items.map((it) => (
            <li key={it.id} class="readlater-row">
              <div class="readlater-row-main">
                <strong>{it.title}</strong>
                <div>
                  <button type="button" class="btn btn-small" onClick={() => open(it.url)}>
                    Open
                  </button>
                  <button type="button" class="btn btn-small" onClick={() => void remove(it.id)}>
                    Remove
                  </button>
                </div>
              </div>
              <small class="widget-meta">{it.url}</small>
            </li>
          ))}
        </ul>
        {items.length === 0 && <p class="widget-meta">No saved links.</p>}
      </div>
    );
  }

  return {
    render: () => <ReadLaterUI />,
    getTitle: () => 'Read later',
  };
}

export const readlaterApp = {
  id: 'readlater',
  name: 'Read later',
  icon: '🔖',
  iconFallback: '+',
  category: 'reader' as const,
  apiVersion: PLUGIN_API_VERSION,
  metadata: { requiresNetwork: false },
  launch: ReadLaterApp,
};
