#!/usr/bin/env python3
# services/sky/pipelines/gen_risk_alerts.py
#
# JPL Sentry -> alerts_risk.json
# Additive-only dataset (does not touch legacy generators).
#
# Outputs:
#   services/sky/data/generated/alerts_risk.json
#   sites/staging/sky/data/alerts_risk.json

from __future__ import annotations

from dataclasses import asdict
from typing import Any, Dict, List, Optional, Tuple

from pipelines.lib.jsonio import dump_json
from pipelines.lib.paths import SERVICES_DATA_DIR, STAGING_DATA_DIR
from pipelines.lib.sentry import (
    fetch_sentry_object,
    fetch_sentry_summary,
    parse_summary_rows,
    parse_utc_iso,
    utc_now_iso,
)


OUT_FILENAME = "alerts_risk.json"

# Default knobs (tune later via sources.yml if needed)
LIMIT = 50
IP_MIN: Optional[float] = 1e-8
PS_MIN: Optional[float] = None
H_MAX: Optional[float] = 26.0
DAYS: Optional[int] = None


def _clamp01(x: float) -> float:
    return 0.0 if x < 0.0 else (1.0 if x > 1.0 else x)


def _risk_score_0_1(
    *,
    ip: Optional[float],
    ps: Optional[float],
    ts: Optional[float],
) -> float:
    """
    Simple UX score for ranking/layering (NOT a scientific scale).
    Intuition:
      - Torino (ts) strongest if present: 0..10
      - Palermo (ps) ~ log-scale: higher (less negative) => riskier
      - IP fallback: log10(ip) mapping
    Output [0..1].
    """
    # Torino dominates if present and reasonable
    if ts is not None:
        try:
            return round(_clamp01(float(ts) / 10.0), 4)
        except Exception:
            pass

    # Palermo: typical range ~ [-12..+2], map [-10..0] -> [0..1]
    if ps is not None:
        try:
            v = float(ps)
            return round(_clamp01((v + 10.0) / 10.0), 4)
        except Exception:
            pass

    # IP: map 1e-10..1e-3 roughly into 0..1
    if ip is not None:
        try:
            import math
            v = float(ip)
            if v <= 0:
                return 0.0
            lg = math.log10(v)  # negative
            # lg=-10 => 0, lg=-3 => 1
            return round(_clamp01((lg + 10.0) / 7.0), 4)
        except Exception:
            pass

    return 0.0


def _pick_primary_vi_time(obj_json: Dict[str, Any]) -> Tuple[Optional[str], Optional[Dict[str, Any]]]:
    """
    From object details, try to pick the "most relevant" VI time.
    We choose the VI with max IP if possible.
    Return (t_utc_iso, vi_raw_dict).
    """
    vi = obj_json.get("vi")
    if not isinstance(vi, list) or not vi:
        return None, None

    best = None
    best_ip = -1.0

    for r in vi:
        if not isinstance(r, dict):
            continue
        ip = r.get("ip")
        try:
            ipf = float(ip)
        except Exception:
            ipf = -1.0
        if ipf > best_ip:
            best_ip = ipf
            best = r

    if not isinstance(best, dict):
        return None, None

    # Sentry typically has date/time fields; keep defensive:
    # Common keys seen: "date", "impact_date", "cd", etc. (depends on API version)
    for k in ("cd", "date", "impact_date", "t", "time"):
        t = best.get(k)
        t_iso = parse_utc_iso(t)
        if t_iso:
            return t_iso, best

    return None, best


def main() -> None:
    ingested_utc = utc_now_iso()

    sentry_sum = fetch_sentry_summary(
        ip_min=IP_MIN,
        ps_min=PS_MIN,
        h_max=H_MAX,
        days=DAYS,
        limit=LIMIT,
        timeout=25,
        retries=3,
    )

    rows = parse_summary_rows(sentry_sum)
    total = len(rows)

    items: List[Dict[str, Any]] = []

    for i, r in enumerate(rows, start=1):
        des = r.des
        print(f"[prog] {i}/{total} des={des}", flush=True)

        obj = None
        obj_err = None
        try:
            obj = fetch_sentry_object(des=des, timeout=25, retries=3)
        except Exception as e:
            obj_err = f"{type(e).__name__}: {e}"
            obj = None

        t_primary_iso = None
        vi_best = None
        if isinstance(obj, dict):
            t_primary_iso, vi_best = _pick_primary_vi_time(obj)

        # Risk metrics (prefer object-level if present, fallback to summary row)
        # Keep everything raw in meta anyway.
        ip = None
        ps = None
        ts = None

        if isinstance(obj, dict):
            for k in ("ip", "IP", "impact_probability"):
                if k in obj:
                    try:
                        ip = float(obj.get(k))
                    except Exception:
                        pass
                    break
            for k in ("ps", "PS", "palermo_scale"):
                if k in obj:
                    try:
                        ps = float(obj.get(k))
                    except Exception:
                        pass
                    break
            for k in ("ts", "TS", "torino_scale"):
                if k in obj:
                    try:
                        ts = float(obj.get(k))
                    except Exception:
                        pass
                    break

        # fallback from summary
        ip = ip if ip is not None else r.ip
        ps = ps if ps is not None else r.ps
        ts = ts if ts is not None else r.ts

        risk = _risk_score_0_1(ip=ip, ps=ps, ts=ts)

        # Score fields for frontend sorting
        score_norm = risk
        score_raw = round(risk * 100.0, 2)

        # “updated_utc” legacy name: for risk layer we use primary VI time if we have it,
        # else ingested time. Add neutral semantic fields in meta.
        updated_utc = t_primary_iso or ingested_utc
        time_kind = "impact" if t_primary_iso else "ingested"

        item: Dict[str, Any] = {
            "id": des,
            "source": "jpl-sentry",
            "group": "risk",
            "type": "risk",
            "title": f"Sentry risk object: {des}",
            "note": "Sentry impact monitoring (risk layer)",
            "score_raw": score_raw,
            "score_norm": score_norm,
            "ra_deg": None,
            "dec_deg": None,
            "mag": None,
            "updated_utc": updated_utc,
            "ingested_utc": ingested_utc,
            "meta": {
                # fixed UTC normalization for new data
                "t_utc_iso": t_primary_iso,
                "risk_time_kind": time_kind,

                # main risk metrics
                "ip": ip,
                "ps": ps,
                "ts": ts,
                "risk_score": risk,

                # summary row data
                "sb_h": r.h,
                "last_obs_jd": r.last_obs_jd,
                "name": r.name,

                # object detail capture
                "vi_best": vi_best,
                "sentry_object_ok": bool(obj),
                "sentry_object_error": obj_err,

                # keep raw source payloads (max data, decide later)
                "sentry_summary": r.raw,
                "sentry_object_raw": obj if isinstance(obj, dict) else None,
            },
        }
        items.append(item)

    out = {
        "generated_utc": utc_now_iso(),
        "source": "JPL SSD Sentry API (summary + object details)",
        "counts": {"items": len(items), "limit": LIMIT},
        "items": items,
    }

    dump_json(SERVICES_DATA_DIR / OUT_FILENAME, out)
    dump_json(STAGING_DATA_DIR / OUT_FILENAME, out)

    print(f"[sky] risk alerts generated: {len(items)} items", flush=True)


if __name__ == "__main__":
    main()