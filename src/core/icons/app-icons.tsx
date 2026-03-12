/**
 * Heroicons (outline) for app launcher tiles.
 * Simple 24×24 outline set. Fallback remains legacy-svg + iconFallback for legacy build.
 */
import type { ComponentType } from 'preact';
import {
  AcademicCapIcon,
  BookOpenIcon,
  CakeIcon,
  CalculatorIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  CloudIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  NewspaperIcon,
  PhotoIcon,
  Squares2X2Icon,
  Square2StackIcon,
  StopIcon,
} from '@heroicons/react/24/outline';

type IconComponent = ComponentType<{ className?: string; 'aria-hidden'?: boolean; size?: number }>;

const APP_ICONS: Partial<Record<string, IconComponent>> = {
  blog: DocumentTextIcon as IconComponent,
  calculator: CalculatorIcon as IconComponent,
  chess: Squares2X2Icon as IconComponent,
  comics: BookOpenIcon as IconComponent,
  dictionary: AcademicCapIcon as IconComponent,
  finance: ChartBarIcon as IconComponent,
  minesweeper: Square2StackIcon as IconComponent,
  news: NewspaperIcon as IconComponent,
  reddit: ChatBubbleLeftRightIcon as IconComponent,
  stopwatch: StopIcon as IconComponent,
  timer: ClockIcon as IconComponent,
  weather: CloudIcon as IconComponent,
  worldclock: GlobeAltIcon as IconComponent,
  todo: CheckCircleIcon as IconComponent,
  recipes: CakeIcon as IconComponent,
  pictureframe: PhotoIcon as IconComponent,
  settings: Cog6ToothIcon as IconComponent,
  /* snake: no Heroicon; falls back to emoji 🐍 or legacy SVG */
};

export function getAppIcon(appId: string): IconComponent | null {
  return APP_ICONS[appId] ?? null;
}
