import { memo } from 'preact/compat';
import { useMemo, useCallback, useState, useEffect, useRef } from 'preact/hooks';
import type { AppDescriptor } from '../../types/plugin';
import { getAppIcon } from '@core/icons/app-icons';
import { isSafeLegacySvg } from '../utils/safe-svg';
import type { ThemeService } from '../services/theme';
import { parseHomeFavoriteIds, resolvePinnedDescriptors } from '../utils/home-favorites';

interface HomeScreenProps {
  apps: AppDescriptor[];
  onLaunch: (app: AppDescriptor) => void;
  theme: ThemeService;
}

function sortByName(apps: AppDescriptor[], order: 'a-z' | 'z-a'): AppDescriptor[] {
  const sorted = [...apps].sort((a, b) => a.name.localeCompare(b.name));
  return order === 'z-a' ? sorted.reverse() : sorted;
}

/** Apps list: alphabetical (or Z–A) but Settings always last. */
function sortAppsWithSettingsLast(apps: AppDescriptor[], order: 'a-z' | 'z-a'): AppDescriptor[] {
  const sorted = sortByName(apps, order);
  const settings = sorted.filter((a) => a.id === 'settings');
  const rest = sorted.filter((a) => a.id !== 'settings');
  return [...rest, ...settings];
}

const AppTile = memo(function AppTile({
  app,
  onLaunch,
}: {
  app: AppDescriptor;
  onLaunch: (app: AppDescriptor) => void;
}) {
  const IconComponent = getAppIcon(app.id);
  const handleActivate = useCallback(
    (e: Event) => {
      if (e.type === 'touchend') (e as TouchEvent).preventDefault();
      onLaunch(app);
    },
    [app, onLaunch]
  );
  return (
    <li>
      <button
        type="button"
        class="app-tile"
        data-app-id={app.id}
        aria-label={`Open ${app.name}`}
        onClick={handleActivate}
        onTouchEnd={handleActivate}
      >
        <span class="app-tile-icon" aria-hidden="true">
          {IconComponent
            ? <IconComponent className="app-tile-icon-svg" aria-hidden={true} />
            : isSafeLegacySvg(app.iconLegacySvg)
              ? <span class="app-tile-icon-svg" dangerouslySetInnerHTML={{ __html: app.iconLegacySvg! }} />
              : (app.iconFallback ?? app.icon ?? '◻')}
        </span>
        <span class="app-tile-name">{app.name}</span>
      </button>
    </li>
  );
});

const HomeScreenInner = function HomeScreen({ apps, onLaunch, theme }: HomeScreenProps) {
  const s = theme.getSettings();
  const [showGamesSection, setShowGamesSection] = useState(s.showGamesSection);
  const [sortOrder, setSortOrder] = useState(s.sortOrder);
  const [favoriteIds, setFavoriteIds] = useState(() => parseHomeFavoriteIds(s.homeFavoriteAppIds));
  const ref = useRef({
    showGamesSection: s.showGamesSection,
    sortOrder: s.sortOrder,
    homeFavoriteAppIds: s.homeFavoriteAppIds,
  });
  const themeUnsubRef = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    const t = setTimeout(() => {
      themeUnsubRef.current = theme.subscribe((next) => {
        if (next.showGamesSection !== ref.current.showGamesSection) {
          ref.current.showGamesSection = next.showGamesSection;
          setShowGamesSection(next.showGamesSection);
        }
        if (next.sortOrder !== ref.current.sortOrder) {
          ref.current.sortOrder = next.sortOrder;
          setSortOrder(next.sortOrder);
        }
        if (next.homeFavoriteAppIds !== ref.current.homeFavoriteAppIds) {
          ref.current.homeFavoriteAppIds = next.homeFavoriteAppIds;
          setFavoriteIds(parseHomeFavoriteIds(next.homeFavoriteAppIds));
        }
      });
      const sync = theme.getSettings();
      ref.current.showGamesSection = sync.showGamesSection;
      ref.current.sortOrder = sync.sortOrder;
      ref.current.homeFavoriteAppIds = sync.homeFavoriteAppIds;
      setShowGamesSection(sync.showGamesSection);
      setSortOrder(sync.sortOrder);
      setFavoriteIds(parseHomeFavoriteIds(sync.homeFavoriteAppIds));
    }, 400);
    return () => {
      clearTimeout(t);
      themeUnsubRef.current?.();
      themeUnsubRef.current = undefined;
    };
  }, [theme]);

  const games = useMemo(
    () => sortByName(apps.filter((a) => a.category === 'game'), sortOrder),
    [apps, sortOrder]
  );
  const appsOnly = useMemo(
    () => sortAppsWithSettingsLast(apps.filter((a) => a.category !== 'game'), sortOrder),
    [apps, sortOrder]
  );
  const pinnedApps = useMemo(() => resolvePinnedDescriptors(apps, favoriteIds), [apps, favoriteIds]);
  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const appsToShow = useMemo(
    () => appsOnly.filter((a) => !favoriteSet.has(a.id)),
    [appsOnly, favoriteSet]
  );
  const gamesToShow = useMemo(
    () => games.filter((a) => !favoriteSet.has(a.id)),
    [games, favoriteSet]
  );

  const [page, setPage] = useState<'apps' | 'games'>('apps');
  const showPager = showGamesSection && games.length > 0;

  return (
    <div class="home-screen">
      {pinnedApps.length > 0 && (
        <section class="home-category home-pinned" aria-label="Pinned apps">
          <h2 class="home-category-title">Pinned</h2>
          <ul class="app-grid">
            {pinnedApps.map((app) => (
              <AppTile key={`pin-${app.id}`} app={app} onLaunch={onLaunch} />
            ))}
          </ul>
        </section>
      )}
      <header class="home-category-header" aria-label="Category">
        {showPager && (
          <nav class="home-page-nav" aria-label="Switch between Apps and Games">
            <button
              type="button"
              class="btn home-page-btn"
              aria-label="Apps"
              onClick={() => setPage('apps')}
              disabled={page === 'apps'}
            >
              <svg class="home-page-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              class="btn home-page-btn"
              aria-label="Games"
              onClick={() => setPage('games')}
              disabled={page === 'games'}
            >
              <svg class="home-page-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </nav>
        )}
        <h2 class="home-category-title">{page === 'games' ? 'Games' : 'Apps'}</h2>
      </header>
      {(!showPager || page === 'apps') && (
        <section class="home-category">
          <ul class="app-grid">
            {appsToShow.map((app) => (
              <AppTile key={app.id} app={app} onLaunch={onLaunch} />
            ))}
          </ul>
        </section>
      )}
      {showPager && page === 'games' && (
        <section class="home-category">
          <ul class="app-grid">
            {gamesToShow.map((app) => (
              <AppTile key={app.id} app={app} onLaunch={onLaunch} />
            ))}
          </ul>
        </section>
      )}
      <footer class="home-footer" aria-label="Product name">LibreInk - Designed for E-Ink Devices</footer>
    </div>
  );
};

export const HomeScreen = memo(HomeScreenInner);
