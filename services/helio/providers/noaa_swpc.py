#!/usr/bin/env python3
"""
NOAA SWPC data provider for the helio domain.

Fetches raw space-weather products via HTTP GET.
All fetches are independent and fail-soft — returns None per product on error.

Products fetched:
  kp_observed       planetary_k_index_1m  (latest Kp)
  kp_forecast       kp_forecast_3d        (3-day Kp forecast in 3h bins)
  solar_wind_plasma solar_wind_plasma     (speed, density)
  solar_wind_mag    solar_wind_mag        (IMF Bx/By/Bz/Bt)
  xray              xray_flux             (GOES X-ray flux, 0.1–0.8nm band)
  alerts            alerts                (SWPC alert/watch/warning messages)
"""
from __future__ import annotations

import json
import urllib.request
from typing import Any, Dict, List, Optional

_USER_AGENT = "nebulacast-helio/1.0"
_TIMEOUT = 20

_ENDPOINTS: Dict[str, str] = {
    "kp_observed":       "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json",
    "kp_forecast":       "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json",
    "solar_wind_plasma": "https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json",
    "solar_wind_mag":    "https://services.swpc.noaa.gov/products/solar-wind/mag-1-day.json",
    "xray":              "https://services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json",
    "alerts":            "https://services.swpc.noaa.gov/products/alerts.json",
}

# Maps internal fetch key → canonical product name used in helio_now.json source.products[]
PRODUCT_NAMES: Dict[str, str] = {
    "kp_observed":       "planetary_k_index_1m",
    "kp_forecast":       "kp_forecast_3d",
    "solar_wind_plasma": "solar_wind_plasma",
    "solar_wind_mag":    "solar_wind_mag",
    "xray":              "xray_flux",
    "alerts":            "alerts",
}


def _fetch_json(url: str) -> Optional[Any]:
    """Fetch URL and return parsed JSON, or None on any error."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": _USER_AGENT})
        with urllib.request.urlopen(req, timeout=_TIMEOUT) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"[helio.provider] WARNING: fetch failed for {url}: {e}")
        return None


def fetch_swpc() -> Dict[str, Optional[Any]]:
    """
    Fetch all SWPC products.

    Returns a dict keyed by internal product key.
    Each value is raw parsed JSON (list or list-of-dicts) or None on failure.
    """
    result: Dict[str, Optional[Any]] = {}
    for key, url in _ENDPOINTS.items():
        data = _fetch_json(url)
        result[key] = data
        status = "ok" if data is not None else "FAILED"
        count = len(data) if isinstance(data, list) else "n/a"
        print(f"[helio.provider] {key}: {status} (rows={count})")
    return result


def active_product_names(raw: Dict[str, Optional[Any]]) -> List[str]:
    """Return canonical product names for products that returned data."""
    return [PRODUCT_NAMES[k] for k in _ENDPOINTS if raw.get(k) is not None]
