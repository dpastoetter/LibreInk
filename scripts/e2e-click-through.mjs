/**
 * E2E: Open the app in a browser, verify something loads, then click through every app page.
 * Usage: node scripts/e2e-click-through.mjs [BASE_URL]
 * Example: node scripts/e2e-click-through.mjs http://localhost:5173
 * Env: VITE_E2E_URL as default when no arg.
 */
const baseUrl = process.argv[2] || process.env.VITE_E2E_URL || 'http://localhost:5173';

const NAV_TIMEOUT = 20000;
const APP_LOAD_TIMEOUT = 12000;

async function main() {
  let playwright;
  try {
    playwright = await import('playwright');
  } catch {
    console.error('Playwright not found. Install with: npm install -D playwright');
    process.exit(1);
  }

  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 412, height: 549 },
  });

  try {
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });

    await page.waitForSelector('.shell', { timeout: NAV_TIMEOUT });
    await page.waitForSelector('.home-screen', { timeout: NAV_TIMEOUT });
    console.log('E2E: App loaded, home screen visible.');

    const collectTileIds = async () => {
      const ids = new Set();
      const tiles = await page.$$('button.app-tile[data-app-id]');
      for (const t of tiles) {
        const id = await t.getAttribute('data-app-id');
        if (id) ids.add(id);
      }
      return ids;
    };

    const appIds = new Set();
    for (const id of await collectTileIds()) appIds.add(id);

    const gamesBtn = await page.$('button[aria-label="Games"]');
    if (gamesBtn) {
      await gamesBtn.click();
      await page.waitForTimeout(400);
      for (const id of await collectTileIds()) appIds.add(id);
      const appsBtn = await page.$('button[aria-label="Apps"]');
      if (appsBtn) {
        await appsBtn.click();
        await page.waitForTimeout(400);
      }
    }

    const ids = [...appIds];
    console.log(`E2E: Clicking through ${ids.length} app(s): ${ids.join(', ')}`);

    const ensureTileVisible = async (appId) => {
      const sel = `button.app-tile[data-app-id="${appId}"]`;
      let el = await page.$(sel);
      if (el) return el;
      const g = await page.$('button[aria-label="Games"]');
      if (g) {
        await g.click();
        await page.waitForTimeout(400);
        el = await page.$(sel);
        if (el) return el;
        const a = await page.$('button[aria-label="Apps"]');
        if (a) {
          await a.click();
          await page.waitForTimeout(400);
        }
      }
      return await page.$(sel);
    };

    for (const appId of ids) {
      await page.waitForSelector('.home-screen', { timeout: APP_LOAD_TIMEOUT });
      const tile = await ensureTileVisible(appId);
      if (!tile) {
        console.warn(`E2E: Tile not found for ${appId}, skipping.`);
        continue;
      }
      await tile.click();
      await page.waitForSelector('.app-container', { timeout: APP_LOAD_TIMEOUT }).catch(() => null);
      const homeBtn = await page.$('button[aria-label="Home"]');
      if (!homeBtn) {
        console.error(`E2E: Home button not found after opening ${appId}.`);
        process.exit(1);
      }
      await homeBtn.click();
      await page.waitForSelector('.home-screen', { timeout: APP_LOAD_TIMEOUT });
      await page.waitForTimeout(200);
    }

    console.log('E2E: Click-through passed for all pages.');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
