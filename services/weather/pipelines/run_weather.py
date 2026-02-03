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
from dataclasses import dataclass
from datetime import datetime, timezone, date, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

from astral import LocationInfo
from astral.sun import sun
from timezonefinder import TimezoneFinder

_service_root = Path(__file__).resolve().parent.parent
if str(_service_root) not in sys.path:
    sys.path.insert(0, str(_service_root))

import yaml
from pipelines.fetch_weather import build_weather_payload


_tf = TimezoneFinder()


@dataclass
class LocationConfig:
    id: str
    name: str
    lat: float
    lon: float
    tz: str
    alt_m: Optional[float]
    source: str


def _format_location_id(lat: float, lon: float) -> str:
    """Deterministic location id based on coordinates."""
    return f"loc_{lat:.4f}_{lon:.4f}"


def _load_locations(configs_dir: Path, default_weather_cfg: Dict[str, Any]) -> tuple[List[LocationConfig], str]:
    """Load locations from configs/locations.yaml, falling back to single weather config."""
    locations_path = configs_dir / "locations.yaml"
    locations: List[LocationConfig] = []
    default_id: Optional[str] = None

    if locations_path.exists():
        with open(locations_path, encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
        raw_locations = data.get("locations") or []
        for loc in raw_locations:
            try:
                name = loc.get("name") or default_weather_cfg.get("location_name", "Unknown")
                lat = float(loc.get("lat"))
                lon = float(loc.get("lon"))
            except Exception:
                continue

            tz = loc.get("tz")
            if not tz:
                try:
                    tz = _tf.timezone_at(lat=lat, lng=lon) or default_weather_cfg.get("timezone", "UTC")
                except Exception:
                    tz = default_weather_cfg.get("timezone", "UTC")

            loc_id = loc.get("id") or _format_location_id(lat, lon)
            alt_m_val = loc.get("alt_m")
            alt_m: Optional[float] = float(alt_m_val) if alt_m_val is not None else None
            source = loc.get("source") or "config"

            locations.append(
                LocationConfig(
                    id=loc_id,
                    name=name,
                    lat=lat,
                    lon=lon,
                    tz=tz,
                    alt_m=alt_m,
                    source=source,
                )
            )

        default_id = data.get("default_id") or (locations[0].id if locations else None)
    else:
        # Fallback: single location from rules.yaml
        name = default_weather_cfg.get("location_name", "Unknown")
        lat = float(default_weather_cfg.get("latitude", 52.23))
        lon = float(default_weather_cfg.get("longitude", 21.01))
        tz = default_weather_cfg.get("timezone", "UTC")
        loc_id = _format_location_id(lat, lon)
        locations.append(
            LocationConfig(
                id=loc_id,
                name=name,
                lat=lat,
                lon=lon,
                tz=tz,
                alt_m=None,
                source="rules.yaml",
            )
        )
        default_id = loc_id

    # Ensure we always have a default_id
    if not default_id and locations:
        default_id = locations[0].id

    return locations, default_id or ""


def _compute_twilight_today(loc: LocationConfig, today: date) -> Dict[str, str]:
    """Compute astronomical twilight start/end in local time using astral.

    Returns ISO strings in the location timezone. We use dawn/dusk with 18deg depression.
    """
    try:
        loc_info = LocationInfo(name=loc.name, region="", timezone=loc.tz, latitude=loc.lat, longitude=loc.lon)
        s = sun(loc_info.observer, date=today, tzinfo=loc.tz, dawn_dusk_depression=18)
        dawn = s.get("dawn")
        dusk = s.get("dusk")
        return {
            "astro_twilight_start": dawn.isoformat() if dawn is not None else None,
            "astro_twilight_end": dusk.isoformat() if dusk is not None else None,
        }
    except Exception:
        # Fallback: no twilight information
        return {
            "astro_twilight_start": None,
            "astro_twilight_end": None,
        }


def _find_now_hour(hours: List[Dict[str, Any]], tz: str) -> Optional[Dict[str, Any]]:
    if not hours:
        return None
    try:
        from zoneinfo import ZoneInfo
    except ImportError:
        ZoneInfo = None  # type: ignore

    if ZoneInfo is None:
        now_local = datetime.now(timezone.utc)
    else:
        try:
            now_local = datetime.now(ZoneInfo(tz))
        except Exception:
            now_local = datetime.now(timezone.utc)

    best = None
    best_delta = None
    for h in hours:
        t_str = h.get("time")
        if not isinstance(t_str, str):
            continue
        try:
            dt = datetime.fromisoformat(t_str)
        except Exception:
            continue
        delta = abs((dt - now_local).total_seconds())
        if best_delta is None or delta < best_delta:
            best = h
            best_delta = delta
    return best


def _compute_trends(hours: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Compute simple trend metrics from hourly array."""
    if not hours:
        return {
            "pressure_trend_6h_hpa": None,
            "cloud_peak_next_24h_pct": None,
            "wind_peak_next_24h_m_s": None,
            "fog_risk": None,
        }

    now = hours[0]
    pressure_trend = now.get("pressure_trend_6h_hpa")

    next24 = hours[:24]
    cloud_peak = None
    wind_peak = None
    for h in next24:
        c = h.get("cloud_total")
        if c is not None:
            try:
                v = float(c)
                if v <= 1.0:
                    v *= 100.0
            except (TypeError, ValueError):
                v = None
            if v is not None and (cloud_peak is None or v > cloud_peak):
                cloud_peak = round(v, 0)
        w = h.get("wind_m_s")
        if w is not None:
            try:
                vw = float(w)
            except (TypeError, ValueError):
                vw = None
            if vw is not None and (wind_peak is None or vw > wind_peak):
                wind_peak = round(vw, 1)

    fog_risk = now.get("fog_risk")

    return {
        "pressure_trend_6h_hpa": pressure_trend,
        "cloud_peak_next_24h_pct": cloud_peak,
        "wind_peak_next_24h_m_s": wind_peak,
        "fog_risk": fog_risk,
    }


def _find_best_tonight_window(hours: List[Dict[str, Any]], twilight: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Find best 2–6h window between astro twilight end/start using balanced score."""
    start_str = twilight.get("astro_twilight_end")
    end_str = twilight.get("astro_twilight_start")
    if not start_str or not end_str:
        return None
    try:
        start_dt = datetime.fromisoformat(start_str)
        end_dt = datetime.fromisoformat(end_str)
    except Exception:
        return None
    if end_dt <= start_dt:
        return None

    # Filter hours inside tonight window
    window_hours: List[Dict[str, Any]] = []
    for h in hours:
        t_str = h.get("time")
        if not isinstance(t_str, str):
            continue
        try:
            dt = datetime.fromisoformat(t_str)
        except Exception:
            continue
        if start_dt <= dt <= end_dt:
            window_hours.append(h)

    n = len(window_hours)
    if n < 2:
        return None

    best_window: Optional[Dict[str, Any]] = None
    best_avg = None
    # windows from 2 to 6 hours (inclusive)
    for length in range(2, 7):
        if length > n:
            break
        for i in range(0, n - length + 1):
            sub = window_hours[i : i + length]
            scores: List[int] = []
            for h in sub:
                s = h.get("score")
                if isinstance(s, (int, float)):
                    scores.append(int(round(float(s))))
            if not scores:
                continue
            avg = sum(scores) / len(scores)
            if best_avg is None or avg > best_avg:
                best_avg = avg
                best_window = {
                    "start": sub[0].get("time"),
                    "end": sub[-1].get("time"),
                    "duration_hours": length,
                    "score_avg": round(avg, 1),
                }
    return best_window


def _build_location_payload(location: LocationConfig, base_payload: Dict[str, Any]) -> Dict[str, Any]:
    """Transform existing daily_weather-style payload into new per-location schema."""
    hours: List[Dict[str, Any]] = list(base_payload.get("hours") or [])
    horizon_hours = int(base_payload.get("horizon_hours") or len(hours) or 0)
    generated_at = base_payload.get("generated_at") or datetime.now(timezone.utc).isoformat()

    # Enrich hours with extra fields (temperature_c + score_profiles)
    for h in hours:
        temp_c = h.get("temp_c")
        if "temperature_c" not in h:
            h["temperature_c"] = temp_c
        # score_profiles: balanced, visual, photography, planetary
        balanced = h.get("score")
        profile_scores = h.get("profile_scores") or {}
        score_profiles = {
            "balanced": balanced,
            "visual": profile_scores.get("visual"),
            "photography": profile_scores.get("broadband") or profile_scores.get("photography"),
            "planetary": profile_scores.get("planetary"),
        }
        h["score_profiles"] = score_profiles

    today_local = datetime.now(timezone.utc).astimezone().date()
    twilight = _compute_twilight_today(location, today_local)
    now_hour = _find_now_hour(hours, location.tz)
    trends = _compute_trends(hours)
    best_tonight = _find_best_tonight_window(hours, twilight)

    loc_payload: Dict[str, Any] = {
        "schema_version": 1,
        "generated_at": generated_at,
        "location": {
            "id": location.id,
            "name": location.name,
            "lat": location.lat,
            "lon": location.lon,
            "tz": location.tz,
            "alt_m": location.alt_m,
            "source": location.source,
        },
        "horizon_hours": horizon_hours,
        "sun": {
            "today": twilight,
        },
        "now": now_hour,
        "trends": trends,
        "best_windows": {"tonight": best_tonight},
        "hours": hours,
    }
    return loc_payload


def _write_multi_location_outputs(
    service_root: Path,
    locations: List[LocationConfig],
    default_id: str,
    base_weather_cfg: Dict[str, Any],
) -> None:
    """Generate static JSON under sites/staging/data/weather/ for all locations."""
    if not locations:
        return

    repo_root = service_root.parent.parent
    staging_data_root = repo_root / "sites" / "staging" / "data" / "weather"
    staging_loc_dir = staging_data_root / "loc"
    staging_loc_dir.mkdir(parents=True, exist_ok=True)

    # Generate per-location payloads
    locations_list: List[Dict[str, Any]] = []
    for loc in locations:
        payload = build_weather_payload(
            lat=loc.lat,
            lon=loc.lon,
            tz=loc.tz,
            location_name=loc.name,
            horizon_hours=int(base_weather_cfg.get("horizon_hours", 72)),
            thresholds=base_weather_cfg.get("thresholds") or {},
        )
        loc_payload = _build_location_payload(loc, payload)

        out_path = staging_loc_dir / f"{loc.id}.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(loc_payload, f, ensure_ascii=False, indent=2)

        locations_list.append(
            {
                "id": loc.id,
                "name": loc.name,
                "lat": loc.lat,
                "lon": loc.lon,
                "tz": loc.tz,
                "alt_m": loc.alt_m,
            }
        )

    # Write locations.json
    locations_index = {
        "default_id": default_id,
        "locations": locations_list,
    }
    with open(staging_data_root / "locations.json", "w", encoding="utf-8") as f:
        json.dump(locations_index, f, ensure_ascii=False, indent=2)


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

    # Legacy single-location payload for existing UI
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

    # New multi-location static outputs for UI widgets (backward compatible)
    locations, default_id = _load_locations(configs, weather_cfg)
    if locations:
        log.info("Generating multi-location outputs for %d locations (default_id=%s)", len(locations), default_id)
        _write_multi_location_outputs(service_root, locations, default_id, weather_cfg)
    else:
        log.info("No locations configured for multi-location outputs")

    return 0


if __name__ == "__main__":
    sys.exit(main())
