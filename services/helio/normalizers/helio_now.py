#!/usr/bin/env python3
"""
Normalize raw NOAA SWPC provider payloads into internal helio domain structures.

Output is consumed downstream by the interpreter (swpc_alerts.py) and
aggregator (helio_state.py) layers.  This layer has no interpretation logic —
it only cleans, parses, and structures raw provider data.

Output shape:
  {
    "metrics": HelioMetrics dict,
    "raw_alerts": list of RawSwpcAlertRecord dicts,
  }
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple


# ── Timestamp helpers ─────────────────────────────────────────────────────────

def _parse_swpc_ts(raw: str) -> Optional[str]:
    """
    Parse a NOAA SWPC timestamp string → UTC ISO 8601 string with Z suffix.
    Tolerates common SWPC formats and trailing fractional seconds.
    """
    if not raw:
        return None
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

def _normalize_kp_latest(
    rows: Optional[List],
) -> Tuple[Optional[float], Optional[str]]:
    """
    Extract the latest Kp value and its UTC timestamp from the observed array.
    First row is always the header — skipped.
    Returns (kp_value, kp_time_utc) or (None, None).
    """
    if not rows:
        return None, None

    kp_val: Optional[float] = None
    kp_ts: Optional[str] = None

    for row in rows[1:]:
        if not isinstance(row, (list, tuple)) or len(row) < 2:
            continue
        try:
            val = float(row[1])
            ts = _parse_swpc_ts(str(row[0]))
            if ts is not None:
                kp_val = val
                kp_ts = ts
        except (TypeError, ValueError):
            continue

    return kp_val, kp_ts


def _normalize_kp_forecast(rows: Optional[List]) -> List[Dict[str, Any]]:
    """
    Extract future 3h Kp forecast points from the SWPC forecast product.

    Skips rows flagged as "observed" (3rd column) and rows with past timestamps.
    Returns list of {t_utc, kp} dicts, ascending by time.
    """
    if not rows:
        return []

    now_utc = datetime.now(timezone.utc)
    points: List[Dict[str, Any]] = []

    for row in rows[1:]:  # skip header
        if not isinstance(row, (list, tuple)) or len(row) < 2:
            continue

        ts = _parse_swpc_ts(str(row[0]))
        if ts is None:
            continue

        try:
            dt = datetime.strptime(ts, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
        except ValueError:
            continue

        # Skip rows explicitly labelled "observed"
        if len(row) >= 3 and str(row[2]).strip().lower() == "observed":
            continue
        # Skip past timestamps
        if dt <= now_utc:
            continue

        try:
            kp = float(row[1])
        except (TypeError, ValueError):
            continue

        points.append({"t_utc": ts, "kp": kp})

    # Ascending by time (should already be, but enforce)
    points.sort(key=lambda p: p["t_utc"])
    return points


# ── X-ray ─────────────────────────────────────────────────────────────────────

def _xray_class_from_flux(flux: float) -> str:
    """Map X-ray flux (W/m²) to NOAA flare class letter."""
    if flux >= 1e-4:
        return "X"
    if flux >= 1e-5:
        return "M"
    if flux >= 1e-6:
        return "C"
    if flux >= 1e-7:
        return "B"
    return "A"


def _normalize_xray(
    entries: Optional[List],
) -> Tuple[Optional[float], Optional[str]]:
    """
    Extract latest X-ray flux from GOES xrays-1-day data.
    Uses the long-wave band (0.1–0.8 nm) only.
    Returns (xray_flux_wm2, xray_class) or (None, None).
    """
    if not entries:
        return None, None

    flux: Optional[float] = None

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
            f = float(flux_raw)
            if f > 0:
                flux = f
        except (TypeError, ValueError):
            continue

    if flux is None:
        return None, None
    return flux, _xray_class_from_flux(flux)


# ── Solar wind ────────────────────────────────────────────────────────────────

def _normalize_solar_wind_speed(rows: Optional[List]) -> Optional[float]:
    """
    Extract latest solar wind speed (km/s) from plasma-1-day data.
    Column order: time_tag, density, speed, temperature.
    """
    if not rows:
        return None

    speed: Optional[float] = None

    for row in rows[1:]:  # skip header
        if not isinstance(row, (list, tuple)) or len(row) < 3:
            continue
        ts = _parse_swpc_ts(str(row[0]))
        if ts is None:
            continue
        try:
            s = float(row[2]) if row[2] not in (None, "null", "") else None
        except (TypeError, ValueError):
            s = None
        if s is not None:
            speed = s

    return speed


# ── IMF Bz ────────────────────────────────────────────────────────────────────

def _normalize_imf_bz(rows: Optional[List]) -> Optional[float]:
    """
    Extract latest IMF Bz (nT) from solar-wind/mag-1-day data.
    Column order: time_tag, bx_gsm, by_gsm, bz_gsm, bt, lat, lon.
    Returns None if feed is unavailable or values are missing.
    """
    if not rows:
        return None

    bz: Optional[float] = None

    for row in rows[1:]:  # skip header
        if not isinstance(row, (list, tuple)) or len(row) < 4:
            continue
        ts = _parse_swpc_ts(str(row[0]))
        if ts is None:
            continue
        try:
            bz_val = float(row[3]) if row[3] not in (None, "null", "") else None
        except (TypeError, ValueError):
            bz_val = None
        if bz_val is not None:
            bz = bz_val

    return bz


# ── Raw alert records ─────────────────────────────────────────────────────────

def _extract_message_code(message: str) -> Optional[str]:
    """
    Extract the SWPC message code from the first line of an alert body.
    Example: "Space Weather Message Code:  WARK04" → "WARK04"
    """
    for line in message.splitlines():
        stripped = line.strip()
        if stripped.upper().startswith("SPACE WEATHER MESSAGE CODE"):
            parts = stripped.split(":", 1)
            if len(parts) == 2:
                return parts[1].strip() or None
    return None


def _extract_message_title(message: str) -> Optional[str]:
    """
    Extract the first meaningful content line from an alert body,
    skipping standard SWPC header lines (code, issue time, valid time).
    """
    skip_prefixes = (
        "SPACE WEATHER MESSAGE CODE",
        "SERIAL NUMBER",
        "ISSUE TIME",
        "VALID TIME",
        "NOAA SPACE WEATHER",
    )
    for line in message.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        upper = stripped.upper()
        if any(upper.startswith(p) for p in skip_prefixes):
            continue
        return stripped
    return None


def _normalize_alerts(entries: Optional[List]) -> List[Dict[str, Any]]:
    """
    Normalize raw SWPC alert entries into internal RawSwpcAlertRecord dicts.

    These records are the direct input to the interpreter layer — not yet
    classified HelioEvents.  All raw text is preserved for the interpreter.

    Skips entries with no message body.
    """
    if not entries:
        return []

    records: List[Dict[str, Any]] = []

    for entry in entries:
        if not isinstance(entry, dict):
            continue

        ts_raw = (
            entry.get("issue_datetime")
            or entry.get("issue_time")
            or ""
        )
        issued_utc = _parse_swpc_ts(str(ts_raw)) if ts_raw else None

        message = str(entry.get("message", "")).strip()
        if not message:
            continue

        code = _extract_message_code(message)
        title = _extract_message_title(message)
        product_id = str(entry.get("product_id", "")).strip() or None

        records.append({
            "issued_utc":   issued_utc,
            "message_code": code,
            "message_type": product_id,
            "title":        title,
            "body":         message,
            "source":       "NOAA_SWPC",
        })

    return records


# ── Main normalizer entry point ───────────────────────────────────────────────

def normalize(raw: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize raw SWPC provider payload into internal helio domain structures.

    Args:
        raw: dict from providers.noaa_swpc.fetch_swpc() — keys are internal
             product keys, values are raw JSON or None.

    Returns:
        {
            "metrics":    HelioMetrics-compatible dict (all fields present,
                          nullable scalars may be None, arrays never None),
            "raw_alerts": list of RawSwpcAlertRecord dicts for the interpreter,
        }
    """
    kp_val, kp_ts = _normalize_kp_latest(raw.get("kp_observed"))
    kp_forecast   = _normalize_kp_forecast(raw.get("kp_forecast"))
    xray_flux, xray_class = _normalize_xray(raw.get("xray"))
    solar_wind_kms = _normalize_solar_wind_speed(raw.get("solar_wind_plasma"))
    imf_bz_nt      = _normalize_imf_bz(raw.get("solar_wind_mag"))
    raw_alerts     = _normalize_alerts(raw.get("alerts"))

    metrics: Dict[str, Any] = {
        "kp_latest":      kp_val,
        "kp_time_utc":    kp_ts,
        "kp_forecast_3h": kp_forecast,
        "xray_flux_wm2":  xray_flux,
        "xray_class":     xray_class,
        "solar_wind_kms": solar_wind_kms,
        "imf_bz_nt":      imf_bz_nt,
    }

    return {
        "metrics":    metrics,
        "raw_alerts": raw_alerts,
    }
