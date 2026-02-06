#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Run all SKY data pipelines:
  1) stars (Hipparcos)
  2) constellations (Stellarium western, HIP ids)
  3) milkyway band (synthetic, GAL plane)

Assumes these scripts exist in the same folder:
  - gen_stars.py
  - gen_constellations.py
  - gen_milkyway.py

Usage:
  python services/pipelines/sky/gen_all.py
"""

from __future__ import annotations

import runpy
import sys
from pathlib import Path


HERE = Path(__file__).resolve().parent


def run_script(filename: str) -> None:
    path = HERE / filename
    if not path.exists():
        raise FileNotFoundError(f"[sky] pipeline script not found: {path}")

    print(f"\n[sky] === running {filename} ===")
    # run as if "python filename", with __name__ == "__main__"
    runpy.run_path(str(path), run_name="__main__")


def main() -> None:
    # Keep explicit order:
    # constellations needs stars JSON to compute label positions
    run_script("gen_stars.py")
    run_script("gen_constellations.py")
    run_script("gen_milkyway.py")

    print("\n[sky] ✅ all pipelines completed")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n[sky] ❌ failed: {e}")
        raise