#!/usr/bin/env python3
# services/sky/pipelines/gen_neo_alerts.py
#
# Generates nearby NEO alerts from JPL SSD CAD API:
#   1) PHA-only query (may be empty)
#   2) Close approaches within 10LD
# Enrich each item with:
#   - RA/DEC/Alt/Az/VMag via JPL Horizons
#   - MOID / phys params via JPL SBDB
# Produces:
#   - services/sky/data/generated/alerts_neo.json
#   - sites/staging/sky/data/alerts_neo.json
#
# Contract notes:
#  - additive-only fields
#  - keep legacy-friendly naming where already used
#  - add t_utc_iso without removing t_utc

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from astroquery.jplhorizons import Horizons
from astropy.time import Time

from pipelines.lib.http import fetch_json
from pipelines.lib.jsonio import dump_json
from pipelines.lib.paths import SERVICES_DATA_DIR, STAGING_DATA_DIR
from pipelines.lib.timeutil import utc_now_iso, iso_utc, date_local_yyyy_mm_dd
from pipelines.lib.sbdb import fetch_sbdb, enrich_from_sbdb, compute_risk_score_0_1

OUT_FILENAME = "alerts_neo.json"

SITE_LAT_DEG = 52.2297
SITE_LON_DEG = 21.0122
SITE_ELEV_KM = 0.10

CAD_LOOKAHEAD_DAYS = 7
CAD_LIMIT = 50

# CAD supports "10LD" directly
DIST_MAX_10LD = "10LD"

# Horizons
HORIZONS_TIMEOUT_S = 25
HORIZONS_RETRIES = 3

# SBDB
SBDB_TIMEOUT_S = 25
SBDB_RETRIES = 3


@dataclass(frozen=True)
class Site:
    lat: float
    lon: float
    elev_km: float


def _as_float(x: Any) -> Optional[float]:
    try:
        if x is None:
            return None
        v = float(x)
        return v if (v == v) else None
    except Exception:
        return None


def _cad_api_url(date_min: str, date_max: str, *, pha_only: bool, dist_max: Optional[str]) -> str:
    # Do NOT add "format=json" — CAD API returns JSON by default, and some setups reject format param.
    params: List[str] = [
        f"date-min={date_min}",
        f"date-max={date_max}",
        "sort=dist",
        f"limit={int(CAD_LIMIT)}",
    ]
    if pha_only:
        params.append("pha=true")
    if dist_max:
        params.append(f"dist-max={dist_max}")
    return "https://ssd-api.jpl.nasa.gov/cad.api?" + "&".join(params)


def _parse_cad_rows(cad_json: Dict[str, Any]) -> List[Dict[str, Any]]:
    fields = cad_json.get("fields") or []
    rows = cad_json.get("data") or []
    idx = {name: i for i, name in enumerate(fields)}

    out: List[Dict[str, Any]] = []
    for r in rows:
        if not isinstance(r, list):
            continue

        des = r[idx["des"]] if "des" in idx else None
        cd = r[idx["cd"]] if "cd" in idx else None
        dist = r[idx["dist"]] if "dist" in idx else None
        vrel = r[idx["v_rel"]] if "v_rel" in idx else None
        h = r[idx["h"]] if "h" in idx else None

        # PHA field may or may not be included depending on query/fields
        pha_flag = None
        if "pha" in idx:
            pha = r[idx["pha"]]
            pha_flag = True if str(pha).upper() == "Y" else False

        if not des or not cd:
            continue

        out.append(
            {
                "des": str(des).strip(),
                "cd": str(cd).strip(),  # "YYYY-Mon-DD HH:MM"
                "dist_au": _as_float(dist),
                "v_rel_km_s": _as_float(vrel),
                "h": _as_float(h),
                "pha": pha_flag,
                "raw": r,
            }
        )
    return out


def _parse_cd_to_utc_dt(cd_raw: str) -> Optional[datetime]:
    # CAD "cd" is UTC-like string "YYYY-Mon-DD HH:MM"
    try:
        return datetime.strptime(cd_raw, "%Y-%b-%d %H:%M").replace(tzinfo=timezone.utc)
    except Exception:
        return None


def _horizons_ephem_for_jd(target: str, site: Site, jd: float) -> Tuple[Optional[Dict[str, Any]], Optional[str], Dict[str, Any]]:
    """
    Returns (ephem, error, query_meta)
    ephem: {ra_deg, dec_deg, alt_deg, az_deg, mag}
    """
    location = {"lon": site.lon, "lat": site.lat, "elevation": site.elev_km}
    q = "1,4,9,10"  # RA,DEC,AZ,EL + V
    query_meta = {"target": target, "location": location, "epochs_jd": jd, "quantities": q}

    last_err: Optional[str] = None
    for attempt in range(1, HORIZONS_RETRIES + 1):
        try:
            obj = Horizons(id=target, location=location, epochs=jd)
            tab = obj.ephemerides(quantities=q)
            if len(tab) < 1:
                last_err = "empty ephemerides table"
                continue

            colnames = set(tab.colnames)

            def get_col(*names: str):
                for n in names:
                    if n in colnames:
                        return tab[n][0]
                return None

            ra = _as_float(get_col("RA"))
            dec = _as_float(get_col("DEC"))
            el = _as_float(get_col("EL", "Alt"))
            az = _as_float(get_col("AZ", "Az"))
            mag = _as_float(get_col("V", "VMag", "Vmag", "MAG", "mag"))

            if ra is None or dec is None:
                last_err = "missing RA/DEC columns"
                continue

            ephem: Dict[str, Any] = {
                "ra_deg": ra,
                "dec_deg": dec,
                "alt_deg": el,
                "az_deg": az,
            }
            if mag is not None:
                ephem["mag"] = round(mag, 2)

            return ephem, None, query_meta

        except Exception as e:
            last_err = f"{type(e).__name__}: {e}"

    return None, last_err, query_meta


def _score_norm_from_dist(dist_au: Optional[float], *, pha: bool) -> float:
    """
    Observational/importance proxy for frontend list. [0..1]
    Closer -> higher; PHA adds boost.
    """
    def clamp01(x: float) -> float:
        return 0.0 if x < 0.0 else (1.0 if x > 1.0 else x)

    if dist_au is None:
        base = 0.05
    else:
        # 10LD ~ 0.0257 AU. Make ~0.03 AU map to mid-high.
        base = clamp01(1.0 - (dist_au / 0.05))

    if pha:
        base = clamp01(base + 0.25)

    return round(base, 4)


def main() -> None:
    now = datetime.now(timezone.utc).replace(second=0, microsecond=0)
    stop = now + timedelta(days=CAD_LOOKAHEAD_DAYS)

    date_min = now.date().isoformat()
    date_max = stop.date().isoformat()

    site = Site(lat=SITE_LAT_DEG, lon=SITE_LON_DEG, elev_km=SITE_ELEV_KM)

    url_pha = _cad_api_url(date_min, date_max, pha_only=True, dist_max=None)
    url_10ld = _cad_api_url(date_min, date_max, pha_only=False, dist_max=DIST_MAX_10LD)

    print("[sky] CAD url (PHA): ", url_pha)
    print("[sky] CAD url (10LD):", url_10ld)

    cad_pha = fetch_json(url_pha, timeout=30, retries=4)
    cad_10ld = fetch_json(url_10ld, timeout=30, retries=4)

    rows_pha = _parse_cad_rows(cad_pha)
    rows_10ld = _parse_cad_rows(cad_10ld)

    # Merge: keep PHA items first, then 10LD (dedupe by des+cd)
    merged: List[Dict[str, Any]] = []
    seen: set[str] = set()

    def add_rows(rows: List[Dict[str, Any]], *, bucket: str):
        for r in rows:
            key = f"{r['des']}|{r['cd']}"
            if key in seen:
                continue
            rr = dict(r)
            rr["bucket"] = bucket  # "pha" or "10ld"
            seen.add(key)
            merged.append(rr)

    add_rows(rows_pha, bucket="pha")
    add_rows(rows_10ld, bucket="10ld")

    total = len(merged)
    ingested_utc = utc_now_iso()

    # in-memory SBDB cache by designation
    sbdb_cache: Dict[str, Dict[str, Any]] = {}

    items: List[Dict[str, Any]] = []

    for i, r in enumerate(merged, start=1):
        des = r["des"]
        cd_raw = r["cd"]
        bucket = r.get("bucket") or "10ld"

        print(f"[prog] {i}/{total} des={des} bucket={bucket} cd={cd_raw}", flush=True)

        t_utc_dt = _parse_cd_to_utc_dt(cd_raw)
        jd = Time(t_utc_dt).jd if t_utc_dt else None

        # Horizons (sky position)
        ephem = None
        horizons_err = None
        horizons_query = None
        if jd is not None:
            print(f"[sky] horizons: des={des} jd={jd}", flush=True)
            ephem, horizons_err, horizons_query = _horizons_ephem_for_jd(des, site, jd)
            print(f"[sky] horizons: des={des} ok={bool(ephem)}", flush=True)

        # SBDB (physics/orbit) — do even if Horizons failed
        sbdb_ok = False
        sbdb_err = None
        sbdb_enr = None

        try:
            if des in sbdb_cache:
                sbdb_json = sbdb_cache[des]
            else:
                sbdb_json = fetch_sbdb(des, timeout=SBDB_TIMEOUT_S, retries=SBDB_RETRIES)
                sbdb_cache[des] = sbdb_json

            sbdb_enr = enrich_from_sbdb(des, sbdb_json)
            sbdb_ok = True
            print(f"[sky] sbdb: des={des} ok=True", flush=True)

        except Exception as e:
            sbdb_err = f"{type(e).__name__}: {e}"
            print(f"[sky] sbdb: des={des} ok=False ({sbdb_err})", flush=True)

        # Resolve phys fields
        # Prefer SBDB H if present, else CAD H
        h_val = None
        albedo = None
        diameter_km = None
        diameter_est_km = None
        moid_au = None
        sbdb_pha = None

        if sbdb_enr is not None:
            moid_au = sbdb_enr.moid_au
            diameter_km = sbdb_enr.diameter_km
            diameter_est_km = sbdb_enr.diameter_est_km
            h_val = sbdb_enr.h if sbdb_enr.h is not None else r.get("h")
            albedo = sbdb_enr.albedo
            sbdb_pha = sbdb_enr.pha
        else:
            h_val = r.get("h")

        # PHA: bucket==pha wins; else SBDB if present; else CAD field if present
        pha_flag = True if bucket == "pha" else bool(sbdb_pha) if sbdb_pha is not None else bool(r.get("pha") or False)

        # Risk score uses MOID + diameter (direct else estimated)
        d_for_risk = diameter_km if diameter_km is not None else diameter_est_km
        risk_score = compute_risk_score_0_1(moid_au=moid_au, diameter_km=d_for_risk, pha_flag=pha_flag)

        # score_norm for frontend: based on close approach distance (+PHA boost)
        score_norm = _score_norm_from_dist(r.get("dist_au"), pha=pha_flag)

        # positions
        ra = round(ephem["ra_deg"], 6) if ephem and ephem.get("ra_deg") is not None else None
        dec = round(ephem["dec_deg"], 6) if ephem and ephem.get("dec_deg") is not None else None
        mag = ephem.get("mag") if ephem else None

        # Contract: keep legacy-like fields, additive-only metadata
        # IMPORTANT: id must be only designation (per your rule)
        item: Dict[str, Any] = {
            "id": des,
            "source": "jpl-cad+horizons+sbdb",
            "group": "neo",
            "type": "neo",
            "title": ("PHA close approach: " if pha_flag else "NEO close approach: ") + des,
            "note": "Potentially Hazardous Asteroid (PHA)" if pha_flag else "Close approach within 10 lunar distances",
            "score_raw": None,
            "score_norm": score_norm,
            "ra_deg": ra,
            "dec_deg": dec,
            "mag": mag,
            # legacy field name kept; semantics = close-approach time in ISO
            "updated_utc": iso_utc(t_utc_dt) if t_utc_dt else None,
            "ingested_utc": ingested_utc,
            "meta": {
                # keep legacy non-ISO string for compatibility
                "t_utc": cd_raw + "Z",
                # additive ISO field for robust parsing
                "t_utc_iso": iso_utc(t_utc_dt) if t_utc_dt else None,
                # additive neutral semantic alias
                "ca_time_utc": iso_utc(t_utc_dt) if t_utc_dt else None,
                "date_local": date_local_yyyy_mm_dd(t_utc_dt or now),
                "bucket": bucket,  # "pha" / "10ld"
                "pha": pha_flag,
                "dist_au": r.get("dist_au"),
                "v_rel_km_s": r.get("v_rel_km_s"),
                "h": h_val,
                "cad_url_pha": url_pha,
                "cad_url_10ld": url_10ld,
                "cad_fields_pha": cad_pha.get("fields"),
                "cad_fields_10ld": cad_10ld.get("fields"),
                "cad_row": r.get("raw"),
                "alt_deg": ephem.get("alt_deg") if ephem else None,
                "az_deg": ephem.get("az_deg") if ephem else None,
                "horizons_ok": bool(ephem),
                "horizons_error": horizons_err,
                "horizons_query": horizons_query,
                "sbdb_ok": sbdb_ok,
                "sbdb_error": sbdb_err,
                "sbdb": {
                    "moid_au": moid_au,
                    "diameter_km": diameter_km,
                    "diameter_est_km": diameter_est_km,
                    "albedo": albedo,
                    "H": h_val,
                },
                "risk_score": risk_score,
            },
        }

        items.append(item)

    out = {
        "generated_utc": utc_now_iso(),
        "source": "JPL SSD CAD API + JPL Horizons + JPL SBDB",
        "counts": {
            "pha_rows": len(rows_pha),
            "ld10_rows": len(rows_10ld),
            "items": len(items),
        },
        "items": items,
    }

    dump_json(SERVICES_DATA_DIR / OUT_FILENAME, out)
    dump_json(STAGING_DATA_DIR / OUT_FILENAME, out)

    print(f"[sky] neo alerts generated: {len(items)} items")


if __name__ == "__main__":
    main()