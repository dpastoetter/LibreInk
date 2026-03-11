import { memo } from 'preact/compat';
import { useMemo, useCallback, useState, useEffect } from 'preact/hooks';
import type { AppDescriptor } from '../../types/plugin';
import { getAppIcon } from '@core/icons/app-icons';
import type { ThemeService } from '../services/theme';

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

const AppTile = memo(function AppTile({ app }: { app: AppDescriptor }) {
  const IconComponent = getAppIcon(app.id);
  return (
    <li>
      <button
        type="button"
        class="app-tile"
        data-app-id={app.id}
        aria-label={`Open ${app.name}`}
      >
        <span class="app-tile-icon" aria-hidden="true">
          {IconComponent
            ? <IconComponent className="app-tile-icon-svg" aria-hidden={true} />
            : typeof import.meta.env.LEGACY !== 'undefined' && import.meta.env.LEGACY && app.iconLegacySvg
              ? <span class="app-tile-icon-svg" dangerouslySetInnerHTML={{ __html: app.iconLegacySvg }} />
              : typeof import.meta.env.LEGACY !== 'undefined' && import.meta.env.LEGACY && app.iconFallback
                ? app.iconFallback
                : (app.icon ?? '◻')}
        </span>
        <span class="app-tile-name">{app.name}</span>
      </button>
    </li>
  );
});

export function HomeScreen({ apps, onLaunch, theme }: HomeScreenProps) {
  const s = theme.getSettings();
  const [showGamesSection, setShowGamesSection] = useState(s.showGamesSection);
  const [sortOrder, setSortOrder] = useState(s.sortOrder);
  useEffect(() => {
    return theme.subscribe((next) => {
      setShowGamesSection(next.showGamesSection);
      setSortOrder(next.sortOrder);
    });
  }, [theme]);

  const games = useMemo(
    () => sortByName(apps.filter((a) => a.category === 'game'), sortOrder),
    [apps, sortOrder]
  );
  const appsOnly = useMemo(
    () => sortAppsWithSettingsLast(apps.filter((a) => a.category !== 'game'), sortOrder),
    [apps, sortOrder]
  );

  const appById = useMemo(() => {
    const m = new Map<string, AppDescriptor>();
    apps.forEach((a) => m.set(a.id, a));
    return m;
  }, [apps]);

  const handleGridClick = useCallback(
    (e: Event) => {
      const el = (e.target as HTMLElement).closest?.('[data-app-id]');
      const id = el?.getAttribute?.('data-app-id');
      if (id) {
        const app = appById.get(id);
        if (app) onLaunch(app);
      }
    },
    [appById, onLaunch]
  );

  return (
    <div class="home-screen">
      <section class="home-category">
        <h2 class="home-category-title">Apps</h2>
        <ul class="app-grid" onClick={handleGridClick}>
          {appsOnly.map((app) => (
            <AppTile key={app.id} app={app} />
          ))}
        </ul>
      </section>
      {showGamesSection && (
        <section class="home-category">
          <h2 class="home-category-title">Games</h2>
          <ul class="app-grid" onClick={handleGridClick}>
            {games.map((app) => (
              <AppTile key={app.id} app={app} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
