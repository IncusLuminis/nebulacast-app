#!/usr/bin/env python3
# services/sky/pipelines/gen_sunmoon.py
#
# Generates Sun+Moon ephemerides for the next N days as a static JSON
# using the local DE421 SPICE kernel (offline, no network required).
# Writes JSON to TWO destinations (services + staging), same style as gen_stars.py.

from __future__ import annotations

import json
import subprocess
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List

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
SCHEMA_VERSION = 2
STATIC_LOCATION_ID = "default-warsaw"
STATIC_LOCATION_NAME = "Warsaw"
STATIC_TIMEZONE = "Europe/Warsaw"


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


def compute_lunar_states(dates: List[datetime]) -> List[Dict[str, Any]]:
  """Use the same bundled lunar source as the browser and API, without a network."""
  result = subprocess.run(
    ["node", str(PROJECT_ROOT / "scripts" / "lunar-batch.mjs")],
    input=json.dumps([iso_utc(dt) for dt in dates]),
    capture_output=True, text=True, check=True, timeout=60,
  )
  states = json.loads(result.stdout)
  if len(states) != len(dates):
    raise ValueError("Lunar batch returned an incomplete time grid")
  return states


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

    # Moon — topocentric apparent position; phase comes from the shared lunar module
    moon_topo  = get_body("moon", times, location)
    moon_altaz = moon_topo.transform_to(altaz_frame)

  lunar_states = compute_lunar_states(dt_list)

  # Assemble frames
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

    lunar = lunar_states[i]
    moon_obj.update(
      illum_pct=lunar["illum_pct"], phase=lunar["phase"],
      waxing=lunar["waxing"], phase_name=lunar["name"],
    )

    frames.append({
      "t_utc": fmt_tutc(dt),
      "sun":   sun_obj,
      "moon":  moon_obj,
    })

  out = {
    "version": SCHEMA_VERSION,
    "lunar_source": lunar_states[0]["source"],
    "schema": "sun_moon.v2",
    "ownership": {
      "kind": "static",
      "location_id": STATIC_LOCATION_ID,
      "location_name": STATIC_LOCATION_NAME,
      "timezone": STATIC_TIMEZONE,
      "coordinates": {"lat_deg": site.lat, "lon_deg": site.lon},
    },
    "epoch": "apparent",
    "generated_at": utc_now_iso(),
    "source": "DE421 local kernel via astropy.coordinates",
    "params": {"days": DAYS, "step_min": STEP_MIN},
    "site": {
      "lat": site.lat,
      "lon": site.lon,
      "elevation_km": site.elev_km,
      "location_id": STATIC_LOCATION_ID,
      "name": STATIC_LOCATION_NAME,
      "timezone": STATIC_TIMEZONE,
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
