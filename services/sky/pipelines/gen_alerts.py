#!/usr/bin/env python3
# services/sky/pipelines/gen_alerts.py
#
# Merge multiple pre-generated alert JSONs into a single alerts_now.json
# (frontend contract preserved: generated_utc, observer, raw, counts, groups, items).
#
# Inputs (expected in STAGING_DATA_DIR):
#   - alerts_neocp_tocp_grb.json
#   - alerts_neo.json
#   - alerts_risk.json
#   - alerts_gcn.json
#   - alerts_pha.json
#
# Outputs:
#   - sites/staging/sky/data/alerts_now.json
#   - services/sky/data/generated/alerts_now.json
#
# Adds external scoring in meta.scoring.* and overwrites score_norm/score_raw
# with the global score computed at merge-time (PHA gets hard-floor).

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from pipelines.lib.paths import PROJECT_ROOT, SERVICES_DATA_DIR, STAGING_DATA_DIR
from pipelines.lib.jsonio import dump_json
from pipelines.lib.timeutil import utc_now_iso
from pipelines.lib.scoring import (
    score_hazard_v1,
    score_urgency_v1,
    score_external_v1,
    merge_global_score_v1,
)

OUT_FILENAME = "alerts_now.json"

# kept only as default metadata (NOT used for filtering here)
OBSERVER_LAT = 52.2297
OBSERVER_LON = 21.0122


# -------------------------
# helpers
# -------------------------

def _parse_iso_utc(s: str) -> Optional[datetime]:
    if not s:
        return None
    try:
        ss = s.strip()
        if ss.endswith("Z"):
            ss = ss[:-1] + "+00:00"
        dt = datetime.fromisoformat(ss)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except Exception:
        return None


def _as_float(x: Any) -> Optional[float]:
    try:
        if x is None:
            return None
        v = float(x)
        return v if (v == v) else None
    except Exception:
        return None


def _canonical_alert_id(it: Dict[str, Any]) -> str:
    """
    Normalizes TOCP-style duplicates:
      "TCP J08011102-0343141" -> "J08011102-0343141"
      "PNV J..." / "PSN J..." -> "J..."
    For other sources keeps original id as-is.
    """
    import re
    s = str(it.get("id") or "").strip()
    if not s:
        meta = it.get("meta") or {}
        if isinstance(meta, dict):
            s = str(meta.get("designation_raw") or meta.get("title") or "").strip()
    s = re.sub(r"^(TCP|PNV|PSN)\s+", "", s, flags=re.IGNORECASE)
    return s.strip()


def _round6(x: Any) -> Optional[float]:
    v = _as_float(x)
    if v is None:
        return None
    return round(v, 6)


def _dedup_key_for_alert(it: Dict[str, Any]) -> str:
    """
    Key must NOT include updated_utc, otherwise same object updated twice won't dedup.
    Include:
      - source, group
      - canonical id
      - coords (rounded) if present (helps avoid wrong merges with odd ids)
    """
    src = str(it.get("source") or "").strip().lower()
    grp = str(it.get("group") or "").strip().lower()
    cid = _canonical_alert_id(it).upper()

    ra = _round6(it.get("ra_deg"))
    dec = _round6(it.get("dec_deg"))

    if ra is not None and dec is not None:
        return f"{src}|{grp}|{cid}|{ra}|{dec}"
    return f"{src}|{grp}|{cid}"


def _alert_richness_score(it: Dict[str, Any]) -> int:
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


def _is_better_alert(a: Dict[str, Any], b: Dict[str, Any]) -> bool:
    """
    True if a should replace b.
    Priority:
      1) newer updated_utc
      2) higher score_norm
      3) richer record
    """
    a_dt = _parse_iso_utc(str(a.get("updated_utc") or ""))
    b_dt = _parse_iso_utc(str(b.get("updated_utc") or ""))
    a_ts = a_dt.timestamp() if a_dt else -1.0
    b_ts = b_dt.timestamp() if b_dt else -1.0
    if a_ts != b_ts:
        return a_ts > b_ts

    a_sn = _as_float(a.get("score_norm"))
    b_sn = _as_float(b.get("score_norm"))
    if a_sn is not None and b_sn is not None and a_sn != b_sn:
        return a_sn > b_sn
    if a_sn is not None and b_sn is None:
        return True
    if a_sn is None and b_sn is not None:
        return False

    return _alert_richness_score(a) > _alert_richness_score(b)


def _dedupe_alerts(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    best: Dict[str, Dict[str, Any]] = {}
    for it in items:
        k = _dedup_key_for_alert(it)
        prev = best.get(k)
        if prev is None or _is_better_alert(it, prev):
            best[k] = it
    return list(best.values())


def _sort_items(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    # primary: score_norm desc (None -> -1), secondary: updated_utc desc
    def key(it: Dict[str, Any]) -> Tuple[float, float]:
        sn = _as_float(it.get("score_norm"))
        snv = sn if sn is not None else -1.0
        dt = _parse_iso_utc(str(it.get("updated_utc") or "")) or _parse_iso_utc(str(it.get("ingested_utc") or ""))
        ts = dt.timestamp() if dt else 0.0
        return (snv, ts)

    return sorted(items, key=key, reverse=True)


def _load_json(path: Path) -> Optional[Dict[str, Any]]:
    try:
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return None
    except Exception as e:
        print(f"[warn] failed to read {path}: {type(e).__name__}: {e}", flush=True)
        return None


@dataclass(frozen=True)
class InputSpec:
    filename: str
    default_group: str
    source_tag: str


INPUTS: List[InputSpec] = [
    InputSpec("alerts_neocp_tocp_grb.json", default_group="alerts", source_tag="neocp_tocp_grb"),
    InputSpec("alerts_neo.json",            default_group="neo",    source_tag="neo"),
    InputSpec("alerts_risk.json",           default_group="risk",   source_tag="risk"),
    InputSpec("alerts_gcn.json",            default_group="gcn",    source_tag="gcn"),
    InputSpec("alerts_pha.json",            default_group="pha",    source_tag="pha"),
]


def _normalize_item(it: Dict[str, Any], *, default_group: str) -> Dict[str, Any]:
    it2 = dict(it)
    if not it2.get("group"):
        it2["group"] = default_group
    return it2


def _gcn_promote_meta_fields(it: Dict[str, Any]) -> Dict[str, Any]:
    """
    For GCN-group items: promote enrichment fields from meta to top-level
    if they are absent at the top level.  These fields are written by the
    inline enrichment in gen_gcn_alerts.py; this promotion ensures they
    survive into alerts_now.json even for items ingested before the merge.

    Fields promoted (all additive-only):
      title        – human-readable event title
      ui_type      – event-class label  (e.g. "GW alert")
      ui_type_hint – plain-text description sentence
      ui_type_html – HTML snippet for richer rendering
    """
    grp = str(it.get("group") or "").strip().lower()
    if grp != "gcn":
        return it

    meta = it.get("meta")
    if not isinstance(meta, dict):
        return it

    it2 = dict(it)
    for field in ("title", "ui_type", "ui_type_hint", "ui_type_html"):
        if not it2.get(field) and meta.get(field):
            it2[field] = meta[field]
    return it2


# -------------------------
# scoring (delegated to lib/scoring.py)
# -------------------------

def _apply_scoring(items: List[Dict[str, Any]], *, now_utc: str) -> None:
    """
    Compute and attach all three scoring models + global merge to each item in-place.
    Writes into meta.scoring: version, internal, hazard, urgency, external, global.
    Overwrites item.score_norm and item.score_raw from global.score_norm.
    """
    pha_floor = 0.95

    for it in items:
        if not isinstance(it, dict):
            continue

        meta = it.get("meta")
        if not isinstance(meta, dict):
            meta = {}
            it["meta"] = meta

        # Preserve pre-merge (internal) scores
        internal_sn = _as_float(it.get("score_norm"))
        internal_sr = _as_float(it.get("score_raw"))

        # Compute the three scoring models
        hazard  = score_hazard_v1(it)
        urgency = score_urgency_v1(it, now_utc=now_utc)
        external = score_external_v1(
            it,
            now_utc=now_utc,
            hazard_score_norm=hazard["score_norm"],
            urgency_score_norm=urgency["score_norm"],
        )
        global_score = merge_global_score_v1(
            {"hazard": hazard, "urgency": urgency, "external": external},
            pha_floor=pha_floor,
        )

        # Write back top-level score fields (preserved contract)
        it["score_norm"] = global_score["score_norm"]
        it["score_raw"]  = global_score["score_raw"]

        # Attach explainable scoring payload in meta.scoring (additive-only)
        scoring = meta.get("scoring")
        if not isinstance(scoring, dict):
            scoring = {}

        scoring["version"]  = "v1"
        scoring["internal"] = {
            "score_norm": internal_sn,
            "score_raw":  internal_sr,
            "source":     str(it.get("source") or ""),
        }
        scoring["hazard"]   = hazard
        scoring["urgency"]  = urgency
        scoring["external"] = external
        scoring["global"]   = global_score

        meta["scoring"] = scoring


# -------------------------
# main
# -------------------------

def main() -> None:
    staging_in = STAGING_DATA_DIR
    staging_out = STAGING_DATA_DIR / OUT_FILENAME
    services_out = SERVICES_DATA_DIR / OUT_FILENAME

    raw_list: List[Dict[str, Any]] = []
    all_items: List[Dict[str, Any]] = []

    for spec in INPUTS:
        p = staging_in / spec.filename
        doc = _load_json(p)
        if not doc:
            # missing OR invalid OR empty -> skip
            print(f"[sky] input missing/empty: {p}", flush=True)
            continue

        items = doc.get("items") or []
        if not isinstance(items, list) or len(items) == 0:
            # empty items -> skip (your rule: don't surface empty feeds)
            print(f"[sky] input has no items: {p}", flush=True)
            continue

        # raw provenance entry: stable relative path from PROJECT_ROOT
        try:
            rel_str = str(p.relative_to(PROJECT_ROOT))
        except Exception:
            rel_str = str(p)

        raw_list.append({"source": spec.source_tag, "path": rel_str})

        for it in items:
            if not isinstance(it, dict):
                continue
            norm = _normalize_item(it, default_group=spec.default_group)
            norm = _gcn_promote_meta_fields(norm)
            all_items.append(norm)

        print(f"[ok] loaded {spec.filename} items={len(items)}", flush=True)

    # Merge + dedupe
    deduped = _dedupe_alerts(all_items)

    # Scoring: hazard_v1 + urgency_v1 + external_v1 + global merge (mutates items in-place)
    now_utc = utc_now_iso()
    _apply_scoring(deduped, now_utc=now_utc)

    # Group + sort
    groups: Dict[str, List[Dict[str, Any]]] = {}
    for it in deduped:
        g = str(it.get("group") or "other")
        groups.setdefault(g, []).append(it)

    for g in list(groups.keys()):
        groups[g] = _sort_items(groups[g])

    items_flat = _sort_items(deduped)

    counts_by_group = {g: len(arr) for g, arr in groups.items()}
    total = sum(counts_by_group.values())

    out = {
        "generated_utc": utc_now_iso(),
        "observer": {"lat_deg": OBSERVER_LAT, "lon_deg": OBSERVER_LON},
        "raw": raw_list,
        "counts": {
            "total_filtered": total,
            "by_group": counts_by_group,
        },
        "groups": groups,
        "items": items_flat,
    }

    dump_json(staging_out, out)
    dump_json(services_out, out)

    print(f"[sky] wrote merged alerts -> {staging_out}", flush=True)
    print(f"[sky] wrote merged alerts -> {services_out}", flush=True)

    # Diagnostics
    print("[diag] alerts by group:", flush=True)
    for g in sorted(counts_by_group.keys()):
        print(f"  - {g}: {counts_by_group.get(g, 0)}", flush=True)


if __name__ == "__main__":
    main()