const MAX_STRIP_HTML_LENGTH = 1024 * 1024; // 1MB input cap to prevent DoS
const MAX_STRIP_HTML_OUTPUT = 50000; // 50k chars output cap for performance

/**
 * Strip HTML tags and decode entities, returning plain text.
 * Uses DOMParser (inert document, no script execution). Safe for untrusted API content.
 */
export function stripHtml(html: string): string {
  if (typeof html !== 'string') return '';
  if (html.length > MAX_STRIP_HTML_LENGTH) return html.slice(0, MAX_STRIP_HTML_LENGTH);
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const out = doc.body?.textContent?.trim() ?? '';
    return out.length > MAX_STRIP_HTML_OUTPUT ? out.slice(0, MAX_STRIP_HTML_OUTPUT) : out;
  } catch {
    return '';
  }
}
