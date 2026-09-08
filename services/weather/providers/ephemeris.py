"""Location-aware ephemeris frames used by the weather pipeline.

The weather pipeline used to read ``sky/data/sun_moon.json``.  That file is a
precomputed Warsaw artefact, so using it for another location made the weather
score describe the wrong horizon.  This provider always receives a
``LocationContext`` and caches results under its deterministic location key.
It deliberately has no static-file fallback: a failed calculation is reported
as unavailable to callers.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, Iterable, Optional, Tuple


@dataclass(frozen=True)
class LocationContext:
    """The complete location identity required for a horizon calculation."""

    lat: float
    lon: float
    tz: str
    location_id: Optional[str] = None

    @property
    def location_key(self) -> str:
        """Stable cache key; coordinate precision prevents cross-site reuse."""
        identity = self.location_id or "coordinates"
        return f"{identity}:{self.lat:.4f}:{self.lon:.4f}:{self.tz}"


@dataclass(frozen=True)
class EphemerisResult:
    """A complete response, including an explicit unavailable state."""

    status: str
    location_key: str
    frames: Tuple[Dict[str, object], ...] = ()
    provider: str = "astropy"
    error: Optional[str] = None


class LocationAwareEphemerisProvider:
    """Calculate topocentric Sun/Moon frames with a context-isolated cache."""

    def __init__(self) -> None:
        self._cache: Dict[Tuple[str, Tuple[str, ...]], EphemerisResult] = {}

    def frames_for_times(
        self, context: LocationContext, times: Iterable[datetime]
    ) -> EphemerisResult:
        normalized = tuple(self._normalize_time(value) for value in times)
        cache_key = (context.location_key, normalized)
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        try:
            result = EphemerisResult(
                status="available",
                location_key=context.location_key,
                frames=tuple(self._calculate(context, normalized)),
            )
        except Exception as exc:  # No cross-location or static fallback is safe here.
            result = EphemerisResult(
                status="unavailable",
                location_key=context.location_key,
                error=f"{type(exc).__name__}: {exc}",
            )
        self._cache[cache_key] = result
        return result

    @staticmethod
    def _normalize_time(value: datetime) -> str:
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    @staticmethod
    def _calculate(context: LocationContext, timestamps: Tuple[str, ...]):
        # Kept inside the provider so a missing optional dependency becomes an
        # explicit EphemerisResult(status="unavailable") at the boundary.
        import astropy.units as u
        from astropy.coordinates import (
            AltAz,
            EarthLocation,
            GeocentricTrueEcliptic,
            get_body,
            get_sun,
        )
        from astropy.time import Time
        from astropy.utils import iers

        # Weather cron must work in an isolated runner as well as online.
        # Bundled IERS-B data is sufficiently precise for hourly weather
        # scoring; do not turn an unavailable IERS-A download into a fallback
        # to a different location's static payload.
        iers.conf.auto_download = False
        iers.conf.auto_max_age = None

        site = EarthLocation(lat=context.lat * u.deg, lon=context.lon * u.deg)
        frames = []
        for timestamp in timestamps:
            instant = Time(timestamp)
            horizon = AltAz(obstime=instant, location=site)
            sun = get_sun(instant)
            moon_geocentric = get_body("moon", instant)
            moon = get_body("moon", instant, location=site)
            sun_alt = float(sun.transform_to(horizon).alt.to_value(u.deg))
            moon_alt = float(moon.transform_to(horizon).alt.to_value(u.deg))

            # Phase is geocentric; altitude is topocentric and location-aware.
            elongation = sun.separation(moon_geocentric).rad
            illumination = (1.0 - __import__("math").cos(elongation)) / 2.0
            sun_lon = sun.transform_to(GeocentricTrueEcliptic(obstime=instant)).lon.to_value(u.deg)
            moon_lon = moon_geocentric.transform_to(GeocentricTrueEcliptic(obstime=instant)).lon.to_value(u.deg)
            waxing = 0.0 < (moon_lon - sun_lon) % 360.0 < 180.0

            dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
            frames.append({
                "t_utc": dt.strftime("%Y-%b-%d %H:%MZ"),
                "sun": {"alt_deg": round(sun_alt, 4)},
                "moon": {
                    "alt_deg": round(moon_alt, 4),
                    "illum_pct": round(illumination * 100.0, 4),
                    "waxing": waxing,
                },
            })
        return frames
