/**
 * Takes screenshots of legacy.html (home screen, light and dark) and saves to docs/screenshots/.
 * Requires: npm run build, then npm run screenshot:legacy (starts preview, captures, exits).
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const screenshotsDir = path.join(rootDir, 'docs', 'screenshots');
const port = 4173;
const baseUrl = `http://127.0.0.1:${port}`;

async function waitForServer(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await fetch(`${baseUrl}/legacy.html`, { method: 'HEAD' });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  return false;
}

async function main() {
  const distDir = path.join(rootDir, 'dist');
  const legacyPath = path.join(distDir, 'legacy.html');
  if (!fs.existsSync(legacyPath)) {
    console.error('Run npm run build first (dist/legacy.html not found).');
    process.exit(1);
  }

  let playwright;
  try {
    playwright = await import('playwright');
  } catch (e) {
    console.error('Playwright not found. Install with: npm install -D playwright');
    process.exit(1);
  }

  const preview = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], {
    cwd: rootDir,
    stdio: 'pipe',
    shell: true,
  });
  preview.stderr?.on('data', (d) => process.stderr.write(d));
  preview.stdout?.on('data', (d) => process.stdout.write(d));

  const killPreview = () => {
    try {
      preview.kill('SIGTERM');
    } catch (_) {}
  };
  process.on('exit', killPreview);
  process.on('SIGINT', () => { killPreview(); process.exit(130); });

  if (!(await waitForServer())) {
    console.error('Preview server did not become ready in time.');
    killPreview();
    process.exit(1);
  }

  fs.mkdirSync(screenshotsDir, { recursive: true });

  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 420, height: 720 },
    deviceScaleFactor: 2,
  });

  try {
    const page = await context.newPage();
    await page.goto(`${baseUrl}/legacy.html`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForSelector('.home-screen', { timeout: 15000 });
    await page.waitForTimeout(800);

    await page.screenshot({
      path: path.join(screenshotsDir, 'legacy-home-light.png'),
      type: 'png',
    });
    console.log('Saved docs/screenshots/legacy-home-light.png');

    const themeBtn = await page.$('button[aria-label="Switch to dark mode"]');
    if (themeBtn) {
      await themeBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(screenshotsDir, 'legacy-home-dark.png'),
        type: 'png',
      });
      console.log('Saved docs/screenshots/legacy-home-dark.png');
    }
  } finally {
    await browser.close();
    killPreview();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
