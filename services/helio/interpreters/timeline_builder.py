#!/usr/bin/env python3
"""
Solar Activity Timeline builder.

Merges classified SWPC events (from swpc_alerts.interpret()) with raw NASA DONKI
data into a unified, chronologically sorted TimelineEvent list.

Output is suitable for rendering a causal-chain visualization:
  Solar Flare → CME Launch → CME Propagation → CME Arrival → Geomagnetic Storm

Each TimelineEvent dict has the following shape:
{
    "event_time":     str,          # UTC ISO-8601 with Z (e.g. "2026-03-13T04:22:00Z")
    "event_type":     str,          # see EVENT_TYPES below
    "event_title":    str,          # human-readable label
    "level":          str,          # "info" | "watch" | "warning"
    "severity_label": str | None,   # e.g. "C2.3" | "minor" | "strong" | None
    "description":    str,          # longer text for click-expand detail
    "source":         str,          # "NOAA_SWPC" | "NASA_DONKI"
    "is_active":      bool,         # event currently in progress
    "is_future":      bool,         # predicted future event (arrival time > now)
    "metadata":       dict,         # source-specific fields (region, speed_kms, etc.)
}
"""
from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

# ── Constants ─────────────────────────────────────────────────────────────────

EVENT_TYPES = frozenset({
    "solar_flare",
    "cme_launch",
    "cme_arrival",
    "geomagnetic_storm",
    "geomagnetic_watch",
    "radio_blackout",
    "radiation_storm",
    "space_weather_info",
})

# Map SWPC HelioEvent.kind → TimelineEvent.event_type
_SWPC_KIND_MAP: Dict[str, str] = {
    "geomagnetic_storm":  "geomagnetic_storm",
    "geomagnetic_watch":  "geomagnetic_watch",
    "radio_blackout":     "radio_blackout",
    "radiation_storm":    "radiation_storm",
    "cme_arrival":        "cme_arrival",
    "cme_watch":          "geomagnetic_watch",   # treat as watch
    "aurora_watch":       "geomagnetic_watch",   # aurora watch = geo watch context
    "solar_flare":        "solar_flare",
    "space_weather_info": "space_weather_info",
    "unknown":            "space_weather_info",
}

# Minimum flare class to include in timeline (skip A/B-class noise)
_MIN_FLARE_CLASS = "C"
_FLARE_CLASS_ORDER = {"A": 0, "B": 1, "C": 2, "M": 3, "X": 4}


# ── Timestamp helpers ──────────────────────────────────────────────────────────

def _to_utc_z(ts: Optional[str]) -> Optional[str]:
    """
    Normalize a DONKI timestamp string to UTC ISO-8601 with Z suffix.
    DONKI uses "YYYY-MM-DDTHH:mmZ" or "YYYY-MM-DD HH:mm:ss" formats.
    Returns None if parsing fails.
    """
    if not ts:
        return None
    ts = ts.strip().rstrip("Z").replace(" ", "T")
    # Remove seconds if present, ensure no trailing colon
    # Accept: 2026-03-11T04:22, 2026-03-11T04:22:00, 2026-03-11T04:22:30.000
    try:
        # Try full ISO parse
        for fmt in ("%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M"):
            try:
                dt = datetime.strptime(ts[:len(fmt) - 2 + ts.count(":")], fmt)
                return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
            except ValueError:
                continue
        # fallback: strip everything after minute
        m = re.match(r"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})", ts)
        if m:
            dt = datetime.strptime(m.group(1), "%Y-%m-%dT%H:%M")
            return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    except Exception:
        pass
    return None


def _parse_utc(ts_z: Optional[str]) -> Optional[datetime]:
    """Parse a UTC-Z timestamp string to datetime (UTC-aware)."""
    if not ts_z:
        return None
    try:
        return datetime.strptime(ts_z, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    except Exception:
        return None


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


# ── SWPC event mapping ─────────────────────────────────────────────────────────

def _swpc_event_to_timeline(ev: Dict[str, Any], now: datetime) -> Optional[Dict[str, Any]]:
    """
    Convert a HelioEvent dict (from swpc_alerts.interpret()) to a TimelineEvent.
    Returns None if the event should be excluded.
    """
    kind = ev.get("kind", "unknown")
    etype = _SWPC_KIND_MAP.get(kind, "space_weather_info")

    t_str = ev.get("t_utc")
    t = _parse_utc(t_str)
    if t is None:
        return None

    level         = ev.get("level", "info")
    severity      = ev.get("severity")          # int 1–5 or None
    sev_label     = ev.get("severity_label")    # e.g. "minor", "strong", "M", "X"
    title         = ev.get("title") or ev.get("raw_title") or etype.replace("_", " ").title()
    summary_short = ev.get("summary_short", "")
    raw_body      = ev.get("raw_body", "")

    # Build description for click-expand
    desc_parts = []
    if summary_short:
        desc_parts.append(summary_short)
    if raw_body and raw_body != summary_short:
        # Trim to first ~300 chars to keep it readable
        trimmed = raw_body[:300].strip()
        if len(raw_body) > 300:
            trimmed += "…"
        desc_parts.append(trimmed)
    description = "\n".join(desc_parts) if desc_parts else title

    is_active = (level == "warning") and (t <= now) and ((now - t).total_seconds() < 24 * 3600)
    is_future = t > now

    source_code = ev.get("source_code")
    metadata: Dict[str, Any] = {"source_code": source_code} if source_code else {}
    if severity is not None:
        metadata["severity"] = severity

    return {
        "event_time":     t_str,
        "event_type":     etype,
        "event_title":    title,
        "level":          level,
        "severity_label": sev_label,
        "description":    description,
        "source":         "NOAA_SWPC",
        "is_active":      is_active,
        "is_future":      is_future,
        "metadata":       metadata,
    }


# ── DONKI flare mapping ────────────────────────────────────────────────────────

def _flare_level(class_type: str) -> str:
    """Derive level from flare class: M/X → warning, C → info."""
    if not class_type:
        return "info"
    letter = class_type[0].upper()
    if letter in ("X", "M"):
        return "warning"
    return "info"


def _flare_title(class_type: str, region: Optional[int]) -> str:
    cls = class_type.upper() if class_type else "Solar Flare"
    if region:
        return f"{cls} Solar Flare (AR{region})"
    return f"{cls} Solar Flare"


def _donki_flares_to_timeline(
    flares: List[Dict[str, Any]],
    now: datetime,
    window_start: datetime,
    window_end: datetime,
) -> List[Dict[str, Any]]:
    events = []
    for f in (flares or []):
        # Use peakTime if available, else beginTime
        ts = _to_utc_z(f.get("peakTime") or f.get("beginTime"))
        if not ts:
            continue
        t = _parse_utc(ts)
        if t is None or t < window_start or t > window_end:
            continue

        class_type = (f.get("classType") or "").strip()
        if not class_type:
            continue

        # Skip below minimum threshold
        letter = class_type[0].upper()
        if _FLARE_CLASS_ORDER.get(letter, 0) < _FLARE_CLASS_ORDER.get(_MIN_FLARE_CLASS, 2):
            continue

        region    = f.get("activeRegionNum")
        location  = f.get("sourceLocation", "")
        level     = _flare_level(class_type)
        title     = _flare_title(class_type, region)

        desc_parts = [f"{class_type}-class solar flare detected."]
        if region:
            desc_parts.append(f"Active Region: AR{region}")
        if location:
            desc_parts.append(f"Location: {location}")
        begin = _to_utc_z(f.get("beginTime"))
        end   = _to_utc_z(f.get("endTime"))
        if begin:
            desc_parts.append(f"Begin: {begin[:16]} UTC")
        if end:
            desc_parts.append(f"End: {end[:16]} UTC")

        metadata: Dict[str, Any] = {"class": class_type}
        if region:
            metadata["region"] = region
        if location:
            metadata["location"] = location

        is_active = (level == "warning") and (t <= now) and ((now - t).total_seconds() < 3 * 3600)
        is_future = t > now

        events.append({
            "event_time":     ts,
            "event_type":     "solar_flare",
            "event_title":    title,
            "level":          level,
            "severity_label": class_type,
            "description":    "\n".join(desc_parts),
            "source":         "NASA_DONKI",
            "is_active":      is_active,
            "is_future":      is_future,
            "metadata":       metadata,
        })
    return events


# ── DONKI CME launch mapping ───────────────────────────────────────────────────

def _donki_cmes_to_timeline(
    cmes: List[Dict[str, Any]],
    now: datetime,
    window_start: datetime,
    window_end: datetime,
) -> List[Dict[str, Any]]:
    events = []
    for c in (cmes or []):
        ts = _to_utc_z(c.get("startTime"))
        if not ts:
            continue
        t = _parse_utc(ts)
        if t is None or t < window_start or t > window_end:
            continue

        # Pull speed from first analysis if available
        speed_kms: Optional[float] = None
        half_angle: Optional[float] = None
        analyses  = c.get("cmeAnalyses") or []
        for a in analyses:
            if a.get("isMostAccurate"):
                speed_kms  = a.get("speed")
                half_angle = a.get("halfAngle")
                break
        if speed_kms is None and analyses:
            speed_kms  = analyses[0].get("speed")
            half_angle = analyses[0].get("halfAngle")

        location = c.get("sourceLocation", "")
        title    = "CME Launch"
        if speed_kms:
            title = f"CME Launch · {int(speed_kms)} km/s"

        desc_parts = ["Coronal Mass Ejection detected."]
        if speed_kms:
            desc_parts.append(f"Speed: {int(speed_kms)} km/s")
        if half_angle:
            desc_parts.append(f"Half-angle: {half_angle}°")
        if location:
            desc_parts.append(f"Source: {location}")

        metadata: Dict[str, Any] = {}
        if speed_kms is not None:
            metadata["speed_kms"] = speed_kms
        if half_angle is not None:
            metadata["half_angle"] = half_angle
        if location:
            metadata["location"] = location

        # Level heuristic: fast/wide CMEs are more likely to be impactful
        level = "info"
        if speed_kms and speed_kms >= 1000:
            level = "watch"
        if speed_kms and speed_kms >= 1500:
            level = "warning"

        is_future = t > now

        events.append({
            "event_time":     ts,
            "event_type":     "cme_launch",
            "event_title":    title,
            "level":          level,
            "severity_label": None,
            "description":    "\n".join(desc_parts),
            "source":         "NASA_DONKI",
            "is_active":      False,  # CME launch itself is a discrete event
            "is_future":      is_future,
            "metadata":       metadata,
        })
    return events


# ── DONKI CME analysis (arrival predictions) ──────────────────────────────────

def _donki_arrivals_to_timeline(
    analyses: List[Dict[str, Any]],
    now: datetime,
    window_start: datetime,
    window_end: datetime,
) -> List[Dict[str, Any]]:
    """
    Parse CMEAnalysis records for Earth-directed arrivals (Enlil model).
    Only isMostAccurate records with an Enlil arrivalTime are used.
    """
    events = []
    seen: set = set()  # dedup by (rounded_arrival_hour)

    for a in (analyses or []):
        if not a.get("isMostAccurate"):
            continue

        enlil_list = a.get("enlilList") or []
        for enlil in enlil_list:
            arrival_raw = enlil.get("arrivalTime")
            if not arrival_raw:
                continue
            ts = _to_utc_z(arrival_raw)
            if not ts:
                continue
            t = _parse_utc(ts)
            if t is None or t < window_start or t > window_end:
                continue

            # Round to nearest 6h for dedup
            bucket = t.replace(minute=0, second=0, microsecond=0)
            bucket = bucket.replace(hour=(bucket.hour // 6) * 6)
            if bucket in seen:
                continue
            seen.add(bucket)

            speed_kms = a.get("speed")
            half_angle = a.get("halfAngle")
            is_future = t > now

            desc_parts = ["CME arrival at Earth predicted."]
            if speed_kms:
                desc_parts.append(f"Predicted speed: {int(speed_kms)} km/s")
            if half_angle:
                desc_parts.append(f"Half-angle: {half_angle}°")
            duration_hrs = enlil.get("duration")
            if duration_hrs:
                desc_parts.append(f"Expected duration: ~{duration_hrs} hours")
            desc_parts.append(f"Source: NASA DONKI (Enlil model)")

            metadata: Dict[str, Any] = {"model": "enlil"}
            if speed_kms:
                metadata["speed_kms"] = speed_kms
            if half_angle:
                metadata["half_angle"] = half_angle

            level = "watch" if is_future else "warning"
            title = "CME Arrival Forecast" if is_future else "CME Arrival"

            events.append({
                "event_time":     ts,
                "event_type":     "cme_arrival",
                "event_title":    title,
                "level":          level,
                "severity_label": None,
                "description":    "\n".join(desc_parts),
                "source":         "NASA_DONKI",
                "is_active":      (not is_future) and ((now - t).total_seconds() < 24 * 3600),
                "is_future":      is_future,
                "metadata":       metadata,
            })
    return events


# ── Deduplication ─────────────────────────────────────────────────────────────

def _dedup_cme_arrivals(events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    If a SWPC cme_arrival and a DONKI cme_arrival are within 12h of each other,
    prefer the SWPC one (confirmed alert) over the DONKI prediction.
    """
    swpc_arrivals  = [e for e in events if e["event_type"] == "cme_arrival" and e["source"] == "NOAA_SWPC"]
    donki_arrivals = [e for e in events if e["event_type"] == "cme_arrival" and e["source"] == "NASA_DONKI"]
    other          = [e for e in events if e["event_type"] != "cme_arrival"]

    kept_donki = []
    for da in donki_arrivals:
        da_t = _parse_utc(da["event_time"])
        if da_t is None:
            continue
        overlap = any(
            abs((_parse_utc(sa["event_time"]) - da_t).total_seconds()) < 12 * 3600
            for sa in swpc_arrivals
            if _parse_utc(sa["event_time"]) is not None
        )
        if not overlap:
            kept_donki.append(da)

    return other + swpc_arrivals + kept_donki


# ── Main entry point ──────────────────────────────────────────────────────────

def build_timeline(
    swpc_events:     List[Dict[str, Any]],
    donki_raw:       Dict[str, Optional[Any]],
    now_utc:         Optional[datetime] = None,
    window_past_h:   int = 72,
    window_future_h: int = 48,
) -> List[Dict[str, Any]]:
    """
    Build a unified, chronologically sorted timeline of solar activity events.

    Args:
        swpc_events:     alerts_all list from swpc_alerts.interpret()
        donki_raw:       raw dict from nasa_donki.fetch_donki()
        now_utc:         reference time (defaults to datetime.now(utc))
        window_past_h:   how many hours back to include events
        window_future_h: how many hours ahead to include predicted events

    Returns:
        List of TimelineEvent dicts, sorted ascending by event_time.
    """
    now          = (now_utc or _now_utc()).replace(tzinfo=timezone.utc) if (now_utc or _now_utc()).tzinfo is None else (now_utc or _now_utc())
    window_start = now - timedelta(hours=window_past_h)
    window_end   = now + timedelta(hours=window_future_h)

    all_events: List[Dict[str, Any]] = []

    # ── SWPC events (already classified HelioEvent dicts) ─────────────────────
    for ev in (swpc_events or []):
        te = _swpc_event_to_timeline(ev, now)
        if te is None:
            continue
        t = _parse_utc(te["event_time"])
        if t is None or t < window_start or t > window_end:
            continue
        all_events.append(te)

    # ── DONKI flares ──────────────────────────────────────────────────────────
    all_events.extend(
        _donki_flares_to_timeline(
            donki_raw.get("flr") or [], now, window_start, window_end
        )
    )

    # ── DONKI CME launches ────────────────────────────────────────────────────
    all_events.extend(
        _donki_cmes_to_timeline(
            donki_raw.get("cme") or [], now, window_start, window_end
        )
    )

    # ── DONKI CME arrivals (Enlil) ────────────────────────────────────────────
    all_events.extend(
        _donki_arrivals_to_timeline(
            donki_raw.get("cme_analysis") or [], now, window_start, window_end
        )
    )

    # ── Dedup overlapping CME arrivals ────────────────────────────────────────
    all_events = _dedup_cme_arrivals(all_events)

    # ── Sort ascending by event_time ─────────────────────────────────────────
    def sort_key(e: Dict[str, Any]) -> datetime:
        t = _parse_utc(e.get("event_time"))
        return t or datetime.min.replace(tzinfo=timezone.utc)

    all_events.sort(key=sort_key)

    print(f"[helio.timeline] built {len(all_events)} events "
          f"(swpc={sum(1 for e in all_events if e['source']=='NOAA_SWPC')} "
          f"donki={sum(1 for e in all_events if e['source']=='NASA_DONKI')})")

    return all_events
