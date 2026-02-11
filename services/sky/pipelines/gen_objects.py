#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_objects.py

Builds a compact "best objects tonight" list for amateurs (max 25–30),
for each of the next N days, using:
  1) Calendar events (daily_signal.json)  -> MUST be near top
  2) Planets (planets.json)              -> MUST stay near top when visible
  3) DSO seed list (dso_messier.json)    -> fills the tail, seasonally

Outputs:
  - sites/staging/sky/data/objects_week.json   (frames[0..DAYS-1])
  - sites/staging/sky/data/objects_today.json  (compat: frames[0].items)
Also copies the same to:
  - services/sky/data/generated/

Important:
  - This script only prepares JSON. Frontend is not touched.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import datetime, timedelta, time, date
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import yaml

import astropy.units as u
from astropy.coordinates import AltAz, EarthLocation, SkyCoord, get_body, get_sun
from astropy.time import Time

# astroquery is used only for calendar object name resolution (SIMBAD)
from astroquery.simbad import Simbad


# -----------------------------
# Paths
# -----------------------------
PROJECT_ROOT = Path(__file__).resolve().parents[3]

SERVICES_DATA_DIR = PROJECT_ROOT / "services" / "sky" / "data" / "generated"
STAGING_DATA_DIR = PROJECT_ROOT / "sites" / "staging" / "sky" / "data"

YAML_DIR = PROJECT_ROOT / "services" / "sky" / "pipelines" / "yml"
SOURCES_YML = YAML_DIR / "sources.yml"
RULES_YML = YAML_DIR / "rules.yml"

CALENDAR_DAILY_SIGNAL = PROJECT_ROOT / "sites" / "staging" / "calendar" / "daily_signal.json"

OUT_WEEK_FILENAME = "objects_week.json"
OUT_TODAY_FILENAME = "objects_today.json"

SIMBAD_CACHE_PATH = SERVICES_DATA_DIR / "simbad_cache.json"
MESSIER_DSO_PATH = SERVICES_DATA_DIR / "dso_messier.json"


# -----------------------------
# Config (defaults; overridden by rules.yml if present)
# -----------------------------
DAYS = 7
STEP_MIN = 10

# Default location (Warsaw).
SITE_LAT_DEG = 52.2297
SITE_LON_DEG = 21.0122  # East positive
SITE_ELEV_KM = 0.10     # ~100 m


# -----------------------------
# Helpers
# -----------------------------
def utc_now_iso() -> str:
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


def hour_angle_deg_at_time_local(
    ra_deg: float,
    dec_deg: float,
    location: EarthLocation,
    dt_local: datetime,
) -> float:
    """
    Hour angle (HA) of (ra,dec) at a specific LOCAL datetime (timezone-aware).
    Returns HA in degrees wrapped to [-180, +180].
    Positive HA means object is west of meridian (past culmination).
    """
    import zoneinfo

    if dt_local.tzinfo is None:
        raise ValueError("dt_local must be timezone-aware (tzinfo set)")

    dt_utc = dt_local.astimezone(zoneinfo.ZoneInfo("UTC"))
    t = Time([dt_utc])

    coord = SkyCoord(ra=ra_deg * u.deg, dec=dec_deg * u.deg, frame="icrs")
    lst = t.sidereal_time("apparent", longitude=location.lon)  # Angle array len=1
    ha = (lst - coord.ra).wrap_at(180 * u.deg)

    return float(np.asarray(ha.deg, dtype=float)[0])

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


# --- added: robust name variants for SIMBAD (minimal but effective) ---
_CONST_GENITIVE_TO_ABBR = {
    "andromedae": "And",
    "aquarii": "Aqr",
    "aquilae": "Aql",
    "arianis": "Ari",
    "arietis": "Ari",
    "aurigae": "Aur",
    "boötis": "Boo",
    "bootis": "Boo",
    "cancri": "Cnc",
    "canis majoris": "CMa",
    "canis minoris": "CMi",
    "capricorni": "Cap",
    "cassiopeiae": "Cas",
    "centauri": "Cen",
    "cephei": "Cep",
    "ceti": "Cet",
    "columbae": "Col",
    "corvi": "Crv",
    "coronae borealis": "CrB",
    "coronae australis": "CrA",
    "crucis": "Cru",
    "cygni": "Cyg",
    "delphini": "Del",
    "draconis": "Dra",
    "equulei": "Equ",
    "eridani": "Eri",
    "geminorum": "Gem",
    "herculis": "Her",
    "hydrae": "Hya",
    "leonis": "Leo",
    "librae": "Lib",
    "lyrae": "Lyr",
    "ophiuchi": "Oph",
    "orionis": "Ori",
    "pegasi": "Peg",
    "persei": "Per",
    "piscis austrini": "PsA",
    "piscis austrinus": "PsA",
    "piscis": "Psc",
    "sagittarii": "Sgr",
    "scorpii": "Sco",
    "tauri": "Tau",
    "ursae majoris": "UMa",
    "ursae minoris": "UMi",
    "virginis": "Vir",
}

_GREEK_WORD_TO_BAYER = {
    "alpha": "alf",
    "beta": "bet",
    "gamma": "gam",
    "delta": "del",
    "epsilon": "eps",
    "zeta": "zet",
    "eta": "eta",
    "theta": "tet",
    "iota": "iot",
    "kappa": "kap",
    "lambda": "lam",
    "mu": "mu",
    "nu": "nu",
    "xi": "ksi",
    "omicron": "omi",
    "pi": "pi",
    "rho": "rho",
    "sigma": "sig",
    "tau": "tau",
    "upsilon": "ups",
    "phi": "phi",
    "chi": "chi",
    "psi": "psi",
    "omega": "ome",
}


def _simbad_name_variants(name: str) -> List[str]:
    """
    Produce a small set of robust SIMBAD query variants.
    Example: "Sigma Sagittarii" -> ["Sigma Sagittarii", "Sigma Sgr", "sig Sgr", "sig Sagittarii"]
    """
    q = " ".join((name or "").strip().split())
    if not q:
        return []

    variants: List[str] = []
    def _add(s: str):
        s2 = " ".join((s or "").strip().split())
        if s2 and s2 not in variants:
            variants.append(s2)

    _add(q)

    parts = q.split(" ")
    if len(parts) >= 2:
        greek = parts[0].strip()
        const_gen = " ".join(parts[1:]).strip()
        const_key = const_gen.lower()

        abbr = _CONST_GENITIVE_TO_ABBR.get(const_key)
        if abbr:
            _add(f"{greek} {abbr}")

            bayer = _GREEK_WORD_TO_BAYER.get(greek.lower())
            if bayer:
                _add(f"{bayer} {abbr}")
                _add(f"{bayer} {const_gen}")

    return variants


def simbad_resolve_ra_dec(name: str, cache: Dict[str, Dict[str, float]]) -> Optional[Tuple[float, float]]:
    """
    Resolve a target name to (ra_deg, dec_deg) using SIMBAD, with cache.
    """
    q0 = (name or "").strip()
    if not q0:
        return None

    # Try exact cache hit first
    key0 = q0.lower()
    if key0 in cache:
        v = cache[key0]
        ra = v.get("ra_deg")
        dec = v.get("dec_deg")
        if isinstance(ra, (int, float)) and isinstance(dec, (int, float)):
            return float(ra), float(dec)

    queries = _simbad_name_variants(q0)

    for q in queries:
        key = q.lower()
        if key in cache:
            v = cache[key]
            ra = v.get("ra_deg")
            dec = v.get("dec_deg")
            if isinstance(ra, (int, float)) and isinstance(dec, (int, float)):
                return float(ra), float(dec)

        try:
            custom = Simbad()
            custom.add_votable_fields("ra(d)", "dec(d)")
            r = custom.query_object(q)
            if r is None or len(r) == 0:
                continue
            ra_deg = float(r["RA_d"][0])
            dec_deg = float(r["DEC_d"][0])
            cache[key] = {"ra_deg": ra_deg, "dec_deg": dec_deg}

            # also write-through to original key to avoid repeated misses on "Sigma Sagittarii"
            cache.setdefault(key0, {"ra_deg": ra_deg, "dec_deg": dec_deg})
            return ra_deg, dec_deg
        except Exception:
            continue

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

# --- added: display name extraction from title ---
_RE_CAL_TITLE_PREFIX = re.compile(
    r"^\s*\d{1,2}\s+[A-Za-z]{3}\s+\d{4}\s*(?:\([^)]*\))?\s*:\s*(.+?)\s*$"
)


def calendar_display_name_from_title(title: str) -> str:
    """
    Convert daily_signal title into a human display label:
      "13 Feb 2026 (5 days away): Lunar occultation of Sigma Sagittarii"
    -> "Lunar occultation of Sigma Sagittarii"
    Fallback: original title stripped.
    """
    t = (title or "").strip()
    if not t:
        return ""
    m = _RE_CAL_TITLE_PREFIX.match(t)
    if m:
        tail = (m.group(1) or "").strip()
        return tail or t
    return t


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
        bad = {"moon", "lunar", "sun", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune"}
        a_l = a.lower()
        b_l = b.lower()
        if any(k in a_l for k in bad) and not any(k in b_l for k in bad):
            return b
        if any(k in b_l for k in bad) and not any(k in a_l for k in bad):
            return a
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
    Deduplicate by:
      - (event_date, url) if url exists
      - else (event_date, normalized_title)
    """
    if not items or days <= 0:
        return []

    end_d = start_d + timedelta(days=days)
    out: List[Dict[str, Any]] = []

    def _norm_title_for_dedup(title: str) -> str:
        s = (title or "").strip()
        if not s:
            return ""
        if ":" in s:
            left, right = s.split(":", 1)
            if _RE_TITLE_DATE.match(left.strip()):
                s = right.strip()
        return " ".join(s.lower().split())

    for it in items:
        if not isinstance(it, dict):
            continue

        title = str(it.get("title") or "")
        d = parse_event_date_from_title(title)

        if d is None:
            pa = str(it.get("published_at") or "").strip()
            if len(pa) >= 10:
                try:
                    d = datetime.fromisoformat(pa[:10]).date()
                except Exception:
                    d = None

        if d is None or not (start_d <= d < end_d):
            continue

        it2 = dict(it)
        it2["_event_date"] = d.isoformat()
        it2["_norm_title"] = _norm_title_for_dedup(title)

        prim = extract_primary_object_name(title)
        if prim:
            it2["_primary_object"] = prim.lower().strip()

        out.append(it2)

    dedup: Dict[tuple, Dict[str, Any]] = {}
    for it in out:
        ds = str(it.get("_event_date") or "")
        url = str(it.get("url") or "").strip()
        nt = str(it.get("_norm_title") or "").strip()
        key = (ds, "url", url) if url else (ds, "title", nt)

        if key not in dedup:
            dedup[key] = it
            continue

        try:
            s_new = float(it.get("score") or 0.0)
            s_old = float(dedup[key].get("score") or 0.0)
        except Exception:
            s_new, s_old = 0.0, 0.0
        if s_new > s_old:
            dedup[key] = it

    result = list(dedup.values())

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
# Messier DSO catalog loading
# -----------------------------
def load_messier_dso_items(path: Path) -> List[Dict[str, Any]]:
    """
    Loads ready Messier catalog JSON produced by gen_messier.py.
    Expected:
      { "items": [ {id,name,ra_deg,dec_deg,...}, ... ] }

    IMPORTANT:
      Some pipelines export RA in HOURS (0..24) but name the field ra_deg.
      Auto-detect: if max(ra) <= ~24.1, treat as hours and convert to degrees (ra *= 15).
    """
    if not path.exists():
        print(f"[err] Messier DSO json not found: {path}")
        return []

    try:
        data = _read_json(path)
    except Exception as e:
        print(f"[err] Failed to read Messier DSO json: {path} ({e})")
        return []

    if not isinstance(data, dict):
        print(f"[err] Messier DSO json has invalid root type: {type(data)}")
        return []

    items = data.get("items")
    if not isinstance(items, list) or not items:
        n = data.get("n")
        print(f"[err] Messier DSO json loaded but items empty/invalid: {path} (n={n})")
        return []

    parsed: List[Dict[str, Any]] = []
    bad = 0
    ra_vals: List[float] = []

    for it in items:
        if not isinstance(it, dict):
            bad += 1
            continue
        if it.get("ra_deg") is None or it.get("dec_deg") is None:
            bad += 1
            continue
        try:
            ra = float(it["ra_deg"])
            dec = float(it["dec_deg"])
        except Exception:
            bad += 1
            continue

        ra_vals.append(ra)
        it2 = dict(it)
        it2["ra_deg"] = ra
        it2["dec_deg"] = dec
        it2.setdefault("group", "dso")
        it2.setdefault("type", "dso")
        parsed.append(it2)

    if bad:
        print(f"[warn] Messier DSO: skipped {bad} invalid rows (kept {len(parsed)})")

    if not parsed:
        return []

    max_ra = max(ra_vals) if ra_vals else 0.0
    ra_is_hours = (max_ra <= 24.1)

    if ra_is_hours:
        print(f"[warn] Messier DSO: RA looks like HOURS (max_ra={max_ra:.3f}). Converting ra_deg = ra_hours * 15.")
        for it in parsed:
            it["ra_deg"] = float(it["ra_deg"]) * 15.0

    for it in parsed:
        it["ra_deg"] = float(it["ra_deg"]) % 360.0

    return parsed


def dso_candidates(messier_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for it in messier_items or []:
        if not isinstance(it, dict):
            continue
        ra = it.get("ra_deg")
        dec = it.get("dec_deg")
        if ra is None or dec is None:
            continue
        try:
            ra = float(ra)
            dec = float(dec)
        except Exception:
            continue

        mid = str(it.get("id") or "").strip()
        name = str(it.get("name") or mid or "DSO").strip()

        it2 = dict(it)
        it2["id"] = mid or name.lower().replace(" ", "_")
        it2["group"] = "dso"
        it2["type"] = str(it2.get("type") or "dso")
        it2["name"] = name
        it2["ra_deg"] = ra
        it2["dec_deg"] = dec
        out.append(it2)
    return out


# -----------------------------
# Night grid + masks
# -----------------------------
def make_night_times_utc(
    day_local: date,
    tz_name: str,
    location: EarthLocation,
    step_min: int,
) -> Tuple[datetime, datetime, Time, np.ndarray, int, np.ndarray, np.ndarray]:
    """
    Returns:
      t_start_utc, t_end_utc,
      times_utc (astropy Time),
      deep_mask: local 02:00-04:00 AND dark AND moon_down
      tz_off_min,
      dark_mask: Sun altitude < -18 deg
      moon_down_mask: Moon altitude < 0 deg
    """
    import zoneinfo

    tz = zoneinfo.ZoneInfo(tz_name)

    start_local = datetime.combine(day_local, time(16, 0), tzinfo=tz)
    end_local = datetime.combine(day_local + timedelta(days=1), time(9, 0), tzinfo=tz)

    tz_off = start_local.utcoffset()
    tz_off_min = int((tz_off.total_seconds() // 60) if tz_off is not None else 0)

    step = timedelta(minutes=int(step_min))
    local_times: List[datetime] = []
    t = start_local
    while t <= end_local:
        local_times.append(t)
        t += step

    utc_times = [lt.astimezone(zoneinfo.ZoneInfo("UTC")) for lt in local_times]
    times_utc = Time(utc_times)

    aa = AltAz(obstime=times_utc, location=location)

    sun_alt = get_sun(times_utc).transform_to(aa).alt.deg
    moon_alt = get_body("moon", times_utc).transform_to(aa).alt.deg

    sun_alt = np.asarray(sun_alt, dtype=float)
    moon_alt = np.asarray(moon_alt, dtype=float)

    dark_mask = sun_alt < -18.0
    moon_down_mask = moon_alt < 0.0

    deep_local_mask = np.array([(lt.hour >= 2 and lt.hour < 4) for lt in local_times], dtype=bool)
    deep_mask = deep_local_mask & dark_mask & moon_down_mask

    t_start_utc = utc_times[0].replace(tzinfo=None)
    t_end_utc = utc_times[-1].replace(tzinfo=None)

    return t_start_utc, t_end_utc, times_utc, deep_mask, tz_off_min, dark_mask, moon_down_mask


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

    max_alt_deg_quality: Optional[float]
    best_time_local_quality: Optional[datetime]
    min_abs_hour_angle_deg_quality: Optional[float]
    quality_mask_used: Optional[str]

    # meridian moment (upper/lower disambiguated) in QUALITY window
    alt_at_meridian_quality: Optional[float] = None
    best_time_local_meridian_quality: Optional[datetime] = None

    # meridian moment (upper/lower disambiguated) in DEEP (02–04) window
    alt_at_meridian_deep: Optional[float] = None
    best_time_local_meridian_deep: Optional[datetime] = None


def compute_visibility_stats(
    ra_deg: float,
    dec_deg: float,
    location: EarthLocation,
    times_utc: Time,
    tz_offset_minutes: int,
    deep_mask: np.ndarray,
    dark_mask: np.ndarray,
    moon_down_mask: np.ndarray,
) -> VisibilityStats:
    coord = SkyCoord(ra=ra_deg * u.deg, dec=dec_deg * u.deg, frame="icrs")
    aa = AltAz(obstime=times_utc, location=location)
    altaz = coord.transform_to(aa)
    alt_deg = np.array(altaz.alt.deg, dtype=float)

    up = alt_deg > 0.0
    if len(times_utc) >= 2:
        dt_min = float((times_utc[1].jd - times_utc[0].jd) * 24 * 60)
    else:
        dt_min = float(STEP_MIN)

    hours_up = float(np.sum(up) * dt_min / 60.0)
    max_alt = float(np.nanmax(alt_deg)) if alt_deg.size else -90.0

    best_time_local = None
    if alt_deg.size:
        i_best = int(np.nanargmax(alt_deg))
        t_best_utc = times_utc[i_best].to_datetime(timezone=None)
        best_time_local = t_best_utc + timedelta(minutes=tz_offset_minutes)

    def _meridian_moment(mask: np.ndarray) -> Tuple[Optional[float], Optional[datetime], Optional[float]]:
        """
        Returns: (alt_at_meridian, best_time_local_meridian, min_abs_ha_deg)
        Meridian moment is selected as min(|HA|) within mask; if tie within eps, pick max altitude.
        """
        if mask is None or not np.any(mask):
            return None, None, None

        idxs = np.where(mask)[0]
        t_sel = times_utc[mask]
        lst = t_sel.sidereal_time("apparent", longitude=location.lon)
        ha = (lst - coord.ra).wrap_at(180 * u.deg)
        abs_ha = np.abs(ha.deg)

        if abs_ha.size == 0:
            return None, None, None

        min_abs_ha = float(np.nanmin(abs_ha))

        eps = 0.25  # degrees
        cand_local = idxs[np.where(abs_ha <= (min_abs_ha + eps))[0]]
        if cand_local.size == 0:
            return None, None, min_abs_ha

        cand_alts = alt_deg[cand_local]
        j = int(cand_local[int(np.nanargmax(cand_alts))])

        alt_at_mer = float(alt_deg[j])
        t_mer_utc = times_utc[j].to_datetime(timezone=None)
        bt_local_mer = t_mer_utc + timedelta(minutes=tz_offset_minutes)

        return alt_at_mer, bt_local_mer, min_abs_ha

    # deep window (02–04 & dark & moon_down)
    alt_mer_deep, bt_mer_deep, min_abs_ha_dn = _meridian_moment(deep_mask)
    meridian_hit = (min_abs_ha_dn is not None and min_abs_ha_dn <= 10.0)

    # quality window: dark+moon_down else dark
    q_used = None
    q_mask = None
    dm = dark_mask & moon_down_mask
    if np.any(dm):
        q_used = "dark+moon_down"
        q_mask = dm
    elif np.any(dark_mask):
        q_used = "dark"
        q_mask = dark_mask

    max_alt_q = None
    best_time_local_q = None
    min_abs_ha_q = None
    alt_mer_q = None
    bt_mer_q = None

    if q_mask is not None and np.any(q_mask):
        alt_q = alt_deg[q_mask]
        max_alt_q = float(np.nanmax(alt_q)) if alt_q.size else None

        idxs_q = np.where(q_mask)[0]
        if idxs_q.size:
            i_local = int(idxs_q[int(np.nanargmax(alt_q))])
            t_best_utc_q = times_utc[i_local].to_datetime(timezone=None)
            best_time_local_q = t_best_utc_q + timedelta(minutes=tz_offset_minutes)

        alt_mer_q, bt_mer_q, min_abs_ha_q = _meridian_moment(q_mask)

    return VisibilityStats(
        max_alt_deg=max_alt,
        hours_up=hours_up,
        best_time_local=best_time_local,
        meridian_bonus_hit=meridian_hit,
        min_abs_hour_angle_deg_2to4=min_abs_ha_dn,

        max_alt_deg_quality=max_alt_q,
        best_time_local_quality=best_time_local_q,
        min_abs_hour_angle_deg_quality=min_abs_ha_q,
        quality_mask_used=q_used,

        alt_at_meridian_quality=alt_mer_q,
        best_time_local_meridian_quality=bt_mer_q,

        alt_at_meridian_deep=alt_mer_deep,
        best_time_local_meridian_deep=bt_mer_deep,
    )


def altitude_at_time_local(
    ra_deg: float,
    dec_deg: float,
    location: EarthLocation,
    dt_local: datetime,
) -> float:
    """
    Altitude of (ra,dec) at a specific LOCAL datetime (timezone-aware).
    Returns altitude in degrees.
    """
    import zoneinfo

    if dt_local.tzinfo is None:
        raise ValueError("dt_local must be timezone-aware (tzinfo set)")

    dt_utc = dt_local.astimezone(zoneinfo.ZoneInfo("UTC"))
    t = Time([dt_utc])

    coord = SkyCoord(ra=ra_deg * u.deg, dec=dec_deg * u.deg, frame="icrs")
    aa = AltAz(obstime=t, location=location)
    alt = coord.transform_to(aa).alt.deg

    return float(np.asarray(alt, dtype=float)[0])




def make_note(
    group: str,
    name: str,
    stats: VisibilityStats,
    best_time_override: Optional[datetime] = None,
    alt_override: Optional[float] = None,
) -> str:
    bt = best_time_override if best_time_override is not None else stats.best_time_local
    if bt is None:
        return f"{name}: visibility unknown."

    alt = float(alt_override) if alt_override is not None else float(stats.max_alt_deg)
    t = bt.strftime("%H:%M")

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
    elif group == "dso" and stats.quality_mask_used:
        base += f" (quality: {stats.quality_mask_used})"

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

    def parse_tutc_ms(s: str) -> Optional[int]:
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
        ts = parse_tutc_ms(str(f.get("t_utc") or ""))
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

    out: List[Dict[str, Any]] = []
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
            "meta": {"planet_key": key},
        })

    return out


# -----------------------------
# Calendar -> candidates
# -----------------------------
def calendar_candidates_for_day(
    all_items: List[Dict[str, Any]],
    day_local: date,
    simbad_cache: Dict[str, Dict[str, float]],
) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    seen: set = set()

    for it in all_items:
        d_iso = str(it.get("_event_date") or "")
        if d_iso != day_local.isoformat():
            continue

        title = str(it.get("title") or "")
        obj_name = extract_primary_object_name(title)
        if not obj_name:
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

        ev_id = f"cal:{url_key}" if url_key else str(it.get("id") or f"cal:{obj_name}:{d_iso}")
        category = str(it.get("category") or "event").strip().lower()

        # --- changed: display name from title; keep target_name for search/linking ---
        display_name = calendar_display_name_from_title(title) or obj_name

        out.append({
            "id": ev_id,
            "group": "calendar",
            "type": category,
            "name": display_name,          # was obj_name
            "title": title,
            "url": url,
            "published_at": it.get("published_at"),
            "summary": it.get("summary"),
            "ra_deg": float(ra_deg),
            "dec_deg": float(dec_deg),

            "event_date": d_iso,
            "event_kind": category,
            "target_name": obj_name,       # keep raw target for search

            "meta": {
                "calendar_source": it.get("source"),
                "calendar_stream": it.get("stream"),
                "date": d_iso,
            },
        })

    return out


# -----------------------------
# Scoring
# -----------------------------
def group_weights_from_rules(rules: Dict[str, Any]) -> Dict[str, float]:
    gw = _safe_get(rules, ["groups"], {})
    out = {
        "calendar": 40.0,
        "planets": 25.0,
        "dso": 5.0,
    }
    if isinstance(gw, dict):
        for k, v in gw.items():
            try:
                out[str(k)] = float(v)
            except Exception:
                pass
    return out


def score_item(
    it: Dict[str, Any],
    stats: VisibilityStats,
    group_weights: Dict[str, float],
    rules: Dict[str, Any],
) -> Tuple[float, Dict[str, Any]]:
    def _as_float(x, default=0.0):
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

    def _cfg_num_or_dict(cfg, default_max, default_window):
        if isinstance(cfg, dict):
            mx = _as_float(cfg.get("max", cfg.get("value", cfg.get("bonus", default_max))), default_max)
            wd = _as_float(cfg.get("window_deg", cfg.get("window", cfg.get("deg_window", default_window))), default_window)
            return mx, wd
        return _as_float(cfg, default_max), default_window

    group = str(it.get("group") or "dso")
    w_group = _as_float(group_weights.get(group, 1.0), 1.0)

    scoring_cfg = _safe_get(rules, ["scoring"], {}) or {}
    w_alt = _as_float(scoring_cfg.get("altitude_weight", 0.35), 0.35)
    w_time = _as_float(scoring_cfg.get("time_weight", 0.0), 0.0)

    # Prefer QUALITY metrics when present
    alt_q = stats.max_alt_deg_quality if stats.max_alt_deg_quality is not None else stats.max_alt_deg
    alt_q = _as_float(alt_q, 0.0)

    ha_q = getattr(stats, "min_abs_hour_angle_deg_quality", None)
    ha_dn = getattr(stats, "min_abs_hour_angle_deg_2to4", None)
    q_used = getattr(stats, "quality_mask_used", None) or "all"

    alt_mer_q = getattr(stats, "alt_at_meridian_quality", None)
    alt_mer_dn = getattr(stats, "alt_at_meridian_deep", None)

    ALT_FLOOR = _as_float(scoring_cfg.get("dso_alt_floor_deg", 12.0), 12.0)
    ALT_FULL = _as_float(scoring_cfg.get("dso_alt_full_deg", 45.0), 45.0)

    def _alt_to_norm(alt_deg_val: float) -> float:
        if alt_deg_val <= ALT_FLOOR:
            return 0.0
        return _clamp((alt_deg_val - ALT_FLOOR) / max(1e-6, (ALT_FULL - ALT_FLOOR)), 0.0, 1.0)

    alt_norm_q = _alt_to_norm(float(alt_q))
    alt_score = alt_norm_q * 100.0
    time_score = 100.0

    # DSO meridian bonus (QUALITY): altitude gated + uses altitude AT MERIDIAN
    mer_cfg = scoring_cfg.get("meridian_bonus", {"max": 80.0, "window_deg": 20.0})
    mer_max, mer_window = _cfg_num_or_dict(mer_cfg, default_max=80.0, default_window=20.0)
    MER_ALT_GATE = _as_float(scoring_cfg.get("dso_meridian_alt_gate_deg", 20.0), 20.0)

    mer_term = 0.0
    mer_bonus = 0.0
    if ha_q is not None and mer_max > 0.0 and alt_mer_q is not None:
        ha = abs(float(ha_q))
        if ha <= mer_window and float(alt_mer_q) >= MER_ALT_GATE:
            mer_term = 1.0 - (ha / max(1e-6, mer_window))
            mer_bonus = mer_max * mer_term * _alt_to_norm(float(alt_mer_q))

    # Deep-night bonus (02–04): also altitude gated + uses altitude AT MERIDIAN in deep window
    dn_cfg = scoring_cfg.get("deep_night_bonus", {"max": 20.0, "window_deg": 20.0})
    dn_max, dn_window = _cfg_num_or_dict(dn_cfg, default_max=20.0, default_window=20.0)

    dn_term = 0.0
    dn_bonus = 0.0
    deep_night_allowed = (ha_dn is not None and alt_mer_dn is not None)
    if deep_night_allowed and dn_max > 0.0:
        ha = abs(float(ha_dn))
        if ha <= dn_window and float(alt_mer_dn) >= MER_ALT_GATE:
            dn_term = 1.0 - (ha / max(1e-6, dn_window))
            dn_bonus = dn_max * dn_term * _alt_to_norm(float(alt_mer_dn))

    if group == "dso":
        raw = (w_alt * alt_score) + mer_bonus + dn_bonus + (w_time * time_score)
    else:
        alt_score_simple = _clamp((float(stats.max_alt_deg) / 90.0) * 100.0, 0.0, 100.0)
        raw = (1.0 * alt_score_simple) + (w_time * time_score)

    score = w_group * raw

    breakdown = {
        "group": group,
        "w_group": w_group,
        "quality_mask_used": q_used,

        "alt_q_deg": float(alt_q),
        "alt_meridian_q_deg": (float(alt_mer_q) if alt_mer_q is not None else None),
        "alt_meridian_deep_deg": (float(alt_mer_dn) if alt_mer_dn is not None else None),

        "alt_floor_deg": ALT_FLOOR,
        "alt_full_deg": ALT_FULL,
        "alt_norm_q": alt_norm_q,
        "alt_score": alt_score,
        "w_alt": w_alt,

        "dso_meridian_alt_gate_deg": MER_ALT_GATE,

        "ha_q_min_abs_deg": (float(ha_q) if ha_q is not None else None),
        "mer_term": mer_term,
        "mer_bonus": mer_bonus,
        "mer_max": mer_max,
        "mer_window_deg": mer_window,

        "ha_dn_min_abs_deg": (float(ha_dn) if ha_dn is not None else None),
        "deep_night_allowed": bool(deep_night_allowed),
        "deep_night_term": dn_term,
        "deep_night_bonus": dn_bonus,
        "deep_night_max": dn_max,
        "deep_night_window_deg": dn_window,

        "w_time": w_time,
        "time_score": time_score,

        "raw": raw,
        "score": score,
    }
    return float(score), breakdown


# -----------------------------
# Build one day
# -----------------------------
def build_day_items(
    day_local: date,
    tz_name: str,
    location: EarthLocation,
    planets_json: Optional[Dict[str, Any]],
    calendar_all_week: List[Dict[str, Any]],
    messier_items: List[Dict[str, Any]],
    simbad_cache: Dict[str, Dict[str, float]],
    rules: Dict[str, Any],
) -> List[Dict[str, Any]]:
    t_start, t_end, times_utc, deep_mask, tz_off_min, dark_mask, moon_down_mask = make_night_times_utc(
        day_local, tz_name, location, STEP_MIN
    )

    print(
        f"[dbg] {day_local} night_grid: {t_start}Z -> {t_end}Z | "
        f"masks: deep={int(deep_mask.sum())} dark={int(dark_mask.sum())} moon_down={int(moon_down_mask.sum())} n={len(times_utc)}"
    )

    import zoneinfo
    tz = zoneinfo.ZoneInfo(tz_name)
    dusk_local = datetime.combine(day_local, time(18, 0), tzinfo=tz)

    cal = calendar_candidates_for_day(calendar_all_week, day_local, simbad_cache)
    pls = planets_candidates_for_night(planets_json or {}, dusk_local) if planets_json else []
    dso = dso_candidates(messier_items)

    candidates = cal + pls + dso
    group_weights = group_weights_from_rules(rules)

    scored_items: List[Dict[str, Any]] = []

    # Pivot time for “meridian wedge” (default 03:00 next day local)
    pivot_h = int(_safe_get(rules, ["scoring", "dso_pivot_local_h"], 3))
    pivot_m = int(_safe_get(rules, ["scoring", "dso_pivot_local_m"], 0))
    pivot_local = datetime.combine(day_local + timedelta(days=1), time(pivot_h, pivot_m), tzinfo=tz)

    # Half-width of wedge in hour-angle degrees (default 45° = 3 sidereal hours)
    ha_keep_deg = float(_safe_get(rules, ["scoring", "dso_pivot_ha_keep_deg"], 45.0))

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
            deep_mask=deep_mask,
            dark_mask=dark_mask,
            moon_down_mask=moon_down_mask,
        )

        group = str(it.get("group") or "")

        # discard if never above horizon (calendar allowed)
        if stats.max_alt_deg <= 0.0 and group != "calendar":
            continue

        if group == "dso":
            # 1) Altitude keep (as you already have)
            min_alt_keep = float(_safe_get(rules, ["scoring", "dso_min_alt_keep_deg"], 15.0))
            alt_keep = (
                stats.max_alt_deg_quality
                if stats.max_alt_deg_quality is not None
                else stats.max_alt_deg
            )
            if alt_keep < min_alt_keep:
                continue

            # 2) “Between meridians” wedge at pivot time (controls ширину)
            ha_pivot = hour_angle_deg_at_time_local(ra, dec, location, pivot_local)
            if abs(ha_pivot) > ha_keep_deg:
                continue

        score, breakdown = score_item(it, stats, group_weights, rules)

        it2 = dict(it)
        it2["score"] = round(score, 3)
        it2["score_breakdown"] = breakdown
        it2["vis"] = {
            "max_alt_deg": round(stats.max_alt_deg, 2),
            "hours_up": round(stats.hours_up, 2),
            "best_time_local": stats.best_time_local.isoformat() if stats.best_time_local else None,
            "meridian_2to4_min_abs_ha_deg": round(stats.min_abs_hour_angle_deg_2to4, 2)
            if stats.min_abs_hour_angle_deg_2to4 is not None else None,
            "max_alt_deg_quality": round(stats.max_alt_deg_quality, 2) if stats.max_alt_deg_quality is not None else None,
            "best_time_local_quality": stats.best_time_local_quality.isoformat() if stats.best_time_local_quality else None,
            "min_abs_ha_deg_quality": round(stats.min_abs_hour_angle_deg_quality, 2)
            if stats.min_abs_hour_angle_deg_quality is not None else None,
            "quality_mask_used": stats.quality_mask_used,
        }

        # Notes: for DSO prefer quality-window best time/altitude
        if group == "dso" and stats.best_time_local_quality is not None:
            bt_note = stats.best_time_local_quality
        else:
            bt_note = stats.best_time_local

        if group == "dso" and stats.max_alt_deg_quality is not None:
            alt_note = stats.max_alt_deg_quality
        else:
            alt_note = stats.max_alt_deg

        it2["note"] = make_note(
            group=group,
            name=str(it2.get("name") or ""),
            stats=stats,
            best_time_override=bt_note,
            alt_override=alt_note,
        )

        scored_items.append(it2)

    # ---- quotas as-is ----
    max_items = int(_safe_get(rules, ["global", "max_items"], 30))
    cal_max = int(_safe_get(rules, ["global", "calendar_max"], 6))
    pls_max = int(_safe_get(rules, ["global", "planets_max"], 6))
    dso_max = int(_safe_get(rules, ["global", "dso_max"], max(0, max_items - cal_max - pls_max)))

    cal_items = [x for x in scored_items if str(x.get("group") or "") == "calendar"]
    pls_items = [x for x in scored_items if str(x.get("group") or "") == "planets"]
    dso_items = [x for x in scored_items if str(x.get("group") or "") == "dso"]

    cal_items.sort(key=lambda x: -float(x.get("score") or 0.0))
    pls_items.sort(key=lambda x: -float(x.get("score") or 0.0))
    dso_items.sort(key=lambda x: -float(x.get("score") or 0.0))

    picked: List[Dict[str, Any]] = []
    picked.extend(cal_items[:max(0, cal_max)])
    picked.extend(pls_items[:max(0, pls_max)])

    remaining = max_items - len(picked)
    if remaining > 0:
        picked.extend(dso_items[:min(remaining, max(0, dso_max))])

    if len(picked) < max_items:
        picked_ids = {str(x.get("id") or "") for x in picked}
        leftovers = [x for x in scored_items if str(x.get("id") or "") not in picked_ids]
        leftovers.sort(key=lambda x: -float(x.get("score") or 0.0))
        picked.extend(leftovers[: (max_items - len(picked))])

    return picked[:max_items]

# -----------------------------
# Main
# -----------------------------
def main() -> None:
    sources = yaml.safe_load(SOURCES_YML.read_text(encoding="utf-8")) if SOURCES_YML.exists() else {}
    rules = yaml.safe_load(RULES_YML.read_text(encoding="utf-8")) if RULES_YML.exists() else {}

    tz_name = str(_safe_get(rules, ["global", "timezone"], "Europe/Warsaw"))

    planets_path = STAGING_DATA_DIR / "planets.json"
    planets_json = _read_json(planets_path) if planets_path.exists() else None

    daily_signal_items = load_calendar_daily_signal(CALENDAR_DAILY_SIGNAL)

    messier_items = load_messier_dso_items(MESSIER_DSO_PATH)
    print(f"[dbg] messier_items: {len(messier_items)} from {MESSIER_DSO_PATH}")

    import zoneinfo
    tz = zoneinfo.ZoneInfo(tz_name)
    today_local = datetime.now(tz).date()

    calendar_week = calendar_items_for_window(daily_signal_items, today_local, DAYS)
    print(f"[dbg] daily_signal_items: {len(daily_signal_items)}")
    print(f"[dbg] calendar_week: {len(calendar_week)} window {today_local.isoformat()} -> {(today_local + timedelta(days=DAYS)).isoformat()}")

    SERVICES_DATA_DIR.mkdir(parents=True, exist_ok=True)
    simbad_cache = load_simbad_cache()

    location = EarthLocation(
        lat=SITE_LAT_DEG * u.deg,
        lon=SITE_LON_DEG * u.deg,
        height=(SITE_ELEV_KM * 1000.0) * u.m
    )

    frames: List[Dict[str, Any]] = []
    today_items: List[Dict[str, Any]] = []

    for di in range(DAYS):
        d = today_local + timedelta(days=di)
        items = build_day_items(
            day_local=d,
            tz_name=tz_name,
            location=location,
            planets_json=planets_json,
            calendar_all_week=calendar_week,
            messier_items=messier_items,
            simbad_cache=simbad_cache,
            rules=rules,
        )

        frames.append({"date_local": d.isoformat(), "items": items})
        if di == 0:
            today_items = items

    save_simbad_cache(simbad_cache)

    generated_at = utc_now_iso()

    out_week = {
        "version": 1,
        "generated_at": generated_at,
        "site": {"lat": SITE_LAT_DEG, "lon": SITE_LON_DEG, "elev_km": SITE_ELEV_KM, "tz": tz_name},
        "days": DAYS,
        "step_min": STEP_MIN,
        "sources": {
            "calendar": "daily_signal.json",
            "planets": "planets.json",
            "dso_messier": "dso_messier.json",
        },
        "frames": frames,
    }

    out_today = {
        "version": 1,
        "generated_at": generated_at,
        "site": out_week["site"],
        "days": 1,
        "step_min": STEP_MIN,
        "items": today_items,
    }

    week_path_staging = STAGING_DATA_DIR / OUT_WEEK_FILENAME
    today_path_staging = STAGING_DATA_DIR / OUT_TODAY_FILENAME
    _write_json(week_path_staging, out_week)
    _write_json(today_path_staging, out_today)

    week_path_services = SERVICES_DATA_DIR / OUT_WEEK_FILENAME
    today_path_services = SERVICES_DATA_DIR / OUT_TODAY_FILENAME
    _write_json(week_path_services, out_week)
    _write_json(today_path_services, out_today)

    group_counts: Dict[str, int] = {}
    for it in today_items:
        g = str(it.get("group") or "unknown")
        group_counts[g] = group_counts.get(g, 0) + 1

    print(f"[ok] wrote: {today_path_staging}")
    print(f"[ok] wrote: {week_path_staging}")
    print(f"[ok] copied: {today_path_services}")
    print(f"[ok] copied: {week_path_services}")
    print(f"[ok] picked: {len(today_items)} items; group counts: {group_counts}")


if __name__ == "__main__":
    main()