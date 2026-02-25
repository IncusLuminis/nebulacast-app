#!/usr/bin/env python3
# services/sky/pipelines/gen_gcn_alerts.py
#
# GCN -> alerts_gcn.json
#
# IMPORTANT CONTRACT:
# - Do NOT change the output JSON structure (top-level keys or item keys).
# - Only ADD fields under item["meta"].
#
# Outputs:
#   services/sky/data/generated/alerts_gcn.json
#   sites/staging/sky/data/alerts_gcn.json

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from pipelines.lib.jsonio import dump_json
from pipelines.lib.paths import SERVICES_DATA_DIR, STAGING_DATA_DIR
from pipelines.lib.timeutil import utc_now_iso


OUT_FILENAME = "alerts_gcn.json"


# ---------- small local helper (jsonio.py has dump_json only) ----------
def _load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _norm(s: Any) -> str:
    return str(s or "").strip().lower()


def _safe_get_meta_topic(item: Dict[str, Any]) -> str:
    meta = item.get("meta")
    if isinstance(meta, dict):
        return str(meta.get("topic") or "")
    return ""


def _infer_ui_type(item: Dict[str, Any]) -> Tuple[str, str]:
    """
    Returns (ui_type, ui_type_hint).

    We keep this intentionally conservative: it’s UI interpretation,
    not a scientific classification.

    Primary sources used:
      - item.meta.topic (Kafka/GCN topic string)
      - item.note/title/id (fallback heuristics)
    """
    topic = _norm(_safe_get_meta_topic(item))
    note = _norm(item.get("note"))
    title = _norm(item.get("title"))
    _id = _norm(item.get("id"))

    # 1) Gravitational-wave alerts (IGWN / LIGO-Virgo-KAGRA)
    if "igwn.gwalert" in topic or "gwalert" in topic or "cbc" in note or "far" in note:
        ui_type = "GW alert"
        hint = (
            "Gravitational-wave candidate alert (LIGO/Virgo/KAGRA/IGWN). "
            "Preliminary machine-generated notice; classification and sky localization can be updated."
        )
        return ui_type, hint

    # 2) Gamma-ray burst / high-energy transient notices (common patterns)
    if any(k in topic for k in ["fermi", "swift", "integral", "konus", "grb", "gamm", "bat", "gbm"]):
        ui_type = "High-energy transient"
        hint = (
            "High-energy transient notice (often GRB-related) distributed via GCN. "
            "Typically time-critical; localization may be coarse and updated later."
        )
        return ui_type, hint

    # 3) AMON (multi-messenger coincidence network) patterns
    if "amon" in topic:
        ui_type = "AMON alert"
        hint = (
            "AMON multi-messenger alert (coincidence/association candidates across instruments). "
            "Preliminary; follow-up context matters."
        )
        return ui_type, hint

    # 4) IceCube neutrino alerts (common)
    if "icecube" in topic or "neutrino" in topic:
        ui_type = "Neutrino alert"
        hint = (
            "High-energy neutrino candidate alert (e.g., IceCube via GCN). "
            "Localization uncertainty can be large; follow-up may refine the event context."
        )
        return ui_type, hint

    # 5) Generic fallback for anything else that still comes through gcn
    ui_type = "GCN notice"
    hint = (
        "General GCN notice. The topic identifies the originating stream; "
        "details and confidence can change as additional data arrives."
    )
    return ui_type, hint


def _enrich_item_meta_in_place(item: Dict[str, Any]) -> None:
    """
    Additive-only enrichment:
      item.meta.ui_type
      item.meta.ui_type_hint

    Does not remove/rename any fields.
    """
    meta = item.get("meta")
    if meta is None or not isinstance(meta, dict):
        meta = {}
        item["meta"] = meta  # additive, but keeps schema: meta is already expected

    # If already present, keep existing values (don’t override manual edits)
    if "ui_type" not in meta or not str(meta.get("ui_type") or "").strip():
        ui_type, ui_hint = _infer_ui_type(item)
        meta["ui_type"] = ui_type
        meta["ui_type_hint"] = ui_hint
        return

    # ui_type exists; ensure hint exists
    if "ui_type_hint" not in meta or not str(meta.get("ui_type_hint") or "").strip():
        # derive a hint that corresponds to existing ui_type (best-effort)
        existing = _norm(meta.get("ui_type"))
        if existing == "gw alert":
            meta["ui_type_hint"] = (
                "Gravitational-wave candidate alert (LIGO/Virgo/KAGRA/IGWN). "
                "Preliminary machine-generated notice; classification and sky localization can be updated."
            )
        elif existing in ("high-energy transient", "high energy transient"):
            meta["ui_type_hint"] = (
                "High-energy transient notice (often GRB-related) distributed via GCN. "
                "Typically time-critical; localization may be coarse and updated later."
            )
        elif existing == "amon alert":
            meta["ui_type_hint"] = (
                "AMON multi-messenger alert (coincidence/association candidates across instruments). "
                "Preliminary; follow-up context matters."
            )
        elif existing == "neutrino alert":
            meta["ui_type_hint"] = (
                "High-energy neutrino candidate alert (e.g., IceCube via GCN). "
                "Localization uncertainty can be large; follow-up may refine the event context."
            )
        else:
            meta["ui_type_hint"] = (
                "General GCN notice. The topic identifies the originating stream; "
                "details and confidence can change as additional data arrives."
            )


def main() -> None:
    src_path_services = SERVICES_DATA_DIR / OUT_FILENAME
    src_path_staging = STAGING_DATA_DIR / OUT_FILENAME

    # Load existing JSON (prefer services path; fallback to staging)
    if src_path_services.exists():
        obj = _load_json(src_path_services)
    elif src_path_staging.exists():
        obj = _load_json(src_path_staging)
    else:
        # If nothing exists yet, create an empty shell without inventing a new schema.
        # This still respects the expected structure used elsewhere (generated_utc/source/counts/items).
        now = utc_now_iso()
        obj = {
            "generated_utc": now,
            "source": "GCN (no input file found yet)",
            "counts": {"items": 0},
            "items": [],
        }

    # Enrich items (additive-only)
    items = obj.get("items")
    if isinstance(items, list):
        for it in items:
            if isinstance(it, dict):
                _enrich_item_meta_in_place(it)

    # Update only generated_utc (top-level already exists in your schema)
    # If you prefer to keep the original timestamp, comment this out.
    obj["generated_utc"] = utc_now_iso()

    # Keep counts consistent if present
    counts = obj.get("counts")
    if isinstance(counts, dict) and isinstance(items, list):
        counts["items"] = len(items)

    # Write out to both destinations
    dump_json(src_path_services, obj)
    dump_json(src_path_staging, obj)

    print(f"[sky] gcn alerts enriched: {len(items) if isinstance(items, list) else 0} items", flush=True)


if __name__ == "__main__":
    main()