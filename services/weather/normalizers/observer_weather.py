#!/usr/bin/env python3
"""
Normalize Open-Meteo + 7Timer data into observer_weather_now.json schema.
"""
from __future__ import annotations

import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

_service_root = Path(__file__).resolve().parent.parent
if str(_service_root) not in sys.path:
    sys.path.insert(0, str(_service_root))

from pipelines.fetch_weather import fetch_open_meteo, fetch_7timer_astro, merge_to_hourly
from providers.ephemeris import (
    EphemerisResult,
    LocationAwareEphemerisProvider,
    LocationContext,
)

try:
    import yaml as _yaml
except ImportError:
    _yaml = None  # type: ignore


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


def _parse_utc(ts_str: str) -> datetime:
    """Parse 'YYYY-MM-DDTHH:MM:SSZ' → datetime (UTC)."""
    return datetime.strptime(ts_str, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)


def _parse_sun_moon_t(t_str: str) -> datetime:
    """Parse '2026-Mar-04 04:16Z' → datetime (UTC)."""
    return datetime.strptime(t_str, "%Y-%b-%d %H:%MZ").replace(tzinfo=timezone.utc)


# ── Derived risk helpers ─────────────────────────────────────────────────────

_RISK_ORDER = {"high": 2, "medium": 1, "low": 0, "unknown": -1}


def _worst_risk(labels: List[str]) -> str:
    if not labels:
        return "unknown"
    return max(labels, key=lambda l: _RISK_ORDER.get(l, -1))


def _dew_risk_for_hour(
    temp_c: Optional[float], dewpoint_c: Optional[float], humidity: Optional[float]
) -> str:
    """
    high:   (T - Td) < 2°C  OR  RH > 92%
    medium: (T - Td) < 4°C
    low:    otherwise
    """
    if temp_c is None or dewpoint_c is None:
        return "unknown"
    spread = temp_c - dewpoint_c
    hum = humidity or 0.0
    if spread < 2.0 or hum > 85.0:
        return "high"
    if spread < 4.0 or hum > 75.0:
        return "medium"
    return "low"


def _fog_risk_for_hour(
    visibility_m: Optional[float],
    humidity: Optional[float],
    temp_c: Optional[float],
    dewpoint_c: Optional[float],
) -> str:
    """
    high:   visibility < 2 km  AND  RH > 80%
    medium: visibility < 8 km  OR  (RH > 90% AND spread < 4°C)
    low:    otherwise
    """
    if visibility_m is None:
        return "unknown"
    hum = humidity or 0.0
    spread = (temp_c - dewpoint_c) if (temp_c is not None and dewpoint_c is not None) else 999.0
    if visibility_m < 2000 and hum > 80.0:
        return "high"
    if visibility_m < 8000 or (hum > 90.0 and spread < 4.0):
        return "medium"
    return "low"


def _wind_risk_for_hour(gust_mps: Optional[float]) -> str:
    """
    high:   gust > 10 m/s
    medium: gust > 6 m/s
    low:    otherwise
    """
    if gust_mps is None:
        return "unknown"
    if gust_mps > 8.0:
        return "high"
    if gust_mps > 5.0:
        return "medium"
    return "low"


# ── Pressure trend ───────────────────────────────────────────────────────────

def _pressure_trend_3h(
    hourly_out: List[Dict], now_utc: datetime
) -> Tuple[Optional[float], str]:
    """Compute 3h pressure delta starting from the first hour >= now."""
    now_h: Optional[Dict] = None
    now_ts: Optional[datetime] = None
    future_h: Optional[Dict] = None

    for h in hourly_out:
        try:
            ts = _parse_utc(h["timestamp_utc"])
        except Exception:
            continue
        if now_h is None and ts >= now_utc:
            now_h = h
            now_ts = ts
            continue
        if now_ts is not None and ts >= now_ts + timedelta(hours=3):
            future_h = h
            break

    if now_h is None or future_h is None:
        return None, "steady"

    p0 = (now_h.get("air") or {}).get("pressure_hpa")
    p3 = (future_h.get("air") or {}).get("pressure_hpa")
    if p0 is None or p3 is None:
        return None, "steady"

    delta = round(p3 - p0, 1)
    if delta > 1.5:
        label = "rising"
    elif delta < -1.5:
        label = "falling"
    else:
        label = "steady"
    return delta, label


# ── Best observing window ────────────────────────────────────────────────────

def _best_window(
    hourly_out: List[Dict],
    window_h: int,
    night_only: bool = False,
    precip_prob_limit: float = 30.0,
    gust_limit: float = 10.0,
) -> Optional[Dict]:
    """Find best N-hour window by minimum avg cloud_total, with optional constraints."""
    candidates = [h for h in hourly_out if not night_only or h.get("night", False)]

    best: Optional[Dict] = None
    best_avg = float("inf")

    for i in range(len(candidates) - window_h + 1):
        chunk = candidates[i : i + window_h]
        clouds = []
        ok = True
        for h in chunk:
            c = (h.get("cloud") or {}).get("total_percent")
            p = (h.get("precip") or {}).get("probability_percent")
            g = (h.get("wind") or {}).get("gust_mps")
            if c is None:
                ok = False
                break
            if p is not None and p > precip_prob_limit:
                ok = False
                break
            if g is not None and g > gust_limit:
                ok = False
                break
            clouds.append(c)
        if not ok or not clouds:
            continue
        avg = sum(clouds) / len(clouds)
        if avg < best_avg:
            best_avg = avg
            best = {
                "start": chunk[0]["timestamp_utc"],
                "end": chunk[-1]["timestamp_utc"],
                "cloud_avg": round(avg, 1),
            }

    return best


# ── Night mask from the location-aware ephemeris provider ───────────────────

_ASTRO_TWILIGHT_ALT = -6.0  # degrees — astronomical twilight threshold
_EPHEMERIS_PROVIDER = LocationAwareEphemerisProvider()


def _build_sun_moon_index(frames: List[Dict]) -> List[Tuple[datetime, Dict]]:
    """Return sorted list of (datetime, frame) pairs."""
    result = []
    for fr in frames:
        try:
            dt = _parse_sun_moon_t(fr["t_utc"])
            result.append((dt, fr))
        except Exception:
            continue
    result.sort(key=lambda x: x[0])
    return result


def _nearest_frame(
    index: List[Tuple[datetime, Dict]], target_dt: datetime
) -> Optional[Dict]:
    """Return the frame closest in time to target_dt."""
    if not index:
        return None
    lo, hi = 0, len(index) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if index[mid][0] < target_dt:
            lo = mid + 1
        else:
            hi = mid
    best_dt, best_fr = index[lo]
    if lo > 0:
        prev_dt, prev_fr = index[lo - 1]
        if abs((prev_dt - target_dt).total_seconds()) < abs((best_dt - target_dt).total_seconds()):
            return prev_fr
    return best_fr


def _apply_night_mask(
    hourly_out: List[Dict], sm_index: List[Tuple[datetime, Dict]], *, unavailable: bool = False
) -> None:
    """Add 'night' (bool) and 'moon_up' (bool) to each hourly record in-place."""
    for h in hourly_out:
        try:
            ts = _parse_utc(h["timestamp_utc"])
        except Exception:
            h["night"] = None if unavailable else False
            h["moon_up"] = None if unavailable else False
            continue
        frame = _nearest_frame(sm_index, ts)
        if frame is None:
            h["night"] = None if unavailable else False
            h["moon_up"] = None if unavailable else False
            continue
        sun_alt = (frame.get("sun") or {}).get("alt_deg")
        moon_alt = (frame.get("moon") or {}).get("alt_deg")
        h["night"] = sun_alt is not None and sun_alt < _ASTRO_TWILIGHT_ALT
        h["moon_up"] = moon_alt is not None and moon_alt > 0


# ── Moon metadata ────────────────────────────────────────────────────────────

def _moon_meta(
    sm_index: List[Tuple[datetime, Dict]], now_utc: datetime
) -> Optional[Dict]:
    """Return moon summary dict for the current time from sun_moon index."""
    if not sm_index:
        return None
    frame = _nearest_frame(sm_index, now_utc)
    if frame is None:
        return None
    moon = frame.get("moon") or {}
    illum = moon.get("illum_pct")
    moon_alt = moon.get("alt_deg")
    return {
        "illumination_percent": round(illum, 1) if illum is not None else None,
        "phase_name": moon.get("phase_name"),
        "moon_up_now": moon_alt is not None and moon_alt > 0,
    }


# ── Mode scores ──────────────────────────────────────────────────────────────

def _flatten_for_score(h: Dict) -> Dict:
    """Flatten observer_weather hour dict to flat keys expected by score_engine."""
    cloud = h.get("cloud") or {}
    wind = h.get("wind") or {}
    precip = h.get("precip") or {}
    air = h.get("air") or {}
    astro = h.get("astro") or {}
    return {
        "cloud_total": cloud.get("total_percent"),
        "precip_mm": precip.get("mm"),
        "precip_prob": precip.get("probability_percent"),
        "wind_m_s": wind.get("speed_mps"),
        "wind_gust_m_s": wind.get("gust_mps"),
        "visibility_m": air.get("visibility_m"),
        "seeing": astro.get("seeing_raw"),
        "transparency": astro.get("transparency_raw"),
    }


def _compute_mode_scores(
    hourly_out: List[Dict], now_utc: datetime
) -> Optional[Dict[str, Optional[int]]]:
    """Compute best 3h rolling average score for each profile over next 24h."""
    try:
        from engine.score_engine import load_profile, compute_score
    except ImportError as e:
        print(f"[observer_weather] WARNING: score_engine import failed: {e}")
        return None

    profiles = {
        "balanced": "default",
        "visual": "visual",
        "photography": "photography",
        "planetary": "planetary",
    }

    cutoff_24h = now_utc + timedelta(hours=24)
    upcoming = [
        h for h in hourly_out
        if _safe_parse_utc(h.get("timestamp_utc")) is not None
        and now_utc <= _safe_parse_utc(h["timestamp_utc"]) <= cutoff_24h
    ]

    if not upcoming:
        return None

    result: Dict[str, Optional[int]] = {}
    for display_name, profile_file in profiles.items():
        try:
            profile = load_profile(profile_name=profile_file)
        except Exception as e:
            print(f"[observer_weather] WARNING: could not load profile '{profile_file}': {e}")
            result[display_name] = None
            continue

        hour_scores: List[float] = []
        for h in upcoming:
            flat = _flatten_for_score(h)
            try:
                sr = compute_score(flat, {}, profile)
                hour_scores.append(float(sr["score"]))
            except Exception:
                hour_scores.append(0.0)

        # Best 3h sliding window (average score)
        window = 3
        best = 0.0
        for i in range(max(1, len(hour_scores) - window + 1)):
            chunk = hour_scores[i : i + window]
            avg = sum(chunk) / len(chunk) if chunk else 0.0
            if avg > best:
                best = avg
        result[display_name] = round(best)

    return result


def _safe_parse_utc(ts_str: Optional[str]) -> Optional[datetime]:
    if not ts_str:
        return None
    try:
        return _parse_utc(ts_str)
    except Exception:
        return None


# ── Bortle ───────────────────────────────────────────────────────────────────

_BORTLE_HINTS: Dict[int, str] = {
    1: "Excellent dark sky",
    2: "Typical dark site",
    3: "Rural sky",
    4: "Rural/suburban transition",
    5: "Suburban sky",
    6: "Bright suburban sky",
    7: "Suburban/urban transition",
    8: "City sky",
    9: "Inner-city sky",
}


def _load_bortle() -> Tuple[int, str]:
    """Load bortle_class from rules.yaml, return (class, hint). Default: (5, 'Suburban sky')."""
    try:
        rules_path = _service_root / "configs" / "rules.yaml"
        if _yaml is None:
            raise RuntimeError("PyYAML not available")
        with open(rules_path, "r", encoding="utf-8") as f:
            cfg = _yaml.safe_load(f) or {}
        bortle = int(cfg.get("weather", {}).get("bortle_class", 5))
    except Exception:
        bortle = 5
    hint = _BORTLE_HINTS.get(bortle, "Suburban sky")
    return bortle, hint


# ── Night Quality Index summary ───────────────────────────────────────────────

def _compute_night_summary(
    hourly_out: List[Dict],
    now_utc: datetime,
) -> Optional[Dict]:
    """
    Compute the night_summary block (NQI + supporting fields) for the
    current/upcoming night window.  Returns None on any failure.

    Additive only — does not modify any existing fields.
    """
    try:
        from engine.night_quality import compute_nqi
    except ImportError as exc:
        print(f"[observer_weather] WARNING: night_quality import failed: {exc}")
        return None

    # ── Identify night window: first continuous block of night==True ──────────
    night_bins: List[Dict] = []
    in_night = False
    for h in hourly_out:
        ts = _safe_parse_utc(h.get("timestamp_utc"))
        if ts is None or ts < now_utc:
            continue
        if h.get("night") is True:
            in_night = True
            night_bins.append(h)
        elif in_night:
            break  # first night block ended

    if not night_bins:
        return None

    # Derive UTC window bounds from the first/last night bin
    try:
        start_utc = night_bins[0]["timestamp_utc"]
        # end_utc = start of first post-night bin; approximate as last_bin + 1h
        from datetime import timedelta as _td
        last_ts = _safe_parse_utc(night_bins[-1]["timestamp_utc"])
        end_utc = (last_ts + _td(hours=1)).strftime("%Y-%m-%dT%H:%M:%SZ") if last_ts else None
    except Exception:
        start_utc = None
        end_utc = None

    # ── NQI per profile ───────────────────────────────────────────────────────
    profiles = ["balanced", "visual", "photography", "planetary"]
    nqi_block: Dict[str, Dict] = {}
    avg_score_block: Dict[str, Optional[float]] = {}
    components_block: Dict[str, Dict] = {}

    for p in profiles:
        try:
            result = compute_nqi(night_bins, p)
            nqi_block[p] = {
                "value": result["value"],
                "class": result["class"],
            }
            components_block[p] = result.get("components", {})
        except Exception as exc:
            print(f"[observer_weather] WARNING: NQI failed for profile '{p}': {exc}")
            nqi_block[p] = {"value": 0.0, "class": "poor"}
            components_block[p] = {}

        # avg_score: simple mean of per-hour scores (secondary metric)
        try:
            from engine.score_engine import load_profile, compute_score

            _profile_map = {
                "balanced": "default", "visual": "visual",
                "photography": "photography", "planetary": "planetary",
            }
            ep = _profile_map.get(p, "default")
            prof = load_profile(profile_name=ep)
            hrs: List[float] = []
            for h in night_bins:
                flat = _flatten_for_score(h)
                try:
                    hrs.append(float(compute_score(flat, {}, prof).get("score", 0)))
                except Exception:
                    pass
            avg_score_block[p] = round(sum(hrs) / len(hrs)) if hrs else None
        except Exception:
            avg_score_block[p] = None

    # ── Best window (reuse existing helper, night-only) ───────────────────────
    try:
        bw = _best_window(night_bins, window_h=2, night_only=False)
    except Exception:
        bw = None
    best_window_out: Optional[Dict] = None
    if bw:
        best_window_out = {
            "start_utc": bw.get("start"),
            "end_utc":   bw.get("end"),
        }

    return {
        "generated_at": now_utc.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "start_utc":    start_utc,
        "end_utc":      end_utc,
        "nqi":          nqi_block,
        "avg_score":    avg_score_block,
        "best_window":  best_window_out,
        "components":   components_block,
    }



def _compute_derived(hourly: List[Dict], now_utc: datetime) -> Dict[str, Any]:
    """Return legacy derived fields used by the Phase 1 compatibility tests."""
    upcoming = [
        h for h in hourly
        if (_safe_parse_utc(h.get("timestamp_utc")) is not None
            and _safe_parse_utc(h["timestamp_utc"]) >= now_utc)
    ]
    window = _best_window(upcoming, window_h=2, night_only=False)
    return {
        "cloud_window": {
            "best_window_start_utc": window["start"],
            "best_window_end_utc": window["end"],
            "cloud_avg": window.get("cloud_avg"),
        } if window else None
    }

# ── Main decision builder ─────────────────────────────────────────────────────

def _build_decision(
    hourly_out: List[Dict],
    now_utc: datetime,
) -> Dict:
    """Compute the full decision block from enriched hourly data."""
    cutoff_12h = now_utc + timedelta(hours=12)
    cutoff_24h = now_utc + timedelta(hours=24)

    dew_next12: List[str] = []
    fog_next12: List[str] = []
    wind_next12: List[str] = []

    for h in hourly_out:
        ts = _safe_parse_utc(h.get("timestamp_utc"))
        if ts is None or not (now_utc <= ts <= cutoff_12h):
            continue
        air = h.get("air") or {}
        dew_next12.append(_dew_risk_for_hour(
            air.get("temperature_c"),
            air.get("dewpoint_c"),
            air.get("humidity_percent"),
        ))
        fog_next12.append(_fog_risk_for_hour(
            air.get("visibility_m"),
            air.get("humidity_percent"),
            air.get("temperature_c"),
            air.get("dewpoint_c"),
        ))
        wind = h.get("wind") or {}
        wind_next12.append(_wind_risk_for_hour(wind.get("gust_mps")))

    pressure_delta, pressure_label = _pressure_trend_3h(hourly_out, now_utc)

    # Best windows over full horizon (no night constraint)
    best_2h = _best_window(hourly_out, 2)
    best_3h = _best_window(hourly_out, 3)

    # Best tonight: night hours within next 24h
    upcoming_24h = [
        h for h in hourly_out
        if (ts := _safe_parse_utc(h.get("timestamp_utc"))) is not None
        and now_utc <= ts <= cutoff_24h
    ]
    best_tonight = _best_window(upcoming_24h, 2, night_only=True)

    mode_scores = _compute_mode_scores(hourly_out, now_utc)

    return {
        "risks": {
            "dew": _worst_risk(dew_next12) if dew_next12 else "unknown",
            "fog": _worst_risk(fog_next12) if fog_next12 else "unknown",
            "wind": _worst_risk(wind_next12) if wind_next12 else "unknown",
        },
        "pressure": {
            "trend_3h_hpa": pressure_delta,
            "trend_label": pressure_label,
        },
        "best_window_2h": best_2h,
        "best_window_3h": best_3h,
        "best_tonight": best_tonight,
        "mode_scores": mode_scores,
    }


# ── Main normalizer ──────────────────────────────────────────────────────────

def build_observer_weather(
    lat: float,
    lon: float,
    tz: str,
    hours: int = 72,
    ephemeris_provider: Optional[LocationAwareEphemerisProvider] = None,
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

        seeing_raw = rec.get("seeing")
        trans_raw = rec.get("transparency")
        astro: Optional[Dict] = None
        if seeing_raw is not None or trans_raw is not None:
            astro = {
                "seeing": _seeing_label(seeing_raw),
                "transparency": _transparency_label(trans_raw),
                "seeing_raw": int(seeing_raw) if seeing_raw is not None else None,
                "transparency_raw": int(trans_raw) if trans_raw is not None else None,
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

    context = LocationContext(lat=lat, lon=lon, tz=tz)
    timestamps = []
    for hour in hourly_out:
        try:
            timestamps.append(_parse_utc(hour["timestamp_utc"]))
        except (KeyError, TypeError, ValueError):
            continue
    # Do not use the static Warsaw payload here.  An unavailable provider is
    # represented explicitly below and leaves night/moon fields unavailable.
    ephemeris: EphemerisResult = (ephemeris_provider or _EPHEMERIS_PROVIDER).frames_for_times(
        context, timestamps
    )
    sm_index = _build_sun_moon_index(list(ephemeris.frames))

    # Apply night mask (adds 'night' and 'moon_up' fields to each hour)
    _apply_night_mask(hourly_out, sm_index, unavailable=ephemeris.status != "available")
    for hour in hourly_out:
        hour["ephemeris_status"] = ephemeris.status

    decision = _build_decision(hourly_out, now_utc)
    moon = _moon_meta(sm_index, now_utc)
    bortle_class, bortle_hint = _load_bortle()
    night_summary = _compute_night_summary(hourly_out, now_utc)

    return {
        "generated_utc": generated_utc,
        "observer": {
            "lat_deg": lat,
            "lon_deg": lon,
            "tz": tz,
        },
        "ephemeris": {
            "status": ephemeris.status,
            "provider": ephemeris.provider,
            "location_key": ephemeris.location_key,
            "error": ephemeris.error,
        },
        "hourly": hourly_out,
        "decision": decision,
        "night_summary": night_summary,
        "moon": moon,
        "bortle": {
            "class": bortle_class,
            "sky_brightness_hint": bortle_hint,
        },
    }
