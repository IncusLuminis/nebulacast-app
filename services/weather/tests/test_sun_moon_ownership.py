from __future__ import annotations

import sys
from pathlib import Path

_service_root = Path(__file__).resolve().parent.parent
if str(_service_root) not in sys.path:
    sys.path.insert(0, str(_service_root))

from pipelines.fetch_weather import (
    _is_static_sun_moon_for_warsaw,
)


def _payload(**overrides: object) -> dict:
    payload = {
        "schema": "sun_moon.v2",
        "ownership": {"kind": "static", "location_id": "default-warsaw"},
        "site": {"lat": 52.2297, "lon": 21.0122},
        "frames": [],
    }
    payload.update(overrides)
    return payload


def test_static_payload_requires_explicit_warsaw_ownership() -> None:
    assert _is_static_sun_moon_for_warsaw(_payload())


def test_static_payload_rejects_other_location() -> None:
    assert not _is_static_sun_moon_for_warsaw(
        _payload(site={"lat": -42.8826, "lon": 147.325}),
    )


def test_static_payload_rejects_legacy_unmarked_schema() -> None:
    assert not _is_static_sun_moon_for_warsaw(
        _payload(schema=None, ownership=None),
    )
