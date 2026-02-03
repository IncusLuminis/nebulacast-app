# Data contracts

## News service

- **Input:** RSS feeds and options defined in `services/news/configs/sources.yaml`; rules in `services/news/configs/rules.yaml`.
- **Output:** `services/news/public/rss.xml` — RSS 2.0 feed, compatible with `https://news.nebulacast.app/rss.xml`.
- **Internal:** Pipeline writes intermediate data under `services/news/outputs/` (e.g. `daily_signal.json`, `archive.jsonl`). These are local only and not part of the public contract.
