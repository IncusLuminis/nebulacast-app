# nebulacast.app

Repository for nebulacast.app services and sites. Independent services live under `services/`; deployable sites under `sites/`.

## News service (RSS)

The **news** service aggregates astronomy/space RSS feeds, scores and filters them, and produces a public RSS feed compatible with `https://news.nebulacast.app/rss.xml`.

### Generate RSS

From the repo root:

```bash
python services/news/pipelines/run_news.py
```

This reads `services/news/configs/sources.yaml` and `services/news/configs/rules.yaml`, runs the pipeline, and writes:

- `services/news/public/rss.xml` — public RSS feed for deploy.

### Local server

To serve the repo locally and open the RSS in a browser:

```bash
bash infra/scripts/serve_local.sh
```

Then open:

- **RSS:** http://localhost:8080/services/news/public/rss.xml

The script runs `python -m http.server 8080` from the repository root.

### Tests

Install dependencies and pytest, then run from repo root:

```bash
pip install -r services/news/requirements.txt
pip install pytest
PYTHONPATH=services/news pytest services/news/tests/ -v
```

- **Unit test:** `test_render_rss_generates_valid_rss` — generates RSS from a minimal record list (no network).
- **Smoke test:** `test_smoke_run_news_produces_rss` — runs the full pipeline and checks that `services/news/public/rss.xml` exists and contains `<rss` and `<item>` (requires network).
