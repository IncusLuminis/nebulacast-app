#!/usr/bin/env python3
"""
Normalize Open-Meteo + 7Timer data into observer_weather_now.json schema.
"""
from __future__ import annotations

import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

_service_root = Path(__file__).resolve().parent.parent
if str(_service_root) not in sys.path:
    sys.path.insert(0, str(_service_root))

from pipelines.fetch_weather import fetch_open_meteo, fetch_7timer_astro, merge_to_hourly


# ── Seeing / transparency label maps ────────────────────────────────────────

def _seeing_label(val: Optional[Any]) -> Optional[str]:
    """Map 7Timer seeing int (1–8) to string label."""
    if val is None:
        return None
    try:
        v = int(val)
    except (TypeError, ValueError):
        return None
    if v <= 2:
        return "poor"
    if v == 3:
        return "average"
    if v == 4:
        return "good"
    return "excellent"


def _transparency_label(val: Optional[Any]) -> Optional[str]:
    """Map 7Timer transparency int (1–4) to string label."""
    if val is None:
        return None
    try:
        v = int(val)
    except (TypeError, ValueError):
        return None
    mapping = {1: "poor", 2: "average", 3: "good", 4: "excellent"}
    return mapping.get(v)


# ── UTC timestamp helpers ────────────────────────────────────────────────────

def _to_utc_z(time_str: str) -> str:
    """Convert a timezone-aware ISO8601 string to UTC with Z suffix."""
    dt = datetime.fromisoformat(time_str)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    utc = dt.astimezone(timezone.utc)
    return utc.strftime("%Y-%m-%dT%H:%M:%SZ")


# ── Derived risk helpers ─────────────────────────────────────────────────────

_RISK_ORDER = {"high": 2, "medium": 1, "low": 0, "unknown": -1}


def _worst_risk(labels: List[str]) -> str:
    if not labels:
        return "unknown"
    return max(labels, key=lambda l: _RISK_ORDER.get(l, -1))


def _dew_risk_for_hour(temp_c: Optional[float], dewpoint_c: Optional[float], humidity: Optional[float]) -> str:
    if temp_c is None or dewpoint_c is None:
        return "unknown"
    spread = temp_c - dewpoint_c
    hum = humidity or 0.0
    if spread < 2.0 and hum > 85.0:
        return "high"
    if spread < 4.0 or hum > 75.0:
        return "medium"
    return "low"


def _wind_risk_for_hour(gust_mps: Optional[float]) -> str:
    if gust_mps is None:
        return "unknown"
    if gust_mps > 8.0:
        return "high"
    if gust_mps > 5.0:
        return "medium"
    return "low"


def _compute_derived(hourly_out: List[Dict], now_utc: datetime) -> Dict:
    """Compute derived risk labels and best cloud window."""
    cutoff_12h = now_utc + timedelta(hours=12)

    dew_next12: List[str] = []
    wind_next12: List[str] = []

    for h in hourly_out:
        ts_str = h.get("timestamp_utc", "")
        try:
            ts = datetime.strptime(ts_str, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
        except ValueError:
            continue
        if now_utc <= ts <= cutoff_12h:
            air = h.get("air") or {}
            dew_next12.append(_dew_risk_for_hour(
                air.get("temperature_c"),
                air.get("dewpoint_c"),
                air.get("humidity_percent"),
            ))
            wind = h.get("wind") or {}
            wind_next12.append(_wind_risk_for_hour(wind.get("gust_mps")))

    # Best 2-hour consecutive cloud window (minimum average total cloud)
    best_start: Optional[str] = None
    best_end: Optional[str] = None
    best_avg = float("inf")

    for i in range(len(hourly_out) - 1):
        a = hourly_out[i].get("cloud") or {}
        b = hourly_out[i + 1].get("cloud") or {}
        ca = a.get("total_percent")
        cb = b.get("total_percent")
        if ca is None or cb is None:
            continue
        avg = (ca + cb) / 2.0
        if avg < best_avg:
            best_avg = avg
            best_start = hourly_out[i].get("timestamp_utc")
            best_end = hourly_out[i + 1].get("timestamp_utc")

    return {
        "dew_risk": {
            "next_12h_max": _worst_risk(dew_next12) if dew_next12 else "unknown",
            "rule": "temp_minus_dewpoint_lt_2c_and_humidity_gt_85",
        },
        "wind_risk": {
            "next_12h_max": _worst_risk(wind_next12) if wind_next12 else "unknown",
            "rule": "gust_mps_gt_threshold",
        },
        "cloud_window": {
            "best_window_start_utc": best_start,
            "best_window_end_utc": best_end,
            "basis": "min_total_cloud_percent_over_2h",
        },
    }


# ── Main normalizer ──────────────────────────────────────────────────────────

def build_observer_weather(
    lat: float,
    lon: float,
    tz: str,
    hours: int = 72,
) -> Dict[str, Any]:
    """
    Fetch Open-Meteo + 7Timer and normalize to observer_weather_now.json schema.
    Fail-soft: missing data becomes null; never raises.
    """
    now_utc = datetime.now(timezone.utc)
    generated_utc = now_utc.strftime("%Y-%m-%dT%H:%M:%SZ")

    try:
        open_meteo_raw = fetch_open_meteo(lat, lon, tz, hours)
    except Exception as e:
        print(f"[observer_weather] ERROR: fetch_open_meteo failed: {e}")
        open_meteo_raw = {}

    try:
        seven_timer_raw = fetch_7timer_astro(lat, lon)
    except Exception as e:
        print(f"[observer_weather] ERROR: fetch_7timer_astro failed: {e}")
        seven_timer_raw = {}

    # merge_to_hourly returns flat records with local-timezone timestamps
    try:
        merged = merge_to_hourly(open_meteo_raw, seven_timer_raw, tz, hours)
    except Exception as e:
        print(f"[observer_weather] ERROR: merge_to_hourly failed: {e}")
        merged = []

    hourly_out: List[Dict] = []
    for rec in merged:
        try:
            timestamp_utc = _to_utc_z(rec["time"])
        except Exception:
            continue

        # seeing / transparency from 7Timer (may be int or None)
        seeing_raw = rec.get("seeing")
        trans_raw = rec.get("transparency")
        astro: Optional[Dict] = None
        if seeing_raw is not None or trans_raw is not None:
            astro = {
                "seeing": _seeing_label(seeing_raw),
                "transparency": _transparency_label(trans_raw),
            }

        temp_c = rec.get("temp_c")
        dewpoint_c = rec.get("dewpoint_c")

        hourly_out.append({
            "timestamp_utc": timestamp_utc,
            "cloud": {
                "total_percent": rec.get("cloud_total"),
                "low_percent": rec.get("cloud_low"),
                "mid_percent": rec.get("cloud_mid"),
                "high_percent": rec.get("cloud_high"),
            },
            "wind": {
                "speed_mps": rec.get("wind_m_s"),
                "gust_mps": rec.get("wind_gust_m_s"),
                "direction_deg": rec.get("wind_dir_deg"),
            },
            "precip": {
                "probability_percent": rec.get("precip_prob"),
                "mm": rec.get("precip_mm"),
            },
            "air": {
                "temperature_c": temp_c,
                "dewpoint_c": dewpoint_c,
                "humidity_percent": rec.get("humidity_pct"),
                "pressure_hpa": rec.get("pressure_hpa"),
                "visibility_m": rec.get("visibility_m"),
            },
            "astro": astro,
        })

    derived = _compute_derived(hourly_out, now_utc)

    return {
        "generated_utc": generated_utc,
        "observer": {
            "lat_deg": lat,
            "lon_deg": lon,
            "tz": tz,
        },
        "hourly": hourly_out,
        "derived": derived,
    }
