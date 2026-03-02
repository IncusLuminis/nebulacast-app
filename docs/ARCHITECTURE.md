# Architecture

This document describes the structure of the nebulacast-app repository: where things live, how backend and frontend run, how data flows, and what “staging” means.

---

## 1. Overview

The repo contains:

- **Backend services** (under `services/`) — Python pipelines that fetch or process data and write artifacts. Each service is independent (own config, deps, entrypoint).
- **Frontend build** (under `frontend/`) — A single build script that generates static HTML, JS, and CSS from templates and config. It does not run a server; it only produces files.
- **Staging site** (under `sites/staging/`) — The **single deploy root**: all public artifacts (RSS, JSON, HTML, assets) end up here. This directory is what gets deployed (e.g. Cloudflare Pages). Backend pipelines and the frontend build both write into it.
- **CI** (under `.github/workflows/`) — Scheduled cron jobs that run the backend pipelines and commit updated artifacts back into the repo.

There is no runtime server in the repo; deployment is static file hosting of `sites/staging/`.

---

## 2. Repository layout

```
nebulacast-app/
├── .github/workflows/     # GitHub Actions: cron jobs for news, calendar, weather backends
├── docs/                  # Architecture (this file), data contracts
├── frontend/              # Frontend build inputs (templates, assets, config)
├── infra/scripts/         # Dev/infra scripts (serve_local.sh, dev_api_server.py, init_sky.sh, run-api-astro-weather.js)
│   └── debug/             # Debug/experimental (heasarc_*, debug_grb_heasarc)
├── Makefile               # Top-level targets: news, calendar, weather, server, deps-*
├── services/              # Backend services (news, calendar, weather)
└── sites/
    └── staging/           # Deploy root: all public output (HTML, RSS, JSON, assets)
```

---

## 3. What is “staging” (sites/staging/)

**Staging** is the **publish root**: the only directory that is deployed as the site.

- **Path:** `sites/staging/`
- **Role:** Everything that must be publicly served (RSS feeds, JSON data, HTML pages, CSS, JS, icons) lives under this tree. The deployment target (e.g. Cloudflare Pages) is configured with document root = `sites/staging/`.
- **Who writes here:**
  - **Backend pipelines** write (or copy) their outputs here: e.g. `news/rss.xml`, `alerts/rss.xml`, `calendar/*.json`, `weather/daily_weather.json`.
  - **Frontend build** (`frontend/build.py`) generates `index.html`, `news/index.html`, `calendar/index.html`, `weather/index.html`, `assets/**`, and copies backend-produced JSON from `services/*/outputs/` when building so that widgets can load data from paths like `/calendar/daily_signal.json`, `/weather/daily_weather.json`.
- **URLs:** When the site is served from this root, paths are absolute from the root, e.g. `/news/rss.xml`, `/calendar/daily_signal.json`, `/weather/daily_weather.json`, `/assets/css/widget_news.css`.
- **Local dev:** `make server` (or `infra/scripts/serve_local.sh`) serves `sites/staging/` on port 8080 so you can test the same structure as production.

Staging is **not** a separate “environment”; it is the one output directory that both backend and frontend populate and that gets deployed.

---

## 4. Backend (services/)

Each service is self-contained under `services/<name>/`.

### 4.1 Common structure

- **configs/** — YAML configuration (sources, rules, location, thresholds).
- **pipelines/** — Python entrypoints and pipeline steps (e.g. `run_news.py`, `run_calendar.py`, `run_weather.py`).
- **outputs/** — Local working outputs (often gitignored). Pipelines write here first; some steps then copy or symlink into `sites/staging/` so the deploy root has the latest data.
- **requirements.txt** — Python dependencies for that service.
- **README.md** — How to run and what the service produces.

Backends are run from the **repo root** with `PYTHONPATH=services/<name>` (news/calendar add `:services` for shared RSS helpers) so that imports like `from pipelines.run_news import …` resolve.

### 4.2 News (`services/news/`)

- **Purpose:** Aggregate astronomy/space RSS feeds, score and filter items, produce a single RSS feed.
- **Config:** `configs/sources.yaml` (feed URLs), `configs/rules.yaml` (scoring, filters).
- **Entrypoint:** `pipelines/run_news.py` — runs the pipeline and writes `sites/staging/news/rss.xml` (and optionally other artifacts under `sites/staging/news/`).
- **Run:** `make news-back` or `PYTHONPATH=services/news:services python services/news/pipelines/run_news.py`.

### 4.3 Calendar (`services/calendar/`)

- **Purpose:** Process RSS feeds for events (meteors, eclipses, conjunctions, occultations, comets), produce per-stream and unified JSON, and an alerts RSS feed.
- **Config:** `configs/sources.yaml`, `configs/rules.yaml`.
- **Entrypoint:** `pipelines/run_calendar.py` — runs the pipeline, writes JSON under `services/calendar/outputs/`, renders RSS to `sites/staging/alerts/rss.xml`, and copies JSON to `sites/staging/calendar/` (e.g. `daily_signal.json`, `daily_meteors.json`).
- **Run:** `make calendar-back` or `PYTHONPATH=services/calendar:services python services/calendar/pipelines/run_calendar.py`.

### 4.4 Weather (`services/weather/`)

- **Purpose:** Fetch weather data (Open-Meteo + 7Timer), merge into hourly records, score with an additive (bonus) engine, produce JSON for the weather widget.
- **Config:** `configs/rules.yaml` (location, horizon_hours, thresholds).
- **Scoring:** `engine/score_engine.py` (additive v2); profiles in `scoring/*.yaml` (default, visual, photography, planetary).
- **Entrypoint:** `pipelines/run_weather.py` — calls `fetch_weather.build_weather_payload`, writes `services/weather/outputs/daily_weather.json`, copies it to `sites/staging/weather/daily_weather.json`.
- **Run:** `make weather-back` or `PYTHONPATH=services/weather python services/weather/pipelines/run_weather.py`.

### 4.5 Data flow (backend → staging)

- Pipelines produce artifacts under **service-local** dirs (e.g. `services/news/outputs/`, `services/calendar/outputs/`, `services/weather/outputs/`).
- They also **copy or write** the public-facing files into **sites/staging/** so that:
  - `sites/staging/news/rss.xml`
  - `sites/staging/alerts/rss.xml`, `sites/staging/calendar/*.json`
  - `sites/staging/weather/daily_weather.json`
  are always the outputs of the last pipeline run. The frontend build and the browser then load from these paths under the deploy root.

---

## 5. Frontend (frontend/)

The frontend is **static**: no Node server, no SSR. A single Python script generates all HTML, JS, and CSS from templates and config.

### 5.1 Layout

- **build.py** — Single entrypoint. Reads `config/widgets.yaml` and `templates/`, writes only under `sites/staging/` (and copies assets/icons into `sites/staging/assets/`).
- **config/widgets.yaml** — Site title, paths, and **widget definitions** (per-widget: enabled, title, data URL such as `rss` or `json`, filters, etc.).
- **templates/**  
  - **partials/** — Reusable fragments: widget markup (e.g. `widget_news.html`, `widget_calendar.html`), widget CSS, and JS logic templates (e.g. `widget_news_logic.js.tmpl`, `widget_calendar_logic.js.tmpl`).  
  - **pages/** — Full pages: `index.html`, `news.html`, `calendar.html`, `weather.html`. They include placeholders that build.py replaces with widget HTML and inline config/scripts.
- **assets/** — Static CSS and JS (e.g. `base.css`, `widget_weather.css`, `widget_runtime.js`) that build.py copies to `sites/staging/assets/`.

### 5.2 Build process

1. **Load config** — `widgets.yaml` → site title, `out_root` (e.g. `sites/staging`), and each widget’s data URLs and options.
2. **Copy assets** — `frontend/assets/**` → `sites/staging/assets/**` (CSS, JS). Icons under `sites/staging/assets/icons/` are kept or copied as needed.
3. **Copy backend data (optional)** — Build can copy from `services/*/outputs/` into `sites/staging/` (e.g. calendar JSON, weather JSON) so that a “frontend-only” build still has data to show if backends were run earlier.
4. **Generate pages** — For each page template, substitute placeholders (e.g. `{{WIDGET_NEWS_SECTION}}`, `{{WIDGET_CALENDAR_CONFIG_JSON}}`) with the widget HTML and script/config generated from partials and widget config. Output goes to `sites/staging/index.html`, `sites/staging/news/index.html`, `sites/staging/calendar/index.html`, `sites/staging/weather/index.html`.
5. **Generate widget bundles** — e.g. standalone `sites/staging/news/widget.js` for embedding (Blogger-style): it creates its own container and injects styles and logic.

**Run:** `make news-front`, `make calendar-front`, or `make weather-front` all invoke the same `python frontend/build.py`; the Makefile targets are aliases. Full frontend build is one command; which backends were run beforehand only affects what data is present under `sites/staging/`.

### 5.3 Widgets

A **widget** is a self-contained UI block that:

- Is configured in `frontend/config/widgets.yaml` (data URL, title, filters, etc.).
- Has markup and styles in `frontend/templates/partials/` (e.g. `widget_news.html` + `widget_news.css`) and optional JS logic (e.g. `widget_news_logic.js.tmpl`). Weather uses modular SPA at `/weather/` (iframe).
- Gets its data at runtime from the deploy root: e.g. `/news/rss.xml`, `/calendar/daily_signal.json`, `/weather/daily_weather.json` (paths defined in widgets.yaml and injected into the generated pages).

Widget types:

- **News** — Fetches RSS from `/news/rss.xml`, parses it, renders a filterable list. Used on the main index (News tab) and on the dedicated news page; also available as a standalone `news/widget.js` for embedding.
- **Calendar (Sky Alerts)** — Fetches JSON from `/calendar/daily_signal.json`, filters by category (METEORS, ECLIPSES, etc.), renders a calendar-style list. Used on the index (Calendar/Alerts tab) and on `calendar/index.html`.
- **Weather** — Modular SPA at `/weather/` (location, controls, weather, map, sun, sky tabs). Index Weather tab embeds it via iframe. Uses `/weather/daily_weather.json` and `/api/astro-weather`.

So: **widgets** are the building blocks of the UI; **widgets.yaml** defines where they get data (RSS or JSON under staging); the **frontend build** assembles pages and scripts from templates and this config.

---

## 6. Makefile and local usage

From repo root:

- **Backend only:** `make news-back`, `make calendar-back`, `make weather-back` — run the corresponding pipeline; outputs and copies go to `sites/staging/` as above.
- **Frontend only:** `make news-front` / `make calendar-front` / `make weather-front` — all run `frontend/build.py` (full frontend build).
- **Full run (backend + frontend):** `make news`, `make calendar`, `make weather`.
- **Dependencies:** `make deps-news`, `make deps-calendar`, `make deps-weather` — install the respective service’s `requirements.txt` (using repo’s `.venv` if present).
- **Local server:** `make server` — serves `sites/staging/` on port 8080.
- **Tests:** `make test-news` — runs news service tests.

The Makefile uses a single Python (preferring `.venv/bin/python` if present), and sets `PYTHONPATH` per service when running pipelines.

---

## 7. CI: GitHub Actions cron workflows

Three workflows under `.github/workflows/` run the backends on a schedule and commit updated artifacts:

- **cron-news.yml** — Runs news backend every 6 hours (UTC), then commits and pushes changes under `sites/staging/news/` and `services/news/outputs/`.
- **cron-calendar.yml** — Same for calendar; commits changes under `sites/staging/alerts/`, `sites/staging/calendar/`, and `services/calendar/outputs/`.
- **cron-weather.yml** — Same for weather; commits `sites/staging/weather/` and `services/weather/outputs/`.

Each workflow: checkout → setup Python → install service deps → run the service’s `run_*.py` → `git add` the relevant staging and output paths → if there are changes, pull rebase, commit (message includes `[skip ci]`), and push. This keeps the deployed content (staging) up to date with fresh data without a separate deploy step; deployment is just “serve the repo (or the branch that gets deployed), which now includes the latest staging files.”

---

## 8. Summary diagram

```
                    ┌─────────────────────────────────────────────────┐
                    │                  Repo root                       │
                    └─────────────────────────────────────────────────┘
                      │                    │                    │
         ┌────────────┴────────────┐      │      ┌──────────────┴──────────────┐
         │  services/news/         │      │      │  services/calendar/          │
         │  services/calendar/     │      │      │  services/weather/           │
         │  (configs, pipelines,    │      │      │  (configs, pipelines,         │
         │   outputs)               │      │      │   outputs, engine, scoring)  │
         └────────────┬────────────┘      │      └──────────────┬──────────────┘
                      │                    │                     │
                      │  run_*.py          │                     │
                      │  (writes/copies)   │                     │
                      ▼                    ▼                     ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │  sites/staging/   (deploy root)                           │
                    │  index.html, news/, calendar/, weather/, alerts/, assets/│
                    │  ← backends write RSS/JSON here                          │
                    └─────────────────────────────────────────────────────────┘
                      ▲
                      │  build.py (templates + widgets.yaml)
         ┌────────────┴────────────┐
         │  frontend/              │
         │  config/, templates/,   │
         │  assets/                │
         └─────────────────────────┘
```

- **Backend:** Services run from repo root with `PYTHONPATH=services/<name>`, write/copy into `sites/staging/`.
- **Frontend:** `frontend/build.py` reads `frontend/` and writes only into `sites/staging/`.
- **Staging:** Single tree that deployment serves; URLs are relative to this root (e.g. `/news/rss.xml`, `/weather/daily_weather.json`).

For data contracts and feed/JSON formats, see **docs/DATA_CONTRACTS.md**.
