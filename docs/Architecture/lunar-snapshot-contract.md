# LunarSnapshot v1

`LunarSnapshot` is the single computation contract for lunar phase and illumination across Sun Equation, Hero and Sky. The Sun Equation astronomy core owns computation; the three surfaces only render a validated snapshot.

## Identity and units

Every snapshot is identified by `computed_at_utc` (RFC 3339 UTC), normalized `location` and `location_key`. `cycle_phase` and `illuminated_fraction` are in `[0, 1]`; `illuminated_percent` is in `[0, 100]`; alt/az fields are degrees. The phase cycle is `0=new`, `.25=first quarter`, `.5=full`, `.75=last quarter` and is distinct from illuminated fraction.

## Status and ownership

`source` identifies the computation implementation. `freshness` is `live`, `generated` or `stale`; `status` is `available`, `stale` or `unavailable`. A stale or unavailable result is rendered as such. Consumers must not calculate a replacement phase or silently use a different location's payload.

The versioned JSON Schema is `schemas/lunar-snapshot.v1.schema.json`. This contract supersedes ad-hoc `moon_phase`, `moon_illum_pct` and local phase heuristics as consumers migrate in #42–#46.
