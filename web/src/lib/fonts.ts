import fontsData from './fonts.generated.json';

export interface FontCdnUrls {
  regular: string | null;
  italic: string | null;
  bold: string | null;
  boldItalic: string | null;
}

export interface FontEntry {
  id: string;
  family: string;
  name: string;
  description: string;
  license: string;
  classification: string;
  weights: number[];
  styles: string[];
  fallbackStack: string[];
  version: string;
  cdn: FontCdnUrls;
  source: string | null;
}

const data = fontsData as { generatedAt: string; count: number; fonts: FontEntry[] };

export function loadFonts(): FontEntry[] {
  return data.fonts;
}

export function getFontBySlug(id: string): FontEntry | undefined {
  return data.fonts.find((f) => f.id === id);
}

// Build a CSS @font-face block for a single font.
export function fontFaceCss(font: FontEntry): string {
  const blocks: string[] = [];
  const entries: Array<[string, string, number]> = [];
  if (font.cdn.regular) entries.push([font.cdn.regular, 'normal', 400]);
  if (font.cdn.italic) entries.push([font.cdn.italic, 'italic', 400]);
  if (font.cdn.bold) entries.push([font.cdn.bold, 'normal', 700]);
  if (font.cdn.boldItalic) entries.push([font.cdn.boldItalic, 'italic', 700]);
  for (const [url, style, weight] of entries) {
    blocks.push(`@font-face { font-family: ${JSON.stringify(font.family)}; src: url(${JSON.stringify(url)}) format('truetype'); font-style: ${style}; font-weight: ${weight}; font-display: swap; }`);
  }
  return blocks.join('\n');
}

export function allFontFaces(): string {
  return data.fonts.map(fontFaceCss).join('\n');
}
