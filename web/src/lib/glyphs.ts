// Curated Nerd Font glyph catalog for the Builder's icon picker. Covers the
// glyphs themes most commonly reach for; not exhaustive (Nerd Fonts ship
// ~10k glyphs total). Categorized for easy discovery.

export interface GlyphGroup {
  id: string;
  label: string;
  glyphs: { char: string; name: string }[];
}

export const GLYPH_GROUPS: GlyphGroup[] = [
  {
    id: 'powerline',
    label: 'Powerline',
    glyphs: [
      { char: '', name: 'right-arrow' },
      { char: '', name: 'right-thin' },
      { char: '', name: 'left-arrow' },
      { char: '', name: 'left-thin' },
      { char: '', name: 'branch' },
      { char: '', name: 'lock' },
      { char: '', name: 'ln' },
      { char: '', name: 'col' },
    ],
  },
  {
    id: 'shell',
    label: 'Shell / cwd',
    glyphs: [
      { char: '', name: 'home' },
      { char: '', name: 'folder' },
      { char: '', name: 'folder-open' },
      { char: '', name: 'document' },
      { char: '', name: 'terminal' },
      { char: '', name: 'gear' },
      { char: '', name: 'user' },
      { char: '', name: 'shell' },
    ],
  },
  {
    id: 'git',
    label: 'Git',
    glyphs: [
      { char: '', name: 'git-branch' },
      { char: '', name: 'git-commit' },
      { char: '', name: 'git-merge' },
      { char: '', name: 'git-pull-request' },
      { char: '', name: 'git-compare' },
      { char: '↑',  name: 'ahead' },
      { char: '↓',  name: 'behind' },
      { char: '',  name: 'check' },
      { char: '',  name: 'cross' },
      { char: '',  name: 'plus' },
      { char: '',  name: 'minus' },
    ],
  },
  {
    id: 'os',
    label: 'OS',
    glyphs: [
      { char: '',  name: 'apple' },
      { char: '',  name: 'linux' },
      { char: '',  name: 'windows' },
      { char: '',  name: 'bsd' },
      { char: '',  name: 'arch' },
      { char: '',  name: 'ubuntu' },
      { char: '',  name: 'debian' },
      { char: '',  name: 'fedora' },
      { char: '',  name: 'nixos' },
    ],
  },
  {
    id: 'lang',
    label: 'Language',
    glyphs: [
      { char: '', name: 'javascript' },
      { char: '', name: 'typescript' },
      { char: '', name: 'python' },
      { char: '', name: 'go' },
      { char: '', name: 'rust' },
      { char: '', name: 'ruby' },
      { char: '', name: 'java' },
      { char: '', name: 'php' },
      { char: '', name: 'csharp' },
      { char: '', name: 'elixir' },
      { char: '', name: 'kotlin' },
      { char: '', name: 'swift' },
      { char: '', name: 'haskell' },
      { char: '', name: 'clojure' },
      { char: '', name: 'docker' },
    ],
  },
  {
    id: 'cloud',
    label: 'Cloud / k8s',
    glyphs: [
      { char: '', name: 'aws' },
      { char: '', name: 'gcp' },
      { char: '', name: 'azure' },
      { char: '⎈',  name: 'k8s-helm' },
      { char: '',  name: 'k8s' },
      { char: '',  name: 'terraform' },
    ],
  },
  {
    id: 'weather',
    label: 'Weather',
    glyphs: [
      { char: '', name: 'sunny' },
      { char: '', name: 'partly-cloudy' },
      { char: '', name: 'cloudy' },
      { char: '', name: 'fog' },
      { char: '', name: 'rain' },
      { char: '', name: 'thunderstorm' },
      { char: '', name: 'snow' },
      { char: '', name: 'night-clear' },
      { char: '', name: 'night-partly' },
    ],
  },
  {
    id: 'system',
    label: 'System / time',
    glyphs: [
      { char: '', name: 'clock' },
      { char: '', name: 'calendar' },
      { char: '', name: 'cpu' },
      { char: '', name: 'memory' },
      { char: '', name: 'disk' },
      { char: '', name: 'battery-full' },
      { char: '', name: 'battery-low' },
      { char: '', name: 'volume' },
      { char: '', name: 'mute' },
      { char: '', name: 'wifi' },
      { char: '', name: 'no-wifi' },
      { char: '', name: 'vpn' },
    ],
  },
  {
    id: 'status',
    label: 'Status',
    glyphs: [
      { char: '', name: 'check-circle' },
      { char: '', name: 'cross-circle' },
      { char: '', name: 'warning' },
      { char: '', name: 'info' },
      { char: '',  name: 'lightbulb' },
      { char: '',  name: 'fire' },
      { char: '',  name: 'star' },
      { char: '',  name: 'heart' },
      { char: '',  name: 'shield' },
    ],
  },
  {
    id: 'ai',
    label: 'AI / model',
    glyphs: [
      { char: '', name: 'robot' },
      { char: '', name: 'brain' },
      { char: '◈',  name: 'drachma' },
      { char: '🦾', name: 'arm' },
      { char: '✨', name: 'sparkles' },
      { char: '',  name: 'rocket' },
    ],
  },
];

export const ALL_GLYPHS = GLYPH_GROUPS.flatMap((g) => g.glyphs);
