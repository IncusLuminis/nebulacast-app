# Calendar (Sky Alerts) service — documentation

RSS-based calendar of amateur astronomy events: meteors, eclipses, conjunctions, occultations, comets.

## Overview

- **Main README**: [../README.md](../README.md) — run instructions, config, data flow
- **Output**: `sites/staging/alerts/rss.xml`, `sites/staging/calendar/*.json`
- **Shared helpers**: `shared.rss_helpers` (clean_snippet, parse_date, rfc822_date, etc.)

## Data flow

1. Pipeline fetches RSS per stream, normalizes to NewsRecord, filters, scores
2. Writes `daily_<stream>.json` and `daily_signal.json` to outputs/
3. `render_rss` generates `sites/staging/alerts/rss.xml`
4. JSONs copied to `sites/staging/calendar/` for frontend

Config: `configs/sources.yaml`, `configs/rules.yaml`.
