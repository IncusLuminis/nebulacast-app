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

## News service (Phase A: Lift & Shift)

Migrated from the former AG_news_radar agent. Single public artifact: `services/news/public/rss.xml`. No change to RSS format, scoring, or filtering at this stage.
