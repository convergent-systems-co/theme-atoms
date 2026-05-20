// Extract Nerd Font metadata from brand-atoms/fonts/*/N/atom.yaml into
// theme-atoms/web/src/lib/fonts.generated.json.
//
// We don't redistribute the font binaries — theme-atoms.com references the
// existing self-hosted files on cdn.brand-atoms.com. We just catalog the
// names, weights, fallback chains, and CDN URLs so consumers can pick a
// font, preview it, and assemble an @font-face declaration.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, '..');
const repoRoot = resolve(webRoot, '..');
const brandAtomsRoot = resolve(repoRoot, '..', 'brand-atoms');
const fontsDir = join(brandAtomsRoot, 'fonts');
const outPath = join(webRoot, 'src', 'lib', 'fonts.generated.json');

// Minimal YAML parser for the subset of shapes we see in atom.yaml.
// Handles: top-level scalars, nested objects, lists of scalars, lists of
// {key: value} maps. Sufficient for atom.yaml — not a general YAML parser.
function parseSimpleYaml(text) {
  const lines = text.split('\n');
  const root = {};
  const stack = [{ obj: root, indent: -1 }];

  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    if (!raw.trim() || raw.trim().startsWith('#')) { i++; continue; }
    const indent = raw.length - raw.trimStart().length;
    const line = raw.trim();

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
    const parent = stack[stack.length - 1].obj;

    // list item
    if (line.startsWith('- ')) {
      const itemText = line.slice(2).trim();
      // ensure parent is a list — the caller must have created an array key
      if (!Array.isArray(parent)) {
        i++; continue;
      }
      if (itemText.startsWith('{') && itemText.endsWith('}')) {
        const obj = {};
        const body = itemText.slice(1, -1);
        for (const kv of body.split(',')) {
          const [k, v] = kv.split(':').map((s) => s.trim());
          obj[k] = isNaN(Number(v)) ? v : Number(v);
        }
        parent.push(obj);
      } else {
        parent.push(stripQuotes(itemText));
      }
      i++;
      continue;
    }

    // key: value or key:  — broad set so filenames (digits, dots, '+', '-') parse as keys
    const m = line.match(/^([A-Za-z0-9_.+][A-Za-z0-9_.+\-]*)\s*:\s*(.*)$/);
    if (!m) { i++; continue; }
    const key = m[1];
    let value = m[2];
    if (value === '') {
      // peek next line for nested
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      if (j < lines.length) {
        const nextIndent = lines[j].length - lines[j].trimStart().length;
        if (nextIndent > indent) {
          const child = lines[j].trim().startsWith('- ') ? [] : {};
          parent[key] = child;
          stack.push({ obj: child, indent });
          i++;
          continue;
        }
      }
      parent[key] = null;
    } else if (value === '>' || value === '|') {
      // folded scalar: collect indented lines as a single string
      let j = i + 1;
      const parts = [];
      while (j < lines.length) {
        if (!lines[j].trim()) { parts.push(''); j++; continue; }
        const ni = lines[j].length - lines[j].trimStart().length;
        if (ni <= indent) break;
        parts.push(lines[j].trim());
        j++;
      }
      parent[key] = parts.join(' ').trim();
      i = j;
      continue;
    } else {
      parent[key] = isNaN(Number(value)) ? stripQuotes(value) : Number(value);
    }
    i++;
  }
  return root;
}

function stripQuotes(s) {
  if (typeof s !== 'string') return s;
  return s.replace(/^["']|["']$/g, '');
}

function pickCdn(cdnUrls) {
  if (!cdnUrls || typeof cdnUrls !== 'object') return {};
  const out = { regular: null, italic: null, bold: null, boldItalic: null };
  for (const [name, url] of Object.entries(cdnUrls)) {
    const low = name.toLowerCase();
    if (low.includes('regular') && !low.includes('italic')) out.regular = url;
    else if (low.endsWith('italic.ttf') && low.includes('bold') && !low.includes('extra') && !low.includes('semi')) out.boldItalic = url;
    else if (low.endsWith('italic.ttf') && !low.includes('bold') && !low.includes('extra') && !low.includes('semi') && !low.includes('light') && !low.includes('thin') && !low.includes('medium')) out.italic = url;
    else if (low.includes('bold.ttf') && !low.includes('extra') && !low.includes('semi')) out.bold = url;
  }
  // Fallback: take any regular-ish file, else any file at all
  if (!out.regular) {
    out.regular = Object.values(cdnUrls).find((u) => /Regular|Mono\.ttf/i.test(u)) ?? Object.values(cdnUrls)[0] ?? null;
  }
  return out;
}

function isNerdFont(meta) {
  if (!meta) return false;
  const tags = Array.isArray(meta.tags) ? meta.tags : [];
  if (tags.includes('nerd-font')) return true;
  if (typeof meta.family === 'string' && /nerd font/i.test(meta.family)) return true;
  if (typeof meta.id === 'string' && /nerdfont/i.test(meta.id)) return true;
  return false;
}

if (!existsSync(fontsDir)) {
  console.warn(`brand-atoms fonts dir not found at ${fontsDir}; skipping`);
  writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), fonts: [] }, null, 2));
  process.exit(0);
}

const entries = readdirSync(fontsDir).filter((d) => {
  try { return readdirSync(join(fontsDir, d)).length > 0; } catch { return false; }
});

const fonts = [];
for (const id of entries) {
  const versionDirs = readdirSync(join(fontsDir, id)).filter((v) => /^[0-9]/.test(v));
  if (!versionDirs.length) continue;
  versionDirs.sort();
  const latest = versionDirs[versionDirs.length - 1];
  const atomPath = join(fontsDir, id, latest, 'atom.yaml');
  if (!existsSync(atomPath)) continue;
  const meta = parseSimpleYaml(readFileSync(atomPath, 'utf-8'));
  if (!isNerdFont(meta)) continue;

  const cdn = pickCdn(meta.cdnUrls);
  const weights = Array.isArray(meta.availableStyles)
    ? [...new Set(meta.availableStyles.map((s) => s.weight).filter((w) => typeof w === 'number'))].sort((a, b) => a - b)
    : [400];
  const styles = Array.isArray(meta.availableStyles)
    ? [...new Set(meta.availableStyles.map((s) => s.style).filter(Boolean))]
    : ['normal'];

  fonts.push({
    id,
    family: meta.family ?? id,
    name: meta.name ?? meta.family ?? id,
    description: (meta.description ?? '').trim(),
    license: meta?.provenance?.license ?? 'unknown',
    classification: meta.classification ?? 'monospace',
    weights,
    styles,
    fallbackStack: Array.isArray(meta.fallbackStack) ? meta.fallbackStack : [],
    version: latest,
    cdn,
    source: meta?.provenance?.source ?? null,
  });
}

fonts.sort((a, b) => a.name.localeCompare(b.name));

writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), count: fonts.length, fonts }, null, 2));
console.log(`extracted ${fonts.length} Nerd Font(s) -> ${outPath}`);
