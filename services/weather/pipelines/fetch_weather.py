#!/usr/bin/env python3
"""
Fetch weather data from Open-Meteo and 7Timer.
Uses additive (bonus) scoring engine (v2) when profiles are available; falls back to legacy penalties otherwise.
"""

from __future__ import annotations

import json
import sys
import urllib.request
import urllib.parse
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
from zoneinfo import ZoneInfo

_service_root = Path(__file__).resolve().parent.parent
if str(_service_root) not in sys.path:
    sys.path.insert(0, str(_service_root))

try:
    from engine.score_engine import (
        load_profile,
        compute_score,
        compute_derived_for_hour,
        build_heads_up,
    )
    _SCORE_ENGINE_AVAILABLE = True
except ImportError as e:
    _SCORE_ENGINE_AVAILABLE = False
    load_profile = compute_score = compute_derived_for_hour = build_heads_up = None  # type: ignore


def fetch_open_meteo(lat: float, lon: float, tz: str, hours: int = 72) -> Dict[str, Any]:
    """Fetch weather data from Open-Meteo API."""
    url = "https://api.open-meteo.com/v1/forecast"

    hourly_fields = [
        "cloudcover", "cloudcover_low", "cloudcover_mid", "cloudcover_high",
        "precipitation", "precipitation_probability", "precipitation_type",
        "rain", "showers", "snowfall",
        "pressure_msl",
        "windspeed_10m", "windgusts_10m", "winddirection_10m",
        "visibility",
        "temperature_2m", "apparent_temperature",
        "relativehumidity_2m", "dewpoint_2m",
        "cape",
    ]

    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": ",".join(hourly_fields),
        "timezone": tz,
        "forecast_days": max(1, (hours + 23) // 24),
        "windspeed_unit": "ms",
        "precipitation_unit": "mm",
        "pressure_unit": "hPa",
        "temperature_unit": "celsius",
        "current_weather": "true",
        "daily": "sunrise,sunset",
    }

    query = urllib.parse.urlencode(params)
    full_url = f"{url}?{query}"

    try:
        with urllib.request.urlopen(full_url, timeout=20) as response:
            data = json.loads(response.read().decode("utf-8"))
            om_hourly = data.get("hourly") or {}
            keys = list(om_hourly.keys())
            n = len(om_hourly.get("time") or [])
            print(f"[weather] Open-Meteo hourly keys: {keys}, time length={n}")
            return data
    except Exception as e:
        print(f"ERROR: Open-Meteo fetch failed: {e}")
        return {}


def fetch_7timer_astro(lat: float, lon: float) -> Dict[str, Any]:
    """Fetch astro conditions from 7Timer API."""
    lat_int = int(round(lat))
    lon_int = int(round(lon))
    url = f"http://www.7timer.info/bin/api.pl?lon={lon_int}&lat={lat_int}&product=astro&output=json"
    try:
        with urllib.request.urlopen(url, timeout=20) as response:
            data = json.loads(response.read().decode("utf-8"))
            return data
    except Exception as e:
        print(f"ERROR: 7Timer fetch failed: {e}")
        return {}


def _at(arr: List[Any], i: int) -> Optional[float]:
    if arr is None or i < 0 or i >= len(arr):
        return None
    try:
        v = arr[i]
        return float(v) if v is not None else None
    except (TypeError, ValueError):
        return None


def _at_int(arr: List[Any], i: int) -> Optional[int]:
    if arr is None or i < 0 or i >= len(arr):
        return None
    try:
        v = arr[i]
        return int(v) if v is not None else None
    except (TypeError, ValueError):
        return None


def merge_to_hourly(
    open_meteo: Dict[str, Any],
    seven_timer: Dict[str, Any],
    tz: str,
    horizon_hours: int = 72
) -> List[Dict[str, Any]]:
    """Merge Open-Meteo and 7Timer data into hourly records."""
    hourly = []

    om_hourly = open_meteo.get("hourly", {}) or {}
    om_times = om_hourly.get("time", []) or []
    om_cloud_total = om_hourly.get("cloudcover", []) or []
    om_cloud_low = om_hourly.get("cloudcover_low", []) or []
    om_cloud_mid = om_hourly.get("cloudcover_mid", []) or []
    om_cloud_high = om_hourly.get("cloudcover_high", []) or []
    om_precip = om_hourly.get("precipitation", []) or []
    om_precip_prob = om_hourly.get("precipitation_probability", []) or []
    om_precip_type = om_hourly.get("precipitation_type", []) or []
    om_rain = om_hourly.get("rain", []) or []
    om_snowfall = om_hourly.get("snowfall", []) or []
    om_pressure = om_hourly.get("pressure_msl", []) or []
    om_wind = om_hourly.get("windspeed_10m", []) or []
    om_wind_gust = om_hourly.get("windgusts_10m", []) or []
    om_wind_dir = om_hourly.get("winddirection_10m", []) or []
    om_visibility = om_hourly.get("visibility", []) or []
    om_temp = om_hourly.get("temperature_2m", []) or []
    om_apparent = om_hourly.get("apparent_temperature", []) or []
    om_humidity = om_hourly.get("relativehumidity_2m", []) or []
    om_dewpoint = om_hourly.get("dewpoint_2m", []) or []
    om_cape = om_hourly.get("cape", []) or []

    st_dataseries = seven_timer.get("dataseries", []) or []
    tz_obj = ZoneInfo(tz)
    now = datetime.now(tz_obj)
    cutoff = now + timedelta(hours=horizon_hours)

    for i, time_str in enumerate(om_times):
        try:
            dt = datetime.fromisoformat(time_str.replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            dt = dt.astimezone(tz_obj)
            if dt > cutoff:
                break

            st_index = i // 3
            seeing = None
            transparency = None
            if st_index < len(st_dataseries):
                st_point = st_dataseries[st_index]
                seeing = st_point.get("seeing")
                transparency = st_point.get("transparency")

            record = {
                "time": dt.isoformat(),
                "cloud_total": _at(om_cloud_total, i),
                "cloud_low": _at(om_cloud_low, i),
                "cloud_mid": _at(om_cloud_mid, i),
                "cloud_high": _at(om_cloud_high, i),
                "precip_mm": _at(om_precip, i) or 0.0,
                "precip_prob": _at(om_precip_prob, i),
                "precip_type": _at_int(om_precip_type, i),
                "rain_mm": _at(om_rain, i),
                "snow_mm": _at(om_snowfall, i),
                "pressure_hpa": _at(om_pressure, i),
                "wind_m_s": _at(om_wind, i),
                "wind_gust_m_s": _at(om_wind_gust, i),
                "wind_dir_deg": _at(om_wind_dir, i),
                "visibility_m": _at(om_visibility, i),
                "temp_c": _at(om_temp, i),
                "feels_like_c": _at(om_apparent, i),
                "humidity_pct": _at(om_humidity, i),
                "dewpoint_c": _at(om_dewpoint, i),
                "cape_j_kg": _at(om_cape, i),
                "seeing": seeing,
                "transparency": transparency,
            }
            hourly.append(record)
        except Exception as e:
            print(f"WARNING: Failed to process hour {i}: {e}")
            continue
    return hourly


PROFILE_PENALTY_CONFIG: Dict[str, Dict[str, Any]] = {
    "default": {
        "cloud_coef": 0.9,
        "precip_coef": 80.0,
        "wind_thresh": 4.0,
        "wind_factor": 4.0,
        "seeing_scale": (0.0, 5.0, 10.0, 15.0, 20.0),
        "trans_scale": (0.0, 5.0, 15.0, 20.0),
    },
    "visual": {
        "cloud_coef": 0.95,
        "precip_coef": 80.0,
        "wind_thresh": 4.0,
        "wind_factor": 4.0,
        "seeing_scale": (0.0, 4.0, 8.0, 12.0, 16.0),
        "trans_scale": (0.0, 5.0, 15.0, 20.0),
    },
    "broadband": {
        "cloud_coef": 0.85,
        "precip_coef": 80.0,
        "wind_thresh": 4.0,
        "wind_factor": 4.0,
        "seeing_scale": (0.0, 4.0, 8.0, 12.0, 16.0),
        "trans_scale": (0.0, 8.0, 18.0, 25.0),
    },
    "planetary": {
        "cloud_coef": 0.7,
        "precip_coef": 80.0,
        "wind_thresh": 3.0,
        "wind_factor": 5.0,
        "seeing_scale": (0.0, 6.0, 12.0, 18.0, 25.0),
        "trans_scale": (0.0, 5.0, 12.0, 18.0),
    },
}


def compute_observing_score_for_profile(
    hour_record: Dict[str, Any], thresholds: Dict[str, Any], profile: str
) -> tuple[int, Dict[str, Any]]:
    """Compute observing score 0..100 (penalty-based) for a given profile. Returns (score_int, breakdown_dict)."""
    cfg = PROFILE_PENALTY_CONFIG.get(profile, PROFILE_PENALTY_CONFIG["default"])
    raw_start = 100.0
    penalties_dict: Dict[str, Dict[str, Any]] = {}

    cloud_coef = float(cfg.get("cloud_coef", 0.9))
    cloud_total = hour_record.get("cloud_total")
    if cloud_total is not None:
        try:
            c = float(cloud_total)
        except (TypeError, ValueError):
            c = 0.0
        penalty = c * cloud_coef
        penalties_dict["cloud_total"] = {"value": c, "penalty": penalty, "details": f"cloud_total*{cloud_coef}"}
    else:
        penalties_dict["cloud_total"] = {"value": None, "penalty": 0.0, "details": f"cloud_total*{cloud_coef}"}

    precip_coef = float(cfg.get("precip_coef", 80.0))
    precip_mm = hour_record.get("precip_mm", 0.0)
    try:
        p_mm = float(precip_mm) if precip_mm is not None else 0.0
    except (TypeError, ValueError):
        p_mm = 0.0
    penalties_dict["precip_mm"] = {"value": p_mm, "penalty": p_mm * precip_coef, "details": f"precip_mm*{precip_coef}"}

    wind_thresh = float(cfg.get("wind_thresh", 4.0))
    wind_factor = float(cfg.get("wind_factor", 4.0))
    wind_m_s = hour_record.get("wind_m_s")
    if wind_m_s is not None:
        try:
            w = float(wind_m_s)
        except (TypeError, ValueError):
            w = 0.0
    else:
        w = 0.0
    wind_penalty = max(0.0, w - wind_thresh) * wind_factor
    penalties_dict["wind_m_s"] = {"value": w, "penalty": wind_penalty, "details": f"max(0, wind-{wind_thresh})*{wind_factor}"}

    min_visibility = float(thresholds.get("min_visibility_m", 8000.0))
    visibility_m = hour_record.get("visibility_m")
    if visibility_m is not None:
        try:
            vis = float(visibility_m)
        except (TypeError, ValueError):
            vis = None
    else:
        vis = None
    if vis is not None and vis < min_visibility:
        vis_penalty = 25.0 if vis < min_visibility * 0.5 else 10.0
    else:
        vis_penalty = 0.0
    penalties_dict["visibility_m"] = {"value": vis, "penalty": vis_penalty, "details": "if <min_visibility then 10/25"}

    seeing_scale = cfg.get("seeing_scale", (0.0, 5.0, 10.0, 15.0, 20.0))
    seeing = hour_record.get("seeing")
    s = float(seeing) if seeing is not None else None
    if s is not None and 1 <= s <= 5:
        seeing_penalty = seeing_scale[min(4, int(s) - 1)]
    elif s is not None and s >= 5:
        seeing_penalty = seeing_scale[4]
    elif s is not None and s > 1:
        seeing_penalty = seeing_scale[min(4, max(0, int(s) - 1))]
    else:
        seeing_penalty = 0.0
    penalties_dict["seeing"] = {"value": s, "penalty": seeing_penalty, "details": "map by scale"}

    trans_scale = cfg.get("trans_scale", (0.0, 5.0, 15.0, 20.0))
    transparency = hour_record.get("transparency")
    t = float(transparency) if transparency is not None else None
    trans_penalty = 0.0
    if t is not None and 1 <= t <= 4:
        trans_penalty = trans_scale[min(3, int(t) - 1)]
    elif t is not None and t > 4:
        trans_penalty = trans_scale[3]
    elif t is not None and t < 1:
        trans_penalty = trans_scale[0]
    penalties_dict["transparency"] = {"value": t, "penalty": trans_penalty, "details": "map 1..4 => profile"}

    total_penalty = sum(p["penalty"] for p in penalties_dict.values())
    raw_score = raw_start - total_penalty
    score = max(0, min(100, int(round(raw_score))))

    breakdown = {
        "model": profile,
        "raw_start": int(raw_start),
        "penalties": {
            k: {
                "value": v["value"],
                "penalty": round(v["penalty"], 1) if isinstance(v["penalty"], float) else int(v["penalty"]),
                "details": v["details"],
            }
            for k, v in penalties_dict.items()
        },
        "total_penalty": round(total_penalty, 1) if total_penalty != int(total_penalty) else int(total_penalty),
        "raw_score": round(raw_score, 1) if raw_score != int(raw_score) else int(raw_score),
        "score": score,
    }
    return score, breakdown


def compute_observing_score(hour_record: Dict[str, Any], thresholds: Dict[str, Any]) -> tuple[int, Dict[str, Any]]:
    """Default (Balanced) profile: penalty-based score and breakdown."""
    return compute_observing_score_for_profile(hour_record, thresholds, "default")


def _clamp01(value: Optional[float]) -> float:
    if value is None:
        return 0.0
    try:
        v = float(value)
    except (TypeError, ValueError):
        return 0.0
    return max(0.0, min(1.0, v))


def _normalize_clear_from_cloud(val: Optional[float]) -> float:
    if val is None:
        return 0.0
    try:
        v = float(val)
    except (TypeError, ValueError):
        return 0.0
    if v > 1.0:
        v /= 100.0
    return 1.0 - _clamp01(v)


def find_best_windows(hours: List[Dict[str, Any]], min_window_hours: int = 2) -> List[Dict[str, Any]]:
    """Find best observing windows (consecutive hours with score >= 60)."""
    windows = []
    current_start = None
    current_scores = []

    for i, hour in enumerate(hours):
        score = hour.get("score", 0)
        if score >= 60:
            if current_start is None:
                current_start = i
            current_scores.append(score)
        else:
            if current_start is not None and len(current_scores) >= min_window_hours:
                avg_score = sum(current_scores) / len(current_scores)
                windows.append({
                    "start": hours[current_start]["time"],
                    "end": hours[i - 1]["time"],
                    "score_avg": round(avg_score, 1),
                    "label": "Excellent" if avg_score >= 85 else "Good" if avg_score >= 70 else "Fair",
                })
            current_start = None
            current_scores = []

    if current_start is not None and len(current_scores) >= min_window_hours:
        avg_score = sum(current_scores) / len(current_scores)
        windows.append({
            "start": hours[current_start]["time"],
            "end": hours[-1]["time"],
            "score_avg": round(avg_score, 1),
            "label": "Excellent" if avg_score >= 85 else "Good" if avg_score >= 70 else "Fair",
        })

    windows.sort(key=lambda w: w["score_avg"], reverse=True)
    return windows


def add_derived_per_hour(hours: List[Dict[str, Any]]) -> None:
    """Add per-hour derived fields."""
    n = len(hours)
    for i, h in enumerate(hours):
        w = h.get("wind_m_s")
        h["wind_kmh"] = round(w * 3.6, 1) if w is not None else None
        v = h.get("visibility_m")
        h["visibility_km"] = round(v / 1000.0, 2) if v is not None else None
        tc, dc = h.get("temp_c"), h.get("dewpoint_c")
        h["dewpoint_spread_c"] = round(tc - dc, 1) if tc is not None and dc is not None else None
        if i + 6 < n:
            p0, p6 = hours[i].get("pressure_hpa"), hours[i + 6].get("pressure_hpa")
            h["pressure_trend_6h_hpa"] = round(p6 - p0, 1) if p0 is not None and p6 is not None else None
        else:
            h["pressure_trend_6h_hpa"] = None
        vis, hum, spread = h.get("visibility_m"), h.get("humidity_pct"), h.get("dewpoint_spread_c")
        if vis is not None and vis < 3000:
            h["fog_risk"] = "HIGH"
        elif hum is not None and spread is not None and hum > 92 and spread < 1.5:
            h["fog_risk"] = "HIGH"
        elif hum is not None and spread is not None and hum > 85 and spread < 2.5:
            h["fog_risk"] = "MED"
        else:
            h["fog_risk"] = "LOW"


def compute_derived_aggregates(hours: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Compute next24 and next72 aggregates."""
    def agg(window: List[Dict[str, Any]]) -> Dict[str, Any]:
        out: Dict[str, Any] = {}
        if not window:
            return out
        wind_peak = cloud_peak = precip_peak = best_score = None
        wind_peak_time = cloud_peak_time = precip_peak_time = best_score_time = None
        for h in window:
            w = h.get("wind_m_s")
            if w is not None and (wind_peak is None or w > wind_peak):
                wind_peak, wind_peak_time = round(w, 1), h.get("time")
            c = h.get("cloud_total")
            if c is not None:
                c_pct = c if c > 1 else c * 100
                if cloud_peak is None or c_pct > cloud_peak:
                    cloud_peak, cloud_peak_time = round(c_pct, 0), h.get("time")
            p = h.get("precip_prob")
            if p is not None:
                p_pct = p if p > 1 else p * 100
                if precip_peak is None or p_pct > precip_peak:
                    precip_peak, precip_peak_time = round(p_pct, 0), h.get("time")
            sc = h.get("score")
            if sc is not None and (best_score is None or sc > best_score):
                best_score, best_score_time = sc, h.get("time")
        if wind_peak is not None:
            out["wind_peak_m_s"], out["wind_peak_time"] = wind_peak, wind_peak_time
        if cloud_peak is not None:
            out["cloud_peak_pct"], out["cloud_peak_time"] = cloud_peak, cloud_peak_time
        if precip_peak is not None:
            out["precip_prob_peak_pct"], out["precip_peak_time"] = precip_peak, precip_peak_time
        if best_score is not None:
            out["best_score"], out["best_score_time"] = best_score, best_score_time
        return out

    return {"next24": agg(hours[:24]), "next72": agg(hours[:72])}


def build_weather_payload(
    lat: float,
    lon: float,
    tz: str,
    location_name: str,
    horizon_hours: int,
    thresholds: Dict[str, Any],
) -> Dict[str, Any]:
    """Build complete weather payload (Open-Meteo + 7Timer, legacy scoring)."""
    print(f"[weather] Fetching Open-Meteo data for {location_name} ({lat}, {lon})...")
    open_meteo = fetch_open_meteo(lat, lon, tz, horizon_hours)

    print(f"[weather] Fetching 7Timer astro data...")
    seven_timer = fetch_7timer_astro(lat, lon)

    print(f"[weather] Merging data...")
    hours = merge_to_hourly(open_meteo, seven_timer, tz, horizon_hours)
    add_derived_per_hour(hours)

    default_profile = None
    if _SCORE_ENGINE_AVAILABLE:
        try:
            default_profile = load_profile(profile_name="default")
        except Exception as e:
            print(f"[weather] WARNING: Could not load scoring profile: {e}, using legacy scoring")

    if default_profile is not None:
        loaded_profiles: Dict[str, Any] = {"default": default_profile}
        for pname in ["visual", "photography", "planetary"]:
            try:
                loaded_profiles[pname] = load_profile(profile_name=pname)
            except Exception:
                loaded_profiles[pname] = default_profile
        print(f"[weather] Computing scores (additive v2)...")
        for i, hour in enumerate(hours):
            derived_h = compute_derived_for_hour(i, hours)
            result = compute_score(hour, derived_h, default_profile)
            hour["score"] = result["score"]
            hour["score_profile"] = result["profile"]
            hour["score_breakdown"] = result["breakdown"]
            hour["score_explain"] = result["explain"]
            hour["profile_scores"] = {}
            hour["score_breakdown_by_profile"] = {}
            for pname, prof in loaded_profiles.items():
                if pname == "default":
                    continue
                pres = compute_score(hour, derived_h, prof)
                hour["profile_scores"][pname] = pres["score"]
                hour["score_breakdown_by_profile"][pname] = pres["breakdown"]
                if pname == "photography":
                    hour["profile_scores"]["broadband"] = pres["score"]
                    hour["score_breakdown_by_profile"]["broadband"] = pres["breakdown"]
    else:
        print(f"[weather] Computing scores (legacy)...")
        for hour in hours:
            score, breakdown = compute_observing_score(hour, thresholds)
            hour["score"] = score
            hour["score_breakdown"] = breakdown
            score_v, breakdown_v = compute_observing_score_for_profile(hour, thresholds, "visual")
            score_b, breakdown_b = compute_observing_score_for_profile(hour, thresholds, "broadband")
            score_p, breakdown_p = compute_observing_score_for_profile(hour, thresholds, "planetary")
            hour["score_breakdown_by_profile"] = {
                "visual": breakdown_v,
                "broadband": breakdown_b,
                "planetary": breakdown_p,
            }
            hour["profile_scores"] = {"visual": score_v, "broadband": score_b, "planetary": score_p}
            hour["score_profile"] = "default"
            hour["score_explain"] = []

    derived = compute_derived_aggregates(hours)
    if _SCORE_ENGINE_AVAILABLE and hours:
        derived_now = compute_derived_for_hour(0, hours)
        derived_now["heads_up"] = build_heads_up(0, hours, derived_now)
        derived["now"] = derived_now
    print(f"[weather] Finding best windows...")
    best_windows = find_best_windows(hours)

    generated_at = datetime.now(timezone.utc).isoformat()
    om_hourly = open_meteo.get("hourly") or {}
    payload = {
        "version": 2,
        "generated_at": generated_at,
        "meta": {
            "generated_at": generated_at,
            "location": {"name": location_name, "lat": lat, "lon": lon, "tz": tz},
            "source": {"open_meteo_fields": list(om_hourly.keys())},
            "horizon_hours": horizon_hours,
        },
        "location": {"name": location_name, "lat": lat, "lon": lon, "tz": tz},
        "horizon_hours": horizon_hours,
        "hours": hours,
        "derived": derived,
        "summary": {"best_windows": best_windows[:5]},
        "profiles": ["visual", "broadband", "planetary"],
        "profiles_available": ["default", "visual", "photography", "planetary"],
        "scoring_version": "v2" if default_profile is not None else "v1",
        "default_profile": "default" if default_profile is not None else "default",
        "moon_available": False,
    }

    print(f"[weather] Generated {len(hours)} hourly records, {len(best_windows)} windows")
    return payload
