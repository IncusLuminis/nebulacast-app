# Calendar pipeline: RSS streams only (no weather). Outputs JSON to outputs/, rss via render_rss.
from __future__ import annotations

import json
from copy import deepcopy
from datetime import date as _date, datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import yaml

from schema.models import NewsRecord, ScoreBreakdownNews
from pipelines.rss_adapter import RssAdapter, RssFeed, RssConfig


def load_yaml(path: Path) -> dict:
    return yaml.safe_load(path.read_text(encoding="utf-8")) or {}


def ensure_dirs(agent_root: Path) -> None:
    (agent_root / "outputs").mkdir(parents=True, exist_ok=True)
    (agent_root / "data").mkdir(parents=True, exist_ok=True)


def _as_jsonable(v: Any) -> Any:
    if v is None:
        return None
    if isinstance(v, (str, int, float, bool)):
        return v
    if hasattr(v, "isoformat"):
        return v.isoformat()
    return str(v)


def deep_merge(a: Dict[str, Any], b: Dict[str, Any]) -> Dict[str, Any]:
    out = deepcopy(a or {})
    for k, v in (b or {}).items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = deep_merge(out[k], v)
        else:
            out[k] = deepcopy(v)
    return out


def rules_for_stream(rules_yaml: dict, stream_name: str) -> dict:
    base = rules_yaml.get("global", {}) or {}
    per = (rules_yaml.get("streams", {}) or {}).get(stream_name, {}) or {}
    return deep_merge(base, per)


def _parse_published_date(pub: Any) -> Optional[_date]:
    if pub is None:
        return None
    if isinstance(pub, datetime):
        dt = pub if pub.tzinfo else pub.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).date()
    if isinstance(pub, _date):
        return pub
    if isinstance(pub, str):
        s = pub.strip()
        if not s:
            return None
        if s.endswith("Z"):
            s = s[:-1] + "+00:00"
        try:
            dt = datetime.fromisoformat(s)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc).date()
        except Exception:
            try:
                return _date.fromisoformat(s[:10])
            except Exception:
                return None
    return None


def filter_fresh(
    records: List[NewsRecord],
    max_age_days: int,
    require_published_date: bool,
) -> List[NewsRecord]:
    utc_now = datetime.now(timezone.utc)
    today = utc_now.date()
    cutoff = today - timedelta(days=int(max_age_days))
    out: List[NewsRecord] = []
    for r in records:
        pub_date = _parse_published_date(getattr(r, "published_at", None))
        if pub_date is None:
            if require_published_date:
                continue
            out.append(r)
            continue
        if pub_date < cutoff:
            continue
        out.append(r)
    return out


def apply_hard_filters(records: List[NewsRecord], rules: dict) -> List[NewsRecord]:
    hf = rules.get("hard_filters", {}) or {}
    excl = [str(x).lower().strip() for x in (hf.get("exclude_title_patterns") or []) if str(x).strip()]
    if not excl:
        return records
    return [r for r in records if not any(p in (r.title or "").lower() for p in excl)]


def dedupe(records: List[NewsRecord]) -> List[NewsRecord]:
    seen = set()
    out: List[NewsRecord] = []
    for r in records:
        fp = (getattr(r, "fingerprint", None) or "").strip()
        if not fp:
            fp = f"{(r.source or '')}|{str(r.url or '')}|{(r.title or '')}".lower().strip()
        if fp in seen:
            continue
        seen.add(fp)
        r.fingerprint = fp
        out.append(r)
    return out


def _norm_text(s: str) -> str:
    return (s or "").lower().strip()


def score_record(r: NewsRecord, rules: dict) -> NewsRecord:
    title = _norm_text(r.title)
    summary = _norm_text(r.summary or "")
    topics = rules.get("topics", {}) or {}
    title_keywords = [str(x).lower().strip() for x in (topics.get("title_keywords") or []) if str(x).strip()]
    summary_keywords = [str(x).lower().strip() for x in (topics.get("summary_keywords") or []) if str(x).strip()]
    title_hits = sum(1 for w in title_keywords if w and w in title) if title and title_keywords else 0
    summary_hits = sum(1 for w in summary_keywords if w and w in summary) if summary and summary_keywords else 0
    weighted_hits = (2 * title_hits) + (1 * summary_hits)
    topic_match = {0: 0.0, 1: 30.0, 2: 55.0, 3: 75.0, 4: 88.0}.get(weighted_hits, 100.0) if weighted_hits <= 4 else 100.0

    max_age_days = int(rules.get("freshness", {}).get("max_age_days", 365))
    cutoff = datetime.now(timezone.utc).date() - timedelta(days=max_age_days)
    pub_date = _parse_published_date(getattr(r, "published_at", None))
    freshness = 100.0 if (pub_date is not None and pub_date >= cutoff) else 0.0

    priorities = rules.get("sources_priority", {}) or {}
    source_priority = float(priorities.get(_norm_text(r.source), 0.0))

    signal_bonus = 0.0
    sig = rules.get("signals", {}) or {}
    blob = (title + "\n" + summary).strip()
    for rule in (sig.get("bonus") or []):
        contains_any = [str(x).lower().strip() for x in (rule.get("contains_any") or []) if str(x).strip()]
        if contains_any and any(w in blob for w in contains_any):
            signal_bonus += float(rule.get("value", 0.0))
    for rule in (sig.get("penalty") or []):
        contains_any = [str(x).lower().strip() for x in (rule.get("contains_any") or []) if str(x).strip()]
        if contains_any and any(w in blob for w in contains_any):
            signal_bonus += float(rule.get("value", 0.0))
    signal_bonus = max(-100.0, min(100.0, signal_bonus))

    w = rules.get("ranking", {}).get("weights", {}) or {}
    w_topic = float(w.get("topic_match", 0.30))
    w_fresh = float(w.get("freshness", 0.30))
    w_src = float(w.get("source_priority", 0.30))
    w_sig = float(w.get("signal_bonus", 0.10))
    score = (
        (topic_match / 100.0) * w_topic
        + (freshness / 100.0) * w_fresh
        + (source_priority / 100.0) * w_src
        + (signal_bonus / 100.0) * w_sig
    ) * 100.0
    r.score = float(round(score, 2))
    r.score_breakdown = ScoreBreakdownNews(
        topic_match=float(round(topic_match, 1)),
        freshness=float(round(freshness, 1)),
        source_priority=float(round(source_priority, 1)),
        signal_bonus=float(round(signal_bonus, 1)),
    )
    return r


def resolve_freshness(scfg: dict, srules: dict) -> Tuple[int, bool]:
    fr_cfg = scfg.get("freshness") or {}
    rules_fr = srules.get("freshness", {}) or {}
    has_override = ("max_age_days" in fr_cfg) or ("require_published_date" in fr_cfg)
    if has_override:
        max_age_days = int(fr_cfg.get("max_age_days", int(rules_fr.get("max_age_days", 365))))
        require_pub = bool(fr_cfg.get("require_published_date", bool(rules_fr.get("require_published_date", False))))
    else:
        max_age_days = int(rules_fr.get("max_age_days", 365))
        require_pub = bool(rules_fr.get("require_published_date", False))
    return max_age_days, require_pub


def _score_breakdown_obj(v: Any) -> Any:
    if v is None:
        return None
    if hasattr(v, "model_dump"):
        return v.model_dump()
    if hasattr(v, "__dict__"):
        return {k: getattr(v, k) for k in vars(v)}
    return _as_jsonable(v)


def write_daily_json(
    out_dir: Path,
    records: List[NewsRecord],
    meta: dict,
    filename: str = "daily_signal.json",
    categorize_map: Optional[Dict[str, str]] = None,
) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / filename

    def to_date_str(v: Any) -> Any:
        if v is None:
            return None
        if isinstance(v, datetime):
            return v.date().isoformat()
        if hasattr(v, "isoformat"):
            try:
                return getattr(v, "isoformat")()[:10]
            except Exception:
                return str(v)
        if isinstance(v, str):
            return v[:10] if len(v) >= 10 else v
        return str(v)

    categorize_map = categorize_map or {}
    items = []
    for r in records:
        stream = getattr(r, "stream", None) or ""
        source = getattr(r, "source", None) or ""
        category = ""
        if source in categorize_map:
            category = categorize_map[source].upper()
        else:
            tags = getattr(r, "tags", None) or []
            for tag in tags:
                if tag in ["OBSERVING", "NEWS", "METEORS", "ECLIPSES", "CONJUNCTIONS", "OCCULTATIONS", "COMETS"]:
                    category = tag
                    break
            if not category:
                category = stream.upper() if stream else ""
        items.append({
            "id": getattr(r, "id", None),
            "stream": stream,
            "category": category,
            "source": source,
            "title": getattr(r, "title", None),
            "url": _as_jsonable(getattr(r, "url", None)),
            "published_at": to_date_str(getattr(r, "published_at", None)),
            "summary": getattr(r, "summary", None),
            "summary_html": getattr(r, "summary_html", None),
            "image_url": _as_jsonable(getattr(r, "image_url", None)),
            "tags": getattr(r, "tags", None) or [],
            "score": getattr(r, "score", 0.0),
            "score_breakdown": _score_breakdown_obj(getattr(r, "score_breakdown", None)),
            "fingerprint": getattr(r, "fingerprint", None),
        })
    payload = {
        "meta": {
            **meta,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "final_count": len(records),
        },
        "items": items,
    }
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(records)} records to {out_path}")


def run_agent(agent_root: Path) -> None:
    ensure_dirs(agent_root)
    sources_cfg = load_yaml(agent_root / "configs" / "sources.yaml")
    rules_yaml = load_yaml(agent_root / "configs" / "rules.yaml")
    rss_root = (sources_cfg.get("sources", {}) or {}).get("rss", {}) or {}
    if not rss_root.get("enabled", True):
        print("RSS source disabled.")
        return

    fp = rss_root.get("fetch_policy", {}) or {}
    default_timeout = int(fp.get("timeout_seconds", 20))
    default_user_agent = str(fp.get("user_agent", "NebulaCast/calendar"))
    global_rules = rules_yaml.get("global", {}) or {}
    categorize_cfg = global_rules.get("categorize", {}) or {}
    categorize_map = (categorize_cfg.get("by_feed_name") or {}) if categorize_cfg.get("enabled", False) else {}
    streams_cfg = (rss_root.get("streams") or {}) if isinstance(rss_root.get("streams"), dict) else {}
    if not streams_cfg:
        print("ERROR: No streams configured in sources.yaml")
        return

    out_dir = agent_root / "outputs"
    all_final: List[NewsRecord] = []
    used_streams: List[str] = []

    for stream_name, scfg in streams_cfg.items():
        if not isinstance(scfg, dict) or not scfg.get("enabled", True):
            continue
        if scfg.get("type", "rss") == "weather":
            continue

        used_streams.append(stream_name)
        stream_rules = rules_for_stream(rules_yaml, stream_name)
        feeds: List[RssFeed] = []
        for f in (scfg.get("feeds") or []):
            if isinstance(f, dict) and f.get("name") and f.get("url"):
                feeds.append(RssFeed(name=str(f["name"]), url=str(f["url"])))
        if not feeds:
            continue

        limits = scfg.get("limits") or {}
        max_items_per_feed = int(limits.get("max_items_per_feed", 50))
        sp = scfg.get("fetch_policy") or {}
        cfg = RssConfig(
            enabled=True,
            feeds=feeds,
            max_items_per_feed=max_items_per_feed,
            timeout_seconds=int(sp.get("timeout_seconds", default_timeout)),
            user_agent=str(sp.get("user_agent", default_user_agent)),
        )
        adapter = RssAdapter(cfg, agent_root=agent_root, categorize_map=categorize_map)
        print(f"[{stream_name}] FEEDS: {[f.name for f in feeds]}")

        raw = adapter.fetch_raw(stream_name=stream_name)
        records = adapter.normalize(raw, stream_name=stream_name)
        max_age_days, require_pub = resolve_freshness(scfg, stream_rules)
        records = filter_fresh(records, max_age_days, require_pub)
        records = apply_hard_filters(records, stream_rules)
        records = dedupe(records)
        records = [r for r in records if "(example)" not in (r.title or "").lower() and (r.source or "").lower() != "seed"]
        for r in records:
            score_record(r, stream_rules)
        min_topic_match = float(stream_rules.get("ranking", {}).get("min_topic_match", 0.0))
        if min_topic_match > 0.0:
            records = [r for r in records if (r.score_breakdown and r.score_breakdown.topic_match >= min_topic_match) or not r.score_breakdown]
        records.sort(key=lambda x: (x.score, x.published_at or _date.min), reverse=True)
        top_n = int((scfg.get("output") or {}).get("top_n", 20))
        final = records[:top_n] if top_n > 0 else records

        meta = {
            "stream": stream_name,
            "freshness_days": max_age_days,
            "sources": [f.name for f in feeds],
            "raw_count": len(raw),
            "fresh_count": len(records),
        }
        write_daily_json(out_dir, final, meta, filename=f"daily_{stream_name}.json", categorize_map=categorize_map)
        print(f"[{stream_name}] FINAL={len(final)}")
        all_final.extend(final)

    if all_final:
        all_final.sort(key=lambda x: (x.score, x.published_at or _date.min), reverse=True)
        unified_meta = {
            "stream": "ALL",
            "freshness_days": None,
            "sources": list({r.source for r in all_final}),
            "raw_count": len(all_final),
            "fresh_count": len(all_final),
        }
        write_daily_json(out_dir, all_final, unified_meta, filename="daily_signal.json", categorize_map=categorize_map)
        print(f"UNIFIED FINAL: {len(all_final)}")
    else:
        print("WARNING: No records generated for any stream")
