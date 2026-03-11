# Development Guide

This document covers how to run, build, test, and work with the codebase day to day.

## Prerequisites

- **Node.js** (LTS, e.g. 18 or 20)
- **npm** (comes with Node)

## Commands

| Command | Description |
|--------|--------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start Vite dev server (e.g. http://localhost:5173). Listens on all interfaces so you can use your machine’s LAN IP (e.g. http://192.168.1.x:5173) from other devices. |
| `npm run build` | TypeScript compile + Vite production build → `dist/` |
| `npm run preview` | Serve the `dist/` build locally to test production |
| `npm run lint` | Run ESLint on `src/` (TypeScript + jsx-a11y) |
| `npm test` | Run Vitest once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run screenshot:legacy` | After `npm run build`, starts preview and captures legacy.html home screen (light and dark) to `docs/screenshots/legacy-home-*.png`. Requires Playwright. |
| `npm run screenshot:modern` | After `npm run build`, starts preview and captures modern app home screen (light and dark) to `docs/screenshots/light-mode.png` and `dark-mode.png`. Requires Playwright. |
| `npm run screenshot` | Runs both screenshot scripts to regenerate legacy and modern home screen screenshots. Ensure no other process is using ports 4173 or 4174. |

## Project structure

```
src/
├── main.tsx                 # Entry: create services, register apps, render Shell
├── index.css                 # Global styles and design tokens
├── types/                    # Shared TypeScript types
│   ├── plugin.ts             # WebOSApp, AppContext, AppInstance
│   ├── settings.ts           # GlobalSettings, defaults
│   └── services.ts           # Service interfaces (storage, network, theme, settings)
├── core/
│   ├── kernel/               # Shell and home screen
│   │   ├── shell.tsx         # App container, header, history
│   │   └── HomeScreen.tsx    # App grid and launch
│   ├── plugins/
│   │   └── registry.ts       # App registry (register / getApp / getAllApps)
│   ├── icons/
│   │   ├── app-icons.tsx     # Heroicons for modern launcher; aliased to app-icons-legacy for legacy build
│   │   ├── app-icons-legacy.ts  # No Heroicons; legacy uses legacy-svg / fallback only
│   │   └── legacy-svg.ts     # Inline SVG icons for legacy/Kindle launcher
│   ├── services/             # Service implementations
│   │   ├── storage.ts
│   │   ├── network.ts
│   │   ├── theme.ts
│   │   └── settings.ts
│   ├── ui/                   # Shared UI components
│   │   ├── StatusBar.tsx
│   │   ├── PageNav.tsx
│   │   ├── Button.tsx
│   │   └── List.tsx
│   └── utils/
│       └── html.ts           # stripHtml and other helpers
└── apps/                     # App plugins
    ├── registry.ts           # registerAllApps(), LAZY_APPS
    ├── settings/
    ├── finance/
    ├── games/
    ├── news/
    ├── reddit/
    ├── dictionary/
    └── …

public/
├── demo.html                  # E-ink mock reader demo (at /demo.html; not linked from app)
└── …

scripts/
└── generate-legacy-html.mjs   # Post-build: generates dist/legacy.html for no-ESM browsers

docs/                         # Documentation
├── ARCHITECTURE.md           # High-level design (this repo)
├── DEMO.md                   # E-ink demo page (how to open, controls)
├── DEVELOPMENT.md            # This file
├── KINDLE-COMPATIBILITY.md   # Kindle/e-ink constraints and legacy behaviour
├── plugins.md                # How to add and implement apps
├── SECURITY.md               # Security and deployment checklist
└── screenshots/              # Captured home screens (light-mode, dark-mode, legacy-home-*)
```

## Adding a new app

1. Create `src/apps/<app-id>/index.tsx` and implement `WebOSApp` (see [docs/plugins.md](plugins.md)).
2. In `src/apps/registry.ts`, add a descriptor and lazy loader to the `LAZY_APPS` array (e.g. `load: () => import('./your-app').then(m => m.yourApp)`).
3. The app will appear on the home screen; no further wiring is needed.

## Adding a new service

1. Define the interface in `src/types/services.ts` if other code needs to depend on it.
2. Implement the service in `src/core/services/<name>.ts` and export a factory (e.g. `createXxxService()`).
3. In `main.tsx`, create the service and add it to the object passed to `<Shell services={...} />`.
4. Extend `AppContext` in `src/types/plugin.ts` so that `context.services` includes the new service.

## Code style and conventions

- **TypeScript**: Strict mode; avoid `any`. Use types from `@types/plugin` and `@types/services` for app and service code.
- **Preact**: Functional components and hooks. JSX is transformed by the Preact preset; you don’t need to import `h`.
- **Imports**: Prefer `@core/...` for core code (see `vite.config.ts` aliases). Apps use relative imports for types (`../../types/plugin`) and `@core` for UI/utils.
- **CSS**: Global styles in `index.css`; use semantic class names (e.g. `.app-header`, `.list`, `.btn`) and CSS variables (e.g. `var(--space)`, `var(--fg)`). No CSS modules or Tailwind in this project.
- **Naming**: `camelCase` for functions/variables; `PascalCase` for components and types. Files: `kebab-case` or component name (e.g. `HomeScreen.tsx`).

## Testing

- **Vitest** is used for unit tests; config in `vite.config.ts` (test section).
- Tests live next to source (e.g. `registry.test.ts` next to `registry.ts`) or in a `*.test.ts` / `*.test.tsx` file.
- Run `npm test` before committing if you changed core or app logic.

## E-ink demo

- The demo page is at `public/demo.html` and is served at **/demo.html** (dev and production). It is not linked from the app; open it only via that URL.
- It embeds the app in an iframe, applies grayscale, and simulates e-ink refresh (black flash every 3 navigations or on a timer).
- See **[docs/DEMO.md](DEMO.md)** for full description and behaviour.

## Build and deploy

- `npm run build` produces `dist/` (static assets). Deploy `dist/` to any static host (Netlify, Vercel, GitHub Pages, etc.). To preview the build on your LAN, run `npm run preview -- --host`.
- If the app is served from a subpath (e.g. `/browserOS/`), set `base: '/browserOS/'` in `vite.config.ts` and rebuild.
- The app uses the History API; the server must serve `index.html` for all routes (SPA fallback).
- The e-ink demo is at `dist/demo.html`; open `/demo.html` on your deployed site to use it.
- **Kindle / old browsers:** Kindle, Silk, and Experimental user agents are redirected to `legacy.html`. That page loads the full app (widgets, home screen) via `openink-legacy-single.js` (single IIFE bundle, no ES modules). If the app does not mount within ~22 seconds, a fallback with "Try again" is shown. The legacy bundle is built with Babel (Chrome 44 target). The build generates `dist/legacy.html` via `scripts/generate-legacy-html.mjs` after Vite build. Deploy the full `dist/` including `legacy.html`. See [KINDLE-COMPATIBILITY.md](KINDLE-COMPATIBILITY.md) and [ReKindle COMPATIBILITY.md](https://github.com/ReKindleOS/ReKindle/blob/main/COMPATIBILITY.md).

## Documentation

- **ARCHITECTURE.md** – How the shell, plugins, and services fit together.
- **DEMO.md** – E-ink demo page: URL, controls, and refresh behaviour.
- **KINDLE-COMPATIBILITY.md** – Kindle/e-ink constraints (ReKindle-style): legacy loader, static fallback, no flex gap, no emoji, no animations on legacy, system fonts, etc.
- **plugins.md** – Step-by-step app plugin implementation and use of context/services.
- **SECURITY.md** – Security measures and deployment checklist for public sites.
- **README.md** – Quick start, commands, and links to the docs above.
- **CONTRIBUTING.md** – How to run, test, and contribute.

## Current tooling

- **ESLint** – `eslint.config.js` with TypeScript and jsx-a11y; run with `npm run lint`.
- **PWA** – [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) generates a service worker (Workbox) for offline caching; registration in `main.tsx` (production only). Manifest: [public/manifest.json](public/manifest.json).
- **Legacy build** – A separate build (`vite.legacy-single.config.ts`) produces `openink-legacy-single.js` (IIFE, Babel Chrome 44). Kindles are redirected to `legacy.html`, which loads that bundle and shows the full app. Modern browsers load `index.html` with `type="module"`. Use `npm run build`; `dist/legacy.html` and `dist/assets/openink-legacy-single.js` are generated.

## Performance (legacy / Kindle)

The legacy bundle and runtime are tuned for low-spec e-ink devices:

- **Fast first paint** – The app renders immediately with default theme/settings; stored settings are loaded in the background and applied when ready (no blocking on `localStorage` before first frame).
- **Smaller legacy bundle** – Heroicons are not included in the legacy build. The legacy launcher uses `app-icons-legacy.ts` (aliased in `vite.legacy-single.config.ts`), so tiles use inline SVG or fallback text only; this keeps the IIFE bundle smaller and parse/execution faster.
- **Stable Shell callbacks** – `launchApp`, `closeApp`, and `goToHome` are stabilized with a ref to the current app instance, so child components (e.g. HomeScreen) receive stable props and avoid unnecessary re-renders when switching apps.
- **Clock and theme** – On legacy, the status bar clock uses a simple formatter and updates every 60 seconds to limit reflows; theme is applied via `setAttribute` on the document so high-contrast works without extra layout.
- **CSS** – Legacy uses `html.legacy-browser` scoping: no transitions/animations, system fonts, grayscale, and flex-based app grid (no CSS Grid). See `index.css` and [KINDLE-COMPATIBILITY.md](KINDLE-COMPATIBILITY.md).

## Possible improvements

Ideas for future work (not required for current scope):

- **Testing** – More unit tests for apps; consider a small E2E pass for the shell (e.g. Playwright) if the app grows.
- **Accessibility** – jsx-a11y is enabled; a pass with axe or similar could catch gaps (focus order, landmarks, reduced-motion coverage).
- **i18n** – All UI strings are currently English; if the project targets multiple locales, introduce a small i18n layer and extract strings.
- **Dependency updates** – Run `npm audit` and upgrade dependencies (especially Vite and dev tools) periodically; see [docs/SECURITY.md](SECURITY.md).
