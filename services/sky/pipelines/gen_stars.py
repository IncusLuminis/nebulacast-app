#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Generate static stars JSON from HYG v41 catalog.

Source:
  services/sky/data/raw/hygdata_v41.csv

Output:
  services/sky/data/stars_v2_hyg.json
  sites/staging/sky/data/stars_v2_hyg.json

Notes:
  - id_scheme: HIP (fallback to HYG id if HIP missing)
  - epoch: J2000 / ICRS
  - no external network calls
"""

from __future__ import annotations

import csv
import json
import math
from datetime import datetime, timezone
from pathlib import Path


# -----------------------------
# CONFIG
# -----------------------------
LIMIT_MAG = 5.0
OUT_FILENAME = "stars.json"

RAW_FILENAME = "hygdata_v41.csv"

# Greek letters for Bayer designations
GREEK = {
    "Alpha": "α", "Beta": "β", "Gamma": "γ", "Delta": "δ",
    "Epsilon": "ε", "Zeta": "ζ", "Eta": "η", "Theta": "θ",
    "Iota": "ι", "Kappa": "κ", "Lambda": "λ", "Mu": "μ",
    "Nu": "ν", "Xi": "ξ", "Omicron": "ο", "Pi": "π",
    "Rho": "ρ", "Sigma": "σ", "Tau": "τ", "Upsilon": "υ",
    "Phi": "φ", "Chi": "χ", "Psi": "ψ", "Omega": "ω",
}


# -----------------------------
# Paths
# services/sky/pipelines/gen_stars.py
# -> project root is 3 levels up
# -----------------------------
PROJECT_ROOT = Path(__file__).resolve().parents[3]

RAW_PATH = PROJECT_ROOT / "services" / "sky" / "data" / "raw" / RAW_FILENAME
SERVICES_DATA_DIR = PROJECT_ROOT / "services" / "sky" / "data" / "generated" 
STAGING_DATA_DIR = PROJECT_ROOT / "sites" / "staging" / "sky" / "data"


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def dump_json(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(obj, ensure_ascii=False, indent=2, allow_nan=False) + "\n",
        encoding="utf-8"
    )


def format_bayer(bayer: str | None, con: str | None) -> str | None:
    if not bayer or not con:
        return None
    greek = GREEK.get(bayer, bayer)
    return f"{greek} {con}"


def main() -> None:
    if not RAW_PATH.exists():
        raise FileNotFoundError(f"HYG catalog not found: {RAW_PATH}")

    stars = []

    with RAW_PATH.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)

        for row in reader:
            try:
                mag = float(row["mag"]) if row["mag"] else None
            except ValueError:
                continue

            if mag is None or mag > LIMIT_MAG:
                continue

            try:
                ra_hours = float(row["ra"])       # 0..24
                dec_deg  = float(row["dec"])      # -90..+90 (у HYG это уже градусы)

                ra_deg = (ra_hours * 15.0) % 360.0
                dec_deg = dec_deg

            except (TypeError, ValueError):
                continue

            if not (math.isfinite(ra_deg) and math.isfinite(dec_deg)):
                continue

            hip = row.get("hip")
            hyg_id = int(row["id"])

            # ID scheme: prefer HIP, fallback to HYG id
            star_id = int(hip) if hip and hip.isdigit() else hyg_id

            proper = (row.get("proper") or "").strip()

            # ❌ Exclude Sun (handled separately as a dynamic object)
            if proper.lower() == "sol":
                continue

            name = (row.get("proper") or "").strip()
            bayer = (row.get("bayer") or "").strip()
            con = (row.get("con") or "").strip()

            designation = format_bayer(bayer, con)

            # HD catalog number
            hd_raw = (row.get("hd") or "").strip()
            hd = int(hd_raw) if hd_raw.isdigit() else None

            # Spectral type
            spect = (row.get("spect") or "").strip() or None

            # Distance in parsecs (HYG stores 0 for Sun; skip zero/missing)
            dist_raw = (row.get("dist") or "").strip()
            try:
                dist_val = float(dist_raw)
                dist_pc = round(dist_val, 2) if dist_val > 0 else None
            except (ValueError, TypeError):
                dist_pc = None

            stars.append({
                "id": star_id,
                "hip": int(hip) if hip and hip.isdigit() else None,
                "hd": hd,
                "name": name,
                "designation": designation or "",
                "ra_deg": round(ra_deg, 6),
                "dec_deg": round(dec_deg, 6),
                "mag": round(mag, 2),
                "spect": spect,
                "dist_pc": dist_pc,
            })

    stars.sort(key=lambda s: s["id"])

    out = {
        "version": 2,
        "epoch": "J2000",
        "generated_at": utc_now_iso(),
        "source": "HYG v41",
        "id_scheme": "HIP|HYG",
        "limit_mag": LIMIT_MAG,
        "stars": stars,
    }

    out_services = SERVICES_DATA_DIR / OUT_FILENAME
    out_staging = STAGING_DATA_DIR / OUT_FILENAME

    dump_json(out_services, out)
    dump_json(out_staging, out)

    mags = [s["mag"] for s in stars]
    print(f"[sky] stars generated: {len(stars)} (Vmag ≤ {LIMIT_MAG})")
    print(f"[sky] min/max Vmag: {min(mags):.2f} / {max(mags):.2f}")
    print(f"[sky] wrote: {out_services}")
    print(f"[sky] wrote: {out_staging}")


if __name__ == "__main__":
    main()