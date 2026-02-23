# services/sky/pipelines/lib/scoring.py
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple

from pipelines.lib.timeutil import utc_now_iso, iso_utc


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
        return v if (v == v) else None
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
    """
    Единственный источник 'now': строка ISO и datetime UTC.
    Если now_utc не передали — берем utc_now_iso() из timeutil.
    """
    now_iso = now_utc or utc_now_iso()
    dt = _parse_iso_utc(now_iso)
    if dt is None:
        now_iso = utc_now_iso()
        dt = _parse_iso_utc(now_iso) or datetime.now(timezone.utc)
    return now_iso, dt


def _ref_time_dt_utc(it: Dict[str, Any]) -> Optional[datetime]:
    """
    Для "давности" используем updated_utc, иначе ingested_utc.
    """
    return _parse_iso_utc(_as_str(it.get("updated_utc"))) or _parse_iso_utc(_as_str(it.get("ingested_utc")))


def _group_norm(it: Dict[str, Any]) -> str:
    return _as_str(it.get("group") or it.get("type") or "").strip().lower()


def _get_meta(it: Dict[str, Any]) -> Dict[str, Any]:
    m = it.get("meta")
    return m if isinstance(m, dict) else {}


def _has_radec(it: Dict[str, Any]) -> bool:
    return (_as_float(it.get("ra_deg")) is not None) and (_as_float(it.get("dec_deg")) is not None)


# =========================
# MODEL 1: EXTERNAL SCORING
# =========================

def score_external_v1(
    it: Dict[str, Any],
    *,
    now_utc: Optional[str] = None,
    tz_name: str = "Europe/Warsaw",
) -> Dict[str, Any]:
    """
    Cross-group score [0..1] to compare different alert groups.
    Inputs:
      - score_norm (preferred), else score_raw/100
      - recency vs ref_time (updated_utc/ingested_utc): linear decay over 7 days
      - optional brightness bonus from mag
    Output:
      dict {model, score, components, meta}
    """
    now_iso, now_dt = _now_dt_utc(now_utc)
    ref_dt = _ref_time_dt_utc(it)

    # recency
    recency = 0.0
    if ref_dt is not None:
        age_s = max(0.0, (now_dt - ref_dt).total_seconds())
        age_days = age_s / 86400.0
        recency = _clamp01(1.0 - (age_days / 7.0))

    # base
    base = _as_float(it.get("score_norm"))
    if base is None:
        sr = _as_float(it.get("score_raw"))
        base = _clamp01((sr / 100.0) if sr is not None else 0.0)
    base = _clamp01(float(base))

    # brightness bonus
    mag = _as_float(it.get("mag"))
    mag_bonus = 0.0
    if mag is not None:
        # mag ~ brighter => larger bonus; capped to 0.25
        mag_bonus = _clamp01((20.0 - float(mag)) / 20.0) * 0.25

    score = _clamp01(0.70 * base + 0.30 * recency + mag_bonus)

    return {
        "model": "external_v1",
        "score": round(score, 4),
        "components": {
            "base_0_1": round(base, 4),
            "recency_0_1": round(recency, 4),
            "mag_bonus_0_0p25": round(mag_bonus, 4),
        },
        "meta": {
            "now_utc": now_iso,
            "ref_time_utc": iso_utc(ref_dt) if ref_dt else None,
            "tz_name": tz_name,
        },
    }


# =========================
# MODEL 2: ORBITAL HAZARD (RISK)
# =========================

def _moid_score_0_1(moid_au: Optional[float]) -> float:
    """
    MOID smaller => riskier.
    Heuristic mapping:
      moid <= 0.001 au  -> ~1
      moid >= 0.1 au    -> ~0
    """
    if moid_au is None:
        return 0.0
    m = float(moid_au)
    # clamp to [0.001..0.1] then invert
    m = max(0.001, min(0.1, m))
    # log-ish feel without importing heavy transforms:
    # normalize in log-space between 1e-3 and 1e-1
    import math
    a = math.log10(m)          # [-3 .. -1]
    t = (a + 3.0) / 2.0        # [0..1]
    return _clamp01(1.0 - t)


def _dist_ld_score_0_1(dist_ld: Optional[float]) -> float:
    """
    Closer approach (LD) => higher score.
      <= 1 LD -> ~1
      >= 50 LD -> ~0
    """
    if dist_ld is None:
        return 0.0
    d = float(dist_ld)
    if d <= 1.0:
        return 1.0
    if d >= 50.0:
        return 0.0
    return _clamp01(1.0 - (d - 1.0) / 49.0)


def _diam_score_0_1(d_km: Optional[float]) -> float:
    """
    Larger diameter => higher hazard potential.
      >= 1 km -> ~1
      <= 0.05 km -> ~0
    """
    if d_km is None:
        return 0.0
    d = float(d_km)
    if d >= 1.0:
        return 1.0
    if d <= 0.05:
        return 0.0
    return _clamp01((d - 0.05) / (1.0 - 0.05))


def _sentry_risk_score_0_1(ip: Optional[float], ps: Optional[float], ts: Optional[float]) -> float:
    """
    Consistent with gen_risk_alerts.py intent (UX score, not scientific).
    Priority:
      ts dominates (0..10) -> 0..1
      then ps ([-10..0] -> [0..1])
      then ip (log10 1e-10..1e-3 -> 0..1)
    """
    if ts is not None:
        try:
            return _clamp01(float(ts) / 10.0)
        except Exception:
            pass

    if ps is not None:
        try:
            v = float(ps)
            return _clamp01((v + 10.0) / 10.0)
        except Exception:
            pass

    if ip is not None:
        try:
            import math
            v = float(ip)
            if v <= 0.0:
                return 0.0
            lg = math.log10(v)  # negative
            return _clamp01((lg + 10.0) / 7.0)  # lg=-10 =>0, lg=-3=>1
        except Exception:
            pass

    return 0.0


def score_risk_v1(
    it: Dict[str, Any],
    *,
    now_utc: Optional[str] = None,
    tz_name: str = "Europe/Warsaw",
) -> Dict[str, Any]:
    """
    Orbital hazard score [0..1] across PHA / RISK / NEO / NEOCP.
    Heuristic:
      - PHA: hard boost (top priority layer)
      - RISK (Sentry): use ts/ps/ip (already "risk-ish")
      - NEO: use MOID + approach distance + diameter (if available)
      - NEOCP: low confidence -> small baseline only
    """
    now_iso, _ = _now_dt_utc(now_utc)
    g = _group_norm(it)
    meta = _get_meta(it)

    # raw signals
    moid_au = _as_float(meta.get("moid_au") or meta.get("MOID_au") or meta.get("moid"))
    dist_ld = _as_float(meta.get("dist_ld") or meta.get("distance_ld"))
    diam_km = _as_float(meta.get("diameter_est_km") or meta.get("diam_km") or meta.get("diameter_km"))

    ip = _as_float(meta.get("ip"))
    ps = _as_float(meta.get("ps"))
    ts = _as_float(meta.get("ts"))

    # components
    c_pha = 0.0
    c_sentry = 0.0
    c_moid = 0.0
    c_dist = 0.0
    c_diam = 0.0
    c_baseline = 0.0

    # identify pha: either group "pha" or meta flag
    is_pha = (g == "pha") or bool(meta.get("is_pha") or meta.get("pha") is True)

    if is_pha:
        # "PHA" should float to the top even if some fields missing
        c_pha = 1.0

    if g == "risk":
        c_sentry = _sentry_risk_score_0_1(ip=ip, ps=ps, ts=ts)

    if g in ("neo", "pha"):
        c_moid = _moid_score_0_1(moid_au)
        c_dist = _dist_ld_score_0_1(dist_ld)
        c_diam = _diam_score_0_1(diam_km)

    if g == "neocp":
        # candidates: unknown orbit/quality -> keep very conservative
        c_baseline = 0.10

    # weights (tune later)
    # pha override: if c_pha=1, final will be near top but still allow ordering inside pha by moid/dist/diam
    w_pha = 0.55
    w_sentry = 0.70
    w_moid = 0.45
    w_dist = 0.35
    w_diam = 0.20
    w_base = 1.00

    if g == "risk":
        score = _clamp01(w_sentry * c_sentry + (w_pha * c_pha))
    elif g in ("neo", "pha"):
        score = _clamp01(w_pha * c_pha + w_moid * c_moid + w_dist * c_dist + w_diam * c_diam)
    elif g == "neocp":
        score = _clamp01(w_base * c_baseline)
    else:
        score = 0.0

    return {
        "model": "risk_v1",
        "score": round(score, 4),
        "components": {
            "pha_flag_0_1": round(c_pha, 4),
            "sentry_0_1": round(c_sentry, 4),
            "moid_0_1": round(c_moid, 4),
            "dist_ld_0_1": round(c_dist, 4),
            "diam_0_1": round(c_diam, 4),
            "baseline_0_1": round(c_baseline, 4),
        },
        "meta": {
            "now_utc": now_iso,
            "tz_name": tz_name,
            "inputs": {
                "moid_au": moid_au,
                "dist_ld": dist_ld,
                "diameter_est_km": diam_km,
                "ip": ip,
                "ps": ps,
                "ts": ts,
            },
        },
    }


# =========================
# MODEL 3: OBSERVATIONAL URGENCY
# =========================

def _alt_score_0_1(max_alt_deg: Optional[float]) -> float:
    """
    Higher max altitude => easier to observe.
      >= 60° -> 1
      <= 10° -> 0
    """
    if max_alt_deg is None:
        return 0.0
    a = float(max_alt_deg)
    if a >= 60.0:
        return 1.0
    if a <= 10.0:
        return 0.0
    return _clamp01((a - 10.0) / 50.0)


def _mag_score_0_1(mag: Optional[float]) -> float:
    """
    Brighter (smaller mag) => higher.
      <= 10 -> 1
      >= 20 -> 0
    """
    if mag is None:
        return 0.0
    m = float(mag)
    if m <= 10.0:
        return 1.0
    if m >= 20.0:
        return 0.0
    return _clamp01((20.0 - m) / 10.0)


def _time_to_event_score_0_1(now_dt: datetime, t_event: Optional[datetime]) -> float:
    """
    Closer event time => higher urgency (within ~48h).
      <= 6h  -> 1
      >= 48h -> 0
    """
    if t_event is None:
        return 0.0
    dt_h = max(0.0, (t_event - now_dt).total_seconds() / 3600.0)
    if dt_h <= 6.0:
        return 1.0
    if dt_h >= 48.0:
        return 0.0
    return _clamp01(1.0 - (dt_h - 6.0) / 42.0)


def score_urgency_v1(
    it: Dict[str, Any],
    *,
    now_utc: Optional[str] = None,
    tz_name: str = "Europe/Warsaw",
) -> Dict[str, Any]:
    """
    Observational urgency score [0..1].
    Uses:
      - max_alt_deg (if already computed and stored in meta/vis)
      - mag
      - proximity to key time (culmination / updated_utc / t_utc_iso)
    """
    now_iso, now_dt = _now_dt_utc(now_utc)
    meta = _get_meta(it)

    # 1) altitude: allow multiple field names (we'll standardize later)
    max_alt = _as_float(
        meta.get("max_alt_deg")
        or meta.get("max_alt_deg_quality")
        or meta.get("alt_max_deg")
        or meta.get("max_alt")
    )

    # 2) magnitude
    mag = _as_float(it.get("mag"))

    # 3) event time: prefer culmination if exists, else meta.t_utc_iso, else updated_utc
    t_culm = _parse_iso_utc(_as_str(meta.get("culmination_time_utc") or meta.get("culmination_utc")))
    t_meta = _parse_iso_utc(_as_str(meta.get("t_utc_iso")))
    t_upd = _parse_iso_utc(_as_str(it.get("updated_utc")))
    t_event = t_culm or t_meta or t_upd

    c_alt = _alt_score_0_1(max_alt)
    c_mag = _mag_score_0_1(mag)
    c_time = _time_to_event_score_0_1(now_dt, t_event)

    # visibility gating: if object has radec and we have max_alt computed near 0, urgency should not dominate
    # (but keep score != 0 for catalog completeness).
    gate = 1.0
    if _has_radec(it) and max_alt is not None and max_alt <= 0.5:
        gate = 0.25

    # weights (tune)
    score = _clamp01(gate * (0.45 * c_alt + 0.35 * c_mag + 0.20 * c_time))

    return {
        "model": "urgency_v1",
        "score": round(score, 4),
        "components": {
            "alt_0_1": round(c_alt, 4),
            "mag_0_1": round(c_mag, 4),
            "time_0_1": round(c_time, 4),
            "gate_0_1": round(gate, 4),
        },
        "meta": {
            "now_utc": now_iso,
            "event_time_utc": iso_utc(t_event) if t_event else None,
            "tz_name": tz_name,
            "inputs": {"max_alt_deg": max_alt, "mag": mag},
        },
    }


# =========================
# PUBLIC API: ATTACH / APPLY
# =========================

def attach_scoring_models_v1(
    it: Dict[str, Any],
    *,
    now_utc: Optional[str] = None,
    tz_name: str = "Europe/Warsaw",
) -> Dict[str, Any]:
    """
    Возвращает КОПИЮ item с дописанными моделями скоринга в meta.scoring.
    Ничего не ломает контракт: не трогаем существующие top-level поля.
    """
    it2 = dict(it)
    meta = dict(_get_meta(it2))
    scoring = meta.get("scoring")
    scoring = dict(scoring) if isinstance(scoring, dict) else {}

    scoring["external"] = score_external_v1(it2, now_utc=now_utc, tz_name=tz_name)
    scoring["risk"] = score_risk_v1(it2, now_utc=now_utc, tz_name=tz_name)
    scoring["urgency"] = score_urgency_v1(it2, now_utc=now_utc, tz_name=tz_name)

    meta["scoring"] = scoring
    it2["meta"] = meta
    return it2


def get_scores_v1(
    it: Dict[str, Any],
    *,
    now_utc: Optional[str] = None,
    tz_name: str = "Europe/Warsaw",
) -> Dict[str, Any]:
    """
    Если нужно только посчитать (без мутаций item).
    """
    return {
        "external": score_external_v1(it, now_utc=now_utc, tz_name=tz_name),
        "risk": score_risk_v1(it, now_utc=now_utc, tz_name=tz_name),
        "urgency": score_urgency_v1(it, now_utc=now_utc, tz_name=tz_name),
    }