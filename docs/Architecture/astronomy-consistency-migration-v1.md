# Astronomy consistency baseline and ownership contract v1

This document records the current astronomy ownership boundaries before any
future migration. It is a regression contract, not a request to unify the
algorithms. The reproducible vectors are in
`tests/fixtures/astronomy-consistency-v1.json` and are checked by
`tests/astronomy-consistency-baseline.test.mjs`.

## Current ownership

| Surface or artifact | Current owner | Role | Contract/artifact |
| --- | --- | --- | --- |
| Lunar phase and illumination | `frontend/astronomy/lunar.ts` | Authoritative shared lunar computation | `lunar-snapshot.v1`, source marker `astronomy-engine@2.1.19` |
| Browser shared lunar module | `sites/staging/shared/lunar.mjs` | Generated output of the authoritative TypeScript source | Must retain the generated marker and exported snapshot helpers |
| Pages Function lunar helper | `functions/lib/lunar.js` | Generated output consumed by the API | Must retain the same lunar source marker and semantic fields |
| Dynamic Sun/Moon positions | `functions/api/sun-moon.js` | Runtime API owner for arbitrary observer coordinates | `sun_moon.v2`, low-precision Meeus position algorithm, shared lunar fields |
| API lunar helper | `functions/lib/lunar.js` | API's source for phase, illumination, waxing and phase name | Must not be replaced by an API-local phase heuristic |
| Default Warsaw static ephemeris | `sites/staging/sky/data/sun_moon.json` | Generated/committed DE421-backed seven-day artifact | `sun_moon.v2`, static ownership metadata for `default-warsaw` |
| Sky consumer | `sites/staging/sky/widget.js` and `sites/staging/sky/core/sky.prepare.js` | Renders supplied ephemeris and consumes shared lunar semantics | Not an astronomy calculation owner |
| Sun & Moon consumer | `sites/staging/weather/widgets/sun_moon/sun_moon.js` | Renders SunCalc positions and shared lunar semantics | Not an astronomy calculation owner |
| Hero consumer | `sites/staging/hero/widget.js` | Renders shared lunar semantics alongside weather/Kp cards | Not an astronomy calculation owner |

Generated files remain compatibility artifacts. Their source comments and
values are checked here, but they must be changed only by their existing build
pipelines. The baseline does not change formulas, API schemas, generated data,
or consumer UI.

## Semantic fields, units, and tolerances

`lunar-snapshot.v1` uses:

| Field | Meaning and unit | Baseline rule |
| --- | --- | --- |
| `computed_at_utc` | UTC RFC 3339 instant, rounded to the implementation's UTC minute | Exact for fixed vectors |
| `location.lat`, `location.lon` | Observer latitude/longitude in decimal degrees | Exact after the current six-decimal normalization |
| `lunar.cycle_phase` | Geocentric lunar cycle fraction; `0` new, `.25` first quarter, `.5` full, `.75` last quarter | Exact against the shared implementation |
| `lunar.illuminated_fraction` | Illuminated fraction in `[0, 1]` | Exact against the shared implementation |
| `lunar.illuminated_percent` | Illuminated fraction in `[0, 100]` percent | Exactly `fraction * 100` |
| `lunar.waxing` | Boolean phase direction, not an illumination threshold | Exact against the shared implementation |
| `lunar.phase_name`, `lunar.emoji` | Canonical semantic display labels | Exact against the shared implementation |
| `lunar.alt_deg`, `lunar.az_deg` | Optional observer position in degrees | Null in the canonical snapshot until a position owner supplies them |
| `sun`/`moon` `ra_deg`, `dec_deg`, `alt_deg`, `az_deg` | API/static apparent coordinates in decimal degrees | Exact for the same implementation/vector; cross-algorithm equality is not required |
| `moon.illum_pct` | Versioned percent unit in `[0, 100]` | Must equal the shared lunar value for the same frame |

The fixture records exact values for deterministic same-owner checks. Position
values from the independent API and static pipelines are only compared within
the fixture's documented representation/contract checks; this baseline does
not claim that their different algorithms are numerically identical.

## Fixed observer/time cases

The vectors cover three observer classes and fixed UTC instants:

| Case | Observer | Instant |
| --- | --- | --- |
| Warsaw | 52.2297 N, 21.0122 E, `Europe/Warsaw` | `2026-09-09T00:00:00Z` |
| Equatorial | 0 N, 0 E, `UTC` | `2026-03-20T12:00:00Z` |
| High latitude | 69.6492 N, 18.9553 E, `Europe/Oslo` | `2026-12-21T12:00:00Z` |

The API baseline requests one day at 60-minute intervals and pins the API's
otherwise wall-clock-based start time to the vector instant in the test
harness. The static baseline uses the committed artifact's first frame and
its complete ownership metadata; it does not regenerate or rewrite the file.

## Future migration order

1. Keep the shared lunar snapshot contract and this baseline green while
   consumers continue to render their existing UI.
2. Add an explicit position/ephemeris contract only after owners, epochs,
   observer assumptions, and tolerances are agreed and separately baselined.
3. Migrate one consumer at a time behind its current adapter/compatibility
   path, starting with a non-critical read-only consumer and then Sun & Moon,
   Hero, and Sky.
4. Replace or regenerate artifacts only through the existing pipelines after
   fixture and browser regressions prove parity.
5. Remove legacy helpers only in a separately approved breaking story after
   all public and generated compatibility paths have been audited.

No step in this Phase 9A baseline authorizes astronomy formula unification,
API/schema changes, generated-data changes, or migration of unrelated widgets.
