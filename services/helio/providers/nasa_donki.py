#!/usr/bin/env python3
"""
NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information) provider.

Fetches solar-event data from the CCMC/NASA DONKI REST API.
No API key required.

Products fetched:
  flr           Solar Flares (FLR)
  cme           Coronal Mass Ejections (CME)
  cme_analysis  CME Analysis + Enlil arrival predictions (CMEAnalysis)

Fail-soft strategy: each endpoint returns None on error; others continue.
"""
from __future__ import annotations

import json
import urllib.request
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

_USER_AGENT = "nebulacast-helio/1.0"
_TIMEOUT    = 25  # DONKI can be slower than SWPC
_BASE_URL   = "https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get"

# Maps internal fetch key → URL path segment
_PATHS: Dict[str, str] = {
    "flr":          "FLR",
    "cme":          "CME",
    "cme_analysis": "CMEAnalysis",
}

# Maps internal fetch key → canonical product name used in helio_now.json source.products[]
PRODUCT_NAMES: Dict[str, str] = {
    "flr":          "donki_flr",
    "cme":          "donki_cme",
    "cme_analysis": "donki_cme_analysis",
}


def _fetch_json(url: str) -> Optional[Any]:
    """Fetch URL and return parsed JSON, or None on any error."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": _USER_AGENT})
        with urllib.request.urlopen(req, timeout=_TIMEOUT) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"[helio.donki] WARNING: fetch failed for {url}: {e}")
        return None


def fetch_donki(
    window_past_hours:   int = 72,
    window_future_hours: int = 48,
) -> Dict[str, Optional[Any]]:
    """
    Fetch all DONKI products for the configured time window.

    The window covers:
      start = now - window_past_hours
      end   = now + window_future_hours  (to capture CME arrival predictions)

    Returns a dict keyed by internal product key.
    Each value is raw parsed JSON (list-of-dicts) or None on failure.
    """
    now   = datetime.now(timezone.utc)
    start = (now - timedelta(hours=window_past_hours)).strftime("%Y-%m-%d")
    end   = (now + timedelta(hours=window_future_hours)).strftime("%Y-%m-%d")

    result: Dict[str, Optional[Any]] = {}
    for key, path in _PATHS.items():
        url  = f"{_BASE_URL}/{path}?startDate={start}&endDate={end}"
        data = _fetch_json(url)
        result[key] = data
        status = "ok" if data is not None else "FAILED"
        count  = len(data) if isinstance(data, list) else "n/a"
        print(f"[helio.donki] {key}: {status} (rows={count})")
    return result


def active_product_names(raw: Dict[str, Optional[Any]]) -> List[str]:
    """Return canonical product names for products that returned data."""
    return [PRODUCT_NAMES[k] for k in _PATHS if raw.get(k) is not None]
