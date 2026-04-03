/**
 * Settings → Appearance → Simple layout (e-ink): hide search/filter bars in apps
 * to reduce reflow and tap targets on Kindle.
 */
export function isSimpleLayout(get: () => { simpleLayout?: boolean }): boolean {
  try {
    return !!get().simpleLayout;
  } catch {
    return false;
  }
}
