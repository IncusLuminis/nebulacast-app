#!/usr/bin/env python3
"""
Fetch weather data from Open-Meteo and 7Timer.
Scoring v5: hierarchical category model (Atmosphere / Sky Darkness / Dew Safety / Stability).
Falls back to legacy penalties when score engine is unavailable.
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

# ── Scoring v2 constants (#118) ───────────────────────────────────────────────
_SUN_MOON_PATH = Path(__file__).resolve().parents[3] / "sites/staging/sky/data/sun_moon.json"

# Profile weights: (weather_weight, seeing_weight)
_PROF_W  = {
    "balanced":    (0.70, 0.30),
    "visual":      (0.85, 0.15),
    "photography": (0.90, 0.10),
    "planetary":   (0.45, 0.55),
}

# FWHM → seeing quality breakpoints (linear interp), spec §5.1
_FWHM_PTS = [(0.5, 100), (1.0, 90), (1.5, 75), (2.0, 60), (2.5, 45), (3.0, 30), (4.0, 15)]

# Solar state → score multiplier.
# v4: Sun/Moon removed from score — atmosphere-only model.
_SOLAR_FACTOR = {"night": 1.00, "twilight": 1.00, "day": 1.00}


def _load_sun_moon_frames() -> list:
    """Load sun/moon 10-min frames from sun_moon.json. Returns [] on any error."""
    try:
        with open(_SUN_MOON_PATH, encoding="utf-8") as f:
            return json.load(f).get("frames", [])
    except Exception:
        return []


def _merge_moon_data(hours: list, frames: list) -> None:
    """Add moon_illum_pct, moon_alt_deg, moon_waxing, sun_alt_deg to each hourly record."""
    if not frames:
        for h in hours:
            h.update(moon_illum_pct=None, moon_alt_deg=None, moon_waxing=None, sun_alt_deg=None)
        return
    # Parse "2026-Mar-04 04:16Z" → epoch seconds once
    def _pts(s: str) -> float:
        return datetime.strptime(s, "%Y-%b-%d %H:%MZ").replace(tzinfo=timezone.utc).timestamp()
    frame_ts = [_pts(f["t_utc"]) for f in frames]
    for h in hours:
        try:
            hour_ts = datetime.fromisoformat(h["time"]).timestamp()
        except Exception:
            h.update(moon_illum_pct=None, moon_alt_deg=None, moon_waxing=None, sun_alt_deg=None)
            continue
        i = min(range(len(frame_ts)), key=lambda i: abs(frame_ts[i] - hour_ts))
        h["moon_illum_pct"] = frames[i]["moon"]["illum_pct"]
        h["moon_alt_deg"]   = frames[i]["moon"]["alt_deg"]
        h["moon_waxing"]    = frames[i]["moon"]["waxing"]
        h["sun_alt_deg"]    = frames[i]["sun"]["alt_deg"]


def _compute_solar_state(alt_deg) -> str:
    """Classify solar illumination: day / twilight / night based on sun altitude."""
    if alt_deg is None:
        return "night"
    if alt_deg > 0:
        return "day"
    if alt_deg >= -18:
        return "twilight"
    return "night"


def compute_gate(hour: dict) -> dict:
    """v5.1 Observability Gate. States: OPEN / MARGINAL / CLOSED.

    Sun-altitude rule (spec §4):
      sun > −6°    → CLOSED immediately (daytime / bright twilight)
      sun −6°..−12° → MARGINAL (civil/nautical twilight)
      sun < −12°   → OPEN (darkness check passes; cloud/rain still apply)
    """
    # ── Sun-altitude check (highest priority) ─────────────────────────────────
    sun_alt = hour.get("sun_alt_deg")
    if sun_alt is not None and sun_alt > -6:
        label = "Daytime" if sun_alt > 0 else "Bright twilight"
        return {"status": "CLOSED", "score": 0, "reasons": [label]}

    low    = hour.get("cloud_low",  0) or 0
    mid    = hour.get("cloud_mid",  0) or 0
    high   = hour.get("cloud_high", 0) or 0
    vis_m  = hour.get("visibility_m") or 0
    vis_km = vis_m / 1000 if vis_m else (hour.get("visibility_km") or 0)
    rain   = hour.get("rain_mm",   0) or 0
    snow   = hour.get("snow_mm",   0) or 0

    reasons: list = []

    # ── CLOSED — precipitation / heavy overcast / fog ─────────────────────────
    # low/mid > 90% → CLOSED; vis ≤ 1 km → CLOSED.
    # precipitation threshold: ≥ 0.3mm rain or ≥ 0.2mm snow (avoids model noise/dew).
    if rain >= 0.3:
        reasons.append(f"Rain {rain:.1f}mm")
    elif snow >= 0.2:
        reasons.append(f"Snow {snow:.1f}mm")
    if low > 90:
        reasons.append(f"Low cloud {low:.0f}%")
    if mid > 90:
        reasons.append(f"Mid cloud {mid:.0f}%")
    if vis_km and vis_km <= 1.0:
        reasons.append(f"Visibility {vis_km:.1f}km")

    if rain >= 0.3 or snow >= 0.2:
        return {"status": "CLOSED", "score": max(0, 10 - len(reasons) * 3), "reasons": reasons}
    if low > 90 or mid > 90 or (vis_km and vis_km <= 1.0):
        return {"status": "CLOSED", "score": max(0, 15 - len(reasons) * 4), "reasons": reasons}

    # ── MARGINAL — twilight and/or broken cloud / haze ────────────────────────
    # low/mid > 70% → MARGINAL; high > 80% → MARGINAL (cirrus).
    marginal = False
    if sun_alt is not None and -12 < sun_alt <= -6:
        reasons.append("Civil/Nautical twilight"); marginal = True
    if low > 70:
        reasons.append(f"Broken low cloud {low:.0f}%");  marginal = True
    if mid > 70:
        reasons.append(f"Broken mid cloud {mid:.0f}%");  marginal = True
    if high > 80:
        reasons.append(f"High cirrus {high:.0f}%");      marginal = True
    if vis_km and vis_km <= 5.0:
        reasons.append(f"Visibility {vis_km:.1f}km");    marginal = True
    if marginal:
        return {"status": "MARGINAL", "score": max(30, 69 - len(reasons) * 8), "reasons": reasons}

    if not reasons:
        reasons.append("Clear sky")
    return {"status": "OPEN", "score": 100, "reasons": reasons}


def compute_weather_quality(hour: dict, profile: str = "balanced") -> dict:
    """Scoring v2 (#118) — Weather Quality (0-100). Returns {score, class, breakdown}."""
    low  = hour.get("cloud_low",  0) or 0
    mid  = hour.get("cloud_mid",  0) or 0
    high = hour.get("cloud_high", 0) or 0

    # Effective cloud — layer-weighted model (spec §3.1)
    eff     = 0.65 * low + 0.25 * mid + 0.10 * high
    cloud_q = max(0.0, 100.0 - eff)

    # Cirrus blanket penalty (spec §3.2)
    if high >= 95:   cirrus_penalty = 20
    elif high >= 85: cirrus_penalty = 15
    elif high >= 70: cirrus_penalty = 10
    elif high >= 50: cirrus_penalty = 5
    else:            cirrus_penalty = 0

    # Visibility quality piecewise (spec §4.2)
    vis_km = hour.get("visibility_km") or ((hour.get("visibility_m") or 0) / 1000)
    if vis_km >= 20:   vis_q = 100
    elif vis_km >= 10: vis_q = 80
    elif vis_km >= 5:  vis_q = 60
    elif vis_km >= 2:  vis_q = 35
    else:              vis_q = 10

    # Wind quality (spec §4.3)
    wind = hour.get("wind_m_s") or 0
    if wind <= 3:   wind_q = 100
    elif wind <= 6: wind_q = 80
    elif wind <= 10: wind_q = 55
    else:           wind_q = 30

    # v4: Moon removed from atmosphere score — it is a context layer only.
    # Weights redistributed: cloud 0.60, vis 0.25, wind 0.15 (sum = 1.00)
    weather_base = 0.60 * cloud_q + 0.25 * vis_q + 0.15 * wind_q
    score = round(max(0.0, min(100.0, weather_base - cirrus_penalty)))

    cls = ("EXCELLENT" if score >= 75 else "GOOD" if score >= 50
           else "FAIR" if score >= 30 else "POOR")
    return {
        "score": score, "class": cls,
        "breakdown": {
            "effective_cloud": round(eff, 1),
            "cloud_q":       round(cloud_q, 1),
            "cirrus_penalty": cirrus_penalty,
            "vis_q":          vis_q,
            "wind_q":         wind_q,
        },
    }


def _piecewise(x: float, pts: list) -> float:
    """Linear interpolation through (x, y) breakpoints. Clamps at edges."""
    if x <= pts[0][0]:  return pts[0][1]
    if x >= pts[-1][0]: return pts[-1][1]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        if x0 <= x <= x1:
            return y0 + (x - x0) / (x1 - x0) * (y1 - y0)
    return pts[-1][1]


def compute_seeing_quality(hour: dict) -> dict:
    """Level 3 — Seeing Quality (0-100). Returns {score, class, fwhm_arcsec, breakdown}."""
    fwhm = hour.get("seeing_fwhm_arcsec_est")

    # Factor 1: seeing_q — atmospheric turbulence (main driver, weight 0.70)
    if fwhm is not None:
        seeing_q = round(_piecewise(fwhm, _FWHM_PTS))
    else:
        idx = hour.get("seeing")           # 7Timer 1–7
        seeing_q = round(max(5, min(95, 95 - (idx - 1) * 15))) if idx else 50

    # Factor 2: thermal_q — CAPE-based convective stability (weight 0.20)
    # Low CAPE = stable = good seeing; high CAPE = convective turbulence = bad
    cape = hour.get("cape_j_kg") or 0
    thermal_q = round(_piecewise(cape, [(0, 100), (500, 60), (1000, 30), (2000, 0)]))

    # Factor 3: humidity_q — relative humidity (weight 0.10)
    # Low humidity = better optical conditions; very high = micro-turbulence
    humidity = hour.get("humidity_pct") or 50
    humidity_q = round(_piecewise(humidity, [(30, 100), (70, 50), (90, 10), (100, 0)]))

    ss = round(0.70 * seeing_q + 0.20 * thermal_q + 0.10 * humidity_q)
    cls = ("EXCELLENT" if ss >= 80 else "GOOD" if ss >= 60
           else "FAIR" if ss >= 40 else "BAD")
    return {
        "score": ss, "class": cls, "fwhm_arcsec": fwhm,
        "breakdown": {
            "seeing_q":  seeing_q,
            "thermal_q": thermal_q,
            "humidity_q": humidity_q,
        },
    }


def compute_hour_score(gate: dict, weather_score: int, seeing_score: int,
                       profile: str = "balanced", solar_state: str = "night",
                       cloud_high: float = 0) -> int:
    """Scoring v2 (#118): gate + weather + seeing + solar factor + caps."""
    if gate["status"] == "CLOSED":
        return max(0, min(20, gate["score"]))

    ww, sw   = _PROF_W.get(profile, (0.70, 0.30))
    hour_raw = ww * weather_score + sw * seeing_score

    # Solar factor (spec §6)
    solar_factor = _SOLAR_FACTOR.get(solar_state, 1.0)
    score = round(hour_raw * solar_factor)

    # Score caps (spec §9)
    if gate["status"] == "MARGINAL":
        score = min(score, 69)
    if cloud_high >= 95:
        score = min(score, 60)

    return max(0, min(100, score))


def _build_v2_score_breakdown(hour: dict, gate: dict, wbal: dict, seeing_result: dict,
                               solar_state: str, cloud_high: float,
                               profile: str = "balanced") -> list:
    """Build score_breakdown Array for v2 model (used by inspector 'How this score was calculated')."""
    ww, sw = _PROF_W.get(profile, (0.70, 0.30))
    sf = _SOLAR_FACTOR.get(solar_state, 1.0)

    if gate["status"] == "CLOSED":
        reasons = gate.get("reasons") or ["Unfavorable conditions"]
        score = max(0, min(20, gate.get("score", 10)))
        return [
            {"key": "gate_closed", "label": f"Gate CLOSED — {reasons[0]}",
             "factor_score": 0, "earned": score},
            {"key": "_total", "_final_score": score, "is_info": True},
        ]

    wb      = wbal.get("breakdown", {})
    cloud_q = wb.get("cloud_q",        0)
    cirrus  = wb.get("cirrus_penalty",  0)
    vis_q   = wb.get("vis_q",          0)
    wind_q  = wb.get("wind_q",         0)
    eff     = wb.get("effective_cloud", 0)
    ss      = (seeing_result or {}).get("score", 50)

    # v4: no solar multiplier, no moon — pure atmosphere
    def earn(c: float) -> int:
        return round(c)

    items = []

    # Clouds (effective cloud model)
    items.append({
        "key": "clouds",
        "label": f"Clouds: {round(eff)}% (eff.)",
        "raw": round(eff),
        "factor_score": round(cloud_q),
        "earned": earn(0.60 * cloud_q * ww),
    })

    # Cirrus penalty (shown only when non-zero)
    if cirrus > 0:
        high = hour.get("cloud_high", 0) or 0
        items.append({
            "key": "cirrus",
            "label": f"Cirrus penalty ({round(high)}% high cloud)",
            "raw": round(high),
            "factor_score": max(0, 100 - round(high)),
            "earned": -earn(cirrus * ww),
        })

    # Visibility
    vis_m  = hour.get("visibility_m")
    vis_km = (vis_m / 1000.0) if vis_m else (hour.get("visibility_km") or 0)
    items.append({
        "key": "visibility",
        "label": f"Visibility: {round(vis_km, 1)} km",
        "raw": round(vis_km, 1),
        "factor_score": round(vis_q),
        "earned": earn(0.25 * vis_q * ww),
    })

    # Wind
    wind = hour.get("wind_m_s") or 0
    items.append({
        "key": "wind",
        "label": f"Wind: {round(wind, 1)} m/s",
        "raw": round(wind, 1),
        "factor_score": round(wind_q),
        "earned": earn(0.15 * wind_q * ww),
    })

    # Seeing
    fwhm = hour.get("seeing_fwhm_arcsec_est")
    seeing_label = f'Seeing: {fwhm:.1f}"' if fwhm else "Seeing"
    items.append({
        "key": "seeing",
        "label": seeing_label,
        "raw": (round(fwhm, 1) if fwhm else None),
        "factor_score": round(ss),
        "earned": earn(ss * sw),
    })

    # Sentinel: actual final score (after caps) for frontend
    items.append({"key": "_total", "_final_score": hour.get("score", 0), "is_info": True})

    return items


# ── Scoring v5 — Category model ───────────────────────────────────────────────

_RULES_PATH = Path(__file__).resolve().parents[3] / "services/weather/configs/rules.yaml"

_BORTLE_HINTS: Dict[int, str] = {
    1: "Excellent dark sky", 2: "Typical dark site", 3: "Rural sky",
    4: "Rural/suburban transition", 5: "Suburban sky", 6: "Bright suburban sky",
    7: "Suburban/urban transition", 8: "City sky", 9: "Inner-city sky",
}

_BORTLE_BASE = {1: 100, 2: 95, 3: 90, 4: 80, 5: 65, 6: 50, 7: 35, 8: 20, 9: 10}  # v5.1 §5.2.3

# v5 profile weights: (atmosphere, sky_darkness, dew_safety, stability)
_V5_PROF_W = {
    # (atm, sky, dew, stab) — must sum to 1.0
    "balanced":  (0.40, 0.40, 0.10, 0.10),
    "visual":    (0.40, 0.40, 0.10, 0.10),
    "broadband": (0.40, 0.40, 0.10, 0.10),
    "planetary": (0.40, 0.40, 0.10, 0.10),
}

# v7.2 — profile-specific moon sensitivity multiplier.
# Amplifies (>1) or dampens (<1) the raw lunar impact before computing moon_score.
# full moon high alt, visual:    adjusted_impact = min(1, 0.67 × 1.5) = 1.0 → moon_score = 0
# full moon high alt, broadband: adjusted_impact = min(1, 0.67 × 1.8) = 1.0 → moon_score = 0
# full moon high alt, planetary: adjusted_impact = min(1, 0.67 × 0.3) = 0.20 → moon_score = 80
_MOON_SENSITIVITY = {
    "balanced":  1.0,
    "visual":    1.5,   # DSO contrast destroyed by moonlight
    "broadband": 1.8,   # Sky background raised even more for wideband imaging
    "planetary": 0.3,   # Bright target — moon is nearly irrelevant
}

# v5.1: 7Timer index → FWHM arcsec (unchanged)
_V5_SEEING_FWHM = [(1, 0.7), (2, 0.9), (3, 1.1), (4, 1.4), (5, 1.8), (6, 2.5), (7, 3.5)]
# v5.1: FWHM arcsec → seeing quality  (spec §5.1.2)
_V5_FWHM_Q = [(0.7, 100), (1.0, 95), (1.3, 90), (1.6, 85), (2.0, 75), (2.5, 60), (3.0, 40), (3.5, 20)]
# v5.1: dew spread °C → DewSpread_score  (spec §5.3.1)
_V5_DEW_TABLE = [(0, 5), (1, 25), (2, 50), (3, 70), (4, 85), (6, 100)]
# v5.1: wind km/h → DewWind_score  (non-monotonic peak at 9-15 km/h, spec §5.3.2)
_V5_DEW_WIND = [(0, 60), (2, 60), (3, 85), (8, 85), (9, 100), (15, 100), (16, 85), (30, 85)]
# v5.1: wind km/h → WindStability_score  (spec §5.4.1)
_V5_WIND_STAB = [(0, 100), (5, 90), (10, 80), (15, 65), (20, 40), (30, 15), (50, 15)]
# v5.1: humidity % → HumidityStability_score  (spec §5.4.2)
_V5_HUM_STAB  = [(0, 100), (50, 100), (60, 90), (70, 80), (80, 65), (90, 40), (100, 20)]
# v5.1: visibility km → Transparency_score  (spec §5.1.3)
_V5_TRANS_VIS = [(0, 10), (5, 25), (10, 45), (20, 65), (30, 80), (40, 90), (50, 100)]


def _load_bortle_class() -> int:
    """Load bortle_class from rules.yaml. Default: 5."""
    try:
        import yaml  # type: ignore
        with open(_RULES_PATH, encoding="utf-8") as f:
            cfg = yaml.safe_load(f) or {}
        return int(cfg.get("weather", {}).get("bortle_class", 5))
    except Exception:
        return 5


def compute_atmosphere_score(hour: dict) -> dict:
    """Category 1 — Atmosphere.

    Cloudness = low/100×0.4 + mid/100×0.4 + high/100×0.2  (0.0 … 1.0)
    Atmosphere score = (1 − cloudness) × 100

    Display parameters:
      - Cloudness row: bar showing cloudness%; formula = sum of layer contributions
      - Low/Mid/High rows: cloud icons + each layer's contribution value
    """
    low  = hour.get("cloud_low",  0) or 0
    mid  = hour.get("cloud_mid",  0) or 0
    high = hour.get("cloud_high", 0) or 0

    low_contrib  = round(low  / 100.0 * 0.4, 3)
    mid_contrib  = round(mid  / 100.0 * 0.4, 3)
    high_contrib = round(high / 100.0 * 0.2, 3)
    cloudness    = min(1.0, low_contrib + mid_contrib + high_contrib)

    score = max(0, min(100, round((1.0 - cloudness) * 100)))

    return {
        "score": score,
        "parameters": [
            {"key": "cloudness",
             "label": "Cloudness",
             "display": "cloudness_bar",
             "value": round(cloudness * 100),       # 0-100 %
             "low_c": low_contrib, "mid_c": mid_contrib, "high_c": high_contrib,
             "weight": None, "points": None},
            {"key": "cloud_low",
             "label": f"Low clouds {round(low)}%",
             "display": "cloud_icons",
             "value": round(low),
             "contribution": low_contrib,
             "weight": 0.4, "points": None},
            {"key": "cloud_mid",
             "label": f"Mid clouds {round(mid)}%",
             "display": "cloud_icons",
             "value": round(mid),
             "contribution": mid_contrib,
             "weight": 0.4, "points": None},
            {"key": "cloud_high",
             "label": f"High clouds {round(high)}%",
             "display": "cloud_icons",
             "value": round(high),
             "contribution": high_contrib,
             "weight": 0.2, "points": None},
        ],
    }


def compute_sky_darkness_score(hour: dict, bortle: int = 5, profile: str = "balanced") -> dict:
    """Category 2 — Dark Sky Level (v9).

    Sky Darkness = (1 − Sky Brightness) × 100
    Sky Brightness = sun_factor×0.80 + moon_factor×0.15 + bortle_factor×0.05

    sun_factor (piecewise linear, alt → brightness):
      alt >= 0°          → 1.00  (daylight)
      0° … −6°           → 1.00 … 0.70  (civil twilight)
      −6° … −12°         → 0.70 … 0.40  (nautical twilight)
      −12° … −18°        → 0.40 … 0.00  (astro twilight)
      < −18°             → 0.00  (night)

    moon_factor = illum × sqrt(alt/90)  (v8 sqrt curve, profile-sensitivity aware)
    bortle_factor = bortle / 9
    """
    bc = max(1, min(9, bortle))

    # ── 1. Sun brightness factor ──────────────────────────────────────────────
    sun_alt = hour.get("sun_alt_deg")
    if sun_alt is None or sun_alt >= 0:
        sun_factor = 1.00
        sun_label  = "Sunlight (100%)" if sun_alt is None or sun_alt >= 0 else "Sunlight"
    elif sun_alt <= -18:
        sun_factor = 0.00
        sun_label  = "Sunlight (0%)"
    elif sun_alt > -6:
        # civil: 1.0 at 0° → 0.70 at -6°
        sun_factor = round(1.0 + sun_alt * (0.30 / 6), 3)
        sun_label  = f"Civil twilight ({sun_alt:.0f}°)"
    elif sun_alt > -12:
        # nautical: 0.70 at -6° → 0.40 at -12°
        sun_factor = round(0.70 + (sun_alt + 6) * (0.30 / 6), 3)
        sun_label  = f"Nautical twilight ({sun_alt:.0f}°)"
    else:
        # astro: 0.40 at -12° → 0.00 at -18°
        sun_factor = round(0.40 + (sun_alt + 12) * (0.40 / 6), 3)
        sun_factor = max(0.0, sun_factor)
        sun_label  = f"Astro twilight ({sun_alt:.0f}°)"

    sun_contrib = round(sun_factor * 0.80, 3)

    # ── 2. Moon brightness factor ─────────────────────────────────────────────
    moon_alt   = hour.get("moon_alt_deg")
    moon_illum = hour.get("moon_illum_pct")

    if moon_alt is None or moon_alt <= 0:
        moon_factor = 0.0
        moon_label  = "Moonlight (0%)"
    else:
        illum       = (moon_illum or 0) / 100.0
        alt_f       = min(1.0, (moon_alt / 90.0) ** 0.5)
        sensitivity = _MOON_SENSITIVITY.get(profile, 1.0)
        moon_factor = round(min(1.0, illum * alt_f * sensitivity), 3)
        moon_label  = f"Moonlight ({round(moon_factor * 100)}%)"

    moon_contrib = round(moon_factor * 0.15, 3)

    # ── 3. Bortle / light pollution factor ───────────────────────────────────
    # (9 - bortle) / 9: Bortle 1 (dark) → 0.89, Bortle 9 (city) → 0.0
    # Icons show 9-bortle out of 9 — more icons = more light pollution
    bortle_factor = round((9 - bc) / 9, 3)
    bortle_contrib = round(bortle_factor * 0.05, 3)
    bortle_label  = f"Light pollution (Bortle:{bc})"

    # ── Sky Brightness & score ────────────────────────────────────────────────
    sky_brightness = min(1.0, sun_contrib + moon_contrib + bortle_contrib)
    score = max(0, min(100, round((1.0 - sky_brightness) * 100)))

    brightness_pct = round(sky_brightness * 100)

    return {
        "score": score,
        "parameters": [
            {"key": "sky_brightness",
             "label": "Sky Brightness",
             "display": "skybrightness_bar",
             "value": brightness_pct,
             "sun_c": sun_contrib, "moon_c": moon_contrib, "bortle_c": bortle_contrib,
             "weight": None, "points": None},
            {"key": "sun",
             "label": sun_label,
             "display": "sky_icons", "icon": "🌞",
             "value": sun_factor,
             "contribution": sun_contrib,
             "weight": 0.80, "points": None},
            {"key": "moon",
             "label": moon_label,
             "display": "sky_icons", "icon": "🌗",
             "value": moon_factor,
             "contribution": moon_contrib,
             "weight": 0.15, "points": None},
            {"key": "light_pollution",
             "label": bortle_label,
             "display": "sky_icons", "icon": "☀",
             "value": bortle_factor,
             "contribution": bortle_contrib,
             "weight": 0.05, "points": None},
        ],
    }


def compute_dew_safety_score(hour: dict) -> dict:
    """v5.2 Category 3 — Dew Safety.

    Formula: 0.80 × DewSpread_score + 0.20 × Humidity_score
    Both sub-scores normalised 0..100 (spec §5.3).
    Wind removed (now in Stability); replaced by Humidity which directly affects dew risk.
    """
    temp = hour.get("temp_c")
    dew  = hour.get("dewpoint_c")
    spread = (temp - dew) if temp is not None and dew is not None else None

    spread_score = round(_piecewise(spread, _V5_DEW_TABLE)) if spread is not None else 50
    spread_label = f"Spread {spread:.1f}°C" if spread is not None else "Spread unknown"

    hum_val = hour.get("humidity_pct")
    hum_score = round(_piecewise(hum_val or 65, _V5_HUM_STAB))

    score = max(0, min(100, round(0.80 * spread_score + 0.20 * hum_score)))
    return {
        "score": score,
        "parameters": [
            {"key": "dew_spread", "label": spread_label,
             "value": round(spread, 1) if spread is not None else 0,
             "score": spread_score, "weight": 0.80, "points": round(0.80 * spread_score)},
            {"key": "humidity",   "label": f"Humidity {hum_val}%" if hum_val is not None else "Humidity",
             "value": hum_val or 65,
             "score": hum_score,   "weight": 0.20, "points": round(0.20 * hum_score)},
        ],
    }


def compute_stability_score(hour: dict) -> dict:
    """v5.3 Category 4 — Stability.

    Formula: 0.40 × Wind + 0.30 × Transparency + 0.20 × Seeing + 0.10 × PressureTrend
    All sub-scores normalised 0..100 (spec §5.4).
    """
    wind_kmh = (hour.get("wind_m_s") or 0) * 3.6
    wq = _piecewise(wind_kmh, _V5_WIND_STAB)

    # Transparency (visibility)
    vis_m = hour.get("visibility_m")
    vis_km = (vis_m / 1000.0) if vis_m else (hour.get("visibility_km") or 0)
    vq = _piecewise(vis_km, _V5_TRANS_VIS)

    # Seeing — FWHM preferred, fallback to 7Timer index
    fwhm = hour.get("seeing_fwhm_arcsec_est")
    if fwhm is not None:
        sq = round(_piecewise(fwhm, _V5_FWHM_Q))
    else:
        idx = hour.get("seeing")
        sq = round(max(5, min(95, 95 - (idx - 1) * 15))) if idx else 50

    # Pressure trend  (spec §5.4.3 — 4-tier by absolute change per 6h)
    trend = hour.get("pressure_trend_6h_hpa")
    if trend is None:         pq = 70
    elif abs(trend) <= 0.5:   pq = 100
    elif abs(trend) <= 1.5:   pq = 85
    elif abs(trend) <= 3.0:   pq = 65
    else:                     pq = 40

    score = max(0, min(100, round(0.40 * wq + 0.30 * vq + 0.20 * sq + 0.10 * pq)))
    trend_label = (f"Pressure {'+' if trend >= 0 else ''}{trend:.1f} hPa/6h"
                   if trend is not None else "Pressure unknown")
    fwhm_label = f'Seeing {fwhm:.1f}"' if fwhm is not None else "Seeing"
    trans_label = f"Transparency {vis_km:.0f} km" if vis_km else "Transparency"
    return {
        "score": score,
        "parameters": [
            {"key": "wind",           "label": f"Wind {wind_kmh:.0f} km/h",
             "value": round(wind_kmh), "score": round(wq), "weight": 0.40, "points": round(0.40 * wq)},
            {"key": "transparency",   "label": trans_label,
             "value": round(vis_km, 1), "score": round(vq), "weight": 0.30, "points": round(0.30 * vq)},
            {"key": "seeing",         "label": fwhm_label,
             "value": round(fwhm, 2) if fwhm is not None else sq,
             "score": round(sq), "weight": 0.20, "points": round(0.20 * sq)},
            {"key": "pressure_trend", "label": trend_label,
             "value": round(trend, 1) if trend is not None else 0,
             "score": round(pq), "weight": 0.10, "points": round(0.10 * pq)},
        ],
    }


def _build_v5_score_breakdown(
    hour: dict, gate: dict,
    atm: dict, sky: dict, dew: dict, stab: dict,
    profile: str = "balanced",
) -> dict:
    """Build v5 score_breakdown {categories, total, clamped_total} for inspector."""
    w = _V5_PROF_W.get(profile, _V5_PROF_W["balanced"])
    wa, ws, wd, wst = w

    total = wa * atm["score"] + ws * sky["score"] + wd * dew["score"] + wst * stab["score"]
    if gate.get("status") == "CLOSED":
        final = max(0, min(20, gate.get("score", 10)))
    else:
        final = hour.get("score", round(max(0, min(100, total))))

    cats = [
        {"key": "atmosphere",   "label": "Atmosphere",   "score": atm["score"],  "weight": wa,  "points": round(atm["score"]  * wa, 1), "parameters": atm["parameters"]},
        {"key": "sky_darkness", "label": "Sky Darkness", "score": sky["score"],  "weight": ws,  "points": round(sky["score"]  * ws, 1), "parameters": sky["parameters"]},
        {"key": "dew_safety",   "label": "Dew Safety",   "score": dew["score"],  "weight": wd,  "points": round(dew["score"]  * wd, 1), "parameters": dew["parameters"]},
        {"key": "stability",    "label": "Stability",    "score": stab["score"], "weight": wst, "points": round(stab["score"] * wst, 1), "parameters": stab["parameters"]},
    ]
    return {"categories": cats, "total": round(total, 1), "clamped_total": final}


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
        "weathercode",
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
    om_weather_code = om_hourly.get("weathercode", []) or []

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
                "weather_code": _at_int(om_weather_code, i),
                "seeing": seeing,
                "transparency": transparency,
            }
            hourly.append(record)
        except Exception as e:
            print(f"WARNING: Failed to process hour {i}: {e}")
            continue
    return hourly


PROFILE_PENALTY_CONFIG: Dict[str, Dict[str, Any]] = {
    "balanced": {
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
    cfg = PROFILE_PENALTY_CONFIG.get(profile, PROFILE_PENALTY_CONFIG["balanced"])
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
    """Balanced profile: penalty-based score and breakdown."""
    return compute_observing_score_for_profile(hour_record, thresholds, "balanced")


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


# 7Timer seeing index (1=best, 7=worst) → (FWHM arcsec midpoint, confidence)
_SEEING_FWHM: Dict[int, tuple] = {
    1: (0.35, "high"),    # <0.5"  excellent
    2: (0.63, "high"),    # 0.5–0.75"
    3: (0.88, "high"),    # 0.75–1.0"
    4: (1.13, "medium"),  # 1.0–1.25"
    5: (1.63, "medium"),  # 1.25–2.0"
    6: (2.50, "low"),     # 2.0–3.0"
    7: (3.50, "low"),     # >3.0"
}


def estimate_fwhm(seeing_int: Any) -> tuple:
    """Return (fwhm_arcsec, confidence) for 7Timer seeing index 1-7, or (None, None)."""
    if seeing_int is None:
        return None, None
    try:
        v = _SEEING_FWHM.get(int(seeing_int))
    except (TypeError, ValueError):
        return None, None
    if v is None:
        return None, None
    return v  # (float, str)


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
    _merge_moon_data(hours, _load_sun_moon_frames())
    for h in hours:
        h["solar_state"] = _compute_solar_state(h.get("sun_alt_deg"))

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
            fwhm_arcsec, fwhm_conf = estimate_fwhm(hour.get("seeing"))
            hour["seeing_fwhm_arcsec_est"] = fwhm_arcsec
            hour["seeing_fwhm_confidence"] = fwhm_conf
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
            hour["score_profile"] = "balanced"
            hour["score_explain"] = []
            fwhm_arcsec, fwhm_conf = estimate_fwhm(hour.get("seeing"))
            hour["seeing_fwhm_arcsec_est"] = fwhm_arcsec
            hour["seeing_fwhm_confidence"] = fwhm_conf

    # ── Scoring v5 — hierarchical category model ─────────────────────────────
    print(f"[weather] Computing scoring v5 (atmosphere/sky_darkness/dew_safety/stability)...")
    bortle = _load_bortle_class()
    for hour in hours:
        gate = compute_gate(hour)

        # Compute FWHM estimate from 7Timer index (needed by compute_atmosphere_score)
        if hour.get("seeing_fwhm_arcsec_est") is None:
            fwhm_est, _ = estimate_fwhm(hour.get("seeing"))
            hour["seeing_fwhm_arcsec_est"] = fwhm_est

        atm  = compute_atmosphere_score(hour)
        dew  = compute_dew_safety_score(hour)
        stab = compute_stability_score(hour)

        # Compute sky darkness per profile (moon sensitivity differs)
        sky_by_profile = {pname: compute_sky_darkness_score(hour, bortle, pname) for pname in _V5_PROF_W}
        sky = sky_by_profile["balanced"]

        hour["gate"]              = gate
        hour["atmosphere_score"]  = atm["score"]
        hour["sky_darkness_score"]= sky["score"]   # balanced — backward compat
        hour["sky_darkness_score_by_profile"] = {pname: sky_by_profile[pname]["score"] for pname in sky_by_profile}
        hour["dew_safety_score"]  = dew["score"]
        hour["stability_score"]   = stab["score"]

        # Final score: balanced profile weighted sum, gate-capped
        wa, ws, wd, wst = _V5_PROF_W["balanced"]
        raw = wa * atm["score"] + ws * sky["score"] + wd * dew["score"] + wst * stab["score"]
        if gate["status"] == "CLOSED":   raw = min(raw, 20)
        elif gate["status"] == "MARGINAL": raw = min(raw, 69)
        hour["score"] = max(0, min(100, round(raw)))

        hour["score_breakdown"] = _build_v5_score_breakdown(hour, gate, atm, sky, dew, stab, "balanced")

        # Profile scores — use per-profile sky darkness
        ps = hour.setdefault("profile_scores", {})
        for pname, (pwa, pws, pwd, pwst) in _V5_PROF_W.items():
            psky = sky_by_profile[pname]["score"]
            prof_raw = pwa * atm["score"] + pws * psky + pwd * dew["score"] + pwst * stab["score"]
            if gate["status"] == "CLOSED":   prof_raw = min(prof_raw, 20)
            elif gate["status"] == "MARGINAL": prof_raw = min(prof_raw, 69)
            ps[pname] = max(0, min(100, round(prof_raw)))
        ps["broadband"] = ps.get("broadband", ps.get("balanced", 0))
    # ──────────────────────────────────────────────────────────────────────────

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
        "profiles": ["balanced", "visual", "broadband", "planetary"],
        "profiles_available": ["balanced", "visual", "broadband", "planetary"],
        "scoring_version": "v5",
        "default_profile": "balanced",
        "bortle": bortle,
        "moon_available": True,
    }

    print(f"[weather] Generated {len(hours)} hourly records, {len(best_windows)} windows")
    return payload
