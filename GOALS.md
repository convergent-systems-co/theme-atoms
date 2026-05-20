# theme-atoms — Goals

> Theme primitives for terminal, shell, editor, and TUI experiences — prompt segments, separators, glyph sets, role bindings, syntax schemes. Composable surface designs that extend brands with surface-specific behavior.

*This document is **design proposal** — no ARCHITECTURE.md source; generated based on the *-Atoms catalog pattern and the conversation context that established this catalog. Sections marked **Generated** are pattern-based and are intended as a starting point for revision, not as decided plan.*

---

## What this catalog makes civilization-grade

Themes today are surface-specific blobs: a VS Code theme, an iTerm2 .itermcolors, a starship.toml, a tmux.conf. None of them compose. The same brand expressed across surfaces requires re-authoring per surface. Shell themes especially fragment — starship, oh-my-zsh, p10k, fish prompts each invent their own segment vocabulary.

By cataloging the primitives, `theme-atoms` turns this domain from opaque-and-ephemeral to typed, versioned, composable, machine-readable, and open — the civilization-grade properties the ecosystem requires.

## What it catalogs

### Atom types

- **`prompt-segment`** — Discrete prompt component (cwd, git-status, ai-tier, drachma-balance, exit-code, duration, k8s-context).
- **`separator-style`** — How segments connect visually (powerline arrows, minimal pipe, classic angle, none).
- **`glyph-set`** — Nerd Font glyph mappings for filetypes, git states, prompt characters.
- **`role-binding`** — Map of semantic role → concrete value (`ai_tier_local` → `$palette.green`).
- **`syntax-scheme`** — Token-class color mappings for syntax highlighting (keyword, string, number, comment).

### Compositions: `themes`

A theme composition assembles prompt segments + separator + glyph set + role bindings + syntax scheme into a complete surface design. A theme extends a brand-atoms brand by binding the brand's palette and fonts to surface-specific roles.

### Rule types

- **`brand-conformance`** — A theme MUST extend exactly one brand-atoms brand; its colors and fonts MUST resolve through the brand.
- **`contrast-requirement`** — All role-bindings MUST satisfy WCAG AA contrast against their default background.
- **`glyph-completeness`** — Themes claiming Nerd Font support MUST provide glyphs for the default filetype/git/prompt roles.

## Runtime consumers

- **aish** — v0.2 — Shell theming. aish-term v1.5 — Terminal emulator theming. Atomic theme swap via pre-compiled ANSI escape sequences.
- **olympus** — Future — overlay theming for governance panels and TUI surfaces.

## Status & priority

**Current status:** `new`

**Priority tier:** Tier 5 — New (post-ARCHITECTURE.md), runtime pull TBD

**Trigger / activation condition:** Newly acquired domain (post-ARCHITECTURE.md). Activates when aish v0.2 theming work begins.

## Roadmap *(Generated — milestone shapes mirror aish's roadmap pattern; revise as actual work begins)*

### v0.1 — Bootstrap & spec acceptance

**Goal:** Schema design. Distinction from brand-atoms clarified. 10 seed themes (5 shell, 3 editor, 2 TUI).

**Success criterion:** aish v0.2 consumes theme-atoms compositions for prompt rendering; sub-50ms theme switch maintained.

**Kill criterion:** Boundary with brand-atoms proves too thin — pivot to a `brands/shell/` extension only and archive theme-atoms.

**Work:**

- [ ] XAIP: theme composition schema with brand-conformance rules
- [ ] Define 5 atom type schemas
- [ ] Seed 5 shell themes (nord-powerline, dracula-minimal, gruvbox-classic, monokai-powerline, olympus-default)
- [ ] Distinction-from-brand-atoms design doc (what lives where)
- [ ] aish v0.2 integration

### v0.2 — Adoption & expansion

**Goal:** Editor and TUI theme conventions. Community contribution flow.

**Work:**

- [ ] Editor theme schema (extends shell theme with syntax-scheme)
- [ ] TUI theme schema
- [ ] Contribution template
- [ ] 20 community themes

### v1.0 — Operational

**Goal:** Write once in theme-atoms; render identically across aish, aish-term, editors, and Olympus surfaces. Cross-surface brand consistency without re-authoring.

## Concrete atom example *(Generated — illustrative, not seed content)*

```yaml
themes/nord-powerline/definition.yml
---
id: nord-powerline
type: composition
version: 1.0.0
extends_brand: { ref: brand-atoms://brands/general/nord }
prompt_segments:
  - { ref: atoms/prompt-segment/cwd }
  - { ref: atoms/prompt-segment/git-status }
  - { ref: atoms/prompt-segment/ai-tier }
  - { ref: atoms/prompt-segment/drachma-balance }
separator: { ref: atoms/separator-style/powerline }
glyphs: { ref: atoms/glyph-set/nerd-default }
role_bindings:
  ai_tier_local:  $brand.palette.green
  ai_tier_cloud: $brand.palette.blue
  drachma_low:   $brand.palette.red
  drachma_ok:    $brand.palette.muted
syntax: { ref: atoms/syntax-scheme/nord-shell }
```

## Adoption strategy *(Generated)*

aish v0.2 is the anchor consumer. theme-atoms succeeds if it stays meaningfully distinct from brand-atoms (surface-specific extensions) AND if cross-surface portability proves real once editors/TUIs integrate.

## Civilization-grade property checklist

Every catalog must satisfy these before v1.0. Failing any blocks a release.

| Property | Mechanism in this catalog |
|---|---|
| Typed | JSON Schema in `schemas/` validates every atom, composition, rule |
| Versioned | Every atom has a semver `version` field; compositions reference atoms by version-pinned ID |
| Machine-readable | `exports/catalog.json` published on every release |
| Composable | Compositions reference atoms by ID; CI verifies references resolve and no circular dependencies |
| Open | Apache-2.0 licensed; LICENSE file present |
| Durable | No external dependencies for primary content (no remote image URLs, no vendor APIs in the hot path) |

## Related

- **Spec:** [atoms-spec](https://github.com/convergent-systems-co/atoms-spec) — the canonical structure every catalog conforms to
- **Tools:** [atoms-tools](https://github.com/convergent-systems-co/atoms-tools) — CLI for validate / export / bootstrap / resolve
- **Federation:** [xdao](https://github.com/convergent-systems-co/xdao) — ecosystem directory and discovery
- **Umbrella:** [atoms](https://github.com/convergent-systems-co/atoms) — every catalog as a git submodule
- **Manifest:** [`ATOMS.yml`](./ATOMS.yml) — this catalog's machine-readable manifest
- **Standard:** [`README.md`](./README.md) — catalog overview and contribution flow
