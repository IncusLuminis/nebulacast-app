#!/usr/bin/env python3
"""
Entrypoint: run weather pipeline.
- Fetches Open-Meteo + 7Timer, scores hours, writes services/weather/outputs/daily_weather.json.
- Copies daily_weather.json to sites/staging/weather/ for frontend.

  python services/weather/pipelines/run_weather.py
"""
from __future__ import annotations

import json
import logging
import shutil
import sys
from pathlib import Path

_service_root = Path(__file__).resolve().parent.parent
if str(_service_root) not in sys.path:
    sys.path.insert(0, str(_service_root))

import yaml
from pipelines.fetch_weather import build_weather_payload


def main() -> int:
    service_root = Path(__file__).resolve().parent.parent
    configs = service_root / "configs"
    rules_path = configs / "rules.yaml"
    if not rules_path.exists():
        print(f"ERROR: {rules_path} not found")
        return 1

    with open(rules_path, encoding="utf-8") as f:
        config = yaml.safe_load(f)
    weather_cfg = config.get("weather") or {}
    if not weather_cfg.get("enabled", True):
        print("Weather is disabled in config")
        return 0

    location_name = weather_cfg.get("location_name", "Unknown")
    lat = float(weather_cfg.get("latitude", 52.23))
    lon = float(weather_cfg.get("longitude", 21.01))
    tz = weather_cfg.get("timezone", "Europe/Warsaw")
    horizon_hours = int(weather_cfg.get("horizon_hours", 72))
    thresholds = weather_cfg.get("thresholds") or {}

    outputs_dir = service_root / "outputs"
    outputs_dir.mkdir(parents=True, exist_ok=True)
    log_path = outputs_dir / "run_weather.log"
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        handlers=[
            logging.FileHandler(log_path, encoding="utf-8"),
            logging.StreamHandler(sys.stdout),
        ],
    )
    log = logging.getLogger(__name__)
    log.info("Outputs dir: %s | Log: %s", outputs_dir, log_path)

    payload = build_weather_payload(
        lat=lat,
        lon=lon,
        tz=tz,
        location_name=location_name,
        horizon_hours=horizon_hours,
        thresholds=thresholds,
    )

    out_json = outputs_dir / "daily_weather.json"
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    log.info("Wrote %s", out_json)

    repo_root = service_root.parent.parent
    staging_weather = repo_root / "sites" / "staging" / "weather"
    staging_weather.mkdir(parents=True, exist_ok=True)
    dest = staging_weather / "daily_weather.json"
    shutil.copy2(out_json, dest)
    log.info("Copied daily_weather.json -> %s", dest)

    return 0


if __name__ == "__main__":
    sys.exit(main())
