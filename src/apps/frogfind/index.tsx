import { useState, useCallback } from 'preact/hooks';
import type { AppContext, AppInstance } from '../../types/plugin';
import { PLUGIN_API_VERSION } from '../../types/plugin';

/** FrogFind: simple-HTML search for vintage/low-spec. Uses phreedom.club or frogfind.com. */
const FROGFIND_BASE = 'https://search.phreedom.club';
const FROGFIND_SEARCH = (q: string) => `${FROGFIND_BASE}/?q=${encodeURIComponent(q)}`;

function FrogFindApp(_context: AppContext): AppInstance {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');

  const search = useCallback(() => {
    const q = query.trim();
    if (q) setSubmitted(q);
  }, [query]);

  function FrogFindUI() {
    const iframeSrc = submitted ? FROGFIND_SEARCH(submitted) : '';

    return (
      <div class="frogfind-app">
        <p class="widget-hint">
          FrogFind returns simple HTML results for low-spec and e-ink. Enter a search and view results below.
        </p>
        <div class="frogfind-search">
          <input
            type="text"
            class="input dictionary-input"
            placeholder="Search the web (FrogFind)"
            value={query}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            aria-label="FrogFind search"
          />
          <button type="button" class="btn" onClick={search}>
            Search
          </button>
        </div>
        {iframeSrc ? (
          <div class="frogfind-frame-wrap">
            <iframe
              title="FrogFind results"
              src={iframeSrc}
              class="frogfind-iframe"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
          </div>
        ) : (
          <p class="frogfind-placeholder">Enter a search term and click Search to load FrogFind results.</p>
        )}
      </div>
    );
  }

  return {
    render: () => <FrogFindUI />,
    getTitle: () => 'FrogFind',
  };
}

export const frogfindApp = {
  id: 'frogfind',
  name: 'FrogFind',
  icon: '🐸',
  category: 'network' as const,
  apiVersion: PLUGIN_API_VERSION,
  metadata: { requiresNetwork: true },
  launch: FrogFindApp,
};
