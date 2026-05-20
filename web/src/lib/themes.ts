// Theme catalog loader. Reads themes/*.toml at build time from the repo root.
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse as parseToml } from 'smol-toml';

// At build/dev time astro runs from web/, so the repo root is one level up.
const repoRoot = resolve(process.cwd(), '..');
const themesDir = join(repoRoot, 'themes');

export interface ThemeMeta {
  id: string;
  version: string;
  display_name: string;
  description?: string;
  extends_brand?: string;
}

export interface PromptSpec {
  character: string;
  character_color: string;
  segments?: string[];
  separator?: 'powerline' | 'minimal' | 'classic' | 'none';
  glyphs?: 'nerd-default' | 'ascii' | 'minimal';
}

export interface FontSpec {
  family: string;
  fallback?: string[];
  size?: number;
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  ligatures?: boolean;
  nerd_font?: boolean;
}

export interface ElementStyle {
  icon?: string;
  color?: string;
}

export type ElementsMap = Record<string, ElementStyle>;

export interface HorizontalBar {
  enabled?: boolean;
  background?: string;
  foreground?: string;
  left?: string[];
  center?: string[];
  right?: string[];
  elements?: ElementsMap;
}

export interface VerticalBar {
  enabled?: boolean;
  background?: string;
  foreground?: string;
  width?: number;
  top?: string[];
  center?: string[];
  bottom?: string[];
  elements?: ElementsMap;
}

export interface LayoutSpec {
  north?: HorizontalBar;
  south?: HorizontalBar;
  east?: VerticalBar;
  west?: VerticalBar;
}

export interface Theme {
  schema: string;
  meta: ThemeMeta;
  palette: Record<string, string>;
  prompt: PromptSpec;
  roles?: Record<string, string>;
  syntax?: Record<string, string>;
  font?: FontSpec;
  layout?: LayoutSpec;
}

let cache: Theme[] | null = null;

export function loadThemes(): Theme[] {
  if (cache) return cache;
  const files = readdirSync(themesDir).filter((f) => f.endsWith('.toml'));
  cache = files
    .map((f) => parseToml(readFileSync(join(themesDir, f), 'utf-8')) as unknown as Theme)
    .sort((a, b) => a.meta.id.localeCompare(b.meta.id));
  return cache;
}

export function getThemeBySlug(slug: string): Theme | undefined {
  return loadThemes().find((t) => t.meta.id === slug);
}

// Resolve a color reference: hex literal or {palette.NAME}
export function resolveColor(value: string, palette: Record<string, string>): string {
  const m = value.match(/^\{palette\.([a-zA-Z0-9_-]+)\}$/);
  if (!m) return value;
  return palette[m[1]] ?? '#888';
}

export function themeUrl(theme: Theme): string {
  return `https://theme-atoms.com/themes/${theme.meta.id}.toml`;
}

export function aishCommand(theme: Theme): string {
  return `aish theme set ${theme.meta.id}`;
}
