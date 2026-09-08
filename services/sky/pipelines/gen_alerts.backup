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
import math
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import yaml

from pipelines.lib.paths import PROJECT_ROOT, SERVICES_DATA_DIR, STAGING_DATA_DIR
from pipelines.lib.jsonio import dump_json
from pipelines.lib.timeutil import utc_now_iso

OUT_FILENAME = "alerts_now.json"

# kept only as default metadata (NOT used for filtering here)
OBSERVER_LAT = 52.2297
OBSERVER_LON = 21.0122

RULES_PATH = PROJECT_ROOT / "services" / "sky" / "pipelines" / "yml" / "rules.yml"


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


def _clamp01(x: float) -> float:
    if x < 0.0:
        return 0.0
    if x > 1.0:
        return 1.0
    return x


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


def _load_rules() -> Dict[str, Any]:
    try:
        with RULES_PATH.open("r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}
    except FileNotFoundError:
        return {}
    except Exception as e:
        print(f"[warn] failed to read rules.yml: {type(e).__name__}: {e}", flush=True)
        return {}


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


# -------------------------
# external scoring
# -------------------------

def _deep_get(d: Any, *keys: str) -> Any:
    cur = d
    for k in keys:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(k)
    return cur


def _rules_scoring_cfg(rules: Dict[str, Any]) -> Dict[str, Any]:
    sc = (rules.get("scoring") or {}).get("external_v1")
    return sc if isinstance(sc, dict) else {}


def _get_profile_name(sc_cfg: Dict[str, Any], group: str) -> str:
    m = sc_cfg.get("group_profile_map") or {}
    if isinstance(m, dict) and group in m:
        return str(m[group])
    return "default"


def _get_profile_weights(sc_cfg: Dict[str, Any], profile: str) -> Dict[str, float]:
    profs = sc_cfg.get("weights_profiles") or {}
    if isinstance(profs, dict):
        w = profs.get(profile)
        if isinstance(w, dict):
            out: Dict[str, float] = {}
            for k, v in w.items():
                fv = _as_float(v)
                if fv is not None:
                    out[str(k)] = fv
            if out:
                return out
    # fallback
    return {
        "urgency": 0.25,
        "observability": 0.20,
        "brightness": 0.10,
        "hazard": 0.30,
        "reliability": 0.10,
        "novelty": 0.03,
        "localization": 0.02,
    }


def _get_defaults(sc_cfg: Dict[str, Any]) -> Dict[str, Any]:
    d = sc_cfg.get("defaults") or {}
    return d if isinstance(d, dict) else {}


def _reliability(sc_cfg: Dict[str, Any], it: Dict[str, Any]) -> float:
    src = str(it.get("source") or "").strip()
    rb = sc_cfg.get("reliability_by_source") or {}
    if isinstance(rb, dict):
        v = rb.get(src)
        fv = _as_float(v)
        if fv is not None:
            return _clamp01(fv)
    # fallback by group
    grp = str(it.get("group") or "").strip().lower()
    if grp == "risk":
        return 1.0
    if grp == "neo":
        return 0.9
    if grp == "gcn":
        return 0.85
    if grp == "grb":
        return 0.85
    if grp == "neocp":
        return 0.55
    if grp == "transient":
        return 0.65
    return 0.5


def _event_time_ref(it: Dict[str, Any]) -> Optional[datetime]:
    grp = str(it.get("group") or "").strip().lower()
    meta = it.get("meta") if isinstance(it.get("meta"), dict) else {}
    # NEO close approach time is better than updated_utc if present
    if grp == "neo":
        t_iso = meta.get("t_utc_iso")
        dt = _parse_iso_utc(str(t_iso or ""))
        if dt is not None:
            return dt
    # default: updated_utc, fallback ingested_utc
    dt = _parse_iso_utc(str(it.get("updated_utc") or ""))
    if dt is not None:
        return dt
    return _parse_iso_utc(str(it.get("ingested_utc") or ""))


def _urgency(sc_cfg: Dict[str, Any], it: Dict[str, Any], now: datetime) -> float:
    grp = str(it.get("group") or "").strip().lower()
    defaults = _get_defaults(sc_cfg)
    windows = defaults.get("windows_sec") or {}
    window_sec = None
    if isinstance(windows, dict):
        if grp == "neo":
            window_sec = _as_float(windows.get("neo_ca"))
        else:
            window_sec = _as_float(windows.get(grp))
    if window_sec is None or window_sec <= 0:
        window_sec = 86400.0  # 1 day

    t_ref = _event_time_ref(it)
    if t_ref is None:
        return 0.0

    if t_ref <= now:
        age = (now - t_ref).total_seconds()
        return _clamp01(1.0 - (age / window_sec))
    else:
        dt = (t_ref - now).total_seconds()
        return _clamp01(1.0 - (dt / window_sec))


def _observability(sc_cfg: Dict[str, Any], it: Dict[str, Any]) -> float:
    defaults = _get_defaults(sc_cfg)
    alt_min = _as_float(defaults.get("alt_min_deg")) or 10.0
    alt_good = _as_float(defaults.get("alt_good_deg")) or 60.0
    if alt_good <= alt_min:
        alt_good = alt_min + 1.0

    alt = _as_float(it.get("meta", {}).get("alt_deg")) if isinstance(it.get("meta"), dict) else None
    if alt is None:
        # if has coordinates, neutral; else 0
        if _as_float(it.get("ra_deg")) is not None and _as_float(it.get("dec_deg")) is not None:
            return 0.5
        return 0.0

    return _clamp01((alt - alt_min) / (alt_good - alt_min))


def _brightness(sc_cfg: Dict[str, Any], it: Dict[str, Any]) -> float:
    defaults = _get_defaults(sc_cfg)
    mag_bright = _as_float(defaults.get("mag_bright")) or 14.0
    mag_faint = _as_float(defaults.get("mag_faint")) or 22.0
    if mag_faint <= mag_bright:
        mag_faint = mag_bright + 1.0

    mag = _as_float(it.get("mag"))
    if mag is not None:
        return _clamp01((mag_faint - mag) / (mag_faint - mag_bright))

    # fallback to H (SBDB or CAD)
    h_bright = _as_float(defaults.get("h_bright")) or 16.0
    h_faint = _as_float(defaults.get("h_faint")) or 28.0
    if h_faint <= h_bright:
        h_faint = h_bright + 1.0

    meta = it.get("meta") if isinstance(it.get("meta"), dict) else {}
    h = _as_float(meta.get("sbdb_h")) or _as_float(meta.get("h")) or _as_float(meta.get("h_cad"))
    if h is None:
        return 0.0
    return _clamp01((h_faint - h) / (h_faint - h_bright))


def _hazard(sc_cfg: Dict[str, Any], it: Dict[str, Any]) -> float:
    grp = str(it.get("group") or "").strip().lower()
    if grp not in {"neo", "risk", "pha"}:
        return 0.0

    defaults = _get_defaults(sc_cfg)
    moid_ref = _as_float(defaults.get("moid_ref_au")) or 0.05
    diam_ref = _as_float(defaults.get("diam_ref_km")) or 1.0
    if moid_ref <= 0:
        moid_ref = 0.05
    if diam_ref <= 0:
        diam_ref = 1.0

    hz_w = sc_cfg.get("hazard_weights") or {}
    w_moid = _as_float(hz_w.get("w_moid")) if isinstance(hz_w, dict) else None
    w_diam = _as_float(hz_w.get("w_diam")) if isinstance(hz_w, dict) else None
    pha_boost = _as_float(hz_w.get("pha_boost")) if isinstance(hz_w, dict) else None
    w_moid = w_moid if w_moid is not None else 0.6
    w_diam = w_diam if w_diam is not None else 0.4
    pha_boost = pha_boost if pha_boost is not None else 0.30

    meta = it.get("meta") if isinstance(it.get("meta"), dict) else {}

    moid = _as_float(meta.get("moid_au")) or _as_float(meta.get("sbdb_moid_au"))
    diam = _as_float(meta.get("diameter_km")) or _as_float(meta.get("diameter_est_km")) or _as_float(meta.get("sbdb_diameter_km")) or _as_float(meta.get("sbdb_diameter_est_km"))

    moid_score = 0.0 if moid is None else _clamp01(1.0 - (moid / moid_ref))
    diam_score = 0.0 if diam is None else _clamp01(diam / diam_ref)

    pha_flag = bool(meta.get("pha")) if isinstance(meta.get("pha"), bool) else bool(it.get("type") == "pha") or (grp == "pha")
    score = (w_moid * moid_score) + (w_diam * diam_score)
    if pha_flag:
        score = _clamp01(score + pha_boost)

    return _clamp01(score)


def _localization(sc_cfg: Dict[str, Any], it: Dict[str, Any]) -> float:
    # very limited for now; prefer exact coords if present
    ra = _as_float(it.get("ra_deg"))
    dec = _as_float(it.get("dec_deg"))
    if ra is not None and dec is not None:
        return 1.0
    return 0.0


def _novelty(_: Dict[str, Any], __: Dict[str, Any]) -> float:
    # no persistent state yet
    return 0.0


def _apply_external_scoring(rules: Dict[str, Any], items: List[Dict[str, Any]]) -> None:
    sc_cfg = _rules_scoring_cfg(rules)
    defaults = _get_defaults(sc_cfg)
    pha_floor = _as_float(defaults.get("pha_floor")) or 0.95

    now = datetime.now(timezone.utc)

    for it in items:
        if not isinstance(it, dict):
            continue

        meta = it.get("meta")
        if not isinstance(meta, dict):
            meta = {}
            it["meta"] = meta

        # preserve internal (pre-merge) scores
        internal_sn = _as_float(it.get("score_norm"))
        internal_sr = _as_float(it.get("score_raw"))

        group = str(it.get("group") or "other").strip().lower()
        profile = _get_profile_name(sc_cfg, group)
        weights = _get_profile_weights(sc_cfg, profile)

        f_urg = _urgency(sc_cfg, it, now)
        f_obs = _observability(sc_cfg, it)
        f_bri = _brightness(sc_cfg, it)
        f_haz = _hazard(sc_cfg, it)
        f_rel = _reliability(sc_cfg, it)
        f_nov = _novelty(sc_cfg, it)
        f_loc = _localization(sc_cfg, it)

        features = {
            "urgency": round(f_urg, 4),
            "observability": round(f_obs, 4),
            "brightness": round(f_bri, 4),
            "hazard": round(f_haz, 4),
            "reliability": round(f_rel, 4),
            "novelty": round(f_nov, 4),
            "localization": round(f_loc, 4),
        }

        # weighted sum
        s = 0.0
        for k, fv in features.items():
            w = _as_float(weights.get(k)) or 0.0
            s += w * float(fv)
        external_score = _clamp01(s)

        pha_flag = bool(meta.get("pha")) if isinstance(meta.get("pha"), bool) else (group == "pha")
        global_score = max(external_score, pha_floor) if pha_flag else external_score

        global_score = _clamp01(global_score)
        score_norm = round(global_score, 4)
        score_raw = round(global_score * 100.0, 2)

        # write back main fields (contract)
        it["score_norm"] = score_norm
        it["score_raw"] = score_raw

        # store explainable scoring payload (additive-only)
        scoring = meta.get("scoring")
        if not isinstance(scoring, dict):
            scoring = {}
            meta["scoring"] = scoring

        scoring["version"] = "v1"
        scoring["internal"] = {
            "score_norm": internal_sn,
            "score_raw": internal_sr,
            "source": str(it.get("source") or ""),
        }
        scoring["external"] = {
            "model": "external_v1",
            "weights_profile": profile,
            "features": features,
            "weights": {k: float(_as_float(v) or 0.0) for k, v in weights.items()},
            "score_norm": round(external_score, 4),
            "score_raw": round(external_score * 100.0, 2),
        }
        scoring["global"] = {
            "policy": "merge_v1",
            "pha_floor": pha_floor,
            "score_norm": score_norm,
            "score_raw": score_raw,
        }


# -------------------------
# main
# -------------------------

def main() -> None:
    rules = _load_rules()

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
            all_items.append(_normalize_item(it, default_group=spec.default_group))

        print(f"[ok] loaded {spec.filename} items={len(items)}", flush=True)

    # Merge + dedupe
    deduped = _dedupe_alerts(all_items)

    # External scoring (mutates items in-place)
    _apply_external_scoring(rules, deduped)

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