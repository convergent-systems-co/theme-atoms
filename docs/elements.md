# Element catalog

Elements are the named pieces that themes wire into prompt segments and compass bars (`[prompt].segments`, `[layout.north].left`, etc.). The theme says **what** to render and **where**; the consumer (aish, aish-term, …) provides the **data** and the renderer.

This doc enumerates the elements consumers SHOULD support. The schema (`schemas/theme-v1.json`) enforces the enum for `prompt.segments`; bar buckets accept any string ID for forward-compat.

## Static elements (data source: the shell / the OS)

| ID | Default rendering | Source | Notes |
|---|---|---|---|
| `cwd` | `~/code/aish` | shell working dir | Tilde-prefixed home; truncate long paths |
| `git-status` | ` main ±2` | git status porcelain | Branch + dirty indicator |
| `user` | `itsfwcp` | `$USER` | |
| `host` | `kepler` | `hostname` | |
| `venv` | `(env)` | `$VIRTUAL_ENV` basename | Hidden when not in a venv |
| `k8s-context` | `⎈ dev` | `~/.kube/config` current-context | Hidden when no kubeconfig |
| `exit-code` | `✓ 0` or `✗ 1` | last command exit | Color via roles `exit_ok` / `exit_err` |
| `duration` | `1.2s` | last command wall time | Hidden when < 1s |

## Dynamic elements (data source: external; consumer fetches)

Dynamic elements pull from outside the shell. Consumers MUST cache; refresh policy is per-element. Failure mode is hide-the-element, not block-the-prompt.

### `weather`

| | |
|---|---|
| Default rendering | ` 72°F` (Nerd Font) / `72°F sunny` (ASCII) |
| Source | Any weather API. Suggested: [wttr.in](https://wttr.in) (no key needed) or OpenWeatherMap |
| Cache TTL | 15 minutes |
| Failure | Hide the element. Do not block the prompt. |
| Configurability | Location (default: IP-geolocated), units (`C` / `F`, default: locale-derived) |

**Glyph suggestions (Nerd Font powerline-extra block):**
- Sunny: ` ` (0xe30d)
- Cloudy: ` ` (0xe312)
- Rain: ` ` (0xe318)
- Snow: ` ` (0xe31a)
- Storm: ` ` (0xe31d)
- Fog: ` ` (0xe313)

Consumer normalizes the upstream condition into one of these buckets.

### `time`

| | |
|---|---|
| Default rendering | `14:32` |
| Source | system clock |
| Cache TTL | n/a (re-render on prompt) |
| Configurability | Format string (default: `HH:mm` 24h), timezone (default: system) |

### `battery`

| | |
|---|---|
| Default rendering | ` 87%` (Nerd Font) / `bat 87%` (ASCII) |
| Source | OS battery API (macOS `pmset`, Linux `/sys/class/power_supply`, Windows WMI) |
| Cache TTL | 60 seconds |
| Failure | Hide the element on desktops / VMs without batteries |
| Configurability | Show-when-below threshold (default: always show); show charging indicator |

### `ai-tier`

| | |
|---|---|
| Default rendering | `AI:local` or `AI:cloud` or `AI:off` |
| Source | aish's runtime AI configuration |
| Cache TTL | n/a |
| Configurability | aish-specific |

### `drachma-balance`

| | |
|---|---|
| Default rendering | `◈ 42` |
| Source | aish drachma budget (Olympus integration) |
| Cache TTL | n/a |
| Hidden when | drachma is not configured |

### `ai-suggestion`

| | |
|---|---|
| Default rendering | `AI tip` (multiline in east/west bars) |
| Source | aish's AI pipeline |
| Cache TTL | refreshed on user idle |
| Hidden when | AI is off, or no suggestion available |

## Non-data session elements

### `session`

| | |
|---|---|
| Default rendering | `#session-name` |
| Source | aish session label (terminal multiplexer-style) |
| Cache TTL | n/a |

## Adding an element

1. Open a [theme-atoms issue](https://github.com/convergent-systems-co/theme-atoms/issues/new) describing the element, its data source, suggested cache TTL, and a glyph suggestion if applicable.
2. We add it to this doc and to the schema's `prompt.segments` enum (or leave it bar-only if it doesn't make sense as a prompt segment).
3. We coordinate with aish and aish-term to land the renderer.
