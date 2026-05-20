import type { Theme, HorizontalBar, VerticalBar, ElementStyle } from '../lib/themes';
import { ELEMENT_BY_ID } from '../lib/elements';

export interface TerminalPreviewProps {
  theme: Theme;
  rows?: { kind: 'prompt' | 'output' | 'code'; content?: string }[];
  className?: string;
}

function resolve(value: string | undefined, palette: Record<string, string>): string | undefined {
  if (!value) return undefined;
  const m = value.match(/^\{palette\.([a-zA-Z0-9_-]+)\}$/);
  return m ? (palette[m[1]] ?? '#888') : value;
}

const SEP_CHAR: Record<NonNullable<Theme['prompt']['separator']>, string> = {
  powerline: '',
  classic: '❯',
  minimal: '│',
  none: '',
};

function elementLabel(id: string, override?: ElementStyle): string {
  const spec = ELEMENT_BY_ID[id];
  const icon = override?.icon !== undefined ? override.icon : (spec?.icon ?? '');
  const sample = spec?.sample ?? id;
  return icon ? `${icon} ${sample}`.trim() : sample;
}

export default function TerminalPreview({ theme, rows, className }: TerminalPreviewProps) {
  const palette = theme.palette;
  const promptChar = theme.prompt.character;
  const promptColor = resolve(theme.prompt.character_color, palette) ?? '#fff';
  const separator = theme.prompt.separator ?? 'none';
  const segments = theme.prompt.segments ?? [];
  const useGlyphs = (theme.prompt.glyphs ?? 'ascii') === 'nerd-default';
  const bg = palette.bg ?? '#0b1020';
  const fg = palette.fg ?? '#d8dee9';
  const muted = palette.muted ?? palette.nord3 ?? '#7d8699';
  const sepChar = SEP_CHAR[separator];
  const fontFamily = theme.font?.family
    ? `'${theme.font.family}', ${(theme.font.fallback ?? []).map((f) => `'${f}'`).join(', ')}, ui-monospace, monospace`
    : 'ui-monospace, monospace';

  const accentKeys = ['blue', 'green', 'red', 'yellow', 'cyan', 'purple', 'pink', 'orange'].filter((k) => palette[k]);
  const accentFor = (i: number) => palette[accentKeys[i % accentKeys.length]] ?? muted;

  const stripGlyphs = (s: string): string => s.replace(/[-\u{f0000}-\u{ffffd}]/gu, '').trim();

  const renderPromptLine = (input?: string) => {
    if (separator === 'powerline' && segments.length > 0) {
      return (
        <div className="line">
          {segments.map((seg, i) => {
            const segBg = accentFor(i);
            const next = i < segments.length - 1 ? accentFor(i + 1) : null;
            const raw = elementLabel(seg);
            const label = useGlyphs ? raw : (stripGlyphs(raw) || seg);
            return (
              <span key={i} className="seg" style={{ background: segBg, color: '#000' }}>
                <span style={{ padding: '0 8px' }}>{label}</span>
                {next != null && <span style={{ color: next, background: segBg }}>{sepChar}</span>}
                {next == null && <span style={{ color: segBg, background: 'transparent' }}>{sepChar}</span>}
              </span>
            );
          })}
          <span style={{ color: promptColor, marginLeft: 8 }}>{promptChar}</span>
          {input != null && <span style={{ color: fg, marginLeft: 8 }}>{input}</span>}
        </div>
      );
    }
    return (
      <div className="line">
        {segments.length > 0 && (
          <span style={{ color: muted, marginRight: 8 }}>
            {segments.map((s) => elementLabel(s)).join(separator === 'minimal' ? ' │ ' : ' ')}
          </span>
        )}
        <span style={{ color: promptColor, marginRight: 8 }}>{promptChar}</span>
        {input != null && <span style={{ color: fg }}>{input}</span>}
      </div>
    );
  };

  const renderOutput = (text: string) => (
    <div className="line" style={{ color: muted, paddingLeft: 16 }}>{text}</div>
  );

  const renderCode = (text: string) => {
    const syntax = theme.syntax ?? {};
    const tokens = text.split(/(\s+|[(){}\[\];,.])/);
    return (
      <div className="line">
        {tokens.map((tok, i) => {
          let color: string | undefined;
          if (/^(const|let|var|function|return|if|else|for|while|import|export)$/.test(tok)) color = resolve(syntax.keyword, palette);
          else if (/^["'`].*["'`]$/.test(tok)) color = resolve(syntax.string, palette);
          else if (/^\d+$/.test(tok)) color = resolve(syntax.number, palette);
          else if (/^\/\/.*/.test(tok)) color = resolve(syntax.comment, palette);
          return <span key={i} style={color ? { color } : undefined}>{tok}</span>;
        })}
      </div>
    );
  };

  const defaultRows: NonNullable<TerminalPreviewProps['rows']> = [
    { kind: 'prompt', content: 'git status' },
    { kind: 'output', content: 'On branch main' },
    { kind: 'prompt', content: 'aish theme list' },
    { kind: 'output', content: `* ${theme.meta.id}` },
    { kind: 'prompt' },
  ];
  const renderedRows = rows ?? defaultRows;

  // Compass bars
  const layout = theme.layout ?? {};
  const renderElement = (e: string, elements?: Record<string, ElementStyle>) => {
    const override = elements?.[e];
    const color = resolve(override?.color, palette);
    return <span key={e} className="elem" style={color ? { color } : undefined}>{elementLabel(e, override)}</span>;
  };
  const renderHBar = (bar: HorizontalBar | undefined) => {
    if (!bar?.enabled) return null;
    const bg = resolve(bar.background, palette) ?? 'rgba(255,255,255,0.06)';
    const fg = resolve(bar.foreground, palette) ?? muted;
    return (
      <div className="hbar" style={{ background: bg, color: fg }}>
        <div className="hbar-l">{(bar.left ?? []).map((e) => renderElement(e, bar.elements))}</div>
        <div className="hbar-c">{(bar.center ?? []).map((e) => renderElement(e, bar.elements))}</div>
        <div className="hbar-r">{(bar.right ?? []).map((e) => renderElement(e, bar.elements))}</div>
      </div>
    );
  };

  const renderVBar = (bar: VerticalBar | undefined) => {
    if (!bar?.enabled) return null;
    const bg = resolve(bar.background, palette) ?? 'rgba(255,255,255,0.06)';
    const fg = resolve(bar.foreground, palette) ?? muted;
    const width = bar.width ?? 16;
    const renderV = (e: string) => {
      const override = bar.elements?.[e];
      const color = resolve(override?.color, palette);
      return <div key={e} className="velem" style={color ? { color } : undefined}>{elementLabel(e, override)}</div>;
    };
    return (
      <div className="vbar" style={{ background: bg, color: fg, width: `${width * 0.6}em` }}>
        <div className="vbar-t">{(bar.top ?? []).map(renderV)}</div>
        <div className="vbar-c">{(bar.center ?? []).map(renderV)}</div>
        <div className="vbar-b">{(bar.bottom ?? []).map(renderV)}</div>
      </div>
    );
  };

  return (
    <div className={`term ${className ?? ''}`} style={{ background: bg, color: fg, fontFamily }} aria-label={`Preview of ${theme.meta.display_name}`}>
      <div className="termbar" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <span className="bullet" style={{ background: '#ff5f56' }} />
        <span className="bullet" style={{ background: '#ffbd2e' }} />
        <span className="bullet" style={{ background: '#27c93f' }} />
        <span className="termtitle" style={{ color: muted }}>{theme.meta.display_name}</span>
      </div>
      {renderHBar(layout.north)}
      <div className="termmain">
        {renderVBar(layout.west)}
        <div className="termbody">
          {renderedRows.map((row, i) => {
            if (row.kind === 'prompt') return <div key={i}>{renderPromptLine(row.content)}</div>;
            if (row.kind === 'output') return <div key={i}>{renderOutput(row.content ?? '')}</div>;
            return <div key={i}>{renderCode(row.content ?? '')}</div>;
          })}
        </div>
        {renderVBar(layout.east)}
      </div>
      {renderHBar(layout.south)}
      <style>{`
        .term { border-radius: 10px; overflow: hidden; font-size: 13px; line-height: 1.7; box-shadow: 0 4px 30px rgba(0,0,0,0.25); }
        .termbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; }
        .bullet { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
        .termtitle { margin-left: 8px; font-size: 12px; }
        .termmain { display: flex; }
        .termbody { padding: 12px 16px; min-height: 140px; flex: 1; min-width: 0; }
        .line { white-space: pre; }
        .seg { display: inline-flex; align-items: center; }

        .hbar { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 4px 12px; font-size: 12px; gap: 12px; }
        .hbar-l { text-align: left; }
        .hbar-c { text-align: center; }
        .hbar-r { text-align: right; }
        .elem { display: inline-block; padding: 0 8px; }

        .vbar { display: flex; flex-direction: column; padding: 8px 0; font-size: 11px; border-right: 1px solid rgba(255,255,255,0.06); }
        .vbar:last-child { border-right: none; border-left: 1px solid rgba(255,255,255,0.06); }
        .vbar-t { flex: 0 0 auto; }
        .vbar-c { flex: 1; display: flex; flex-direction: column; justify-content: center; }
        .vbar-b { flex: 0 0 auto; }
        .velem { padding: 2px 10px; }
      `}</style>
    </div>
  );
}
