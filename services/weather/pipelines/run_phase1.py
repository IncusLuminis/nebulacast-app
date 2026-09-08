#!/usr/bin/env python3
"""
Phase 1 pipeline: generate observer_weather_now.json and space_weather_now.json.
Uses default/first location from configs/locations.yaml (or configs/rules.yaml).

  PYTHONPATH=services/weather python services/weather/pipelines/run_phase1.py
"""
from __future__ import annotations

import json
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml

_service_root = Path(__file__).resolve().parent.parent
_repo_root = _service_root.parent.parent
if str(_service_root) not in sys.path:
    sys.path.insert(0, str(_service_root))

from providers.noaa_swpc import fetch_noaa_swpc
from normalizers.observer_weather import build_observer_weather
from normalizers.space_weather import build_space_weather


# ── Location loading (mirrors run_weather.py pattern) ───────────────────────

@dataclass
class _Loc:
    name: str
    lat: float
    lon: float
    tz: str


def _load_default_location() -> _Loc:
    """Load first/default location from configs/locations.yaml or rules.yaml fallback."""
    configs_dir = _service_root / "configs"
    locations_path = configs_dir / "locations.yaml"

    if locations_path.exists():
        with open(locations_path, encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
        raw_locs = data.get("locations") or []
        default_id = data.get("default_id")

        if default_id:
            for loc in raw_locs:
                if loc.get("id") == default_id:
                    return _Loc(
                        name=loc.get("name", "Unknown"),
                        lat=float(loc["lat"]),
                        lon=float(loc["lon"]),
                        tz=loc.get("tz", "UTC"),
                    )

        if raw_locs:
            loc = raw_locs[0]
            return _Loc(
                name=loc.get("name", "Unknown"),
                lat=float(loc["lat"]),
                lon=float(loc["lon"]),
                tz=loc.get("tz", "UTC"),
            )

    # Fallback: rules.yaml
    rules_path = configs_dir / "rules.yaml"
    if rules_path.exists():
        with open(rules_path, encoding="utf-8") as f:
            cfg = yaml.safe_load(f) or {}
        weather_cfg = cfg.get("weather") or {}
        return _Loc(
            name=weather_cfg.get("location_name", "Unknown"),
            lat=float(weather_cfg.get("latitude", 52.2297)),
            lon=float(weather_cfg.get("longitude", 21.0122)),
            tz=weather_cfg.get("timezone", "UTC"),
        )

    # Last resort defaults
    return _Loc(name="Warsaw", lat=52.2297, lon=21.0122, tz="Europe/Warsaw")


# ── Atomic JSON write ────────────────────────────────────────────────────────

def _write_json_atomic(path: Path, data: Dict[str, Any]) -> None:
    """Write JSON to a temp file then rename atomically."""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    tmp.rename(path)
    print(f"[phase1] Written: {path}")


def _has_data(result: Dict[str, Any], key: str) -> bool:
    """Return True if result has non-empty data for the given key."""
    val = result.get(key)
    if isinstance(val, list):
        return len(val) > 0
    return val is not None


# ── Main ─────────────────────────────────────────────────────────────────────

def main() -> int:
    print(f"[phase1] Starting Phase 1 pipeline at {datetime.now(timezone.utc).isoformat()}")

    loc = _load_default_location()
    print(f"[phase1] Location: {loc.name} ({loc.lat}, {loc.lon}) tz={loc.tz}")

    data_dir = _repo_root / "sites" / "staging" / "data"

    # ── Observer weather ──────────────────────────────────────────────────
    observer_path = data_dir / "observer_weather_now.json"
    print("[phase1] Building observer_weather_now.json ...")
    observer_result = build_observer_weather(lat=loc.lat, lon=loc.lon, tz=loc.tz)

    if _has_data(observer_result, "hourly"):
        _write_json_atomic(observer_path, observer_result)
    elif observer_path.exists():
        print(f"[phase1] WARNING: observer_weather empty result — preserving last good file at {observer_path}")
    else:
        # Write anyway so downstream doesn't get a 404 (empty hourly is still valid JSON)
        _write_json_atomic(observer_path, observer_result)

    # ── Space weather ─────────────────────────────────────────────────────
    space_path = data_dir / "space_weather_now.json"
    print("[phase1] Building space_weather_now.json ...")
    swpc_raw = fetch_noaa_swpc()
    space_result = build_space_weather(swpc_raw)

    if space_result.get("kp", {}).get("latest") is not None or space_result.get("solar_wind") is not None:
        _write_json_atomic(space_path, space_result)
    elif space_path.exists():
        print(f"[phase1] WARNING: space_weather empty result — preserving last good file at {space_path}")
    else:
        _write_json_atomic(space_path, space_result)

    print("[phase1] Phase 1 pipeline complete.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
