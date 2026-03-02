# Shared service — documentation

Common utilities used by news and calendar pipelines.

## Overview

- **Module**: `shared.rss_helpers`
- **Used by**: `news/pipelines/render_rss.py`, `news/pipelines/rss_adapter.py`, `calendar/pipelines/render_rss.py`, `calendar/pipelines/rss_adapter.py`

## Functions

| Function | Description |
|----------|-------------|
| `clean_snippet(text_or_html, limit=220)` | Strip HTML, unescape, truncate at word boundary |
| `rfc822_date(dt)` | Format datetime for RSS pubDate |
| `parse_date(date_str)` | Parse ISO date to UTC datetime |
| `extract_first_image_url(html)` | Extract first img src from HTML |
| `strip_html_to_text(html)` | Convert HTML to plain text |
| `first_paragraph(text, max_chars=260)` | First paragraph, truncated at word boundary |

## PYTHONPATH

News and calendar require `PYTHONPATH=services/<name>:services` to resolve `shared`.
