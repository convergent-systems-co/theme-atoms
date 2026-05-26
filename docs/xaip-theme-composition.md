# XAIP: Theme Composition Schema

**Atom type:** `theme`
**Version:** 0.1
**Audience:** Theme authors, brand engineers, shell and TUI integrators

---

## 1. Purpose

A theme composition extends a `brand` atom (from the brand-atoms catalog) with surface-specific rendering bindings. The brand provides semantic color and typography decisions; the theme translates those decisions into the exact escape sequences, CSS variables, or platform tokens that a specific rendering surface requires. One brand can generate multiple themes — one per surface — without duplicating semantic intent.

---

## 2. Composition Structure

A theme composition is a JSON document at the path `atoms/<slug>/v<version>/atom.json` within the theme-atoms catalog.

```json
{
  "atom_type": "theme",
  "theme_id": "convergent-systems-co/convergent-dark-shell",
  "version": "1",
  "display_name": "Convergent Dark — Shell",
  "base_brand_ref": "https://brand-atoms.convergent-systems.co/atoms/convergent-brand/v1/atom.json",
  "surface": "shell",
  "role_bindings": [
    {
      "role": "primary",
      "ansi_fg": "[38;2;99;179;237m",
      "ansi_bg": null,
      "css_var": "--color-primary",
      "hex": "#63B3ED",
      "hsl": { "h": 210, "s": 75, "l": 66 }
    },
    {
      "role": "accent",
      "ansi_fg": "[38;2;154;230;180m",
      "ansi_bg": null,
      "css_var": "--color-accent",
      "hex": "#9AE6B4",
      "hsl": { "h": 145, "s": 63, "l": 71 }
    },
    {
      "role": "background",
      "ansi_fg": null,
      "ansi_bg": "[48;2;26;32;44m",
      "css_var": "--color-background",
      "hex": "#1A202C",
      "hsl": { "h": 220, "s": 26, "l": 14 }
    },
    {
      "role": "foreground",
      "ansi_fg": "[38;2;237;242;247m",
      "ansi_bg": null,
      "css_var": "--color-foreground",
      "hex": "#EDF2F7",
      "hsl": { "h": 210, "s": 40, "l": 95 }
    },
    {
      "role": "error",
      "ansi_fg": "[38;2;252;129;74m",
      "ansi_bg": null,
      "css_var": "--color-error",
      "hex": "#FC814A",
      "hsl": { "h": 18, "s": 96, "l": 64 }
    },
    {
      "role": "warning",
      "ansi_fg": "[38;2;246;224;94m",
      "ansi_bg": null,
      "css_var": "--color-warning",
      "hex": "#F6E05E",
      "hsl": { "h": 50, "s": 90, "l": 60 }
    },
    {
      "role": "success",
      "ansi_fg": "[38;2;104;211;145m",
      "ansi_bg": null,
      "css_var": "--color-success",
      "hex": "#68D391",
      "hsl": { "h": 145, "s": 55, "l": 62 }
    },
    {
      "role": "muted",
      "ansi_fg": "[38;2;113;128;150m",
      "ansi_bg": null,
      "css_var": "--color-muted",
      "hex": "#718096",
      "hsl": { "h": 215, "s": 14, "l": 51 }
    }
  ],
  "metadata": {
    "catalog_ref": "theme-atoms.convergent-systems.co"
  }
}
```

### 2.1 Required fields

| Field | Type | Description |
|---|---|---|
| `theme_id` | string | Stable, namespaced identifier |
| `version` | string | Semantic version string |
| `base_brand_ref` | URI | Fully-qualified reference to the brand atom this theme extends |
| `surface` | enum | Rendering target (see §2.2) |
| `role_bindings` | array | Semantic role to rendering value mapping (see §2.3) |

### 2.2 Surface values

| Value | Rendering context |
|---|---|
| `shell` | POSIX shell prompt, terminal multiplexer (tmux, zellij), CLI tool output |
| `editor` | Code editor (Neovim, Helix, VS Code via CSS variables) |
| `tui` | Full-screen TUI application (ratatui, bubbletea, cursive) |
| `web` | Browser-rendered HTML/CSS (uses CSS variables exclusively) |

### 2.3 Role binding fields

| Field | Type | Required | Description |
|---|---|---|---|
| `role` | string | yes | Semantic role name (see §2.4 for the required set) |
| `ansi_fg` | ANSI escape string or null | surface-conditional | Foreground color as 24-bit ANSI escape (`\e[38;2;R;G;Bm`). Required for `shell` and `tui` surfaces. |
| `ansi_bg` | ANSI escape string or null | surface-conditional | Background color as 24-bit ANSI escape (`\e[48;2;R;G;Bm`). |
| `css_var` | string | yes | CSS custom property name. Required for all surfaces; used as the stable identifier. |
| `hex` | string | yes | Hex color value (`#RRGGBB`). Source of truth for conformance checks. |
| `hsl` | object | yes | HSL decomposition. Required for brand-conformance checks (see §3). |

### 2.4 Required semantic roles

Every theme composition MUST provide bindings for this exact set of roles:

`primary`, `accent`, `background`, `foreground`, `error`, `warning`, `success`, `muted`

Additional roles MAY be added. Removing or renaming a required role is a breaking change requiring a version increment.

---

## 3. Brand-Conformance Rules

A theme MUST satisfy brand-conformance rules derived from its `base_brand_ref`. Non-conformant themes fail catalog validation and are rejected at publish time.

### 3.1 Primary hue preservation

The `primary` role binding MUST preserve the brand's primary hue within ±10° HSL.

```
brand.primary.hsl.h = 210 (example)
theme.primary.hsl.h must be in [200, 220]
```

The hue window accounts for perceptual shift between sRGB, P3, and display-specific rendering without compromising brand recognition.

### 3.2 Accent hue preservation

The `accent` role binding MUST preserve the brand's accent hue within ±10° HSL.

### 3.3 Contrast ratios (WCAG AA)

All foreground-on-background role pairs MUST meet WCAG 2.1 AA contrast ratios:

| Pair | Minimum contrast ratio |
|---|---|
| `foreground` on `background` | 4.5:1 (normal text) |
| `primary` on `background` | 3:1 (large text / UI components) |
| `accent` on `background` | 3:1 |
| `error` on `background` | 3:1 |
| `warning` on `background` | 3:1 |
| `success` on `background` | 3:1 |

Contrast is computed using relative luminance from the `hex` values per the WCAG 2.1 definition. The `hsl` decomposition is used for hue checks only.

### 3.4 Conformance check command

```bash
atoms validate theme \
  --theme convergent-systems-co/convergent-dark-shell \
  --version 1
```

Output on success:
```
theme: convergent-systems-co/convergent-dark-shell v1 — PASS
  primary hue: 210° (brand: 210°, delta: 0°) — OK
  accent hue: 145° (brand: 145°, delta: 0°) — OK
  foreground/background contrast: 14.2:1 — OK (req: 4.5:1)
  primary/background contrast: 5.1:1 — OK (req: 3:1)
```

---

## 4. aish Integration

The `aish` shell (v0.2+) uses theme atoms to drive its prompt renderer. The integration is pull-based: aish resolves the theme at startup from an environment variable or config file, fetches the atom from the catalog, and applies the role bindings.

### 4.1 Theme resolution order

```
1. $AISH_THEME environment variable (theme_id:version format)
2. ~/.config/aish/config.toml → [theme] id and version keys
3. Built-in fallback: "aish/default-dark-shell:1"
```

### 4.2 Prompt renderer binding

aish maps its prompt segments to the theme's semantic roles:

| Prompt segment | Theme role |
|---|---|
| Working directory | `primary` |
| Git branch indicator | `accent` |
| Exit code (success) | `success` |
| Exit code (failure) | `error` |
| Background job indicator | `warning` |
| Timestamp / secondary info | `muted` |
| Prompt symbol | `foreground` |

The renderer reads the `ansi_fg` and `ansi_bg` values from the `shell` surface role bindings. If the loaded theme is for a different surface (e.g., `web`), aish falls back to 256-color ANSI approximations derived from the `hex` values and emits a startup warning.

### 4.3 Loading a theme at startup

```bash
# Load a specific theme version
export AISH_THEME="convergent-systems-co/convergent-dark-shell:1"

# aish resolves and caches the atom on first use:
# ~/.cache/aish/themes/convergent-systems-co/convergent-dark-shell/v1/atom.json
```

The cache is invalidated when the version changes. aish does not silently upgrade theme versions; the version is pinned by the `AISH_THEME` value.

---

## 5. Editor Surface Example

For `surface: editor`, ANSI escape sequences are replaced by editor-specific token mappings. The `css_var` field provides the stable bridge:

```json
{
  "surface": "editor",
  "role_bindings": [
    {
      "role": "primary",
      "ansi_fg": null,
      "ansi_bg": null,
      "css_var": "--color-primary",
      "hex": "#63B3ED",
      "hsl": { "h": 210, "s": 75, "l": 66 },
      "nvim_highlight_group": "Function",
      "vscode_token_color": "entity.name.function"
    }
  ]
}
```

Editor surfaces extend the base role binding schema with surface-specific fields. The base fields (`css_var`, `hex`, `hsl`) are always required; surface-specific fields are additive.

---

## 6. Catalog Conventions

| Convention | Value |
|---|---|
| Theme atom path | `atoms/<slug>/v<version>/atom.json` |
| Brand atom path | resolved from brand-atoms catalog via `base_brand_ref` |
| Cache path (aish) | `~/.cache/aish/themes/<theme_id>/v<version>/atom.json` |
| Config path (aish) | `~/.config/aish/config.toml` |

---

## 7. Related Atoms and Docs

- brand-atoms: `brand` atom — semantic color palette and typography decisions
- `theme` atom — surface-specific rendering bindings (this document)
- aish v0.2 prompt renderer — the primary consumer of `shell` surface themes
- WCAG 2.1 §1.4.3 (Contrast Minimum) — the contrast ratio standard enforced in §3.3
