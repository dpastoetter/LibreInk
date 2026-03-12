/**
 * Legacy (Kindle) build: no icon library. App tiles use iconLegacySvg or iconFallback only.
 * This file is aliased in vite.legacy-single.config.ts so the legacy bundle stays small.
 */
import type { ComponentType } from 'preact';

export function getAppIcon(_appId: string): ComponentType<{ className?: string; 'aria-hidden'?: boolean }> | null {
  return null;
}
