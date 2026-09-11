#!/usr/bin/env python3
"""Validate the auditable route composition descriptor for Story #98."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


EXPECTED_ROUTES = {"/", "/weather/", "/sky/", "/helio/", "/map/", "/calendar/", "/sun/"}
EXPECTED_CLASSIFICATIONS = {"runtime_widget", "host_shell", "temporary_adapter"}
EXPECTED_PUBLIC_MODES = {
    "square": ("square",),
    "oriented": ("horizontal", "vertical"),
}
REQUIRED_SURFACE_FIELDS = (
    "id",
    "label",
    "registry_type",
    "registry_registered",
    "root_or_slot",
    "platform_context",
    "authoritative_source",
    "compatibility_route",
    "classification",
    "target_classification",
    "layout",
    "current_owner",
)


def fail(message: str) -> None:
    raise ValueError(message)


def require_file(repo_root: Path, value: str, field: str) -> None:
    if not isinstance(value, str) or not value:
        fail(f"{field} must be a non-empty repository path")
    if not (repo_root / value).exists():
        fail(f"{field}: path does not exist: {value}")


def load_json(path: Path, label: str):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"invalid {label}: {exc}")


def validate(descriptor_path: Path, inventory_path: Path | None = None) -> None:
    repo_root = descriptor_path.parents[2]
    data = load_json(descriptor_path, "route descriptor")

    if data.get("schema_version") != "1.0":
        fail("schema_version must be 1.0")
    if data.get("story") != "#98":
        fail("descriptor must belong to Story #98")
    if data.get("canonical_deploy_root") != "sites/staging":
        fail("canonical_deploy_root must be sites/staging")
    require_file(repo_root, data.get("registry_source"), "registry_source")

    contract = data.get("public_layout_contract")
    if not isinstance(contract, dict):
        fail("public_layout_contract must be an object")
    if contract.get("sky", {}).get("public_modes") != ["square"]:
        fail("Sky public mode must be exactly square")
    oriented = contract.get("oriented_widget", {})
    if oriented.get("public_modes") != ["horizontal", "vertical"]:
        fail("oriented widgets must expose exactly horizontal and vertical")
    if contract.get("auto", {}).get("public") is not False:
        fail("auto must not be public")

    inventory_path = inventory_path or repo_root / "docs/Architecture/WIDGET_INVENTORY.json"
    inventory = load_json(inventory_path, "widget inventory")
    inventory_types = {item.get("id") for item in inventory.get("widgets", [])}

    routes = data.get("routes")
    if not isinstance(routes, list) or {route.get("path") for route in routes} != EXPECTED_ROUTES:
        fail(f"routes must contain exactly {sorted(EXPECTED_ROUTES)}")
    if len(routes) != len(EXPECTED_ROUTES):
        fail("routes must not contain duplicates")

    seen_surface_ids: set[str] = set()
    for route in routes:
        if not isinstance(route, dict):
            fail("every route must be an object")
        path = route.get("path")
        if not isinstance(route.get("page"), str) or not route["page"]:
            fail(f"{path}: page must be non-empty")
        host = route.get("host")
        if not isinstance(host, dict):
            fail(f"{path}: host must be an object")
        require_file(repo_root, host.get("source"), f"{path}.host.source")
        if host.get("classification") != "host_shell":
            fail(f"{path}.host must be classified as host_shell")
        if not isinstance(host.get("root"), str) or not host["root"]:
            fail(f"{path}.host.root must be non-empty")
        if not isinstance(route.get("platform_context"), str) or not route["platform_context"]:
            fail(f"{path}: platform_context must be non-empty")

        surfaces = route.get("visible_surfaces")
        if not isinstance(surfaces, list) or not surfaces:
            fail(f"{path}: visible_surfaces must be non-empty")
        for surface in surfaces:
            if not isinstance(surface, dict):
                fail(f"{path}: every surface must be an object")
            missing = [field for field in REQUIRED_SURFACE_FIELDS if field not in surface]
            if missing:
                fail(f"{path}: surface missing fields: {', '.join(missing)}")
            surface_id = surface["id"]
            if not isinstance(surface_id, str) or not surface_id:
                fail(f"{path}: surface id must be non-empty")
            if surface_id in seen_surface_ids:
                fail(f"duplicate surface id: {surface_id}")
            seen_surface_ids.add(surface_id)
            if surface["classification"] not in EXPECTED_CLASSIFICATIONS:
                fail(f"{surface_id}: invalid classification")
            if surface["target_classification"] not in EXPECTED_CLASSIFICATIONS:
                fail(f"{surface_id}: invalid target_classification")
            if not isinstance(surface["registry_registered"], bool):
                fail(f"{surface_id}: registry_registered must be boolean")
            registry_type = surface["registry_type"]
            if registry_type is not None and (not isinstance(registry_type, str) or not registry_type):
                fail(f"{surface_id}: registry_type must be a string or null")
            if surface["registry_registered"] and registry_type not in inventory_types:
                fail(f"{surface_id}: registered type is absent from inventory: {registry_type}")
            if surface["classification"] == "runtime_widget" and not surface["registry_registered"]:
                fail(f"{surface_id}: runtime_widget must be registered")
            root_or_slot = surface["root_or_slot"]
            if not isinstance(root_or_slot, dict) or not isinstance(root_or_slot.get("root"), str) or not root_or_slot["root"]:
                fail(f"{surface_id}: root_or_slot.root must be non-empty")
            if root_or_slot.get("slot") is not None and not isinstance(root_or_slot["slot"], str):
                fail(f"{surface_id}: root_or_slot.slot must be a string or null")
            if not isinstance(surface["platform_context"], str) or not surface["platform_context"]:
                fail(f"{surface_id}: platform_context must be non-empty")
            require_file(repo_root, surface["authoritative_source"], f"{surface_id}.authoritative_source")
            if not isinstance(surface["compatibility_route"], list) or any(not isinstance(item, str) or not item for item in surface["compatibility_route"]):
                fail(f"{surface_id}: compatibility_route must be an array of non-empty strings")
            layout = surface["layout"]
            if registry_type is None:
                if layout is not None:
                    fail(f"{surface_id}: host shell layout must be null")
                continue
            if not isinstance(layout, dict) or layout.get("shape") not in EXPECTED_PUBLIC_MODES:
                fail(f"{surface_id}: widget layout must declare square or oriented shape")
            expected_modes = list(EXPECTED_PUBLIC_MODES[layout["shape"]])
            if layout.get("public_modes") != expected_modes:
                fail(f"{surface_id}: public modes must be {expected_modes}")
            if "auto" in layout["public_modes"]:
                fail(f"{surface_id}: auto is forbidden in public_modes")
            if registry_type == "sky" and layout["shape"] != "square":
                fail(f"{surface_id}: Sky must be square")
            if registry_type != "sky" and layout["shape"] != "oriented":
                fail(f"{surface_id}: non-Sky widgets must be oriented")

    applications = data.get("excluded_host_applications")
    if not isinstance(applications, list):
        fail("excluded_host_applications must be an array")
    for app in applications:
        if not isinstance(app, dict):
            fail("every excluded application must be an object")
        for field in ("id", "route", "root", "source", "reason"):
            if not isinstance(app.get(field), str) or not app[field]:
                fail(f"excluded application {app.get('id')}: {field} must be non-empty")
        if app.get("classification") != "host_shell":
            fail(f"excluded application {app.get('id')}: must be host_shell")
        require_file(repo_root, app["source"], f"excluded application {app['id']}.source")

    print(f"OK {descriptor_path}: {len(routes)} routes, {len(seen_surface_ids)} visible surfaces, layout and ownership checks passed")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("descriptor", nargs="?", default="docs/Architecture/CONSOLE_ROUTE_COMPOSITION.json", type=Path)
    args = parser.parse_args()
    try:
        validate(args.descriptor.resolve())
    except (OSError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
