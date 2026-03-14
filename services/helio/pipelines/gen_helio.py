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
from interpreters.swpc_alerts import interpret, derive_scales  # Task 2
from aggregators.helio_state import derive                     # Task 3

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
    started     = datetime.now(timezone.utc)
    updated_utc = started.strftime("%Y-%m-%dT%H:%M:%SZ")
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
    interpreted = interpret(raw_alerts)
    events        = interpreted["alerts_all"]
    alerts_preview = interpreted["alerts_preview"]
    event_scales   = derive_scales(events)
    print(f"[helio.pipeline] events={len(events)} preview={len(alerts_preview)} "
          f"scales={event_scales}")

    # ── 4. Aggregate (Task 3) ─────────────────────────────────────────────────
    aggregate = derive(
        metrics=metrics,
        events=events,
        updated_utc=updated_utc,
    )
    print(f"[helio.pipeline] status={aggregate['summary']['status']} "
          f"scales={aggregate['scales']} "
          f"aurora={aggregate['aurora_hint']['aurora_label']} "
          f"kp_max_24h={aggregate['forecast']['kp_max_next_24h']} "
          f"trend={aggregate['forecast']['trend']}")

    # ── 5. Serialize (Task 4) ─────────────────────────────────────────────────
    payload = {
        "schema_version": "helio_now/v1",
        "updated_utc":    updated_utc,
        "source": {
            "domain":   "helio",
            "provider": "NOAA_SWPC",
            "products": products,
        },
        "metrics":          metrics,
        "summary":          aggregate["summary"],
        "scales":           aggregate["scales"],
        "forecast":         aggregate["forecast"],
        "aurora_hint":      aggregate["aurora_hint"],
        "observer_impacts": aggregate["observer_impacts"],
        "alerts_preview":   alerts_preview,
        "alerts_all":       aggregate["alerts_all"],
        "raw": {
            "alerts_count": len(raw_alerts),
        },
    }

    _write_json_atomic(_OUTPUT_PATH, payload)
    print(f"[helio.pipeline] Done in {(datetime.now(timezone.utc) - started).total_seconds():.1f}s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
