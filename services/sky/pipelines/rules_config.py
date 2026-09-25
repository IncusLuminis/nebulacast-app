"""Strict loader and normalized ranking configuration for Sky rules."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml


class RulesConfigError(ValueError):
    """Raised when rules.yml is ambiguous or incompatible with the pipeline."""


class _UniqueKeyLoader(yaml.SafeLoader):
    pass


def _construct_mapping(loader: _UniqueKeyLoader, node: yaml.MappingNode, deep: bool = False) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        if key in result:
            mark = key_node.start_mark
            raise RulesConfigError(f"duplicate key {key!r} at line {mark.line + 1}, column {mark.column + 1}")
        result[key] = loader.construct_object(value_node, deep=deep)
    return result


_UniqueKeyLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, _construct_mapping)


def _mapping(value: Any, name: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise RulesConfigError(f"{name} must be a mapping")
    return value


def _integer(value: Any, name: str, minimum: int = 0) -> int:
    if isinstance(value, bool):
        raise RulesConfigError(f"{name} must be an integer")
    try:
        parsed = int(value)
    except (TypeError, ValueError) as exc:
        raise RulesConfigError(f"{name} must be an integer") from exc
    if parsed < minimum:
        raise RulesConfigError(f"{name} must be >= {minimum}")
    return parsed


def load_rules(path: Path) -> dict[str, Any]:
    try:
        raw = yaml.load(path.read_text(encoding="utf-8"), Loader=_UniqueKeyLoader)
    except yaml.YAMLError as exc:
        raise RulesConfigError(f"invalid YAML in {path}: {exc}") from exc
    rules = _mapping(raw, "rules.yml")
    required = ("time", "scoring", "text", "groups", "ranking")
    missing = [name for name in required if name not in rules]
    if missing:
        raise RulesConfigError(f"rules.yml is missing top-level section(s): {', '.join(missing)}")
    for name in required:
        _mapping(rules[name], name)
    if "ranking" in rules["scoring"]:
        raise RulesConfigError("ranking must be a top-level section, not scoring.ranking")
    if "groups" in rules["text"]:
        raise RulesConfigError("groups must be a top-level section, not text.groups")
    return rules


def _canonical_group(value: str) -> str:
    value = value.strip().lower()
    return "calendar" if value in {"event", "events"} else value


def effective_ranking_config(rules: dict[str, Any]) -> dict[str, Any]:
    """Return the exact, canonical ranking settings consumed by the pipeline."""
    ranking = _mapping(rules.get("ranking"), "ranking")
    total_top = _integer(ranking.get("total_top", 7), "ranking.total_top", minimum=1)
    raw_quotas = _mapping(ranking.get("quotas", {}), "ranking.quotas")
    raw_reserve = _mapping(ranking.get("reserve", {}), "ranking.reserve")
    order = ranking.get("order", ["alerts", "calendar", "planets", "dso"])
    if not isinstance(order, list) or not all(isinstance(item, str) and item.strip() for item in order):
        raise RulesConfigError("ranking.order must be a non-empty list of group names")
    quotas = {_canonical_group(str(key)): _integer(value, f"ranking.quotas.{key}") for key, value in raw_quotas.items()}
    reserve = {_canonical_group(str(key)): _integer(value, f"ranking.reserve.{key}") for key, value in raw_reserve.items()}
    return {
        "total_top": total_top,
        "quotas": quotas or {"planets": 2, "dso": 5, "calendar": 1, "alerts": 1},
        "order": [_canonical_group(item) for item in order],
        "reserve": reserve or {"alerts": 1, "calendar": 1},
    }
