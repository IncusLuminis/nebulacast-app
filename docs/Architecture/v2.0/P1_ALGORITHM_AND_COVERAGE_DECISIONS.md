# P1 canonical calculation and source-coverage decisions

**Status:** proposed decision baseline for Product Owner/domain approval. No
producer, provider or public output changes are authorized by this document.

## Calculation boundary matrix

| Domain | Current implementations/evidence | v2 canonical decision | Compatibility rule |
| --- | --- | --- | --- |
| Lunar phase | `frontend/astronomy/lunar.ts`; generated browser/function modules; `astronomy-consistency.v1` vectors | `astronomy-engine@2.1.19`, `lunar-snapshot.v1`; exact lunar fields are the canonical common value | existing `sun_moon.v2` remains supported through adapter; JS low-precision body positions are not interchangeable with canonical lunar snapshot |
| Topocentric Sun/Moon positions | Pages `functions/api/sun-moon.js` describes itself as JS low-precision Meeus; static Warsaw artifact | no canonical replacement selected yet; retain algorithm/source/version in each v2 read model | never label static Warsaw frames as another observer; differential vector/tolerance gate is required before replacement |
| Weather score / NQI | Python `services/weather/engine/score_engine.py` (0–100) and `night_quality.py` (0–10); TS `services/astro_weather/score.ts` | no single canonical scoring implementation approved; Python weather engine is the current batch reference, not a global v2 authority | preserve legacy values/shapes; choose algorithm/version and tolerance in a follow-up ADR before parity migration |
| Sky ranking | Python `gen_objects.py` + `gen_ranking.py`; dynamic Pages `/api/sky-ranking.js` recalculates from static shortlist | current batch ranking rules are configuration-validated baseline only; v2 requires a complete candidate catalogue and declared algorithm/input versions | static Warsaw ranking stays a default-site compatibility output; it is not valid universal input |
| Helio/space weather | independent weather Phase 1 and Helio producers; widgets consume both | no canonical producer selected; global source acquisition and observer projection must be decided separately | retain both public outputs until field/consumer parity and source precedence are approved |

## Provider and coverage assessment

| Domain | Supported now | Explicitly unavailable / unproven | Required spike or gate |
| --- | --- | --- | --- |
| Point weather | on-demand provider responses for queried location/window | durable historical coverage, globally shared single-flight, a numeric GRIB point model | provider coverage/cost/rate spike; source-age policy |
| Sky ranking | static configured-Warsaw output; dynamic recalculation over static `objects_today` | globally complete candidates for arbitrary observer; proof that static shortlist is sufficient | full-catalogue coverage and Warsaw/SF golden vectors |
| Calendar/events | current aggregate/RSS feeds | local eclipse/occultation visibility where no geometry/source evidence exists | event identity vs local-projection source/coverage spike; return `unknown`/`unavailable` otherwise |
| Map | GFS tile/manifest visual layer and map-specific data | treating image/tile layer as full numeric point forecast; durable reconstruction of ignored tiles from Git | numeric-field/interpolation, tile artifact/retention and source-coverage spike |

## Golden-vector policy

1. Existing lunar vectors in `tests/fixtures/astronomy-consistency-v1.json` are
   the approved executable baseline for the fields they explicitly cover.
2. A vector compares only a declared algorithm/version and units. Passing a
   fixture does not make a different algorithm or a static default-location
   output canonical.
3. Every replacement must add Warsaw, SF, DST/polar/coverage cases as relevant,
   declared tolerances, source/input versions, and a compatibility adapter
   test before public migration.
4. Weather score, ranking and space-weather have no approved cross-language
   parity vector today. Their lack is an open gate, not zero tolerance or
   permission to compare arbitrary outputs.

## Approval gates

PO/domain owner must approve a versioned algorithm, units, tolerances, source
precedence, coverage/failure states and compatibility window for each row before
any v2 producer changes a public meaning. The attached machine-readable matrix
is deliberately conservative and marks non-proven parity as `pending`.
