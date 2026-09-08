#!/usr/bin/env python3
"""Attach and validate a common provenance manifest on generated JSON payloads."""
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

REQUIRED = ("schema_version", "input_source", "generated_utc", "location")


def _location(data):
    site = data.get("site") or data.get("observer") or {}
    if isinstance(site, dict):
        if isinstance(site.get("location"), dict):
            site = site["location"]
        return {k: site[k] for k in ("name", "lat", "lon", "tz") if k in site}
    return {}


def manifest_for(data, source):
    generated = data.get("generated_utc") or data.get("generated_at") or datetime.now(timezone.utc).isoformat()
    return {
        "schema_version": "1",
        "input_source": source,
        "generated_utc": generated,
        "location": _location(data),
    }


def update(path, source, write):
    with path.open(encoding="utf-8") as fh:
        data = json.load(fh)
    if not isinstance(data, dict):
        raise ValueError(f"{path}: root must be an object")
    expected = manifest_for(data, source)
    current = data.get("manifest")
    if write:
        data["manifest"] = expected
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    elif (not isinstance(current, dict)
          or any(key not in current or (key != "location" and not current.get(key)) for key in REQUIRED)
          or not isinstance(current.get("location"), dict)):
        raise ValueError(f"{path}: missing or incomplete manifest (required: {', '.join(REQUIRED)})")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True)
    parser.add_argument("--write", action="store_true")
    parser.add_argument("files", nargs="+")
    args = parser.parse_args()
    for name in args.files:
        update(Path(name), args.source, args.write)
        print(f"OK {name}")


if __name__ == "__main__":
    main()
