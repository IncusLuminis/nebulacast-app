#!/usr/bin/env python3
"""
Normalize NOAA SWPC raw fetches into space_weather_now.json schema.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


# ── Timestamp helpers ────────────────────────────────────────────────────────

def _parse_swpc_ts(raw: str) -> Optional[str]:
    """Parse a NOAA SWPC timestamp string to UTC ISO8601 with Z suffix."""
    if not raw:
        return None
    # Common formats: "2026-03-02 09:00:00" or with .000 ms or "2026-03-02T09:00:00Z"
    for fmt in (
        "%Y-%m-%d %H:%M:%S.%f",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S",
    ):
        try:
            dt = datetime.strptime(raw.strip(), fmt).replace(tzinfo=timezone.utc)
            return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        except ValueError:
            continue
    return None


# ── Kp ───────────────────────────────────────────────────────────────────────

def _kp_activity_label(kp: float) -> str:
    if kp < 4.0:
        return "quiet"
    if kp < 5.0:
        return "minor"
    if kp < 6.0:
        return "moderate"
    if kp < 7.0:
        return "strong"
    return "severe"


def _parse_kp_observed(rows: Optional[List]) -> Optional[Dict]:
    """Extract latest Kp value from observed array (skip header row)."""
    if not rows:
        return None
    # First row is header: ["time_tag", "Kp"]
    latest_ts: Optional[str] = None
    latest_val: Optional[float] = None
    for row in rows[1:]:
        if not isinstance(row, (list, tuple)) or len(row) < 2:
            continue
        try:
            val = float(row[1])
            ts = _parse_swpc_ts(str(row[0]))
            if ts is not None:
                latest_ts = ts
                latest_val = val
        except (TypeError, ValueError):
            continue
    if latest_ts is None or latest_val is None:
        return None
    return {"timestamp_utc": latest_ts, "value": latest_val}


def _parse_kp_forecast(rows: Optional[List], max_bins: int = 8) -> List[Dict]:
    """Extract forecast Kp bins (rows where Observed column is not 'observed')."""
    if not rows:
        return []
    bins: List[Dict] = []
    now_utc = datetime.now(timezone.utc)
    # Header row first
    for row in rows[1:]:
        if not isinstance(row, (list, tuple)) or len(row) < 2:
            continue
        ts_str = str(row[0])
        ts = _parse_swpc_ts(ts_str)
        if ts is None:
            continue
        # Include only future or "predicted" rows
        try:
            dt = datetime.strptime(ts, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
        except ValueError:
            continue
        # Some forecast feeds have a 3rd column with "observed"/"predicted"
        if len(row) >= 3:
            obs_flag = str(row[2]).lower()
            if obs_flag == "observed":
                continue
        elif dt <= now_utc:
            continue
        try:
            val = float(row[1])
        except (TypeError, ValueError):
            continue
        bins.append({"timestamp_utc": ts, "value": val})
        if len(bins) >= max_bins:
            break
    return bins


# ── Solar wind ───────────────────────────────────────────────────────────────

def _parse_solar_wind(rows: Optional[List]) -> Optional[Dict]:
    """Extract latest solar wind speed and density from plasma-1-day data."""
    if not rows:
        return None
    # Header: ["time_tag", "density", "speed", "temperature"]
    latest: Optional[Dict] = None
    for row in rows[1:]:
        if not isinstance(row, (list, tuple)) or len(row) < 3:
            continue
        ts = _parse_swpc_ts(str(row[0]))
        if ts is None:
            continue
        try:
            speed = float(row[2]) if row[2] not in (None, "null", "") else None
        except (TypeError, ValueError):
            speed = None
        try:
            density = float(row[1]) if row[1] not in (None, "null", "") else None
        except (TypeError, ValueError):
            density = None
        if speed is not None:
            latest = {
                "timestamp_utc": ts,
                "speed_kms": speed,
                "density_protons_cm3": density,
            }
    return latest


# ── X-ray ────────────────────────────────────────────────────────────────────

def _xray_class(flux: float) -> str:
    if flux >= 1e-4:
        return "X"
    if flux >= 1e-5:
        return "M"
    if flux >= 1e-6:
        return "C"
    if flux >= 1e-7:
        return "B"
    return "A"


def _parse_xray(entries: Optional[List]) -> Optional[Dict]:
    """Extract latest X-ray flux from the 0.1-0.8nm (long-wave) band."""
    if not entries:
        return None
    # Entries are dicts: {energy, flux, observed_flux, time_tag} or similar
    # We want the long-wave band: "0.1-0.8nm"
    latest: Optional[Dict] = None
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        energy = str(entry.get("energy", "")).strip()
        if "0.1-0.8" not in energy:
            continue
        ts = _parse_swpc_ts(str(entry.get("time_tag", "")))
        if ts is None:
            continue
        flux_raw = entry.get("flux") or entry.get("observed_flux")
        try:
            flux = float(flux_raw)
        except (TypeError, ValueError):
            continue
        if flux > 0:
            latest = {
                "timestamp_utc": ts,
                "flux_wm2": flux,
                "class": _xray_class(flux),
            }
    return latest


# ── Alerts ───────────────────────────────────────────────────────────────────

def _parse_alerts(entries: Optional[List]) -> List[Dict]:
    """Parse SWPC alerts into structured list."""
    if not entries:
        return []
    out: List[Dict] = []
    for i, entry in enumerate(entries):
        if not isinstance(entry, dict):
            continue
        ts_raw = entry.get("issue_datetime") or entry.get("issue_time") or ""
        ts = _parse_swpc_ts(str(ts_raw))
        message = str(entry.get("message", "")).strip()
        if not message:
            continue
        # Derive level from message content
        msg_upper = message.upper()
        if "WARNING" in msg_upper:
            level = "warning"
        elif "WATCH" in msg_upper:
            level = "watch"
        else:
            level = "info"
        # Use first non-empty line of message as title
        title_line = next((l.strip() for l in message.splitlines() if l.strip()), message[:80])
        out.append({
            "id": str(entry.get("product_id", f"alert-{i}")),
            "timestamp_utc": ts or "",
            "title": title_line,
            "level": level,
            "source": "NOAA SWPC",
        })
    return out


# ── Main normalizer ──────────────────────────────────────────────────────────

def build_space_weather(raw: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize NOAA SWPC raw payload to space_weather_now.json schema.
    Each section is independently nullable; never raises.
    """
    generated_utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    try:
        kp_latest = _parse_kp_observed(raw.get("kp_observed"))
    except Exception as e:
        print(f"[space_weather] WARNING: kp_latest parse error: {e}")
        kp_latest = None

    try:
        kp_forecast = _parse_kp_forecast(raw.get("kp_forecast"))
    except Exception as e:
        print(f"[space_weather] WARNING: kp_forecast parse error: {e}")
        kp_forecast = []

    activity_label: Optional[str] = None
    if kp_latest is not None:
        try:
            activity_label = _kp_activity_label(kp_latest["value"])
        except Exception:
            pass

    try:
        solar_wind = _parse_solar_wind(raw.get("solar_wind"))
    except Exception as e:
        print(f"[space_weather] WARNING: solar_wind parse error: {e}")
        solar_wind = None

    try:
        xray = _parse_xray(raw.get("xray"))
    except Exception as e:
        print(f"[space_weather] WARNING: xray parse error: {e}")
        xray = None

    try:
        alerts = _parse_alerts(raw.get("alerts"))
    except Exception as e:
        print(f"[space_weather] WARNING: alerts parse error: {e}")
        alerts = []

    return {
        "generated_utc": generated_utc,
        "kp": {
            "latest": kp_latest,
            "forecast_3h": kp_forecast,
            "activity_label": activity_label,
        },
        "solar_wind": solar_wind,
        "xray": xray,
        "alerts": alerts,
    }
