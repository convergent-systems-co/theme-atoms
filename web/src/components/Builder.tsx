import { useMemo, useState } from 'react';
import type { Theme, FontSpec, HorizontalBar, VerticalBar } from '../lib/themes';
import TerminalPreview from './TerminalPreview';

export interface BuilderProps {
  seedThemes: Theme[];
}

const SEGMENTS = ['cwd', 'git-status', 'ai-tier', 'drachma-balance', 'exit-code', 'duration', 'k8s-context', 'user', 'host', 'venv'];
const BAR_ELEMENTS = [...SEGMENTS, 'session', 'time', 'ai-suggestion'];
const SEPARATORS = ['powerline', 'minimal', 'classic', 'none'] as const;
const GLYPHS = ['nerd-default', 'ascii', 'minimal'] as const;
const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

type HBarKey = 'north' | 'south';
type VBarKey = 'east' | 'west';

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

  if (t.layout) {
    for (const dir of ['north', 'south'] as const) {
      const b = t.layout[dir];
      if (!b?.enabled) continue;
      s += `\n[layout.${dir}]\n`;
      s += `enabled = true\n`;
      if (b.background) s += `background = "${b.background}"\n`;
      if (b.foreground) s += `foreground = "${b.foreground}"\n`;
      s += `left = [${(b.left ?? []).map((x) => `"${x}"`).join(', ')}]\n`;
      s += `center = [${(b.center ?? []).map((x) => `"${x}"`).join(', ')}]\n`;
      s += `right = [${(b.right ?? []).map((x) => `"${x}"`).join(', ')}]\n`;
    }
    for (const dir of ['east', 'west'] as const) {
      const b = t.layout[dir];
      if (!b?.enabled) continue;
      s += `\n[layout.${dir}]\n`;
      s += `enabled = true\n`;
      if (b.background) s += `background = "${b.background}"\n`;
      if (b.foreground) s += `foreground = "${b.foreground}"\n`;
      if (b.width != null) s += `width = ${b.width}\n`;
      s += `top = [${(b.top ?? []).map((x) => `"${x}"`).join(', ')}]\n`;
      s += `center = [${(b.center ?? []).map((x) => `"${x}"`).join(', ')}]\n`;
      s += `bottom = [${(b.bottom ?? []).map((x) => `"${x}"`).join(', ')}]\n`;
    }
  }
  return s;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'my-theme';
}

function ChipToggleList({ value, options, onChange }: { value: string[]; options: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="chips">
      {options.map((o) => {
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
  );
}

export default function Builder({ seedThemes }: BuilderProps) {
  const [seedId, setSeedId] = useState(seedThemes[0]?.meta.id ?? 'default');
  const seed = useMemo(() => seedThemes.find((t) => t.meta.id === seedId) ?? seedThemes[0], [seedThemes, seedId]);

  const [displayName, setDisplayName] = useState('My Theme');
  const [extendsBrand, setExtendsBrand] = useState('');
  const [palette, setPalette] = useState<Record<string, string>>({ ...seed.palette });
  const [promptChar, setPromptChar] = useState(seed.prompt.character);
  const [promptColor, setPromptColor] = useState(seed.prompt.character_color);
  const [segments, setSegments] = useState<string[]>(seed.prompt.segments ?? []);
  const [separator, setSeparator] = useState<typeof SEPARATORS[number]>(seed.prompt.separator ?? 'none');
  const [glyphs, setGlyphs] = useState<typeof GLYPHS[number]>(seed.prompt.glyphs ?? 'ascii');

  const [fontFamily, setFontFamily] = useState(seed.font?.family ?? '');
  const [fontSize, setFontSize] = useState<number | undefined>(seed.font?.size);
  const [fontWeight, setFontWeight] = useState<typeof WEIGHTS[number] | undefined>(seed.font?.weight);
  const [fontLigatures, setFontLigatures] = useState(seed.font?.ligatures ?? false);
  const [fontNerd, setFontNerd] = useState(seed.font?.nerd_font ?? false);

  const [northEnabled, setNorthEnabled] = useState(seed.layout?.north?.enabled ?? false);
  const [northLeft, setNorthLeft] = useState<string[]>(seed.layout?.north?.left ?? []);
  const [northRight, setNorthRight] = useState<string[]>(seed.layout?.north?.right ?? []);

  const [southEnabled, setSouthEnabled] = useState(seed.layout?.south?.enabled ?? false);
  const [southLeft, setSouthLeft] = useState<string[]>(seed.layout?.south?.left ?? []);
  const [southRight, setSouthRight] = useState<string[]>(seed.layout?.south?.right ?? []);

  const id = slugify(displayName);

  const font: FontSpec | undefined = fontFamily ? {
    family: fontFamily,
    ...(fontSize != null ? { size: fontSize } : {}),
    ...(fontWeight != null ? { weight: fontWeight } : {}),
    ...(fontLigatures ? { ligatures: true } : {}),
    ...(fontNerd ? { nerd_font: true } : {}),
  } : undefined;

  const north: HorizontalBar | undefined = northEnabled ? { enabled: true, left: northLeft, center: [], right: northRight } : undefined;
  const south: HorizontalBar | undefined = southEnabled ? { enabled: true, left: southLeft, center: [], right: southRight } : undefined;

  const layout = (north || south) ? { ...(north ? { north } : {}), ...(south ? { south } : {}) } : undefined;

  const theme: Theme = {
    schema: 'https://theme-atoms.com/schemas/theme-v1.json',
    meta: { id, version: '0.1.0', display_name: displayName, ...(extendsBrand ? { extends_brand: extendsBrand } : {}) },
    palette,
    prompt: { character: promptChar, character_color: promptColor, segments, separator, glyphs },
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
    setGlyphs(seed.prompt.glyphs ?? 'ascii');
    setFontFamily(seed.font?.family ?? '');
    setFontSize(seed.font?.size);
    setFontWeight(seed.font?.weight);
    setFontLigatures(seed.font?.ligatures ?? false);
    setFontNerd(seed.font?.nerd_font ?? false);
    setNorthEnabled(seed.layout?.north?.enabled ?? false);
    setNorthLeft(seed.layout?.north?.left ?? []);
    setNorthRight(seed.layout?.north?.right ?? []);
    setSouthEnabled(seed.layout?.south?.enabled ?? false);
    setSouthLeft(seed.layout?.south?.left ?? []);
    setSouthRight(seed.layout?.south?.right ?? []);
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
            <label>Family<input value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} placeholder="e.g. JetBrains Mono" /></label>
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
              <select value={glyphs} onChange={(e) => setGlyphs(e.target.value as typeof GLYPHS[number])}>
                {GLYPHS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <div className="ckwrap">
              <div className="seg-label">Segments</div>
              <ChipToggleList value={segments} options={SEGMENTS} onChange={setSegments} />
            </div>
          </section>

          <section>
            <h3>North bar (top)</h3>
            <label className="cb"><input type="checkbox" checked={northEnabled} onChange={(e) => setNorthEnabled(e.target.checked)} /> Enabled</label>
            {northEnabled && (
              <>
                <div className="ckwrap"><div className="seg-label">Left</div><ChipToggleList value={northLeft} options={BAR_ELEMENTS} onChange={setNorthLeft} /></div>
                <div className="ckwrap"><div className="seg-label">Right</div><ChipToggleList value={northRight} options={BAR_ELEMENTS} onChange={setNorthRight} /></div>
              </>
            )}
          </section>

          <section>
            <h3>South bar (bottom)</h3>
            <label className="cb"><input type="checkbox" checked={southEnabled} onChange={(e) => setSouthEnabled(e.target.checked)} /> Enabled</label>
            {southEnabled && (
              <>
                <div className="ckwrap"><div className="seg-label">Left</div><ChipToggleList value={southLeft} options={BAR_ELEMENTS} onChange={setSouthLeft} /></div>
                <div className="ckwrap"><div className="seg-label">Right</div><ChipToggleList value={southRight} options={BAR_ELEMENTS} onChange={setSouthRight} /></div>
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
        .grid { display: grid; grid-template-columns: 380px 1fr; gap: 24px; }
        .controls { display: flex; flex-direction: column; gap: 20px; }
        .controls section { background: var(--surface); padding: 16px; border-radius: 10px; display: flex; flex-direction: column; gap: 10px; }
        .controls h3 { margin: 0 0 4px; font-size: 13px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.06em; }
        .controls label { display: flex; flex-direction: column; font-size: 12px; color: var(--text-tertiary); gap: 4px; }
        .controls label.cb { flex-direction: row; align-items: center; gap: 6px; color: var(--text-secondary); }
        .controls input[type=text], .controls input[type=number], .controls input:not([type]), .controls select {
          background: var(--surface-elevated); color: var(--text-primary); border: 1px solid var(--surface); padding: 8px 10px; border-radius: 6px; font: inherit; font-size: 13px;
        }
        .controls button { background: var(--primary); color: #000; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font: inherit; font-size: 13px; }
        .controls button.ghost { background: transparent; color: var(--text-secondary); border: 1px solid var(--surface-elevated); }
        .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

        .chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .chip { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 4px; background: var(--surface-elevated); cursor: pointer; font-size: 12px; color: var(--text-secondary); }
        .chip.on { background: var(--primary); color: #000; }
        .chip input { margin: 0; }
        .ckwrap { display: flex; flex-direction: column; gap: 6px; }
        .seg-label { font-size: 11px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.06em; }

        .pal { display: flex; flex-direction: column; gap: 4px; max-height: 360px; overflow-y: auto; }
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

        @media (max-width: 900px) {
          .grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
