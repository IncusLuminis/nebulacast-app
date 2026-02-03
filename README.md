# nebulacast.app

Repository for nebulacast.app services and sites. Independent services live under `services/`; deployable sites under `sites/`.

## News service (RSS)

The **news** service aggregates astronomy/space RSS feeds, scores and filters them, and produces a public RSS feed compatible with `https://news.nebulacast.app/rss.xml`.

### Generate RSS

**Запускается только один скрипт** — `run_news.py` (он сам вызывает pipeline и render_rss). Из корня репо:

```bash
python services/news/pipelines/run_news.py
```

This reads `services/news/configs/sources.yaml` and `services/news/configs/rules.yaml`, runs the pipeline, and writes all artifacts to:

- **`sites/staging/news/rss.xml`** — единственный артефакт news в publish-root (Cloudflare Pages деплоит только `sites/staging/`).

### Local server

Serve the staging site (same root as production deploy):

```bash
make server
# или: bash infra/scripts/serve_local.sh
```

Document root = **`sites/staging/`**. Then open:

- **Index:** http://localhost:8080/
- **News RSS:** http://localhost:8080/news/rss.xml
- **News page:** http://localhost:8080/news/index.html
- Alerts/astro-weather — когда появятся сервисы: `/alerts/rss.xml`, `/astro-weather/daily_astro_weather.json`

### Frontend (статика)

Генерация HTML/JS/CSS в `sites/staging/` одним скриптом:

```bash
make news-front
# или: python frontend/build.py
```

Полный прогон (бекенд + фронт): `make news`. Только бекенд: `make news-back`.

Входы: `frontend/config/widgets.yaml`, `frontend/templates/**`, `frontend/assets/**`.  
Выход: `sites/staging/index.html`, `sites/staging/news/index.html`, `sites/staging/news/widget.js`, `sites/staging/assets/**`.

Виджет для Blogger: подключать `https://your-domain/news/widget.js` — скрипт сам создаёт контейнер и рендерит ленту (разметка и стили как в исходном widget_blogger.html).

### Tests

Install dependencies and pytest, then run from repo root:

```bash
pip install -r services/news/requirements.txt
pip install pytest
PYTHONPATH=services/news pytest services/news/tests/ -v
```

- **Unit test:** `test_render_rss_generates_valid_rss` — generates RSS from a minimal record list (no network).
- **Smoke test:** `test_smoke_run_news_produces_rss` — runs the full pipeline and checks that `sites/staging/news/rss.xml` exists and contains `<rss` and `<item>` (requires network).
