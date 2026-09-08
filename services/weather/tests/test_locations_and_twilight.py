from __future__ import annotations

from datetime import date

from services.weather.pipelines.run_weather import (
    _format_location_id,
    LocationConfig,
    _compute_twilight_today,
)


def test_format_location_id_deterministic() -> None:
    lat = 52.2297
    lon = 21.0122
    loc_id = _format_location_id(lat, lon)
    assert loc_id == "loc_52.2297_21.0122"


def test_compute_twilight_today_does_not_crash() -> None:
    loc = LocationConfig(
        id="loc_52.2297_21.0122",
        name="Warsaw",
        lat=52.2297,
        lon=21.0122,
        tz="Europe/Warsaw",
        alt_m=None,
        source="test",
    )
    tw = _compute_twilight_today(loc, date.today())
    assert "astro_twilight_start" in tw
    assert "astro_twilight_end" in tw
