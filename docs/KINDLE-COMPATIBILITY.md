# Kindle / E-ink browser compatibility

OpenInk follows [ReKindle COMPATIBILITY.md](https://github.com/ReKindleOS/ReKindle/blob/main/COMPATIBILITY.md) for the legacy build (Kindle, Kobo, and other e-ink browsers). The main site redirects Kindle/no-ESM to **legacy.html** (see [DEVELOPMENT.md](DEVELOPMENT.md)).

## legacy.html = full app for Kindle

- **legacy.html** is the single legacy entry. It loads the full app (widgets, home screen, all apps) via `openink-legacy-single.js`. ReKindle-style frame (gray body, white box). If the app does not start within ~22 seconds, a fallback message with "Try again" is shown.
- **Redirect:** The main index redirects Kindle/limited browsers to `legacy.html`, so they land on the full app.

## If the Kindle shows a blank screen

1. **Server is serving index.html for every URL:** Your host may be using an SPA fallback that serves `index.html` for all routes. To serve the legacy page:
   - **Deploy the full `dist/`** so `legacy.html` exists.
   - **Netlify:** The repo includes `public/_redirects` so `legacy.html` is served as a file. Put any catch-all (e.g. `/* /index.html 200`) *after* that line.
   - **Other hosts (Vercel, etc.):** Configure rewrites so `legacy.html` is not rewritten to `index.html`.
   - **GitHub Pages:** Deploy the whole `dist/` folder; each file is served by default.
2. **Base path:** If you deploy under a subpath (e.g. `https://user.github.io/OpenInk-WebOS/`), set `base: '/OpenInk-WebOS/'` in `vite.config.ts` before building so script and style URLs in legacy.html resolve correctly.

## What we do

- **Legacy bundle** – Single IIFE `openink-legacy-single.js` built with Babel (Chrome 44 target). Optional chaining and nullish coalescing are transpiled.
- **No flexbox `gap`** – We use margin-based fallbacks in CSS; modern browsers get `gap` via `@supports (gap: 1px)`.
- **No animations/transitions on legacy** – `legacy.html` sets `class="legacy-browser"` on `<html>`. Our CSS disables `transition` and `animation` for `html.legacy-browser *` to avoid e-ink ghosting.
- **System fonts only** – No web fonts. On legacy we use `Arial, Verdana, "Courier New", serif, sans-serif` (ReKindle-style).
- **No Unicode emoji on legacy** – App launcher icons use `iconFallback` (ASCII/symbol) when `import.meta.env.LEGACY` is true. Weather icons use text labels (Sun, Cld, Rain, etc.) in the legacy build.
- **No `alert` / `confirm` / `prompt`** – We do not use them; use custom modals if needed.
- **No `position: sticky` / `fixed`** – We avoid them to prevent checkerboarding on e-ink.
- **Touch targets** – Minimum `--tap-min: 52px` for tap areas.
- **Mario game** – Discrete tick (200 ms), no requestAnimationFrame; Left / Right / Jump buttons with large tap targets; keyboard arrows + Space on desktop. Blocky graphics with `image-rendering: pixelated` for e-ink.

## Quick tips for Kindle users

- **Bookmark `legacy.html` directly** (e.g. `https://yoursite.com/legacy.html`) so the Kindle opens the legacy page without going through the main index. Fewer requests and less chance of the host serving the wrong file.
- **JIT-less engine:** The Kindle browser runs JavaScript 5–10× slower than a normal phone. We avoid heavy work on startup (settings load is raced with 5s; date/time use manual formatting on legacy).
- **Date/time:** On the legacy build we use manual string formatting (`@core/utils/date`) instead of `Intl` / `toLocaleString` options, which are unreliable on Kindle (ReKindle).
- **Images:** `image-rendering: pixelated` is set on legacy for crisp edges on e-ink.

## References

- [ReKindle COMPATIBILITY.md](https://github.com/ReKindleOS/ReKindle/blob/main/COMPATIBILITY.md) – Full constraints (JIT-less engine, `Intl`/date quirks, localStorage volatile, etc.).
- [ReKindle build](https://github.com/ReKindleOS/ReKindle#-building--deployment) – Lite (Chrome 44+) and Legacy (Chrome 12+) targets.
