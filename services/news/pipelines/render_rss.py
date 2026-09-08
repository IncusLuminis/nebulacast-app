"""
Generate RSS feed from pipeline outputs (archive.jsonl or daily_*.jsonl).
Compatible format with https://news.nebulacast.app/rss.xml.
"""
from __future__ import annotations

import html
import json
import re
import yaml
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from shared.rss_helpers import clean_snippet, parse_date, rfc822_date


def find_input_file(outputs_dir: Path) -> Optional[Path]:
    daily_files = sorted(
        [p for p in outputs_dir.glob("daily_*.jsonl") if p.is_file()],
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    if daily_files:
        return daily_files[0]
    archive_path = outputs_dir / "archive.jsonl"
    if archive_path.exists():
        return archive_path
    return None


def load_jsonl_records(jsonl_path: Path, max_items: int = 0) -> list:
    records = []
    seen_urls = set()
    if not jsonl_path.exists():
        return records
    with jsonl_path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
                url = record.get("url", "").strip()
                if url and url not in seen_urls:
                    seen_urls.add(url)
                    records.append(record)
                    if max_items > 0 and len(records) >= max_items:
                        break
            except json.JSONDecodeError:
                continue
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
        final_image_url = yt_thumb or image_url
        parts.append(f'<p><img src="{html.escape(final_image_url)}" alt="thumb" style="max-width:160px;height:auto;"></p>')
    summary_html = record.get("summary_html") or ""
    summary = record.get("summary") or ""
    text_source = summary_html if summary_html else summary
    clean_text = clean_snippet(text_source, limit=220)
    url = record.get("url") or ""
    more_tag = f' <a class="more" href="{html.escape(url)}" target="_blank" rel="noopener noreferrer">more »</a>' if url else ""
    if clean_text or more_tag:
        parts.append(f'<div class="snippet">{html.escape(clean_text)}{more_tag}</div>')
    return "".join(parts)


def generate_rss(
    records: list,
    output_path: Path,
    base_url: str = "https://news.nebulacast.app/",
) -> None:
    generated_at = datetime.now(timezone.utc)
    rss_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
        "  <channel>",
        "    <title>News Radar Dashboard</title>",
        f'    <link>{html.escape(base_url)}</link>',
        "    <description>Aggregated dashboard feed</description>",
        f"    <lastBuildDate>{rfc822_date(generated_at)}</lastBuildDate>",
        f'    <atom:link rel="self" type="application/rss+xml" href="{html.escape(base_url)}rss.xml"/>',
    ]
    for record in records:
        title = record.get("title") or "(untitled)"
        url = record.get("url") or ""
        category = record.get("category") or record.get("stream", "news").upper()
        published_at_str = record.get("published_at") or ""
        pub_date = parse_date(published_at_str)
        if not url:
            continue
        desc_html = build_description_html(record)
        rss_lines.extend([
            "    <item>",
            f"      <title>{html.escape(title)}</title>",
            f"      <link>{html.escape(url)}</link>",
            f"      <guid isPermaLink=\"true\">{html.escape(url)}</guid>",
            f"      <pubDate>{rfc822_date(pub_date)}</pubDate>",
            f"      <category>{html.escape(category)}</category>",
            f"      <description><![CDATA[{desc_html}]]></description>",
            "    </item>",
        ])
    rss_lines.extend(["  </channel>", "</rss>"])
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(rss_lines), encoding="utf-8")


def render_from_outputs(
    outputs_dir: Path,
    output_path: Path,
    base_url: str = "https://news.nebulacast.app/",
    max_items: int = 60,
    sources_yaml_path: Optional[Path] = None,
) -> None:
    """
    Read pipeline output (archive.jsonl or latest daily_*.jsonl), apply nebulacast_min_items
    and ordering, then write RSS to output_path.
    """
    input_path = find_input_file(outputs_dir)
    if not input_path or not input_path.exists():
        raise FileNotFoundError(f"No input found in {outputs_dir} (daily_*.jsonl or archive.jsonl)")

    records = load_jsonl_records(input_path, max_items=0)
    if not records:
        generate_rss([], output_path, base_url=base_url)
        return

    nebulacast_min_items = 7
    if sources_yaml_path and sources_yaml_path.exists():
        try:
            sources_config = yaml.safe_load(sources_yaml_path.read_text(encoding="utf-8")) or {}
            rss_config = sources_config.get("sources", {}).get("rss", {})
            rss_rendering = rss_config.get("rss_rendering", {})
            nebulacast_min_items = rss_rendering.get("nebulacast_min_items", 7)
        except Exception:
            pass

    nebulacast_records = [r for r in records if (r.get("category") or r.get("stream", "")).upper() == "NEBULACAST"]
    other_records = [r for r in records if (r.get("category") or r.get("stream", "")).upper() != "NEBULACAST"]

    def get_sort_key(record: dict) -> float:
        pub_str = record.get("published_at") or ""
        if not pub_str:
            return 0.0
        try:
            return parse_date(pub_str).timestamp()
        except Exception:
            return 0.0

    # Sort nebulacast by date before slicing so we always take the N newest, not N oldest
    nebulacast_records.sort(key=get_sort_key, reverse=True)
    selected_nebulacast = nebulacast_records[:nebulacast_min_items]
    selected_nebulacast_urls = {r.get("url", "").strip() for r in selected_nebulacast if r.get("url")}

    # Sort all records by published_at descending (newest first)
    other_records.sort(key=get_sort_key, reverse=True)
    remaining_other = [r for r in other_records if r.get("url", "").strip() not in selected_nebulacast_urls]
    final_records = (selected_nebulacast + remaining_other)[:max_items]
    # Final sort by date descending to ensure newest first overall
    final_records.sort(key=get_sort_key, reverse=True)
    generate_rss(final_records, output_path, base_url=base_url)
