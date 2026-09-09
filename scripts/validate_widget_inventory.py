#!/usr/bin/env python3
"""Validate the frozen Story #66 widget inventory against the checkout."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


EXPECTED_WIDGETS = {
    "hero",
    "location",
    "weather",
    "sun-moon",
    "astro",
    "map",
    "sky",
    "news",
    "events",
    "alerts",
}
CLASSIFICATIONS = {"production", "legacy", "POC"}
REQUIRED_WIDGET_FIELDS = (
    "id",
    "classification",
    "source_of_truth",
    "generated_or_copied_artifacts",
    "build_path",
    "deploy_paths",
    "local_test_path",
    "compatibility_paths",
    "path_classification",
)


def fail(message: str) -> None:
    raise ValueError(message)


def validate_path(repo_root: Path, value: str, field: str, widget_id: str) -> None:
    path = repo_root / value
    if not path.exists():
        fail(f"{widget_id}.{field}: path does not exist: {value}")


def validate(manifest_path: Path) -> None:
    repo_root = manifest_path.parents[2]
    try:
        data = json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON: {exc}")

    if data.get("schema_version") != "1.0":
        fail("schema_version must be 1.0")
    if data.get("story") != "#66":
        fail("manifest must belong to Story #66")
    if data.get("canonical_deploy_root") != "sites/staging":
        fail("canonical_deploy_root must be sites/staging")
    if data.get("canonical_local_test") != "make server":
        fail("canonical_local_test must be make server")

    widgets = data.get("widgets")
    if not isinstance(widgets, list):
        fail("widgets must be an array")
    ids = [item.get("id") for item in widgets if isinstance(item, dict)]
    if set(ids) != EXPECTED_WIDGETS or len(ids) != len(EXPECTED_WIDGETS):
        fail(f"widgets must contain exactly {sorted(EXPECTED_WIDGETS)}")

    for widget in widgets:
        if not isinstance(widget, dict):
            fail("every widget entry must be an object")
        widget_id = widget.get("id")
        missing = [field for field in REQUIRED_WIDGET_FIELDS if field not in widget]
        if missing:
            fail(f"{widget_id}: missing fields: {', '.join(missing)}")
        if widget.get("classification") not in CLASSIFICATIONS:
            fail(f"{widget_id}: invalid classification")
        if not isinstance(widget["source_of_truth"], str) or not widget["source_of_truth"]:
            fail(f"{widget_id}: source_of_truth must be one non-empty path")
        if not isinstance(widget["build_path"], str) or not widget["build_path"]:
            fail(f"{widget_id}: build_path must be a non-empty string")
        if not isinstance(widget["local_test_path"], str) or "make server" not in widget["local_test_path"]:
            fail(f"{widget_id}: local_test_path must document make server")

        validate_path(repo_root, widget["source_of_truth"], "source_of_truth", widget_id)
        for field in ("generated_or_copied_artifacts", "deploy_paths", "compatibility_paths"):
            values = widget[field]
            if not isinstance(values, list) or any(not isinstance(value, str) for value in values):
                fail(f"{widget_id}.{field} must be an array of paths")
            for value in values:
                validate_path(repo_root, value, field, widget_id)

        classifications = widget["path_classification"]
        if not isinstance(classifications, list) or not classifications:
            fail(f"{widget_id}.path_classification must be a non-empty array")
        source_entries = [
            item for item in classifications
            if isinstance(item, dict) and item.get("path") == widget["source_of_truth"]
        ]
        if len(source_entries) != 1:
            fail(f"{widget_id}: source_of_truth must appear exactly once in path_classification")
        for item in classifications:
            if not isinstance(item, dict) or not isinstance(item.get("path"), str):
                fail(f"{widget_id}: invalid path_classification entry")
            if item.get("classification") not in CLASSIFICATIONS:
                fail(f"{widget_id}: invalid path classification for {item.get('path')}")
            validate_path(repo_root, item["path"], "path_classification", widget_id)

    if data.get("map_decision", {}).get("production_path") != "sites/staging/weather/map-poc.html":
        fail("map_decision.production_path must identify the supported production Map path")
    print(f"OK {manifest_path}: {len(widgets)} widgets, all ownership paths exist")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "manifest",
        nargs="?",
        default="docs/Architecture/WIDGET_INVENTORY.json",
        type=Path,
    )
    args = parser.parse_args()
    try:
        validate(args.manifest.resolve())
    except (OSError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
