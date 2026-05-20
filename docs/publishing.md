# Publishing themes (v0.1)

This document covers the wire-format and hosting contract that consumers (aish v0.2, future runtimes) rely on. It is the v0.1 contract — schema version `v1`.

## URL pattern

theme-atoms.com serves directly from this repo's `themes/` and `schemas/` directories:

| URL | Source | Content-Type |
|---|---|---|
| `https://theme-atoms.com/themes/<id>.toml` | `themes/<id>.toml` | `application/toml` (or `text/plain`) |
| `https://theme-atoms.com/themes/index.json` | `themes/index.json` | `application/json` |
| `https://theme-atoms.com/schemas/theme-v1.json` | `schemas/theme-v1.json` | `application/schema+json` |

`<id>` is the URL-safe slug declared in the theme's `[meta]` block and matches `^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$`.

## Single-fetch contract

Each `theme.toml` MUST be self-contained. Consumers (aish v0.2, runtime caches, etc.) perform **one HTTP GET per theme**. No follow-on fetches to brand-atoms, palette services, or other catalogs.

This means:

- The full palette is inlined in the `[palette]` block.
- `[meta].extends_brand` is documentary only — it names the brand this theme draws from, but the palette values MUST be present in the file. Consumers MUST NOT fetch brand-atoms based on this field.
- Color references use `{palette.NAME}` and resolve *only* within the theme's own `[palette]`. No cross-theme or cross-catalog references.

## Discovery

`themes/index.json` is the canonical list. Consumers that want to enumerate available themes fetch the index once and pull individual `.toml` files on demand.

```json
{
  "schema_version": "1",
  "themes": [
    { "id": "default", "version": "1.0.0", "display_name": "Default", "url": "https://theme-atoms.com/themes/default.toml" },
    ...
  ]
}
```

## Hosting

The site is hosted on Cloudflare Pages. Build settings:

- **Build command:** *(none — static files)*
- **Build output directory:** `/` (repo root)
- **Routes:** `themes/*` and `schemas/*` are served as static assets.

A `_headers` file at the repo root (deployed at site root) sets `Content-Type: application/toml; charset=utf-8` for `.toml` paths.

## Adding a new theme

1. Create `themes/<id>.toml` following the schema.
2. Add an entry to `themes/index.json`.
3. Run `python3 scripts/validate.py` — must pass.
4. PR the change. CI runs the same validator.
5. On merge, Cloudflare Pages auto-deploys; the new theme is live at the URL pattern above.

## Version compatibility

The schema URL inside each theme (`schema = "https://theme-atoms.com/schemas/theme-v1.json"`) pins the version. A future `theme-v2.json` will live alongside `theme-v1.json` — old themes keep pointing at v1 indefinitely. Consumers SHOULD reject themes whose `schema` field they don't recognize rather than guess.
