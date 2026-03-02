"""
Generate RSS from calendar pipeline JSON (daily_signal.json / daily_*.json).
No weather — astro-weather is a separate service.
"""
from __future__ import annotations

import html
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from shared.rss_helpers import clean_snippet, parse_date, rfc822_date


def find_input_file(outputs_dir: Path) -> Optional[Path]:
    signal_path = outputs_dir / "daily_signal.json"
    if signal_path.exists():
        return signal_path
    daily_files = sorted(
        [p for p in outputs_dir.glob("daily_*.json") if p.is_file() and not p.name.endswith(".jsonl")],
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    return daily_files[0] if daily_files else None


def load_json_records(json_path: Path, max_items: int = 100) -> list:
    records = []
    seen_urls = set()
    if not json_path.exists():
        return records
    try:
        data = json.loads(json_path.read_text(encoding="utf-8"))
        items = []
        if isinstance(data, dict):
            if "items" in data:
                items = data["items"]
            elif "meta" in data and "items" in data.get("meta"):
                items = data["meta"]["items"]
        for record in items:
            if not isinstance(record, dict):
                continue
            url = (record.get("url") or "").strip()
            if url and url not in seen_urls:
                seen_urls.add(url)
                records.append(record)
                if len(records) >= max_items:
                    break
    except (json.JSONDecodeError, Exception) as e:
        print(f"ERROR loading {json_path}: {e}")
    return records


def youtube_thumbnail_url(url: str) -> Optional[str]:
    if not url:
        return None
    patterns = [
        r"(?:youtube\.com/(?:watch\?v=|embed/|v/)|youtu\.be/|youtube\.com/shorts/|youtube\.com/v/)([a-zA-Z0-9_-]{11})",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return f"https://img.youtube.com/vi/{match.group(1)}/hqdefault.jpg"
    return None


def build_description_html(record: dict) -> str:
    parts = []
    image_url = record.get("image_url") or ""
    if image_url and not image_url.startswith("data:image/svg+xml"):
        yt_thumb = youtube_thumbnail_url(image_url)
        final_url = yt_thumb or image_url
        safe_url = final_url.replace("]]>", "]]&gt;")
        parts.append(f'<p><img src="{safe_url}" alt="thumb" style="max-width:160px;height:auto;"></p>')
    summary_html = record.get("summary_html") or ""
    summary = record.get("summary") or ""
    text_source = summary_html if summary_html else summary
    clean_text = clean_snippet(text_source, limit=220)
    url = record.get("url") or ""
    safe_url = url.replace("]]>", "]]&gt;") if url else ""
    more_tag = f' <a class="more" href="{safe_url}" target="_blank" rel="noopener noreferrer">more »</a>' if safe_url else ""
    if clean_text or more_tag:
        safe_text = clean_text.replace("]]>", "]]&gt;")
        parts.append(f"<div class=\"snippet\">{safe_text}{more_tag}</div>")
    return "".join(parts)


def generate_rss(
    records: list,
    output_path: Path,
    base_url: str = "https://alerts.nebulacast.app/",
    feed_title: str = "Sky Alerts",
    feed_description: str = "Amateur astronomy alerts (meteors, eclipses, conjunctions, etc.)",
) -> None:
    generated_at = datetime.now(timezone.utc)
    rss_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
        "  <channel>",
        f"    <title>{html.escape(feed_title)}</title>",
        f"    <link>{html.escape(base_url)}</link>",
        f"    <description>{html.escape(feed_description)}</description>",
        f"    <lastBuildDate>{rfc822_date(generated_at)}</lastBuildDate>",
        f'    <atom:link rel="self" type="application/rss+xml" href="{html.escape(base_url)}rss.xml"/>',
    ]
    for record in records:
        title = record.get("title") or "(untitled)"
        url = record.get("url") or ""
        category = record.get("category") or (record.get("stream") or "alerts").upper()
        published_at_str = record.get("published_at") or ""
        pub_date = parse_date(published_at_str)
        if not url:
            continue
        desc_html = build_description_html(record)
        rss_lines.extend([
            "    <item>",
            f"      <title>{html.escape(title)}</title>",
            f"      <link>{html.escape(url)}</link>",
            f'      <guid isPermaLink="true">{html.escape(url)}</guid>',
            f"      <pubDate>{rfc822_date(pub_date)}</pubDate>",
            f"      <category>{html.escape(category)}</category>",
            f"      <description><![CDATA[{desc_html}]]></description>",
            "    </item>",
        ])
    rss_lines.extend(["  </channel>", "</rss>"])
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(rss_lines), encoding="utf-8")
    stream_counts = {}
    for r in records:
        s = r.get("stream") or "unknown"
        stream_counts[s] = stream_counts.get(s, 0) + 1
    print(f"Wrote RSS: {output_path} ({len(records)} items, streams: {stream_counts})")


def render_from_outputs(
    outputs_dir: Path,
    output_path: Path,
    base_url: str = "https://alerts.nebulacast.app/",
    feed_title: str = "Sky Alerts",
    feed_description: str = "Amateur astronomy alerts",
    max_items: int = 50,
) -> None:
    """
    Read daily_signal.json (or latest daily_*.json) from outputs_dir, generate RSS to output_path.
    No weather records.
    """
    input_path = find_input_file(outputs_dir)
    if not input_path or not input_path.exists():
        raise FileNotFoundError(f"No input found in {outputs_dir} (daily_signal.json or daily_*.json)")
    records = load_json_records(input_path, max_items=max_items)
    generate_rss(
        records,
        output_path,
        base_url=base_url,
        feed_title=feed_title,
        feed_description=feed_description,
    )
