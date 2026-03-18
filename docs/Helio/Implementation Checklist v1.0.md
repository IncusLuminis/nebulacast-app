Helio JSON Refactor — Field-by-Field Migration Checklist

Implementation Checklist v1.0

This checklist is intended for small safe commits.
Each step should be independently testable.

⸻

Phase 0 — Freeze and map current consumers

0.1 Inventory current frontend usage

For each current field, record where it is consumed.

Must cover at least:
	•	Hero
	•	Indicators
	•	Observer Impacts
	•	History
	•	Forecast
	•	Alerts
	•	Timeline
	•	Magnetosphere

0.2 Mark high-risk mixed fields

Explicitly flag these as high-risk:
	•	summary
	•	scales
	•	observer_impacts
	•	aurora_hint

0.3 Do not change payload yet

No backend shape changes in this phase.

Definition of done:
	•	current field consumers are known
	•	high-risk fields identified
	•	migration order agreed

⸻

Phase 1 — Add current block

1.1 Add new block

Add:

"current": {
  "kp": { "value": ..., "t_utc": ... },
  "xray": { "flux_wm2": ..., "class": ... },
  "solar_wind": { "speed_kms": ..., "density_cm3": ..., "pressure_npa": ... },
  "imf": { "bz_nt": ..., "bt_nt": ... }
}

1.2 Keep legacy fields

Keep existing fields unchanged:
	•	metrics.kp_latest
	•	metrics.kp_time_utc
	•	metrics.xray_flux_wm2
	•	metrics.xray_class
	•	metrics.solar_wind_kms
	•	metrics.density
	•	metrics.pressure_npa
	•	metrics.imf_bz_nt
	•	metrics.imf_bt_nt

1.3 Validate value parity

Check exact parity between old and new fields.

Definition of done:
	•	current.* exists
	•	legacy metrics.* scalars still exist
	•	values match 1:1

⸻

Phase 2 — Add history block

2.1 Add new block

Add:

"history": {
  "kp_3h": ...,
  "xray_1h": ...,
  "solar_wind_1h": ...,
  "bz_1h": ...,
  "bz_5m": ...
}

2.2 Keep legacy fields

Keep unchanged:
	•	metrics.kp_history_1h
	•	metrics.xray_history_1h
	•	metrics.wind_history_1h
	•	metrics.bz_history_1h
	•	metrics.bz_history_5m

2.3 Validate cadence semantics

Confirm:
	•	history.kp_3h really matches current coarse-step Kp history
	•	naming is accurate

Definition of done:
	•	history.* exists
	•	no UI changes yet
	•	old fields still intact

⸻

Phase 3 — Add forecast block for clean forecast data

3.1 Add forecast series

Add:

"forecast": {
  "kp_3h": ...
}

3.2 Add next-step forecast block

Add:

"forecast": {
  ...
  "next_step": {
    "t_utc": ...,
    "kp": ...
  }
}

3.3 Add next-24h summary block

Move/duplicate existing forecast summary into:

"forecast": {
  ...
  "next_24h": {
    "kp_max": ...,
    "kp_max_at_utc": ...,
    "trend": ...
  }
}

3.4 Keep legacy fields

Keep unchanged:
	•	metrics.kp_forecast_3h
	•	forecast.kp_max_next_24h
	•	forecast.kp_max_at_utc
	•	forecast.trend

For now, this means temporary duplication inside forecast.

3.5 Resolve naming collision safely

Do not delete the old forecast.* fields yet.
If needed, use internal implementation comments to distinguish:
	•	legacy flat forecast
	•	new nested forecast

Definition of done:
	•	clean forecast.kp_3h
	•	clean forecast.next_step
	•	clean forecast.next_24h
	•	old fields still available

⸻

Phase 4 — Add events block

4.1 Add new block

Add:

"events": {
  "preview": ...,
  "all": ...,
  "timeline": ...,
  "cme_tracker": ...
}

4.2 Keep legacy fields

Keep unchanged:
	•	alerts_preview
	•	alerts_all
	•	timeline
	•	cme_tracker

4.3 Validate identity

Ensure events.preview is identical to alerts_preview, etc.

Definition of done:
	•	events.* exists
	•	old event fields still exist
	•	no event rendering changes yet

⸻

Phase 5 — Add interpretation block (parallel only)

5.1 Add new block skeleton

Add:

"interpretation": {
  "hero_now": ...,
  "hero_forecast": ...,
  "alert_context": ...,
  "observer_impacts_now": ...,
  "observer_impacts_outlook": ...,
  "coronal_hole": ...
}

5.2 Do not remove old mixed fields

Keep unchanged:
	•	summary
	•	observer_impacts
	•	aurora_hint
	•	coronal_hole
	•	scales

5.3 Start with simple mapping

Initial implementation may be minimal:
	•	map current observer_impacts → interpretation.observer_impacts_now
	•	map current coronal_hole → interpretation.coronal_hole

5.4 Delay summary split if needed

If summary splitting is not ready, leave:
	•	hero_now
	•	hero_forecast
	•	alert_context
as null or placeholder

Definition of done:
	•	interpretation exists
	•	no legacy mixed field removed
	•	UI still untouched

⸻

Phase 6 — Frontend migration: low-risk first

6.1 Move Hero scalar values to current

Switch UI readers from:
	•	metrics.kp_latest
	•	metrics.imf_bz_nt
	•	metrics.solar_wind_kms
	•	metrics.xray_*

to:
	•	current.kp.value
	•	current.imf.bz_nt
	•	current.solar_wind.speed_kms
	•	current.xray.*

6.2 Keep old fields as fallback

Frontend should still tolerate old fields during rollout.

Definition of done:
	•	Hero/Indicators read from current
	•	no visible regression

⸻

Phase 7 — Frontend migration: History panel

7.1 Move History panel to history

Switch from:
	•	metrics.kp_history_1h
	•	metrics.xray_history_1h
	•	metrics.wind_history_1h
	•	metrics.bz_history_1h
	•	metrics.bz_history_5m

to:
	•	history.kp_3h
	•	history.xray_1h
	•	history.solar_wind_1h
	•	history.bz_1h
	•	history.bz_5m

7.2 Verify section labeling

History header should use:
	•	Last step
	•	timestamp from the series

Definition of done:
	•	History UI no longer depends on legacy metrics.*history*

⸻

Phase 8 — Frontend migration: Forecast panel

8.1 Move Forecast panel to clean forecast fields

Switch from:
	•	metrics.kp_forecast_3h
	•	legacy flat forecast.*

to:
	•	forecast.kp_3h
	•	forecast.next_step
	•	forecast.next_24h

8.2 Keep Storm Risk forecast-only

Ensure Storm Risk reads only from forecast-side fields.

Definition of done:
	•	Forecast UI uses only clean forecast.*
	•	no dependence on Hero summary

⸻

Phase 9 — Frontend migration: Alerts and Timeline

9.1 Move Alerts preview

Switch:
	•	alerts_preview → events.preview

9.2 Move full Alerts

Switch:
	•	alerts_all → events.all

9.3 Move Timeline

Switch:
	•	timeline → events.timeline

9.4 Move CME tracker if used

Switch:
	•	cme_tracker → events.cme_tracker

Definition of done:
	•	UI reads events only from events.*

⸻

Phase 10 — Frontend migration: interpretation fields

10.1 Observer impacts

Switch:
	•	observer_impacts → interpretation.observer_impacts_now

10.2 Coronal hole

Switch:
	•	coronal_hole → interpretation.coronal_hole

10.3 Hero wording

Only after validation, switch Hero wording from:
	•	summary
to:
	•	interpretation.hero_now
	•	interpretation.hero_forecast
	•	interpretation.alert_context

Definition of done:
	•	Hero wording no longer depends on legacy summary

⸻

Phase 11 — High-risk split: summary

11.1 Do not rename summary

Do not reinterpret the old field in place.

11.2 Add explicit split outputs

Backend should emit:
	•	interpretation.hero_now
	•	interpretation.hero_forecast
	•	interpretation.alert_context

11.3 Migrate UI in one controlled step

Only when these three new fields are stable, move Hero text rendering to them.

11.4 Keep legacy summary

Keep it until all Hero consumers are off it.

Definition of done:
	•	Hero no longer uses summary
	•	summary remains legacy-only

⸻

Phase 12 — High-risk split: scales

12.1 Do not keep mixed semantics

Do not continue using top-level scales as-is for UI once alternatives exist.

12.2 Introduce explicit replacements

Recommended additions:

"forecast": {
  "scales_outlook": {
    "g": ...,
    "r": ...,
    "s": ...
  }
}

Optionally later:

"events": {
  "active_scales": {
    "g": ...,
    "r": ...,
    "s": ...
  }
}

12.3 Migrate badge UI last

Badges are high-risk and should be migrated only after:
	•	current
	•	history
	•	forecast
	•	events
	•	interpretation
are already stable

Definition of done:
	•	badges no longer depend on ambiguous scales

⸻

Phase 13 — Deprecation stage

Only after frontend migration is complete:

Mark these as deprecated:
	•	metrics scalar aliases
	•	metrics.*history*
	•	metrics.kp_forecast_3h
	•	alerts_preview
	•	alerts_all
	•	timeline
	•	observer_impacts
	•	coronal_hole
	•	summary
	•	scales

Definition of done:
	•	deprecated field list documented
	•	no active UI consumer depends on them

⸻

Phase 14 — Removal stage

Remove only after one stable compatibility window.

Safe removal candidates first
	•	old alerts aliases
	•	old timeline alias
	•	old cme_tracker alias

Medium-risk removal next
	•	old metrics current aliases
	•	old history aliases
	•	old forecast aliases

Last removal
	•	summary
	•	scales

Definition of done:
	•	only semantic v2 blocks remain
	•	no regressions in staging/production

⸻

Per-field action summary

Keep as-is
	•	schema_version
	•	updated_utc
	•	source
	•	raw

Move + alias
	•	current scalar metrics
	•	history series
	•	Kp forecast series
	•	alerts/timeline/event blocks
	•	coronal_hole
	•	aurora_hint

Move + rename + alias
	•	metrics.density → current.solar_wind.density_cm3
	•	metrics.wind_history_1h → history.solar_wind_1h
	•	metrics.kp_history_1h → history.kp_3h
	•	aurora_hint.aurora_possible → forecast.aurora_outlook.possible
	•	aurora_hint.aurora_min_lat_est → forecast.aurora_outlook.min_lat_est

Split
	•	summary
	•	scales
	•	later observer_impacts into now/outlook if needed

Remove only at the very end
	•	legacy aliases
	•	mixed semantic containers

⸻

Validation checklist per commit

For every migration commit, verify:

☐ old field still present if UI may still use it
☐ new field present and populated
☐ values match expected source semantics
☐ timestamps preserved
☐ no unit/name mismatch introduced
☐ staging UI still renders correctly
☐ no contradiction introduced in Hero / History / Forecast / Alerts

⸻

Recommended commit sequence
	1.	add current
	2.	add history
	3.	add clean forecast
	4.	add events
	5.	add initial interpretation
	6.	migrate Hero scalars
	7.	migrate History
	8.	migrate Forecast
	9.	migrate Events
	10.	migrate Observer Impacts / Coronal Hole
	11.	split summary
	12.	split scales
	13.	deprecate old fields
	14.	remove old fields

⸻

Definition of success

Migration is successful when:
	•	current, history, forecast, interpretation, and events are separate semantic domains
	•	UI reads from the new structure without regressions
	•	old fields are removed only after frontend migration is complete
	•	mixed semantic fields (summary, scales) are eliminated safely

If useful, the next step is a very compact backend task list grouped by file/module so this can be executed against the codebase without re-reading the whole migration document.