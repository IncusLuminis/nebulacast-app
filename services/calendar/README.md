# Calendar (Sky Alerts) service

RSS-based calendar of amateur astronomy events: meteors, eclipses, conjunctions, occultations, comets. **No weather** — astro-weather is a separate service.

- **Input**: RSS feeds (e.g. in-the-sky.org), optional seed events from `data/seed_events.yaml`.
- **Output**: JSON in `services/calendar/outputs/` (intermediate); the same JSONs are copied to `sites/staging/calendar/` (e.g. `/calendar/daily_signal.json`). Public RSS at `sites/staging/alerts/rss.xml`.

## Run

From repo root (recommended — uses project `.venv` and has PyYAML/feedparser):

```bash
make deps-calendar   # once (installs into .venv)
make calendar        # or make calendar-back
```

If you run the script directly (e.g. from IDE), use the **same** Python that has the deps: either activate the venv first (`source .venv/bin/activate`) or run via `make calendar`. Otherwise you may get `ModuleNotFoundError: No module named 'yaml'` when the IDE uses system `python3` without the venv packages.

## Config

- `configs/sources.yaml` — RSS streams (meteors, eclipses, conjunctions, occultations, comets; observations optional). No `astro_weather` stream.
- `configs/rules.yaml` — ranking, freshness, categorization. No `ui.weather` usage.

## Data flow

1. Pipeline fetches RSS per stream, normalizes to `NewsRecord`, filters, scores, merges.
2. Writes `daily_<stream>.json` and unified `daily_signal.json` to `outputs/`.
3. `render_rss` reads `daily_signal.json`, generates `sites/staging/alerts/rss.xml` (no weather items).
4. All `daily_*.json` from `outputs/` are copied to `sites/staging/calendar/` for the frontend.

Frontend: widget **alerts** uses `/alerts/rss.xml`; calendar JSONs are at `/calendar/daily_signal.json`, `/calendar/daily_meteors.json`, etc. (see `frontend/config/widgets.yaml`).
