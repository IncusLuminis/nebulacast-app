# News service — documentation

RSS aggregation, scoring, and rendering for astronomy/space feeds.

## Overview

- **Main README**: [../README.md](../README.md) — run instructions, pipeline flow, dependencies
- **Output**: `sites/staging/news/rss.xml`
- **Shared helpers**: `shared.rss_helpers` (clean_snippet, parse_date, rfc822_date, etc.)

## Pipeline flow

```
run_news.py
  ├─ pipeline.run_agent() → outputs/daily_*.json, archive.jsonl
  └─ render_rss.render_from_outputs() → sites/staging/news/rss.xml
```

Config: `configs/sources.yaml`, `configs/rules.yaml`.
