import type { Theme } from '../lib/themes';

export interface TerminalPreviewProps {
  theme: Theme;
  rows?: { kind: 'prompt' | 'output' | 'code'; content?: string }[];
  className?: string;
}

function resolve(value: string, palette: Record<string, string>): string {
  const m = value.match(/^\{palette\.([a-zA-Z0-9_-]+)\}$/);
  return m ? (palette[m[1]] ?? '#888') : value;
}

const SEP_CHAR: Record<NonNullable<Theme['prompt']['separator']>, string> = {
  powerline: '',
  classic: '❯',
  minimal: '│',
  none: '',
};

const SEGMENT_LABEL: Record<string, string> = {
  cwd: '~/code/aish',
  'git-status': ' main',
  'ai-tier': 'AI:local',
  'drachma-balance': '◈ 42',
  'exit-code': '✓',
  duration: '1.2s',
  'k8s-context': '⎈ dev',
  user: 'itsfwcp',
  host: 'host',
  venv: '(env)',
};

export default function TerminalPreview({ theme, rows, className }: TerminalPreviewProps) {
  const palette = theme.palette;
  const promptChar = theme.prompt.character;
  const promptColor = resolve(theme.prompt.character_color, palette);
  const separator = theme.prompt.separator ?? 'none';
  const segments = theme.prompt.segments ?? [];
  const useGlyphs = (theme.prompt.glyphs ?? 'ascii') === 'nerd-default';
  const bg = palette.bg ?? '#0b1020';
  const fg = palette.fg ?? '#d8dee9';
  const muted = palette.muted ?? palette.nord3 ?? '#7d8699';
  const sepChar = SEP_CHAR[separator];

  // Cycle through palette accent keys for segment backgrounds in powerline mode.
  const accentKeys = ['blue', 'green', 'red', 'yellow', 'cyan', 'purple', 'pink', 'orange'].filter((k) => palette[k]);
  const accentFor = (i: number) => palette[accentKeys[i % accentKeys.length]] ?? muted;

  const renderPromptLine = (input?: string) => {
    if (separator === 'powerline' && segments.length > 0) {
      return (
        <div className="line">
          {segments.map((seg, i) => {
            const bg = accentFor(i);
            const next = i < segments.length - 1 ? accentFor(i + 1) : null;
            const label = useGlyphs ? SEGMENT_LABEL[seg] : SEGMENT_LABEL[seg]?.replace(/[-☀-➿◈✓]/g, '').trim() || seg;
            return (
              <span key={i} className="seg" style={{ background: bg, color: '#000' }}>
                <span style={{ padding: '0 8px' }}>{label}</span>
                {next != null && <span style={{ color: next, background: bg }}>{sepChar}</span>}
                {next == null && <span style={{ color: bg, background: 'transparent' }}>{sepChar}</span>}
              </span>
            );
          })}
          <span style={{ color: promptColor, marginLeft: 8 }}>{promptChar}</span>
          {input != null && <span style={{ color: fg, marginLeft: 8 }}>{input}</span>}
        </div>
      );
    }
    // minimal / classic / none — single-line prompt with optional inline segments
    return (
      <div className="line">
        {segments.length > 0 && (
          <span style={{ color: muted, marginRight: 8 }}>
            {segments.map((s) => SEGMENT_LABEL[s] ?? s).join(separator === 'minimal' ? ' │ ' : ' ')}
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
          if (/^(const|let|var|function|return|if|else|for|while|import|export)$/.test(tok)) {
            color = syntax.keyword ? resolve(syntax.keyword, palette) : undefined;
          } else if (/^["'`].*["'`]$/.test(tok)) {
            color = syntax.string ? resolve(syntax.string, palette) : undefined;
          } else if (/^\d+$/.test(tok)) {
            color = syntax.number ? resolve(syntax.number, palette) : undefined;
          } else if (/^\/\/.*/.test(tok)) {
            color = syntax.comment ? resolve(syntax.comment, palette) : undefined;
          }
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

  return (
    <div className={`term ${className ?? ''}`} style={{ background: bg, color: fg }} aria-label={`Preview of ${theme.meta.display_name}`}>
      <div className="termbar" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <span className="bullet" style={{ background: '#ff5f56' }} />
        <span className="bullet" style={{ background: '#ffbd2e' }} />
        <span className="bullet" style={{ background: '#27c93f' }} />
        <span className="termtitle" style={{ color: muted }}>{theme.meta.display_name}</span>
      </div>
      <div className="termbody">
        {renderedRows.map((row, i) => {
          if (row.kind === 'prompt') return <div key={i}>{renderPromptLine(row.content)}</div>;
          if (row.kind === 'output') return <div key={i}>{renderOutput(row.content ?? '')}</div>;
          return <div key={i}>{renderCode(row.content ?? '')}</div>;
        })}
      </div>
      <style>{`
        .term { border-radius: 10px; overflow: hidden; font-family: var(--font-mono, ui-monospace, monospace); font-size: 13px; line-height: 1.7; box-shadow: 0 4px 30px rgba(0,0,0,0.25); }
        .termbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; }
        .bullet { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
        .termtitle { margin-left: 8px; font-size: 12px; }
        .termbody { padding: 12px 16px; min-height: 140px; }
        .line { white-space: pre; }
        .seg { display: inline-flex; align-items: center; }
      `}</style>
    </div>
  );
}
