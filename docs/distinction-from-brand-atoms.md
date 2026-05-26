# theme-atoms vs. brand-atoms — Where Things Live

## The core distinction

**brand-atoms** defines brand *identity*: who you are.

**theme-atoms** defines surface *application*: how that identity renders on a specific surface.

| Concern | brand-atoms | theme-atoms |
|---|---|---|
| Color palette (named values) | yes | no — inlined from brand |
| Typography (typeface families) | yes | no — inlined from brand |
| Logo, wordmark, glyphs | yes | no |
| Brand voice / tone | yes | no |
| Prompt character & separators | no | yes |
| ANSI escape sequences | no | yes |
| Prompt segment ordering | no | yes |
| Role bindings (ai_tier, exit_ok…) | no | yes |
| Syntax token colors | no | yes |
| Compass bar layout (north/south/east/west) | no | yes |
| Font assertion for a specific surface | no | yes |

## The dependency direction

```
brand-atoms/brands/shell/nord
       │  (provides: palette, font families)
       ▼
theme-atoms/themes/nord-powerline.toml
       │  (adds: prompt segments, separator, roles, syntax, bars)
       ▼
aish v0.2 — runtime consumer
```

A theme CONSUMES brand primitives. It does not modify or re-export them. The palette and font family in a theme file are **inlined copies** — not live references — so the theme is self-contained and requires a single HTTP GET to render. The `extends_brand` field is documentary: it tells a reader and future tooling which brand the values originated from, but aish does not fetch it at runtime.

## The decision rule

When you are deciding where a new asset belongs, ask:

> "Is this about the brand's identity (what it *is*), or how the brand renders on this surface (what it *looks like* in a terminal)?"

- **Identity** — goes in brand-atoms.
- **Surface rendering** — goes in theme-atoms.

### Examples

| Asset | Goes in |
|---|---|
| Nord's `#2e3440` (Polar Night base) | brand-atoms |
| `[roles] ai_tier_local = "{palette.green}"` | theme-atoms |
| JetBrains Mono font family name | brand-atoms |
| `nerd_font = true` assertion for the shell surface | theme-atoms |
| The Powerline separator glyph `` | theme-atoms (`atoms/separator-style/powerline.json`) |
| The Olympus wordmark SVG | brand-atoms |
| `[layout.north]` bar configuration | theme-atoms |

## Atom types vs. compositions

Within theme-atoms, there is a further distinction:

- **Atoms** (`atoms/`) — discrete, reusable primitives: a separator character, a glyph mapping, a role binding set. Independently versioned. Can be shared across themes.
- **Compositions** (`themes/`) — assembled themes that pull a full surface design together: palette + font + prompt config + role bindings + syntax + bar layout. What aish fetches.

An atom describes one primitive. A theme composition assembles many primitives into a complete, deployable surface configuration.

## What does NOT belong in theme-atoms

- Brand color definitions (the hex values themselves belong in brand-atoms, not in atom files)
- Non-surface assets (logos, icons, marketing copy)
- Application logic (aish's rendering code)
- User configuration overrides (those live in aish's local config, not in any atom)
