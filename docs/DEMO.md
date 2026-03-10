# E-ink / Kindle demo

The e-ink demo is a standalone page that runs the OpenInk **legacy** app (same as Kindle) inside a mock e-ink reader for testing and presentation.

## How to open

- **Dev:** After `npm run dev`, open `http://localhost:5173/demo/eink-demo.html`
- **Production:** Open `https://your-domain.com/demo/eink-demo.html` (the file is in `public/demo/`, copied to `dist/demo/` on build)
- **From the app (including Kindle):** Open **Settings** → **E-ink demo**. That link loads the demo page in the same tab (you can use “← Back to OpenInk” to return to the app).

## What it does

- **Kindle build:** The iframe loads **legacy.html** (same bundle and layout as on Kindle): grayscale, high contrast, no animations. The legacy launcher uses inline SVG or fallback text for app icons (no Heroicons in the legacy bundle).
- **Fixed Kindle size:** The “screen” uses hard-coded dimensions matching a **Kindle Paperwhite 11th gen (6.8″)** at 1/3 scale: **412×549 px** (device resolution 1236×1648). No resize handle.
- **Grayscale:** A grayscale + contrast filter is applied to the iframe so it looks like a monochrome e-ink screen (legacy.html is already grayscale; the filter reinforces it in the frame).
- **Simulated refresh:** E-ink panels refresh in batches with a black flash. The demo runs a **fixed refresh** every **3 navigations** (open app, go home, back, etc.), with a **hard-coded 400 ms** black phase (adjustable via the slider).
- **Slight bleed:** After the main black flash fades out, a short **ghosting/bleed** phase runs: a faint black overlay (~6% opacity) fades to zero over ~180 ms to mimic residual image on e-ink.

## Controls (below the device)

| Control | Description |
|--------|-------------|
| **Refresh duration (ms)** | Length of the black phase (300–600 ms). Default 400. |
| **Auto-refresh every 3s** | When checked, runs the refresh (and bleed) every 3 seconds. |

## Using the demo on a Kindle

The demo page is built to work when opened **on a Kindle device** (same browser as legacy.html):

- **Layout:** No `gap` or `inset`; spacing uses margins and `top/right/bottom/left`. Fonts are Arial/Verdana for wide support.
- **Narrow viewport:** On small screens the “device” frame uses `max-width: 100%` and the screen height uses `70vh` so the embedded app is readable.
- **Reachable from the app:** In the legacy app, open **Settings** and tap **E-ink demo** to load this page; use “← Back to OpenInk” to return.

Netlify (and similar) should serve the file as-is: `public/_redirects` includes `/demo/eink-demo.html` so it is not rewritten to the SPA.

## Technical notes

- The iframe **src** is **/legacy.html** so the demo shows the same app and layout as on Kindle.
- The shell sends `postMessage({ type: 'openink-refresh' })` to the parent on each navigation; the demo counts and runs refresh every 3.
- **Bleed:** A second overlay (`.eink-bleed`) is faded in to low opacity then out after the main refresh to simulate ghosting.
- The demo is plain HTML/CSS/JS in `public/demo/eink-demo.html`; no app build step. It only needs the app served from the same origin.

## Files

- `public/demo/eink-demo.html` – Single file: markup, styles, and script. Shipped as-is.
