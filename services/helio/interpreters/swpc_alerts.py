#!/usr/bin/env python3
"""
SWPC Alert Interpreter for the helio domain.

Classifies raw SWPC alert records (RawSwpcAlertRecord dicts from the normalizer)
into normalized HelioEvent dicts.

Responsibilities:
  - event kind classification (10 kinds, strict priority order)
  - severity extraction (G/R/S domain scales + verbal keywords)
  - level mapping (info / watch / warning)
  - human-readable title + summary_short generation (wording catalog)
  - dedupe_key computation (6h time buckets)
  - relevance scoring with freshness decay
  - deduplication (keep newest/richest per dedupe_key)
  - alerts_preview selection (top-N with soft domain diversity)

Public API:
  interpret(raw_alerts, now_utc?, preview_n?, retention_hours?) ->
      {"alerts_all": list[HelioEvent], "alerts_preview": list[HelioEvent]}

  derive_scales(events) ->
      {"g_scale": "G0"–"G5", "r_scale": "R0"–"R5", "s_scale": "S0"–"S5"}
"""
from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple


# ── Base relevance weights (spec §11) ─────────────────────────────────────────

_BASE_RELEVANCE: Dict[str, float] = {
    "geomagnetic_storm":  1.00,
    "cme_arrival":        0.95,
    "radio_blackout":     0.90,
    "radiation_storm":    0.88,
    "geomagnetic_watch":  0.82,
    "cme_watch":          0.78,
    "aurora_watch":       0.74,
    "solar_flare":        0.68,
    "space_weather_info": 0.30,
    "unknown":            0.20,
}

_SEVERITY_LABELS: Dict[int, str] = {
    1: "minor", 2: "moderate", 3: "strong", 4: "severe", 5: "extreme",
}

# ── Compiled regex patterns ───────────────────────────────────────────────────

_RE_G = re.compile(r'\bG([1-5])\b', re.IGNORECASE)
_RE_R = re.compile(r'\bR([1-5])\b', re.IGNORECASE)
_RE_S = re.compile(r'\bS([1-5])\b', re.IGNORECASE)
_RE_FLARE = re.compile(r'\b([MX])(\d+\.?\d*)\b', re.IGNORECASE)

# Message code prefix patterns (fast path for well-known SWPC codes)
_RE_CODE_G_STORM   = re.compile(r'^G[1-5](WRN|ALT)', re.IGNORECASE)
_RE_CODE_G_WATCH   = re.compile(r'^G[1-5]WCH', re.IGNORECASE)
_RE_CODE_R_STORM   = re.compile(r'^R[1-5](WRN|ALT)', re.IGNORECASE)
_RE_CODE_R_WATCH   = re.compile(r'^R[1-5]WCH', re.IGNORECASE)
_RE_CODE_S_STORM   = re.compile(r'^(RPC|S[1-5])(WRN|ALT)', re.IGNORECASE)
_RE_CODE_S_WATCH   = re.compile(r'^(RPC|S[1-5])WCH', re.IGNORECASE)
_RE_CODE_KWAR      = re.compile(r'^WAR(K\d+)', re.IGNORECASE)  # K-index warning
_RE_CODE_KALT      = re.compile(r'^ALT(K\d+)', re.IGNORECASE)  # K-index alert (informational)

_WATCH_WORDS = frozenset({
    "watch", "expected", "possible", "likely", "may arrive",
    "anticipated", "forecast", "potential",
})
_WARNING_WORDS = frozenset({
    "warning", "in progress", "ongoing", "observed",
    "detected", "has reached", "confirmed", "active",
    "occurring",
})


def _combined_text(record: Dict[str, Any]) -> str:
    """Concatenate all searchable fields from a raw alert record (lowercase)."""
    return " ".join(filter(None, [
        record.get("message_code") or "",
        record.get("message_type") or "",
        record.get("title")        or "",
        record.get("body")         or "",
    ])).lower()


def _has_watch_language(t: str) -> bool:
    return any(w in t for w in _WATCH_WORDS)


def _has_warning_language(t: str) -> bool:
    return any(w in t for w in _WARNING_WORDS)


def _max_scale(t: str, pattern: re.Pattern) -> Optional[int]:
    """Return maximum numeric scale value (1–5) found by pattern, or None."""
    vals = [int(m.group(1)) for m in pattern.finditer(t)]
    return max(vals) if vals else None


# ── Classification ────────────────────────────────────────────────────────────

def _classify(record: Dict[str, Any]) -> Tuple[str, str]:
    """
    Return (kind, domain) for a raw alert record.

    Priority order (spec §4):
      1. geomagnetic_storm   4. cme_arrival      7. aurora_watch
      2. radio_blackout      5. geomagnetic_watch 8. solar_flare
      3. radiation_storm     6. cme_watch         9. space_weather_info
                                                  10. unknown (fallback)

    Message codes take precedence over text analysis when unambiguous.
    """
    t = _combined_text(record)
    code = (record.get("message_code") or "").upper()

    # ── Fast path: unambiguous message codes ─────────────────────────────────
    if _RE_CODE_G_STORM.match(code):
        return "geomagnetic_storm", "G"
    if _RE_CODE_G_WATCH.match(code):
        return "geomagnetic_watch", "G"
    if _RE_CODE_R_STORM.match(code):
        return "radio_blackout", "R"
    if _RE_CODE_R_WATCH.match(code):
        return "radio_blackout", "R"
    if _RE_CODE_S_STORM.match(code):
        return "radiation_storm", "S"
    if _RE_CODE_S_WATCH.match(code):
        return "radiation_storm", "S"
    if _RE_CODE_KWAR.match(code):
        # WARK05 = K-index warning ≥ 5 → confirmed elevated activity
        return "geomagnetic_storm", "G"

    # ── Text analysis ─────────────────────────────────────────────────────────

    # 1. Geomagnetic storm / watch
    has_g_scale    = bool(_RE_G.search(t))
    has_storm_text = "geomagnetic storm" in t
    has_watch_text = (
        "geomagnetic watch" in t
        or "geomagnetic activity expected" in t
        or ("watch" in t and ("geomagnetic" in t or has_g_scale))
    )

    if has_g_scale or has_storm_text or has_watch_text:
        # Explicit watch language → watch
        if has_watch_text:
            return "geomagnetic_watch", "G"
        # G-scale in a watch/expected context without confirmed storm text → watch
        if has_g_scale and _has_watch_language(t) and not has_storm_text:
            return "geomagnetic_watch", "G"
        # Everything else with G-scale or storm text → storm
        return "geomagnetic_storm", "G"

    # 2. Radio blackout
    if (_RE_R.search(t) or "radio blackout" in t or "hf radio" in t
            or "sunlit side" in t or ("x-ray event" in t and "radio" in t)):
        return "radio_blackout", "R"

    # 3. Radiation storm
    if (_RE_S.search(t) or "radiation storm" in t
            or "solar radiation storm" in t or "proton event" in t
            or "energetic particle" in t):
        return "radiation_storm", "S"

    # Type II Radio Emission = indirect CME indicator → watch, not confirmed arrival
    if "type ii" in t:
        return "cme_watch", "cme"

    # 4. CME arrival (confirmed)
    if ("cme arrival" in t or "shock arrival" in t
            or "interplanetary shock" in t or "cme impact" in t
            or ("coronal mass ejection" in t and not _has_watch_language(t))):
        return "cme_arrival", "cme"

    # 5. Geomagnetic watch (catch-all — K-index context with watch language)
    if ("k-index" in t or "kp index" in t) and _has_watch_language(t):
        return "geomagnetic_watch", "G"

    # 6. CME watch
    if (("cme" in t or "coronal mass ejection" in t)
            and (_has_watch_language(t) or "cme expected" in t
                 or "cme may arrive" in t or "shock likely" in t)):
        return "cme_watch", "cme"

    # 7. Aurora watch
    if "aurora" in t or "auroral" in t:
        return "aurora_watch", "aurora"

    # 8. Solar flare
    if (_RE_FLARE.search(t) or "solar flare" in t
            or "x-class flare" in t or "m-class flare" in t
            or "x-class" in t or "m-class" in t):
        return "solar_flare", "flare"

    # 9. Generic space-weather info
    if "space weather" in t or record.get("message_code"):
        return "space_weather_info", "info"

    # 10. Unknown fallback
    return "unknown", "unknown"


# ── Severity extraction ───────────────────────────────────────────────────────

_VERBAL: List[Tuple[str, int]] = [
    # checked longest-match first to avoid "moderate" matching inside "extreme"
    ("extreme",  5),
    ("severe",   4),
    ("strong",   3),
    ("moderate", 2),
    ("minor",    1),
]


def _extract_severity(
    record: Dict[str, Any], kind: str, domain: str,
) -> Tuple[Optional[int], Optional[str]]:
    """
    Return (severity_int, severity_label).
    Flare events return (None, "M"|"X"); G/R/S events return (1–5, label).
    """
    t = _combined_text(record)

    if domain == "G":
        val = _max_scale(t, _RE_G)
        if val:
            return val, _SEVERITY_LABELS[val]
        # Verbal severity only when domain is G
        for word, num in _VERBAL:
            if word in t:
                return num, _SEVERITY_LABELS[num]

    elif domain == "R":
        val = _max_scale(t, _RE_R)
        if val:
            return val, _SEVERITY_LABELS[val]
        for word, num in _VERBAL:
            if word in t:
                return num, _SEVERITY_LABELS[num]

    elif domain == "S":
        val = _max_scale(t, _RE_S)
        if val:
            return val, _SEVERITY_LABELS[val]
        for word, num in _VERBAL:
            if word in t:
                return num, _SEVERITY_LABELS[num]

    elif domain == "flare":
        m = _RE_FLARE.search(t)
        if m:
            return None, m.group(1).upper()

    return None, None


# ── Level derivation ──────────────────────────────────────────────────────────

def _derive_level(record: Dict[str, Any], kind: str) -> str:
    """
    Derive operational level: "warning" | "watch" | "info".

    Message-code suffix → text analysis → kind default.
    """
    t    = _combined_text(record)
    code = (record.get("message_code") or "").upper()

    # Message code suffix fast path
    if "WRN" in code:
        return "warning"
    if "WCH" in code:
        return "watch"
    if _RE_CODE_KWAR.match(code):
        return "warning"
    if _RE_CODE_KALT.match(code):
        # K-index alert (ALTKxx) = informational observation, not an active warning
        return "watch"
    if "ALT" in code:
        return "warning"

    # Text analysis
    if _has_warning_language(t):
        return "warning"
    if _has_watch_language(t):
        return "watch"

    # Kind-based defaults
    if kind in ("geomagnetic_storm", "radio_blackout", "radiation_storm", "cme_arrival"):
        return "warning"
    if kind in ("geomagnetic_watch", "cme_watch", "aurora_watch"):
        return "watch"

    return "info"


# ── Title generation (wording catalog §16) ───────────────────────────────────

_TITLES_G: Dict[Optional[int], str] = {
    1: "Minor geomagnetic storm",
    2: "Moderate geomagnetic storm",
    3: "Strong geomagnetic storm",
    4: "Severe geomagnetic storm",
    5: "Extreme geomagnetic storm",
}
_TITLES_R: Dict[Optional[int], str] = {
    1: "Minor radio blackout warning",
    2: "Moderate radio blackout warning",
    3: "Strong radio blackout",
    4: "Severe radio blackout",
    5: "Extreme radio blackout",
}
_TITLES_S: Dict[Optional[int], str] = {
    1: "Minor radiation storm",
    2: "Moderate radiation storm",
    3: "Strong radiation storm",
    4: "Severe radiation storm",
    5: "Extreme radiation storm",
}


def _build_title(
    kind: str,
    severity: Optional[int],
    severity_label: Optional[str],
) -> str:
    if kind == "geomagnetic_storm":
        return _TITLES_G.get(severity, "Geomagnetic storm")
    if kind == "geomagnetic_watch":
        return "Geomagnetic storm watch" if severity else "Elevated geomagnetic activity possible"
    if kind == "radio_blackout":
        return _TITLES_R.get(severity, "Radio blackout warning")
    if kind == "radiation_storm":
        return _TITLES_S.get(severity, "Solar radiation storm")
    if kind == "cme_arrival":
        return "CME arrival detected"
    if kind == "cme_watch":
        return "CME arrival possible"
    if kind == "aurora_watch":
        return "Aurora watch"
    if kind == "solar_flare":
        if severity_label in ("M", "X"):
            return f"{severity_label}-class solar flare"
        return "Solar flare detected"
    if kind == "space_weather_info":
        return "Space weather update"
    return "Unclassified space weather message"


# ── Summary generation (wording catalog §17) ─────────────────────────────────

_SUMMARIES: Dict[str, str] = {
    "geomagnetic_storm":  "Elevated geomagnetic activity may improve aurora chances at high latitudes.",
    "geomagnetic_watch":  "Geomagnetic conditions may intensify in the next forecast window.",
    "radio_blackout":     "Brief HF radio degradation possible on the sunlit side of Earth.",
    "radiation_storm":    "Energetic particle activity is elevated.",
    "cme_arrival":        "A coronal mass ejection has reached near-Earth space.",
    "cme_watch":          "Solar ejecta may reach Earth in the forecast window.",
    "aurora_watch":       "Aurora visibility may improve at high latitudes.",
    "solar_flare":        "Solar flare activity is elevated.",
    "space_weather_info": "General space weather information update.",
    "unknown":            "Message could not be classified reliably.",
}


def _build_summary(kind: str, severity: Optional[int]) -> str:
    if kind == "geomagnetic_storm" and severity and severity >= 3:
        return "Geomagnetic conditions are strongly disturbed."
    return _SUMMARIES.get(kind, _SUMMARIES["unknown"])


# ── Dedupe key ────────────────────────────────────────────────────────────────

def _time_bucket_6h(ts: Optional[str]) -> str:
    """Truncate UTC ISO string to nearest 6-hour boundary."""
    if not ts:
        return "unknown"
    try:
        dt = datetime.strptime(ts, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
        bucket_hour = (dt.hour // 6) * 6
        return dt.strftime(f"%Y-%m-%dT{bucket_hour:02d}")
    except ValueError:
        return ts[:13]


def _make_dedupe_key(
    kind: str, domain: str, severity: Optional[int], level: str, ts: Optional[str],
) -> str:
    sev = str(severity) if severity is not None else "na"
    return f"{kind}|{domain}|{sev}|{level}|{_time_bucket_6h(ts)}"


# ── Relevance scoring (spec §11) ──────────────────────────────────────────────

def _compute_relevance(
    kind: str,
    severity: Optional[int],
    level: str,
    ts: Optional[str],
    now_ms: float,
) -> float:
    base        = _BASE_RELEVANCE.get(kind, 0.20)
    sev_boost   = (severity * 0.08) if severity is not None else 0.0
    level_boost = 0.10 if level == "warning" else (0.04 if level == "watch" else 0.0)

    age_hours = 0.0
    if ts:
        try:
            event_ms = (
                datetime.strptime(ts, "%Y-%m-%dT%H:%M:%SZ")
                .replace(tzinfo=timezone.utc)
                .timestamp() * 1000
            )
            age_hours = max(0.0, (now_ms - event_ms) / 3_600_000)
        except ValueError:
            pass

    freshness = max(0.15, 1.0 - age_hours / 72.0)
    return round((base + sev_boost + level_boost) * freshness, 4)


# ── Deduplication ─────────────────────────────────────────────────────────────

def _deduplicate(events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Keep one event per dedupe_key.
    Prefers the newest record; on tie, prefers the richer body.
    """
    seen: Dict[str, Dict[str, Any]] = {}
    for ev in events:
        key = ev["dedupe_key"]
        if key not in seen:
            seen[key] = ev
            continue
        existing_ts = seen[key]["t_utc"] or ""
        new_ts      = ev["t_utc"]        or ""
        if new_ts > existing_ts:
            seen[key] = ev
        elif new_ts == existing_ts:
            if len(ev.get("raw_body") or "") > len(seen[key].get("raw_body") or ""):
                seen[key] = ev
    return list(seen.values())


# ── Preview selection (spec §12) ─────────────────────────────────────────────

def _ts_epoch(ts: Optional[str]) -> float:
    if not ts:
        return 0.0
    try:
        return datetime.strptime(ts, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc).timestamp()
    except ValueError:
        return 0.0


def _select_preview(events: List[Dict[str, Any]], n: int) -> List[Dict[str, Any]]:
    """
    Select top-N events by relevance desc, then time desc.
    Soft domain diversity: avoid filling preview with a single kind when
    significant events from other domains are available.
    """
    if not events:
        return []

    ranked = sorted(events, key=lambda e: (-e["relevance"], -_ts_epoch(e["t_utc"])))

    if len(ranked) <= n:
        return ranked

    preview:     List[Dict[str, Any]] = []
    kind_counts: Dict[str, int]       = {}
    deferred:    List[Dict[str, Any]] = []

    for ev in ranked:
        if len(preview) >= n:
            break
        kind = ev["kind"]
        count = kind_counts.get(kind, 0)
        # Allow max 2 of the same kind before trying diversity
        if count >= 2 and len(kind_counts) < 2:
            deferred.append(ev)
        else:
            preview.append(ev)
            kind_counts[kind] = count + 1

    for ev in deferred:
        if len(preview) >= n:
            break
        preview.append(ev)

    return preview[:n]


# ── Scale derivation from events (spec §13) ──────────────────────────────────

def derive_scales(
    events: List[Dict[str, Any]],
    current_window_hours: float = 24.0,
    now_utc: Optional[datetime] = None,
) -> Dict[str, str]:
    """
    Derive aggregate G/R/S operational scales from interpreted events.

    Uses events within current_window_hours.  Returns {"g_scale": "G0"–"G5", ...}.
    These are consumed by the aggregator and used as fallback when event-derived
    scales are stronger than metric-derived ones.
    """
    if now_utc is None:
        now_utc = datetime.now(timezone.utc)
    cutoff_ts = now_utc.timestamp() - current_window_hours * 3600

    g_max = r_max = s_max = 0

    for ev in events:
        ts = ev.get("t_utc")
        if not ts:
            continue
        try:
            if datetime.strptime(ts, "%Y-%m-%dT%H:%M:%SZ").replace(
                tzinfo=timezone.utc
            ).timestamp() < cutoff_ts:
                continue
        except ValueError:
            continue

        domain   = ev.get("domain")
        severity = ev.get("severity")
        if severity is None:
            continue

        if domain == "G":
            g_max = max(g_max, severity)
        elif domain == "R":
            r_max = max(r_max, severity)
        elif domain == "S":
            s_max = max(s_max, severity)

    return {
        "g_scale": f"G{g_max}",
        "r_scale": f"R{r_max}",
        "s_scale": f"S{s_max}",
    }


# ── Main entry point ──────────────────────────────────────────────────────────

def interpret(
    raw_alerts: List[Dict[str, Any]],
    now_utc: Optional[datetime] = None,
    preview_n: int = 3,
    retention_hours: float = 72.0,
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Classify raw SWPC alert records into normalized HelioEvent lists.

    Args:
        raw_alerts:       list of RawSwpcAlertRecord dicts (from normalizer)
        now_utc:          reference time for freshness and retention (default: now)
        preview_n:        number of items in alerts_preview
        retention_hours:  max age of events included in alerts_all / alerts_preview

    Returns:
        {
            "alerts_all":     list[HelioEvent],   sorted time descending
            "alerts_preview": list[HelioEvent],   sorted relevance descending
        }
    """
    if now_utc is None:
        now_utc = datetime.now(timezone.utc)

    now_ms    = now_utc.timestamp() * 1000
    cutoff_ts = now_utc.timestamp() - retention_hours * 3600

    events: List[Dict[str, Any]] = []

    for record in raw_alerts:
        try:
            _process_record(record, events, now_ms, cutoff_ts)
        except Exception as exc:
            code = record.get("message_code", "?")
            print(f"[helio.interpreter] WARNING: skipped record code={code!r}: {exc}")

    deduped = _deduplicate(events)

    alerts_all = sorted(deduped, key=lambda e: e["t_utc"] or "", reverse=True)
    alerts_preview = _select_preview(deduped, n=preview_n)

    return {
        "alerts_all":     alerts_all,
        "alerts_preview": alerts_preview,
    }


def _process_record(
    record: Dict[str, Any],
    out: List[Dict[str, Any]],
    now_ms: float,
    cutoff_ts: float,
) -> None:
    """Classify one raw alert record and append a HelioEvent to out."""
    ts = record.get("issued_utc")
    if not ts:
        return  # no timestamp → skip

    try:
        event_ts = (
            datetime.strptime(ts, "%Y-%m-%dT%H:%M:%SZ")
            .replace(tzinfo=timezone.utc)
            .timestamp()
        )
    except ValueError:
        return  # unparseable timestamp → skip

    if event_ts < cutoff_ts:
        return  # outside retention window → skip

    kind, domain   = _classify(record)
    severity, slabel = _extract_severity(record, kind, domain)
    level          = _derive_level(record, kind)
    title          = _build_title(kind, severity, slabel)
    summary_short  = _build_summary(kind, severity)
    dedupe_key     = _make_dedupe_key(kind, domain, severity, level, ts)
    relevance      = _compute_relevance(kind, severity, level, ts, now_ms)

    out.append({
        "t_utc":          ts,
        "kind":           kind,
        "domain":         domain,
        "severity":       severity,
        "severity_label": slabel,
        "level":          level,
        "title":          title,
        "summary_short":  summary_short,
        "source_code":    record.get("message_code"),
        "raw_title":      record.get("title"),
        "raw_body":       record.get("body"),
        "relevance":      relevance,
        "dedupe_key":     dedupe_key,
    })
