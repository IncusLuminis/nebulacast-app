#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Run all SKY data pipelines in dependency order.

Order:
  1) stars, constellations, milkyway (foundation)
  2) messier (dso_messier.json for gen_objects)
  3) sunmoon, planets (ephemerides)
  4) alerts (neo, neocp, risk, gcn, then gen_alerts aggregate)
  5) objects (needs calendar/daily_signal.json, planets, sun_moon, dso_messier)
  6) ranking (needs objects_today.json)

Note: gen_objects requires calendar pipeline output (sites/staging/calendar/daily_signal.json).
Run calendar-back first for full objects/ranking.

Usage:
  PYTHONPATH=services/sky python services/sky/pipelines/gen_all.py
"""

from __future__ import annotations

import runpy
import sys
from pathlib import Path


HERE = Path(__file__).resolve().parent

PIPELINES = [
    "gen_stars.py",
    "gen_constellations.py",
    "gen_milkyway.py",
    "gen_messier.py",
    "gen_sunmoon.py",
    "gen_planets.py",
    "gen_neo_alerts.py",
    "gen_neocp_alerts.py",
    "gen_risk_alerts.py",
    "gen_gcn_alerts.py",
    "gen_alerts.py",
    "gen_objects.py",
    "gen_ranking.py",
]


def run_script(filename: str) -> None:
    path = HERE / filename
    if not path.exists():
        raise FileNotFoundError(f"[sky] pipeline script not found: {path}")

    print(f"\n[sky] === running {filename} ===")
    runpy.run_path(str(path), run_name="__main__")


def main() -> None:
    for script in PIPELINES:
        run_script(script)

    print("\n[sky] ✅ all pipelines completed")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n[sky] ❌ failed: {e}")
        raise