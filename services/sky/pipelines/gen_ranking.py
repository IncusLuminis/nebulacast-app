from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Tuple

import yaml

# -----------------------------
# CONFIG
# -----------------------------
SRC_OBJECTS_FILENAME = "objects_today.json"
OUT_RANKING_FILENAME = "ranking.json"
RULES_FILENAME = "rules.yml"

# -----------------------------
# Paths
# services/sky/pipelines/gen_ranking.py
# -> project root is 4 levels up
# -----------------------------
PROJECT_ROOT = Path(__file__).resolve().parents[3]

SERVICES_DATA_DIR = PROJECT_ROOT / "services" / "sky" / "data" / "generated"
STAGING_DATA_DIR = PROJECT_ROOT / "sites" / "staging" / "sky" / "data"
RULES_PATH = PROJECT_ROOT / "services" / "sky" / "pipelines" / "yml" / RULES_FILENAME

SRC_OBJECTS_PATH = SERVICES_DATA_DIR / SRC_OBJECTS_FILENAME
OUT_RANKING_PATHS = [
    SERVICES_DATA_DIR / OUT_RANKING_FILENAME,
    STAGING_DATA_DIR / OUT_RANKING_FILENAME,
]

# -----------------------------
# Types
# -----------------------------
Key = Tuple[str, str]  # (group, id)


@dataclass(frozen=True)
class RankingCfg:
    total_top: int
    quotas: Dict[str, int]
    order: List[str]
    reserve: Dict[str, int]


# -----------------------------
# IO helpers
# -----------------------------
def read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def read_yaml(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data if isinstance(data, dict) else {}


# -----------------------------
# Normalization
# -----------------------------
def norm_group(item: Dict[str, Any]) -> str:
    return str(item.get("group", "")).strip().lower()


def norm_id(item: Dict[str, Any]) -> str:
    return str(item.get("id") or item.get("name") or "").strip()


def key_of(item: Dict[str, Any]) -> Key:
    return norm_group(item), norm_id(item)


def score_of(item: Dict[str, Any]) -> float:
    for k in ("score", "score_total", "rank_score"):
        v = item.get(k)
        if isinstance(v, (int, float)):
            return float(v)

    alt = item.get("altDeg")
    if isinstance(alt, (int, float)):
        return float(alt)

    return 0.0


# -----------------------------
# Config loader
# -----------------------------
def load_ranking_cfg(rules: Dict[str, Any]) -> RankingCfg:
    r = rules.get("ranking", {})

    total_top = int(r.get("total_top", 7))

    quotas = {
        k.lower(): int(v)
        for k, v in (r.get("quotas", {}) or {}).items()
    }

    if not quotas:
        quotas = {"planets": 2, "dso": 5, "events": 1, "alerts": 1}

    order = [s.lower() for s in r.get("order", ["alerts", "events", "planets", "dso"])]

    reserve = {
        k.lower(): int(v)
        for k, v in (r.get("reserve", {}) or {}).items()
    }

    if not reserve:
        reserve = {"alerts": 1, "events": 1}

    return RankingCfg(
        total_top=max(1, total_top),
        quotas=quotas,
        order=order,
        reserve=reserve,
    )


# -----------------------------
# Ranking logic
# -----------------------------
def build_ranking(items: List[Dict[str, Any]], cfg: RankingCfg) -> List[Dict[str, Any]]:
    by_key: Dict[Key, Dict[str, Any]] = {}
    buckets: Dict[str, List[Dict[str, Any]]] = {}

    for it in items:
        g, i = key_of(it)
        if not g or not i:
            continue
        by_key[(g, i)] = it
        buckets.setdefault(g, []).append(it)

    for lst in buckets.values():
        lst.sort(key=lambda x: (-score_of(x), x.get("name", "")))

    picked: List[Dict[str, Any]] = []
    used: Dict[str, int] = {}
    used_keys: set[Key] = set()

    def pick(group: str, limit: int):
        if limit <= 0:
            return
        quota = cfg.quotas.get(group, 0)
        if quota <= used.get(group, 0):
            return

        for it in buckets.get(group, []):
            if len(picked) >= cfg.total_top:
                break
            k = key_of(it)
            if k in used_keys:
                continue
            picked.append(it)
            used_keys.add(k)
            used[group] = used.get(group, 0) + 1
            limit -= 1
            if limit <= 0:
                break

    # reserved slots first
    for g, n in cfg.reserve.items():
        pick(g, n)

    # fill by order
    for g in cfg.order:
        if len(picked) >= cfg.total_top:
            break
        pick(g, cfg.quotas.get(g, 0))

    return picked[: cfg.total_top]


# -----------------------------
# Main
# -----------------------------
def main() -> None:
    if not SRC_OBJECTS_PATH.exists():
        raise RuntimeError(f"Source file not found: {SRC_OBJECTS_PATH}")

    if not RULES_PATH.exists():
        raise RuntimeError(f"Rules file not found: {RULES_PATH}")

    src = read_json(SRC_OBJECTS_PATH)
    items = src.get("items")
    if not isinstance(items, list):
        raise RuntimeError("objects_today.json must contain 'items' list")

    rules = read_yaml(RULES_PATH)
    cfg = load_ranking_cfg(rules)

    ranking_items = build_ranking(items, cfg)

    # hard subset validation
    src_keys = {key_of(it) for it in items}
    for it in ranking_items:
        if key_of(it) not in src_keys:
            raise RuntimeError("Ranking contains item not present in objects_today.json")

    payload = {
        "meta": {
            "source": SRC_OBJECTS_FILENAME,
            "count": len(ranking_items),
            "total_top": cfg.total_top,
            "quotas": cfg.quotas,
        },
        "items": ranking_items,
    }

    for out_path in OUT_RANKING_PATHS:
        write_json(out_path, payload)
        print(f"[ok] wrote: {out_path}")

    print(f"[ok] ranking ready: {len(ranking_items)} items")


if __name__ == "__main__":
    main()