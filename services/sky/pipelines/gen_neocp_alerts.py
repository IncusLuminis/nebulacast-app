# services/sky/pipelines/gen_alerts.py

from __future__ import annotations

import os
import re
import json
import yaml
import math
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta


# =========================
# CONFIG
# =========================

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))

OUTPUT_PATH = os.path.join(PROJECT_ROOT, "sites/staging/sky/data/alerts_neocp_tocp_grb.json")
os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

SERVICES_GEN_DATA = os.path.join(PROJECT_ROOT, "services/sky/data/generated")
os.makedirs(SERVICES_GEN_DATA, exist_ok=True)
GEN_DATA = os.path.join(SERVICES_GEN_DATA, "alerts_neocp_tocp_grb.json")

SOURCES_PATH = os.path.join(PROJECT_ROOT, "services/sky/pipelines/yml/sources.yml")

RAW_DIR = os.path.join(PROJECT_ROOT, "services/sky/data/raw")
os.makedirs(RAW_DIR, exist_ok=True)

# kept only as default metadata (NOT used for filtering)
OBSERVER_LAT = 52.2297
OBSERVER_LON = 21.0122

# generic filters (NOT observer-dependent)
MAX_MAG = 21.5

# per-source max ages (can be tuned)
GRB_MAX_AGE_DAYS = 3
NEOCP_MAX_AGE_HOURS = 72
TOCP_MAX_AGE_DAYS = 30

UA = "nebulacast-sky/1.0 (+https://nebulacast.com)"


# =========================
# UTILS
# =========================

def utcnow() -> datetime:
    return datetime.now(timezone.utc)

def clamp01(x: float) -> float:
    return 0.0 if x < 0.0 else (1.0 if x > 1.0 else x)

def parse_iso_utc(s: str) -> datetime | None:
    if not s:
        return None
    try:
        s = s.strip()
        if s.endswith("Z"):
            s = s.replace("Z", "+00:00")
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except Exception:
        return None

def _http_get(url: str, timeout: int = 30) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()

def fetch_text(url: str) -> str:
    return _http_get(url).decode("utf-8", errors="ignore")

def save_raw(filename: str, content: str) -> str:
    safe = re.sub(r"[^a-zA-Z0-9_.-]+", "_", filename).strip("_")
    path = os.path.join(RAW_DIR, safe)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    return path

def _canonical_alert_id(it: dict) -> str:
    """
    Normalizes TOCP-style duplicates:
      "TCP J08011102-0343141" -> "J08011102-0343141"
      "PNV J..." / "PSN J..."  -> "J..."
    For other sources keeps original id as-is (trimmed).
    """
    s = (it.get("id") or "").strip()
    if not s:
        # fallback to meta designation if id missing
        meta = it.get("meta") or {}
        s = (meta.get("designation_raw") or meta.get("title") or "").strip()

    # strip common TOCP prefixes
    s = re.sub(r"^(TCP|PNV|PSN)\s+", "", s, flags=re.IGNORECASE)
    return s.strip()


def _round6(x: float | None) -> float | None:
    if x is None:
        return None
    try:
        return round(float(x), 6)
    except Exception:
        return None


def _dedup_key_for_alert(it: dict) -> str:
    """
    Key must NOT include updated_utc, otherwise the same object updated twice won't dedup.
    We include:
      - source, group (to avoid cross-feed merges)
      - canonical id (to merge TOCP TCP/PNV/PSN vs bare J)
      - coords (rounded) to be robust and avoid wrong merges when ids are odd
    """
    src = (it.get("source") or "").strip().lower()
    grp = (it.get("group") or "").strip().lower()
    cid = _canonical_alert_id(it).upper()

    ra = _round6(it.get("ra_deg"))
    dec = _round6(it.get("dec_deg"))

    if ra is not None and dec is not None:
        return f"{src}|{grp}|{cid}|{ra}|{dec}"
    return f"{src}|{grp}|{cid}"


def _alert_info_score(it: dict) -> int:
    """
    'Richness' score used as a tiebreaker.
    """
    s = 0
    if it.get("mag") is not None:
        s += 2
    if it.get("note"):
        s += 1
    meta = it.get("meta") or {}
    if isinstance(meta, dict) and len(meta) > 0:
        s += 1
    if it.get("score_norm") is not None:
        s += 1
    if it.get("score_raw") is not None:
        s += 1
    return s


def _is_better_alert(a: dict, b: dict) -> bool:
    """
    True if a should replace b.
    Priority:
      1) newer updated_utc
      2) higher score_norm
      3) richer record (mag/note/meta/etc.)
    """
    a_dt = parse_iso_utc(a.get("updated_utc") or "")
    b_dt = parse_iso_utc(b.get("updated_utc") or "")
    a_ts = a_dt.timestamp() if a_dt else -1.0
    b_ts = b_dt.timestamp() if b_dt else -1.0
    if a_ts != b_ts:
        return a_ts > b_ts

    a_sn = a.get("score_norm")
    b_sn = b.get("score_norm")
    try:
        a_sn = float(a_sn) if a_sn is not None else None
        b_sn = float(b_sn) if b_sn is not None else None
    except Exception:
        a_sn = None
        b_sn = None

    if a_sn is not None and b_sn is not None and a_sn != b_sn:
        return a_sn > b_sn
    if a_sn is not None and b_sn is None:
        return True
    if a_sn is None and b_sn is not None:
        return False

    return _alert_info_score(a) > _alert_info_score(b)


def dedupe_alerts(items: list[dict]) -> list[dict]:
    """
    Dedup alerts by stable entity key (see _dedup_key_for_alert).
    """
    best: dict[str, dict] = {}
    for it in items:
        k = _dedup_key_for_alert(it)
        prev = best.get(k)
        if prev is None or _is_better_alert(it, prev):
            best[k] = it
    return list(best.values())

# =========================
# COORD HELPERS
# =========================

def ra_from_hms(s: str) -> float | None:
    """
    "22 34 50.4" -> degrees
    """
    try:
        parts = re.split(r"[:\s]+", s.strip())
        parts = [p for p in parts if p]
        if len(parts) < 3:
            return None
        h = float(parts[0]); m = float(parts[1]); sec = float(parts[2])
        return (h + m / 60.0 + sec / 3600.0) * 15.0
    except Exception:
        return None

def dec_from_dms(s: str) -> float | None:
    """
    "+22 38 24" -> degrees
    """
    try:
        s = s.strip().replace("\xa0", " ")
        sign = 1.0
        if s.startswith("-"):
            sign = -1.0
            s = s[1:].strip()
        elif s.startswith("+"):
            s = s[1:].strip()

        parts = re.split(r"[:\s]+", s)
        parts = [p for p in parts if p]
        if len(parts) < 3:
            return None
        d = float(parts[0]); m = float(parts[1]); sec = float(parts[2])
        return sign * (abs(d) + m / 60.0 + sec / 3600.0)
    except Exception:
        return None




# =========================
# GRB (FERMI/GBM) via HEASARC TAP
# =========================

_GRB_NAME_RE = re.compile(r"\bGRB(\d{2})(\d{2})(\d{2})(\d{3})\b")

def parse_grb_name_to_utc(name: str) -> datetime | None:
    """
    GRBYYMMDDfff, fff = thousandths of day.
    """
    if not name:
        return None
    m = _GRB_NAME_RE.search(name.strip())
    if not m:
        return None
    yy, mm, dd, fff = map(int, m.groups())
    year = 2000 + yy
    frac_day = fff / 1000.0
    seconds = int(round(frac_day * 86400.0))
    hh = seconds // 3600
    mi = (seconds % 3600) // 60
    ss = seconds % 60
    try:
        return datetime(year, mm, dd, hh, mi, ss, tzinfo=timezone.utc)
    except Exception:
        return None

def _get_heasarc_tap_service():
    try:
        import pyvo
    except Exception as e:
        raise RuntimeError("pyvo is required for HEASARC TAP. Install: pip install pyvo") from e

    endpoints = [
        "https://heasarc.gsfc.nasa.gov/xamin/vo/tap",
        "https://heasarc.gsfc.nasa.gov/vo/tap",
        "https://heasarc.gsfc.nasa.gov/tap",
    ]
    last_err = None
    for url in endpoints:
        try:
            svc = pyvo.dal.TAPService(url)
            _ = svc.search("SELECT TOP 1 table_name FROM TAP_SCHEMA.tables").to_table()
            return svc
        except Exception as e:
            last_err = e
    raise RuntimeError(f"Could not connect to HEASARC TAP. Last error: {last_err}")

def fetch_grb_fermi(group: str, top_k: int = 200) -> list[dict]:
    now = utcnow()
    cutoff = now - timedelta(days=GRB_MAX_AGE_DAYS)

    svc = _get_heasarc_tap_service()
    q = f"""
        SELECT TOP {int(top_k)}
            name, trigger_name, ra, dec, trigger_time, last_modified
        FROM fermigbrst
        ORDER BY trigger_time DESC
    """
    tbl = svc.search(q).to_table()

    items: list[dict] = []
    for r in tbl:
        name = str(r["name"]) if r["name"] is not None else ""
        trig_name = str(r["trigger_name"]) if r["trigger_name"] is not None else ""
        ra = float(r["ra"]) if r["ra"] is not None else None
        dec = float(r["dec"]) if r["dec"] is not None else None

        t_dt = parse_grb_name_to_utc(name) or parse_grb_name_to_utc(trig_name)
        if t_dt is None:
            continue
        if t_dt < cutoff:
            # because we ordered by trigger_time desc, can stop early
            break
        if ra is None or dec is None:
            continue

        items.append({
            "id": name,
            "source": "grb_fermi",
            "group": group,
            "type": "grb",
            "note": "Gamma Ray Burst",
            "score_raw": None,
            "score_norm": 1.0,
            "ra_deg": ra,
            "dec_deg": dec,
            "mag": None,
            "discovery": None,
            "updated_utc": t_dt.isoformat(),
            "ingested_utc": now.isoformat(),
            "meta": {
                "trigger_name": trig_name,
            },
        })

    return items


# =========================
# NEOCP PARSER
# =========================

_MONTHS = {
    "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
    "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12,
}

def _parse_ut_mon_dayfrac(mon: str, day_frac: str) -> datetime | None:
    try:
        mon = mon.strip().strip(".")
        if mon not in _MONTHS:
            return None

        if "." in day_frac:
            d0, frac = day_frac.split(".", 1)
            day = int(d0)
            frac_f = float("0." + frac)
        else:
            day = int(day_frac)
            frac_f = 0.0

        now = utcnow()
        year = now.year

        secs = int(round(frac_f * 86400.0))
        hh = secs // 3600
        mm = (secs % 3600) // 60
        ss = secs % 60

        dt = datetime(year, _MONTHS[mon], day, hh, mm, ss, tzinfo=timezone.utc)

        if dt > now + timedelta(days=14):
            dt = datetime(year - 1, _MONTHS[mon], day, hh, mm, ss, tzinfo=timezone.utc)
        return dt
    except Exception:
        return None

def parse_neocp(text: str, group: str) -> list[dict]:
    items: list[dict] = []
    now = utcnow()

    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue

        parts = line.split()
        if len(parts) < 8:
            continue

        try:
            obj_id = parts[0]
            score_raw = int(parts[1])

            year = int(parts[2])
            month = int(parts[3])
            discovery_day_f = float(parts[4])

            ra_hours = float(parts[5])
            dec_deg = float(parts[6])
            mag = float(parts[7])

            ra_deg = ra_hours * 15.0
            score_norm = clamp01(score_raw / 100.0)

            updated_dt = None
            action = None
            note = None

            for t in parts[8:]:
                if t in {"S", "B"}:
                    note = t
                    break

            for i, t in enumerate(parts):
                if t in {"Updated", "Added"}:
                    action = t.lower()
                    if i + 3 < len(parts) and parts[i + 3] == "UT":
                        mon = parts[i + 1].replace(".", "")
                        dayf = parts[i + 2]
                        updated_dt = _parse_ut_mon_dayfrac(mon, dayf)
                    break

            items.append({
                "id": obj_id,
                "source": "neocp",
                "group": group,
                "type": "neo",
                "note": (note or "").strip() or "Unconfirmed NEO Candidate",
                "score_raw": score_raw,
                "score_norm": score_norm,
                "ra_deg": ra_deg,
                "dec_deg": dec_deg,
                "mag": mag,
                "discovery": {
                    "year": str(year),
                    "month": f"{month:02d}",
                    "day": f"{discovery_day_f:.1f}",
                },
                "updated_utc": (updated_dt.isoformat() if updated_dt else None),
                "ingested_utc": now.isoformat(),
                "meta": {"action": action},
            })

        except Exception:
            continue

    return items


# =========================
# TOCP PARSER (ATOM)
# =========================


ATOM_NS = {"a": "http://www.w3.org/2005/Atom"}

# IAU-style J-coordinates used in TOCP:
# J08011102-0343141  ->  RA=08:01:11.02, Dec=-03:43:14.1
_JCOORD_RE = re.compile(r"\bJ(\d{2})(\d{2})(\d{2})(\d{2})([+\-])(\d{2})(\d{2})(\d{2})(\d)\b")
_TOC_PREFIXED_RE = re.compile(r"\b(TCP|PNV|PSN)\s+(J\d{8}[+\-]\d{7})\b")

def parse_tocp_jcoords_to_deg(s: str) -> tuple[float, float] | None:
    s = (s or "").strip()
    m = _JCOORD_RE.search(s)
    if not m:
        return None

    hh = int(m.group(1))
    mm = int(m.group(2))
    ss = int(m.group(3))
    ss2 = int(m.group(4))          # hundredths
    sign = -1.0 if m.group(5) == "-" else 1.0
    dd = int(m.group(6))
    dm = int(m.group(7))
    ds = int(m.group(8))
    ds1 = int(m.group(9))          # tenths

    ra_h = hh + mm / 60.0 + (ss + ss2 / 100.0) / 3600.0
    ra_deg = ra_h * 15.0

    dec_deg = sign * (dd + dm / 60.0 + (ds + ds1 / 10.0) / 3600.0)
    return ra_deg, dec_deg

def _extract_designation_from_html(content_html: str) -> str | None:
    m = re.search(r"TOCP\s+Designation:\s*([^<\r\n]+)", content_html, re.IGNORECASE)
    return m.group(1).strip() if m else None

def _extract_obsdate_from_html(content_html: str) -> str | None:
    m = re.search(r"Observation\s+Date:\s*([0-9]{4}\s+[0-9]{2}\s+[0-9.]+)", content_html, re.IGNORECASE)
    return m.group(1).strip() if m else None

def _extract_mag_from_html(content_html: str) -> float | None:
    m = re.search(r"\bmag\s*([0-9]+(?:\.[0-9]+)?)\b", content_html, re.IGNORECASE)
    if m:
        try:
            return float(m.group(1))
        except Exception:
            return None
    m = re.search(r"\bCV\s*=\s*([0-9]+(?:\.[0-9]+)?)\b", content_html, re.IGNORECASE)
    if m:
        try:
            return float(m.group(1))
        except Exception:
            return None
    return None

def parse_iso_utc(s: str) -> datetime | None:
    if not s:
        return None
    try:
        s = s.strip()
        if s.endswith("Z"):
            s = s.replace("Z", "+00:00")
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except Exception:
        return None

def parse_tocp(xml_text: str, group: str) -> list[dict]:
    items: list[dict] = []
    now = datetime.now(timezone.utc)

    root = ET.fromstring(xml_text)

    for entry in root.findall("a:entry", ATOM_NS):
        try:
            title_el = entry.find("a:title", ATOM_NS)
            updated_el = entry.find("a:updated", ATOM_NS)
            content_el = entry.find("a:content", ATOM_NS)
            cat_el = entry.find("a:category", ATOM_NS)

            title = (title_el.text or "").strip() if title_el is not None else "TOCP entry"
            updated_iso = (updated_el.text or "").strip() if updated_el is not None else ""
            updated_dt = parse_iso_utc(updated_iso)

            category = cat_el.attrib.get("term") if cat_el is not None else None
            content_html = (content_el.text or "") if content_el is not None else ""

            designation = _extract_designation_from_html(content_html) or title

            # normalize ID: prefer prefixed form if present in title
            m_pref = _TOC_PREFIXED_RE.search(title)
            if m_pref:
                prefix = m_pref.group(1)
                jbase = m_pref.group(2)  # J....
                obj_id = f"{prefix} {jbase}"
            else:
                obj_id = designation.strip()

            # coords: try from obj_id then from designation then from title
            ra_dec = (
                parse_tocp_jcoords_to_deg(obj_id)
                or parse_tocp_jcoords_to_deg(designation)
                or parse_tocp_jcoords_to_deg(title)
            )
            ra_deg = ra_dec[0] if ra_dec else None
            dec_deg = ra_dec[1] if ra_dec else None

            obsdate = _extract_obsdate_from_html(content_html)
            mag = _extract_mag_from_html(content_html)

            items.append({
                "id": obj_id,
                "source": "tocp",
                "group": group,
                "type": (category or "transient"),
                "note": "Transient Event",
                "score_raw": None,
                "score_norm": 0.5,
                "ra_deg": ra_deg,
                "dec_deg": dec_deg,
                "mag": mag,
                "discovery": None,
                "updated_utc": (updated_dt.isoformat() if updated_dt else (updated_iso or None)),
                "ingested_utc": now.isoformat(),
                "meta": {
                    "title": title,
                    "observation_date": obsdate,
                    "designation_raw": designation,
                },
            })

        except Exception:
            continue

    # optional: dedup by id (keep newest updated_utc)
    def _key_dt(it: dict) -> float:
        dt = parse_iso_utc(it.get("updated_utc") or "")
        return dt.timestamp() if dt else 0.0

    dedup: dict[str, dict] = {}
    for it in items:
        k = it["id"]
        if k not in dedup or _key_dt(it) > _key_dt(dedup[k]):
            dedup[k] = it

    return list(dedup.values())

# =========================
# FILTER / GROUP (GLOBAL ONLY)
# =========================

def filter_global(items: list[dict]) -> list[dict]:
    """
    Global filters only: age windows per source, mag ceiling, score (if present).
    NO observer-based filtering.
    """
    now = utcnow()
    out: list[dict] = []

    for it in items:
        # mag filter
        mag = it.get("mag")
        if mag is not None and mag > MAX_MAG:
            continue

        # time filter by source/group
        src = it.get("source")
        updated_dt = parse_iso_utc(it.get("updated_utc") or "")
        if updated_dt is None:
            # some feeds might omit; keep them, but they'll be "old" unknown.
            out.append(it)
            continue

        if src == "grb_fermi":
            if (now - updated_dt) > timedelta(days=GRB_MAX_AGE_DAYS):
                continue
        elif src == "neocp":
            if (now - updated_dt) > timedelta(hours=NEOCP_MAX_AGE_HOURS):
                continue
        elif src == "tocp":
            if (now - updated_dt) > timedelta(days=TOCP_MAX_AGE_DAYS):
                continue

        out.append(it)

    out.sort(key=lambda x: (x.get("score_norm") or 0.0, x.get("updated_utc") or ""), reverse=True)
    return out[:200]

def group_items(items: list[dict]) -> dict[str, list[dict]]:
    groups: dict[str, list[dict]] = {}
    for it in items:
        g = it.get("group") or "other"
        groups.setdefault(g, []).append(it)
    return groups


# =========================
# MAIN
# =========================

def main():
    with open(SOURCES_PATH, "r", encoding="utf-8") as f:
        sources = yaml.safe_load(f) or {}

    alerts_cfg = sources.get("alerts", {})
    if not isinstance(alerts_cfg, dict):
        raise RuntimeError("sources.yml: expected top-level key 'alerts'")

    raw_sources = []
    all_items: list[dict] = []

    for name, cfg in alerts_cfg.items():
        if not isinstance(cfg, dict):
            continue

        url = cfg.get("url")
        typ = cfg.get("type")
        group = cfg.get("group")

        if not url:
            continue

        raw_sources.append({"source": name, "path": url})

        try:
            if name == "grb_fermi":
                # TAP-based; url stored just for provenance
                items = fetch_grb_fermi(group=group or "grb")
                all_items.extend(items)
                print(f"[ok] {name} loaded (tap) rows={len(items)}")

            elif typ == "text":
                txt = fetch_text(url)
                save_raw(f"{name}.txt", txt)
                all_items.extend(parse_neocp(txt, group=group or name))
                print(f"[ok] {name} loaded")

            elif typ == "rss":
                xml = fetch_text(url)
                save_raw(f"{name}.xml", xml)
                all_items.extend(parse_tocp(xml, group=group or name))
                print(f"[ok] {name} loaded")

            else:
                print(f"[warn] {name}: unknown type '{typ}', skipped")

        except Exception as e:
            print(f"[warn] {name} failed: {e}")

    filtered = filter_global(all_items)
    deduped = dedupe_alerts(filtered)
    groups = group_items(deduped)

    output = {
        "generated_utc": utcnow().isoformat(),
        "observer": {
            "lat_deg": OBSERVER_LAT,
            "lon_deg": OBSERVER_LON,
        },
        "raw": raw_sources,
        "counts": {
            "total_filtered": len(deduped),
            "by_group": {k: len(v) for k, v in groups.items()},
        },
        "groups": groups,
        "items": deduped,
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    with open(GEN_DATA, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"[ok] wrote {len(deduped)} alerts -> {OUTPUT_PATH}")
    print("[summary] alerts by group:")
    for k in sorted(groups.keys()):
        print(f"  - {k}: {len(groups[k])}")


if __name__ == "__main__":
    main()