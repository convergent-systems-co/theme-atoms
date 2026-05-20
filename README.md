# theme-atoms

> Theme primitives for terminal, shell, editor, and TUI experiences — prompt segments, separators, glyph sets, role bindings, syntax schemes. Composable surface designs that extend brands with surface-specific behavior.

`theme-atoms` is a `*-Atoms` catalog in the [Convergent Systems](https://xdao.co) ecosystem. It defines what exists in its domain — typed, versioned, machine-readable, composable, and open — so runtimes (and humans) can stand on shared infrastructure instead of reinventing it.

## Structure

```
theme-atoms/
├── ATOMS.yml              # Catalog manifest
├── atoms/                 # Reusable building blocks
├── themes/            # Compositions assembled from atoms
├── rules/                 # Typed constraint vocabulary
├── schemas/               # Catalog-specific JSON Schemas
├── exports/               # CI-generated machine-readable exports
└── docs/                  # Human-readable documentation
```

### Atom types

- `prompt-segment`
- `separator-style`
- `glyph-set`
- `role-binding`
- `syntax-scheme`

### Rule types

- `brand-conformance`
- `contrast-requirement`
- `glyph-completeness`

### Runtime consumers

`aish`, `olympus`

## How to consume

### v0.1 — self-contained TOML themes (current)

Themes are served as standalone TOML files at predictable URLs. Consumers (aish v0.2, future runtimes) perform a **single HTTP GET per theme** — no follow-on fetches.

| URL | Content |
|---|---|
| `https://theme-atoms.com/themes/index.json` | Discoverable list of themes |
| `https://theme-atoms.com/themes/<id>.toml` | Individual theme |
| `https://theme-atoms.com/schemas/theme-v1.json` | JSON Schema for theme TOML |

See [`docs/publishing.md`](./docs/publishing.md) for the full contract and [`schemas/theme-v1.json`](./schemas/theme-v1.json) for the wire format. Seed themes live under [`themes/`](./themes/).

Validate locally: `python3 scripts/validate.py` (requires Python 3.11+ and `jsonschema`).

### Future — full atom-based exports

The atom types listed above feed a future composition pipeline producing `exports/manifest.json` + `exports/catalog.json`. v0.1 ships only the consumer-facing TOML contract; the full atom model lands in a later milestone.

## How to contribute

1. Read [`ATOMS.yml`](./ATOMS.yml) to understand the catalog's atom types, compositions, and rules.
2. Add a new atom under `atoms/<type>/` or a composition under `themes/<name>/`.
3. Open a PR. CI validates the schema, references, and exports.
4. Larger structural changes go through the [XAIP process](https://github.com/convergent-systems-co/xaips).

## Ecosystem

- **Federation:** [xdao.co](https://xdao.co) · [github.com/convergent-systems-co/xdao](https://github.com/convergent-systems-co/xdao)
- **Spec:** [github.com/convergent-systems-co/atoms-spec](https://github.com/convergent-systems-co/atoms-spec)
- **Tools:** [github.com/convergent-systems-co/atoms-tools](https://github.com/convergent-systems-co/atoms-tools)
- **Umbrella:** [github.com/convergent-systems-co/atoms](https://github.com/convergent-systems-co/atoms) — all catalogs as submodules
- **Other catalogs:** brand-atoms, service-atoms, prompt-atoms, policy-atoms, identity-atoms, compliance-atoms, workflow-atoms, agent-atoms, knowledge-atoms, event-atoms, plugin-atoms

## License

Apache-2.0 — see [`LICENSE`](./LICENSE).
