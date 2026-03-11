/**
 * Higher-quality black/white inline SVGs for legacy/Kindle (no external assets).
 * 24×24 viewBox, stroke/fill currentColor, SVG 1.1 safe. Refined outlines for clarity on e-ink.
 * Security: content is build-time constant only; no <script> or event handlers. Do not inject user/API data.
 */
const S = (content: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="24" height="24" aria-hidden="true">${content}</svg>`;

export const LEGACY_ICONS: Record<string, string> = {
  calculator: S('<rect x="4" y="2" width="16" height="20" rx="1.5"/><path d="M8 6h8M8 10h8"/><circle cx="8" cy="15" r="1.5" fill="currentColor"/><circle cx="12" cy="15" r="1.5" fill="currentColor"/><circle cx="16" cy="15" r="1.5" fill="currentColor"/><circle cx="8" cy="19" r="1.5" fill="currentColor"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/><circle cx="16" cy="19" r="1.5" fill="currentColor"/>'),
  chess: S('<rect x="3" y="2" width="18" height="20" rx="1"/><path d="M6 6h12M6 10h12M6 14h12M6 18h12"/><rect x="9" y="6" width="6" height="4" fill="currentColor"/><rect x="9" y="14" width="6" height="4" fill="currentColor"/>'),
  comics: S('<path d="M4 4v16a2 2 0 002 2h6V4H4z"/><path d="M14 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4V4z"/><rect x="6" y="7" width="4" height="3" fill="currentColor"/><rect x="14" y="7" width="4" height="3" fill="currentColor"/><circle cx="7" cy="15" r="1.2" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="17" cy="15" r="1.2" fill="none" stroke="currentColor" stroke-width="1"/>'),
  dictionary: S('<path d="M4 4h12l4 4v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z"/><path d="M8 4v16"/><path d="M8 9h8M8 13h6M8 17h8"/>'),
  finance: S('<polyline points="3 17 7 11 11 13 15 7 21 11"/>'),
  minesweeper: S('<rect x="2" y="2" width="20" height="20" rx="1"/><path d="M8 2v20M14 2v20M2 8h20M2 14h20"/><circle cx="5" cy="5" r="1.8" fill="currentColor"/><circle cx="19" cy="5" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/>'),
  blog: S('<path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z"/><path d="M4 10h16"/><path d="M7 6h4M7 14h10"/>'),
  news: S('<path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z"/><path d="M4 10h16"/><rect x="6" y="6" width="5" height="3" fill="currentColor"/>'),
  reddit: S('<circle cx="12" cy="12" r="9"/><circle cx="9.5" cy="10.5" r="1.2" fill="currentColor"/><circle cx="14.5" cy="10.5" r="1.2" fill="currentColor"/><path d="M8 15c0 0 2 2 4 2s4-2 4-2"/>'),
  stopwatch: S('<circle cx="12" cy="13" r="8"/><path d="M12 7v3l2.5 2.5"/><path d="M12 2v2"/>'),
  sudoku: S('<rect x="2" y="2" width="20" height="20" rx="1"/><path d="M8 2v20M14 2v20M2 8h20M2 14h20"/>'),
  timer: S('<circle cx="12" cy="13" r="8"/><path d="M12 5v4l3 2"/><path d="M12 2v2"/>'),
  weather: S('<circle cx="12" cy="9" r="4.5"/><path d="M12 2v2M12 15v2M5 9H3M21 9h-2M7.5 5.5L6 7M18 7l-1.5-1.5M7.5 12.5L6 11M18 11l-1.5 1.5"/><path d="M8 19a4 4 0 018 0"/>'),
  worldclock: S('<circle cx="12" cy="12" r="9"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2"/><path d="M12 8v4l2.5 2"/>'),
  settings: S('<circle cx="12" cy="12" r="3.5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>'),
};
