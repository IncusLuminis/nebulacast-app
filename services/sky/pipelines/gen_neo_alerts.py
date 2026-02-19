#!/usr/bin/env python3
# services/sky/pipelines/gen_neo_alerts.py
#
# Generates NEO alerts JSON from JPL SSD CAD API:
#  - PHA-only query (may be empty)
#  - Close approaches within 10LD (bounded list)
# Enriches each item with RA/DEC/(Alt/Az)/mag via JPL Horizons per-object,
# optionally SBDB enrichment (if implemented in your current branch).
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

OUT_FILENAME = "alerts_neo.json"

SITE_LAT_DEG = 52.2297
SITE_LON_DEG = 21.0122
SITE_ELEV_KM = 0.10

CAD_LOOKAHEAD_DAYS = 7

# Two queries
DIST_MAX_10LD = "10LD"  # CAD supports this string directly
HORIZONS_RETRIES = 4

# 1 LD in AU
LD_AU = 0.00256955529


@dataclass(frozen=True)
class Site:
    lat: float
    lon: float
    elev_km: float


def _as_float(x: Any) -> Optional[float]:
    try:
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


def _cad_api_url(date_min: str, date_max: str, *, pha_only: bool, dist_max: Optional[str], limit: int = 50) -> str:
    # CAD API supports "format=json" (but may reject unknown params if typoed).
    # Keeping it is fine if it works in your environment.
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
            "des": str(des).strip(),
            "cd": str(cd).strip(),  # "YYYY-Mon-DD HH:MM"
            "dist_au": _as_float(dist),
            "v_rel_km_s": _as_float(vrel),
            "h": _as_float(h),
            "pha_flag": True if str(pha).upper() == "Y" else False,
            "bucket": bucket,  # "pha" / "10ld"
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


def _score_neo(*, pha: bool, dist_au: Optional[float], mag: Optional[float]) -> Tuple[float, float]:
    """
    Returns (score_norm, score_raw) where score_raw is 0..100.
    Heuristic:
      - PHA gets high baseline
      - otherwise: closer + brighter => higher
    """
    if pha:
        # Strongly prioritize: always bubble up
        return 0.95, 95.0

    dist_ld: Optional[float] = None
    if dist_au is not None:
        dist_ld = dist_au / LD_AU

    # closeness in [0..1], 1 = at 0 LD, 0 = at >=10 LD (or unknown)
    if dist_ld is None:
        closeness = 0.25  # conservative default if distance missing
    else:
        closeness = _clamp01(1.0 - (dist_ld / 10.0))

    # brightness bonus in [0..1]
    if mag is None:
        bright = 0.0
    else:
        # mag<=18 => 1.0, mag>=22 => 0.0 (linear)
        bright = _clamp01((22.0 - float(mag)) / 4.0)

    # Weighted mix
    score_norm = _clamp01(0.80 * closeness + 0.20 * bright)

    # Keep non-PHA below PHA range
    score_raw = round(min(90.0, max(0.0, score_norm * 90.0)), 2)
    score_norm = round(score_raw / 100.0, 4)

    return score_norm, score_raw


def main() -> None:
    now = datetime.now(timezone.utc).replace(second=0, microsecond=0)
    stop = now + timedelta(days=CAD_LOOKAHEAD_DAYS)

    date_min = now.date().isoformat()
    date_max = stop.date().isoformat()

    site = Site(lat=SITE_LAT_DEG, lon=SITE_LON_DEG, elev_km=SITE_ELEV_KM)

    url_pha = _cad_api_url(date_min, date_max, pha_only=True, dist_max=None, limit=50)
    url_10ld = _cad_api_url(date_min, date_max, pha_only=False, dist_max=DIST_MAX_10LD, limit=50)

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

        ephem = None
        horizons_err = None
        if jd is not None:
            print(f"[sky] horizons: des={des} jd={jd}", flush=True)
            ephem, horizons_err = _horizons_ephem_for_jd(des, site, float(jd))
            print(f"[sky] horizons: des={des} ok={bool(ephem)}", flush=True)

        # If Horizons failed, keep record (valuable), but RA/DEC may be None -> not plottable
        ra = round(ephem["ra_deg"], 6) if ephem and ephem.get("ra_deg") is not None else None
        dec = round(ephem["dec_deg"], 6) if ephem and ephem.get("dec_deg") is not None else None
        mag = ephem.get("mag") if ephem else None

        pha = True if r.get("bucket") == "pha" else bool(r.get("pha_flag", False))

        score_norm, score_raw = _score_neo(pha=pha, dist_au=r.get("dist_au"), mag=mag)

        item: Dict[str, Any] = {
            # Per your request: ONLY designation
            "id": des,
            "source": "jpl-cad+horizons",
            "group": "neo",
            "type": "neo",
            "title": ("PHA close approach: " if pha else "NEO close approach: ") + des,
            "note": "Potentially Hazardous Asteroid (PHA)" if pha else "Close approach within 10 lunar distances",
            "score_raw": score_raw,
            "score_norm": score_norm,
            "ra_deg": ra,
            "dec_deg": dec,
            "mag": mag,
            # keep legacy-ish field name, but semantics = close-approach time in ISO
            "updated_utc": t_ca_iso,
            "ingested_utc": ingested_utc,
            "meta": {
                # additively keep the old label + ISO
                "t_utc": f"{cd_raw}Z",
                "t_utc_iso": t_ca_iso,
                "date_local": date_local_yyyy_mm_dd(t_ca_utc or now),

                # stable event key (to disambiguate if needed later)
                "neo_event_id": f"neo:{des}:{cd_raw}",

                "bucket": r.get("bucket"),  # "pha" / "10ld"
                "pha": pha,
                "dist_au": r.get("dist_au"),
                "dist_ld": (round(r["dist_au"] / LD_AU, 6) if r.get("dist_au") is not None else None),
                "v_rel_km_s": r.get("v_rel_km_s"),
                "h": r.get("h"),

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
            },
        }

        items.append(item)

    out = {
        "generated_utc": utc_now_iso(),
        "source": "JPL SSD CAD API + JPL Horizons (per-object ephemerides)",
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