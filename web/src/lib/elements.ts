// Element catalog — single source of truth for the UI. Mirrors the schema's
// elementId enum + the docs/elements.md write-up. Each entry has:
//   - id        — the canonical element ID
//   - category  — for grouping in the Builder UI
//   - icon      — default Nerd Font / unicode glyph (consumer fallback)
//   - sample    — what the TerminalPreview displays for this element
//   - prompt    — true if valid in prompt.segments (most are; layout-only elements set false)
export type ElementCategory =
  | 'shell'
  | 'vcs'
  | 'cmd'
  | 'time-system'
  | 'context'
  | 'cloud'
  | 'lang-version'
  | 'load'
  | 'network'
  | 'aish'
  | 'meta';

export interface ElementSpec {
  id: string;
  category: ElementCategory;
  icon: string;
  sample: string;
  prompt: boolean;
}

export const ELEMENT_CATALOG: ElementSpec[] = [
  // Shell context
  { id: 'cwd',            category: 'shell',        icon: '',  sample: '~/code/aish',     prompt: true },
  { id: 'path',           category: 'shell',        icon: '',  sample: '/Users/itsfwcp/code/aish', prompt: true },
  { id: 'user',           category: 'shell',        icon: '',  sample: 'itsfwcp',          prompt: true },
  { id: 'host',           category: 'shell',        icon: '',  sample: 'kepler',           prompt: true },
  { id: 'hostname-icon',  category: 'shell',        icon: '',  sample: '',                 prompt: true },
  { id: 'venv',           category: 'shell',        icon: '',  sample: '(env)',            prompt: true },
  { id: 'shell-level',    category: 'shell',        icon: '',  sample: 'SHLVL:2',          prompt: true },
  { id: 'os-icon',        category: 'shell',        icon: '',  sample: '',                 prompt: true },

  // Version control
  { id: 'git-status',       category: 'vcs', icon: '', sample: 'main',  prompt: true },
  { id: 'git-ahead-behind', category: 'vcs', icon: '', sample: '↑2↓1',  prompt: true },
  { id: 'git-stash-count',  category: 'vcs', icon: '', sample: '3',     prompt: true },
  { id: 'hg-status',        category: 'vcs', icon: '', sample: 'default', prompt: true },
  { id: 'jj-status',        category: 'vcs', icon: '', sample: 'main@', prompt: true },

  // Command / exit
  { id: 'exit-code',                  category: 'cmd', icon: '✓', sample: '✓ 0',   prompt: true },
  { id: 'duration',                   category: 'cmd', icon: '',  sample: '1.2s',  prompt: true },
  { id: 'cmd-duration-while-running', category: 'cmd', icon: '',  sample: '0:07',  prompt: true },
  { id: 'cmd-status',                 category: 'cmd', icon: '',  sample: 'running', prompt: true },
  { id: 'bg-jobs',                    category: 'cmd', icon: '',  sample: '2 bg',  prompt: true },

  // Time / system
  { id: 'time',            category: 'time-system', icon: '', sample: '14:32',       prompt: true },
  { id: 'date',            category: 'time-system', icon: '', sample: '2026-05-20', prompt: true },
  { id: 'uptime',          category: 'time-system', icon: '', sample: '3d 4h',       prompt: true },
  { id: 'battery',         category: 'time-system', icon: '', sample: '87%',         prompt: true },
  { id: 'volume',          category: 'time-system', icon: '', sample: '64%',         prompt: true },
  { id: 'mute-status',     category: 'time-system', icon: '', sample: 'muted',       prompt: true },
  { id: 'keyboard-layout', category: 'time-system', icon: '', sample: 'US',          prompt: true },
  { id: 'weather',         category: 'time-system', icon: '', sample: '72°F',        prompt: true },

  // Context (sessions / multiplexers / runtime)
  { id: 'session',         category: 'context', icon: '', sample: '#session', prompt: false },
  { id: 'k8s-context',     category: 'context', icon: '⎈',  sample: 'dev',     prompt: true },
  { id: 'docker-context',  category: 'context', icon: '', sample: 'default', prompt: true },
  { id: 'terraform-workspace', category: 'context', icon: '', sample: 'prod', prompt: true },

  // Cloud
  { id: 'aws-profile',         category: 'cloud', icon: '', sample: 'default', prompt: true },
  { id: 'gcp-project',         category: 'cloud', icon: '', sample: 'my-proj', prompt: true },
  { id: 'azure-subscription',  category: 'cloud', icon: '', sample: 'prod-sub', prompt: true },

  // Language versions
  { id: 'node-version',   category: 'lang-version', icon: '', sample: 'v22.4.0', prompt: true },
  { id: 'python-version', category: 'lang-version', icon: '', sample: '3.12.4',  prompt: true },
  { id: 'go-version',     category: 'lang-version', icon: '', sample: '1.23.0',  prompt: true },
  { id: 'rust-version',   category: 'lang-version', icon: '', sample: '1.81.0',  prompt: true },
  { id: 'ruby-version',   category: 'lang-version', icon: '', sample: '3.3.4',   prompt: true },
  { id: 'java-version',   category: 'lang-version', icon: '', sample: '21.0.2',  prompt: true },
  { id: 'nix-shell',      category: 'lang-version', icon: '', sample: 'nix-shell', prompt: true },
  { id: 'direnv-status',  category: 'lang-version', icon: '', sample: 'loaded',  prompt: true },

  // System load
  { id: 'load-avg',  category: 'load', icon: '', sample: '1.2,0.9,0.7', prompt: true },
  { id: 'cpu-usage', category: 'load', icon: '', sample: '34%',         prompt: true },
  { id: 'mem-usage', category: 'load', icon: '', sample: '8.2/16G',     prompt: true },
  { id: 'disk-usage',category: 'load', icon: '', sample: '62%',         prompt: true },

  // Network
  { id: 'network-status', category: 'network', icon: '', sample: 'up', prompt: true },
  { id: 'vpn-status',     category: 'network', icon: '', sample: 'home', prompt: true },

  // aish-specific
  { id: 'ai-tier',         category: 'aish', icon: '', sample: 'AI:local', prompt: true },
  { id: 'ai-suggestion',   category: 'aish', icon: '', sample: 'AI tip',   prompt: false },
  { id: 'drachma-balance', category: 'aish', icon: '◈',  sample: '◈ 42',    prompt: true },
  { id: 'agent-model',     category: 'aish', icon: '', sample: 'opus-4.7', prompt: true },

  // Meta
  { id: 'prompt-newline', category: 'meta', icon: '', sample: '↵', prompt: true },
];

export const CATEGORY_LABEL: Record<ElementCategory, string> = {
  shell: 'Shell',
  vcs: 'Version control',
  cmd: 'Command / exit',
  'time-system': 'Time & system',
  context: 'Context',
  cloud: 'Cloud',
  'lang-version': 'Language versions',
  load: 'System load',
  network: 'Network',
  aish: 'aish-specific',
  meta: 'Meta',
};

export const PROMPT_ALLOWED_IDS = ELEMENT_CATALOG.filter((e) => e.prompt).map((e) => e.id);
export const ALL_ELEMENT_IDS = ELEMENT_CATALOG.map((e) => e.id);
export const ELEMENT_BY_ID: Record<string, ElementSpec> = Object.fromEntries(ELEMENT_CATALOG.map((e) => [e.id, e]));
