#!/usr/bin/env python3
"""
NOAA Space Weather Prediction Center (SWPC) provider.
Fetches global space weather products via HTTP GET.
All fetches are independent and fail-soft (returns None per product on error).
"""
from __future__ import annotations

import json
import urllib.request
from typing import Any, Dict, List, Optional

_USER_AGENT = "nebulacast-weather/1.0"
_TIMEOUT = 20

_ENDPOINTS: Dict[str, str] = {
    "kp_observed": "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json",
    "kp_forecast": "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json",
    "solar_wind": "https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json",
    "xray": "https://services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json",
    "alerts": "https://services.swpc.noaa.gov/products/alerts.json",
}


def _fetch_json(url: str) -> Optional[Any]:
    """Fetch a URL and return parsed JSON, or None on any error."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": _USER_AGENT})
        with urllib.request.urlopen(req, timeout=_TIMEOUT) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"[noaa_swpc] WARNING: fetch failed for {url}: {e}")
        return None


def fetch_noaa_swpc() -> Dict[str, Optional[Any]]:
    """
    Fetch all NOAA SWPC products.

    Returns a dict with keys: kp_observed, kp_forecast, solar_wind, xray, alerts.
    Each value is the raw parsed JSON list/array, or None if the fetch failed.
    """
    result: Dict[str, Optional[Any]] = {}
    for key, url in _ENDPOINTS.items():
        data = _fetch_json(url)
        result[key] = data
        status = "ok" if data is not None else "FAILED"
        count = len(data) if isinstance(data, list) else "n/a"
        print(f"[noaa_swpc] {key}: {status} (rows={count})")
    return result
