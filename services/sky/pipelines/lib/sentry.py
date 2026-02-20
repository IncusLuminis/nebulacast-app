#!/usr/bin/env python3
# services/sky/pipelines/lib/sentry.py

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, date, timezone
from typing import Any, Dict, Iterable, List, Optional, Tuple, Union
from urllib.parse import urlencode

from pipelines.lib.http import fetch_json

SENTRY_BASE_URL = "https://ssd-api.jpl.nasa.gov/sentry.api"


# -------------------------
# Time helpers (UTC)
# -------------------------

def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def parse_utc_iso(s: str | None) -> Optional[str]:
    """
    Parses common UTC-ish formats seen in JPL payloads:
      - ISO: "2026-02-19T01:23:45Z" / "+00:00"
      - "YYYY-MM-DD HH:MM:SS"
      - "YYYY-MM-DD"
    Returns ISO string in UTC format or None.
    """
    if not s:
        return None
    s = str(s).strip()
    if not s:
        return None

    dt = None
    try:
        if s.endswith("Z"):
            s2 = s[:-1] + "+00:00"
            dt = datetime.fromisoformat(s2)
        elif "T" in s:
            dt = datetime.fromisoformat(s)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
        else:
            # Try date formats
            for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
                try:
                    if fmt == "%Y-%m-%d":
                        d = datetime.strptime(s, fmt).date()
                        dt = datetime(d.year, d.month, d.day, tzinfo=timezone.utc)
                    else:
                        dt = datetime.strptime(s, fmt).replace(tzinfo=timezone.utc)
                    break
                except Exception:
                    continue
    except Exception:
        return None

    if dt:
        return dt.astimezone(timezone.utc).isoformat()
    return None


# -------------------------
# Data models
# -------------------------

@dataclass(frozen=True)
class SentrySummaryRow:
    des: str
    fullname: Optional[str]

    # unified fields expected by gen_risk_alerts.py
    ip: Optional[float]
    ps: Optional[float]
    ts: Optional[float]

    # extended raw fields (keep for later logic)
    ps_max: Optional[float]
    ps_cum: Optional[float]
    ts_max: Optional[float]

    h: Optional[float]
    diameter_km: Optional[float]
    first_obs: Optional[str]
    last_obs: Optional[str]
    last_obs_jd: Optional[float]  # Added missing field
    n_imp: Optional[int]
    name: Optional[str]  # Added missing field

    raw: Any


def _as_float(x: Any) -> Optional[float]:
    try:
        if x is None:
            return None
        v = float(x)
        return v if (v == v) else None
    except Exception:
        return None


def _as_int(x: Any) -> Optional[int]:
    try:
        if x is None:
            return None
        return int(float(x))
    except Exception:
        return None


# -------------------------
# URL builders
# -------------------------

def _build_url(params: Dict[str, Any]) -> str:
    # NOTE: sentry.api uses hyphenated parameter names (ip-min, ps-min, h-max).
    # urlencode will encode spaces properly for des values.
    qs = urlencode({k: v for k, v in params.items() if v is not None})
    return f"{SENTRY_BASE_URL}?{qs}" if qs else SENTRY_BASE_URL


# -------------------------
# Fetchers
# -------------------------

def fetch_sentry_summary(
    *,
    ip_min: Optional[float] = None,
    ps_min: Optional[int] = None,
    h_max: Optional[float] = None,
    days: Optional[int] = None,
    limit: Optional[int] = None,
    timeout: int = 25,
    retries: int = 3,
) -> Dict[str, Any]:
    """
    Mode S (summary) by default (no selector params).
    Sentry API does NOT support a "limit" query parameter; we accept it here for
    caller convenience and slice after parsing.
    """
    params: Dict[str, Any] = {}
    if ip_min is not None:
        params["ip-min"] = ip_min
    if ps_min is not None:
        params["ps-min"] = ps_min
    if h_max is not None:
        params["h-max"] = h_max
    if days is not None:
        params["days"] = days

    url = _build_url(params)
    payload = fetch_json(url, timeout=timeout, retries=retries)

    # If caller wants a client-side limit, apply it in a conservative way:
    # keep original payload, but if it's a fields+data structure, slice "data".
    if limit is not None:
        try:
            lim = int(limit)
            if lim > 0 and isinstance(payload, dict) and isinstance(payload.get("data"), list):
                # do not mutate original dict deeply in unexpected ways:
                payload = dict(payload)
                payload["data"] = payload["data"][:lim]
        except Exception:
            pass

    return payload


def fetch_sentry_object(
    *,
    des: Optional[str] = None,
    spk: Optional[int] = None,
    timeout: int = 25,
    retries: int = 3,
) -> Dict[str, Any]:
    """
    Mode O (object details). Exactly one of (des, spk) must be provided.
    """
    if (des is None and spk is None) or (des is not None and spk is not None):
        raise ValueError("fetch_sentry_object: provide exactly one of des= or spk=")

    params: Dict[str, Any] = {}
    if des is not None:
        params["des"] = des
    if spk is not None:
        params["spk"] = int(spk)

    url = _build_url(params)
    return fetch_json(url, timeout=timeout, retries=retries)


# -------------------------
# Parsers
# -------------------------

def parse_summary_rows(summary_json: Dict[str, Any]) -> List[SentrySummaryRow]:
    if not isinstance(summary_json, dict):
        return []

    data = summary_json.get("data")
    if not isinstance(data, list):
        return []

    out: List[SentrySummaryRow] = []

    for row in data:
        if not isinstance(row, dict):
            continue

        des = row.get("des")
        if not des:
            continue

        ip = _as_float(row.get("ip"))
        ps_max = _as_float(row.get("ps_max"))
        ps_cum = _as_float(row.get("ps_cum"))
        ts_max = _as_float(row.get("ts_max"))

        # unify to fields expected by generator
        ps = ps_max if ps_max is not None else ps_cum
        ts = ts_max

        out.append(
            SentrySummaryRow(
                des=str(des),
                fullname=(str(row.get("fullname")) if row.get("fullname") else None),

                ip=ip,
                ps=ps,
                ts=ts,

                ps_max=ps_max,
                ps_cum=ps_cum,
                ts_max=ts_max,

                h=_as_float(row.get("h")),
                diameter_km=_as_float(row.get("diameter")),
                first_obs=(str(row.get("first_obs")) if row.get("first_obs") else None),
                last_obs=(str(row.get("last_obs")) if row.get("last_obs") else None),
                last_obs_jd=_as_float(row.get("last_obs_jd")),  # Added
                n_imp=_as_int(row.get("n_imp")),
                name=(str(row.get("name")) if row.get("name") else None),  # Added

                raw=row,
            )
        )

    return out