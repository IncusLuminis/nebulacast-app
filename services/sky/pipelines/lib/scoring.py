# services/sky/pipelines/lib/scoring.py
#
# Three scoring models for sky alerts (frontend contract: alerts_now.json).
#
# Model 1: external_v1  — cross-group comparable ranking
# Model 2: hazard_v1    — orbital hazard / collision risk
# Model 3: urgency_v1   — observational urgency ("look at this now")
#
# All scores normalized to [0..1] (score_norm) with score_raw = score_norm * 100.
from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple

from pipelines.lib.timeutil import utc_now_iso


# =========================
# COMMON HELPERS
# =========================

def _clamp01(x: float) -> float:
    return 0.0 if x < 0.0 else (1.0 if x > 1.0 else x)


def _as_float(x: Any) -> Optional[float]:
    try:
        if x is None:
            return None
        v = float(x)
        return v if (v == v) else None  # guard NaN
    except Exception:
        return None


def _as_str(x: Any) -> str:
    return "" if x is None else str(x)


def _parse_iso_utc(s: Optional[str]) -> Optional[datetime]:
    if not s:
        return None
    try:
        ss = str(s).strip()
        if ss.endswith("Z"):
            ss = ss[:-1] + "+00:00"
        dt = datetime.fromisoformat(ss)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except Exception:
        return None


def _now_dt_utc(now_utc: Optional[str]) -> Tuple[str, datetime]:
    """Single source of 'now': ISO string + UTC datetime."""
    now_iso = now_utc or utc_now_iso()
    dt = _parse_iso_utc(now_iso)
    if dt is None:
        now_iso = utc_now_iso()
        dt = _parse_iso_utc(now_iso) or datetime.now(timezone.utc)
    return now_iso, dt


def _group_norm(it: Dict[str, Any]) -> str:
    return _as_str(it.get("group") or it.get("type") or "").strip().lower()


def _get_meta(it: Dict[str, Any]) -> Dict[str, Any]:
    m = it.get("meta")
    return m if isinstance(m, dict) else {}


def _has_radec(it: Dict[str, Any]) -> bool:
    return (_as_float(it.get("ra_deg")) is not None) and (_as_float(it.get("dec_deg")) is not None)


# =========================
# MODEL 2: ORBITAL HAZARD (hazard_v1)
# =========================

def _torino_component(ts: Optional[float]) -> float:
    """Torino scale [0..10] → [0..1]."""
    if ts is None:
        return 0.0
    return _clamp01(float(ts) / 10.0)


def _palermo_component(ps: Optional[float]) -> float:
    """Palermo scale [-10..0] → [0..1]: higher ps = riskier."""
    if ps is None:
        return 0.0
    return _clamp01((float(ps) + 10.0) / 10.0)


def _ip_component(ip: Optional[float]) -> float:
    """Impact probability: log10 mapped [-10..-3] → [0..1]."""
    if ip is None:
        return 0.0
    try:
        v = float(ip)
        if v <= 0.0:
            return 0.0
        return _clamp01((math.log10(v) + 10.0) / 7.0)
    except Exception:
        return 0.0


def _moid_component(moid_au: Optional[float]) -> float:
    """
    MOID (AU): smaller is riskier.
    Spec: clamp((log10(0.05) - log10(moid)) / (log10(0.05) - log10(1e-4)))
    Range: 0.05 AU (safe-ish) → 0, 1e-4 AU (very close) → 1.
    """
    if moid_au is None:
        return 0.0
    m = float(moid_au)
    if m <= 0:
        return 1.0
    try:
        top = math.log10(0.05) - math.log10(m)
        bot = math.log10(0.05) - math.log10(1e-4)
        return _clamp01(top / bot)
    except Exception:
        return 0.0


def _encounter_dist_component(dist_ld: Optional[float], dist_au: Optional[float]) -> float:
    """
    Encounter distance: smaller is riskier.
    Prefer dist_ld; fall back to dist_au (1 LD ≈ 0.00257 AU).
    LD log-scale: 0.1 LD → 1, 10 LD → 0.
    """
    if dist_ld is not None:
        d = float(dist_ld)
        if d <= 0:
            return 1.0
        try:
            top = math.log10(10.0) - math.log10(d)
            bot = math.log10(10.0) - math.log10(0.1)
            return _clamp01(top / bot)
        except Exception:
            return 0.0
    if dist_au is not None:
        return _encounter_dist_component(float(dist_au) / 0.00257, None)
    return 0.0


def _size_component(diameter_km: Optional[float], h_mag: Optional[float]) -> float:
    """
    Object size proxy.
    Diameter: 0.02 km → 0, 1 km → 1 (log-scale).
    H absolute magnitude: 26 → 0, 18 → 1 (linear).
    """
    if diameter_km is not None:
        d = float(diameter_km)
        if d <= 0:
            return 0.0
        if d >= 1.0:
            return 1.0
        try:
            top = math.log10(d) - math.log10(0.02)
            bot = math.log10(1.0) - math.log10(0.02)
            return _clamp01(top / bot)
        except Exception:
            return 0.0
    if h_mag is not None:
        # H: 26 → 0, 18 → 1 (linear, larger H = smaller object)
        return _clamp01((26.0 - float(h_mag)) / (26.0 - 18.0))
    return 0.0


def _vrel_component(v_kms: Optional[float]) -> float:
    """Relative velocity: 5 km/s → 0, 30 km/s → 1 (linear)."""
    if v_kms is None:
        return 0.0
    return _clamp01((float(v_kms) - 5.0) / (30.0 - 5.0))


def _size_from_mag_component(mag: Optional[float]) -> float:
    """NEOCP brightness proxy: mag 22 → 0, mag 16 → 1 (clamp)."""
    if mag is None:
        return 0.0
    return _clamp01((22.0 - float(mag)) / (22.0 - 16.0))


def score_hazard_v1(item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Orbital hazard score [0..1].  Model: hazard_v1.

    Groups:
      risk  (JPL Sentry) — ts / ps / ip priority cascade
      neo   (close approach) — moid + encounter_dist + size + vrel
      neocp (unconfirmed candidates) — unknown_orbit + size_from_mag
      pha   (PHA) — same as neo + floor at 0.95
      others (gcn, grb, transient) — 0.0

    Output: {model, components, weights, score_norm, score_raw, notes?}
    """
    g = _group_norm(item)
    meta = _get_meta(item)

    is_pha = (g == "pha") or bool(meta.get("is_pha")) or (meta.get("pha") is True)

    # Raw fields
    ts = _as_float(meta.get("ts"))
    ps = _as_float(meta.get("ps"))
    ip = _as_float(meta.get("ip"))
    moid_au = _as_float(
        meta.get("moid_au") or meta.get("MOID_au") or meta.get("moid") or meta.get("sbdb_moid_au")
    )
    dist_ld = _as_float(meta.get("dist_ld") or meta.get("distance_ld"))
    dist_au = _as_float(meta.get("dist_au"))
    diam_km = _as_float(
        meta.get("diameter_est_km") or meta.get("diam_km")
        or meta.get("diameter_km") or meta.get("sbdb_diameter_km")
    )
    h_mag = _as_float(
        meta.get("h") or meta.get("sb_h") or meta.get("h_cad") or meta.get("sbdb_h")
    )
    v_kms = _as_float(meta.get("v_rel_kms") or meta.get("v_rel_km_s"))
    mag = _as_float(item.get("mag"))

    components: Dict[str, float] = {}
    weights: Dict[str, float] = {}
    notes: Dict[str, Any] = {}
    score_norm = 0.0

    if g == "risk":
        c_torino = _torino_component(ts)
        c_palermo = _palermo_component(ps)
        c_ip = _ip_component(ip)

        # Priority cascade: ts > ps > ip
        if ts is not None and ts > 0:
            active = "torino"
            score_norm = c_torino
        elif ps is not None:
            active = "palermo"
            score_norm = c_palermo
        elif ip is not None:
            active = "ip"
            score_norm = c_ip
        else:
            active = "none"
            score_norm = 0.0

        components = {
            "torino": round(c_torino, 4),
            "palermo": round(c_palermo, 4),
            "ip": round(c_ip, 4),
        }
        weights = {
            "torino": 1.0 if active == "torino" else 0.0,
            "palermo": 1.0 if active == "palermo" else 0.0,
            "ip": 1.0 if active == "ip" else 0.0,
        }
        notes["active_source"] = active

    elif g in ("neo", "pha"):
        c_moid = _moid_component(moid_au)
        c_dist = _encounter_dist_component(dist_ld, dist_au)
        c_size = _size_component(diam_km, h_mag)
        c_vrel = _vrel_component(v_kms)

        w_moid, w_dist, w_size, w_vrel = 0.35, 0.35, 0.20, 0.10

        components = {
            "moid": round(c_moid, 4),
            "encounter_dist": round(c_dist, 4),
            "size": round(c_size, 4),
            "vrel": round(c_vrel, 4),
        }
        weights = {
            "moid": w_moid,
            "encounter_dist": w_dist,
            "size": w_size,
            "vrel": w_vrel,
        }
        score_norm = _clamp01(
            w_moid * c_moid + w_dist * c_dist + w_size * c_size + w_vrel * c_vrel
        )

    elif g == "neocp":
        c_unknown = 0.10  # constant: unknown orbit baseline
        c_size_mag = _size_from_mag_component(mag)

        w_unknown, w_size_mag = 0.70, 0.30

        components = {
            "unknown_orbit": round(c_unknown, 4),
            "size_from_mag": round(c_size_mag, 4),
        }
        weights = {
            "unknown_orbit": w_unknown,
            "size_from_mag": w_size_mag,
        }
        score_norm = _clamp01(w_unknown * c_unknown + w_size_mag * c_size_mag)

    else:
        # gcn, grb, transient, other — no orbital hazard
        components = {}
        weights = {}
        score_norm = 0.0

    # PHA floor: always boost to at least 0.95
    if is_pha:
        score_norm = max(score_norm, 0.95)
        notes["is_pha"] = True

    score_norm = round(_clamp01(score_norm), 4)
    score_raw = round(score_norm * 100.0, 2)

    result: Dict[str, Any] = {
        "model": "hazard_v1",
        "components": components,
        "weights": weights,
        "score_norm": score_norm,
        "score_raw": score_raw,
    }
    if notes:
        result["notes"] = notes
    return result


# =========================
# MODEL 3: OBSERVATIONAL URGENCY (urgency_v1)
# =========================

def _event_time_for_urgency(it: Dict[str, Any]) -> Optional[datetime]:
    """
    Most relevant event time for urgency:
      NEO  — t_close_utc_iso or t_utc_iso
      risk — t_utc_iso (impact time if known)
      else — updated_utc or ingested_utc
    """
    g = _group_norm(it)
    meta = _get_meta(it)

    if g == "neo":
        t = (_parse_iso_utc(_as_str(meta.get("t_close_utc_iso"))) or
             _parse_iso_utc(_as_str(meta.get("t_utc_iso"))))
        if t:
            return t

    if g == "risk":
        t = _parse_iso_utc(_as_str(meta.get("t_utc_iso")))
        if t:
            return t

    return (
        _parse_iso_utc(_as_str(it.get("updated_utc")))
        or _parse_iso_utc(_as_str(it.get("ingested_utc")))
    )


def _time_proximity_component(now_dt: datetime, t_event: Optional[datetime]) -> float:
    """
    Spec: delta <= 2h → 1, delta >= 72h → 0.
    Smooth exponential decay: exp(-(delta_hours - 2) / 18).
    """
    if t_event is None:
        return 0.0
    delta_h = abs((t_event - now_dt).total_seconds()) / 3600.0
    if delta_h <= 2.0:
        return 1.0
    if delta_h >= 72.0:
        return 0.0
    return _clamp01(math.exp(-(delta_h - 2.0) / 18.0))


def _brightness_urgency_component(mag: Optional[float]) -> float:
    """Spec: mag <= 12 → 1, mag >= 22 → 0 (linear)."""
    if mag is None:
        return 0.0
    m = float(mag)
    if m <= 12.0:
        return 1.0
    if m >= 22.0:
        return 0.0
    return _clamp01((22.0 - m) / (22.0 - 12.0))


def _action_component(meta: Dict[str, Any]) -> float:
    """meta.action: new/added → 1.0, updated → 0.7, other → 0.4."""
    action = _as_str(meta.get("action")).strip().lower()
    if action in ("new", "added"):
        return 1.0
    if action == "updated":
        return 0.7
    return 0.4


def score_urgency_v1(
    item: Dict[str, Any],
    *,
    now_utc: Optional[str] = None,
    observer: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Observational urgency score [0..1].  Model: urgency_v1.

    Components (weights sum = 1.0):
      time_proximity  0.45 — how soon / recent is the event
      visibility      0.20 — can we point at it (RA/DEC present)
      brightness      0.20 — apparent magnitude
      action          0.10 — new/updated/other
      localization    0.05 — coordinates available

    Output: {model, components, weights, score_norm, score_raw, notes}
    """
    now_iso, now_dt = _now_dt_utc(now_utc)
    meta = _get_meta(item)

    t_event = _event_time_for_urgency(item)
    has_radec = _has_radec(item)
    mag = _as_float(item.get("mag"))

    c_time = _time_proximity_component(now_dt, t_event)
    c_visibility = 1.0 if has_radec else 0.0
    c_brightness = _brightness_urgency_component(mag)
    c_action = _action_component(meta)
    c_localization = 1.0 if has_radec else 0.0

    w_time, w_vis, w_bri, w_action, w_loc = 0.45, 0.20, 0.20, 0.10, 0.05

    score_norm = round(_clamp01(
        w_time * c_time
        + w_vis * c_visibility
        + w_bri * c_brightness
        + w_action * c_action
        + w_loc * c_localization
    ), 4)

    return {
        "model": "urgency_v1",
        "components": {
            "time_proximity": round(c_time, 4),
            "visibility": round(c_visibility, 4),
            "brightness": round(c_brightness, 4),
            "action": round(c_action, 4),
            "localization": round(c_localization, 4),
        },
        "weights": {
            "time_proximity": w_time,
            "visibility": w_vis,
            "brightness": w_bri,
            "action": w_action,
            "localization": w_loc,
        },
        "score_norm": score_norm,
        "score_raw": round(score_norm * 100.0, 2),
        "notes": {
            "now_utc": now_iso,
            "event_time_utc": t_event.isoformat() if t_event else None,
        },
    }


# =========================
# MODEL 1: EXTERNAL SCORING (external_v1)
# =========================

_EXTERNAL_DEFAULT_WEIGHTS: Dict[str, float] = {
    "urgency":       0.25,
    "observability": 0.20,
    "brightness":    0.10,
    "hazard":        0.30,
    "reliability":   0.10,
    "novelty":       0.03,
    "localization":  0.02,
}

_RELIABILITY_BY_GROUP: Dict[str, float] = {
    "risk":      1.0,
    "neo":       0.9,
    "gcn":       0.85,
    "grb":       0.85,
    "neocp":     0.55,
    "transient": 0.65,
}


def _ext_reliability(item: Dict[str, Any]) -> float:
    return _RELIABILITY_BY_GROUP.get(_group_norm(item), 0.5)


def _ext_observability(item: Dict[str, Any]) -> float:
    """Observability from alt_deg or presence of RA/DEC (neutral 0.5)."""
    meta = _get_meta(item)
    alt_min, alt_good = 10.0, 60.0
    alt = _as_float(meta.get("alt_deg"))
    if alt is None:
        return 0.5 if _has_radec(item) else 0.0
    return _clamp01((alt - alt_min) / (alt_good - alt_min))


def _ext_brightness(item: Dict[str, Any]) -> float:
    """Brightness from apparent mag (preferred) or H absolute magnitude."""
    mag = _as_float(item.get("mag"))
    if mag is not None:
        return _clamp01((22.0 - mag) / (22.0 - 14.0))

    meta = _get_meta(item)
    h = (
        _as_float(meta.get("sbdb_h")) or _as_float(meta.get("sb_h"))
        or _as_float(meta.get("h")) or _as_float(meta.get("h_cad"))
    )
    if h is not None:
        return _clamp01((28.0 - h) / (28.0 - 16.0))
    return 0.0


def _ext_urgency_simple(item: Dict[str, Any], now_dt: datetime) -> float:
    """Simple time-proximity urgency (linear decay, group-specific window)."""
    g = _group_norm(item)
    meta = _get_meta(item)

    window_sec = {
        "neo":       7 * 86400.0,
        "risk":      86400.0,
        "neocp":     86400.0,
        "gcn":       86400.0,
        "grb":       86400.0,
        "transient": 86400.0,
    }.get(g, 86400.0)

    t_ref = None
    if g == "neo":
        t_ref = _parse_iso_utc(_as_str(meta.get("t_utc_iso")))
    if t_ref is None:
        t_ref = (
            _parse_iso_utc(_as_str(item.get("updated_utc")))
            or _parse_iso_utc(_as_str(item.get("ingested_utc")))
        )

    if t_ref is None:
        return 0.0
    delta = abs((t_ref - now_dt).total_seconds())
    return _clamp01(1.0 - (delta / window_sec))


def _ext_hazard_simple(item: Dict[str, Any]) -> float:
    """Simple hazard for external model (groups with orbital data only)."""
    g = _group_norm(item)
    if g not in ("neo", "risk", "pha"):
        return 0.0

    meta = _get_meta(item)
    moid = _as_float(meta.get("moid_au") or meta.get("sbdb_moid_au"))
    diam = (
        _as_float(meta.get("diameter_km")) or _as_float(meta.get("diameter_est_km"))
        or _as_float(meta.get("sbdb_diameter_km")) or _as_float(meta.get("sbdb_diameter_est_km"))
    )
    moid_score = 0.0 if moid is None else _clamp01(1.0 - (moid / 0.05))
    diam_score = 0.0 if diam is None else _clamp01(diam / 1.0)

    pha_flag = bool(meta.get("pha") is True) or (g == "pha")
    score = 0.6 * moid_score + 0.4 * diam_score
    if pha_flag:
        score = _clamp01(score + 0.30)
    return _clamp01(score)


def score_external_v1(
    item: Dict[str, Any],
    *,
    observer: Optional[Dict[str, Any]] = None,
    now_utc: Optional[str] = None,
    weights_profile: str = "default",
    hazard_score_norm: Optional[float] = None,
    urgency_score_norm: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Cross-group external scoring model.  Model: external_v1.

    Features: urgency, observability, brightness, hazard, reliability, novelty, localization.
    If hazard_score_norm / urgency_score_norm are provided (from hazard_v1 / urgency_v1),
    they replace the internally computed hazard / urgency features (recommended switch).

    Output: {model, weights_profile, features, weights, score_norm, score_raw}
    """
    now_iso, now_dt = _now_dt_utc(now_utc)
    weights = dict(_EXTERNAL_DEFAULT_WEIGHTS)

    # Feature computation — switch to hazard_v1/urgency_v1 outputs if provided
    f_urgency = (
        float(urgency_score_norm)
        if urgency_score_norm is not None
        else _ext_urgency_simple(item, now_dt)
    )
    f_hazard = (
        float(hazard_score_norm)
        if hazard_score_norm is not None
        else _ext_hazard_simple(item)
    )
    f_observability = _ext_observability(item)
    f_brightness = _ext_brightness(item)
    f_reliability = _ext_reliability(item)
    f_novelty = 0.0   # no persistent state yet
    f_localization = 1.0 if _has_radec(item) else 0.0

    features: Dict[str, float] = {
        "urgency":       round(_clamp01(f_urgency), 4),
        "observability": round(_clamp01(f_observability), 4),
        "brightness":    round(_clamp01(f_brightness), 4),
        "hazard":        round(_clamp01(f_hazard), 4),
        "reliability":   round(_clamp01(f_reliability), 4),
        "novelty":       round(_clamp01(f_novelty), 4),
        "localization":  round(_clamp01(f_localization), 4),
    }

    score = sum(weights.get(k, 0.0) * v for k, v in features.items())
    score_norm = round(_clamp01(score), 4)

    return {
        "model": "external_v1",
        "weights_profile": weights_profile,
        "features": features,
        "weights": {k: float(v) for k, v in weights.items()},
        "score_norm": score_norm,
        "score_raw": round(score_norm * 100.0, 2),
    }


# =========================
# GLOBAL MERGE POLICY (merge_v1)
# =========================

def merge_global_score_v1(
    scoring: Dict[str, Any],
    *,
    pha_floor: float = 0.95,
) -> Dict[str, Any]:
    """
    Merge external, hazard, urgency into a single global score.

    Policy (conservative — avoids destabilising rankings):
      score = external_norm
      if is_pha:          score = max(score, pha_floor)
      if hazard > 0.8:    score = max(score, 0.7*external + 0.3*hazard)
      if urgency > 0.8:   score = max(score, 0.75*score + 0.25*urgency)

    Output: {policy, pha_floor, score_norm, score_raw}
    """
    external_norm = _clamp01(_as_float((scoring.get("external") or {}).get("score_norm")) or 0.0)
    hazard_norm   = _clamp01(_as_float((scoring.get("hazard") or {}).get("score_norm")) or 0.0)
    urgency_norm  = _clamp01(_as_float((scoring.get("urgency") or {}).get("score_norm")) or 0.0)

    is_pha = bool((scoring.get("hazard") or {}).get("notes", {}).get("is_pha", False))

    score = external_norm
    if is_pha:
        score = max(score, pha_floor)
    if hazard_norm > 0.8:
        score = max(score, 0.7 * external_norm + 0.3 * hazard_norm)
    if urgency_norm > 0.8:
        score = max(score, 0.75 * score + 0.25 * urgency_norm)

    score = round(_clamp01(score), 4)
    return {
        "policy": "merge_v1",
        "pha_floor": pha_floor,
        "score_norm": score,
        "score_raw": round(score * 100.0, 2),
    }


# =========================
# PUBLIC API
# =========================

def attach_scoring_models_v1(
    item: Dict[str, Any],
    *,
    now_utc: Optional[str] = None,
    observer: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Returns a copy of item with all 3 scoring models + global in meta.scoring.
    Does not mutate the original; does not alter existing top-level fields.
    """
    it2 = dict(item)
    meta = dict(_get_meta(it2))
    scoring = dict(meta.get("scoring") or {})

    hazard   = score_hazard_v1(it2)
    urgency  = score_urgency_v1(it2, now_utc=now_utc, observer=observer)
    external = score_external_v1(
        it2,
        now_utc=now_utc,
        observer=observer,
        hazard_score_norm=hazard["score_norm"],
        urgency_score_norm=urgency["score_norm"],
    )
    global_s = merge_global_score_v1(
        {"hazard": hazard, "urgency": urgency, "external": external}
    )

    scoring["version"] = "v1"
    scoring["hazard"]  = hazard
    scoring["urgency"] = urgency
    scoring["external"] = external
    scoring["global"]  = global_s

    meta["scoring"] = scoring
    it2["meta"] = meta
    return it2


def get_scores_v1(
    item: Dict[str, Any],
    *,
    now_utc: Optional[str] = None,
    observer: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Compute all scores without mutating item."""
    hazard   = score_hazard_v1(item)
    urgency  = score_urgency_v1(item, now_utc=now_utc, observer=observer)
    external = score_external_v1(
        item,
        now_utc=now_utc,
        observer=observer,
        hazard_score_norm=hazard["score_norm"],
        urgency_score_norm=urgency["score_norm"],
    )
    return {
        "hazard":   hazard,
        "urgency":  urgency,
        "external": external,
        "global":   merge_global_score_v1(
            {"hazard": hazard, "urgency": urgency, "external": external}
        ),
    }
