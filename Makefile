# nebulacast-app — top-level targets
# make news       — backend + frontend (full)
# make news-back  — only backend (RSS pipeline)
# make news-front — only frontend (HTML/JS)
# make server     — local HTTP server :8080

# Load .env if present (provides OWM_API_KEY etc.)
-include .env
export

.PHONY: news news-back news-front calendar calendar-back calendar-front weather weather-back weather-front sky sky-back helio helio-back weather-map weather-map-back server deps-news deps-calendar deps-weather deps-sky deps-helio test-news help functions functions-build

# Python: prefer venv if present
PYTHON ?= python
VENV_PY := .venv/bin/python
ifeq ($(wildcard .venv/bin/python),)
  RUN := $(PYTHON)
else
  RUN := $(VENV_PY)
endif

SERVICE_HELIO := services/helio
PYTHONPATH_HELIO := $(SERVICE_HELIO)

SERVICE_NEWS := services/news
SERVICE_CALENDAR := services/calendar
SERVICE_WEATHER := services/weather
SERVICE_SKY := services/sky
PYTHONPATH_NEWS := $(SERVICE_NEWS):services
PYTHONPATH_CALENDAR := $(SERVICE_CALENDAR):services
PYTHONPATH_WEATHER := $(SERVICE_WEATHER)
PYTHONPATH_SKY := $(SERVICE_SKY)

# Install news deps (run once)
deps-news:
	$(RUN) -m pip install -r $(SERVICE_NEWS)/requirements.txt

# Full news: backend + frontend
news: news-back news-front

# Only backend: pipeline → sites/staging/news/rss.xml
news-back:
	PYTHONPATH=$(PYTHONPATH_NEWS) $(RUN) $(SERVICE_NEWS)/pipelines/run_news.py

# Only frontend: sites/staging/index.html, news/index.html, news/widget.js, assets
news-front:
	$(RUN) frontend/build.py

# Rebuild Cloudflare Pages Functions (run after editing functions/*.ts; no npm ci)
functions:
	npm run build:functions

# Full: install deps + bundle (for CI / first time)
functions-build:
	npm ci
	npm run build:functions

# Local HTTP server (root = sites/staging)
server:
	bash infra/scripts/serve_local.sh

# Local dev server with API endpoints (astro-weather, geocode, revgeo)
# Uses same Python as other targets (respects .venv or PYTHON env var)
server-api:
	$(RUN) infra/scripts/dev_api_server.py 8080

test-news:
	PYTHONPATH=$(PYTHONPATH_NEWS) $(RUN) -m pytest $(SERVICE_NEWS)/tests/ -v

# Calendar (alerts): backend + frontend
deps-calendar:
	$(RUN) -m pip install -r $(SERVICE_CALENDAR)/requirements.txt

calendar-back:
	PYTHONPATH=$(PYTHONPATH_CALENDAR) $(RUN) $(SERVICE_CALENDAR)/pipelines/run_calendar.py

# Frontend for calendar (same build.py as news — generates index, news/, calendar/, assets/)
calendar-front:
	$(RUN) frontend/build.py

calendar: calendar-back calendar-front

# Weather: backend only (outputs + copy to sites/staging/weather/)
deps-weather:
	$(RUN) -m pip install -r $(SERVICE_WEATHER)/requirements.txt

weather-back:
	PYTHONPATH=$(PYTHONPATH_WEATHER) $(RUN) $(SERVICE_WEATHER)/pipelines/run_weather.py

weather-front: functions-build
	$(RUN) frontend/build.py

weather: weather-back weather-front

# Weather Map v1.1: 3 zoom profiles → data/clouds/{eu_wide,eu_central,local}/ + data/weather_map_now.json
weather-map-back:
	PYTHONPATH=$(PYTHONPATH_WEATHER) $(RUN) $(SERVICE_WEATHER)/pipelines/gen_weather_map.py

weather-map: weather-map-back

# Helio: space weather pipeline → sites/staging/data/helio_now.json
deps-helio:
	$(RUN) -m pip install -r $(SERVICE_HELIO)/requirements.txt

helio-back:
	PYTHONPATH=$(PYTHONPATH_HELIO) $(RUN) $(SERVICE_HELIO)/pipelines/gen_helio.py

helio: helio-back

# Sky: all pipelines (stars, constellations, milkyway, messier, sunmoon, planets, alerts, objects, ranking)
deps-sky:
	$(RUN) -m pip install -r $(SERVICE_SKY)/requirements.txt

sky-back:
	PYTHONPATH=$(PYTHONPATH_SKY) $(RUN) $(SERVICE_SKY)/pipelines/gen_all.py

sky: sky-back

help:
	@echo "Targets:"
	@echo "  make news       — backend + frontend (full)"
	@echo "  make news-back  — only backend (RSS pipeline)"
	@echo "  make news-front — only frontend (HTML/JS)"
	@echo "  make calendar   — calendar backend + frontend (alerts rss + calendar JSON + HTML/JS)"
	@echo "  make calendar-back  — calendar pipeline only (outputs → alerts/rss.xml, calendar/*.json)"
	@echo "  make calendar-front — frontend build only (index, calendar/index.html, calendar/widget.js, assets)"
	@echo "  make weather   — weather backend + frontend (outputs + sites/staging/weather/daily_weather.json)"
	@echo "  make weather-back  — weather pipeline only"
	@echo "  make weather-front — functions-build + frontend build (preserves index.html, weather/)"
	@echo "  make helio        — helio pipeline → sites/staging/data/helio_now.json"
	@echo "  make helio-back   — same (alias)"
	@echo "  make deps-helio   — install helio deps (run once)"
	@echo "  make sky          — sky pipelines (gen_all: stars, constellations, milkyway, messier, sunmoon, planets, alerts, objects, ranking)"
	@echo "  make sky-back     — sky pipelines only (gen_all.py)"
	@echo "  make functions    — rebuild Functions only (after editing functions/*.ts, before commit)"
	@echo "  make functions-build — npm ci + bundle Functions (for CI / first time)"
	@echo "  make server     — start local HTTP server on :8080"
	@echo "  make deps-news  — install news deps (run once)"
	@echo "  make deps-calendar — install calendar deps (run once)"
	@echo "  make deps-weather  — install weather deps (run once)"
	@echo "  make deps-sky     — install sky deps (run once)"
	@echo "  make test-news  — run news tests"
