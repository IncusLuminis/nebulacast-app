#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_objects.py

Builds a compact "best objects tonight" list for amateurs (max 25–30),
for each of the next N days, using:
  1) Calendar events (daily_signal.json)  -> MUST be near top
  2) Planets (planets.json)              -> MUST stay near top when visible
  3) DSO seed list (dso_seed.json)       -> fills the tail, seasonally

Outputs:
  - sites/staging/sky/data/objects_week.json   (frames[0..DAYS-1])
  - sites/staging/sky/data/objects_today.json  (compat: frames[0].items)
Also copies the same to:
  - services/sky/data/generated/

Scoring model (high level):
  - Base visibility score from max altitude and "hours above horizon"
  - Meridian bonus if object is within ±10° hour-angle (near meridian)
    during deep night window 02:00–04:00 local time
  - Group priority bonus:
      calendar >> planets >> dso
  - Calendar events additionally get a "date proximity" bonus (sooner -> higher)

Notes generation (English):
  - Simple heuristics based on best time (local), altitude, and meridian closeness.

Important:
  - This script only prepares JSON. Frontend is not touched.
"""

from __future__ import annotations

import json
import math
import re
from dataclasses import dataclass
from datetime import datetime, timedelta, time, date
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import yaml

from astropy.time import Time
from astropy.coordinates import SkyCoord, EarthLocation, AltAz
import astropy.units as u

# astroquery is used only for calendar object name resolution (SIMBAD)
from astroquery.simbad import Simbad


# -----------------------------
# Paths (same style as gen_sunmoon.py)
# services/sky/pipelines/gen_objects.py
# -> project root is 3 levels up
# -----------------------------
PROJECT_ROOT = Path(__file__).resolve().parents[3]

SERVICES_DATA_DIR = PROJECT_ROOT / "services" / "sky" / "data" / "generated"
STAGING_DATA_DIR  = PROJECT_ROOT / "sites" / "staging" / "sky" / "data"

YAML_DIR = PROJECT_ROOT / "services" / "sky" / "pipelines" / "yml"
SOURCES_YML = YAML_DIR / "sources.yml"
RULES_YML   = YAML_DIR / "rules.yml"

CALENDAR_DAILY_SIGNAL = PROJECT_ROOT / "sites" / "staging" / "calendar" / "daily_signal.json"

OUT_WEEK_FILENAME = "objects_week.json"
OUT_TODAY_FILENAME = "objects_today.json"

SIMBAD_CACHE_PATH = SERVICES_DATA_DIR / "simbad_cache.json"


# -----------------------------
# Config (defaults; overridden by rules.yml if present)
# -----------------------------
DAYS = 7
STEP_MIN = 10

# Default location (Warsaw).
SITE_LAT_DEG = 52.2297
SITE_LON_DEG = 21.0122   # East positive
SITE_ELEV_KM = 0.10      # ~100 m


# -----------------------------
# Helpers
# -----------------------------
def _utc_now_iso() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")


def _safe_get(d: Dict[str, Any], keys: List[str], default=None):
    cur = d
    for k in keys:
        if not isinstance(cur, dict) or k not in cur:
            return default
        cur = cur[k]
    return cur


def _clamp(x: float, a: float, b: float) -> float:
    return max(a, min(b, x))


def _deg_norm180(x: float) -> float:
    """Normalize degrees to [-180, +180]."""
    v = (x + 180.0) % 360.0 - 180.0
    return v


# -----------------------------
# SIMBAD cache
# -----------------------------
def load_simbad_cache() -> Dict[str, Dict[str, float]]:
    if SIMBAD_CACHE_PATH.exists():
        try:
            data = _read_json(SIMBAD_CACHE_PATH)
            if isinstance(data, dict):
                return data
        except Exception:
            pass
    return {}


def save_simbad_cache(cache: Dict[str, Dict[str, float]]) -> None:
    _write_json(SIMBAD_CACHE_PATH, cache)


def simbad_resolve_ra_dec(name: str, cache: Dict[str, Dict[str, float]]) -> Optional[Tuple[float, float]]:
    """
    Resolve a target name to (ra_deg, dec_deg) using SIMBAD, with cache.
    """
    q = (name or "").strip()
    if not q:
        return None

    key = q.lower()
    if key in cache:
        v = cache[key]
        ra = v.get("ra_deg")
        dec = v.get("dec_deg")
        if isinstance(ra, (int, float)) and isinstance(dec, (int, float)):
            return float(ra), float(dec)

    # SIMBAD query
    try:
        custom = Simbad()
        custom.add_votable_fields("ra(d)", "dec(d)")
        r = custom.query_object(q)
        if r is None or len(r) == 0:
            return None
        ra_deg = float(r["RA_d"][0])
        dec_deg = float(r["DEC_d"][0])
        cache[key] = {"ra_deg": ra_deg, "dec_deg": dec_deg}
        return ra_deg, dec_deg
    except Exception:
        return None


# -----------------------------
# Calendar parsing
# -----------------------------
_MONTHS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12
}

_RE_TITLE_DATE = re.compile(r"^\s*(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\b")
_RE_OCCULTATION_OF = re.compile(r"\boccultation of\s+(.+?)\s*$", re.IGNORECASE)
_RE_CONJUNCTION_WITH = re.compile(r"\bconjunction(?:\s+of)?\s+(.+?)\s+(?:with|and)\s+(.+?)\s*$", re.IGNORECASE)


def parse_event_date_from_title(title: str) -> Optional[date]:
    """
    Example:
      "13 Feb 2026 (5 days away): Lunar occultation of Sigma Sagittarii"
    """
    if not title:
        return None
    m = _RE_TITLE_DATE.match(title.strip())
    if not m:
        return None
    dd = int(m.group(1))
    mon3 = m.group(2).lower()
    yy = int(m.group(3))
    mm = _MONTHS.get(mon3)
    if not mm:
        return None
    try:
        return date(yy, mm, dd)
    except Exception:
        return None


def extract_primary_object_name(title: str) -> Optional[str]:
    """
    Heuristic:
      - occultation of X  -> X
      - conjunction A with B -> pick the star/object side if exists
      - else None
    """
    if not title:
        return None

    t = title.strip()

    m = _RE_OCCULTATION_OF.search(t)
    if m:
        name = m.group(1).strip()
        name = re.sub(r"\s*\(.*?\)\s*$", "", name).strip()
        return name or None

    m = _RE_CONJUNCTION_WITH.search(t)
    if m:
        a = m.group(1).strip()
        b = m.group(2).strip()
        # prefer non-Moon/planet side if present
        bad = {"moon", "lunar", "sun", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune"}
        a_l = a.lower()
        b_l = b.lower()
        if any(k in a_l for k in bad) and not any(k in b_l for k in bad):
            return b
        if any(k in b_l for k in bad) and not any(k in a_l for k in bad):
            return a
        # else just return b
        return b or a or None

    return None


def load_calendar_daily_signal(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        return []
    data = _read_json(path)
    if isinstance(data, list):
        return data
    if isinstance(data, dict) and isinstance(data.get("items"), list):
        return data["items"]
    return []


def calendar_items_for_window(items: List[Dict[str, Any]], start_d: date, days: int) -> List[Dict[str, Any]]:
    """
    Keep only calendar items whose event date falls within [start_d, start_d + days).
    Deduplicate by the actual event identity:
      - prefer (event_date, url)
      - fallback to (event_date, normalized_title)
    """
    if not items or days <= 0:
        return []

    end_d = start_d + timedelta(days=days)
    out: List[Dict[str, Any]] = []

    def _norm_title_for_dedup(title: str) -> str:
        """
        "13 Feb 2026 (5 days away): Lunar occultation of Sigma Sagittarii"
        -> "lunar occultation of sigma sagittarii"
        """
        s = (title or "").strip()
        if not s:
            return ""
        # split once on ':' (your feed uses that)
        if ":" in s:
            left, right = s.split(":", 1)
            # if left looks like "DD Mon YYYY (...)" drop it
            if _RE_TITLE_DATE.match(left.strip()):
                s = right.strip()
        return " ".join(s.lower().split())

    for it in items:
        if not isinstance(it, dict):
            continue

        title = str(it.get("title") or "")
        d: Optional[date] = None

        # 1) preferred: parse from title
        d = parse_event_date_from_title(title)

        # 2) fallback: published_at
        if d is None:
            pa = str(it.get("published_at") or "").strip()
            if len(pa) >= 10:
                try:
                    d = datetime.fromisoformat(pa[:10]).date()
                except Exception:
                    d = None

        if d is None:
            continue

        if not (start_d <= d < end_d):
            continue

        it2 = dict(it)
        it2["_event_date"] = d.isoformat()

        # cache normalized title for downstream + dedup
        it2["_norm_title"] = _norm_title_for_dedup(title)

        prim = extract_primary_object_name(title)
        if prim:
            it2["_primary_object"] = prim.lower().strip()

        out.append(it2)

    # -----------------------------
    # DEDUPLICATION (event identity)
    # -----------------------------
    dedup: Dict[tuple, Dict[str, Any]] = {}

    for it in out:
        ds = str(it.get("_event_date") or "")
        url = str(it.get("url") or "").strip()
        nt = str(it.get("_norm_title") or "").strip()

        if url:
            key = (ds, "url", url)
        else:
            key = (ds, "title", nt)

        if key not in dedup:
            dedup[key] = it
            continue

        # keep the one with higher score if present
        try:
            s_new = float(it.get("score") or 0.0)
            s_old = float(dedup[key].get("score") or 0.0)
        except Exception:
            s_new, s_old = 0.0, 0.0

        if s_new > s_old:
            dedup[key] = it

    result = list(dedup.values())

    # stable order: by date, then score desc
    def _key(x: Dict[str, Any]):
        ds = str(x.get("_event_date") or "")
        try:
            sc = float(x.get("score") or 0.0)
        except Exception:
            sc = 0.0
        return (ds, -sc)

    result.sort(key=_key)
    return result


# -----------------------------
# Astro computations
# -----------------------------
@dataclass
class VisibilityStats:
    max_alt_deg: float
    hours_up: float
    best_time_local: Optional[datetime]
    meridian_bonus_hit: bool
    min_abs_hour_angle_deg_2to4: Optional[float]


def compute_visibility_stats(
    ra_deg: float,
    dec_deg: float,
    location: EarthLocation,
    times_utc: Time,
    tz_offset_minutes: int,
    deep_night_utc: Time,
    deep_night_mask: np.ndarray
) -> VisibilityStats:
    coord = SkyCoord(ra=ra_deg * u.deg, dec=dec_deg * u.deg, frame="icrs")

    aa = AltAz(obstime=times_utc, location=location)
    altaz = coord.transform_to(aa)

    alt_deg = np.array(altaz.alt.deg, dtype=float)
    # above horizon
    up = alt_deg > 0.0

    # step duration
    if len(times_utc) >= 2:
        dt_min = float((times_utc[1].jd - times_utc[0].jd) * 24 * 60)
    else:
        dt_min = float(STEP_MIN)

    hours_up = float(np.sum(up) * dt_min / 60.0)
    max_alt = float(np.nanmax(alt_deg)) if alt_deg.size else -90.0

    # best time (max altitude)
    best_time_local = None
    if alt_deg.size:
        i_best = int(np.nanargmax(alt_deg))
        t_best_utc = times_utc[i_best].to_datetime(timezone=None)
        best_time_local = t_best_utc + timedelta(minutes=tz_offset_minutes)

    # meridian proximity in deep night: need hour angle
    # hour angle = LST - RA; we'll approximate via astropy's sidereal_time
    # compute only for deep-night subset
    min_abs_ha_deg = None
    meridian_hit = False
    if np.any(deep_night_mask):
        t_dn = deep_night_utc[deep_night_mask]
        lst = t_dn.sidereal_time("apparent", longitude=location.lon)
        ha = (lst - coord.ra).wrap_at(180 * u.deg)
        abs_ha_deg = np.abs(ha.deg)
        min_abs_ha_deg = float(np.nanmin(abs_ha_deg)) if abs_ha_deg.size else None
        if min_abs_ha_deg is not None and min_abs_ha_deg <= 10.0:
            meridian_hit = True

    return VisibilityStats(
        max_alt_deg=max_alt,
        hours_up=hours_up,
        best_time_local=best_time_local,
        meridian_bonus_hit=meridian_hit,
        min_abs_hour_angle_deg_2to4=min_abs_ha_deg
    )


def local_tz_offset_minutes(dt_local: datetime) -> int:
    # dt_local is aware (has tzinfo)
    off = dt_local.utcoffset()
    if off is None:
        return 0
    return int(off.total_seconds() // 60)


def make_night_times_utc(day_local: date, tz_name: str, step_min: int) -> Tuple[Time, Time, Time, np.ndarray, int]:
    """
    Simple night window:
      dusk = 18:00 local
      dawn = 06:00 next day local
    Also provides deep-night window mask for 02:00–04:00 local.
    """
    # We keep it simple and stable (no external services).
    # Later you can replace with astroplan.twilight if needed.
    import zoneinfo
    tz = zoneinfo.ZoneInfo(tz_name)

    dusk_local = datetime.combine(day_local, time(18, 0), tzinfo=tz)
    dawn_local = datetime.combine(day_local + timedelta(days=1), time(6, 0), tzinfo=tz)

    # deep night window (local)
    dn0_local = datetime.combine(day_local + timedelta(days=1), time(2, 0), tzinfo=tz)
    dn1_local = datetime.combine(day_local + timedelta(days=1), time(4, 0), tzinfo=tz)

    tz_off_min = local_tz_offset_minutes(dusk_local)

    t_start = Time(dusk_local)
    t_end = Time(dawn_local)

    total_min = float((t_end.jd - t_start.jd) * 24 * 60)
    n = max(16, int(total_min / step_min))
    times = Time(np.linspace(t_start.jd, t_end.jd, n), format="jd")

    dn0 = Time(dn0_local)
    dn1 = Time(dn1_local)

    mask = (times.jd >= dn0.jd) & (times.jd <= dn1.jd)

    return t_start, t_end, times, mask, tz_off_min


def fmt_hhmm(dt_local: datetime) -> str:
    return dt_local.strftime("%H:%M")


def make_note(group: str, name: str, stats: VisibilityStats) -> str:
    if stats.best_time_local is None:
        return f"{name}: visibility unknown."

    t = fmt_hhmm(stats.best_time_local)
    alt = stats.max_alt_deg

    if alt < 8:
        base = f"Very low ({alt:.0f}° max). If you try, aim around {t}."
    elif alt < 20:
        base = f"Low but possible ({alt:.0f}° max). Best around {t}."
    elif alt < 45:
        base = f"Good visibility ({alt:.0f}° max). Best around {t}."
    else:
        base = f"Excellent visibility ({alt:.0f}° max). Best around {t}."

    if group == "calendar":
        base = f"Event highlight. {base}"
    elif group == "planets":
        base = f"Bright planet. {base}"

    if stats.meridian_bonus_hit:
        base += " Near the meridian in deep night (02–04)."

    return base


# -----------------------------
# Planets
# -----------------------------
def pick_nearest_planets_frame(planets_json: Dict[str, Any], t_ms: int) -> Optional[Dict[str, Any]]:
    frames = planets_json.get("frames") if isinstance(planets_json, dict) else None
    if not isinstance(frames, list) or not frames:
        return None

    # frames have "t_utc" like "2026-Feb-08 12:26Z"
    def parse_tutc(s: str) -> Optional[int]:
        if not s:
            return None
        s = str(s).strip()
        m = re.match(r"^(\d{4})-([A-Za-z]{3})-(\d{2})\s+(\d{2}):(\d{2})Z$", s)
        if not m:
            return None
        yy = int(m.group(1))
        mon3 = m.group(2).lower()
        dd = int(m.group(3))
        hh = int(m.group(4))
        mm = int(m.group(5))
        mmn = _MONTHS.get(mon3)
        if not mmn:
            return None
        return int(datetime(yy, mmn, dd, hh, mm).timestamp() * 1000)

    best = None
    best_dt = 10**30
    for f in frames:
        ts = parse_tutc(str(f.get("t_utc") or ""))
        if ts is None:
            continue
        dt = abs(ts - t_ms)
        if dt < best_dt:
            best_dt = dt
            best = f
    return best


def planets_candidates_for_night(planets_json: Dict[str, Any], when_local: datetime) -> List[Dict[str, Any]]:
    if not planets_json:
        return []

    t_ms = int(when_local.timestamp() * 1000)
    frame = pick_nearest_planets_frame(planets_json, t_ms)
    if not frame or not isinstance(frame.get("planets"), dict):
        return []

    out = []
    for key, b in frame["planets"].items():
        if not isinstance(b, dict):
            continue
        ra_deg = b.get("ra_deg")
        dec_deg = b.get("dec_deg")
        if ra_deg is None or dec_deg is None:
            continue
        try:
            ra_deg = float(ra_deg)
            dec_deg = float(dec_deg)
        except Exception:
            continue

        name = str(b.get("name") or key).strip()
        mag = b.get("mag")
        try:
            mag = float(mag) if mag is not None else None
        except Exception:
            mag = None

        out.append({
            "id": f"planet:{key}",
            "group": "planets",
            "type": "planet",
            "name": name,
            "ra_deg": ra_deg,
            "dec_deg": dec_deg,
            "mag": mag,
            "meta": {"planet_key": key}
        })

    return out


# -----------------------------
# DSO seed
# -----------------------------
def load_dso_seed(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        return []
    data = _read_json(path)
    if isinstance(data, dict) and isinstance(data.get("items"), list):
        return data["items"]
    if isinstance(data, list):
        return data
    return []


def dso_candidates(seed_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    out = []
    for it in seed_items:
        if not isinstance(it, dict):
            continue
        ra = it.get("ra_deg")
        dec = it.get("dec_deg")
        name = it.get("name") or it.get("name_en") or it.get("id")
        if ra is None or dec is None or not name:
            continue
        try:
            ra = float(ra)
            dec = float(dec)
        except Exception:
            continue

        out.append({
            "id": str(it.get("id") or f"dso:{name}"),
            "group": "dso",
            "type": str(it.get("type") or "dso"),
            "name": str(name),
            "ra_deg": ra,
            "dec_deg": dec,
            "mag": it.get("mag", None),
            "meta": {
                "catalog": it.get("catalog"),
                "tags": it.get("tags", []),
            }
        })
    return out


# -----------------------------
# Calendar -> candidates (with SIMBAD resolve)
# -----------------------------
def calendar_candidates_for_day(
    all_items: List[Dict[str, Any]],
    day_local: date,
    simbad_cache: Dict[str, Dict[str, float]]
) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []

    # De-dup within the day: prefer URL, else fallback to (title + object + date)
    seen: set = set()

    for it in all_items:
        d_iso = str(it.get("_event_date") or "")
        if d_iso != day_local.isoformat():
            continue

        title = str(it.get("title") or "")
        obj_name = extract_primary_object_name(title)
        if not obj_name:
            # If we cannot resolve a primary object, skip (keeps JSON clean for frontend).
            continue

        resolved = simbad_resolve_ra_dec(obj_name, simbad_cache)
        if not resolved:
            continue

        ra_deg, dec_deg = resolved

        url = it.get("url")
        url_key = str(url).strip().lower() if url else ""
        if url_key:
            dedup_key = ("url", url_key)
        else:
            dedup_key = ("t", d_iso, obj_name.strip().lower(), title.strip().lower())

        if dedup_key in seen:
            continue
        seen.add(dedup_key)

        # Stable id: URL-based if present; else fallback
        if url_key:
            ev_id = f"cal:{url_key}"
        else:
            ev_id = str(it.get("id") or f"cal:{obj_name}:{d_iso}")

        category = str(it.get("category") or "event").strip().lower()  # e.g. "CONJUNCTIONS" -> "conjunctions"

        out.append({
            "id": ev_id,
            "group": "calendar",
            "type": category,            # keep existing convention: type is category-like
            "name": obj_name,            # primary target name (for UI label)
            "title": title,
            "url": url,
            "published_at": it.get("published_at"),
            "summary": it.get("summary"),
            "ra_deg": float(ra_deg),
            "dec_deg": float(dec_deg),

            # Normalized event fields (additive, safe for frontend)
            "event_date": d_iso,
            "event_kind": category,
            "target_name": obj_name,

            "meta": {
                "calendar_source": it.get("source"),
                "calendar_stream": it.get("stream"),
                "date": d_iso,
            }
        })

    return out

# -----------------------------
# Scoring
# -----------------------------
def score_item(it, stats, group_weights, rules, day_local):
    """
    Returns: (score: float, breakdown: dict)

    Supports rules.yml:
      scoring:
        meridian_bonus: 12.0
    or
      scoring:
        meridian_bonus:
          max: 12.0
          window_deg: 10.0
    """

    def _safe_get(d, path, default=None):
        cur = d
        for k in path:
            if not isinstance(cur, dict) or k not in cur:
                return default
            cur = cur[k]
        return cur

    def _as_float(x, default=None):
        try:
            if x is None:
                return default
            if isinstance(x, bool):
                return float(1.0 if x else 0.0)
            if isinstance(x, (int, float)):
                return float(x)
            s = str(x).strip()
            if not s:
                return default
            return float(s)
        except Exception:
            return default

    def _clamp(v, a, b):
        return max(a, min(b, v))

    # ---- group weight
    group = it.get("group") or it.get("source_group") or "dso"
    w_group = _as_float(group_weights.get(group), 1.0) or 1.0

    scoring_cfg = _safe_get(rules, ["scoring"], {}) or {}

    # ---- altitude score
    w_alt = _as_float(_safe_get(scoring_cfg, ["altitude_weight"], 1.0), 1.0) or 1.0
    alt = it.get("alt_at_best_deg")
    if alt is None:
        alt = it.get("alt_max_deg")
    alt = _as_float(alt, 0.0) or 0.0
    alt_score = _clamp((alt / 90.0) * 100.0, 0.0, 100.0)

    # ---- time/darkness score (neutral if absent)
    w_time = _as_float(_safe_get(scoring_cfg, ["time_weight"], 1.0), 1.0) or 1.0
    time_score = 100.0
    if "darkness_score" in it:
        time_score = _clamp(_as_float(it.get("darkness_score"), 100.0) or 100.0, 0.0, 100.0)

    # ---- meridian bonus (number OR dict)
    mer_cfg = _safe_get(scoring_cfg, ["meridian_bonus"], 0.0)

    mer_max = 0.0
    mer_window_deg = 10.0

    if isinstance(mer_cfg, dict):
        mer_max = _as_float(
            mer_cfg.get("max", mer_cfg.get("value", mer_cfg.get("bonus", 12.0))),
            12.0
        ) or 0.0
        mer_window_deg = _as_float(
            mer_cfg.get("window_deg", mer_cfg.get("window", mer_cfg.get("deg_window", 10.0))),
            10.0
        ) or 10.0
    else:
        mer_max = _as_float(mer_cfg, 0.0) or 0.0

    mer_bonus = 0.0
    if mer_max > 0.0:
        ha = it.get("hour_angle_deg", it.get("ha_deg", None))
        if ha is not None:
            ha = abs(_as_float(ha, 9999.0) or 9999.0)
            if ha <= mer_window_deg:
                mer_bonus = mer_max * (1.0 - (ha / max(1e-6, mer_window_deg)))
        else:
            sep = it.get("meridian_sep_deg", None)
            if sep is not None:
                sep = abs(_as_float(sep, 9999.0) or 9999.0)
                if sep <= mer_window_deg:
                    mer_bonus = mer_max * (1.0 - (sep / max(1e-6, mer_window_deg)))

    raw = (w_alt * alt_score) + (w_time * time_score) + mer_bonus
    score = w_group * raw

    breakdown = {
        "group": group,
        "w_group": w_group,
        "alt_deg": alt,
        "alt_score": alt_score,
        "w_alt": w_alt,
        "time_score": time_score,
        "w_time": w_time,
        "mer_bonus": mer_bonus,
        "mer_max": mer_max,
        "mer_window_deg": mer_window_deg,
        "raw": raw,
        "score": score,
    }

    return float(score), breakdown
        

def group_weights_from_rules(rules: Dict[str, Any]) -> Dict[str, float]:
    gw = _safe_get(rules, ["groups"], {})
    out = {
        "calendar": 40.0,
        "planets": 25.0,
        "solar_system": 10.0,
        "dso": 0.0,
    }
    if isinstance(gw, dict):
        for k, v in gw.items():
            try:
                out[str(k)] = float(v)
            except Exception:
                pass
    return out


# -----------------------------
# Build one day
# -----------------------------
def build_day_items(
    day_local: date,
    tz_name: str,
    location: EarthLocation,
    planets_json: Optional[Dict[str, Any]],
    dso_seed_items: List[Dict[str, Any]],
    calendar_all_week: List[Dict[str, Any]],
    simbad_cache: Dict[str, Dict[str, float]],
    rules: Dict[str, Any],
) -> List[Dict[str, Any]]:
    t_start, t_end, times_utc, deep_mask, tz_off_min = make_night_times_utc(day_local, tz_name, STEP_MIN)

    # deep-night subset uses same times_utc; pass both
    deep_utc = times_utc

    # Candidates: calendar(day) + planets + dso seed
    # Planets frame time: just use dusk_local for selection
    import zoneinfo
    tz = zoneinfo.ZoneInfo(tz_name)
    dusk_local = datetime.combine(day_local, time(18, 0), tzinfo=tz)

    cal = calendar_candidates_for_day(calendar_all_week, day_local, simbad_cache)
    pls = planets_candidates_for_night(planets_json or {}, dusk_local) if planets_json else []
    dso = dso_candidates(dso_seed_items)

    print(f"[dbg] {day_local.isoformat()} calendar_all_week={len(calendar_all_week)} cal_candidates={len(cal)}")
    if not cal:
        # diagnose why: object extraction vs simbad
        n_day = 0
        n_no_obj = 0
        n_no_simbad = 0
        for it in calendar_all_week:
            if str(it.get("_event_date") or "") != day_local.isoformat():
                continue
            n_day += 1
            title = str(it.get("title") or "")
            obj = extract_primary_object_name(title)
            if not obj:
                n_no_obj += 1
                continue
            if not simbad_resolve_ra_dec(obj, simbad_cache):
                n_no_simbad += 1
        print(f"[dbg] {day_local.isoformat()} day_items={n_day} no_obj={n_no_obj} no_simbad={n_no_simbad}")


    candidates = cal + pls + dso

    group_weights = group_weights_from_rules(rules)
    scored: List[Tuple[float, Dict[str, Any]]] = []

    for it in candidates:
        ra = it.get("ra_deg")
        dec = it.get("dec_deg")
        if ra is None or dec is None:
            continue
        try:
            ra = float(ra)
            dec = float(dec)
        except Exception:
            continue

        stats = compute_visibility_stats(
            ra_deg=ra,
            dec_deg=dec,
            location=location,
            times_utc=times_utc,
            tz_offset_minutes=tz_off_min,
            deep_night_utc=deep_utc,
            deep_night_mask=deep_mask
        )

        # discard if never above horizon (calendar is allowed through even if bad/edge visibility)
        if stats.max_alt_deg <= 0.0 and str(it.get("group")) != "calendar":
            continue
        # IMPORTANT: do NOT filter out calendar by hours_up; calendar must be able to float to top
        # (visibility will still be reflected in score_breakdown + note)

        score, breakdown = score_item(it, stats, group_weights, rules, day_local)

        it2 = dict(it)
        it2["score"] = round(score, 3)
        it2["score_breakdown"] = breakdown
        it2["vis"] = {
            "max_alt_deg": round(stats.max_alt_deg, 2),
            "hours_up": round(stats.hours_up, 2),
            "best_time_local": stats.best_time_local.isoformat() if stats.best_time_local else None,
            "meridian_2to4_min_abs_ha_deg": round(stats.min_abs_hour_angle_deg_2to4, 2)
            if stats.min_abs_hour_angle_deg_2to4 is not None else None,
        }
        it2["note"] = make_note(str(it2.get("group")), str(it2.get("name") or ""), stats)

        scored.append((score, it2))

    # Ensure calendar is always ahead of non-calendar, while preserving score ordering within group.
    def _sort_key(pair: Tuple[float, Dict[str, Any]]):
        sc, item = pair
        g = str(item.get("group") or "")
        pri = 0 if g == "calendar" else 1
        return (pri, -sc)

    scored.sort(key=_sort_key)

    max_items = int(_safe_get(rules, ["global", "max_items"], 30))
    out = [x[1] for x in scored[:max_items]]

    return out


# -----------------------------
# Main
# -----------------------------
def main() -> None:
    sources = yaml.safe_load(SOURCES_YML.read_text(encoding="utf-8")) if SOURCES_YML.exists() else {}
    rules   = yaml.safe_load(RULES_YML.read_text(encoding="utf-8"))   if RULES_YML.exists() else {}

    tz_name = str(_safe_get(rules, ["global", "timezone"], "Europe/Warsaw"))

    # Inputs
    planets_path = STAGING_DATA_DIR / "planets.json"
    planets_json = _read_json(planets_path) if planets_path.exists() else None

    dso_seed_path = STAGING_DATA_DIR / "dso_seed.json"
    dso_seed_items = load_dso_seed(dso_seed_path)

    daily_signal_items = load_calendar_daily_signal(CALENDAR_DAILY_SIGNAL)

    # week window (local)
    import zoneinfo
    tz = zoneinfo.ZoneInfo(tz_name)
    today_local = datetime.now(tz).date()

    calendar_week = calendar_items_for_window(daily_signal_items, today_local, DAYS)

    print(f"[dbg] daily_signal_items: {len(daily_signal_items)}")
    print(f"[dbg] calendar_week: {len(calendar_week)} window {today_local.isoformat()} -> {(today_local + timedelta(days=DAYS)).isoformat()}")
    # show per-day counts
    by_day = {}
    for it in calendar_week:
        d = it.get("_event_date")
        by_day[d] = by_day.get(d, 0) + 1
    print("[dbg] calendar_week by _event_date:", by_day)
    if calendar_week:
        print("[dbg] sample titles:")
        for it in calendar_week[:5]:
            print("   ", it.get("_event_date"), "|", (it.get("title") or "")[:120])

    # SIMBAD cache
    SERVICES_DATA_DIR.mkdir(parents=True, exist_ok=True)
    simbad_cache = load_simbad_cache()

    # location
    location = EarthLocation(
        lat=SITE_LAT_DEG * u.deg,
        lon=SITE_LON_DEG * u.deg,
        height=(SITE_ELEV_KM * 1000.0) * u.m
    )

    frames = []
    today_items: List[Dict[str, Any]] = []

    for di in range(DAYS):
        d = today_local + timedelta(days=di)
        items = build_day_items(
            day_local=d,
            tz_name=tz_name,
            location=location,
            planets_json=planets_json,
            dso_seed_items=dso_seed_items,
            calendar_all_week=calendar_week,
            simbad_cache=simbad_cache,
            rules=rules
        )

        frames.append({
            "date_local": d.isoformat(),
            "items": items
        })

        if di == 0:
            today_items = items

    # persist SIMBAD cache
    save_simbad_cache(simbad_cache)

    generated_at = _utc_now_iso()

    out_week = {
        "version": 1,
        "generated_at": generated_at,
        "site": {"lat": SITE_LAT_DEG, "lon": SITE_LON_DEG, "elev_km": SITE_ELEV_KM, "tz": tz_name},
        "days": DAYS,
        "step_min": STEP_MIN,
        "sources": {
            "calendar": str(CALENDAR_DAILY_SIGNAL),
            "planets": str(planets_path) if planets_path.exists() else None,
            "dso_seed": str(dso_seed_path) if dso_seed_path.exists() else None
        },
        "frames": frames
    }

    out_today = {
        "version": 1,
        "generated_at": generated_at,
        "site": out_week["site"],
        "days": 1,
        "step_min": STEP_MIN,
        "items": today_items
    }

    # Write staging
    week_path_staging = STAGING_DATA_DIR / OUT_WEEK_FILENAME
    today_path_staging = STAGING_DATA_DIR / OUT_TODAY_FILENAME
    _write_json(week_path_staging, out_week)
    _write_json(today_path_staging, out_today)

    # Copy to services generated
    week_path_services = SERVICES_DATA_DIR / OUT_WEEK_FILENAME
    today_path_services = SERVICES_DATA_DIR / OUT_TODAY_FILENAME
    _write_json(week_path_services, out_week)
    _write_json(today_path_services, out_today)

    # Summary
    group_counts = {}
    for it in today_items:
        g = it.get("group") or "unknown"
        group_counts[g] = group_counts.get(g, 0) + 1

    print(f"[ok] wrote: {today_path_staging}")
    print(f"[ok] wrote: {week_path_staging}")
    print(f"[ok] copied: {today_path_services}")
    print(f"[ok] copied: {week_path_services}")
    print(f"[ok] picked: {len(today_items)} items; group counts: {group_counts}")


if __name__ == "__main__":
    main()