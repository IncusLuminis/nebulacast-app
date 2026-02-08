#!/usr/bin/env python3
# services/sky/pipelines/gen_planets.py
#
# Generates planetary ephemerides for the next N days as a static JSON
# using NASA JPL Horizons (online) via astroquery + astropy.
# Writes JSON to TWO destinations (services + staging), same style as gen_stars.py / gen_sunmoon.py.

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from astroquery.jplhorizons import Horizons


# -----------------------------
# Paths (same style as gen_stars.py)
# services/sky/pipelines/gen_planets.py
# -> project root is 3 levels up
# -----------------------------
PROJECT_ROOT = Path(__file__).resolve().parents[3]

SERVICES_DATA_DIR = PROJECT_ROOT / "services" / "sky" / "data" / "generated"
STAGING_DATA_DIR  = PROJECT_ROOT / "sites" / "staging" / "sky" / "data"

OUT_FILENAME = "planets.json"


# -----------------------------
# Config
# -----------------------------
DAYS = 7
STEP_MIN = 10

# Default location (Warsaw). You can later read these from a config file.
SITE_LAT_DEG = 52.2297
SITE_LON_DEG = 21.0122   # East positive (Warsaw is +)
SITE_ELEV_KM = 0.10      # ~100 m


# -----------------------------
# Planets list
# JPL Horizons majorbody IDs:
# Mercury=199, Venus=299, Mars=499, Jupiter=599, Saturn=699, Uranus=799, Neptune=899
# (Optionally Pluto=999, but often you may not want it as "planet".)
# -----------------------------
PLANETS: List[Tuple[str, str, str]] = [
  ("mercury", "Mercury", "199"),
  ("venus",   "Venus",   "299"),
  ("mars",    "Mars",    "499"),
  ("jupiter", "Jupiter", "599"),
  ("saturn",  "Saturn",  "699"),
  ("uranus",  "Uranus",  "799"),
  ("neptune", "Neptune", "899"),
]


# -----------------------------
# Helpers (same philosophy as your generator)
# -----------------------------
def utc_now_iso() -> str:
  return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

def dump_json(path: Path, obj: Any) -> None:
  path.parent.mkdir(parents=True, exist_ok=True)
  path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def iso_utc(dt: datetime) -> str:
  dt = dt.astimezone(timezone.utc)
  return dt.isoformat().replace("+00:00", "Z")

def as_float(x: Any) -> Optional[float]:
  try:
    v = float(x)
    return v if (v == v) else None  # NaN check
  except Exception:
    return None


@dataclass(frozen=True)
class Site:
  lat: float
  lon: float
  elev_km: float


def horizons_ephemerides(
  target_id: str,
  site: Site,
  start_utc: datetime,
  stop_utc: datetime,
  step_min: int,
  quantities: str,
):
  """
  Query JPL Horizons ephemerides (online).
  location dict: lon/lat in deg, elevation in km.
  epochs dict: start/stop strings, step like "10m".
  """
  location = {"lon": site.lon, "lat": site.lat, "elevation": site.elev_km}
  epochs = {
    "start": iso_utc(start_utc).replace("Z", ""),  # Horizons accepts no trailing Z
    "stop":  iso_utc(stop_utc).replace("Z", ""),
    "step":  f"{step_min}m",
  }
  obj = Horizons(id=target_id, id_type="majorbody", location=location, epochs=epochs)
  return obj.ephemerides(quantities=quantities)


def get_col(tab, *names: str):
  for n in names:
    if n in tab.colnames:
      return tab[n]
  return None


def main() -> None:
  # Generate from "now" to now+N days.
  start = datetime.now(timezone.utc).replace(second=0, microsecond=0)
  stop = start + timedelta(days=DAYS)

  site = Site(lat=SITE_LAT_DEG, lon=SITE_LON_DEG, elev_km=SITE_ELEV_KM)

  # quantities:
  # 1  -> RA/DEC (apparent)
  # 4  -> topocentric Alt/Az (EL/AZ)
  # 9/10 sometimes expose illumination/phase/magnitude-ish columns depending on target/config.
  # We'll request a bit broader and then extract columns defensively by name.
  q = "1,4,9,10"

  # Query all planets
  tabs: Dict[str, Any] = {}
  for key, label, hid in PLANETS:
    tabs[key] = horizons_ephemerides(hid, site, start, stop, STEP_MIN, q)

  # Validate datetime_str
  for key, tab in tabs.items():
    if "datetime_str" not in tab.colnames:
      raise RuntimeError(f"Horizons response missing datetime_str for {key}. Columns: {tab.colnames}")

  # Determine frame count from the first planet
  first_key = PLANETS[0][0]
  n = len(tabs[first_key])

  # Extract common time axis (assume aligned by same epochs/step)
  frames: List[Dict[str, Any]] = []

  # For waxing/waning (illumination increasing/decreasing) we track per-planet
  prev_illum: Dict[str, Optional[float]] = {k: None for k, _, _ in PLANETS}

  # Pre-resolve columns for each planet tab (avoid repeating name-lookup per row)
  cols: Dict[str, Dict[str, Any]] = {}

  for key, _, _ in PLANETS:
    tab = tabs[key]
    cols[key] = {
      "ra":   get_col(tab, "RA"),
      "dec":  get_col(tab, "DEC"),
      "el":   get_col(tab, "EL", "Alt"),
      "az":   get_col(tab, "AZ", "Az"),

      # magnitude: Horizons may expose "V" or "VMag" or similar; be tolerant
      "mag":  get_col(tab, "V", "VMag", "mag", "MAG", "Vmag"),

      # illumination / phase: naming varies wildly; try broad set
      # Sometimes it's a fraction 0..1 (k), sometimes percent, sometimes missing for outer planets.
      "illum": get_col(
        tab,
        "illum", "Illum", "illumination", "ILLUM",
        "Illu%", "illu%", "k", "frac_illum", "FracIllum", "FRACTION_ILLUM",
        "Illumination", "IllumFrac", "ILLUM_FRAC"
      ),

      # phase angle / related fields (optional)
      "phase": get_col(tab, "phase", "Phase", "PHASE", "phase_frac", "PhaseFrac"),
    }

    # Debug if you want (leave commented)
    # print(f"[sky] {key} columns:", tab.colnames)

  def norm_illum_to_pct(v: float) -> float:
    # If value is <=1.01 treat as fraction, else treat as percent
    if v <= 1.01:
      return max(0.0, min(1.0, v)) * 100.0
    return max(0.0, min(100.0, v))

  def norm_phase_to_01(v: float) -> float:
    # If value is >1.01 treat as percent, else as fraction
    if v > 1.01:
      v = v / 100.0
    return max(0.0, min(1.0, v))

  for i in range(n):
    # Common time stamp
    # Example format: "2026-Feb-08 18:00"
    t_str = f"{tabs[first_key]['datetime_str'][i]}Z"

    planets_obj: Dict[str, Any] = {}

    for key, label, _hid in PLANETS:
      tab = tabs[key]
      c = cols[key]

      ra  = as_float(c["ra"][i])  if c["ra"]  is not None else None
      dec = as_float(c["dec"][i]) if c["dec"] is not None else None
      el  = as_float(c["el"][i])  if c["el"]  is not None else None
      az  = as_float(c["az"][i])  if c["az"]  is not None else None

      if ra is None or dec is None:
        # If Horizons fails to provide RA/DEC for some reason, skip this planet for this frame.
        continue

      p: Dict[str, Any] = {
        "name": label,
        "ra_deg": ra,
        "dec_deg": dec,
        "alt_deg": el,
        "az_deg": az,
      }

      mag = as_float(c["mag"][i]) if c["mag"] is not None else None
      if mag is not None:
        p["mag"] = round(mag, 2)

      illum_raw = as_float(c["illum"][i]) if c["illum"] is not None else None
      phase_raw = as_float(c["phase"][i]) if c["phase"] is not None else None

      # If we have illumination, store illum_pct + phase (0..1)
      if illum_raw is not None:
        illum_pct = norm_illum_to_pct(illum_raw)
        p["illum_pct"] = round(illum_pct, 2)
        p["phase"] = round(illum_pct / 100.0, 4)

        prev = prev_illum.get(key)
        if prev is None:
          p["waxing"] = True
        else:
          p["waxing"] = (illum_pct >= prev)
        prev_illum[key] = illum_pct

      # If we have a separate phase field, store it too (but do NOT override illum-derived values)
      if phase_raw is not None and "phase" not in p:
        ph = norm_phase_to_01(phase_raw)
        p["phase"] = round(ph, 4)
        p["illum_pct"] = round(ph * 100.0, 2)

      planets_obj[key] = p

    frames.append({
      "t_utc": t_str,
      "planets": planets_obj,
    })

  out = {
    "version": 1,
    "epoch": "apparent",
    "generated_at": utc_now_iso(),
    "source": "NASA JPL Horizons (online) via astroquery.jplhorizons",
    "params": { "days": DAYS, "step_min": STEP_MIN },
    "site": {
      "lat": site.lat,
      "lon": site.lon,
      "elevation_km": site.elev_km,
    },
    "window": {
      "start_utc": iso_utc(start),
      "end_utc": iso_utc(stop),
    },
    "bodies": [
      {"key": key, "name": label, "horizons_id": hid}
      for (key, label, hid) in PLANETS
    ],
    "frames": frames,
  }

  out_services = SERVICES_DATA_DIR / OUT_FILENAME
  out_staging  = STAGING_DATA_DIR  / OUT_FILENAME

  dump_json(out_services, out)
  dump_json(out_staging, out)

  print(f"[sky] planets generated: {len(frames)} frames (step {STEP_MIN}m, days {DAYS})")
  print(f"[sky] wrote: {out_services}")
  print(f"[sky] wrote: {out_staging}")


if __name__ == "__main__":
  main()