#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Generate static stars JSON from Hipparcos (VizieR I/239/hip_main).

Output:
  services/sky/data/stars_v2_hip.json
  sites/staging/sky/data/stars_v2_hip.json

Notes:
  - id_scheme: HIP (id == hip)
  - epoch: J2000/ICRS for _RA.icrs/_DE.icrs (good for our J2000-ish pipeline)
  - runtime widget uses only the static JSON (no external calls)
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import requests  # required by astroquery in some envs; safe to keep
from astroquery.vizier import Vizier
import math


# -----------------------------
# CONFIG (edit here if needed)
# -----------------------------
LIMIT_MAG = 4.0
OUT_FILENAME = "stars_v2_hip.json"

VIZIER_CATALOG = "I/239/hip_main"
VIZIER_COLUMNS = ["HIP", "Vmag", "_RA.icrs", "_DE.icrs"]


# -----------------------------
# Paths
# services/pipelines/sky/gen_stars_hipparcos.py
# -> project root is 4 levels up
# -----------------------------
PROJECT_ROOT = Path(__file__).resolve().parents[3]
SERVICES_DATA_DIR = PROJECT_ROOT / "services" / "sky" / "data"
STAGING_DATA_DIR = PROJECT_ROOT / "sites" / "staging" / "sky" / "data"


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def dump_json(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(obj, ensure_ascii=False, indent=2, allow_nan=False) + "\n",
        encoding="utf-8"
    )


def main() -> None:
    SERVICES_DATA_DIR.mkdir(parents=True, exist_ok=True)
    STAGING_DATA_DIR.mkdir(parents=True, exist_ok=True)

    # Vizier query
    Vizier.ROW_LIMIT = -1
    v = Vizier(columns=VIZIER_COLUMNS,row_limit=Vizier.ROW_LIMIT)

    # Vmag can be missing for some rows; constraint works fine for most stars.
    res = v.query_constraints(catalog=VIZIER_CATALOG, Vmag=f"<={LIMIT_MAG}")
    if not res:
        raise RuntimeError("VizieR returned no results. Check network access or catalog availability.")

    t = res[0]

    stars = []
    for row in t:
        if row["HIP"] is None:
            continue

        hip = int(row["HIP"])

        # Handle missing magnitudes robustly
        vmag = row["Vmag"]
        if vmag is None:
            continue
        vmag = float(vmag)
        if vmag > LIMIT_MAG:
            continue

        ra = row["_RA.icrs"]
        dec = row["_DE.icrs"]

        # Some rows can have masked/invalid coordinates -> become NaN
        try:
            ra = float(ra)
            dec = float(dec)
        except (TypeError, ValueError):
            continue

        if not (math.isfinite(ra) and math.isfinite(dec)):
            continue

        stars.append(
            {
                "id": hip,         # IMPORTANT: id == HIP
                "hip": hip,
                "name": "",        # can be enriched later (common names)
                "ra_deg": ra,
                "dec_deg": dec,
                "mag": vmag,
            }
        )

    stars.sort(key=lambda s: s["id"])

    out = {
        "version": 2,
        "epoch": "J2000",
        "generated_at": utc_now_iso(),
        "source": "Hipparcos I/239/hip_main (VizieR)",
        "id_scheme": "HIP",
        "limit_mag": LIMIT_MAG,
        "stars": stars,
    }

    out_services = SERVICES_DATA_DIR / OUT_FILENAME
    out_staging = STAGING_DATA_DIR / OUT_FILENAME

    dump_json(out_services, out)
    dump_json(out_staging, out)

    print(f"[sky] stars generated: {len(stars)} (Vmag <= {LIMIT_MAG})")
    print(f"[sky] wrote: {out_services}")
    print(f"[sky] wrote: {out_staging}")
    print("rows from vizier:", len(t))
    print("min/max Vmag:", float(min(t["Vmag"])), float(max(t["Vmag"])))


if __name__ == "__main__":
    main()