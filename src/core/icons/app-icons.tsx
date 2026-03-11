/**
 * Heroicons (24 outline) mapping for app launcher tiles.
 * Used when we want library icons instead of emoji/legacy SVG. Fallback remains legacy-svg + iconFallback.
 */
import type { ComponentType } from 'preact';
import {
  CalculatorIcon,
  BookOpenIcon,
  ChartBarIcon,
  NewspaperIcon,
  ClockIcon,
  Cog6ToothIcon,
  GlobeAltIcon,
  CloudIcon,
  TableCellsIcon,
  Squares2X2Icon,
  ChatBubbleLeftRightIcon,
  StopIcon,
} from '@heroicons/react/24/outline';

type IconComponent = ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;

const APP_ICONS: Partial<Record<string, IconComponent>> = {
  blog: NewspaperIcon as IconComponent,
  calculator: CalculatorIcon as IconComponent,
  chess: Squares2X2Icon as IconComponent,
  comics: BookOpenIcon as IconComponent,
  dictionary: BookOpenIcon as IconComponent,
  finance: ChartBarIcon as IconComponent,
  minesweeper: TableCellsIcon as IconComponent,
  news: NewspaperIcon as IconComponent,
  reddit: ChatBubbleLeftRightIcon as IconComponent,
  stopwatch: StopIcon as IconComponent,
  sudoku: TableCellsIcon as IconComponent,
  timer: ClockIcon as IconComponent,
  weather: CloudIcon as IconComponent,
  worldclock: GlobeAltIcon as IconComponent,
  settings: Cog6ToothIcon as IconComponent,
};

export function getAppIcon(appId: string): IconComponent | null {
  return APP_ICONS[appId] ?? null;
}
