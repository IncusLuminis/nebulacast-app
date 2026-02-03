# pipeline.py — news pipeline (paths relative to service root)
from __future__ import annotations

import json
from copy import deepcopy
from datetime import date as _date, datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import yaml

from pipelines.rss_adapter import RssAdapter, RssConfig, RssFeed
from schema.models import NewsRecord, ScoreBreakdownNews


def ensure_dirs(agent_root: Path) -> None:
    (agent_root / "outputs").mkdir(parents=True, exist_ok=True)
    (agent_root / "data").mkdir(parents=True, exist_ok=True)


def load_yaml(path: Path) -> dict:
    return yaml.safe_load(path.read_text(encoding="utf-8")) or {}


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


def detect_content_type(r: NewsRecord, rules: dict) -> str:
    ct = (rules.get("content_types") or {})
    matchers = ct.get("matchers") or []
    title = (getattr(r, "title", "") or "").lower()
    summary = (getattr(r, "summary", "") or "").lower()
    url = (str(getattr(r, "url", "") or "")).lower()
    source = (getattr(r, "source", "") or "").lower()
    if source.endswith("_youtube") or "youtube.com/watch" in url or "youtu.be/" in url:
        return "video"
    default_type: str = "news"

    def _contains_any(hay: str, needles: list) -> bool:
        for x in needles or []:
            s = str(x).lower().strip()
            if s and s in hay:
                return True
        return False

    for m in matchers:
        if not isinstance(m, dict):
            continue
        if m.get("default", False):
            t = str(m.get("type", "")).strip()
            if t:
                default_type = t
            continue
        t = str(m.get("type", "")).strip()
        if not t:
            continue
        src_in = [str(x).lower().strip() for x in (m.get("source_in") or []) if str(x).strip()]
        if src_in and source not in src_in:
            continue
        if "url_contains_any" in m and not _contains_any(url, m.get("url_contains_any") or []):
            continue
        if "title_contains_any" in m and not _contains_any(title, m.get("title_contains_any") or []):
            continue
        if "summary_contains_any" in m and not _contains_any(summary, m.get("summary_contains_any") or []):
            continue
        return t
    return default_type


def rules_for_record(stream_rules: dict, content_type: str) -> dict:
    ct = (stream_rules.get("content_types") or {})
    types = ct.get("types") or {}
    overlay = (types.get(content_type) or {}) if isinstance(types, dict) else {}
    if not overlay:
        return stream_rules
    return deep_merge(stream_rules, overlay)


def resolve_freshness(scfg: dict, srules: dict) -> Tuple[int, bool]:
    fr_cfg = scfg.get("freshness") or {}
    rules_fr = srules.get("freshness", {}) or {}
    has_override = ("max_age_days" in fr_cfg) or ("require_published_date" in fr_cfg)
    if has_override:
        max_age_days = int(fr_cfg.get("max_age_days", int(rules_fr.get("max_age_days", 7))))
        require_pub = bool(fr_cfg.get("require_published_date", bool(rules_fr.get("require_published_date", True))))
    else:
        max_age_days = int(rules_fr.get("max_age_days", 7))
        require_pub = bool(rules_fr.get("require_published_date", True))
    return max_age_days, require_pub


def _parse_published_date(pub: Any) -> Optional[_date]:
    if pub is None:
        return None
    if isinstance(pub, datetime):
        dt = pub
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
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
        pub_raw = getattr(r, "published_at", None)
        pub_date = _parse_published_date(pub_raw)
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
    out: List[NewsRecord] = []
    for r in records:
        t = (r.title or "").lower()
        if any(p in t for p in excl):
            continue
        out.append(r)
    return out


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
    legacy_keywords = [str(x).lower().strip() for x in (topics.get("keywords") or []) if str(x).strip()]
    title_keywords = [str(x).lower().strip() for x in (topics.get("title_keywords") or []) if str(x).strip()]
    summary_keywords = [str(x).lower().strip() for x in (topics.get("summary_keywords") or []) if str(x).strip()]
    if not title_keywords and legacy_keywords:
        title_keywords = legacy_keywords
    if not summary_keywords and legacy_keywords:
        summary_keywords = legacy_keywords

    title_hits = sum(1 for w in title_keywords if w and w in title) if title and title_keywords else 0
    summary_hits = sum(1 for w in summary_keywords if w and w in summary) if summary and summary_keywords else 0
    weighted_hits = (2 * title_hits) + (1 * summary_hits)

    if weighted_hits <= 0:
        topic_match = 0.0
    elif weighted_hits == 1:
        topic_match = 30.0
    elif weighted_hits == 2:
        topic_match = 55.0
    elif weighted_hits == 3:
        topic_match = 75.0
    elif weighted_hits == 4:
        topic_match = 88.0
    else:
        topic_match = 100.0

    max_age_days = int(rules.get("freshness", {}).get("max_age_days", 7))
    utc_today = datetime.now(timezone.utc).date()
    cutoff = utc_today - timedelta(days=max_age_days)
    pub_date = _parse_published_date(getattr(r, "published_at", None))
    freshness = 100.0 if (pub_date is not None and pub_date >= cutoff) else 0.0

    priorities = rules.get("sources_priority", {}) or {}
    src = _norm_text(r.source)
    source_priority = float(priorities.get(src, 0.0))

    signal_bonus = 0.0
    sig = rules.get("signals", {}) or {}
    blob = (title + "\n" + summary).strip()
    for rule in (sig.get("bonus") or []):
        contains_any = [str(x).lower().strip() for x in (rule.get("contains_any") or []) if str(x).strip()]
        val = float(rule.get("value", 0.0))
        if contains_any and any(w in blob for w in contains_any):
            signal_bonus += val
    for rule in (sig.get("penalty") or []):
        contains_any = [str(x).lower().strip() for x in (rule.get("contains_any") or []) if str(x).strip()]
        val = float(rule.get("value", 0.0))
        if contains_any and any(w in blob for w in contains_any):
            signal_bonus += val
    signal_bonus = max(-100.0, min(100.0, signal_bonus))

    w = rules.get("ranking", {}).get("weights", {}) or {}
    w_topic = float(w.get("topic_match", 0.50))
    w_fresh = float(w.get("freshness", 0.25))
    w_src = float(w.get("source_priority", 0.20))
    w_sig = float(w.get("signal_bonus", 0.05))
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


def write_report_md(out_dir: Path, final: List[NewsRecord], meta: dict, filename: str = "daily_signal.md") -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / filename
    today = datetime.now(timezone.utc).date().isoformat()
    lines: List[str] = []
    lines.append(f"# News Radar — Daily Signal ({today})\n")
    lines.append(f"Window: last {meta['freshness_days']} days | Source(s): {', '.join(meta['sources'])}\n")
    lines.append(f"Raw: {meta['raw_count']} | Fresh: {meta['fresh_count']} | Final: {len(final)}\n")
    for i, r in enumerate(final, start=1):
        pb = r.published_at.isoformat() if r.published_at else "—"
        lines.append(f"## {i}) {r.title}\n")
        lines.append(f"Score: {r.score:.2f} | Published: {pb}\n")
        lines.append(f"Source: {r.source}\n")
        if getattr(r, "stream", ""):
            lines.append(f"Stream: {r.stream}\n")
        lines.append(f"Link: {r.url}\n")
        if r.score_breakdown:
            lines.append("Why:\n")
            lines.append(f"- topic_match: {r.score_breakdown.topic_match:.1f}\n")
            lines.append(f"- freshness: {r.score_breakdown.freshness:.1f}\n")
            lines.append(f"- source_priority: {r.score_breakdown.source_priority:.1f}\n")
            lines.append(f"- signal_bonus: {r.score_breakdown.signal_bonus:.1f}\n")
        if r.summary:
            lines.append(f"\n> {r.summary[:400].strip()}\n")
        lines.append("\n")
    out_path.write_text("\n".join(lines), encoding="utf-8")


def write_report_json(out_dir: Path, records: List[NewsRecord], meta: dict, filename: str) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / filename

    def to_date_str(v: Any) -> Any:
        if v is None:
            return None
        if isinstance(v, datetime):
            return v.date().isoformat()
        if hasattr(v, "isoformat"):
            try:
                return v.isoformat()[:10]
            except Exception:
                return str(v)
        if isinstance(v, str):
            return v[:10] if len(v) >= 10 else v
        return str(v)

    def score_breakdown_obj(v: Any) -> Any:
        if v is None:
            return None
        if hasattr(v, "model_dump"):
            return v.model_dump()
        if hasattr(v, "__dict__"):
            return {k: getattr(v, k) for k in vars(v)}
        return _as_jsonable(v)

    items = []
    for r in records:
        d = {
            "id": getattr(r, "id", None),
            "source": getattr(r, "source", None),
            "stream": getattr(r, "stream", None),
            "title": getattr(r, "title", None),
            "url": _as_jsonable(getattr(r, "url", None)),
            "published_at": to_date_str(getattr(r, "published_at", None)),
            "summary": getattr(r, "summary", None),
            "summary_html": getattr(r, "summary_html", None),
            "image_url": _as_jsonable(getattr(r, "image_url", None)),
            "tags": getattr(r, "tags", None) or [],
            "score": getattr(r, "score", 0.0),
            "score_breakdown": score_breakdown_obj(getattr(r, "score_breakdown", None)),
        }
        items.append(d)
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "stream": meta.get("stream"),
        "window_days": meta.get("freshness_days"),
        "raw_count": meta.get("raw_count"),
        "fresh_count": meta.get("fresh_count"),
        "final_count": len(records),
        "items": items,
    }
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def write_daily_json(out_dir: Path, records: List[NewsRecord], meta: dict, filename: str = "daily_signal.json") -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / filename

    def to_date_str(v: Any) -> Any:
        if v is None:
            return None
        if isinstance(v, datetime):
            return v.date().isoformat()
        if hasattr(v, "isoformat"):
            try:
                return v.isoformat()[:10]
            except Exception:
                return str(v)
        if isinstance(v, str):
            return v[:10] if len(v) >= 10 else v
        return str(v)

    items = []
    for r in records:
        pb = to_date_str(getattr(r, "published_at", None))
        d = {
            "id": getattr(r, "id", None),
            "stream": getattr(r, "stream", None),
            "source": getattr(r, "source", None),
            "title": getattr(r, "title", None),
            "url": _as_jsonable(getattr(r, "url", None)),
            "published_at": pb,
            "summary": getattr(r, "summary", None),
            "summary_html": getattr(r, "summary_html", None),
            "image_url": _as_jsonable(getattr(r, "image_url", None)),
            "tags": getattr(r, "tags", None) or [],
            "score": getattr(r, "score", 0.0),
            "score_breakdown": _as_jsonable(getattr(r, "score_breakdown", None)),
            "fingerprint": getattr(r, "fingerprint", None),
        }
        items.append(d)
    payload = {
        "meta": {**meta, "generated_at": datetime.now(timezone.utc).isoformat(), "final_count": len(records)},
        "items": items,
    }
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def write_daily_csv(out_dir: Path, records: List[NewsRecord], filename: str = "daily_signal.csv") -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / filename
    cols = ["stream", "source", "title", "url", "published_at", "score"]
    lines = [",".join(cols)]
    for r in records:
        row = [
            str(getattr(r, "stream", "") or ""),
            str(getattr(r, "source", "") or ""),
            (r.title or "").replace("\n", " ").replace("\r", " "),
            str(_as_jsonable(getattr(r, "url", "")) or ""),
            str(_as_jsonable(getattr(r, "published_at", None)) or ""),
            str(getattr(r, "score", 0.0)),
        ]
        esc = []
        for v in row:
            v = v.replace('"', '""')
            if any(c in v for c in [",", '"', "\n"]):
                v = f'"{v}"'
            esc.append(v)
        lines.append(",".join(esc))
    out_path.write_text("\n".join(lines), encoding="utf-8")


def append_archive(out_dir: Path, records: List[NewsRecord], filename: str = "archive.jsonl") -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / filename
    keep = {
        "id", "stream", "source", "title", "url", "published_at", "discovered_at",
        "summary", "summary_html", "image_url", "tags", "score", "score_breakdown", "fingerprint"
    }
    with out_path.open("a", encoding="utf-8") as f:
        for r in records:
            if hasattr(r, "model_dump"):
                d = r.model_dump()
            else:
                d = {k: getattr(r, k) for k in dir(r) if not k.startswith("_")}
            d = {k: _as_jsonable(v) for k, v in d.items() if k in keep}
            f.write(json.dumps(d, ensure_ascii=False) + "\n")


def write_raw_jsonl(out_dir: Path, records: List[NewsRecord], filename: str = "raw.jsonl") -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / filename
    keep = {
        "id", "stream", "source", "title", "url", "published_at", "discovered_at",
        "summary", "content_text", "summary_html", "image_url", "tags", "score", "score_breakdown", "fingerprint",
    }
    lines: List[str] = []
    for r in records:
        if hasattr(r, "model_dump"):
            d = r.model_dump()
        else:
            d = {k: getattr(r, k) for k in dir(r) if not k.startswith("_")}
        d = {k: _as_jsonable(v) for k, v in d.items() if k in keep}
        lines.append(json.dumps(d, ensure_ascii=False))
    out_path.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")


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
    default_user_agent = str(fp.get("user_agent", "ai-agents/AG_news_radar"))
    streams_cfg = (rss_root.get("streams") or {}) if isinstance(rss_root.get("streams"), dict) else {}

    if not streams_cfg:
        legacy_feeds = rss_root.get("feeds") or []
        streams_cfg = {
            "main": {
                "enabled": True,
                "feeds": legacy_feeds,
                "limits": rss_root.get("limits") or {},
                "freshness": ((rules_yaml.get("global", {}) or {}).get("freshness") or {}),
                "output": {"top_n": 15, "md_filename": "daily_signal.md"},
            }
        }

    out_dir = agent_root / "outputs"
    all_final: List[NewsRecord] = []
    used_streams: List[str] = []

    for stream_name, scfg in streams_cfg.items():
        if not isinstance(scfg, dict):
            continue
        if not scfg.get("enabled", True):
            continue
        used_streams.append(stream_name)
        stream_rules = rules_for_stream(rules_yaml, stream_name)
        feeds: List[RssFeed] = []
        for f in (scfg.get("feeds") or []):
            if not isinstance(f, dict):
                continue
            if "name" not in f or "url" not in f:
                continue
            feeds.append(RssFeed(name=str(f["name"]), url=str(f["url"])))
        if not feeds:
            continue

        limits = scfg.get("limits") or {}
        max_items_per_feed = int(limits.get("max_items_per_feed", 50))
        sp = scfg.get("fetch_policy") or {}
        timeout_seconds = int(sp.get("timeout_seconds", default_timeout))
        user_agent = str(sp.get("user_agent", default_user_agent))
        cfg = RssConfig(
            enabled=True,
            feeds=feeds,
            max_items_per_feed=max_items_per_feed,
            timeout_seconds=timeout_seconds,
            user_agent=user_agent,
        )
        adapter = RssAdapter(cfg)

        print(f"[{stream_name}] FEEDS: {len(feeds)}")
        raw = adapter.fetch_raw(stream_name=stream_name)
        raw_count = len(raw)
        records = adapter.normalize(raw, stream_name=stream_name)
        write_raw_jsonl(out_dir, records, filename=f"raw_{stream_name}.jsonl")

        max_age_days, require_pub = resolve_freshness(scfg, stream_rules)
        records = filter_fresh(records, max_age_days=max_age_days, require_published_date=require_pub)
        fresh_count = len(records)
        print(f"[{stream_name}] RAW={raw_count} FRESH={fresh_count} max_age_days={max_age_days}")

        records = apply_hard_filters(records, stream_rules)
        scored: List[tuple] = []
        for r in records:
            ctype = detect_content_type(r, stream_rules)
            rrules = rules_for_record(stream_rules, ctype)
            r = score_record(r, rrules)
            scored.append((r, ctype, rrules))

        records = []
        for r, _, rrules in scored:
            min_tm = float((rrules.get("ranking", {}) or {}).get("min_topic_match", 0.0))
            if r.score_breakdown and r.score_breakdown.topic_match >= min_tm:
                records.append(r)

        records = dedupe(records)
        records.sort(key=lambda x: x.score, reverse=True)
        out_cfg = scfg.get("output") or {}
        top_n = int(out_cfg.get("top_n", int((stream_rules.get("output", {}) or {}).get("top_n", 15))))
        md_filename = str(out_cfg.get("md_filename", f"daily_{stream_name}.md"))
        final = records[:top_n]
        all_final.extend(final)
        meta = {
            "freshness_days": max_age_days,
            "sources": [f.name for f in feeds],
            "raw_count": raw_count,
            "fresh_count": fresh_count,
            "stream": stream_name,
            "max_items_per_feed": max_items_per_feed,
        }
        write_report_md(out_dir, final, meta, filename=md_filename)
        json_filename = (out_cfg.get("json_filename") or "").strip()
        if json_filename:
            write_report_json(out_dir, final, meta, filename=json_filename)
        else:
            write_daily_json(out_dir, final, meta, filename=f"daily_{stream_name}.json")
        print(f"[{stream_name}] FINAL={len(final)}")

    all_final = dedupe(all_final)
    all_final.sort(key=lambda x: x.score, reverse=True)
    write_daily_csv(out_dir, all_final, filename="daily_signal.csv")
    append_archive(out_dir, all_final, filename="archive.jsonl")
    write_daily_json(
        out_dir,
        all_final,
        {"stream": "ALL", "freshness_days": None, "sources": [], "raw_count": 0, "fresh_count": len(all_final)},
        filename="daily_signal.json",
    )
    print(f"STREAMS: {', '.join(used_streams) if used_streams else '—'}")
    print(f"UNIFIED FINAL: {len(all_final)}")
