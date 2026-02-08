#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Generate canonical constellation lines (HIP-based) from Stellarium western sky culture.

Inputs:
  - services/sky/data/generated/stars.json  (must exist; produced by gen_stars.py)

Outputs:
  - services/sky/data/constellations_v2_hip.json
  - sites/staging/sky/data/generated/constellations_v2_hip.json

Notes:
  - id_scheme: HIP (a/b are HIP numbers)
  - labels computed from mean RA/Dec of the stars used in lines
"""

from __future__ import annotations

import json
import math
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple

import requests


# -----------------------------
# CONFIG
# -----------------------------
# Must match your stars generator output filename
STARS_FILENAME = "stars.json"

OUT_FILENAME = "constellations.json"

STELLARIUM_WESTERN_INDEX_URL = (
    "https://raw.githubusercontent.com/Stellarium/stellarium-skycultures/master/western/index.json"
)


# -----------------------------
# Paths
# services/pipelines/sky/gen_constellations.py
# -> project root is 4 levels up
# -----------------------------
PROJECT_ROOT = Path(__file__).resolve().parents[3]
SERVICES_DATA_DIR = PROJECT_ROOT / "services" / "sky" / "data" / "generated" 
STAGING_DATA_DIR = PROJECT_ROOT / "sites" / "staging" / "sky" / "data"


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def dump_json(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
    json.dumps(obj, ensure_ascii=False, indent=2, allow_nan=False) + "\n",
    encoding="utf-8"
)


def fetch_stellarium_index() -> Dict[str, Any]:
    r = requests.get(STELLARIUM_WESTERN_INDEX_URL, timeout=30)
    r.raise_for_status()
    return r.json()


def mean_ra_dec_deg(ra_deg_list: List[float], dec_deg_list: List[float]) -> Tuple[float, float]:
    """
    Spherical mean using unit vectors to avoid RA wrap issues.
    """
    sx = sy = sz = 0.0
    n = 0
    for ra_deg, dec_deg in zip(ra_deg_list, dec_deg_list):
        ra = math.radians(ra_deg)
        dec = math.radians(dec_deg)
        x = math.cos(dec) * math.cos(ra)
        y = math.cos(dec) * math.sin(ra)
        z = math.sin(dec)
        sx += x
        sy += y
        sz += z
        n += 1

    if n == 0:
        return 0.0, 0.0

    sx /= n
    sy /= n
    sz /= n
    r = math.sqrt(sx * sx + sy * sy + sz * sz)
    if r < 1e-12:
        return 0.0, 0.0

    sx /= r
    sy /= r
    sz /= r

    ra = math.atan2(sy, sx)
    if ra < 0:
        ra += 2 * math.pi
    dec = math.asin(max(-1.0, min(1.0, sz)))

    return math.degrees(ra), math.degrees(dec)


def parse_constellations_from_stellarium(index_json: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Returns:
      lines:  [{con: "UMa", a: HIP, b: HIP}, ...]
      labels: [{con, name_en, name_ru, hips:[...], ra_deg:None, dec_deg:None}, ...]
    """
    consts = index_json.get("constellations", [])
    lines_out: List[Dict[str, Any]] = []
    labels_out: List[Dict[str, Any]] = []

    for c in consts:
        iau = c.get("iau")
        if not iau:
            continue

        cname = c.get("common_name") or {}
        name_en = cname.get("english") or iau
        # ru пока заглушка; можно заменить позже вручную или отдельным скриптом
        name_ru = name_en

        used_hips: List[int] = []

        clines = c.get("lines") or []
        for poly in clines:
            if not poly or not isinstance(poly, list):
                continue

            start_idx = 0
            if isinstance(poly[0], str):
                start_idx = 1

            hips = []
            for x in poly[start_idx:]:
                # In western sky culture these are Hipparcos numbers (ints)
                if isinstance(x, (int, float)):
                    hips.append(int(x))

            if len(hips) < 2:
                continue

            used_hips.extend(hips)
            for a, b in zip(hips[:-1], hips[1:]):
                if a == b:
                    continue
                lines_out.append({"con": iau, "a": a, "b": b})

        labels_out.append(
            {"con": iau, "name_en": name_en, "name_ru": name_ru, "hips": sorted(set(used_hips)), "ra_deg": None, "dec_deg": None}
        )

    return lines_out, labels_out


def attach_label_positions(labels: List[Dict[str, Any]], stars_by_hip: Dict[int, Dict[str, Any]]) -> None:
    """
    Fill lab["ra_deg"], lab["dec_deg"] for each label using spherical mean of contributing stars.
    Ensures output is always finite JSON-safe numbers (no NaN/Inf).
    """
    for lab in labels:
        hips = lab.get("hips") or []
        ra_list: List[float] = []
        dec_list: List[float] = []

        for hip in hips:
            s = stars_by_hip.get(int(hip))
            if not s:
                continue

            try:
                ra = float(s.get("ra_deg"))
                dec = float(s.get("dec_deg"))
            except (TypeError, ValueError):
                continue

            # guard against NaN/Inf just in case
            if not (math.isfinite(ra) and math.isfinite(dec)):
                continue

            ra_list.append(ra)
            dec_list.append(dec)

        ra_out = 0.0
        dec_out = 0.0

        if ra_list:
            ra_m, dec_m = mean_ra_dec_deg(ra_list, dec_list)
            if math.isfinite(ra_m) and math.isfinite(dec_m):
                ra_out = ra_m
                dec_out = dec_m

        lab["ra_deg"] = round(ra_out, 6)
        lab["dec_deg"] = round(dec_out, 6)

        # We don't need hips in the final JSON
        lab.pop("hips", None)


def main() -> None:
    SERVICES_DATA_DIR.mkdir(parents=True, exist_ok=True)
    STAGING_DATA_DIR.mkdir(parents=True, exist_ok=True)

    stars_path = SERVICES_DATA_DIR / STARS_FILENAME
    if not stars_path.exists():
        raise FileNotFoundError(
            f"Stars file not found: {stars_path}\n"
            "Run gen_stars.py first, or adjust STARS_FILENAME in this script."
        )

    stars_obj = read_json(stars_path)
    stars = stars_obj.get("stars") or []
    stars_by_hip = {int(s["hip"]): s for s in stars if s.get("hip") is not None}

    print("[sky] fetching Stellarium western constellations...")
    idx = fetch_stellarium_index()
    lines, labels = parse_constellations_from_stellarium(idx)

    print("[sky] computing label positions...")
    attach_label_positions(labels, stars_by_hip)

    out = {
        "version": 2,
        "epoch": "J2000",
        "generated_at": utc_now_iso(),
        "source": "Stellarium stellarium-skycultures western/index.json",
        "id_scheme": "HIP",
        "lines": lines,
        "labels": labels,
    }

    out_services = SERVICES_DATA_DIR / OUT_FILENAME
    out_staging = STAGING_DATA_DIR / OUT_FILENAME

    dump_json(out_services, out)
    dump_json(out_staging, out)

    print(f"[sky] constellations generated: lines={len(lines)}, labels={len(labels)}")
    print(f"[sky] wrote: {out_services}")
    print(f"[sky] wrote: {out_staging}")


if __name__ == "__main__":
    main()