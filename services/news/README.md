# News service

Агрегация RSS-фидов (astronomy/space), скоринг и фильтрация. Все артефакты пишутся в **sites/staging/news/** (rss.xml, daily_*.json, archive.jsonl и т.д.). Cloudflare Pages деплоит только `sites/staging/`.

## Как запускать

**Запускается только один скрипт — точка входа:**

```bash
# из корня репо nebulacast.app
python services/news/pipelines/run_news.py
```

`pipeline.py` и `render_rss.py` **напрямую не запускаются** — их вызывает `run_news.py`.

## Зависимости между скриптами

```
run_news.py          ← единственная точка входа (её и нужно «пускать»)
    │
    ├─► pipeline.run_agent(service_root)
    │       читает configs/sources.yaml, configs/rules.yaml
    │       для каждого стрима (news, images, videos, nebulacast, science):
    │           ├─► rss_adapter: fetch + normalize (RSS → NewsRecord)
    │           ├─► фильтры, скоринг, дедуп
    │           └─► пишет в services/news/outputs/: daily_*.json, daily_signal.json, archive.jsonl, raw_*.jsonl, daily_signal.csv, run_news.log
    │
    └─► render_rss.render_from_outputs(outputs_dir, sites/staging/news/rss.xml)
            читает archive.jsonl из outputs/, применяет порядок (nebulacast_min_items)
            пишет только rss.xml в sites/staging/news/
```

### Кто кого импортирует

| Скрипт         | Импортирует |
|----------------|-------------|
| **run_news.py** | `pipelines.pipeline.run_agent`, `pipelines.render_rss.render_from_outputs` |
| **pipeline.py** | `pipelines.rss_adapter` (RssAdapter, RssConfig, RssFeed), `schema.models` (NewsRecord, ScoreBreakdownNews) |
| **rss_adapter.py** | `schema.models.NewsRecord`, `feedparser` |
| **render_rss.py** | только stdlib + `yaml` (для sources.yaml в render_from_outputs) |

### Внешние зависимости (pip)

- `PyYAML` — конфиги (pipeline, render_rss)
- `feedparser` — парсинг RSS (rss_adapter)
- `pydantic` — модели (schema.models)

Установка: `pip install -r services/news/requirements.txt`

## Что куда пишется

- **services/news/outputs/** (в .gitignore): `daily_*.json`, `daily_signal.json`, `archive.jsonl`, `raw_*.jsonl`, `daily_signal.csv`, **run_news.log** (лог прогона).
- **sites/staging/news/** (для деплоя): только **rss.xml**.

## Локальный просмотр

Сервер поднимается из **sites/staging/** (`make serve` или `bash infra/scripts/serve_local.sh`). Открыть: http://localhost:8080/ (index), http://localhost:8080/news/rss.xml (RSS).
