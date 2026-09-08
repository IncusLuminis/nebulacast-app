"""
RSS adapter for calendar: fetch and normalize RSS (and optional seed YAML) to NewsRecord.
"""
from __future__ import annotations

import hashlib
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone, date
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse, parse_qs

import feedparser
import yaml

from schema.models import NewsRecord
from shared.rss_helpers import extract_first_image_url, first_paragraph, strip_html_to_text


@dataclass
class RssFeed:
    name: str
    url: str


@dataclass
class RssConfig:
    enabled: bool = True
    feeds: List[RssFeed] = None
    max_items_per_feed: int = 50
    timeout_seconds: int = 20
    user_agent: str = "NebulaCast/calendar"


class RssAdapter:
    SOURCE_NAME = "rss"

    def __init__(self, cfg: RssConfig, agent_root: Optional[Path] = None, categorize_map: Optional[Dict[str, str]] = None) -> None:
        self.cfg = cfg
        self.agent_root = agent_root
        self.categorize_map = categorize_map or {}

    def fetch_raw(self, stream_name: str = "") -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        for feed in self.cfg.feeds:
            try:
                if feed.url.startswith("seed://"):
                    entries = self._fetch_seed(feed, stream_name)
                else:
                    entries = self._fetch_one(feed)
                out.extend(entries)
                print(f"[RSS] OK   name={feed.name} url={feed.url} items={len(entries)}")
            except Exception as e:
                if isinstance(e, urllib.error.HTTPError):
                    err = f"HTTPError {e.code} {e.reason}"
                elif isinstance(e, urllib.error.URLError):
                    err = f"URLError {e.reason}"
                else:
                    err = str(e)
                print(f"[RSS] FAIL name={feed.name} url={feed.url} err={err}")
        return out

    def _fetch_seed(self, feed: RssFeed, stream_name: str) -> List[Dict[str, Any]]:
        if not self.agent_root:
            return []
        seed_path = self.agent_root / "data" / "seed_events.yaml"
        if not seed_path.exists():
            return []
        seed_events = yaml.safe_load(seed_path.read_text(encoding="utf-8")) or []
        stream_from_url = feed.url.replace("seed://", "").strip()
        target_stream = stream_from_url or stream_name
        filtered = [e for e in seed_events if e.get("stream") == target_stream]
        out: List[Dict[str, Any]] = []
        for event in filtered:
            event_date = event.get("date", "")
            published_parsed = None
            if event_date:
                try:
                    dt = datetime.strptime(event_date, "%Y-%m-%d")
                    published_parsed = dt.timetuple()
                except Exception:
                    pass
            ent: Dict[str, Any] = {
                "title": event.get("title", ""),
                "link": event.get("link", ""),
                "summary": event.get("summary", ""),
                "description": event.get("summary", ""),
            }
            if published_parsed:
                ent["published_parsed"] = published_parsed
            out.append({"feed_name": feed.name, "feed_url": feed.url, "entry": ent})
        return out

    def _fetch_one(self, feed: RssFeed) -> List[Dict[str, Any]]:
        headers = {
            "User-Agent": self.cfg.user_agent,
            "Accept": "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
        }
        req = urllib.request.Request(feed.url, headers=headers, method="GET")
        with urllib.request.urlopen(req, timeout=self.cfg.timeout_seconds) as resp:
            ctype = (resp.headers.get("Content-Type") or "").lower()
            body = resp.read()
        if "html" in ctype and "xml" not in ctype:
            raise ValueError(f"HTML instead of XML (Content-Type: {ctype})")
        parsed = feedparser.parse(body)
        entries = parsed.entries or []
        if self.cfg.max_items_per_feed and len(entries) > self.cfg.max_items_per_feed:
            entries = entries[: self.cfg.max_items_per_feed]
        return [{"feed_name": feed.name, "feed_url": feed.url, "entry": ent} for ent in entries]

    def normalize(self, raw_entries: List[Dict[str, Any]], stream_name: str = "") -> List[NewsRecord]:
        out: List[NewsRecord] = []
        now = datetime.now(timezone.utc)
        for item in raw_entries:
            feed_name = str(item.get("feed_name") or self.SOURCE_NAME)
            ent = item.get("entry") or {}
            title = (ent.get("title") or "").strip()
            url = (ent.get("link") or "").strip()
            if not url and ent.get("links"):
                try:
                    url = (ent["links"][0].get("href") or "").strip()
                except Exception:
                    url = ""
            published_at = self._parse_published(ent)
            summary_html = ""
            if ent.get("content") and isinstance(ent.get("content"), list) and ent["content"]:
                summary_html = str(ent["content"][0].get("value") or "").strip()
            if not summary_html:
                summary_html = str(ent.get("summary") or ent.get("description") or "").strip()
            if feed_name == "seed" and summary_html and not summary_html.strip().startswith("<"):
                summary_html = f"<p>{summary_html}</p>"
            image_url = self._extract_image_url(ent, summary_html)
            summary_text = first_paragraph(strip_html_to_text(summary_html), max_chars=260)
            content_text = strip_html_to_text(summary_html) if summary_html else None
            rid = self._make_id(feed_name, url, title)
            category = self.categorize_map.get(feed_name, "").upper() if self.categorize_map else ((stream_name or "").upper() if stream_name else "")
            tags_list = [s for s in (stream_name, category) if s]
            rec = NewsRecord(
                id=rid,
                source=feed_name,
                stream=stream_name or "",
                title=title,
                url=url,
                published_at=published_at,
                discovered_at=now,
                summary=summary_text or None,
                content_text=content_text,
                summary_html=summary_html or None,
                image_url=image_url or None,
                tags=tags_list,
                score=0.0,
                score_breakdown=None,
                fingerprint=rid,
            )
            out.append(rec)
        return out

    def _make_id(self, feed_name: str, url: str, title: str) -> str:
        content = f"{title}|{url}".encode("utf-8")
        hash_hex = hashlib.sha1(content).hexdigest()[:12]
        return f"{feed_name}:{hash_hex}"

    def _parse_published(self, ent: Dict[str, Any]) -> Optional[datetime]:
        t = ent.get("published_parsed") or ent.get("updated_parsed")
        if not t:
            return None
        try:
            return datetime(*t[:6], tzinfo=timezone.utc)
        except Exception:
            return None

    def _extract_image_url(self, ent: Dict[str, Any], summary_html: str) -> Optional[str]:
        for key in ("media_content", "media_thumbnail"):
            mc = ent.get(key)
            if isinstance(mc, list) and mc:
                u = (mc[0].get("url") or "").strip()
                if u:
                    return self._youtube_thumb(u) or u
            if isinstance(mc, dict):
                u = (mc.get("url") or "").strip()
                if u:
                    return self._youtube_thumb(u) or u
        links = ent.get("links") or []
        for l in links:
            try:
                rel = str(l.get("rel") or "").lower()
                href = (l.get("href") or "").strip()
                ltype = str(l.get("type") or "").lower()
                if href and rel == "enclosure" and ("image" in ltype or "video" in ltype):
                    return self._youtube_thumb(href) or href
            except Exception:
                continue
        html_img = extract_first_image_url(summary_html)
        return (self._youtube_thumb(html_img) or html_img) if html_img else None

    def _youtube_thumb(self, url: str) -> Optional[str]:
        if not url:
            return None
        try:
            p = urlparse(url)
        except Exception:
            return None
        host = (p.netloc or "").lower()
        path = p.path or ""
        if "youtube.com" not in host and "youtu.be" not in host:
            return None
        video_id = None
        if "youtu.be" in host:
            video_id = path.lstrip("/").split("/")[0] or None
        else:
            if path.startswith("/watch"):
                video_id = (parse_qs(p.query or {}).get("v") or [None])[0]
            else:
                parts = [s for s in path.split("/") if s]
                if len(parts) >= 2 and parts[0] in {"embed", "v", "shorts"}:
                    video_id = parts[1]
        return f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg" if video_id and str(video_id).strip() else None
