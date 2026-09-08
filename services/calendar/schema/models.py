"""Minimal schema for calendar/alerts pipeline (NewsRecord + ScoreBreakdownNews)."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, HttpUrl


class ScoreBreakdownNews(BaseModel):
    topic_match: float = 0.0
    freshness: float = 0.0
    source_priority: float = 0.0
    signal_bonus: float = 0.0


class NewsRecord(BaseModel):
    id: str
    source: str
    stream: str = ""
    title: str
    url: HttpUrl | str
    published_at: Optional[datetime] = None
    discovered_at: datetime

    summary: Optional[str] = None
    content_text: Optional[str] = None
    summary_html: Optional[str] = None
    image_url: Optional[str] = None

    tags: List[str] = []
    score: float = 0.0
    score_breakdown: Optional[ScoreBreakdownNews] = None
    fingerprint: str = ""
