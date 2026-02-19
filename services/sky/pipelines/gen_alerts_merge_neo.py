#!/usr/bin/env python3
# services/sky/pipelines/gen_alerts_merge_neo.py
#
# Merge alerts_neo.json into legacy alerts_now.json without changing legacy generator.
# Strategy: REPLACE the "neo" slice (groups["neo"] and neo items in flat list) each run.
# Additive-only w.r.t. legacy schema: we don't rename/remove legacy keys; we only update values.

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

from pipelines.lib.paths import PROJECT_ROOT, STAGING_DATA_DIR, SERVICES_DATA_DIR


ALERTS_NOW_PATH = STAGING_DATA_DIR / "alerts_now.json"
ALERTS_NEO_PATH = STAGING_DATA_DIR / "alerts_neo.json"
ALERTS_NOW_COPY_TO_SERVICES = SERVICES_DATA_DIR / "alerts_now.json"


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load_json(p: Path) -> Dict[str, Any]:
    with p.open("r", encoding="utf-8") as f:
        return json.load(f)


def _dump_json(p: Path, obj: Dict[str, Any]) -> None:
    p.parent.mkdir(parents=True, exist_ok=True)
    with p.open("w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2, sort_keys=False)


def _dedupe_keep_order(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen: set[str] = set()
    out: List[Dict[str, Any]] = []
    for it in items:
        _id = str(it.get("id", "")).strip()
        if not _id or _id in seen:
            continue
        seen.add(_id)
        out.append(it)
    return out


def _print_group_diag(groups: Dict[str, Any]) -> None:
    # Pretty, stable output for quick eyeballing
    want = ["grb", "neocp", "transient", "neo", "pha"]
    counts: Dict[str, int] = {}
    for g, arr in groups.items():
        if isinstance(arr, list):
            counts[str(g)] = len(arr)
    for g in want:
        print(f"- {g}: {counts.get(g, 0)}")


def main() -> None:
    print(f"[sky] PROJECT_ROOT: {PROJECT_ROOT}")

    if not ALERTS_NOW_PATH.exists():
        raise SystemExit(f"[sky] missing legacy alerts file: {ALERTS_NOW_PATH}")
    if not ALERTS_NEO_PATH.exists():
        raise SystemExit(f"[sky] missing neo alerts file: {ALERTS_NEO_PATH}")

    legacy = _load_json(ALERTS_NOW_PATH)
    neo = _load_json(ALERTS_NEO_PATH)

    raw_list = legacy.get("raw") or []
    groups = legacy.get("groups") or {}
    items_flat = legacy.get("items") or []

    # ---- Normalize incoming neo items (force group="neo") ----
    neo_items = neo.get("items") or []
    neo_items_norm: List[Dict[str, Any]] = []
    for it in neo_items:
        if not isinstance(it, dict):
            continue
        it2 = dict(it)
        it2["group"] = "neo"
        neo_items_norm.append(it2)
    neo_items_norm = _dedupe_keep_order(neo_items_norm)

    # ---- REPLACE neo slice ----
    # 1) groups["neo"] replaced entirely (avoid old long ids persisting)
    groups["neo"] = neo_items_norm

    # 2) flat items: remove old neo slice, then append current neo slice
    def _is_old_neo(x: Any) -> bool:
        if not isinstance(x, dict):
            return False
        if (x.get("group") or "") != "neo":
            return False
        # most strict: only remove what our pipeline owns
        src = (x.get("source") or "").lower()
        if src in {"jpl-cad+horizons", "jpl-cad+horizons+sbdb"}:
            return True
        # fallback for earlier runs
        _id = str(x.get("id") or "")
        return _id.startswith("neo:")

    items_flat_wo_neo = [it for it in items_flat if not _is_old_neo(it)]
    merged_items_flat = _dedupe_keep_order(items_flat_wo_neo + neo_items_norm)

    # ---- Update raw sources (add one entry, do not remove existing) ----
    have = {(x.get("source"), x.get("path")) for x in raw_list if isinstance(x, dict)}
    neo_raw_entry = {"source": "neo", "path": str(ALERTS_NEO_PATH.relative_to(PROJECT_ROOT))}
    if (neo_raw_entry["source"], neo_raw_entry["path"]) not in have:
        raw_list.append(neo_raw_entry)

    # ---- Recompute counts (legacy format) ----
    by_group: Dict[str, int] = {}
    total = 0
    for g, arr in groups.items():
        if not isinstance(arr, list):
            continue
        by_group[str(g)] = len(arr)
        total += len(arr)

    legacy["generated_utc"] = _utc_now_iso()
    legacy["raw"] = raw_list
    legacy["groups"] = groups
    legacy["items"] = merged_items_flat
    legacy["counts"] = {
        "total_filtered": total,
        "by_group": by_group,
    }

    _dump_json(ALERTS_NOW_PATH, legacy)
    _dump_json(ALERTS_NOW_COPY_TO_SERVICES, legacy)

    print(f"[sky] merged neo alerts into alerts_now: neo={len(groups.get('neo', []))} total={total}")
    _print_group_diag(groups)


if __name__ == "__main__":
    main()