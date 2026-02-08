#!/usr/bin/env python3
# services/sky/pipelines/gen_sunmoon.py
#
# Generates Sun+Moon ephemerides for the next N days as a static JSON
# using NASA JPL Horizons (online) via astroquery + astropy.
# Writes JSON to TWO destinations (services + staging), same style as gen_stars.py.

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from astroquery.jplhorizons import Horizons


# -----------------------------
# Paths (same style as gen_stars.py)
# services/sky/pipelines/gen_sunmoon.py
# -> project root is 3 levels up
# -----------------------------
PROJECT_ROOT = Path(__file__).resolve().parents[3]

SERVICES_DATA_DIR = PROJECT_ROOT / "services" / "sky" / "data" / "generated"
STAGING_DATA_DIR  = PROJECT_ROOT / "sites" / "staging" / "sky" / "data"

OUT_FILENAME = "sun_moon.json"


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


def main() -> None:
  # Generate from "now" to now+7d. If you want "night window only", we can filter later.
  start = datetime.now(timezone.utc).replace(second=0, microsecond=0)
  stop = start + timedelta(days=DAYS)

  site = Site(lat=SITE_LAT_DEG, lon=SITE_LON_DEG, elev_km=SITE_ELEV_KM)

  # Horizons IDs (majorbody):
  # Sun = 10, Moon = 301
  #
  # quantities:
  # We request RA/DEC + topocentric Alt/Az (EL/AZ).
  # For Moon we also request illumination-related quantities.
  #
  # NOTE: In practice, some Horizons configs don't return "illum" for qty 9 alone,
  # so we also request qty 10 (illumination/phase related) to make it show up.
  sun_q = "1,4"
  moon_q = "1,4,9,10"

  sun_tab = horizons_ephemerides("10", site, start, stop, STEP_MIN, sun_q)
  moon_tab = horizons_ephemerides("301", site, start, stop, STEP_MIN, moon_q)

  # Required time column
  if "datetime_str" not in sun_tab.colnames or "datetime_str" not in moon_tab.colnames:
    raise RuntimeError("Horizons response missing datetime_str column")

  # Helper to get a column by possible names
  def get_col(tab, *names: str):
    for n in names:
      if n in tab.colnames:
        return tab[n]
    return None

  # Columns (common names)
  sun_ra  = get_col(sun_tab,  "RA")
  sun_dec = get_col(sun_tab,  "DEC")
  sun_el  = get_col(sun_tab,  "EL", "Alt")
  sun_az  = get_col(sun_tab,  "AZ", "Az")

  moon_ra  = get_col(moon_tab, "RA")
  moon_dec = get_col(moon_tab, "DEC")
  moon_el  = get_col(moon_tab, "EL", "Alt")
  moon_az  = get_col(moon_tab, "AZ", "Az")

  # Illumination: name varies; try a broad set.
  moon_illum = get_col(
    moon_tab,
    "illum", "Illum", "illumination", "ILLUM",
    "Illu%", "illu%", "k", "frac_illum", "FracIllum", "FRACTION_ILLUM"
  )

  # If still not found, print columns once so we can adjust without guessing
  if moon_illum is None:
    print("[sky] WARNING: Moon illumination column not found. Available columns:")
    print(moon_tab.colnames)

  n = min(len(sun_tab), len(moon_tab))
  frames: List[Dict[str, Any]] = []

  # Track previous illumination to derive waxing/waning (no extra Horizons cols needed)
  prev_illum: Optional[float] = None

  for i in range(n):
    # Keep Horizons time string; add Z for clarity.
    # Example format: "2026-Feb-08 18:00"
    t_str = f"{sun_tab['datetime_str'][i]}Z"

    sun_obj = {
      "ra_deg":  as_float(sun_ra[i])  if sun_ra  is not None else None,
      "dec_deg": as_float(sun_dec[i]) if sun_dec is not None else None,
      "alt_deg": as_float(sun_el[i])  if sun_el  is not None else None,
      "az_deg":  as_float(sun_az[i])  if sun_az  is not None else None,
    }

    moon_obj = {
      "ra_deg":  as_float(moon_ra[i])  if moon_ra  is not None else None,
      "dec_deg": as_float(moon_dec[i]) if moon_dec is not None else None,
      "alt_deg": as_float(moon_el[i])  if moon_el  is not None else None,
      "az_deg":  as_float(moon_az[i])  if moon_az  is not None else None,
    }

    if moon_illum is not None:
      illum_pct = as_float(moon_illum[i])
      if illum_pct is not None:
        # Normalize and store
        illum_pct_clamped = max(0.0, min(100.0, illum_pct))
        moon_obj["illum_pct"] = round(illum_pct_clamped, 2)
        moon_obj["phase"] = round(illum_pct_clamped / 100.0, 4)

        # Derive waxing (True if illumination is increasing vs previous frame)
        # For the first frame (no previous), assume waxing True by default.
        if prev_illum is None:
          moon_obj["waxing"] = True
        else:
          moon_obj["waxing"] = (illum_pct_clamped >= prev_illum)

        prev_illum = illum_pct_clamped

    frames.append({
      "t_utc": t_str,
      "sun": sun_obj,
      "moon": moon_obj,
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
    "frames": frames,
  }

  out_services = SERVICES_DATA_DIR / OUT_FILENAME
  out_staging  = STAGING_DATA_DIR  / OUT_FILENAME

  dump_json(out_services, out)
  dump_json(out_staging, out)

  print(f"[sky] sun+moon generated: {len(frames)} frames (step {STEP_MIN}m, days {DAYS})")
  print(f"[sky] wrote: {out_services}")
  print(f"[sky] wrote: {out_staging}")


if __name__ == "__main__":
  main()