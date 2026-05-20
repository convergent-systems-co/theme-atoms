#!/usr/bin/env python3
"""Validate all themes/*.toml against schemas/theme-v1.json.

Two passes per theme:
  1. JSON Schema validation against schemas/theme-v1.json.
  2. Internal palette-reference resolution: every {palette.NAME} occurrence
     in [prompt], [roles], [syntax] must resolve to a key in [palette].

Exit 0 on full pass; exit 1 on any failure.
"""
import json
import re
import sys
from pathlib import Path

try:
    import tomllib  # Python 3.11+
except ImportError:
    print("error: tomllib (Python 3.11+) is required", file=sys.stderr)
    sys.exit(2)

try:
    import jsonschema
except ImportError:
    print("error: jsonschema not installed. Run: pip install jsonschema", file=sys.stderr)
    sys.exit(2)


REPO = Path(__file__).resolve().parent.parent
SCHEMA_PATH = REPO / "schemas" / "theme-v1.json"
THEMES_DIR = REPO / "themes"
PALETTE_REF = re.compile(r"^\{palette\.([a-zA-Z0-9_-]+)\}$")


def validate_theme(path: Path, validator: "jsonschema.Validator") -> list[str]:
    errors: list[str] = []
    try:
        data = tomllib.loads(path.read_text(encoding="utf-8"))
    except tomllib.TOMLDecodeError as e:
        return [f"TOML parse error: {e}"]

    for err in validator.iter_errors(data):
        loc = "/".join(str(x) for x in err.absolute_path) or "<root>"
        errors.append(f"schema: {err.message} at {loc}")

    palette = set(data.get("palette", {}).keys())
    for section_name in ("prompt", "roles", "syntax"):
        section = data.get(section_name, {})
        if not isinstance(section, dict):
            continue
        for key, value in section.items():
            if not isinstance(value, str):
                continue
            match = PALETTE_REF.match(value)
            if match and match.group(1) not in palette:
                errors.append(
                    f"palette.{match.group(1)} not defined (referenced from [{section_name}].{key})"
                )
    return errors


def main() -> int:
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    validator = jsonschema.Draft202012Validator(schema)

    theme_files = sorted(THEMES_DIR.glob("*.toml"))
    if not theme_files:
        print(f"no themes found under {THEMES_DIR}", file=sys.stderr)
        return 1

    total_errors = 0
    for path in theme_files:
        errors = validate_theme(path, validator)
        if errors:
            print(f"✗ {path.name}")
            for e in errors:
                print(f"    {e}")
            total_errors += len(errors)
        else:
            print(f"✓ {path.name}")

    if total_errors:
        print(f"\n{total_errors} error(s) across {len(theme_files)} theme(s)")
        return 1
    print(f"\nall {len(theme_files)} theme(s) valid")
    return 0


if __name__ == "__main__":
    sys.exit(main())
