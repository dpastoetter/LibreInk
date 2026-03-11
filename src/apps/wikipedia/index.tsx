import { useState, useCallback } from 'preact/hooks';
import type { AppContext, AppInstance } from '../../types/plugin';
import { PLUGIN_API_VERSION } from '../../types/plugin';

const SEARCH_URL = (q: string) =>
  `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(q)}&limit=15`;
const EXTRACT_URL = (title: string) =>
  `https://en.wikipedia.org/w/api.php?origin=*&format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=${encodeURIComponent(title)}`;
const CACHE_PREFIX = 'wikipedia:';

interface WikiPage {
  id: number;
  key: string;
  title: string;
  excerpt?: string;
  description?: string;
  thumbnail?: { url: string };
}

interface WikiSearchResult {
  pages?: WikiPage[];
}

interface WikiExtractPage {
  pageid?: number;
  title?: string;
  extract?: string;
}

interface WikiExtractResult {
  query?: { pages?: Record<string, WikiExtractPage> };
}

function WikipediaApp(context: AppContext): AppInstance {
  const { network, storage } = context.services;
  const [selectedPage, setSelectedPage] = useState<WikiPage | null>(null);
  const [article, setArticle] = useState<WikiExtractPage | null>(null);
  const [articleLoading, setArticleLoading] = useState(false);

  const openArticle = useCallback(
    async (page: WikiPage) => {
      setSelectedPage(page);
      setArticle(null);
      setArticleLoading(true);
      const cacheKey = CACHE_PREFIX + encodeURIComponent(page.title).slice(0, 200);
      try {
        const cached = await storage.get<WikiExtractPage>(cacheKey);
        if (cached?.extract) {
          setArticle(cached);
          setArticleLoading(false);
          return;
        }
        const data = await network.fetchJson<WikiExtractResult>(EXTRACT_URL(page.title));
        const pages = data?.query?.pages;
        const p = pages ? Object.values(pages)[0] : null;
        if (p?.extract) {
          setArticle(p);
          await storage.set(cacheKey, p);
        } else {
          setArticle({ title: page.title, extract: 'No extract available.' });
        }
      } catch (e) {
        setArticle({
          title: page.title,
          extract: e instanceof Error ? e.message : 'Failed to load article.',
        });
      } finally {
        setArticleLoading(false);
      }
    },
    [network, storage]
  );

  function WikipediaUI() {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<WikiPage[]>([]);

    const search = useCallback(async () => {
      const q = query.trim();
      if (!q) return;
      setLoading(true);
      setError(null);
      setResults([]);
      setSelectedPage(null);
      setArticle(null);
      try {
        const data = await network.fetchJson<WikiSearchResult>(SEARCH_URL(q));
        const pages = data?.pages ?? [];
        setResults(pages);
        if (pages.length === 0) setError('No results.');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Search failed.');
      } finally {
        setLoading(false);
      }
    }, [query, network]);

    const goBack = useCallback(() => {
      setSelectedPage(null);
      setArticle(null);
    }, []);

    if (selectedPage !== null) {
      return (
        <div class="wikipedia-app">
          <div class="wikipedia-article-header">
            <button type="button" class="btn btn-secondary" onClick={goBack} aria-label="Back to search">
              ← Back
            </button>
          </div>
          <article class="wikipedia-article">
            <h1 class="wikipedia-article-title">{article?.title ?? selectedPage.title}</h1>
            {articleLoading && <p>Loading…</p>}
            {article && !articleLoading && (
              <div class="wikipedia-extract">
                {article.extract?.split('\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            )}
          </article>
        </div>
      );
    }

    return (
      <div class="wikipedia-app">
        <p class="widget-hint">Search Wikipedia. Results and intros are cached.</p>
        <div class="wikipedia-search">
          <input
            type="text"
            class="input dictionary-input"
            placeholder="Search Wikipedia"
            value={query}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            aria-label="Search Wikipedia"
          />
          <button type="button" class="btn" onClick={search} disabled={loading}>
            Search
          </button>
        </div>
        {loading && <p>Loading…</p>}
        {error && <p class="browser-error">{error}</p>}
        {results.length > 0 && (
          <ul class="wikipedia-results">
            {results.map((page) => (
              <li key={page.id}>
                <button
                  type="button"
                  class="wikipedia-result-item"
                  onClick={() => openArticle(page)}
                >
                  <span class="wikipedia-result-title">{page.title}</span>
                  {page.description && (
                    <span class="wikipedia-result-desc">{page.description}</span>
                  )}
                  {page.excerpt && (
                    <span class="wikipedia-result-excerpt">{page.excerpt}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return {
    render: () => <WikipediaUI />,
    getTitle: () => (selectedPage ? selectedPage.title : 'Wikipedia'),
    canGoBack: () => selectedPage !== null,
    goBack: () => {
      setSelectedPage(null);
      setArticle(null);
    },
  };
}

export const wikipediaApp = {
  id: 'wikipedia',
  name: 'Wikipedia',
  icon: '📚',
  category: 'reader' as const,
  apiVersion: PLUGIN_API_VERSION,
  metadata: { requiresNetwork: true },
  launch: WikipediaApp,
};
