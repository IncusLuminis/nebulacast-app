# services/sky/pipelines/lib/timeutil.py
from __future__ import annotations

from datetime import datetime, timezone
from zoneinfo import ZoneInfo

WARSAW_TZ = ZoneInfo("Europe/Warsaw")

def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

def iso_utc(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")

def date_local_yyyy_mm_dd(dt_utc: datetime) -> str:
    return dt_utc.astimezone(WARSAW_TZ).date().isoformat()