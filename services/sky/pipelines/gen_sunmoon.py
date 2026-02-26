#!/usr/bin/env python3
# services/sky/pipelines/gen_sunmoon.py
#
# Generates Sun+Moon ephemerides for the next N days as a static JSON
# using the local DE421 SPICE kernel (offline, no network required).
# Writes JSON to TWO destinations (services + staging), same style as gen_stars.py.

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import astropy.units as u
from astropy.coordinates import AltAz, EarthLocation, get_body, solar_system_ephemeris
from astropy.time import Time


# -----------------------------
# Paths (same style as gen_stars.py)
# services/sky/pipelines/gen_sunmoon.py
# -> project root is 3 levels up
# -----------------------------
PROJECT_ROOT = Path(__file__).resolve().parents[3]

SERVICES_DATA_DIR = PROJECT_ROOT / "services" / "sky" / "data" / "generated"
STAGING_DATA_DIR  = PROJECT_ROOT / "sites" / "staging" / "sky" / "data"
BSP_PATH          = PROJECT_ROOT / "services" / "sky" / "data" / "raw" / "de421.bsp"

OUT_FILENAME = "sun_moon.json"


# -----------------------------
# Config
# -----------------------------
DAYS = 7
STEP_MIN = 10

# Default location (Warsaw).
SITE_LAT_DEG = 52.2297
SITE_LON_DEG = 21.0122   # East positive (Warsaw is +)
SITE_ELEV_KM = 0.10      # ~100 m

_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
           "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


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
    body → sun   = sun_xyz  - body_xyz
    body → earth = (0,0,0)  - body_xyz  = -body_xyz
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

  print(f"[sky] {len(times)} steps, kernel={BSP_PATH.name} …")

  with solar_system_ephemeris.set(str(BSP_PATH)):
    altaz_frame = AltAz(obstime=times, location=location)

    # Sun — topocentric apparent position
    sun_topo  = get_body("sun",  times, location)
    sun_altaz = sun_topo.transform_to(altaz_frame)

    # Moon — topocentric apparent position + geocentric for phase angle
    moon_topo  = get_body("moon", times, location)
    moon_altaz = moon_topo.transform_to(altaz_frame)
    moon_gcrs  = get_body("moon", times)                         # geocentric
    sun_gcrs   = get_body("sun",  times)                         # geocentric (for phase angle)

    moon_xyz = moon_gcrs.cartesian.xyz.to(u.au).value            # (3, n)
    sun_xyz  = sun_gcrs.cartesian.xyz.to(u.au).value             # (3, n)
    moon_illum_arr = compute_illum_pct(moon_xyz, sun_xyz)        # (n,)

  # Assemble frames
  prev_illum: Optional[float] = None
  frames: List[Dict[str, Any]] = []

  for i, dt in enumerate(dt_list):
    sun_obj: Dict[str, Any] = {
      "ra_deg":  round(float(sun_topo.ra.deg[i]),   6),
      "dec_deg": round(float(sun_topo.dec.deg[i]),  6),
      "alt_deg": round(float(sun_altaz.alt.deg[i]), 4),
      "az_deg":  round(float(sun_altaz.az.deg[i]),  4),
    }

    moon_obj: Dict[str, Any] = {
      "ra_deg":  round(float(moon_topo.ra.deg[i]),   6),
      "dec_deg": round(float(moon_topo.dec.deg[i]),  6),
      "alt_deg": round(float(moon_altaz.alt.deg[i]), 4),
      "az_deg":  round(float(moon_altaz.az.deg[i]),  4),
    }

    ill = float(moon_illum_arr[i])
    ill = max(0.0, min(100.0, ill))
    moon_obj["illum_pct"] = round(ill, 2)
    moon_obj["phase"]     = round(ill / 100.0, 4)

    if prev_illum is None:
      moon_obj["waxing"] = True
    else:
      moon_obj["waxing"] = (ill >= prev_illum)
    prev_illum = ill

    frames.append({
      "t_utc": fmt_tutc(dt),
      "sun":   sun_obj,
      "moon":  moon_obj,
    })

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
