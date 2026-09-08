#!/usr/bin/env python3
"""
Night Quality Index (NQI) computation.

Implements a night-level decision metric summarising the overall observing
usefulness of a single night window (sunset → sunrise).  The NQI is on a
0.0–10.0 scale and is intentionally different from the hourly 0–100 score.

See: https://github.com/mloktionov/nebulacast.app/issues/293
"""
from __future__ import annotations

import statistics
from typing import Any, Dict, List, Optional

# ── Profile name mapping (display → score-engine profile file) ────────────────

_PROFILE_MAP: Dict[str, str] = {
    "balanced":    "default",
    "visual":      "visual",
    "photography": "photography",   # key matches decision.mode_scores
    "broadband":   "photography",   # alias accepted for spec compatibility
    "planetary":   "planetary",
}

# ── NQI classification bands ──────────────────────────────────────────────────

_BANDS = [
    (9.0, "excellent"),
    (7.0, "good"),
    (5.0, "usable"),
    (3.0, "marginal"),
    (0.0, "poor"),
]


def _nqi_class(value: float) -> str:
    for threshold, label in _BANDS:
        if value >= threshold:
            return label
    return "poor"


# ── Internal helpers ──────────────────────────────────────────────────────────

def _score_night_bins(
    bins: List[Dict],
    engine_profile: str,
    load_profile_fn,
    compute_score_fn,
) -> List[float]:
    """Return per-hour 0–100 scores for the given engine profile."""
    try:
        profile = load_profile_fn(profile_name=engine_profile)
    except Exception as exc:
        print(f"[night_quality] WARNING: could not load profile '{engine_profile}': {exc}")
        return [0.0] * len(bins)

    scores: List[float] = []
    for h in bins:
        flat = _flatten(h)
        try:
            result = compute_score_fn(flat, {}, profile)
            scores.append(float(result.get("score", 0)))
        except Exception:
            scores.append(0.0)
    return scores


def _flatten(h: Dict) -> Dict:
    """Flatten nested hourly dict to flat keys expected by score_engine."""
    cloud  = h.get("cloud")  or {}
    wind   = h.get("wind")   or {}
    precip = h.get("precip") or {}
    air    = h.get("air")    or {}
    astro  = h.get("astro")  or {}
    return {
        "cloud_total":   cloud.get("total_percent"),
        "precip_mm":     precip.get("mm"),
        "precip_prob":   precip.get("probability_percent"),
        "wind_m_s":      wind.get("speed_mps"),
        "wind_gust_m_s": wind.get("gust_mps"),
        "visibility_m":  air.get("visibility_m"),
        "seeing":        astro.get("seeing_raw"),
        "transparency":  astro.get("transparency_raw"),
    }


def _best_window_norm(scores: List[float], target_hours: float = 4.0) -> float:
    """
    Best-window component: strongest continuous window normalised to [0, 1].

    Rewards nights that have a solid, high-quality observing interval.
    """
    n = len(scores)
    w = max(1, min(int(target_hours), n))
    best_mean = 0.0
    for i in range(n - w + 1):
        chunk_mean = statistics.mean(scores[i : i + w])
        if chunk_mean > best_mean:
            best_mean = chunk_mean
    # Scale by fraction of target window available (shorter nights penalised less)
    hour_fraction  = min(1.0, n / target_hours)
    peak_quality   = best_mean / 100.0
    return round(min(1.0, hour_fraction * peak_quality), 3)


# ── Public API ────────────────────────────────────────────────────────────────

def compute_nqi(
    bins: List[Dict],
    profile: str,
    thresholds: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Compute the Night Quality Index for one observing profile.

    Parameters
    ----------
    bins      : hourly observer-weather dicts covering the night window
    profile   : one of "balanced", "visual", "broadband", "planetary"
    thresholds: optional override dict for tunable parameters

    Returns
    -------
    {
        "value": 8.4,              # float 0.0–10.0
        "class": "good",           # poor / marginal / usable / good / excellent
        "components": { ... }      # intermediate values for transparency
    }
    """
    if not bins:
        return {"value": 0.0, "class": "poor", "components": {}}

    th = thresholds or {}

    # Lazy import to keep the module importable even without score_engine
    try:
        from engine.score_engine import load_profile, compute_score
    except ImportError:
        try:
            from score_engine import load_profile, compute_score  # type: ignore
        except ImportError as exc:
            print(f"[night_quality] ERROR: cannot import score_engine: {exc}")
            return {"value": 0.0, "class": "poor", "components": {}}

    engine_profile = _PROFILE_MAP.get(profile, "default")
    scores = _score_night_bins(bins, engine_profile, load_profile, compute_score)
    n = len(scores)

    if n == 0:
        return {"value": 0.0, "class": "poor", "components": {}}

    # ── A. Median score component ─────────────────────────────────────────────
    median_score_norm = round(statistics.median(scores) / 100.0, 3)

    # ── B. Clear fraction ─────────────────────────────────────────────────────
    clear_cloud_thresh: float = th.get("clear_cloud_pct", 60.0)
    clear_bins = sum(
        1 for h in bins
        if (h.get("cloud") or {}).get("total_percent", 100.0) < clear_cloud_thresh
    )
    clear_fraction = round(clear_bins / n, 3)

    # ── C. Best-window component ──────────────────────────────────────────────
    best_win_norm = _best_window_norm(scores, target_hours=th.get("target_hours", 4.0))

    # ── D. Bad-time fraction ──────────────────────────────────────────────────
    bad_score_thresh: float = th.get("bad_score", 30.0)
    bad_bins = sum(1 for s in scores if s < bad_score_thresh)
    bad_time_fraction = round(bad_bins / n, 3)

    # ── E. Stability component ────────────────────────────────────────────────
    if n > 1:
        std = statistics.stdev(scores)
        # Normalise: std of 35 pts → stability 0; std of 0 → stability 1
        stability_score = round(max(0.0, 1.0 - (std / 35.0)), 3)
    else:
        stability_score = 0.5

    # ── F. Penalty components ─────────────────────────────────────────────────
    # Dew penalty: avg temperature–dewpoint spread < 3 °C
    spreads = [
        (h.get("air") or {}).get("temperature_c", 10.0)
        - (h.get("air") or {}).get("dewpoint_c", 5.0)
        for h in bins
    ]
    avg_spread = statistics.mean(spreads) if spreads else 5.0
    if avg_spread < 3.0:
        dew_penalty = round(min(0.15, (3.0 - avg_spread) / 3.0 * 0.15), 3)
    else:
        dew_penalty = 0.0

    # Wind penalty: avg wind > 6 m/s
    winds = [(h.get("wind") or {}).get("speed_mps", 0.0) for h in bins]
    avg_wind = statistics.mean(winds) if winds else 0.0
    if avg_wind > 6.0:
        wind_penalty = round(min(0.10, (avg_wind - 6.0) / 10.0 * 0.10), 3)
    else:
        wind_penalty = 0.0

    # Moon penalty: only for light-sensitive profiles
    moon_penalty = 0.0
    if profile in ("visual", "planetary"):
        moon_up_frac = sum(1 for h in bins if h.get("moon_up", False)) / n
        moon_penalty = round(min(0.08, moon_up_frac * 0.08), 3)

    # ── NQI formula ───────────────────────────────────────────────────────────
    raw = (
        0.25 * median_score_norm
        + 0.25 * clear_fraction
        + 0.20 * best_win_norm
        + 0.15 * (1.0 - bad_time_fraction)
        + 0.15 * stability_score
        - dew_penalty
        - wind_penalty
        - moon_penalty
    )
    nqi_value = round(max(0.0, min(1.0, raw)) * 10.0, 1)

    return {
        "value": nqi_value,
        "class": _nqi_class(nqi_value),
        "components": {
            "median_score_norm":  median_score_norm,
            "clear_fraction":     clear_fraction,
            "best_window_norm":   best_win_norm,
            "bad_time_fraction":  bad_time_fraction,
            "stability_score":    stability_score,
            "penalties": {
                "dew":  dew_penalty,
                "wind": wind_penalty,
                "moon": moon_penalty,
            },
        },
    }
