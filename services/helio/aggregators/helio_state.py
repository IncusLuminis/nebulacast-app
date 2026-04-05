#!/usr/bin/env python3
"""
Helio domain aggregate state derivation.

Combines numeric metrics (Kp, X-ray, solar wind, IMF Bz) with interpreted
HelioEvent lists to produce the normalized aggregate state consumed by the
serializer (gen_helio.py) and ultimately the frontend widget.

Public API:
  derive(metrics, events, updated_utc?) ->
      {summary, scales, forecast, aurora_hint, observer_impacts,
       alerts_preview, alerts_all}

All derivations are deterministic, conservative, and observer-oriented.
See: docs/Helio/Helio Aggregate Derivation Spec v1.md
"""
from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Tuple


# ── Helpers ───────────────────────────────────────────────────────────────────

def _parse_ts(ts: Optional[str]) -> Optional[datetime]:
    if not ts:
        return None
    try:
        return datetime.strptime(ts, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def _events_in_window(
    events: List[Dict[str, Any]],
    cutoff_dt: datetime,
    now_dt: datetime,
) -> List[Dict[str, Any]]:
    """Return events with t_utc in [cutoff_dt, now_dt]."""
    result = []
    for ev in events:
        dt = _parse_ts(ev.get("t_utc"))
        if dt is not None and cutoff_dt <= dt <= now_dt:
            result.append(ev)
    return result


def _max_severity_for_kind(
    events: List[Dict[str, Any]], kind: str,
) -> Optional[int]:
    vals = [
        ev["severity"]
        for ev in events
        if ev.get("kind") == kind and ev.get("severity") is not None
    ]
    return max(vals) if vals else None


def _has_kind(events: List[Dict[str, Any]], kind: str) -> bool:
    return any(ev.get("kind") == kind for ev in events)


# ── G/R/S scale derivation ────────────────────────────────────────────────────

def _derive_g_scale(
    events_24h: List[Dict[str, Any]], kp_latest: Optional[float],
) -> int:
    """Return G-scale integer 0–5 (spec §5.1)."""
    # 1. Storm events take priority
    sev = _max_severity_for_kind(events_24h, "geomagnetic_storm")
    if sev is not None:
        return sev

    # 2. Watch events (may carry severity from WATA20 etc.)
    sev = _max_severity_for_kind(events_24h, "geomagnetic_watch")
    if sev is not None:
        return sev

    # 3. Kp fallback
    if kp_latest is not None:
        if kp_latest >= 9:
            return 5
        if kp_latest >= 8:
            return 4
        if kp_latest >= 7:
            return 3
        if kp_latest >= 6:
            return 2
        if kp_latest >= 5:
            return 1

    return 0


def _derive_r_scale(
    events_24h: List[Dict[str, Any]], xray_class: Optional[str],
) -> int:
    """Return R-scale integer 0–5 (spec §5.2)."""
    sev = _max_severity_for_kind(events_24h, "radio_blackout")
    if sev is not None:
        return sev

    # X-ray fallback
    if xray_class == "X":
        return 3
    if xray_class == "M":
        return 1

    return 0


def _derive_s_scale(events_24h: List[Dict[str, Any]]) -> int:
    """Return S-scale integer 0–5 (spec §5.3)."""
    sev = _max_severity_for_kind(events_24h, "radiation_storm")
    return sev if sev is not None else 0


# ── Kp forecast ───────────────────────────────────────────────────────────────

def _derive_forecast(
    kp_forecast_3h: List[Dict[str, Any]],
    now_dt: datetime,
) -> Dict[str, Any]:
    """Derive kp_max_next_24h, kp_max_at_utc, trend (spec §6)."""
    horizon = now_dt + timedelta(hours=24)

    eligible = [
        p for p in kp_forecast_3h
        if now_dt <= (_parse_ts(p.get("t_utc")) or datetime.min.replace(tzinfo=timezone.utc)) <= horizon
    ]

    if not eligible:
        return {"kp_max_next_24h": None, "kp_max_at_utc": None, "trend": "unknown"}

    kp_max = max(p["kp"] for p in eligible)
    # First point at the maximum value
    kp_max_point = next(p for p in eligible if p["kp"] == kp_max)

    # Trend: compare first vs last eligible
    trend = "unknown"
    if len(eligible) >= 2:
        delta = eligible[-1]["kp"] - eligible[0]["kp"]
        if delta >= 0.7:
            trend = "rising"
        elif delta <= -0.7:
            trend = "falling"
        else:
            trend = "steady"

    return {
        "kp_max_next_24h": round(kp_max, 2),
        "kp_max_at_utc":   kp_max_point["t_utc"],
        "trend":           trend,
    }


# ── Top-level status derivation ───────────────────────────────────────────────

def _derive_status(
    g: int, r: int, s: int,
    events_24h: List[Dict[str, Any]],
    xray_class: Optional[str],
    kp_latest: Optional[float],
    kp_max_next_24h: Optional[float],
    solar_wind_kms: Optional[float],
    imf_bz_nt: Optional[float],
) -> str:
    """Return 'quiet' | 'active' | 'elevated' | 'storm' (spec §8)."""
    has_cme_arrival = _has_kind(events_24h, "cme_arrival")

    # storm
    if g >= 3 or r >= 3 or s >= 3:
        return "storm"
    if has_cme_arrival and g >= 2:
        return "storm"
    if xray_class == "X":
        return "storm"

    # elevated
    if g >= 1 or r >= 1 or s >= 1:
        return "elevated"
    if xray_class == "M":
        return "elevated"
    if kp_latest is not None and kp_latest >= 5:
        return "elevated"
    if kp_max_next_24h is not None and kp_max_next_24h >= 5:
        return "elevated"

    # active
    if kp_latest is not None and kp_latest >= 4:
        return "active"
    if kp_max_next_24h is not None and kp_max_next_24h >= 4:
        return "active"
    if solar_wind_kms is not None and solar_wind_kms >= 550:
        return "active"
    if imf_bz_nt is not None and imf_bz_nt <= -5:
        return "active"
    if _has_kind(events_24h, "geomagnetic_watch") or _has_kind(events_24h, "aurora_watch"):
        return "active"

    return "quiet"


_STATUS_LABELS = {
    "quiet":    "Quiet",
    "active":   "Active",
    "elevated": "Elevated",
    "storm":    "Storm Risk",
}


# ── Dominant driver ───────────────────────────────────────────────────────────

def _dominant_driver(
    g: int, r: int, s: int,
    events_24h: List[Dict[str, Any]],
    xray_class: Optional[str],
) -> str:
    """Internal: derive dominant driver for summary text (spec §13)."""
    if g >= 1 and g >= r and g >= s:
        return "geomagnetic"
    if r >= 1 and r >= s:
        return "radio"
    if s >= 1:
        return "radiation"
    if _has_kind(events_24h, "cme_arrival"):
        return "cme"
    if _has_kind(events_24h, "geomagnetic_watch") or _has_kind(events_24h, "aurora_watch"):
        return "aurora"
    if xray_class in ("M", "X"):
        return "flare"
    return "quiet"


# ── Summary text ──────────────────────────────────────────────────────────────

_SUMMARY_TEXTS: Dict[str, str] = {
    "quiet":    "Quiet geomagnetic conditions. No significant observer impact.",
    "active":   "Space weather is mildly active. Conditions may improve aurora chances at high latitudes.",
    "elevated": "Elevated space weather conditions. Aurora chances may improve at high latitudes.",
    "storm":    "Storm-level space weather conditions are present or possible. Operational impacts may increase.",
}


def _derive_summary(status: str, driver: str, g: int) -> Dict[str, str]:
    label = _STATUS_LABELS[status]

    if status == "storm":
        if driver == "geomagnetic":
            text = "Strong geomagnetic conditions are present. Aurora activity may be significant at high latitudes."
        elif driver == "radio":
            text = "Strong radio blackout conditions may affect communications."
        elif driver == "cme":
            text = "Storm-level space weather conditions are present or possible. Operational impacts may increase."
        else:
            text = _SUMMARY_TEXTS["storm"]
    else:
        text = _SUMMARY_TEXTS.get(status, _SUMMARY_TEXTS["quiet"])

    return {"status": status, "label": label, "text": text}


# ── Aurora hint ───────────────────────────────────────────────────────────────

_AURORA_SUMMARIES: Dict[str, str] = {
    "none":     "No meaningful aurora chance for most users.",
    "possible": "Aurora may be possible at high latitudes if activity increases.",
    "good":     "Aurora chances look favorable at high latitudes.",
}


def _derive_aurora_hint(
    kp_max_next_24h: Optional[float],
    events_24h: List[Dict[str, Any]],
    imf_bz_nt: Optional[float],
    kp_latest: Optional[float],
) -> Dict[str, Any]:
    """Derive aurora_hint (spec §10)."""
    # Base from kp_max_next_24h; fall back to kp_latest
    kp_ref = kp_max_next_24h if kp_max_next_24h is not None else kp_latest

    if kp_ref is None or kp_ref < 4:
        aurora_label    = "none"
        aurora_possible = False
        aurora_lat_est  = None
    elif kp_ref < 6:
        aurora_label    = "possible"
        aurora_possible = True
        aurora_lat_est  = 60
    else:
        aurora_label    = "good"
        aurora_possible = True
        aurora_lat_est  = 55

    # Event adjustment (spec §10.3)
    best_geo_sev = max(
        (
            ev["severity"]
            for ev in events_24h
            if ev.get("kind") in ("geomagnetic_storm", "geomagnetic_watch")
            and ev.get("severity") is not None
        ),
        default=None,
    )
    if best_geo_sev is not None and best_geo_sev >= 2:
        if aurora_label == "none":
            aurora_label    = "possible"
            aurora_possible = True
            aurora_lat_est  = 60
    if best_geo_sev is not None and best_geo_sev >= 3:
        if aurora_label == "possible":
            aurora_label   = "good"
            aurora_lat_est = 55

    # IMF Bz adjustment (spec §10.4)
    if imf_bz_nt is not None and imf_bz_nt <= -10 and aurora_label == "possible":
        aurora_label   = "good"
        aurora_lat_est = 55

    return {
        "aurora_possible":    aurora_possible,
        "aurora_min_lat_est": aurora_lat_est,
        "aurora_label":       aurora_label,
        "summary":            _AURORA_SUMMARIES[aurora_label],
    }


# ── Observer impacts ──────────────────────────────────────────────────────────

def _derive_observer_impacts(
    aurora_hint: Dict[str, Any],
    r: int,
    xray_class: Optional[str],
    events_24h: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Produce three fixed observer-impact rows (spec §11)."""

    # Aurora impact
    aurora_level_map = {"none": "none", "possible": "low", "good": "moderate"}
    aurora_level = aurora_level_map[aurora_hint["aurora_label"]]

    # Radio impact
    if r >= 4:
        radio_level = "high"
        radio_summary = "Strong radio blackout conditions may affect communications."
    elif r >= 2:
        radio_level = "moderate"
        radio_summary = "Noticeable HF radio degradation is possible."
    elif r >= 1:
        radio_level = "low"
        radio_summary = "Minor HF radio impact possible."
    else:
        radio_level = "none"
        radio_summary = "No major radio blackout expected."

    # Solar activity impact
    if xray_class == "X":
        sa_level = "high"
        sa_summary = "Strong flare activity is present or possible."
    elif xray_class == "M":
        sa_level = "moderate"
        sa_summary = "Elevated flare activity."
    elif xray_class in ("C", "B", "A"):
        sa_level = "low"
        sa_summary = "Low flare activity."
    elif _has_kind(events_24h, "solar_flare"):
        sa_level = "low"
        sa_summary = "Low flare activity."
    else:
        sa_level = "none"
        sa_summary = "No significant flare signal."

    return [
        {
            "kind":    "aurora",
            "level":   aurora_level,
            "label":   "Aurora",
            "summary": aurora_hint["summary"],
        },
        {
            "kind":    "radio",
            "level":   radio_level,
            "label":   "Radio impact",
            "summary": radio_summary,
        },
        {
            "kind":    "solar_activity",
            "level":   sa_level,
            "label":   "Solar activity",
            "summary": sa_summary,
        },
    ]


# ── Coronal hole / High-speed stream ─────────────────────────────────────────

def _derive_coronal_hole(solar_wind_kms: Optional[float]) -> Dict[str, Any]:
    """
    Derive coronal hole / high-speed stream state from solar wind speed.

    Heuristic thresholds:
      <420 km/s  → quiet   (background solar wind)
      420–499    → watch   (elevated, possible HSS source)
      500–599    → active  (high-speed stream in progress)
      ≥600       → strong  (strong HSS)

    Returns a CoronalHoleState-compatible dict.
    """
    speed = round(solar_wind_kms, 1) if solar_wind_kms is not None else None
    if solar_wind_kms is None:
        return {"status": "quiet", "estimated_speed_kms": None,  "note": "No solar wind data"}
    if solar_wind_kms >= 600:
        return {"status": "strong", "estimated_speed_kms": speed, "note": "Strong high-speed stream"}
    if solar_wind_kms >= 500:
        return {"status": "active", "estimated_speed_kms": speed, "note": "High-speed stream active"}
    if solar_wind_kms >= 420:
        return {"status": "watch",  "estimated_speed_kms": speed, "note": "Elevated solar wind — possible HSS"}
    return     {"status": "quiet",  "estimated_speed_kms": speed, "note": "Background solar wind"}


# ── Main entry point ──────────────────────────────────────────────────────────

def derive(
    metrics: Dict[str, Any],
    events: List[Dict[str, Any]],
    updated_utc: Optional[str] = None,
    timeline: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Derive aggregate helio state from metrics + interpreted events.

    Args:
        metrics:     HelioMetrics dict from normalizer (kp_latest, xray_*, etc.)
        events:      deduplicated HelioEvent list from interpreter
        updated_utc: pipeline run timestamp (UTC ISO string); defaults to now
        timeline:    pre-built TimelineEvent list from timeline_builder (optional)

    Returns:
        Dict with keys: summary, scales, forecast, aurora_hint,
        observer_impacts, alerts_preview, alerts_all, timeline
    """
    # Reference time
    if updated_utc:
        now_dt = _parse_ts(updated_utc) or datetime.now(timezone.utc)
    else:
        now_dt = datetime.now(timezone.utc)

    cutoff_24h = now_dt - timedelta(hours=24)

    # Extract metrics
    kp_latest       = metrics.get("kp_latest")
    kp_forecast_3h  = metrics.get("kp_forecast_3h") or []
    xray_class      = metrics.get("xray_class")
    solar_wind_kms  = metrics.get("solar_wind_kms")
    imf_bz_nt       = metrics.get("imf_bz_nt")

    # Normalise: if xray_class missing but flux available, derive it
    xray_flux = metrics.get("xray_flux_wm2")
    if xray_class is None and xray_flux is not None:
        if xray_flux >= 1e-4:
            xray_class = "X"
        elif xray_flux >= 1e-5:
            xray_class = "M"
        elif xray_flux >= 1e-6:
            xray_class = "C"
        elif xray_flux >= 1e-7:
            xray_class = "B"
        else:
            xray_class = "A"

    # Current-state events (last 24h)
    events_24h = _events_in_window(events, cutoff_24h, now_dt)

    # ── Scales ────────────────────────────────────────────────────────────────
    g = _derive_g_scale(events_24h, kp_latest)
    r = _derive_r_scale(events_24h, xray_class)
    s = _derive_s_scale(events_24h)

    scales = {
        "g_scale": f"G{g}",
        "r_scale": f"R{r}",
        "s_scale": f"S{s}",
    }

    # ── Forecast ──────────────────────────────────────────────────────────────
    forecast = _derive_forecast(kp_forecast_3h, now_dt)
    kp_max_next_24h = forecast["kp_max_next_24h"]

    # ── Status + summary ──────────────────────────────────────────────────────
    status = _derive_status(
        g, r, s, events_24h, xray_class,
        kp_latest, kp_max_next_24h, solar_wind_kms, imf_bz_nt,
    )
    driver  = _dominant_driver(g, r, s, events_24h, xray_class)
    summary = _derive_summary(status, driver, g)

    # Optional hero mirror for embedded UI (additive; duplicates scales + x-ray class)
    hero = {
        "kp": float(kp_latest) if kp_latest is not None else None,
        "status_label": summary.get("label"),
        "scales": {
            "g": scales["g_scale"],
            "r": scales["r_scale"],
            "s": scales["s_scale"],
            "x": xray_class,
        },
    }

    # ── Aurora hint ───────────────────────────────────────────────────────────
    aurora_hint = _derive_aurora_hint(
        kp_max_next_24h, events_24h, imf_bz_nt, kp_latest,
    )

    # ── Observer impacts ──────────────────────────────────────────────────────
    observer_impacts = _derive_observer_impacts(aurora_hint, r, xray_class, events_24h)

    # ── Coronal hole / High-speed stream ──────────────────────────────────────
    coronal_hole = _derive_coronal_hole(solar_wind_kms)

    # ── Alerts ────────────────────────────────────────────────────────────────
    # alerts_all: all events, newest first (already sorted by interpreter)
    alerts_all = sorted(events, key=lambda e: e.get("t_utc") or "", reverse=True)

    # alerts_preview is already computed by the interpreter; re-use as-is.
    # (The aggregator does not need to recompute it — the interpreter already
    #  applies dedup + diversity + relevance sort.)

    return {
        "summary":          summary,
        "hero":             hero,
        "scales":           scales,
        "forecast":         forecast,
        "aurora_hint":      aurora_hint,
        "observer_impacts": observer_impacts,
        "coronal_hole":     coronal_hole,
        "alerts_all":       alerts_all,
        "timeline":         timeline or [],
    }
