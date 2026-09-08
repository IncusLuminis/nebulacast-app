from __future__ import annotations

from datetime import datetime, timezone

from providers.ephemeris import (
    EphemerisResult,
    LocationAwareEphemerisProvider,
    LocationContext,
)
from pipelines.fetch_weather import _ephemeris_for_hours
from normalizers import observer_weather


class _CountingProvider(LocationAwareEphemerisProvider):
    def __init__(self) -> None:
        super().__init__()
        self.calls: list[str] = []

    def _calculate(self, context: LocationContext, timestamps: tuple[str, ...]):
        self.calls.append(context.location_key)
        return [{
            "t_utc": "2026-Sep-08 00:00Z",
            "sun": {"alt_deg": -10.0},
            "moon": {"alt_deg": 5.0, "illum_pct": 25.0, "waxing": True},
        }]


class _UnavailableProvider:
    def frames_for_times(self, context: LocationContext, times: list[datetime]) -> EphemerisResult:
        return EphemerisResult(
            status="unavailable",
            location_key=context.location_key,
            error="provider offline",
        )


def test_ephemeris_cache_isolated_by_location_context() -> None:
    provider = _CountingProvider()
    timestamp = datetime(2026, 9, 8, tzinfo=timezone.utc)
    warsaw = LocationContext(52.2297, 21.0122, "Europe/Warsaw", "warsaw")
    berlin = LocationContext(52.5200, 13.4050, "Europe/Berlin", "berlin")

    warsaw_result = provider.frames_for_times(warsaw, [timestamp])
    assert provider.frames_for_times(warsaw, [timestamp]) is warsaw_result
    berlin_result = provider.frames_for_times(berlin, [timestamp])

    assert provider.calls == [warsaw.location_key, berlin.location_key]
    assert warsaw_result.location_key != berlin_result.location_key
    assert warsaw_result.frames == berlin_result.frames


def test_provider_failure_is_explicit_and_has_no_frames() -> None:
    class FailingProvider(LocationAwareEphemerisProvider):
        def _calculate(self, context: LocationContext, timestamps: tuple[str, ...]):
            raise RuntimeError("ephemeris service unavailable")

    result = FailingProvider().frames_for_times(
        LocationContext(-42.8826, 147.3250, "Australia/Hobart", "hobart"),
        [datetime(2026, 9, 8, tzinfo=timezone.utc)],
    )

    assert result.status == "unavailable"
    assert result.frames == ()
    assert "service unavailable" in (result.error or "")


def test_weather_ephemeris_uses_requested_context_not_static_warsaw_data() -> None:
    result = _ephemeris_for_hours(
        [{"time": "2026-09-08T12:00:00+10:00"}],
        lat=-42.8826,
        lon=147.3250,
        tz="Australia/Hobart",
        location_id="hobart",
        provider=_UnavailableProvider(),  # type: ignore[arg-type]
    )

    assert result.status == "unavailable"
    assert result.location_key == "hobart:-42.8826:147.325:Australia/Hobart"
    assert result.frames == ()


def test_context_normalization_rejects_invalid_values_and_preserves_close_locations() -> None:
    first = LocationContext(52.22970000, 21.01220000, " Europe/Warsaw ", " Warsaw ")
    close = LocationContext(52.22970001, 21.01220001, "Europe/Warsaw", "Warsaw")
    assert first.location_key == "Warsaw:52.2297:21.0122:Europe/Warsaw"
    assert first.location_key != close.location_key

    import pytest
    with pytest.raises(ValueError):
        LocationContext(91, 0, "UTC")
    with pytest.raises(ValueError):
        LocationContext(0, 181, "UTC")
    with pytest.raises(ValueError):
        LocationContext(0, 0, "Not/A/Timezone")


def test_observer_weather_exposes_unavailable_ephemeris_without_static_fallback(monkeypatch) -> None:
    monkeypatch.setattr(observer_weather, "fetch_open_meteo", lambda *args: {})
    monkeypatch.setattr(observer_weather, "fetch_7timer_astro", lambda *args: {})
    monkeypatch.setattr(observer_weather, "merge_to_hourly", lambda *args: [{
        "time": "2026-09-08T12:00:00+10:00",
        "cloud_total": 10,
    }])

    result = observer_weather.build_observer_weather(
        lat=-42.8826,
        lon=147.3250,
        tz="Australia/Hobart",
        ephemeris_provider=_UnavailableProvider(),  # type: ignore[arg-type]
    )

    assert result["ephemeris"]["status"] == "unavailable"
    assert result["ephemeris"]["location_key"].startswith("coordinates:-42.8826:147.325:")
    assert result["moon"] is None
    assert result["hourly"][0]["night"] is None
    assert result["hourly"][0]["moon_up"] is None
