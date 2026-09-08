#!/usr/bin/env python3
# services/sky/pipelines/gen_planets.py
#
# Generates planetary ephemerides for the next N days as a static JSON
# using the local DE421 SPICE kernel (offline, no network required).
# Writes JSON to TWO destinations (services + staging), same style as gen_stars.py / gen_sunmoon.py.

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import astropy.units as u
from astropy.coordinates import AltAz, EarthLocation, get_body, solar_system_ephemeris
from astropy.time import Time


# -----------------------------
# Paths (same style as gen_stars.py)
# services/sky/pipelines/gen_planets.py
# -> project root is 3 levels up
# -----------------------------
PROJECT_ROOT = Path(__file__).resolve().parents[3]

SERVICES_DATA_DIR = PROJECT_ROOT / "services" / "sky" / "data" / "generated"
STAGING_DATA_DIR  = PROJECT_ROOT / "sites" / "staging" / "sky" / "data"
BSP_PATH          = PROJECT_ROOT / "services" / "sky" / "data" / "raw" / "de421.bsp"

OUT_FILENAME = "planets.json"


# -----------------------------
# Config
# -----------------------------
DAYS = 7
STEP_MIN = 10

# Default location (Warsaw).
SITE_LAT_DEG = 52.2297
SITE_LON_DEG = 21.0122   # East positive
SITE_ELEV_KM = 0.10      # ~100 m

_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
           "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


# -----------------------------
# Planets list
# (output key, display label, astropy body name)
# -----------------------------
PLANETS: List[Tuple[str, str, str]] = [
  ("mercury", "Mercury", "mercury"),
  ("venus",   "Venus",   "venus"),
  ("mars",    "Mars",    "mars"),
  ("jupiter", "Jupiter", "jupiter"),
  ("saturn",  "Saturn",  "saturn"),
  ("uranus",  "Uranus",  "uranus"),
  ("neptune", "Neptune", "neptune"),
]


# -----------------------------
# Helpers
# -----------------------------
def utc_now_iso() -> str:
  return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

def dump_json(path: Path, obj: Any) -> None:
  path.parent.mkdir(parents=True, exist_ok=True)
  path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def iso_utc(dt: datetime) -> str:
  dt = dt.astimezone(timezone.utc)
  return dt.isoformat().replace("+00:00", "Z")

def fmt_tutc(dt: datetime) -> str:
  """Format as 'YYYY-Mon-DD HH:MMZ' — must match parseHorizonsTUTC() in JS and parse_tutc_ms() in Python."""
  return f"{dt.year}-{_MONTHS[dt.month - 1]}-{dt.day:02d} {dt.hour:02d}:{dt.minute:02d}Z"


@dataclass(frozen=True)
class Site:
  lat: float
  lon: float
  elev_km: float


def compute_illum_pct(body_xyz: np.ndarray, sun_xyz: np.ndarray) -> np.ndarray:
  """
  Illuminated fraction (0–100 %) for each time step.

  body_xyz, sun_xyz: (3, n) arrays in AU in the geocentric (GCRS) frame.
  Earth is at the GCRS origin, so:
    planet → sun   = sun_xyz  - body_xyz
    planet → earth = (0,0,0)  - body_xyz  = -body_xyz
  """
  to_sun   = sun_xyz - body_xyz
  to_earth = -body_xyz

  dot   = np.einsum("ij,ij->j", to_sun, to_earth)
  mag_s = np.linalg.norm(to_sun,   axis=0)
  mag_e = np.linalg.norm(to_earth, axis=0)

  cos_i = np.clip(dot / (mag_s * mag_e), -1.0, 1.0)
  return (1.0 + cos_i) / 2.0 * 100.0


def main() -> None:
  if not BSP_PATH.exists():
    raise FileNotFoundError(f"DE421 kernel not found: {BSP_PATH}")

  start = datetime.now(timezone.utc).replace(second=0, microsecond=0)
  stop  = start + timedelta(days=DAYS)

  site     = Site(lat=SITE_LAT_DEG, lon=SITE_LON_DEG, elev_km=SITE_ELEV_KM)
  location = EarthLocation(lat=site.lat * u.deg, lon=site.lon * u.deg, height=site.elev_km * u.km)

  # Time grid
  total_steps = int((stop - start).total_seconds() / 60 / STEP_MIN) + 1
  dt_list = [start + timedelta(minutes=i * STEP_MIN) for i in range(total_steps)]
  times   = Time([dt.strftime("%Y-%m-%dT%H:%M:%S") for dt in dt_list], format="isot", scale="utc")

  print(f"[sky] {len(times)} steps × {len(PLANETS)} planets, kernel={BSP_PATH.name} …")

  with solar_system_ephemeris.set(str(BSP_PATH)):
    altaz_frame = AltAz(obstime=times, location=location)

    # Geocentric sun position (needed for phase-angle / illumination)
    sun_gcrs = get_body("sun", times)
    sun_xyz  = sun_gcrs.cartesian.xyz.to(u.au).value   # (3, n)

    # Per-planet vectorised queries
    planet_arrays: Dict[str, Dict[str, np.ndarray]] = {}
    for key, label, aname in PLANETS:
      print(f"[sky]   {label} …")
      topo     = get_body(aname, times, location)        # topocentric apparent -> RA/Dec/Alt/Az
      altaz    = topo.transform_to(altaz_frame)
      gcrs     = get_body(aname, times)                  # geocentric -> phase angle
      body_xyz = gcrs.cartesian.xyz.to(u.au).value       # (3, n)

      planet_arrays[key] = {
        "ra":    topo.ra.deg,
        "dec":   topo.dec.deg,
        "alt":   altaz.alt.deg,
        "az":    altaz.az.deg,
        "illum": compute_illum_pct(body_xyz, sun_xyz),
      }

  # Assemble frames
  prev_illum: Dict[str, Optional[float]] = {k: None for k, _, _ in PLANETS}
  frames: List[Dict[str, Any]] = []

  for i, dt in enumerate(dt_list):
    planets_obj: Dict[str, Any] = {}

    for key, label, _ in PLANETS:
      arr = planet_arrays[key]
      ra  = float(arr["ra"][i])
      dec = float(arr["dec"][i])
      alt = float(arr["alt"][i])
      az  = float(arr["az"][i])
      ill = float(arr["illum"][i])

      p: Dict[str, Any] = {
        "name":    label,
        "ra_deg":  round(ra,  6),
        "dec_deg": round(dec, 6),
        "alt_deg": round(alt, 4),
        "az_deg":  round(az,  4),
        "illum_pct": round(ill, 2),
        "phase":     round(ill / 100.0, 4),
      }

      prev = prev_illum[key]
      p["waxing"]    = True if prev is None else (ill >= prev)
      prev_illum[key] = ill

      planets_obj[key] = p

    frames.append({"t_utc": fmt_tutc(dt), "planets": planets_obj})

  out = {
    "version": 1,
    "epoch": "apparent",
    "generated_at": utc_now_iso(),
    "source": "DE421 local kernel via astropy.coordinates",
    "params": {"days": DAYS, "step_min": STEP_MIN},
    "site": {
      "lat": site.lat,
      "lon": site.lon,
      "elevation_km": site.elev_km,
    },
    "window": {
      "start_utc": iso_utc(start),
      "end_utc":   iso_utc(stop),
    },
    "bodies": [
      {"key": key, "name": label, "astropy_name": aname}
      for (key, label, aname) in PLANETS
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
