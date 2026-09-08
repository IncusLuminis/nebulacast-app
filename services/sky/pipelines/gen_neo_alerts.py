#!/usr/bin/env python3
# services/sky/pipelines/gen_neo_alerts.py
#
# Generates NEO alerts JSON from JPL SSD CAD API:
#  - PHA-only query (may be empty)
#  - Close approaches within 10LD (bounded list)
# Enriches each item with RA/DEC/(Alt/Az)/mag via JPL Horizons per-object,
# and SBDB enrichment (MOID / H / albedo / diameter estimate).
#
# Output:
#   services/sky/data/generated/alerts_neo.json
#   sites/staging/sky/data/alerts_neo.json

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

# SBDB helpers (your module)
from pipelines.lib.sbdb import fetch_sbdb, enrich_from_sbdb, estimate_diameter_km_from_h

OUT_FILENAME = "alerts_neo.json"

SITE_LAT_DEG = 52.2297
SITE_LON_DEG = 21.0122
SITE_ELEV_KM = 0.10

CAD_LOOKAHEAD_DAYS = 7

# CAD query knobs
DIST_MAX_10LD = "10LD"  # CAD supports this string directly
CAD_LIMIT = 50

# Horizons
HORIZONS_RETRIES = 4

# SBDB
SBDB_RETRIES = 3
SBDB_TIMEOUT = 25

# 1 LD in AU
LD_AU = 0.00256955529


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


def _clamp01(x: float) -> float:
    if x < 0.0:
        return 0.0
    if x > 1.0:
        return 1.0
    return x


def _cad_api_url(date_min: str, date_max: str, *, pha_only: bool, dist_max: Optional[str], limit: int = CAD_LIMIT) -> str:
    # IMPORTANT: do NOT add random/unsupported params (CAD returns 400).
    params: List[str] = [
        f"date-min={date_min}",
        f"date-max={date_max}",
        "sort=dist",
        f"limit={int(limit)}",
    ]
    if pha_only:
        params.append("pha=true")
    if dist_max:
        params.append(f"dist-max={dist_max}")
    return "https://ssd-api.jpl.nasa.gov/cad.api?" + "&".join(params)


def _parse_cad_rows(cad_json: Dict[str, Any], *, bucket: str) -> List[Dict[str, Any]]:
    fields = cad_json.get("fields") or []
    rows = cad_json.get("data") or []
    idx = {name: i for i, name in enumerate(fields)}

    out: List[Dict[str, Any]] = []
    for r in rows:
        des = r[idx["des"]] if "des" in idx else None
        cd = r[idx["cd"]] if "cd" in idx else None
        dist = r[idx["dist"]] if "dist" in idx else None
        vrel = r[idx["v_rel"]] if "v_rel" in idx else None
        h = r[idx["h"]] if "h" in idx else None
        pha = r[idx["pha"]] if "pha" in idx else None  # may be absent

        if not des or not cd:
            continue

        out.append({
            "des": str(des).strip(),          # designation
            "cd": str(cd).strip(),            # "YYYY-Mon-DD HH:MM"
            "dist_au": _as_float(dist),
            "v_rel_km_s": _as_float(vrel),
            "h_cad": _as_float(h),            # keep CAD H as fallback for diameter estimate
            "pha_flag": True if str(pha).upper() == "Y" else False,
            "bucket": bucket,                 # "pha" / "10ld"
            "raw": r,
        })
    return out


def _horizons_ephem_for_jd(target: str, site: Site, jd: float) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Returns (ephem, error_str). ephem has ra/dec/alt/az/mag if available.
    """
    location = {"lon": site.lon, "lat": site.lat, "elevation": site.elev_km}
    q = "1,4,9,10"  # RA,DEC,EL,AZ, V

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
                last_err = "missing RA/DEC"
                continue

            ephem: Dict[str, Any] = {
                "ra_deg": ra,
                "dec_deg": dec,
                "alt_deg": el,
                "az_deg": az,
            }
            if mag is not None:
                ephem["mag"] = round(mag, 2)

            return ephem, None

        except Exception as e:
            last_err = f"{type(e).__name__}: {e}"
            if attempt >= HORIZONS_RETRIES:
                break

    return None, last_err


def _derive_diameter_km(
    *,
    sbdb_h: Optional[float],
    h_cad: Optional[float],
    sbdb_albedo: Optional[float],
    sbdb_diameter_km: Optional[float],
) -> Tuple[Optional[float], Optional[float], str]:
    """
    Returns (diameter_km, diameter_est_km, diameter_source)
      - diameter_km: direct from SBDB if present
      - diameter_est_km: estimated from H (SBDB H preferred, else CAD H)
      - diameter_source: "sbdb_diameter" | "h_sbdb" | "h_cad" | "none"
    """
    if sbdb_diameter_km is not None:
        return sbdb_diameter_km, None, "sbdb_diameter"

    h_used = sbdb_h if sbdb_h is not None else h_cad
    if h_used is None:
        return None, None, "none"

    est = estimate_diameter_km_from_h(h_used, sbdb_albedo)
    if est is None:
        return None, None, "none"

    src = "h_sbdb" if sbdb_h is not None else "h_cad"
    return None, float(est), src


def _risk_score_0_1(
    *,
    moid_au: Optional[float],
    diameter_km: Optional[float],
    diameter_est_km: Optional[float],
    pha_flag: bool,
) -> float:
    """
    Internal risk proxy for ranking/UX (NOT Torino).
    Output: [0..1]
      0   = benign
      1.0 = very close and large (+PHA boost)
    """
    # MOID: 0.05 AU ~ ~19.5 LD. Below that ramps up.
    if moid_au is None:
        f_moid = 0.0
    else:
        f_moid = _clamp01(1.0 - (float(moid_au) / 0.05))

    # diameter: use real if available else estimate. Saturate at 1 km.
    d = diameter_km if diameter_km is not None else diameter_est_km
    if d is None:
        f_d = 0.0
    else:
        f_d = _clamp01(float(d) / 1.0)

    # Mix slightly favoring orbital closeness, but diameter now matters.
    score = 0.55 * f_moid + 0.45 * f_d
    if pha_flag:
        score = _clamp01(score + 0.30)

    return round(score, 4)


def _score_norm_and_raw(
    *,
    pha: bool,
    dist_au: Optional[float],
    mag: Optional[float],
    moid_au: Optional[float],
    diameter_km: Optional[float],
    diameter_est_km: Optional[float],
    risk_score: float,
) -> Tuple[float, float]:
    """
    Returns (score_norm, score_raw) where score_raw is 0..100.
    Rules:
      - PHA always-top.
      - otherwise base score from (close approach distance + brightness)
      - plus additive bonuses from (moid + diameter)
      - plus small tie-breaker from risk_score
    """
    if pha:
        return 0.95, 95.0

    # base closeness from approach distance (<=10LD)
    dist_ld: Optional[float] = None
    if dist_au is not None:
        dist_ld = dist_au / LD_AU

    if dist_ld is None:
        closeness = 0.25
    else:
        closeness = _clamp01(1.0 - (float(dist_ld) / 10.0))

    # brightness bonus
    if mag is None:
        bright = 0.0
    else:
        # mag<=18 => 1.0, mag>=22 => 0.0
        bright = _clamp01((22.0 - float(mag)) / 4.0)

    base = 0.75 * closeness + 0.25 * bright  # 0..1

    # moid factor
    if moid_au is None:
        f_moid = 0.0
    else:
        f_moid = _clamp01(1.0 - (float(moid_au) / 0.05))

    # diameter factor
    d = diameter_km if diameter_km is not None else diameter_est_km
    f_d = _clamp01((float(d) / 1.0)) if d is not None else 0.0

    # bonuses: keep modest so "tonight visibility" still matters
    bonus = 0.12 * f_moid + 0.10 * f_d

    # tiny tie-breaker from risk_score (already 0..1)
    bonus += 0.03 * float(risk_score)

    score_norm = _clamp01(base + bonus)

    # Keep non-PHA below PHA band
    score_raw = round(min(90.0, max(0.0, score_norm * 90.0)), 2)
    score_norm = round(score_raw / 100.0, 4)

    return score_norm, score_raw


def main() -> None:
    now = datetime.now(timezone.utc).replace(second=0, microsecond=0)
    stop = now + timedelta(days=CAD_LOOKAHEAD_DAYS)

    date_min = now.date().isoformat()
    date_max = stop.date().isoformat()

    site = Site(lat=SITE_LAT_DEG, lon=SITE_LON_DEG, elev_km=SITE_ELEV_KM)

    url_pha = _cad_api_url(date_min, date_max, pha_only=True, dist_max=None, limit=CAD_LIMIT)
    url_10ld = _cad_api_url(date_min, date_max, pha_only=False, dist_max=DIST_MAX_10LD, limit=CAD_LIMIT)

    print("[sky] CAD url (PHA): ", url_pha, flush=True)
    print("[sky] CAD url (10LD):", url_10ld, flush=True)

    cad_pha = fetch_json(url_pha, timeout=30, retries=4)
    cad_10ld = fetch_json(url_10ld, timeout=30, retries=4)

    rows_pha = _parse_cad_rows(cad_pha, bucket="pha")
    rows_10ld = _parse_cad_rows(cad_10ld, bucket="10ld")

    # Merge: PHA first, then 10LD; dedupe by (des, cd)
    merged: List[Dict[str, Any]] = []
    seen: set[str] = set()

    def add_rows(rows: List[Dict[str, Any]]):
        for r in rows:
            k = f"{r['des']}|{r['cd']}"
            if k in seen:
                continue
            seen.add(k)
            merged.append(r)

    add_rows(rows_pha)
    add_rows(rows_10ld)

    ingested_utc = utc_now_iso()

    items: List[Dict[str, Any]] = []
    total = len(merged)

    for i, r in enumerate(merged, start=1):
        des = r["des"]
        cd_raw = r["cd"]

        # CAD cd is "YYYY-Mon-DD HH:MM"
        try:
            t_ca_utc = datetime.strptime(cd_raw, "%Y-%b-%d %H:%M").replace(tzinfo=timezone.utc)
            t_ca_iso = iso_utc(t_ca_utc)
            jd = Time(t_ca_utc).jd
        except Exception:
            t_ca_utc = None
            t_ca_iso = None
            jd = None

        print(f"[prog] {i}/{total} des={des} bucket={r.get('bucket')} cd={cd_raw}", flush=True)

        # Horizons
        ephem = None
        horizons_err = None
        if jd is not None:
            print(f"[sky] horizons: des={des} jd={jd}", flush=True)
            ephem, horizons_err = _horizons_ephem_for_jd(des, site, float(jd))
            print(f"[sky] horizons: des={des} ok={bool(ephem)}", flush=True)

        ra = round(ephem["ra_deg"], 6) if ephem and ephem.get("ra_deg") is not None else None
        dec = round(ephem["dec_deg"], 6) if ephem and ephem.get("dec_deg") is not None else None
        mag = ephem.get("mag") if ephem else None

        # PHA flag logic: bucket=pha wins, else CAD pha_flag
        pha = True if r.get("bucket") == "pha" else bool(r.get("pha_flag", False))

        # SBDB enrichment (moid / H / albedo / diameter)
        sbdb_ok = False
        sbdb_err = None
        sbdb_moid_au = None
        sbdb_h = None
        sbdb_albedo = None
        sbdb_diameter_km = None
        sbdb_pha_flag = None

        try:
            sbdb_json = fetch_sbdb(des, timeout=SBDB_TIMEOUT, retries=SBDB_RETRIES)
            enr = enrich_from_sbdb(des, sbdb_json)
            sbdb_ok = True
            sbdb_moid_au = enr.moid_au
            sbdb_h = enr.h
            sbdb_albedo = enr.albedo
            sbdb_diameter_km = enr.diameter_km
            sbdb_pha_flag = enr.pha
        except Exception as e:
            sbdb_err = f"{type(e).__name__}: {e}"

        print(f"[sky] sbdb: des={des} ok={sbdb_ok}", flush=True)

        # diameter_est_km: prefer sbdb_h, fallback to h_cad
        diameter_km, diameter_est_km, diameter_src = _derive_diameter_km(
            sbdb_h=sbdb_h,
            h_cad=r.get("h_cad"),
            sbdb_albedo=sbdb_albedo,
            sbdb_diameter_km=sbdb_diameter_km,
        )

        # risk_score (0..1) now uses diameter too
        risk_score = _risk_score_0_1(
            moid_au=sbdb_moid_au,
            diameter_km=diameter_km,
            diameter_est_km=diameter_est_km,
            pha_flag=(pha or bool(sbdb_pha_flag)),
        )

        # score_norm/score_raw includes MOID/diameter contributions, PHA always-top
        score_norm, score_raw = _score_norm_and_raw(
            pha=pha,
            dist_au=r.get("dist_au"),
            mag=mag,
            moid_au=sbdb_moid_au,
            diameter_km=diameter_km,
            diameter_est_km=diameter_est_km,
            risk_score=risk_score,
        )

        item: Dict[str, Any] = {
            "id": des,  # per your requirement (short id for frontend dedupe)
            "source": "jpl-cad+horizons+sbdb",
            "group": "neo",
            "type": "neo",
            "title": des,
            "note": "Potentially Hazardous Asteroid (PHA)" if pha else "Close approach within 10 lunar distances",
            "score_raw": score_raw,
            "score_norm": score_norm,
            "ra_deg": ra,
            "dec_deg": dec,
            "mag": mag,
            "updated_utc": t_ca_iso,       # legacy field name; semantic = close approach time (ISO UTC)
            "ingested_utc": ingested_utc,
            "meta": {
                # keep legacy-ish label + ISO for parsing
                "t_utc": f"{cd_raw}Z",
                "t_utc_iso": t_ca_iso,
                "date_local": date_local_yyyy_mm_dd(t_ca_utc or now),

                # stable event key (to disambiguate multiple events for same des)
                "neo_event_id": f"neo:{des}:{cd_raw}",
                "bucket": r.get("bucket"),  # "pha" / "10ld"

                "pha": pha,
                "pha_cad_flag": bool(r.get("pha_flag", False)),
                "pha_sbdb_flag": sbdb_pha_flag,

                "dist_au": r.get("dist_au"),
                "dist_ld": (round(r["dist_au"] / LD_AU, 6) if r.get("dist_au") is not None else None),
                "v_rel_km_s": r.get("v_rel_km_s"),
                "h_cad": r.get("h_cad"),

                "cad_url_pha": url_pha,
                "cad_url_10ld": url_10ld,
                "cad_fields_pha": cad_pha.get("fields"),
                "cad_fields_10ld": cad_10ld.get("fields"),
                "cad_row": r.get("raw"),

                "alt_deg": ephem.get("alt_deg") if ephem else None,
                "az_deg": ephem.get("az_deg") if ephem else None,

                "horizons_ok": bool(ephem),
                "horizons_error": horizons_err,
                "horizons_query": {
                    "id": des,
                    "jd": jd,
                    "site": {"lat": site.lat, "lon": site.lon, "elev_km": site.elev_km},
                },

                # SBDB enrichment (additive-only)
                "sbdb_ok": sbdb_ok,
                "sbdb_error": sbdb_err,
                "sbdb_moid_au": sbdb_moid_au,
                "sbdb_h": sbdb_h,
                "sbdb_albedo": sbdb_albedo,
                "sbdb_diameter_km": diameter_km,
                "sbdb_diameter_est_km": diameter_est_km,
                "sbdb_diameter_source": diameter_src,

                # internal ranking helper
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

    print(f"[sky] neo alerts generated: {len(items)} items", flush=True)


if __name__ == "__main__":
    main()