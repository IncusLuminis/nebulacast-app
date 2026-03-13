#!/usr/bin/env python3
"""
Helio domain main pipeline — generates sites/staging/data/helio_now.json.

Layers (each implemented in its own module):
  1. Provider     — fetch raw SWPC products            [providers/noaa_swpc.py]
  2. Normalizer   — parse raw → internal structures    [normalizers/helio_now.py]
  3. Interpreter  — classify alerts → HelioEvent[]     [interpreters/swpc_alerts.py]  (Task 2)
  4. Aggregator   — derive summary/scales/aurora/...   [aggregators/helio_state.py]   (Task 3)
  5. Serializer   — write helio_now.json contract      [this file]                    (Task 4)

Usage:
  PYTHONPATH=services/helio python services/helio/pipelines/gen_helio.py
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

# Resolve package root so relative imports work when run directly
_service_root = Path(__file__).resolve().parent.parent
_repo_root = _service_root.parent.parent
if str(_service_root) not in sys.path:
    sys.path.insert(0, str(_service_root))

from providers.noaa_swpc import fetch_swpc, active_product_names
from normalizers.helio_now import normalize

# Future imports — uncomment as tasks are completed:
# from interpreters.swpc_alerts import interpret   # Task 2
# from aggregators.helio_state import derive        # Task 3

_OUTPUT_PATH = _repo_root / "sites" / "staging" / "data" / "helio_now.json"


def _write_json_atomic(path: Path, data: dict) -> None:
    """Write JSON atomically via temp-file rename."""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    tmp.rename(path)
    print(f"[helio.pipeline] Written: {path}")


def main() -> int:
    started = datetime.now(timezone.utc)
    print(f"[helio.pipeline] Starting at {started.isoformat()}")

    # ── 1. Fetch ──────────────────────────────────────────────────────────────
    raw = fetch_swpc()
    products = active_product_names(raw)
    print(f"[helio.pipeline] Active products: {products}")

    # ── 2. Normalize ──────────────────────────────────────────────────────────
    normalized = normalize(raw)
    metrics    = normalized["metrics"]
    raw_alerts = normalized["raw_alerts"]

    print(f"[helio.pipeline] kp_latest={metrics['kp_latest']} "
          f"xray={metrics['xray_class']} "
          f"solar_wind={metrics['solar_wind_kms']} km/s "
          f"imf_bz={metrics['imf_bz_nt']} nT "
          f"forecast_points={len(metrics['kp_forecast_3h'])} "
          f"raw_alerts={len(raw_alerts)}")

    # ── 3. Interpret (Task 2) ─────────────────────────────────────────────────
    # events = interpret(raw_alerts)
    events: list = []  # placeholder until Task 2

    # ── 4. Aggregate (Task 3) ─────────────────────────────────────────────────
    # aggregate = derive(metrics=metrics, events=events)
    aggregate: dict = {}  # placeholder until Task 3

    # ── 5. Serialize (Task 4) ─────────────────────────────────────────────────
    # Full contract serialization is implemented in Task 4.
    # For now, write a diagnostic snapshot so Task 1 is verifiable.
    updated_utc = started.strftime("%Y-%m-%dT%H:%M:%SZ")

    payload = {
        "schema_version": "helio_now/v1",
        "updated_utc": updated_utc,
        "source": {
            "domain":   "helio",
            "provider": "NOAA_SWPC",
            "products": products,
        },
        "metrics":          metrics,
        # Fields below are populated in Tasks 2–4:
        "summary":          aggregate.get("summary",         _fallback_summary()),
        "scales":           aggregate.get("scales",          _fallback_scales()),
        "forecast":         aggregate.get("forecast",        _fallback_forecast()),
        "aurora_hint":      aggregate.get("aurora_hint",     _fallback_aurora()),
        "observer_impacts": aggregate.get("observer_impacts", _fallback_impacts()),
        "alerts_preview":   aggregate.get("alerts_preview",  []),
        "alerts_all":       aggregate.get("alerts_all",      []),
        "raw": {
            "alerts_count": len(raw_alerts),
        },
    }

    _write_json_atomic(_OUTPUT_PATH, payload)
    print(f"[helio.pipeline] Done in {(datetime.now(timezone.utc) - started).total_seconds():.1f}s")
    return 0


# ── Safe fallback helpers (used until Task 3 aggregator is wired in) ──────────

def _fallback_summary() -> dict:
    return {
        "status": "quiet",
        "label":  "Quiet",
        "text":   "Quiet space weather conditions. No major impact expected.",
    }

def _fallback_scales() -> dict:
    return {"g_scale": "G0", "r_scale": "R0", "s_scale": "S0"}

def _fallback_forecast() -> dict:
    return {"kp_max_next_24h": None, "kp_max_at_utc": None, "trend": "unknown"}

def _fallback_aurora() -> dict:
    return {
        "aurora_possible":    False,
        "aurora_min_lat_est": None,
        "aurora_label":       "none",
        "summary":            "No meaningful aurora chance for most users.",
    }

def _fallback_impacts() -> list:
    return [
        {"kind": "aurora",         "level": "none", "label": "Aurora",        "summary": "No meaningful aurora chance for most users."},
        {"kind": "radio",          "level": "none", "label": "Radio impact",   "summary": "No major radio blackout expected."},
        {"kind": "solar_activity", "level": "none", "label": "Solar activity", "summary": "No significant flare signal."},
    ]


if __name__ == "__main__":
    sys.exit(main())
