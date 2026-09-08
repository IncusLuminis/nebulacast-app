"""
Shared RSS helpers for news and calendar pipelines.
Used by render_rss.py and rss_adapter.py.
"""
from __future__ import annotations

import html
import re
from datetime import datetime, timezone
from typing import Optional

# -----------------------------
# render_rss helpers
# -----------------------------


def clean_snippet(text_or_html: str, limit: int = 220) -> str:
    """Strip HTML, unescape, truncate to limit chars at word boundary."""
    if not text_or_html:
        return ""
    text = re.sub(r"<[^>]+>", " ", text_or_html)
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= limit:
        return text
    truncated = text[:limit]
    last_space = truncated.rfind(" ")
    if last_space > limit * 0.6:
        truncated = truncated[:last_space]
    return truncated.rstrip(".,;:") + "..."


def rfc822_date(dt: datetime) -> str:
    """Format datetime for RSS pubDate / lastBuildDate."""
    return dt.strftime("%a, %d %b %Y %H:%M:%S GMT")


def parse_date(date_str: Optional[str]) -> datetime:
    """Parse ISO date string to UTC datetime. Returns now() on failure."""
    if not date_str:
        return datetime.now(timezone.utc)
    try:
        if "T" in date_str:
            dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        else:
            dt = datetime.fromisoformat(date_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except Exception:
        return datetime.now(timezone.utc)


# -----------------------------
# rss_adapter helpers (HTML -> text, images)
# -----------------------------

_IMG_RE = re.compile(r'<img[^>]+src=["\']([^"\']+)["\']', re.IGNORECASE)
_TAG_RE = re.compile(r"<[^>]+>")


def extract_first_image_url(html_str: str) -> Optional[str]:
    """Extract first img src URL from HTML."""
    if not html_str:
        return None
    m = _IMG_RE.search(html_str)
    if not m:
        return None
    url = (m.group(1) or "").strip()
    return url or None


def strip_html_to_text(html_str: str) -> str:
    """Convert HTML to plain text, preserving paragraph breaks."""
    if not html_str:
        return ""
    s = html.unescape(html_str)
    s = re.sub(r"</(p|div|br|li|h1|h2|h3|h4|h5|h6)>", "\n", s, flags=re.IGNORECASE)
    s = re.sub(r"<br\s*/?>", "\n", s, flags=re.IGNORECASE)
    s = _TAG_RE.sub("", s)
    s = re.sub(r"[ \t\r\f\v]+", " ", s)
    s = re.sub(r"\n\s*\n\s*\n+", "\n\n", s)
    return s.strip()


def first_paragraph(text: str, max_chars: int = 260) -> str:
    """Take first paragraph and truncate at word boundary if needed."""
    if not text:
        return ""
    parts = [p.strip() for p in text.split("\n\n") if p.strip()]
    s = parts[0] if parts else text.strip()
    s = re.sub(r"\s+", " ", s).strip()
    if len(s) <= max_chars:
        return s
    truncated = s[:max_chars]
    last_space = truncated.rfind(" ")
    if last_space > max_chars * 0.6:
        truncated = truncated[:last_space]
    return truncated.rstrip(".,;:") + "..."
