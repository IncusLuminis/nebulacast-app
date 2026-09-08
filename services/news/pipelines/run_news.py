#!/usr/bin/env python3
"""
Entrypoint: run news pipeline. JSON/CSV/log → services/news/outputs/, only rss.xml → sites/staging/news/.
Run from repo root or with PYTHONPATH including the service root (services/news).

  python services/news/pipelines/run_news.py
"""
from __future__ import annotations

import logging
import sys
from pathlib import Path

# Service root = parent of pipelines/
_service_root = Path(__file__).resolve().parent.parent
if str(_service_root) not in sys.path:
    sys.path.insert(0, str(_service_root))

from pipelines.pipeline import run_agent
from pipelines.render_rss import render_from_outputs


def main() -> int:
    service_root = Path(__file__).resolve().parent.parent
    configs = service_root / "configs"
    sources_yaml = configs / "sources.yaml"
    rules_yaml = configs / "rules.yaml"
    if not sources_yaml.exists():
        print(f"ERROR: {sources_yaml} not found")
        return 1
    if not rules_yaml.exists():
        print(f"ERROR: {rules_yaml} not found")
        return 1

    outputs_dir = service_root / "outputs"
    outputs_dir.mkdir(parents=True, exist_ok=True)
    log_path = outputs_dir / "run_news.log"
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        handlers=[
            logging.FileHandler(log_path, encoding="utf-8"),
            logging.StreamHandler(sys.stdout),
        ],
    )
    log = logging.getLogger(__name__)
    log.info("Outputs dir: %s | Log: %s", outputs_dir, log_path)

    run_agent(service_root)

    repo_root = service_root.parent.parent
    rss_path = repo_root / "sites" / "staging" / "news" / "rss.xml"
    try:
        render_from_outputs(
            outputs_dir,
            rss_path,
            base_url="https://news.nebulacast.app/",
            max_items=60,
            sources_yaml_path=configs / "sources.yaml",
        )
    except FileNotFoundError as e:
        log.error("%s", e)
        return 1

    feed_count = 0
    item_count = 0
    if rss_path.exists():
        text = rss_path.read_text(encoding="utf-8")
        if "<rss" in text:
            feed_count = 1
        item_count = text.count("<item>")
    log.info("Feeds: %s | Items in RSS: %s | Output: %s", feed_count, item_count, rss_path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
