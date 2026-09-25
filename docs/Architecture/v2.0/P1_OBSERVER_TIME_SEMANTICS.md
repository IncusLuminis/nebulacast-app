# P1 observer, location and time semantics

**Status:** proposed v1 contract for Product Owner/domain approval. It is not an
implementation of the Location dialog or TimeController.

## Normative decisions for the first v2 slice

1. A `GeoLocation` uses WGS84 latitude and longitude rounded deterministically
   to five decimal places. Latitude is in `[-90, 90]`; longitude is normalized
   to `[-180, 180)`; `-0` becomes `0`.
2. `elevation_m` is either a finite metre value supplied with its provenance or
   `null`. `null` never means `0`; a calculation that needs an assumed height
   records the policy and assumption in its derived output.
3. `geo_location_key` is an opaque hash of normalization version, normalized
   coordinates and elevation/null marker. Display name is excluded. A label
   rename does not change geography identity.
4. `ObserverContext` is `{geo_location_key, timezone, profile_id,
   relevant_policy_versions}`. `observer_context_key` is derived from those
   values. IANA timezone validation is required server-side.
5. Saving a location atomically increments `observer_revision`. Consumers must
   cancel or discard results with an older revision; stale Warsaw content is
   never rendered under a new location label.
6. `TimeSelection` owns `selected_at_utc`, mode (`live`, `paused`,
   `playback`), anchor, speed and step. Every transition increments
   `time_revision`. The revision is correlation metadata, not a cache identity.
7. All instants are UTC. Changing location preserves selected UTC and only
   changes local display/local-day calculations. DST ambiguity is displayed with
   UTC offset; no local time is parsed as an unqualified instant.
8. A read model echoes both requested and effective instant. `effective_at_utc`
   may be null for unavailable or interval-only data. Freshness is wall-clock
   source age and never becomes fresh because the user seeks a time.
9. Initial range proposal is `[anchor_now - 48h, anchor_now + 120h]`, 1-hour
   navigation step. This is an explicit product proposal pending provider/cost
   approval, not a coverage promise. Individual domains expose their own
   segments and gaps.

## Required state behavior

| Situation | Required result |
| --- | --- |
| location change while Warsaw response is pending | increment observer revision; abort/discard the response; show loading/partial for the new context |
| seek/playback within a resolved snapshot | retain snapshot and increment only time revision; no request per animation frame |
| selected instant outside a domain coverage segment | `unavailable` with `outside_coverage`; never silently move to Now |
| snapshot lease expired | explicit `snapshot_expired` error (proposed HTTP 410), then resolve a new snapshot |
| polar day/night rise/set | semantic null plus reason (`polar_day`/`polar_night`), not a generic error |
| standalone/third-party widget | host owns context; it cannot mutate first-party browser preference |

## Approval required

PO/domain/UX must approve the range/step, elevation provenance/default model,
timezone authority, selected-time controls and unsupported-location wording.
The fixtures accompany those decisions; they must not be treated as proof of
provider coverage or an implemented UI.
