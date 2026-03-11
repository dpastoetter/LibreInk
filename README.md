# OpenInk

A minimal, plugin-based “webOS-style” environment for low-spec e-ink devices. It provides a home screen, launcher, and a set of built-in apps that run inside a shared shell.

### Home screen

Toggle appearance from the status bar (light bulb icon). Use **+** / **−** in the status bar to zoom. Apps and Games launcher in both themes.

| Light | Dark |
|-------|------|
| ![Home — light](docs/screenshots/legacy-home-light.png) | ![Home — dark](docs/screenshots/legacy-home-dark.png) |

To regenerate screenshots: `npm run build` then `npm run screenshot`. Requires [Playwright](https://playwright.dev/) (`npx playwright install chromium` once).

## Tech stack

- **TypeScript** (strict, no implicit any)
- **Preact** (lightweight React alternative)
- **Vite** (build and dev server)
- **Plain CSS** (no Tailwind or CSS-in-JS)

## Running the project

```bash
npm install
npm run dev
```

Then open the URL shown (e.g. `http://localhost:5173`) in a browser. The dev server listens on all interfaces, so you can also use your machine’s LAN address (e.g. `http://192.168.1.5:5173`) from another device on the same network.

**Kindle / e-ink:** The app is a single page (index.html) that loads one legacy bundle (no ES modules), so it runs on Kindle, Silk, and other no-ESM browsers. The home screen uses black-and-white SVG icons where available. Deploy the full `dist/`. See **[docs/KINDLE-COMPATIBILITY.md](docs/KINDLE-COMPATIBILITY.md)** for deployment and troubleshooting.

**Build for production:**

```bash
npm run build
npm run preview   # optional: preview the built app
```

**Lint and tests:**

```bash
npm run lint
npm test
```

## Adding a new app / plugin

1. Create a folder under `src/apps/<app-id>/` and implement the `WebOSApp` interface (see `src/apps/dictionary/` or `src/apps/comics/`).
2. Register the app in `src/apps/registry.ts` by adding a descriptor and lazy loader to the `LAZY_APPS` array (e.g. `load: () => import('./your-app').then(m => m.yourApp)`).

Full steps and how to use shared services and respect global settings are in **[docs/plugins.md](docs/plugins.md)**.

## Built-in apps (v1)

- **Settings** – Pixel optics, font size, theme, appearance.
- **Calculator** – Basic arithmetic; offline.
- **Games** – Chess (local 2p or vs computer), Sudoku, Minesweeper.
- **News** – RSS reader with multiple sources, CORS proxy, source labels, date-sorted mix.
- **Reddit** – Read-only subreddit and post list with paginated comments. Choose a subreddit from the list or open one by name; server errors (e.g. 500) show a friendly message—try another subreddit.

- **Finance** – Markets: S&P 500, Gold, Bitcoin, Ethereum with 24h change; USD/EUR toggle and Refresh.

- **Comics** – xkcd (by number, Older/Newer) and Comics RSS (curated strips from comicsrss.com). Cached; no animation.

- **Weather**, **Timer**, **Stopwatch**, **World clock**, **Dictionary** – Widgets and utilities (offline or cached where possible).

## Performance & e-ink (low-spec first)

The site is tuned for **slow hardware, grayscale e-ink, and low refresh rates**:

- **No animation loops** – No `requestAnimationFrame`; updates are discrete (StatusBar 60s, Timer/Stopwatch/World clock 1s).
- **Reduced motion** – When `prefers-reduced-motion: reduce`, all transitions and decorative shadows are disabled to cut repaints.
- **Containment** – Shell, app content, and home sections use `contain: layout style` to limit reflow/repaint scope.
- **Light JS** – Memoized app lists and paginated slices; event delegation on the home grid; minimal work per render.
- **Readability** – Large tap targets (`--tap-min`), high-contrast theme option, grayscale-first palette.
- **Installable** – [Web app manifest](public/manifest.json) for “Add to Home Screen” on supported browsers and e-ink devices.

## Security (public deployment)

For a site that anyone can access, the app is built with security in mind: no secrets in the bundle, sanitized API content (XSS prevention), Content-Security-Policy, and safe storage usage. **Serve over HTTPS** and set security headers at your host. See **[docs/SECURITY.md](docs/SECURITY.md)** for details and deployment checklist.

## Known limitations (e-ink and low-spec)

- **Refresh rate** – UI avoids rapid updates and heavy animations; transitions are minimal or instant.
- **Grayscale** – Default theme is monochrome; color mode adds subtle accents only.
- **Touch** – Large tap targets; no drag gestures; pagination instead of infinite scroll where applicable.
- **Performance** – No animation libraries; DOM kept simple; apps should avoid continuous timers and heavy re-renders.
- **Browser app** – Reader mode uses heuristic extraction; CORS may block some sites; no iframe sandbox in this version.
- **Reddit/News** – Require network; rate limits and CORS apply; offline fallback is limited to cached data.

## Documentation

- **[CONTRIBUTING.md](CONTRIBUTING.md)** – How to run, test, and contribute.
- **[docs/SECURITY.md](docs/SECURITY.md)** – Security measures and deployment checklist for public sites.
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** – High-level design: shell, plugin system, services, and data flow.
- **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)** – Development workflow, project structure, adding services, testing, and deploy.
- **[docs/KINDLE-COMPATIBILITY.md](docs/KINDLE-COMPATIBILITY.md)** – Kindle/e-ink constraints (ReKindle-style) and legacy loader behaviour.
- **[docs/plugins.md](docs/plugins.md)** – How to build and register app plugins, use context and services, and optional shell integration (getTitle, canGoBack, goBack).

## Project structure

- `src/core/kernel/` – Shell, home screen, app lifecycle.
- `src/core/plugins/` – Plugin registry.
- `src/core/icons/` – App launcher icons: Lucide in `app-icons.tsx`; build uses `app-icons-legacy.ts` and `legacy-svg.ts` for legacy (smaller bundle).
- `src/core/services/` – Storage, network, theme, settings.
- `src/core/ui/` – Core UI (StatusBar, PageNav, Button, List).
- `src/core/utils/` – Shared helpers (e.g. stripHtml).
- `src/apps/` – App plugins (e.g. settings, finance, games, news, reddit, comics, timer, stopwatch, worldclock, dictionary).
- `src/types/` – Shared types and plugin API.
