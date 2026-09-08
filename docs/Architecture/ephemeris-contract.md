# Ephemeris contract

The versioned wire contract is `ephemeris.v1`, defined by
`schemas/ephemeris.v1.schema.json` and adapted by
`services/astro_weather/ephemeris_contract.ts`.

All timestamps are UTC ISO-8601 strings with an explicit `Z` suffix. Observer
coordinates use decimal degrees (`lat_deg` in -90..90 and `lon_deg` in
-180..180). Lunar illumination is represented as `phase` in 0..1 and
`illum_pct` in 0..100; `position.alt_deg` and `position.az_deg` are degrees.

Consumers must reject unknown major schema versions and may accept only the
minor fields they understand. Missing optional values are `null`; malformed
required values are a provider contract error and must not be silently
coerced or replaced with another location's data.
