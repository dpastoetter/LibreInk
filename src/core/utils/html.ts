const MAX_STRIP_HTML_LENGTH = 1024 * 1024; // 1MB to prevent DoS

/**
 * Strip HTML tags and decode entities, returning plain text.
 * Uses DOMParser (inert document, no script execution). Safe for untrusted API content.
 */
export function stripHtml(html: string): string {
  if (typeof html !== 'string') return '';
  if (html.length > MAX_STRIP_HTML_LENGTH) return html.slice(0, MAX_STRIP_HTML_LENGTH);
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body?.textContent?.trim() ?? '';
  } catch {
    return '';
  }
}
