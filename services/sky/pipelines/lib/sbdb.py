#!/usr/bin/env python3
# services/sky/pipelines/lib/sbdb.py

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional, Tuple
from urllib.parse import urlencode

from pipelines.lib.http import fetch_json


SBDB_BASE_URL = "https://ssd-api.jpl.nasa.gov/sbdb.api"


@dataclass(frozen=True)
class SbdbEnrichment:
    moid_au: Optional[float]
    diameter_km: Optional[float]          # direct, if present
    diameter_est_km: Optional[float]      # estimated from H + albedo (fallback)
    h: Optional[float]
    albedo: Optional[float]
    pha: Optional[bool]
    raw: Dict[str, Any]


def _as_float(x: Any) -> Optional[float]:
    try:
        if x is None:
            return None
        v = float(x)
        return v if (v == v) else None
    except Exception:
        return None


def _get_phys_value(phys_par: Any, key: str) -> Optional[float]:
    """
    SBDB phys_par can be:
      - dict of {key: {"value": "...", "sigma": "...", ...}, ...}
      - or other shapes (rare). Handle defensively.
    """
    if not isinstance(phys_par, dict):
        return None
    v = phys_par.get(key)
    if isinstance(v, dict):
        return _as_float(v.get("value"))
    return _as_float(v)


def _extract_moid_au(sbdb: Dict[str, Any]) -> Optional[float]:
    """
    SBDB orbit shape varies. MOID may appear as:
      - sbdb["orbit"]["moid"]
      - sbdb["orbit"]["elements"] list with name == "moid"
      - sometimes Earth MOID is "moid" directly (AU)
    """
    orbit = sbdb.get("orbit")
    if isinstance(orbit, dict):
        # direct field
        moid = orbit.get("moid")
        moid_f = _as_float(moid)
        if moid_f is not None:
            return moid_f

        # elements list
        els = orbit.get("elements")
        if isinstance(els, list):
            for el in els:
                if not isinstance(el, dict):
                    continue
                name = str(el.get("name") or "").strip().lower()
                if name == "moid":
                    return _as_float(el.get("value"))
                # sometimes "moid" may be "moid_au" etc.
                if "moid" in name and name in {"earth_moid", "moid_earth", "moid"}:
                    v = _as_float(el.get("value"))
                    if v is not None:
                        return v

    # last resort: scan top-level keys for something like "moid"
    for k, v in sbdb.items():
        if "moid" in str(k).lower():
            vv = _as_float(v)
            if vv is not None:
                return vv
    return None


def estimate_diameter_km_from_h(h: Optional[float], albedo: Optional[float]) -> Optional[float]:
    """
    D[km] = 1329 / sqrt(p) * 10^(-H/5)
    """
    if h is None:
        return None
    p = albedo if (albedo is not None and albedo > 0.0) else 0.14  # typical default
    import math
    return (1329.0 / math.sqrt(p)) * (10.0 ** (-h / 5.0))


def fetch_sbdb(des: str, *, timeout: int = 25, retries: int = 3) -> Dict[str, Any]:
    """
    Fetch SBDB object by designation (des).
    """
    qs = urlencode(
        {
            "des": des,
            "phys-par": "true",
            "orb": "true",
        }
    )
    url = f"{SBDB_BASE_URL}?{qs}"
    return fetch_json(url, timeout=timeout, retries=retries)


def enrich_from_sbdb(des: str, sbdb_json: Dict[str, Any]) -> SbdbEnrichment:
    phys_par = sbdb_json.get("phys_par")
    h = _get_phys_value(phys_par, "H") or _as_float(sbdb_json.get("H"))
    albedo = _get_phys_value(phys_par, "albedo")
    diameter_km = _get_phys_value(phys_par, "diameter")

    # PHA flag can appear in object section
    pha = None
    obj = sbdb_json.get("object")
    if isinstance(obj, dict):
        pha_v = obj.get("pha")
        if pha_v is not None:
            pha = bool(pha_v)

    moid_au = _extract_moid_au(sbdb_json)

    diameter_est_km = None
    if diameter_km is None:
        diameter_est_km = estimate_diameter_km_from_h(h, albedo)

    return SbdbEnrichment(
        moid_au=moid_au,
        diameter_km=diameter_km,
        diameter_est_km=diameter_est_km,
        h=h,
        albedo=albedo,
        pha=pha,
        raw=sbdb_json,
    )


def compute_risk_score_0_1(
    *,
    moid_au: Optional[float],
    diameter_km: Optional[float],
    pha_flag: bool,
) -> float:
    """
    Simple internal risk proxy for ranking/UX (NOT Torino).
    Output: [0..1]
    Semantics:
      0   = benign (far and/or tiny)
      1.0 = very close and large (+PHA boost)
    """
    def clamp01(x: float) -> float:
        return 0.0 if x < 0.0 else (1.0 if x > 1.0 else x)

    # closer -> higher
    # 0.05 AU ~ 19.5 LD, treat as "low" threshold; tweak later
    if moid_au is None:
        f_moid = 0.0
    else:
        f_moid = clamp01(1.0 - (moid_au / 0.05))

    # diameter scaling: 1 km saturates
    if diameter_km is None:
        f_d = 0.0
    else:
        f_d = clamp01(diameter_km / 1.0)

    score = 0.60 * f_moid + 0.40 * f_d
    if pha_flag:
        score = clamp01(score + 0.30)

    return round(score, 4)