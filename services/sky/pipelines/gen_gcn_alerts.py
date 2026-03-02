#!/usr/bin/env python3
# services/sky/pipelines/gen_gcn_alerts.py
#
# Hourly-ish ingest (run via cron) for NASA/GCN Kafka topics.
# Writes:
#   - services/sky/data/generated/alerts_gcn.json
#   - sites/staging/sky/data/alerts_gcn.json
#
# Contract notes:
# - Additive-only. No legacy changes.
# - Times: use UTC ISO where we can (updated_utc / ingested_utc).
# - Store maximum raw payload under meta.* for later parsing/UX improvements.
#
# Enrichment (merged from gen_gcn_enrichment_alerts.py):
# - Each item gets meta.ui_type, meta.ui_type_hint, meta.ui_type_html inline
#   during ingest (no separate post-processing step required).

from __future__ import annotations

import hashlib
import json
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import yaml
from gcn_kafka import Consumer

from pipelines.lib.jsonio import dump_json
from pipelines.lib.paths import PROJECT_ROOT, SERVICES_DATA_DIR, STAGING_DATA_DIR
from pipelines.lib.timeutil import utc_now_iso


OUT_FILENAME = "alerts_gcn.json"
SOURCES_YML = PROJECT_ROOT / "services" / "sky" / "pipelines" / "yml" / "sources.yml"


# ---------------------------------------------------------------------------
# UI-type enrichment helpers (merged from gen_gcn_enrichment_alerts.py)
# ---------------------------------------------------------------------------

def _norm(s: Any) -> str:
    return str(s or "").strip().lower()


def _infer_ui_type(
    topic: str,
    note: Optional[str] = None,
    title: Optional[str] = None,
) -> Tuple[str, str, str]:
    """
    Returns (ui_type, ui_type_hint, ui_type_html).

    ui_type       – short label, e.g. "GW alert"
    ui_type_hint  – plain-text sentence describing the event class
    ui_type_html  – same info as a small HTML snippet for richer rendering
    """
    t = _norm(topic)
    n = _norm(note)

    # 1) Gravitational-wave alerts (IGWN / LIGO-Virgo-KAGRA)
    if "igwn.gwalert" in t or "gwalert" in t or "cbc" in n or "far" in n:
        ui_type = "GW alert"
        hint = (
            "Gravitational-wave candidate alert (LIGO/Virgo/KAGRA/IGWN). "
            "Preliminary machine-generated notice; classification and sky "
            "localization can be updated."
        )
        html = (
            "<strong>Gravitational-wave candidate</strong> (LIGO/Virgo/KAGRA/IGWN). "
            "Preliminary; classification and sky localization may be revised."
        )
        return ui_type, hint, html

    # 2) Gamma-ray burst / high-energy transient
    if any(k in t for k in ["fermi", "swift", "integral", "konus", "grb", "gamm", "bat", "gbm"]):
        ui_type = "High-energy transient"
        hint = (
            "High-energy transient notice (often GRB-related) distributed via GCN. "
            "Typically time-critical; localization may be coarse and updated later."
        )
        html = (
            "<strong>High-energy transient</strong> (likely GRB-class). "
            "Time-critical; localization may be refined in follow-up notices."
        )
        return ui_type, hint, html

    # 3) AMON multi-messenger coincidence
    if "amon" in t:
        ui_type = "AMON alert"
        hint = (
            "AMON multi-messenger alert (coincidence/association candidates "
            "across instruments). Preliminary; follow-up context matters."
        )
        html = (
            "<strong>AMON multi-messenger alert</strong>. "
            "Coincidence candidate across instruments; preliminary."
        )
        return ui_type, hint, html

    # 4) IceCube neutrino alerts
    if "icecube" in t or "neutrino" in t:
        ui_type = "Neutrino alert"
        hint = (
            "High-energy neutrino candidate alert (e.g., IceCube via GCN). "
            "Localization uncertainty can be large; follow-up may refine the "
            "event context."
        )
        html = (
            "<strong>High-energy neutrino candidate</strong> (IceCube/GCN). "
            "Localization uncertainty may be large."
        )
        return ui_type, hint, html

    # 5) Einstein Probe
    if "einstein_probe" in t or "ep_wxt" in t or "ep_fet" in t:
        ui_type = "X-ray transient"
        hint = (
            "Einstein Probe X-ray transient alert. "
            "Wide-field X-ray monitor; localization is typically arcsecond-level."
        )
        html = (
            "<strong>Einstein Probe X-ray transient</strong>. "
            "Wide-field monitor; arcsecond-class localization."
        )
        return ui_type, hint, html

    # 6) Generic fallback
    ui_type = "GCN notice"
    hint = (
        "General GCN notice. The topic identifies the originating stream; "
        "details and confidence can change as additional data arrives."
    )
    html = (
        "<strong>GCN notice</strong>. "
        "Details and confidence may change as additional data arrives."
    )
    return ui_type, hint, html


def _derive_title_from_topic(topic: str) -> str:
    """Best-effort human-readable title when no structured title is available."""
    t = topic.lower()
    if "igwn.gwalert" in t:
        return "GW Alert"
    if "einstein_probe" in t:
        return "Einstein Probe Alert"
    if "icecube" in t and "lvk" in t:
        return "IceCube ν-Track Search"
    if "icecube" in t:
        return "IceCube Alert"
    if "swift" in t and "bat" in t:
        return "Swift BAT Alert"
    if "fermi" in t and "gbm" in t:
        return "Fermi GBM Alert"
    # Humanise the last segments of the topic string
    parts = topic.split(".")
    if len(parts) >= 3:
        return " ".join(p.replace("_", " ").title() for p in parts[2:5])
    return topic


@dataclass(frozen=True)
class GcnCfg:
    group: str
    topics: List[str]
    max_events: int
    max_runtime_sec: int
    consume_timeout_sec: float
    # optional: keep only latest N events in output if you later add rolling buffer (not used now)


def _utc_iso_from_ts_millis(ts_ms: Optional[int]) -> Optional[str]:
    if ts_ms is None:
        return None
    try:
        dt = datetime.fromtimestamp(ts_ms / 1000.0, tz=timezone.utc)
        return dt.isoformat()
    except Exception:
        return None


def _safe_decode_payload(b: Any) -> Tuple[Optional[str], Optional[Dict[str, Any]]]:
    """
    Try decode bytes -> text; if JSON-like, also parse JSON dict.
    Returns (text, json_dict_or_none).
    """
    if b is None:
        return None, None

    if isinstance(b, (bytes, bytearray)):
        txt = b.decode("utf-8", errors="replace")
    else:
        # sometimes value can already be str / dict-like
        txt = str(b)

    txt_s = txt.strip()

    # Try JSON parse (only if it looks like JSON object)
    if txt_s.startswith("{") and txt_s.endswith("}"):
        try:
            obj = json.loads(txt_s)
            if isinstance(obj, dict):
                return txt, obj
        except Exception:
            pass

    return txt, None


def _load_sources_cfg() -> Dict[str, Any]:
    if not SOURCES_YML.exists():
        raise SystemExit(f"[sky] missing sources.yml: {SOURCES_YML}")
    with SOURCES_YML.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def _get_gcn_cfg(sources: Dict[str, Any]) -> GcnCfg:
    alerts = sources.get("alerts") or {}
    if not isinstance(alerts, dict):
        raise SystemExit("[sky] sources.yml: expected top-level 'alerts:' mapping")

    gcn = alerts.get("gcn_kafka") or alerts.get("gcn") or {}
    if not isinstance(gcn, dict):
        raise SystemExit("[sky] sources.yml: expected alerts.gcn_kafka to be a mapping")

    group = str(gcn.get("group") or "gcn").strip()

    topics = gcn.get("topics") or []
    if not isinstance(topics, list) or not topics:
        raise SystemExit("[sky] sources.yml: alerts.gcn_kafka.topics must be a non-empty list")

    max_events = int(gcn.get("max_events") or 200)
    max_runtime_sec = int(gcn.get("max_runtime_sec") or 50)  # keep cron step bounded
    consume_timeout_sec = float(gcn.get("consume_timeout_sec") or 1.0)

    return GcnCfg(
        group=group,
        topics=[str(t).strip() for t in topics if str(t).strip()],
        max_events=max(1, max_events),
        max_runtime_sec=max(5, max_runtime_sec),
        consume_timeout_sec=max(0.1, consume_timeout_sec),
    )


def _sha256_hex(data: bytes) -> str:
    h = hashlib.sha256()
    h.update(data)
    return h.hexdigest()


def _igwn_gwalert_enrich(
    *,
    payload_text: Optional[str],
    payload_json: Optional[Dict[str, Any]],
) -> Tuple[Optional[str], Optional[str], Dict[str, Any], Optional[Dict[str, Any]]]:
    """
    Enrich IGWN GW alert payload into:
      - title (for UI)
      - note (short summary)
      - meta_extra (to be merged into item.meta)
      - payload_json_sanitized (payload_json with huge skymap removed; keeps fingerprint)

    We do NOT attempt RA/Dec here (GW alerts come with sky maps, not a point).
    """
    obj: Optional[Dict[str, Any]] = None
    if isinstance(payload_json, dict):
        obj = payload_json
    elif isinstance(payload_text, str):
        s = payload_text.strip()
        if s.startswith("{") and s.endswith("}"):
            try:
                o = json.loads(s)
                if isinstance(o, dict):
                    obj = o
            except Exception:
                obj = None

    if not isinstance(obj, dict):
        return None, None, {}, payload_json

    event = obj.get("event") or {}
    if not isinstance(event, dict):
        event = {}

    urls = obj.get("urls") or {}
    if not isinstance(urls, dict):
        urls = {}

    classification = event.get("classification") or {}
    if not isinstance(classification, dict):
        classification = {}

    top_class = None
    top_p = None
    if classification:
        try:
            top_class, top_p = max(
                ((k, v) for k, v in classification.items() if isinstance(v, (int, float))),
                key=lambda kv: kv[1],
            )
        except Exception:
            top_class, top_p = None, None

    props = event.get("properties") or {}
    if not isinstance(props, dict):
        props = {}

    # sanitize skymap (it can be enormous: base64 FITS/healpix)
    payload_json_sanitized = dict(obj)
    event_s = dict(event)
    skymap_val = event_s.pop("skymap", None)

    skymap_meta: Optional[Dict[str, Any]] = None
    if isinstance(skymap_val, str) and skymap_val:
        b = skymap_val.encode("utf-8", errors="ignore")
        skymap_meta = {"present": True, "bytes": len(b), "sha256": _sha256_hex(b)}
        event_s["skymap_meta"] = skymap_meta

    payload_json_sanitized["event"] = event_s

    superevent_id = obj.get("superevent_id")
    alert_type = obj.get("alert_type")
    time_created = obj.get("time_created")
    evt_time = event.get("time")
    far = event.get("far")
    instruments = event.get("instruments") or []
    if not isinstance(instruments, list):
        instruments = []

    title = None
    note = None
    if superevent_id:
        # Example: "GW PRELIMINARY: MS260220n (BNS 0.99999)"
        if top_class and isinstance(top_p, (int, float)):
            title = f"GW {alert_type}: {superevent_id} ({top_class} {top_p:.5f})"
        else:
            title = f"GW {alert_type}: {superevent_id}"

        inst_s = ",".join([str(x) for x in instruments if str(x)]) if instruments else "—"
        far_s = f"{far:.3e}" if isinstance(far, (int, float)) else "—"
        note = f"{inst_s} · FAR {far_s}"
        if evt_time:
            note += f" · t={evt_time}"

    meta_extra: Dict[str, Any] = {
        "gw": {
            "alert_type": alert_type,
            "time_created_utc": time_created,
            "superevent_id": superevent_id,
            "significant": event.get("significant"),
            "event_time_utc": evt_time,
            "far": far,
            "instruments": instruments,
            "group": event.get("group"),
            "pipeline": event.get("pipeline"),
            "search": event.get("search"),
            "properties": props,
            "classification": classification,
            "classification_top": top_class,
        }
    }
    if skymap_meta:
        meta_extra["gw"]["skymap"] = skymap_meta

    if urls.get("gracedb"):
        meta_extra["urls"] = {"gracedb": urls.get("gracedb")}

    if title:
        meta_extra["title"] = title
    if note:
        meta_extra["note"] = note

    return title, note, meta_extra, payload_json_sanitized


def _build_item(
    *,
    cfg_group: str,
    topic: str,
    offset: Optional[int],
    kafka_ts_ms: Optional[int],
    payload_text: Optional[str],
    payload_json: Optional[Dict[str, Any]],
    ingested_utc: str,
) -> Dict[str, Any]:
    """
    Minimal alert item compatible with legacy alerts schema.
    RA/DEC/mag are unknown for most notices at this stage -> keep None, store raw in meta.
    """
    updated_utc = _utc_iso_from_ts_millis(kafka_ts_ms) or ingested_utc

    # Stable-ish id: topic + timestamp + offset (avoid collisions)
    # (If offset missing, fall back to hash of payload_text)
    if offset is not None:
        _id = f"gcn:{topic}:{offset}"
    else:
        h = str(abs(hash(payload_text or "")) % (10**12))
        _id = f"gcn:{topic}:{h}"

    # Try extract some obvious coords if JSON contains them (best-effort, non-breaking)
    ra_deg = None
    dec_deg = None
    mag = None

    if isinstance(payload_json, dict):
        # Common patterns vary a lot; keep this conservative.
        for k_ra in ("ra", "ra_deg", "RA", "raJ2000", "ra_j2000"):
            if k_ra in payload_json:
                try:
                    ra_deg = float(payload_json[k_ra])
                    break
                except Exception:
                    pass
        for k_dec in ("dec", "dec_deg", "DEC", "decJ2000", "dec_j2000"):
            if k_dec in payload_json:
                try:
                    dec_deg = float(payload_json[k_dec])
                    break
                except Exception:
                    pass
        for k_mag in ("mag", "magnitude", "MAG", "v_mag", "Vmag"):
            if k_mag in payload_json:
                try:
                    mag = float(payload_json[k_mag])
                    break
                except Exception:
                    pass

    # Base meta (raw)
    meta: Dict[str, Any] = {
        "topic": topic,
        "offset": offset,
        "kafka_timestamp_ms": kafka_ts_ms,
        "payload_text": payload_text,
        "payload_json": payload_json,  # may be None; may be sanitized below for some topics
    }

    # Topic-specific enrichment (additive). For GW alerts we also sanitize skymap to avoid huge JSON diffs.
    note: Optional[str] = None
    title: Optional[str] = None
    if topic == "igwn.gwalert":
        title, note, meta_extra, payload_json_sanitized = _igwn_gwalert_enrich(
            payload_text=payload_text,
            payload_json=payload_json,
        )
                # Trim payload_text too (it may embed huge skymap). Keep fingerprint for audit.
        if isinstance(payload_text, str) and payload_text:
            b = payload_text.encode("utf-8", errors="ignore")
            meta["payload_text_meta"] = {
                "present": True,
                "bytes": len(b),
                "sha256": _sha256_hex(b),
                "truncated": True,
                "max_chars": 4096,
            }
            meta["payload_text"] = None

        if payload_json_sanitized is not None:
            meta["payload_json"] = payload_json_sanitized
        if meta_extra:
            meta.update(meta_extra)

    # Derive a fallback title from the topic if none was produced above
    if not title:
        title = _derive_title_from_topic(topic)

    # Inline UI-type enrichment (replaces the separate gen_gcn_enrichment_alerts.py pass)
    ui_type, ui_type_hint, ui_type_html = _infer_ui_type(topic, note, title)
    meta["ui_type"] = ui_type
    meta["ui_type_hint"] = ui_type_hint
    meta["ui_type_html"] = ui_type_html

    return {
        "id": _id,
        "source": "gcn_kafka",
        "group": cfg_group,
        "type": "gcn",
        "title": title,   # human-readable title (top-level for frontend)
        "ui_type": ui_type,  # event-class label (top-level for frontend)
        "note": note,  # previously None; now filled when we can (e.g., GW alerts)
        "score_raw": None,
        "score_norm": 0.5,  # neutral default; later we can specialize by topic family
        "ra_deg": ra_deg,
        "dec_deg": dec_deg,
        "mag": mag,
        "discovery": None,
        "updated_utc": updated_utc,
        "ingested_utc": ingested_utc,
        "meta": meta,
    }


def main() -> None:
    import os
    from typing import Any, Dict, List

    from dotenv import load_dotenv

    # Load .env from project root (same style as other pipelines)
    load_dotenv(PROJECT_ROOT / ".env")

    sources = _load_sources_cfg()
    cfg = _get_gcn_cfg(sources)

    CLIENT_ID = os.getenv("NASA_CLIENT_ID")
    CLIENT_SECRET = os.getenv("NASA_CLIENT_SECRET")
    if not CLIENT_ID or not CLIENT_SECRET:
        raise SystemExit("[sky] Missing NASA_CLIENT_ID/NASA_CLIENT_SECRET in environment")

    # Observability knobs (prefer putting heartbeat_sec into sources.yml)
    heartbeat_sec = getattr(cfg, "heartbeat_sec", None)
    if not isinstance(heartbeat_sec, (int, float)) or heartbeat_sec <= 0:
        heartbeat_sec = 15

    consumer = Consumer(
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        **{"broker.address.family": "v4"},  # GitHub Actions runners have no IPv6
    )
    consumer.subscribe(cfg.topics)

    ingested_utc = utc_now_iso()
    started = time.time()
    last_heartbeat = started

    items: List[Dict[str, Any]] = []
    counts_by_topic: Dict[str, int] = {}

    total_polls = 0
    empty_polls = 0
    n = 0

    print(
        f"[sky] gcn subscribe topics={len(cfg.topics)} "
        f"max_events={cfg.max_events} max_runtime_sec={cfg.max_runtime_sec} "
        f"consume_timeout_sec={cfg.consume_timeout_sec} heartbeat_sec={heartbeat_sec}",
        flush=True,
    )

    while True:
        elapsed = time.time() - started
        if n >= cfg.max_events:
            break
        if elapsed >= cfg.max_runtime_sec:
            break

        msgs = consumer.consume(timeout=cfg.consume_timeout_sec) or []
        total_polls += 1

        if not msgs:
            empty_polls += 1
            now = time.time()
            if (now - last_heartbeat) >= heartbeat_sec:
                print(
                    f"[hb] elapsed={int(elapsed)}s polls={total_polls} empty={empty_polls} items={n}",
                    flush=True,
                )
                last_heartbeat = now
            continue

        for m in msgs:
            elapsed = time.time() - started
            if n >= cfg.max_events:
                break
            if elapsed >= cfg.max_runtime_sec:
                break

            try:
                if m.error():
                    print(f"[warn] kafka message error: {m.error()}", flush=True)
                    continue

                topic = m.topic() or "unknown"
                offset = m.offset()
                ts = m.timestamp()  # tuple(type, ts_ms)
                kafka_ts_ms = ts[1] if isinstance(ts, tuple) and len(ts) == 2 else None

                payload_text, payload_json = _safe_decode_payload(m.value())

                it = _build_item(
                    cfg_group=cfg.group,
                    topic=topic,
                    offset=offset,
                    kafka_ts_ms=kafka_ts_ms,
                    payload_text=payload_text,
                    payload_json=payload_json,
                    ingested_utc=ingested_utc,
                )
                items.append(it)
                counts_by_topic[topic] = counts_by_topic.get(topic, 0) + 1

                n += 1
                print(f"[evt] {n}/{cfg.max_events} topic={topic} offset={offset}", flush=True)

            except Exception as e:
                print(f"[warn] failed to process message: {type(e).__name__}: {e}", flush=True)
                continue

    out = {
        "generated_utc": utc_now_iso(),
        "source": "NASA/GCN Kafka via gcn_kafka",
        "counts": {
            "items": len(items),
            "by_topic": counts_by_topic,
            "polls_total": total_polls,
            "polls_empty": empty_polls,
        },
        "raw": {
            "topics": cfg.topics,
            "max_events": cfg.max_events,
            "max_runtime_sec": cfg.max_runtime_sec,
            "consume_timeout_sec": cfg.consume_timeout_sec,
            "heartbeat_sec": heartbeat_sec,
        },
        "items": items,
    }

    dump_json(SERVICES_DATA_DIR / OUT_FILENAME, out)
    dump_json(STAGING_DATA_DIR / OUT_FILENAME, out)

    elapsed = int(time.time() - started)
    print(f"[sky] wrote {len(items)} items -> {STAGING_DATA_DIR / OUT_FILENAME}", flush=True)
    print(f"[sky] wrote {len(items)} items -> {SERVICES_DATA_DIR / OUT_FILENAME}", flush=True)
    print(
        f"[sky] done elapsed={elapsed}s items={len(items)} polls={total_polls} empty={empty_polls}",
        flush=True,
    )


if __name__ == "__main__":
    main()