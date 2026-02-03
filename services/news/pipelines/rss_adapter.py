from __future__ import annotations

import logging
import re
import html as html_lib
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from datetime import datetime, timezone
import xml.etree.ElementTree as ET
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse, parse_qs

import feedparser

from schema.models import NewsRecord

log = logging.getLogger(__name__)


# -----------------------------
# Helpers (HTML -> text, images)
# -----------------------------

_IMG_RE = re.compile(r'<img[^>]+src=["\']([^"\']+)["\']', re.IGNORECASE)
_TAG_RE = re.compile(r"<[^>]+>")

def extract_first_image_url(html: str) -> Optional[str]:
    if not html:
        return None
    m = _IMG_RE.search(html)
    if not m:
        return None
    url = (m.group(1) or "").strip()
    return url or None

def strip_html_to_text(html: str) -> str:
    if not html:
        return ""
    s = html_lib.unescape(html)
    s = re.sub(r"</(p|div|br|li|h1|h2|h3|h4|h5|h6)>", "\n", s, flags=re.IGNORECASE)
    s = re.sub(r"<br\s*/?>", "\n", s, flags=re.IGNORECASE)
    s = _TAG_RE.sub("", s)
    s = re.sub(r"[ \t\r\f\v]+", " ", s)
    s = re.sub(r"\n\s*\n\s*\n+", "\n\n", s)
    return s.strip()

def first_paragraph(text: str, max_chars: int = 400) -> str:
    if not text:
        return ""
    parts = [p.strip() for p in text.split("\n\n") if p.strip()]
    s = parts[0] if parts else text.strip()
    if len(s) > max_chars:
        s = s[:max_chars].rstrip() + "..."
    return s

_APOD_RE = re.compile(r"/ap(\d{2})(\d{2})(\d{2})\.html$")

def _parse_apod_published_at(url: str) -> datetime | None:
    m = _APOD_RE.search(url or "")
    if not m:
        return None
    yy, mm, dd = map(int, m.groups())
    year = 2000 + yy
    try:
        return datetime(year, mm, dd, 0, 0, 0, tzinfo=timezone.utc)
    except ValueError:
        return None

def _title_from_img_alt(summary_html: str) -> str:
    if not summary_html:
        return ""
    m = re.search(r'alt="([^"]+)"', summary_html, flags=re.IGNORECASE)
    return (m.group(1).strip() if m else "")


@dataclass
class RssFeed:
    name: str
    url: str


@dataclass
class RssConfig:
    enabled: bool = True
    feeds: List[RssFeed] = field(default_factory=list)
    max_items_per_feed: int = 50
    timeout_seconds: int = 20
    user_agent: str = "ai-agents/AG_news_radar"


class RssAdapter:
    SOURCE_NAME = "rss"

    def __init__(self, cfg: RssConfig) -> None:
        self.cfg = cfg

    def fetch_raw(self, stream_name: str = "") -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        ok_count = 0
        for feed in self.cfg.feeds:
            try:
                entries = self._fetch_one(feed)
                out.extend(entries)
                log.info("[RSS] OK   name=%s url=%s items=%s", feed.name, feed.url, len(entries))
                ok_count += 1
            except Exception as e:
                if isinstance(e, urllib.error.HTTPError):
                    err = f"HTTPError {e.code} {e.reason}"
                elif isinstance(e, urllib.error.URLError):
                    err = f"URLError {e.reason}"
                else:
                    err = str(e)
                log.info("[RSS] FAIL name=%s url=%s err=%s", feed.name, feed.url, err)
        if ok_count == 0:
            stream_label = stream_name or "unknown"
            log.warning("[RSS] STREAM %s FAILED: all feeds returned errors", stream_label)
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
        bozo = getattr(parsed, "bozo", False)
        if bozo:
            log.info("RSS feed: %s bozo: %s entries: %s", feed.name, bozo, len(parsed.entries))
            ex = getattr(parsed, "bozo_exception", None)
            if ex:
                log.debug("RSS bozo_exception: %s", ex)

        entries = parsed.entries or []
        if not entries:
            rdf_entries = self._parse_rdf_rss1(body)
            if rdf_entries:
                log.info("[RSS] RDF fallback parsed items=%s url=%s", len(rdf_entries), feed.url)
                entries = rdf_entries
        if self.cfg.max_items_per_feed and len(entries) > self.cfg.max_items_per_feed:
            entries = entries[: self.cfg.max_items_per_feed]

        out: List[Dict[str, Any]] = []
        for ent in entries:
            out.append({"feed_name": feed.name, "feed_url": feed.url, "entry": ent})
        return out

    def _parse_rdf_rss1(self, body: bytes) -> List[Dict[str, Any]]:
        try:
            root = ET.fromstring(body)
        except Exception:
            return []

        if not root.tag.endswith("RDF"):
            return []

        RSS1 = "http://purl.org/rss/1.0/"
        DC = "http://purl.org/dc/elements/1.1/"
        PRISM = "http://prismstandard.org/namespaces/basic/1.2/"
        RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#"

        def _parse_dt(s: str | None) -> Optional[datetime]:
            if not s:
                return None
            st = s.strip()
            if not st:
                return None
            if st.endswith("Z"):
                st = st[:-1] + "+00:00"
            try:
                dt = datetime.fromisoformat(st)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt.astimezone(timezone.utc)
            except Exception:
                return None

        out: List[Dict[str, Any]] = []
        for item in root.findall(f".//{{{RSS1}}}item"):
            title = item.findtext(f"{{{RSS1}}}title") or ""
            link = item.findtext(f"{{{RSS1}}}link") or ""
            if not link:
                link = item.attrib.get(f"{{{RDF}}}about", "") or ""
            summary = item.findtext(f"{{{RSS1}}}description") or ""
            pub = item.findtext(f"{{{DC}}}date") or ""
            if not pub:
                pub = item.findtext(f"{{{PRISM}}}publicationDate") or ""
            dt = _parse_dt(pub)
            ent: Dict[str, Any] = {
                "title": title,
                "link": link,
                "summary": summary,
                "description": summary,
            }
            if dt is not None:
                ent["published_parsed"] = dt.timetuple()
            out.append(ent)
        return out

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
            if (feed_name or "").lower() == "nasa_apod" and published_at is None:
                inferred = _parse_apod_published_at(url)
                if inferred is not None:
                    published_at = inferred

            summary_html = ""
            if ent.get("content") and isinstance(ent.get("content"), list) and ent["content"]:
                summary_html = str(ent["content"][0].get("value") or "").strip()
            if not summary_html:
                summary_html = str(ent.get("summary") or ent.get("description") or "").strip()

            if not title:
                recovered = _title_from_img_alt(summary_html)
                if recovered:
                    title = recovered

            image_url = self._extract_image_url(ent, summary_html)
            summary_text = first_paragraph(strip_html_to_text(summary_html), max_chars=420)
            content_text = strip_html_to_text(summary_html) if summary_html else None
            rid = self._make_id(feed_name, url, title)

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
                tags=[],
                score=0.0,
                score_breakdown=None,
                fingerprint="",
            )
            out.append(rec)
        return out

    def _make_id(self, feed_name: str, url: str, title: str) -> str:
        base = url.strip() or title.strip()
        if not base:
            base = "no-title"
        return f"{feed_name}:{base}"

    def _parse_published(self, ent: Dict[str, Any]) -> Optional[datetime]:
        t = ent.get("published_parsed") or ent.get("updated_parsed")
        if not t:
            return None
        try:
            dt = datetime(*t[:6], tzinfo=timezone.utc)
            return dt
        except Exception:
            return None

    def _extract_image_url(self, ent: Dict[str, Any], summary_html: str) -> Optional[str]:
        for key in ("media_content", "media_thumbnail"):
            mc = ent.get(key)
            if isinstance(mc, list) and mc:
                u = (mc[0].get("url") or "").strip()
                if u:
                    yt = self._youtube_thumb(u)
                    return yt or u
            if isinstance(mc, dict):
                u = (mc.get("url") or "").strip()
                if u:
                    yt = self._youtube_thumb(u)
                    return yt or u

        links = ent.get("links") or []
        if isinstance(links, list):
            for l in links:
                try:
                    rel = str(l.get("rel") or "").lower()
                    href = (l.get("href") or "").strip()
                    ltype = str(l.get("type") or "").lower()
                    if href and (rel == "enclosure") and ("image" in ltype):
                        yt = self._youtube_thumb(href)
                        return yt or href
                except Exception:
                    continue

        html_img = extract_first_image_url(summary_html)
        if html_img:
            yt = self._youtube_thumb(html_img)
            return yt or html_img
        return None

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
        video_id: Optional[str] = None
        if "youtu.be" in host:
            video_id = path.lstrip("/").split("/")[0] or None
        else:
            if path.startswith("/watch"):
                qs = parse_qs(p.query or "")
                video_id = (qs.get("v") or [None])[0]
            else:
                parts = [seg for seg in path.split("/") if seg]
                if len(parts) >= 2 and parts[0] in {"embed", "v", "shorts"}:
                    video_id = parts[1]
        if not video_id:
            return None
        video_id = video_id.strip()
        if not video_id:
            return None
        return f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
