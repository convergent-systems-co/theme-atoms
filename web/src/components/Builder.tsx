import { useMemo, useState } from 'react';
import type { Theme, FontSpec, HorizontalBar, VerticalBar, ElementsMap, ElementStyle } from '../lib/themes';
import TerminalPreview from './TerminalPreview';
import { ELEMENT_CATALOG, CATEGORY_LABEL, PROMPT_ALLOWED_IDS, ALL_ELEMENT_IDS, type ElementCategory } from '../lib/elements';
import { GLYPH_GROUPS } from '../lib/glyphs';

export interface BuilderProps {
  seedThemes: Theme[];
  fontFamilies?: string[];
}

const SEPARATORS = ['powerline', 'minimal', 'classic', 'none'] as const;
const GLYPHS = ['nerd-default', 'ascii', 'minimal'] as const;
const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

// Group catalog by category for rendering chip lists
function groupByCategory(ids: string[]): Record<ElementCategory, string[]> {
  const groups = {} as Record<ElementCategory, string[]>;
  for (const id of ids) {
    const spec = ELEMENT_CATALOG.find((e) => e.id === id);
    if (!spec) continue;
    if (!groups[spec.category]) groups[spec.category] = [];
    groups[spec.category].push(id);
  }
  return groups;
}

const PROMPT_GROUPS = groupByCategory(PROMPT_ALLOWED_IDS);
const BAR_GROUPS = groupByCategory(ALL_ELEMENT_IDS);

function emitToml(t: Theme): string {
  const meta = t.meta;
  let s = `schema = "https://theme-atoms.com/schemas/theme-v1.json"\n\n`;
  s += `[meta]\n`;
  s += `id = "${meta.id}"\n`;
  s += `version = "${meta.version}"\n`;
  s += `display_name = ${JSON.stringify(meta.display_name)}\n`;
  if (meta.description) s += `description = ${JSON.stringify(meta.description)}\n`;
  if (meta.extends_brand) s += `extends_brand = ${JSON.stringify(meta.extends_brand)}\n`;

  if (t.font) {
    s += `\n[font]\n`;
    s += `family = ${JSON.stringify(t.font.family)}\n`;
    if (t.font.fallback?.length) s += `fallback = [${t.font.fallback.map((x) => JSON.stringify(x)).join(', ')}]\n`;
    if (t.font.size != null) s += `size = ${t.font.size}\n`;
    if (t.font.weight != null) s += `weight = ${t.font.weight}\n`;
    if (t.font.ligatures != null) s += `ligatures = ${t.font.ligatures}\n`;
    if (t.font.nerd_font != null) s += `nerd_font = ${t.font.nerd_font}\n`;
  }

  s += `\n[palette]\n`;
  for (const [k, v] of Object.entries(t.palette)) s += `${k} = "${v}"\n`;
  s += `\n[prompt]\n`;
  s += `character = ${JSON.stringify(t.prompt.character)}\n`;
  s += `character_color = "${t.prompt.character_color}"\n`;
  if (t.prompt.segments?.length) s += `segments = [${t.prompt.segments.map((x) => `"${x}"`).join(', ')}]\n`;
  if (t.prompt.separator) s += `separator = "${t.prompt.separator}"\n`;
  if (t.prompt.glyphs) s += `glyphs = "${t.prompt.glyphs}"\n`;
  if (t.roles && Object.keys(t.roles).length) {
    s += `\n[roles]\n`;
    for (const [k, v] of Object.entries(t.roles)) s += `${k} = "${v}"\n`;
  }
  if (t.syntax && Object.keys(t.syntax).length) {
    s += `\n[syntax]\n`;
    for (const [k, v] of Object.entries(t.syntax)) s += `${k} = "${v}"\n`;
  }

  const emitElements = (dir: string, elements?: ElementsMap) => {
    if (!elements || !Object.keys(elements).length) return;
    for (const [elId, style] of Object.entries(elements)) {
      if (!style || (style.icon == null && !style.color)) continue;
      s += `\n[layout.${dir}.elements."${elId}"]\n`;
      if (style.icon !== undefined) s += `icon = ${JSON.stringify(style.icon)}\n`;
      if (style.color) s += `color = "${style.color}"\n`;
    }
  };
  const emitHBar = (dir: 'north' | 'south', b: HorizontalBar) => {
    s += `\n[layout.${dir}]\n`;
    s += `enabled = true\n`;
    if (b.background) s += `background = "${b.background}"\n`;
    if (b.foreground) s += `foreground = "${b.foreground}"\n`;
    s += `left = [${(b.left ?? []).map((x) => `"${x}"`).join(', ')}]\n`;
    s += `center = [${(b.center ?? []).map((x) => `"${x}"`).join(', ')}]\n`;
    s += `right = [${(b.right ?? []).map((x) => `"${x}"`).join(', ')}]\n`;
    emitElements(dir, b.elements);
  };
  const emitVBar = (dir: 'east' | 'west', b: VerticalBar) => {
    s += `\n[layout.${dir}]\n`;
    s += `enabled = true\n`;
    if (b.background) s += `background = "${b.background}"\n`;
    if (b.foreground) s += `foreground = "${b.foreground}"\n`;
    if (b.width != null) s += `width = ${b.width}\n`;
    s += `top = [${(b.top ?? []).map((x) => `"${x}"`).join(', ')}]\n`;
    s += `center = [${(b.center ?? []).map((x) => `"${x}"`).join(', ')}]\n`;
    s += `bottom = [${(b.bottom ?? []).map((x) => `"${x}"`).join(', ')}]\n`;
    emitElements(dir, b.elements);
  };

  if (t.layout) {
    if (t.layout.north?.enabled) emitHBar('north', t.layout.north);
    if (t.layout.south?.enabled) emitHBar('south', t.layout.south);
    if (t.layout.east?.enabled) emitVBar('east', t.layout.east);
    if (t.layout.west?.enabled) emitVBar('west', t.layout.west);
  }
  return s;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'my-theme';
}

interface ChipListProps { value: string[]; groups: Record<ElementCategory, string[]>; onChange: (v: string[]) => void; }
function CategorizedChips({ value, groups, onChange }: ChipListProps) {
  return (
    <div className="cat-chips">
      {(Object.keys(groups) as ElementCategory[]).map((cat) => (
        <div key={cat} className="cat-group">
          <div className="cat-label">{CATEGORY_LABEL[cat]}</div>
          <div className="chips">
            {groups[cat].map((o) => {
              const on = value.includes(o);
              return (
                <label key={o} className={`chip ${on ? 'on' : ''}`}>
                  <input type="checkbox" checked={on} onChange={() => {
                    if (on) onChange(value.filter((x) => x !== o));
                    else onChange([...value, o]);
                  }} />
                  {o}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// Per-element style editor: shown for each element actually used in any bar
function ElementStyleEditor({
  ids, style, onChange,
}: {
  ids: string[];
  style: ElementsMap;
  onChange: (s: ElementsMap) => void;
}) {
  if (ids.length === 0) return null;
  const update = (id: string, patch: Partial<ElementStyle>) => {
    const cur = style[id] ?? {};
    const next = { ...cur, ...patch };
    // Drop empty entries
    const cleaned: ElementStyle = {};
    if (next.icon !== undefined && next.icon !== '') cleaned.icon = next.icon;
    if (next.color) cleaned.color = next.color;
    const map = { ...style };
    if (Object.keys(cleaned).length === 0) delete map[id];
    else map[id] = cleaned;
    onChange(map);
  };
  return (
    <div className="estyle">
      {ids.map((id) => {
        const cur = style[id] ?? {};
        return (
          <div key={id} className="estyle-row">
            <code className="estyle-id">{id}</code>
            <input
              type="text"
              className="estyle-icon"
              placeholder="(default)"
              value={cur.icon ?? ''}
              onChange={(e) => update(id, { icon: e.target.value })}
              aria-label={`Icon for ${id}`}
              maxLength={6}
            />
            <input
              type="text"
              className="estyle-color"
              placeholder="#hex or {palette.x}"
              value={cur.color ?? ''}
              onChange={(e) => update(id, { color: e.target.value })}
              aria-label={`Color for ${id}`}
            />
          </div>
        );
      })}
    </div>
  );
}

// Glyph library: browse + copy. Click a glyph to copy to clipboard.
function GlyphLibrary({ onPick }: { onPick: (char: string) => void }) {
  const [filter, setFilter] = useState('');
  const [active, setActive] = useState<string | null>(null);
  const groups = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return GLYPH_GROUPS;
    return GLYPH_GROUPS.map((g) => ({ ...g, glyphs: g.glyphs.filter((x) => x.name.toLowerCase().includes(q) || x.char === q) })).filter((g) => g.glyphs.length > 0);
  }, [filter]);
  const click = (char: string) => {
    navigator.clipboard.writeText(char);
    setActive(char);
    onPick(char);
    setTimeout(() => setActive(null), 700);
  };
  return (
    <section className="glyphs">
      <h3>Glyphs library — mix-and-match families</h3>
      <p className="hint">Click any glyph to copy it to your clipboard. Paste into an element's icon field (below each bar) or anywhere else.</p>
      <input className="gfilter" type="search" placeholder="Filter (e.g. branch, weather, docker)…" value={filter} onChange={(e) => setFilter(e.target.value)} />
      <div className="glyph-grid">
        {groups.map((g) => (
          <div key={g.id} className="ggroup">
            <div className="ggroup-label">{g.label}</div>
            <div className="grow">
              {g.glyphs.map((gl) => (
                <button
                  key={gl.name}
                  type="button"
                  className={`gbtn ${active === gl.char ? 'flash' : ''}`}
                  title={`${gl.name} — click to copy`}
                  onClick={() => click(gl.char)}
                >
                  <span className="ch">{gl.char}</span>
                  <span className="nm">{gl.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Builder({ seedThemes, fontFamilies = [] }: BuilderProps) {
  const [seedId, setSeedId] = useState(seedThemes[0]?.meta.id ?? 'default');
  const seed = useMemo(() => seedThemes.find((t) => t.meta.id === seedId) ?? seedThemes[0], [seedThemes, seedId]);

  const [displayName, setDisplayName] = useState('My Theme');
  const [extendsBrand, setExtendsBrand] = useState('');
  const [palette, setPalette] = useState<Record<string, string>>({ ...seed.palette });
  const [promptChar, setPromptChar] = useState(seed.prompt.character);
  const [promptColor, setPromptColor] = useState(seed.prompt.character_color);
  const [segments, setSegments] = useState<string[]>(seed.prompt.segments ?? []);
  const [separator, setSeparator] = useState<typeof SEPARATORS[number]>(seed.prompt.separator ?? 'none');
  const [glyphsMode, setGlyphsMode] = useState<typeof GLYPHS[number]>(seed.prompt.glyphs ?? 'ascii');

  const [fontFamily, setFontFamily] = useState(seed.font?.family ?? '');
  const [fontSize, setFontSize] = useState<number | undefined>(seed.font?.size);
  const [fontWeight, setFontWeight] = useState<typeof WEIGHTS[number] | undefined>(seed.font?.weight);
  const [fontLigatures, setFontLigatures] = useState(seed.font?.ligatures ?? false);
  const [fontNerd, setFontNerd] = useState(seed.font?.nerd_font ?? false);

  const [northEnabled, setNorthEnabled] = useState(seed.layout?.north?.enabled ?? false);
  const [northBg, setNorthBg] = useState(seed.layout?.north?.background ?? '');
  const [northFg, setNorthFg] = useState(seed.layout?.north?.foreground ?? '');
  const [northLeft, setNorthLeft] = useState<string[]>(seed.layout?.north?.left ?? []);
  const [northRight, setNorthRight] = useState<string[]>(seed.layout?.north?.right ?? []);
  const [northElements, setNorthElements] = useState<ElementsMap>(seed.layout?.north?.elements ?? {});

  const [southEnabled, setSouthEnabled] = useState(seed.layout?.south?.enabled ?? false);
  const [southBg, setSouthBg] = useState(seed.layout?.south?.background ?? '');
  const [southFg, setSouthFg] = useState(seed.layout?.south?.foreground ?? '');
  const [southLeft, setSouthLeft] = useState<string[]>(seed.layout?.south?.left ?? []);
  const [southRight, setSouthRight] = useState<string[]>(seed.layout?.south?.right ?? []);
  const [southElements, setSouthElements] = useState<ElementsMap>(seed.layout?.south?.elements ?? {});

  const [eastEnabled, setEastEnabled] = useState(seed.layout?.east?.enabled ?? false);
  const [eastBg, setEastBg] = useState(seed.layout?.east?.background ?? '');
  const [eastFg, setEastFg] = useState(seed.layout?.east?.foreground ?? '');
  const [eastWidth, setEastWidth] = useState<number | undefined>(seed.layout?.east?.width);
  const [eastTop, setEastTop] = useState<string[]>(seed.layout?.east?.top ?? []);
  const [eastCenter, setEastCenter] = useState<string[]>(seed.layout?.east?.center ?? []);
  const [eastBottom, setEastBottom] = useState<string[]>(seed.layout?.east?.bottom ?? []);
  const [eastElements, setEastElements] = useState<ElementsMap>(seed.layout?.east?.elements ?? {});

  const [westEnabled, setWestEnabled] = useState(seed.layout?.west?.enabled ?? false);
  const [westBg, setWestBg] = useState(seed.layout?.west?.background ?? '');
  const [westFg, setWestFg] = useState(seed.layout?.west?.foreground ?? '');
  const [westWidth, setWestWidth] = useState<number | undefined>(seed.layout?.west?.width);
  const [westTop, setWestTop] = useState<string[]>(seed.layout?.west?.top ?? []);
  const [westCenter, setWestCenter] = useState<string[]>(seed.layout?.west?.center ?? []);
  const [westBottom, setWestBottom] = useState<string[]>(seed.layout?.west?.bottom ?? []);
  const [westElements, setWestElements] = useState<ElementsMap>(seed.layout?.west?.elements ?? {});

  const id = slugify(displayName);

  const font: FontSpec | undefined = fontFamily ? {
    family: fontFamily,
    ...(fontSize != null ? { size: fontSize } : {}),
    ...(fontWeight != null ? { weight: fontWeight } : {}),
    ...(fontLigatures ? { ligatures: true } : {}),
    ...(fontNerd ? { nerd_font: true } : {}),
  } : undefined;

  const north: HorizontalBar | undefined = northEnabled ? {
    enabled: true,
    ...(northBg ? { background: northBg } : {}),
    ...(northFg ? { foreground: northFg } : {}),
    left: northLeft, center: [], right: northRight,
    ...(Object.keys(northElements).length ? { elements: northElements } : {}),
  } : undefined;
  const south: HorizontalBar | undefined = southEnabled ? {
    enabled: true,
    ...(southBg ? { background: southBg } : {}),
    ...(southFg ? { foreground: southFg } : {}),
    left: southLeft, center: [], right: southRight,
    ...(Object.keys(southElements).length ? { elements: southElements } : {}),
  } : undefined;
  const east: VerticalBar | undefined = eastEnabled ? {
    enabled: true,
    ...(eastBg ? { background: eastBg } : {}),
    ...(eastFg ? { foreground: eastFg } : {}),
    ...(eastWidth != null ? { width: eastWidth } : {}),
    top: eastTop, center: eastCenter, bottom: eastBottom,
    ...(Object.keys(eastElements).length ? { elements: eastElements } : {}),
  } : undefined;
  const west: VerticalBar | undefined = westEnabled ? {
    enabled: true,
    ...(westBg ? { background: westBg } : {}),
    ...(westFg ? { foreground: westFg } : {}),
    ...(westWidth != null ? { width: westWidth } : {}),
    top: westTop, center: westCenter, bottom: westBottom,
    ...(Object.keys(westElements).length ? { elements: westElements } : {}),
  } : undefined;

  const layout = (north || south || east || west)
    ? { ...(north ? { north } : {}), ...(south ? { south } : {}), ...(east ? { east } : {}), ...(west ? { west } : {}) }
    : undefined;

  const theme: Theme = {
    schema: 'https://theme-atoms.com/schemas/theme-v1.json',
    meta: { id, version: '0.1.0', display_name: displayName, ...(extendsBrand ? { extends_brand: extendsBrand } : {}) },
    palette,
    prompt: { character: promptChar, character_color: promptColor, segments, separator, glyphs: glyphsMode },
    roles: seed.roles,
    syntax: seed.syntax,
    ...(font ? { font } : {}),
    ...(layout ? { layout } : {}),
  };

  const toml = useMemo(() => emitToml(theme), [theme]);

  const resetFromSeed = () => {
    setPalette({ ...seed.palette });
    setPromptChar(seed.prompt.character);
    setPromptColor(seed.prompt.character_color);
    setSegments(seed.prompt.segments ?? []);
    setSeparator(seed.prompt.separator ?? 'none');
    setGlyphsMode(seed.prompt.glyphs ?? 'ascii');
    setFontFamily(seed.font?.family ?? '');
    setFontSize(seed.font?.size);
    setFontWeight(seed.font?.weight);
    setFontLigatures(seed.font?.ligatures ?? false);
    setFontNerd(seed.font?.nerd_font ?? false);
    setNorthEnabled(seed.layout?.north?.enabled ?? false);
    setNorthBg(seed.layout?.north?.background ?? '');
    setNorthFg(seed.layout?.north?.foreground ?? '');
    setNorthLeft(seed.layout?.north?.left ?? []);
    setNorthRight(seed.layout?.north?.right ?? []);
    setNorthElements(seed.layout?.north?.elements ?? {});
    setSouthEnabled(seed.layout?.south?.enabled ?? false);
    setSouthBg(seed.layout?.south?.background ?? '');
    setSouthFg(seed.layout?.south?.foreground ?? '');
    setSouthLeft(seed.layout?.south?.left ?? []);
    setSouthRight(seed.layout?.south?.right ?? []);
    setSouthElements(seed.layout?.south?.elements ?? {});
    setEastEnabled(seed.layout?.east?.enabled ?? false);
    setEastBg(seed.layout?.east?.background ?? '');
    setEastFg(seed.layout?.east?.foreground ?? '');
    setEastWidth(seed.layout?.east?.width);
    setEastTop(seed.layout?.east?.top ?? []);
    setEastCenter(seed.layout?.east?.center ?? []);
    setEastBottom(seed.layout?.east?.bottom ?? []);
    setEastElements(seed.layout?.east?.elements ?? {});
    setWestEnabled(seed.layout?.west?.enabled ?? false);
    setWestBg(seed.layout?.west?.background ?? '');
    setWestFg(seed.layout?.west?.foreground ?? '');
    setWestWidth(seed.layout?.west?.width);
    setWestTop(seed.layout?.west?.top ?? []);
    setWestCenter(seed.layout?.west?.center ?? []);
    setWestBottom(seed.layout?.west?.bottom ?? []);
    setWestElements(seed.layout?.west?.elements ?? {});
  };

  const copyToml = () => { navigator.clipboard.writeText(toml); };
  const downloadToml = () => {
    const blob = new Blob([toml], { type: 'application/toml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${id}.toml`; a.click();
    URL.revokeObjectURL(url);
  };
  const proposeOnGitHub = () => {
    const body = encodeURIComponent(`<!-- Paste themes/${id}.toml content below and we'll publish it. -->\n\n\`\`\`toml\n${toml}\n\`\`\``);
    const title = encodeURIComponent(`theme: ${displayName}`);
    window.open(`https://github.com/convergent-systems-co/theme-atoms/issues/new?title=${title}&body=${body}&labels=theme-request`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="builder">
      <div className="grid">
        <aside className="controls">
          <section>
            <h3>Seed</h3>
            <select value={seedId} onChange={(e) => setSeedId(e.target.value)}>
              {seedThemes.map((t) => <option key={t.meta.id} value={t.meta.id}>{t.meta.display_name}</option>)}
            </select>
            <button type="button" className="ghost" onClick={resetFromSeed}>Reset to seed</button>
          </section>

          <section>
            <h3>Meta</h3>
            <label>Display name<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></label>
            <label>ID (auto)<input value={id} readOnly /></label>
            <label>Extends brand<input value={extendsBrand} onChange={(e) => setExtendsBrand(e.target.value)} placeholder="e.g. nord" /></label>
          </section>

          <section>
            <h3>Font</h3>
            <label>Family
              <input value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} placeholder="e.g. JetBrainsMono Nerd Font" list="font-families" />
            </label>
            <datalist id="font-families">{fontFamilies.map((f) => <option key={f} value={f} />)}</datalist>
            <div className="row2">
              <label>Size<input type="number" min={6} max={48} value={fontSize ?? ''} onChange={(e) => setFontSize(e.target.value ? Number(e.target.value) : undefined)} /></label>
              <label>Weight
                <select value={fontWeight ?? ''} onChange={(e) => setFontWeight(e.target.value ? Number(e.target.value) as typeof WEIGHTS[number] : undefined)}>
                  <option value="">(default)</option>
                  {WEIGHTS.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </label>
            </div>
            <label className="cb"><input type="checkbox" checked={fontLigatures} onChange={(e) => setFontLigatures(e.target.checked)} /> Ligatures</label>
            <label className="cb"><input type="checkbox" checked={fontNerd} onChange={(e) => setFontNerd(e.target.checked)} /> Nerd Font</label>
          </section>

          <section>
            <h3>Prompt</h3>
            <label>Character<input value={promptChar} maxLength={8} onChange={(e) => setPromptChar(e.target.value)} /></label>
            <label>Character color<input value={promptColor} onChange={(e) => setPromptColor(e.target.value)} /></label>
            <label>Separator
              <select value={separator} onChange={(e) => setSeparator(e.target.value as typeof SEPARATORS[number])}>
                {SEPARATORS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label>Glyphs
              <select value={glyphsMode} onChange={(e) => setGlyphsMode(e.target.value as typeof GLYPHS[number])}>
                {GLYPHS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <div className="ckwrap">
              <div className="seg-label">Segments</div>
              <CategorizedChips value={segments} groups={PROMPT_GROUPS} onChange={setSegments} />
            </div>
          </section>

          <section>
            <h3>North bar (top)</h3>
            <label className="cb"><input type="checkbox" checked={northEnabled} onChange={(e) => setNorthEnabled(e.target.checked)} /> Enabled</label>
            {northEnabled && (
              <>
                <div className="row2">
                  <label>Background<input value={northBg} placeholder="#hex or {palette.x}" onChange={(e) => setNorthBg(e.target.value)} /></label>
                  <label>Foreground<input value={northFg} placeholder="#hex or {palette.x}" onChange={(e) => setNorthFg(e.target.value)} /></label>
                </div>
                <div className="ckwrap"><div className="seg-label">Left</div><CategorizedChips value={northLeft} groups={BAR_GROUPS} onChange={setNorthLeft} /></div>
                <div className="ckwrap"><div className="seg-label">Right</div><CategorizedChips value={northRight} groups={BAR_GROUPS} onChange={setNorthRight} /></div>
                <div className="ckwrap"><div className="seg-label">Element style overrides</div>
                  <ElementStyleEditor ids={[...new Set([...northLeft, ...northRight])]} style={northElements} onChange={setNorthElements} />
                </div>
              </>
            )}
          </section>

          <section>
            <h3>South bar (bottom)</h3>
            <label className="cb"><input type="checkbox" checked={southEnabled} onChange={(e) => setSouthEnabled(e.target.checked)} /> Enabled</label>
            {southEnabled && (
              <>
                <div className="row2">
                  <label>Background<input value={southBg} placeholder="#hex or {palette.x}" onChange={(e) => setSouthBg(e.target.value)} /></label>
                  <label>Foreground<input value={southFg} placeholder="#hex or {palette.x}" onChange={(e) => setSouthFg(e.target.value)} /></label>
                </div>
                <div className="ckwrap"><div className="seg-label">Left</div><CategorizedChips value={southLeft} groups={BAR_GROUPS} onChange={setSouthLeft} /></div>
                <div className="ckwrap"><div className="seg-label">Right</div><CategorizedChips value={southRight} groups={BAR_GROUPS} onChange={setSouthRight} /></div>
                <div className="ckwrap"><div className="seg-label">Element style overrides</div>
                  <ElementStyleEditor ids={[...new Set([...southLeft, ...southRight])]} style={southElements} onChange={setSouthElements} />
                </div>
              </>
            )}
          </section>

          <section>
            <h3>East bar (right sidebar)</h3>
            <label className="cb"><input type="checkbox" checked={eastEnabled} onChange={(e) => setEastEnabled(e.target.checked)} /> Enabled</label>
            {eastEnabled && (
              <>
                <div className="row2">
                  <label>Background<input value={eastBg} placeholder="#hex or {palette.x}" onChange={(e) => setEastBg(e.target.value)} /></label>
                  <label>Foreground<input value={eastFg} placeholder="#hex or {palette.x}" onChange={(e) => setEastFg(e.target.value)} /></label>
                </div>
                <label>Width (cells)<input type="number" min={4} max={80} value={eastWidth ?? ''} onChange={(e) => setEastWidth(e.target.value ? Number(e.target.value) : undefined)} placeholder="e.g. 24" /></label>
                <div className="ckwrap"><div className="seg-label">Top</div><CategorizedChips value={eastTop} groups={BAR_GROUPS} onChange={setEastTop} /></div>
                <div className="ckwrap"><div className="seg-label">Center</div><CategorizedChips value={eastCenter} groups={BAR_GROUPS} onChange={setEastCenter} /></div>
                <div className="ckwrap"><div className="seg-label">Bottom</div><CategorizedChips value={eastBottom} groups={BAR_GROUPS} onChange={setEastBottom} /></div>
                <div className="ckwrap"><div className="seg-label">Element style overrides</div>
                  <ElementStyleEditor ids={[...new Set([...eastTop, ...eastCenter, ...eastBottom])]} style={eastElements} onChange={setEastElements} />
                </div>
              </>
            )}
          </section>

          <section>
            <h3>West bar (left sidebar)</h3>
            <label className="cb"><input type="checkbox" checked={westEnabled} onChange={(e) => setWestEnabled(e.target.checked)} /> Enabled</label>
            {westEnabled && (
              <>
                <div className="row2">
                  <label>Background<input value={westBg} placeholder="#hex or {palette.x}" onChange={(e) => setWestBg(e.target.value)} /></label>
                  <label>Foreground<input value={westFg} placeholder="#hex or {palette.x}" onChange={(e) => setWestFg(e.target.value)} /></label>
                </div>
                <label>Width (cells)<input type="number" min={4} max={80} value={westWidth ?? ''} onChange={(e) => setWestWidth(e.target.value ? Number(e.target.value) : undefined)} placeholder="e.g. 20" /></label>
                <div className="ckwrap"><div className="seg-label">Top</div><CategorizedChips value={westTop} groups={BAR_GROUPS} onChange={setWestTop} /></div>
                <div className="ckwrap"><div className="seg-label">Center</div><CategorizedChips value={westCenter} groups={BAR_GROUPS} onChange={setWestCenter} /></div>
                <div className="ckwrap"><div className="seg-label">Bottom</div><CategorizedChips value={westBottom} groups={BAR_GROUPS} onChange={setWestBottom} /></div>
                <div className="ckwrap"><div className="seg-label">Element style overrides</div>
                  <ElementStyleEditor ids={[...new Set([...westTop, ...westCenter, ...westBottom])]} style={westElements} onChange={setWestElements} />
                </div>
              </>
            )}
          </section>

          <section>
            <h3>Palette</h3>
            <div className="pal">
              {Object.entries(palette).map(([k, v]) => (
                <div className="pal-row" key={k}>
                  <input type="color" value={v.length === 7 ? v : '#888888'} onChange={(e) => setPalette({ ...palette, [k]: e.target.value })} />
                  <code className="pal-key">{k}</code>
                  <input type="text" value={v} onChange={(e) => setPalette({ ...palette, [k]: e.target.value })} />
                </div>
              ))}
            </div>
          </section>
        </aside>

        <div className="preview-col">
          <h3>Live preview</h3>
          <TerminalPreview theme={theme} />

          <GlyphLibrary onPick={() => {}} />

          <h3 style={{ marginTop: 24 }}>theme.toml</h3>
          <pre className="output"><code>{toml}</code></pre>
          <div className="actions">
            <button type="button" onClick={copyToml}>Copy TOML</button>
            <button type="button" onClick={downloadToml}>Download {id}.toml</button>
            <button type="button" className="primary" onClick={proposeOnGitHub}>Propose on GitHub</button>
          </div>
          <p className="hint">"Propose on GitHub" opens a pre-filled issue. We review + merge; the theme lands at <code>https://theme-atoms.com/themes/{id}.toml</code> and is consumable from <code>aish theme set {id}</code> immediately.</p>
        </div>
      </div>

      <style>{`
        .builder { font-family: var(--font-sans); }
        .grid { display: grid; grid-template-columns: 400px 1fr; gap: 24px; }
        .controls { display: flex; flex-direction: column; gap: 20px; }
        .controls section { background: var(--surface); padding: 16px; border-radius: 10px; display: flex; flex-direction: column; gap: 10px; }
        .controls h3 { margin: 0 0 4px; font-size: 13px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.06em; }
        .controls label { display: flex; flex-direction: column; font-size: 12px; color: var(--text-tertiary); gap: 4px; }
        .controls label.cb { flex-direction: row; align-items: center; gap: 6px; color: var(--text-secondary); }
        .controls input[type=text], .controls input[type=number], .controls input[type=search], .controls input:not([type]), .controls select {
          background: var(--surface-elevated); color: var(--text-primary); border: 1px solid var(--surface); padding: 8px 10px; border-radius: 6px; font: inherit; font-size: 13px;
        }
        .controls button { background: var(--primary); color: #000; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font: inherit; font-size: 13px; }
        .controls button.ghost { background: transparent; color: var(--text-secondary); border: 1px solid var(--surface-elevated); }
        .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

        .cat-chips { display: flex; flex-direction: column; gap: 8px; }
        .cat-group .cat-label { font-size: 10px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
        .chips { display: flex; flex-wrap: wrap; gap: 4px; }
        .chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 7px; border-radius: 4px; background: var(--surface-elevated); cursor: pointer; font-size: 11px; color: var(--text-secondary); }
        .chip.on { background: var(--primary); color: #000; }
        .chip input { margin: 0; }
        .ckwrap { display: flex; flex-direction: column; gap: 6px; }
        .seg-label { font-size: 11px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.06em; }

        .estyle { display: flex; flex-direction: column; gap: 4px; }
        .estyle-row { display: grid; grid-template-columns: 1fr 50px 1fr; gap: 6px; align-items: center; }
        .estyle-id { font-size: 11px; color: var(--text-secondary); padding: 4px 6px; }
        .estyle-icon { text-align: center; font-family: var(--font-mono); }
        .estyle-color { font-size: 11px; }

        .pal { display: flex; flex-direction: column; gap: 4px; max-height: 320px; overflow-y: auto; }
        .pal-row { display: grid; grid-template-columns: 36px 1fr 100px; align-items: center; gap: 8px; }
        .pal-row input[type=color] { width: 36px; height: 28px; padding: 0; border: 1px solid var(--surface-elevated); border-radius: 4px; }
        .pal-key { font-size: 11px; color: var(--text-secondary); }
        .pal-row input[type=text] { font-size: 11px; padding: 4px 6px; }

        .preview-col { min-width: 0; }
        .preview-col h3 { font-size: 13px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 8px; }
        .output { background: var(--surface); border-radius: 8px; max-height: 360px; overflow: auto; }
        .actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
        .actions button { background: var(--surface-elevated); color: var(--text-primary); border: 1px solid var(--surface); padding: 8px 14px; border-radius: 6px; cursor: pointer; font: inherit; font-size: 13px; }
        .actions button.primary { background: var(--primary); color: #000; border-color: transparent; }
        .actions button:hover { border-color: var(--primary); }
        .hint { font-size: 12px; color: var(--text-tertiary); margin-top: 12px; max-width: 560px; }

        .glyphs { margin-top: 32px; background: var(--surface); padding: 16px; border-radius: 10px; }
        .glyphs h3 { margin: 0 0 4px; font-size: 14px; color: var(--text-primary); }
        .gfilter { width: 100%; max-width: 320px; margin: 8px 0 12px; background: var(--surface-elevated); border: 1px solid var(--surface); color: var(--text-primary); padding: 6px 10px; border-radius: 6px; font-size: 13px; }
        .glyph-grid { display: grid; gap: 16px; }
        .ggroup-label { font-size: 11px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
        .grow { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 6px; }
        .gbtn { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 8px 6px; background: var(--surface-elevated); border: 1px solid transparent; border-radius: 6px; cursor: pointer; color: var(--text-primary); }
        .gbtn:hover { border-color: var(--primary); }
        .gbtn.flash { background: var(--primary); color: #000; }
        .gbtn .ch { font-size: 22px; line-height: 1; }
        .gbtn .nm { font-size: 10px; color: var(--text-tertiary); }
        .gbtn.flash .nm { color: rgba(0,0,0,0.6); }

        @media (max-width: 900px) {
          .grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
