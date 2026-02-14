# services/sky/pipelines/metrics.py
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional
import numpy as np

import astropy.units as u
from astropy.coordinates import SkyCoord
from astropy.time import Time
from astroplan import Observer


def _clamp(x: float, a: float, b: float) -> float:
    return max(a, min(b, x))


def meridian_closeness(observer: Observer, target: SkyCoord, t: Time, ha0_deg: float = 10.0) -> float:
    """
    Returns 0..1 closeness to meridian:
      1.0 at exact transit, 0.0 at |HA| >= ha0_deg.
    """
    # Hour angle can be negative/positive. We take absolute.
    # astroplan gives Angle; convert to deg and fold to [0..180]
    ha = observer.target_hour_angle(t, target)  # Angle
    ha_deg = abs(ha.to_value(u.deg))
    # fold, just in case numerical weirdness
    if ha_deg > 180.0:
        ha_deg = ha_deg % 360.0
        if ha_deg > 180.0:
            ha_deg = 360.0 - ha_deg

    return _clamp(1.0 - (ha_deg / float(ha0_deg)), 0.0, 1.0)

    # services/sky/pipelines/metrics.py  (добавить ниже)
from typing import Any, Dict, List
from datetime import datetime, timezone

def _parse_horizons_utc(s: str) -> Optional[datetime]:
    # "2026-Feb-08 12:26Z"
    import re
    m = re.match(r"^(\d{4})-([A-Za-z]{3})-(\d{2})\s+(\d{2}):(\d{2})Z$", str(s).strip())
    if not m:
        return None
    year = int(m.group(1))
    mon3 = m.group(2)
    day = int(m.group(3))
    hh = int(m.group(4))
    mm = int(m.group(5))
    mon_map = dict(Jan=1,Feb=2,Mar=3,Apr=4,May=5,Jun=6,Jul=7,Aug=8,Sep=9,Oct=10,Nov=11,Dec=12)
    mon = mon_map.get(mon3)
    if not mon:
        return None
    return datetime(year, mon, day, hh, mm, tzinfo=timezone.utc)

def _pick_nearest_frame(frames: List[Dict[str, Any]], t_utc: datetime) -> Optional[Dict[str, Any]]:
    best = None
    best_dt = 10**18
    t_ms = int(t_utc.timestamp() * 1000)
    for f in frames or []:
        dtu = _parse_horizons_utc(f.get("t_utc"))
        if not dtu:
            continue
        dt = abs(int(dtu.timestamp() * 1000) - t_ms)
        if dt < best_dt:
            best_dt = dt
            best = f
    return best

def moon_penalty_from_sunmoon_json(
    observer: Observer,
    t: Time,
    sunmoon_json: Dict[str, Any],
    moon_alt0_deg: float = 5.0,
) -> float:
    """
    Returns 0..1 penalty: 0 = no impact, 1 = strong moonlight.
    Uses:
      - Moon altitude from astroplan/astropy (accurate for location/time).
      - Moon illumination percent from your sun_moon.json nearest frame.
    """
    # moon altitude
    from astropy.coordinates import get_body
    moon = get_body("moon", t, observer.location)  # GCRS-ish; ok for alt/az
    altaz = observer.altaz(t, moon)
    moon_alt_deg = float(altaz.alt.to_value(u.deg))

    alt_factor = _clamp((moon_alt_deg - moon_alt0_deg) / (90.0 - moon_alt0_deg), 0.0, 1.0)

    # illum
    illum_frac = None
    try:
        tdt = t.to_datetime(timezone=timezone.utc)
        fr = _pick_nearest_frame(sunmoon_json.get("frames", []), tdt)
        moon_obj = (fr or {}).get("moon") or {}
        illum = moon_obj.get("illum_pct", None)
        if illum is not None:
            illum = float(illum)
            illum_frac = _clamp(illum / 100.0, 0.0, 1.0)
    except Exception:
        illum_frac = None

    if illum_frac is None:
        # fallback: assume medium brightness if unknown
        illum_frac = 0.5

    return _clamp(alt_factor * illum_frac, 0.0, 1.0)