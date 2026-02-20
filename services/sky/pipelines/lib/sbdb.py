#!/usr/bin/env python3
# services/sky/pipelines/lib/sbdb.py

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional
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
    SBDB phys_par is usually a dict:
      { "diameter": {"value": "...", ...}, "H": {"value": "...", ...}, ... }
    """
    if not isinstance(phys_par, dict):
        return None
    v = phys_par.get(key)
    if isinstance(v, dict):
        return _as_float(v.get("value"))
    return _as_float(v)


def _extract_moid_au(sbdb: Dict[str, Any]) -> Optional[float]:
    """
    MOID may appear as:
      - sbdb["orbit"]["moid"]
      - sbdb["orbit"]["elements"] list with name == "moid"
    """
    orbit = sbdb.get("orbit")
    if isinstance(orbit, dict):
        moid = _as_float(orbit.get("moid"))
        if moid is not None:
            return moid

        els = orbit.get("elements")
        if isinstance(els, list):
            for el in els:
                if not isinstance(el, dict):
                    continue
                name = str(el.get("name") or "").strip().lower()
                if name == "moid":
                    return _as_float(el.get("value"))

    # last resort: scan top-level keys
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
    p = albedo if (albedo is not None and albedo > 0.0) else 0.14
    import math
    return (1329.0 / math.sqrt(p)) * (10.0 ** (-h / 5.0))


def build_sbdb_url(
    des: str,
    *,
    phys_par: bool = True,
    ca_data: bool = True,
    vi_data: bool = True,
    cd_epoch: bool = False,
) -> str:
    """
    Builds SBDB API URL in the proven-working form:
      https://ssd-api.jpl.nasa.gov/sbdb.api?des=2026%20CO&phys-par=1&ca-data=1&vi-data=1

    Notes:
      - NO quotes around designation
      - spaces URL-encoded by urlencode
      - params use hyphenated names (phys-par, ca-data, vi-data)
    """
    params: Dict[str, Any] = {"des": des}
    if phys_par:
        params["phys-par"] = 1
    if ca_data:
        params["ca-data"] = 1
    if vi_data:
        params["vi-data"] = 1
    if cd_epoch:
        params["cd-epoch"] = 1

    qs = urlencode(params)
    return f"{SBDB_BASE_URL}?{qs}"


def fetch_sbdb(
    des: str,
    *,
    timeout: int = 25,
    retries: int = 3,
    phys_par: bool = True,
    ca_data: bool = True,
    vi_data: bool = True,
    cd_epoch: bool = False,
) -> Dict[str, Any]:
    """
    Fetch SBDB object by designation (des).
    """
    url = build_sbdb_url(
        des,
        phys_par=phys_par,
        ca_data=ca_data,
        vi_data=vi_data,
        cd_epoch=cd_epoch,
    )
    return fetch_json(url, timeout=timeout, retries=retries)


def enrich_from_sbdb(des: str, sbdb_json: Dict[str, Any]) -> SbdbEnrichment:
    phys_par = sbdb_json.get("phys_par")

    # H can live in phys_par["H"].value or in other places; keep defensive.
    h = _get_phys_value(phys_par, "H") or _as_float(sbdb_json.get("H")) or _as_float(sbdb_json.get("h"))
    albedo = _get_phys_value(phys_par, "albedo")
    diameter_km = _get_phys_value(phys_par, "diameter")

    # PHA flag: SBDB typically uses object.pha (boolean)
    pha = None
    obj = sbdb_json.get("object")
    if isinstance(obj, dict) and "pha" in obj:
        try:
            pha = bool(obj.get("pha"))
        except Exception:
            pha = None

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
    Simple internal risk proxy for ranking/UX (NOT Torino scale).
    Output: [0..1]
      0.0 = benign (far and/or tiny)
      1.0 = very close and large (+PHA boost)
    """
    def clamp01(x: float) -> float:
        return 0.0 if x < 0.0 else (1.0 if x > 1.0 else x)

    # MOID scaling: <=0.0 is max-risk; 0.05 AU (~19.5 LD) ~ low baseline.
    if moid_au is None:
        f_moid = 0.0
    else:
        f_moid = clamp01(1.0 - (moid_au / 0.05))

    # Diameter scaling: saturate at 1 km
    if diameter_km is None:
        f_d = 0.0
    else:
        f_d = clamp01(diameter_km / 1.0)

    score = 0.60 * f_moid + 0.40 * f_d
    if pha_flag:
        score = clamp01(score + 0.30)

    return round(score, 4)