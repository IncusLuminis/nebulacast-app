# services/sky/pipelines/lib/paths.py
from __future__ import annotations

from pathlib import Path

# services/sky/pipelines/lib/paths.py -> project root is 4 levels up
PROJECT_ROOT = Path(__file__).resolve().parents[4]

SERVICES_DATA_DIR = PROJECT_ROOT / "services" / "sky" / "data" / "generated"
STAGING_DATA_DIR  = PROJECT_ROOT / "sites" / "staging" / "sky" / "data"
RAW_DATA_DIR      = PROJECT_ROOT / "services" / "sky" / "data" / "raw"