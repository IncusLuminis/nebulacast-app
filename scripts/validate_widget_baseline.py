#!/usr/bin/env python3
"""Run the read-only local smoke portion of the Issue #67 baseline matrix."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ROUTES = {
    "Console": "/",
    "Weather": "/weather/",
    "Sky": "/sky/",
    "News": "/news/",
    "Calendar": "/calendar/",
}

EXPECTED_ROUTE_FILES = {
    "/": "sites/staging/index.html",
    "/weather/": "sites/staging/weather/index.html",
    "/sky/": "sites/staging/sky/index.html",
    "/news/": "sites/staging/news/index.html",
    "/calendar/": "sites/staging/calendar/index.html",
}


def fail(message: str) -> None:
    raise RuntimeError(message)


def check_inventory(repo_root: Path) -> None:
    path = repo_root / "docs/Architecture/WIDGET_INVENTORY.json"
    if not path.is_file():
        fail(f"missing Issue #66 inventory: {path}")
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("story") != "#66":
        fail("Issue #66 inventory is not the configured source of truth")
    if data.get("canonical_deploy_root") != "sites/staging":
        fail("Issue #66 inventory must use sites/staging as deploy root")
    for widget in data.get("widgets", []):
        source = widget.get("source_of_truth")
        if not isinstance(source, str) or not (repo_root / source).exists():
            fail(f"inventory source_of_truth is missing: {source}")


def check_local_files(repo_root: Path) -> None:
    for route, relative_path in EXPECTED_ROUTE_FILES.items():
        path = repo_root / relative_path
        if not path.is_file():
            fail(f"route {route}: missing local file {relative_path}")


def check_route(base_url: str, label: str, route: str) -> None:
    url = base_url.rstrip("/") + route
    request = Request(url, headers={"User-Agent": "nebulacast-widget-baseline/1"})
    try:
        with urlopen(request, timeout=10) as response:
            status = response.status
            body = response.read(4096)
    except HTTPError as exc:
        fail(f"{label} {route}: HTTP {exc.code} {exc.reason}")
    except URLError as exc:
        fail(f"{label} {route}: local server unavailable: {exc.reason}")
    if status != 200:
        fail(f"{label} {route}: expected HTTP 200, got {status}")
    if not body or b"<html" not in body.lower():
        fail(f"{label} {route}: response is not an HTML document")
    print(f"PASS {label}: {route} -> HTTP {status}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:8080")
    args = parser.parse_args()
    repo_root = Path(__file__).resolve().parents[1]
    try:
        check_inventory(repo_root)
        check_local_files(repo_root)
        for label, route in ROUTES.items():
            check_route(args.base_url, label, route)
    except (OSError, RuntimeError, ValueError, json.JSONDecodeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    print("OK Issue #67 local route smoke matrix: 5 surfaces served from sites/staging")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
