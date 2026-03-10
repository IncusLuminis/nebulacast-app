# Data contracts

## News service

- **Input:** RSS feeds and rules in `services/news/configs/sources.yaml` и `services/news/configs/rules.yaml`.
- **Output:** все артефакты в **sites/staging/news/** (в т.ч. `rss.xml` — RSS 2.0, совместимый с `https://news.nebulacast.app/rss.xml`).
- **Staging UI:** index.html в sites/staging берёт news по относительному пути `/news/rss.xml`.
