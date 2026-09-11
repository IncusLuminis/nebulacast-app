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
    "space-weather",
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
    "supporting_data_sources",
)
PATH_LIST_FIELDS = (
    "generated_or_copied_artifacts",
    "deploy_paths",
    "compatibility_paths",
    "supporting_data_sources",
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

        source_path = repo_root / widget["source_of_truth"]
        if not source_path.is_file():
            fail(f"{widget_id}.source_of_truth must be a file: {widget['source_of_truth']}")
        for field in PATH_LIST_FIELDS:
            values = widget[field]
            if not isinstance(values, list) or any(not isinstance(value, str) for value in values):
                fail(f"{widget_id}.{field} must be an array of paths")
            if field == "supporting_data_sources" and not values:
                fail(f"{widget_id}.supporting_data_sources must not be empty")
            for value in values:
                validate_path(repo_root, value, field, widget_id)

        classifications = widget["path_classification"]
        if not isinstance(classifications, list) or not classifications:
            fail(f"{widget_id}.path_classification must be a non-empty array")
        classified_paths = []
        source_entries = [
            item for item in classifications
            if isinstance(item, dict) and item.get("path") == widget["source_of_truth"]
        ]
        if len(source_entries) != 1:
            fail(f"{widget_id}: source_of_truth must appear exactly once in path_classification")
        if source_entries[0].get("classification") != widget["classification"]:
            fail(f"{widget_id}: source_of_truth classification must match widget classification")
        for item in classifications:
            if not isinstance(item, dict) or not isinstance(item.get("path"), str):
                fail(f"{widget_id}: invalid path_classification entry")
            if item["path"] in classified_paths:
                fail(f"{widget_id}: duplicate path_classification path: {item['path']}")
            classified_paths.append(item["path"])
            if item.get("classification") not in CLASSIFICATIONS:
                fail(f"{widget_id}: invalid path classification for {item.get('path')}")
            validate_path(repo_root, item["path"], "path_classification", widget_id)

    map_decision = data.get("map_decision")
    if not isinstance(map_decision, dict):
        fail("map_decision must be an object")
    map_widget = next(widget for widget in widgets if widget.get("id") == "map")
    map_classifications = {
        item["path"]: item["classification"]
        for item in map_widget["path_classification"]
    }

    production_path = map_decision.get("production_path")
    if production_path != "sites/staging/weather/map-poc.html":
        fail("map_decision.production_path must identify the supported production Map path")
    production_adapter = map_decision.get("production_adapter")
    if not isinstance(production_adapter, str) or not production_adapter:
        fail("map_decision.production_adapter must be a non-empty path")
    for field, value in (("production_path", production_path), ("production_adapter", production_adapter)):
        validate_path(repo_root, value, f"map_decision.{field}", "map")
        if map_classifications.get(value) != "production":
            fail(f"map_decision.{field} must be classified as production")

    compatibility_paths = map_decision.get("compatibility_paths")
    if not isinstance(compatibility_paths, list) or any(not isinstance(value, str) for value in compatibility_paths):
        fail("map_decision.compatibility_paths must be an array of paths")
    for value in compatibility_paths:
        validate_path(repo_root, value, "map_decision.compatibility_paths", "map")
        if value not in map_classifications:
            fail(f"map_decision.compatibility_paths path is not classified: {value}")

    non_production = map_decision.get("non_production_path")
    if not isinstance(non_production, dict):
        fail("map_decision.non_production_path must be an object")
    non_production_path = non_production.get("path")
    if not isinstance(non_production_path, str) or not non_production_path:
        fail("map_decision.non_production_path.path must be a non-empty path")
    if non_production.get("classification") != "POC":
        fail("map_decision.non_production_path.classification must be POC")
    validate_path(repo_root, non_production_path, "map_decision.non_production_path", "map")
    if map_classifications.get(non_production_path) != "POC":
        fail("map_decision.non_production_path must match the Map POC classification")

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
