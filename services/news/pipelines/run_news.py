#!/usr/bin/env python3
"""
Entrypoint: run news pipeline and write services/news/public/rss.xml.
Run from repo root or with PYTHONPATH including the service root (services/news).

  python services/news/pipelines/run_news.py
  # or from nebulacast.app root with PYTHONPATH=services/news:
  python -m pipelines.run_news
"""
from __future__ import annotations

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

    run_agent(service_root)

    outputs_dir = service_root / "outputs"
    rss_path = service_root / "public" / "rss.xml"
    try:
        render_from_outputs(
            outputs_dir,
            rss_path,
            base_url="https://news.nebulacast.app/",
            max_items=60,
            sources_yaml_path=configs / "sources.yaml",
        )
    except FileNotFoundError as e:
        print(f"ERROR: {e}")
        return 1

    feed_count = 0
    item_count = 0
    if rss_path.exists():
        text = rss_path.read_text(encoding="utf-8")
        if "<rss" in text:
            feed_count = 1
        item_count = text.count("<item>")
    print(f"Feeds: {feed_count} | Items in RSS: {item_count} | Output: {rss_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
