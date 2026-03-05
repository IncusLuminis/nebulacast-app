#!/usr/bin/env python3
"""
Rule-based additive scoring engine for weather.
Profiles are YAML; factors contribute 0..max each; score = sum(earned) clamped to [0, 100].
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

try:
    import yaml
except ImportError:
    yaml = None  # type: ignore

logger = logging.getLogger(__name__)

# Scoring profiles live in service's scoring/ dir
_SCORING_DIR = Path(__file__).resolve().parent.parent / "scoring"


def _round3(x: float) -> float:
    return round(x, 3)


def _safe_float(v: Any) -> Optional[float]:
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _transform_linear_inverse(raw: Optional[float], max_raw: float) -> float:
    if raw is None or max_raw <= 0:
        return 0.0
    return _round3(max(0.0, min(1.0, 1.0 - raw / max_raw)))


def _transform_linear(raw: Optional[float], min_raw: float, max_raw: float) -> float:
    if raw is None:
        return 0.0
    if max_raw <= min_raw:
        return 1.0 if raw <= min_raw else 0.0
    t = (raw - min_raw) / (max_raw - min_raw)
    return _round3(max(0.0, min(1.0, t)))


def _transform_threshold(raw: Optional[float], good_raw: float, bad_raw: float) -> float:
    if raw is None:
        return 0.0
    if raw <= good_raw:
        return 1.0
    if raw >= bad_raw:
        return 0.0
    if bad_raw <= good_raw:
        return 1.0
    t = (raw - good_raw) / (bad_raw - good_raw)
    return _round3(1.0 - t)


def _transform_scale_discrete(raw: Optional[float], best_raw: float, worst_raw: float) -> float:
    if raw is None:
        return 0.0
    if worst_raw == best_raw:
        return 1.0 if raw == best_raw else 0.0
    t = (raw - best_raw) / (worst_raw - best_raw)
    return _round3(max(0.0, min(1.0, 1.0 - t)))


def _transform_piecewise(raw: Optional[float], breakpoints: List[Dict[str, float]]) -> float:
    if raw is None or not breakpoints:
        return 0.0
    sorted_pts = sorted(breakpoints, key=lambda p: p["raw"])
    if raw <= sorted_pts[0]["raw"]:
        return _round3(sorted_pts[0]["norm"])
    if raw >= sorted_pts[-1]["raw"]:
        return _round3(sorted_pts[-1]["norm"])
    for i in range(len(sorted_pts) - 1):
        r0, n0 = sorted_pts[i]["raw"], sorted_pts[i]["norm"]
        r1, n1 = sorted_pts[i + 1]["raw"], sorted_pts[i + 1]["norm"]
        if r0 <= raw <= r1:
            if r1 == r0:
                return _round3(n0)
            t = (raw - r0) / (r1 - r0)
            return _round3(n0 + t * (n1 - n0))
    return 0.0


def _apply_transform(transform: str, raw: Optional[float], params: Dict[str, Any]) -> float:
    if transform == "linear_inverse":
        return _transform_linear_inverse(raw, float(params.get("max_raw", 100)))
    if transform == "linear":
        return _transform_linear(
            raw,
            float(params.get("min_raw", 0)),
            float(params.get("max_raw", 100)),
        )
    if transform == "threshold":
        return _transform_threshold(
            raw,
            float(params.get("good_raw", 0)),
            float(params.get("bad_raw", 100)),
        )
    if transform == "scale_discrete":
        return _transform_scale_discrete(
            raw,
            float(params.get("best_raw", 1)),
            float(params.get("worst_raw", 7)),
        )
    if transform == "piecewise":
        return _transform_piecewise(raw, params.get("breakpoints", []))
    logger.warning("Unknown transform %r, returning 0", transform)
    return 0.0


def load_profile(path: Optional[Path] = None, profile_name: Optional[str] = None) -> Dict[str, Any]:
    if yaml is None:
        raise RuntimeError("PyYAML is required for scoring profiles.")
    if path is None:
        if profile_name is None:
            profile_name = "default"
        path = _SCORING_DIR / f"{profile_name}.yaml"
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Scoring profile not found: {path}")
    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    if not data or "factors" not in data:
        raise ValueError(f"Invalid profile: {path}")
    return data


def _normalize_earned_to_sum(
    items: List[Dict[str, Any]], target_sum: int
) -> List[Dict[str, Any]]:
    total = sum(it["earned"] for it in items)
    diff = target_sum - total
    if diff == 0:
        return items
    indexed = sorted(range(len(items)), key=lambda i: items[i]["max"], reverse=True)
    for k in indexed:
        if diff == 0:
            break
        inc = 1 if diff > 0 else -1
        new_earned = items[k]["earned"] + inc
        if new_earned < 0 or new_earned > items[k]["max"]:
            continue
        items[k]["earned"] = new_earned
        diff -= inc
    return items


def compute_score(
    hour_obj: Dict[str, Any],
    derived_obj: Optional[Dict[str, Any]],
    profile: Dict[str, Any],
) -> Dict[str, Any]:
    derived_obj = derived_obj or {}
    max_score = int(profile.get("max_score", 100))
    profile_name = profile.get("profile", "default")
    factors = profile.get("factors", [])

    breakdown: List[Dict[str, Any]] = []
    total_earned = 0

    for f in factors:
        if not f.get("enabled", True):
            continue
        key = f.get("key", "")
        label = f.get("label", key)
        max_pts = int(f.get("max", 0))
        field = f.get("field", key)
        transform = f.get("transform", "linear_inverse")
        params = {k: v for k, v in f.items() if k not in ("key", "label", "max", "field", "transform", "enabled")}

        raw = hour_obj.get(field)
        if raw is not None and field == "precip_prob":
            r = _safe_float(raw)
            if r is not None and r <= 1.0 and r > 0:
                raw = r * 100.0
        else:
            raw = _safe_float(raw)

        normalized = _apply_transform(transform, raw, params)
        earned_f = normalized * max_pts
        earned = int(round(earned_f))
        earned = max(0, min(max_pts, earned))
        total_earned += earned

        raw_display = round(raw, 3) if raw is not None else None
        if raw_display is not None and isinstance(raw_display, float) and raw_display == int(raw_display):
            raw_display = int(raw_display)

        breakdown.append({
            "key": key,
            "label": label,
            "max": max_pts,
            "raw": raw_display,
            "normalized": normalized,
            "factor_score": round(100 * normalized),
            "earned": earned,
            "note": None,
        })

    score = max(0, min(max_score, total_earned))
    breakdown = _normalize_earned_to_sum(breakdown, score)

    explain: List[Dict[str, Any]] = []
    for it in breakdown:
        raw_s = str(it["raw"]) if it["raw"] is not None else "—"
        if it["key"] in ("cloud_total", "cloud_high"):
            raw_s = f"{raw_s}%" if it["raw"] is not None else "—"
        elif it["key"] == "wind_m_s":
            raw_s = f"{raw_s} m/s" if it["raw"] is not None else "—"
        elif it["key"] == "visibility_m":
            raw_s = f"{raw_s} m" if it["raw"] is not None else "—"
        explain.append({
            "line": f"{it['label']}: {raw_s} → +{it['earned']}",
            "key": it["key"],
            "earned": it["earned"],
            "max": it["max"],
        })

    lost = [{"key": it["key"], "label": it["label"], "lost": it["max"] - it["earned"]} for it in breakdown]

    return {
        "score": score,
        "earned": score,
        "max_score": max_score,
        "profile": profile_name,
        "breakdown": breakdown,
        "lost": lost,
        "explain": explain,
    }


def compute_derived_for_hour(
    hour_index: int,
    hours: List[Dict[str, Any]],
) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    n = len(hours)
    if hour_index < 0 or hour_index >= n:
        return out
    h = hours[hour_index]
    if hour_index + 6 < n:
        p0 = h.get("pressure_hpa")
        p6 = hours[hour_index + 6].get("pressure_hpa")
        if p0 is not None and p6 is not None:
            out["pressure_trend_6h"] = round(p6 - p0, 1)
    window = hours[hour_index : min(hour_index + 24, n)]
    if window:
        winds = [x.get("wind_m_s") for x in window if x.get("wind_m_s") is not None]
        out["wind_peak_next_24h"] = round(max(winds), 1) if winds else None
        clouds = [x.get("cloud_total") for x in window if x.get("cloud_total") is not None]
        if clouds:
            c_pct = [c if c > 1 else c * 100 for c in clouds]
            out["cloud_peak_next_24h"] = round(max(c_pct), 0)
        else:
            out["cloud_peak_next_24h"] = None
        precip_probs = [x.get("precip_prob") for x in window if x.get("precip_prob") is not None]
        if precip_probs:
            p_pct = [p if p > 1 else p * 100 for p in precip_probs]
            out["precip_peak_next_24h"] = round(max(p_pct), 0)
        else:
            out["precip_peak_next_24h"] = None
        vis = [x.get("visibility_m") for x in window if x.get("visibility_m") is not None]
        out["visibility_min_next_24h"] = round(min(vis), 0) if vis else None
    return out


def build_heads_up(
    hour_index: int,
    hours: List[Dict[str, Any]],
    derived: Dict[str, Any],
) -> List[str]:
    messages: List[str] = []
    n = len(hours)
    if hour_index < 0 or hour_index >= n:
        return messages
    current = hours[hour_index]
    window_12 = hours[hour_index : min(hour_index + 12, n)]
    cloud_now = current.get("cloud_total")
    if cloud_now is not None and len(window_12) >= 2:
        cloud_now_pct = cloud_now if cloud_now > 1 else cloud_now * 100
        for i, h in enumerate(window_12[1:], 1):
            c = h.get("cloud_total")
            if c is not None:
                c_pct = c if c > 1 else c * 100
                if c_pct > cloud_now_pct + 30:
                    t = h.get("time", "")[-8:-3] if isinstance(h.get("time"), str) else ""
                    messages.append(f"Clouds increase after {t}")
                    break
    wind_now = current.get("wind_m_s")
    wind_peak = derived.get("wind_peak_next_24h")
    if wind_now is not None and wind_peak is not None and wind_peak > wind_now + 4:
        for h in window_12:
            if h.get("wind_m_s") == wind_peak:
                t = h.get("time", "")[-8:-3] if isinstance(h.get("time"), str) else ""
                messages.append(f"Wind peaks around {t}")
                break
    precip_peak = derived.get("precip_peak_next_24h")
    if precip_peak is not None and precip_peak >= 40:
        messages.append("Precipitation risk (≥40%) in next 24h")
    pressure_trend = derived.get("pressure_trend_6h")
    if pressure_trend is not None and pressure_trend < -1.5:
        messages.append(f"Pressure falling ({pressure_trend} hPa/6h)")
    return messages[:5]
