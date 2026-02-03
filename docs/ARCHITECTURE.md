# Architecture

nebulacast.app is organized around independent services and static sites.

## Layout

- **services/** — Backend services (news RSS, future: alerts, etc.). Each service has its own configs, pipelines, and public outputs.
- **sites/** — Deployable static sites (e.g. staging).
- **infra/scripts/** — Scripts for local run and deploy (e.g. `serve_local.sh`).
- **docs/** — Architecture and data contracts.

## Services

Each service under `services/<name>/` is self-contained:

- **configs/** — YAML config (sources, rules).
- **pipelines/** — Entrypoints and steps (e.g. `run_news.py`, `render_rss.py`).
- **outputs/** — Local artifacts (gitignored).
- **public/** — Generated artifacts intended for deploy (e.g. `rss.xml`).
- **tests/** — Service tests.

## Publish root: sites/staging/

Cloudflare Pages деплоит только **sites/staging/**; все публикуемые артефакты (RSS, JSON, assets) должны попадать туда:

- **sites/staging/news/** — news pipeline (rss.xml, daily_*.json, …)
- **sites/staging/alerts/** — alerts RSS (когда будет сервис)
- **sites/staging/astro-weather/** — daily_astro_weather.json (когда будет)
- **sites/staging/index.html**, **sites/staging/assets/** — UI и иконки

Локальный сервер поднимается из `sites/staging/` на :8080; источники в index — относительные (`/news/rss.xml`, `/alerts/rss.xml`, `/astro-weather/daily_astro_weather.json`).

## News service (Phase A)

Миграция из AG_news_radar. Все артефакты пишутся в `sites/staging/news/`. Формат RSS и логика скоринга без изменений.
