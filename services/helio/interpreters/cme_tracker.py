#!/usr/bin/env python3
"""
CME Tracker interpreter.

Selects the most operationally relevant Earth-directed CME from NASA DONKI
CME analysis data and returns a normalized CmeTrackerEvent dict (or None if
no relevant CME exists).

Output shape:
{
    "status":           str,          # "detected"|"inbound"|"arrival_window"|"arrived"
    "impact_level":     str,          # "low"|"moderate"|"high"|"unknown"
    "speed_kms":        float | None,
    "half_angle_deg":   float | None,
    "launch_time_utc":  str | None,   # ISO-Z
    "arrival_time_utc": str | None,   # ISO-Z
    "progress":         float | None, # 0.0–1.0, None when no arrival estimate
    "source_location":  str | None,   # e.g. "N12E30"
    "is_earth_direct":  bool,
    "model":            str,          # "enlil"
}
"""
from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

# ── Timestamp helpers (self-contained — mirror of timeline_builder) ────────────

def _to_utc_z(ts: Optional[str]) -> Optional[str]:
    if not ts:
        return None
    ts = ts.strip().rstrip("Z").replace(" ", "T")
    try:
        for fmt in ("%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M"):
            try:
                dt = datetime.strptime(ts[:len(fmt) - 2 + ts.count(":")], fmt)
                return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
            except ValueError:
                continue
        m = re.match(r"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})", ts)
        if m:
            dt = datetime.strptime(m.group(1), "%Y-%m-%dT%H:%M")
            return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    except Exception:
        pass
    return None


def _parse_utc(ts_z: Optional[str]) -> Optional[datetime]:
    if not ts_z:
        return None
    try:
        return datetime.strptime(ts_z, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    except Exception:
        return None


# ── Internal helpers ───────────────────────────────────────────────────────────

def _safe_float(val: Any) -> Optional[float]:
    try:
        return float(val) if val not in (None, "", "null") else None
    except (TypeError, ValueError):
        return None


def _best_enlil_entry(enlil_list: List[Dict]) -> Optional[Dict]:
    """Return the best Enlil entry: prefer isEarthDirectHit, then isEarthGB."""
    direct = [e for e in enlil_list if e.get("isEarthDirectHit") is True and e.get("arrivalTime")]
    if direct:
        # pick latest arrival among direct hits
        return max(direct, key=lambda e: e.get("arrivalTime") or "")
    glancing = [e for e in enlil_list if e.get("isEarthGB") is True and e.get("arrivalTime")]
    if glancing:
        return max(glancing, key=lambda e: e.get("arrivalTime") or "")
    return None


# ── CME ↔ CMEAnalysis linkage ──────────────────────────────────────────────────

def _find_launch_record(
    time21_5_z: Optional[str],
    cme_records: List[Dict],
) -> Optional[Dict]:
    """
    Find the CME launch record whose cmeAnalyses list contains an entry
    with a time21_5 matching time21_5_z. Returns None on no match.
    """
    if not time21_5_z:
        return None
    for cme in cme_records:
        analyses = cme.get("cmeAnalyses") or []
        for a in analyses:
            candidate = _to_utc_z(a.get("time21_5"))
            if candidate and candidate == time21_5_z:
                return cme
    return None


# ── Impact level ───────────────────────────────────────────────────────────────

def _derive_impact(
    speed: Optional[float],
    events: List[Dict[str, Any]],
    now_utc: datetime,
) -> str:
    """
    Derive operational impact level from CME speed, with upgrade path if
    a linked geomagnetic storm event (G2+) is present in the SWPC events list.
    """
    if speed is None:
        level = "unknown"
    elif speed < 400:
        level = "low"
    elif speed <= 700:
        level = "moderate"
    else:
        level = "high"

    # Upgrade if G2+ storm detected in the last 48 hours
    if level in ("low", "moderate", "unknown"):
        cutoff = now_utc - timedelta(hours=48)
        for ev in events:
            if ev.get("kind") == "geomagnetic_storm":
                sev = ev.get("severity")
                t   = _parse_utc(ev.get("t_utc"))
                if sev and sev >= 2 and t and t >= cutoff:
                    level = "high"
                    break

    return level


# ── Status derivation ──────────────────────────────────────────────────────────

_WINDOW_H = 6    # hours around predicted arrival = arrival_window
_STALE_H  = 30   # events older than this are not surfaced


def _derive_status(arrival_dt: Optional[datetime], now_utc: datetime) -> Optional[str]:
    """
    Returns status string or None if the event is stale and should not be shown.
    """
    if arrival_dt is None:
        return "detected"

    diff_h = (arrival_dt - now_utc).total_seconds() / 3600

    if diff_h > _WINDOW_H:
        return "inbound"
    if abs(diff_h) <= _WINDOW_H:
        return "arrival_window"
    if -_STALE_H <= diff_h <= -_WINDOW_H:
        return "arrived"
    # older than _STALE_H → stale → don't show
    return None


# ── Candidate collection ───────────────────────────────────────────────────────

def _collect_candidates(
    cme_analyses: List[Dict],
    now_utc: datetime,
) -> List[Tuple[Dict, Dict, str]]:
    """
    Returns list of (analysis, enlil_entry, status) tuples for Earth-directed
    CMEs that are not stale.
    """
    candidates = []
    for analysis in cme_analyses:
        if not analysis.get("isMostAccurate"):
            continue
        enlil_list = analysis.get("enlilList") or []
        if not enlil_list:
            continue
        enlil = _best_enlil_entry(enlil_list)
        if enlil is None:
            continue
        arrival_z  = _to_utc_z(enlil.get("arrivalTime"))
        arrival_dt = _parse_utc(arrival_z)
        status = _derive_status(arrival_dt, now_utc)
        if status is None:
            continue  # stale
        candidates.append((analysis, enlil, status))
    return candidates


def _select_best(candidates: List[Tuple[Dict, Dict, str]]) -> Tuple[Dict, Dict, str]:
    """
    Priority: direct > glancing; among ties prefer higher speed; inbound > others.
    """
    STATUS_RANK = {"arrival_window": 0, "inbound": 1, "arrived": 2, "detected": 3}

    def sort_key(t: Tuple[Dict, Dict, str]) -> Tuple:
        analysis, enlil, status = t
        is_direct = 1 if enlil.get("isEarthDirectHit") else 0
        speed     = _safe_float(analysis.get("speed")) or 0.0
        rank      = STATUS_RANK.get(status, 9)
        return (-is_direct, rank, -speed)

    return sorted(candidates, key=sort_key)[0]


# ── Progress computation ───────────────────────────────────────────────────────

def _compute_progress(
    launch_z: Optional[str],
    arrival_z: Optional[str],
    now_utc: datetime,
) -> Optional[float]:
    launch_dt  = _parse_utc(launch_z)
    arrival_dt = _parse_utc(arrival_z)
    if launch_dt is None or arrival_dt is None:
        return None
    span = (arrival_dt - launch_dt).total_seconds()
    if span <= 0:
        return None
    raw = (now_utc - launch_dt).total_seconds() / span
    return max(0.0, min(1.0, raw))


# ── Public API ─────────────────────────────────────────────────────────────────

def build_cme_tracker(
    donki_raw: Dict[str, Optional[Any]],
    events:    List[Dict[str, Any]],
    now_utc:   datetime,
) -> Optional[Dict[str, Any]]:
    """
    Select the most operationally relevant Earth-directed CME and return a
    normalized CmeTrackerEvent dict, or None if no relevant CME exists.

    Args:
        donki_raw: output of fetch_donki() — keys "cme", "cme_analysis", "flr"
        events:    HelioEvent list from swpc_alerts.interpret()
        now_utc:   current UTC datetime (timezone-aware)
    """
    cme_analyses: List[Dict] = donki_raw.get("cme_analysis") or []
    cme_records:  List[Dict] = donki_raw.get("cme") or []

    if not cme_analyses:
        return None

    candidates = _collect_candidates(cme_analyses, now_utc)
    if not candidates:
        return None

    analysis, enlil, status = _select_best(candidates)

    # ── Timestamps ──────────────────────────────────────────────────────────
    time21_5_z  = _to_utc_z(analysis.get("time21_5"))
    arrival_z   = _to_utc_z(enlil.get("arrivalTime"))

    # Resolve launch time from the linked CME record; fall back to time21_5
    launch_record = _find_launch_record(time21_5_z, cme_records)
    if launch_record:
        launch_z        = _to_utc_z(launch_record.get("startTime"))
        source_location = launch_record.get("sourceLocation")
    else:
        launch_z        = time21_5_z   # close enough for progress estimation
        source_location = None

    # ── Derived fields ───────────────────────────────────────────────────────
    speed        = _safe_float(analysis.get("speed"))
    half_angle   = _safe_float(analysis.get("halfAngle"))
    impact_level = _derive_impact(speed, events, now_utc)
    progress     = _compute_progress(launch_z, arrival_z, now_utc)

    return {
        "status":           status,
        "impact_level":     impact_level,
        "speed_kms":        speed,
        "half_angle_deg":   half_angle,
        "launch_time_utc":  launch_z,
        "arrival_time_utc": arrival_z,
        "progress":         round(progress, 3) if progress is not None else None,
        "source_location":  source_location,
        "is_earth_direct":  bool(enlil.get("isEarthDirectHit")),
        "model":            "enlil",
    }
