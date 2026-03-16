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

from datetime import datetime, timezone, timedelta
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

def _normalize_solar_wind_density_pressure(rows: Optional[List]) -> tuple:
    """
    Extract latest density (cm⁻³) and dynamic pressure (nPa) from plasma-1-day data.
    Column order: time_tag, density, speed, temperature.
    Returns (density, pressure_npa) — each may be None.
    """
    if not rows:
        return None, None

    density: Optional[float] = None
    speed: Optional[float] = None

    for row in rows[1:]:  # skip header
        if not isinstance(row, (list, tuple)) or len(row) < 3:
            continue
        ts = _parse_swpc_ts(str(row[0]))
        if ts is None:
            continue
        try:
            d = float(row[1]) if row[1] not in (None, "null", "") else None
        except (TypeError, ValueError):
            d = None
        try:
            s = float(row[2]) if row[2] not in (None, "null", "") else None
        except (TypeError, ValueError):
            s = None
        if d is not None:
            density = d
        if s is not None:
            speed = s

    pressure = round(1.67e-6 * density * (speed ** 2), 2) if density and speed else None
    density_r = round(density, 2) if density is not None else None
    return density_r, pressure


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

def _normalize_imf_bz(rows: Optional[List]) -> Tuple[Optional[float], Optional[float]]:
    """
    Extract latest IMF Bz and Bt (nT) from solar-wind/mag-1-day data.
    Column order: time_tag, bx_gsm, by_gsm, bz_gsm, lon_gsm, lat_gsm, bt.
    Returns (bz_nt, bt_nt); either may be None if unavailable.
    """
    if not rows:
        return None, None

    bz: Optional[float] = None
    bt: Optional[float] = None

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
        try:
            bt_val = float(row[6]) if len(row) > 6 and row[6] not in (None, "null", "") else None
        except (TypeError, ValueError):
            bt_val = None
        if bz_val is not None:
            bz = bz_val
        if bt_val is not None:
            bt = bt_val

    return bz, bt


# ── 24-hour history series (1-hour buckets) ───────────────────────────────────

def _hour_floor(ts: str) -> str:
    """Truncate an ISO UTC timestamp to the hour floor: '2026-03-13T07:00:00Z'."""
    return ts[:13] + ":00:00Z"


def _history_cutoff() -> str:
    """Return ISO UTC string for 24 hours ago."""
    dt = datetime.now(timezone.utc) - timedelta(hours=24)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _history_cutoff_6h() -> str:
    """Return ISO UTC string for 6 hours ago."""
    dt = datetime.now(timezone.utc) - timedelta(hours=6)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _five_min_floor(ts: str) -> str:
    """Truncate an ISO UTC timestamp to the nearest 5-minute floor."""
    minute = int(ts[14:16])
    floored = (minute // 5) * 5
    return ts[:14] + f"{floored:02d}:00Z"


def _normalize_kp_history_1h(rows: Optional[List]) -> List[Dict[str, Any]]:
    """
    Produce 1-hour averaged Kp values for the last 24h.
    Input: kp_observed rows  [[time_tag, kp_index], ...]  (header first).
    Returns [{t_utc, kp}] ascending, one point per completed hour.
    """
    if not rows:
        return []
    cutoff = _history_cutoff()
    buckets: Dict[str, List[float]] = {}
    for row in rows[1:]:
        if not isinstance(row, (list, tuple)) or len(row) < 2:
            continue
        ts = _parse_swpc_ts(str(row[0]))
        if not ts or ts < cutoff:
            continue
        try:
            val = float(row[1])
        except (TypeError, ValueError):
            continue
        key = _hour_floor(ts)
        buckets.setdefault(key, []).append(val)
    return sorted(
        [{"t_utc": k, "kp": round(sum(v) / len(v), 2)} for k, v in buckets.items()],
        key=lambda p: p["t_utc"],
    )


def _normalize_wind_history_1h(rows: Optional[List]) -> List[Dict[str, Any]]:
    """
    Produce 1-hour averaged solar wind parameters for the last 24h.
    Input: solar_wind_plasma rows  [[time_tag, density, speed, temp], ...]
    Returns [{t_utc, kms, density, temp_kk, pressure_npa}] ascending.
    Dynamic pressure: P(nPa) = 1.67e-6 * n(cm⁻³) * v(km/s)²
    """
    if not rows:
        return []
    cutoff = _history_cutoff()
    spd_b: Dict[str, List[float]] = {}
    den_b: Dict[str, List[float]] = {}
    tmp_b: Dict[str, List[float]] = {}
    for row in rows[1:]:
        if not isinstance(row, (list, tuple)) or len(row) < 4:
            continue
        ts = _parse_swpc_ts(str(row[0]))
        if not ts or ts < cutoff:
            continue
        key = _hour_floor(ts)
        try:
            spd = float(row[2]) if row[2] not in (None, "null", "") else None
        except (TypeError, ValueError):
            spd = None
        try:
            den = float(row[1]) if row[1] not in (None, "null", "") else None
        except (TypeError, ValueError):
            den = None
        try:
            tmp = float(row[3]) if row[3] not in (None, "null", "") else None
        except (TypeError, ValueError):
            tmp = None
        if spd is not None:
            spd_b.setdefault(key, []).append(spd)
        if den is not None:
            den_b.setdefault(key, []).append(den)
        if tmp is not None:
            tmp_b.setdefault(key, []).append(tmp)
    result = []
    for k in sorted(set(spd_b) | set(den_b) | set(tmp_b)):
        spd_avg = round(sum(spd_b[k]) / len(spd_b[k]), 1) if k in spd_b else None
        den_avg = round(sum(den_b[k]) / len(den_b[k]), 2) if k in den_b else None
        tmp_avg = round(sum(tmp_b[k]) / len(tmp_b[k]) / 1000, 1) if k in tmp_b else None  # K → kK
        pres = round(1.67e-6 * den_avg * (spd_avg ** 2), 2) if den_avg and spd_avg else None
        result.append({
            "t_utc":        k,
            "kms":          spd_avg,
            "density":      den_avg,   # cm⁻³
            "temp_kk":      tmp_avg,   # kilo-Kelvin
            "pressure_npa": pres,      # nPa
        })
    return result


def _normalize_xray_history_1h(entries: Optional[List]) -> List[Dict[str, Any]]:
    """
    Produce 1-hour averaged X-ray flux for the last 24h.
    Input: GOES xrays-1-day JSON list of dicts (0.1–0.8 nm band only).
    Returns [{t_utc, flux}] ascending, flux in W/m².
    """
    if not entries:
        return []
    cutoff = _history_cutoff()
    buckets: Dict[str, List[float]] = {}
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        if "0.1-0.8" not in str(entry.get("energy", "")):
            continue
        ts = _parse_swpc_ts(str(entry.get("time_tag", "")))
        if not ts or ts < cutoff:
            continue
        try:
            f = float(entry.get("flux") or 0)
        except (TypeError, ValueError):
            continue
        if f <= 0:
            continue
        key = _hour_floor(ts)
        buckets.setdefault(key, []).append(f)
    return sorted(
        [{"t_utc": k, "flux": sum(v) / len(v)} for k, v in buckets.items()],
        key=lambda p: p["t_utc"],
    )


def _normalize_bz_history_5m(rows: Optional[List]) -> List[Dict[str, Any]]:
    """
    Produce 5-minute averaged IMF Bz (nT) for the last 6h.
    Input: solar_wind_mag rows [[time_tag, bx, by, bz_gsm, ...], ...]
    Returns [{t_utc, bz}] ascending, one point per 5-min bucket.
    """
    if not rows:
        return []
    cutoff = _history_cutoff_6h()
    buckets: Dict[str, List[float]] = {}
    for row in rows[1:]:
        if not isinstance(row, (list, tuple)) or len(row) < 4:
            continue
        ts = _parse_swpc_ts(str(row[0]))
        if not ts or ts < cutoff:
            continue
        try:
            val = float(row[3]) if row[3] not in (None, "null", "") else None
        except (TypeError, ValueError):
            val = None
        if val is None:
            continue
        key = _five_min_floor(ts)
        buckets.setdefault(key, []).append(val)
    return sorted(
        [{"t_utc": k, "bz": round(sum(v) / len(v), 2)} for k, v in buckets.items()],
        key=lambda p: p["t_utc"],
    )


def _normalize_bz_history_1h(rows: Optional[List]) -> List[Dict[str, Any]]:
    """
    Produce 1-hour averaged IMF Bz (nT) for the last 24h.
    Input: solar_wind_mag rows  [[time_tag, bx, by, bz_gsm, ...], ...]
    Returns [{t_utc, bz}] ascending.
    """
    if not rows:
        return []
    cutoff = _history_cutoff()
    buckets: Dict[str, List[float]] = {}
    for row in rows[1:]:
        if not isinstance(row, (list, tuple)) or len(row) < 4:
            continue
        ts = _parse_swpc_ts(str(row[0]))
        if not ts or ts < cutoff:
            continue
        try:
            val = float(row[3]) if row[3] not in (None, "null", "") else None
        except (TypeError, ValueError):
            val = None
        if val is None:
            continue
        key = _hour_floor(ts)
        buckets.setdefault(key, []).append(val)
    return sorted(
        [{"t_utc": k, "bz": round(sum(v) / len(v), 2)} for k, v in buckets.items()],
        key=lambda p: p["t_utc"],
    )


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
    density, pressure_npa = _normalize_solar_wind_density_pressure(raw.get("solar_wind_plasma"))
    imf_bz_nt, imf_bt_nt = _normalize_imf_bz(raw.get("solar_wind_mag"))
    raw_alerts     = _normalize_alerts(raw.get("alerts"))

    kp_history_1h    = _normalize_kp_history_1h(raw.get("kp_observed"))
    wind_history_1h  = _normalize_wind_history_1h(raw.get("solar_wind_plasma"))
    xray_history_1h  = _normalize_xray_history_1h(raw.get("xray"))
    bz_history_1h    = _normalize_bz_history_1h(raw.get("solar_wind_mag"))
    bz_history_5m    = _normalize_bz_history_5m(raw.get("solar_wind_mag"))

    metrics: Dict[str, Any] = {
        "kp_latest":        kp_val,
        "kp_time_utc":      kp_ts,
        "kp_forecast_3h":   kp_forecast,
        "kp_history_1h":    kp_history_1h,
        "xray_flux_wm2":    xray_flux,
        "xray_class":       xray_class,
        "xray_history_1h":  xray_history_1h,
        "solar_wind_kms":   solar_wind_kms,
        "density":          density,
        "pressure_npa":     pressure_npa,
        "wind_history_1h":  wind_history_1h,
        "imf_bz_nt":        imf_bz_nt,
        "imf_bt_nt":        imf_bt_nt,
        "bz_history_1h":    bz_history_1h,
        "bz_history_5m":    bz_history_5m,
    }

    return {
        "metrics":    metrics,
        "raw_alerts": raw_alerts,
    }
