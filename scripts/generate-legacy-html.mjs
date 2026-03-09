/**
 * Post-build: generate dist/legacy.html for Kindle and other browsers that
 * fail on any type="module" script. Legacy page loads only classic scripts
 * (polyfills + legacy entry via System.import).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distDir, 'index.html');

const html = fs.readFileSync(indexPath, 'utf8');

// Extract legacy script URLs from the built index.html
const polyfillMatch = html.match(/id="vite-legacy-polyfill"[^>]+src="([^"]+)"/);
const entryMatch = html.match(/id="vite-legacy-entry"[^>]+data-src="([^"]+)"/);

if (!polyfillMatch || !entryMatch) {
  console.warn('generate-legacy-html: could not find legacy script URLs in index.html');
  process.exit(0);
}

const polyfillSrc = polyfillMatch[1];
const entrySrc = entryMatch[1];
const cssMatch = html.match(/href="(\/assets\/index-[^"]+\.css)"/);
const cssHref = cssMatch ? cssMatch[1] : '/assets/index.css';

// Shown immediately so Kindle never sees a blank or loading-only screen. App replaces this if it mounts.
const initialContent = `
  <div style="padding:1.5rem;font-family:Arial,Verdana,sans-serif;max-width:28em;margin:0 auto;">
    <h1 style="font-size:1.35rem;margin:0 0 0.5rem;">OpenInk</h1>
    <p style="margin:0 0 0.75rem;font-size:0.9rem;color:#666;">Loading app…</p>
    <p style="margin:0 0 1rem;color:#555;">If nothing loads, use a phone or computer for the full app:</p>
    <ul style="margin:0 0 1rem;padding-left:1.25rem;">
      <li>Calculator</li><li>Weather</li><li>News</li><li>Timer</li><li>Settings</li><li>Games</li>
    </ul>
    <p style="margin:0;"><a href="#" onclick="location.reload();return false;" style="color:#333;text-decoration:underline;">Try again</a></p>
  </div>`.replace(/\n\s+/g, ' ').trim();

const legacyHtml = `<!DOCTYPE html>
<html lang="en" class="legacy-browser">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <meta name="theme-color" content="#ffffff" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://corsproxy.io https://api.coingecko.com https://nominatim.openstreetmap.org https://api.open-meteo.com https://geocoding-api.open-meteo.com https://api.dictionaryapi.dev; font-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'" />
  <meta http-equiv="X-Content-Type-Options" content="nosniff" />
  <meta name="referrer" content="strict-origin-when-cross-origin" />
  <link rel="icon" type="image/svg+xml" href="/openink-logo.svg" />
  <link rel="manifest" href="/manifest.json" />
  <title>OpenInk</title>
  <link rel="stylesheet" crossorigin href="${cssHref}">
</head>
<body>
  <div id="root">${initialContent}</div>
  <noscript><p style="padding:1rem;font-family:Arial,Verdana,sans-serif;">OpenInk needs JavaScript.</p></noscript>
  <script>
    (function() {
      var root = document.getElementById('root');
      var entrySrc = ${JSON.stringify(entrySrc)};
      var polyfillSrc = ${JSON.stringify(polyfillSrc)};
      function showErr(msg) {
        if (root) root.innerHTML = '<p style="padding:1.5rem;font-family:Arial,Verdana,sans-serif;">' + msg + '</p>';
      }
      window.onerror = function() {
        showErr('OpenInk could not start. <a href="#" onclick="location.reload();return false;">Try again</a>');
        return true;
      };
      var s = document.createElement('script');
      s.crossOrigin = 'anonymous';
      s.src = polyfillSrc;
      s.onload = function() {
        if (typeof System === 'undefined') {
          showErr('OpenInk could not load (missing polyfill). <a href="#" onclick="location.reload();return false;">Try again</a>');
          return;
        }
        System.import(entrySrc).then(function() {}).catch(function() {
          showErr('OpenInk could not load. Use a phone or computer. <a href="#" onclick="location.reload();return false;">Try again</a>');
        });
      };
      s.onerror = function() {
        showErr('Could not load scripts. Check connection. <a href="#" onclick="location.reload();return false;">Try again</a>');
      };
      document.body.appendChild(s);
    })();
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(distDir, 'legacy.html'), legacyHtml);
console.log('Generated dist/legacy.html for Kindle / no-ESM browsers');