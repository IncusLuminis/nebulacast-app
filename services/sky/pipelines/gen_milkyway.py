#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Generate a schematic Milky Way band (3 polylines: mid/top/bot) as RA/Dec points (J2000).

Idea:
  - Use Galactic coordinates:
      mid: b = 0°
      top: b = +BAND_HALF_WIDTH_DEG
      bot: b = -BAND_HALF_WIDTH_DEG
    for l = 0..360
  - Convert GAL -> EQ (J2000) using the standard IAU rotation matrix (same as commonly used in astronomy libs)
  - Output static JSON used by the widget (no runtime external calls).

Outputs:
  services/sky/data/milkyway_v1.json
  sites/staging/sky/data/milkyway_v1.json
"""

from __future__ import annotations

import json
import math
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Tuple


# -----------------------------
# CONFIG
# -----------------------------
OUT_FILENAME = "milkyway_v1.json"

SAMPLE_STEP_DEG = 1.0          # step along galactic longitude l
BAND_HALF_WIDTH_DEG = 5.0      # band half-width (visual thickness driver in Render too)

# -----------------------------
# Paths
# services/pipelines/sky/gen_milkyway.py
# -> project root is 4 levels up
# -----------------------------
PROJECT_ROOT = Path(__file__).resolve().parents[3]
SERVICES_DATA_DIR = PROJECT_ROOT / "services" / "sky" / "data"
STAGING_DATA_DIR = PROJECT_ROOT / "sites" / "staging" / "sky" / "data"


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def dump_json(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def normalize_ra_deg(ra_deg: float) -> float:
    ra = ra_deg % 360.0
    if ra < 0:
        ra += 360.0
    return ra


# Standard J2000 rotation matrix EQ->GAL (commonly used; matches astropy)
# We need GAL->EQ, so we transpose it.
EQ_TO_GAL = (
    (-0.0548755604, -0.8734370902, -0.4838350155),
    ( 0.4941094279, -0.4448296300,  0.7469822445),
    (-0.8676661490, -0.1980763734,  0.4559837762),
)

GAL_TO_EQ = tuple(zip(*EQ_TO_GAL))  # transpose


def mat_vec_mul(M: Tuple[Tuple[float, float, float], ...], v: Tuple[float, float, float]) -> Tuple[float, float, float]:
    return (
        M[0][0]*v[0] + M[0][1]*v[1] + M[0][2]*v[2],
        M[1][0]*v[0] + M[1][1]*v[1] + M[1][2]*v[2],
        M[2][0]*v[0] + M[2][1]*v[1] + M[2][2]*v[2],
    )


def gal_to_eq_ra_dec(l_deg: float, b_deg: float) -> Tuple[float, float]:
    """
    Convert Galactic (l,b) in degrees to Equatorial (RA,Dec) in degrees, J2000.
    """
    l = math.radians(l_deg)
    b = math.radians(b_deg)

    # galactic unit vector
    xg = math.cos(b) * math.cos(l)
    yg = math.cos(b) * math.sin(l)
    zg = math.sin(b)

    # convert to equatorial via GAL->EQ
    xe, ye, ze = mat_vec_mul(GAL_TO_EQ, (xg, yg, zg))

    ra = math.atan2(ye, xe)
    if ra < 0:
        ra += 2 * math.pi
    dec = math.asin(max(-1.0, min(1.0, ze)))

    return normalize_ra_deg(math.degrees(ra)), math.degrees(dec)


def build_band(b_deg: float, step_deg: float) -> List[Dict[str, float]]:
    pts: List[Dict[str, float]] = []
    l = 0.0
    # include 360 endpoint for closure (optional, harmless)
    while l <= 360.0 + 1e-9:
        ra, dec = gal_to_eq_ra_dec(l, b_deg)
        pts.append({"ra_deg": round(ra, 6), "dec_deg": round(dec, 6)})
        l += step_deg
    return pts


def main() -> None:
    SERVICES_DATA_DIR.mkdir(parents=True, exist_ok=True)
    STAGING_DATA_DIR.mkdir(parents=True, exist_ok=True)

    mid = build_band(0.0, SAMPLE_STEP_DEG)
    top = build_band(+BAND_HALF_WIDTH_DEG, SAMPLE_STEP_DEG)
    bot = build_band(-BAND_HALF_WIDTH_DEG, SAMPLE_STEP_DEG)

    out = {
        "version": 1,
        "epoch": "J2000",
        "generated_at": utc_now_iso(),
        "source": "Synthetic MW band from Galactic plane (b=0, ±width) using J2000 GAL<->EQ rotation matrix",
        "params": {
            "sample_step_deg": SAMPLE_STEP_DEG,
            "band_half_width_deg": BAND_HALF_WIDTH_DEG
        },
        "bands": {
            "mid": mid,
            "top": top,
            "bot": bot
        }
    }

    out_services = SERVICES_DATA_DIR / OUT_FILENAME
    out_staging = STAGING_DATA_DIR / OUT_FILENAME

    dump_json(out_services, out)
    dump_json(out_staging, out)

    print(f"[sky] milkyway generated: mid/top/bot = {len(mid)}/{len(top)}/{len(bot)} points")
    print(f"[sky] wrote: {out_services}")
    print(f"[sky] wrote: {out_staging}")


if __name__ == "__main__":
    main()