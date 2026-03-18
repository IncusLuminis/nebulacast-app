Helio JSON Refactor Proposal

Migration-Safe Contract v2 Draft

1. Purpose

This document proposes a migration-safe refactor of helio_now.json to separate:
	•	current measured state
	•	history
	•	forecast
	•	interpretation
	•	events

The refactor is designed to solve two current problems visible in the existing payload:
	•	mixed temporal semantics in one UI-facing object
	•	mixed raw / derived / event-context fields at the same level

The current file already combines current metrics, historical series, a Kp forecast series, derived summary/scales, observer-facing interpretation, and event/alert structures in one payload. For example, metrics contains both current scalar values and series, while summary, scales, forecast, aurora_hint, observer_impacts, alerts_preview, alerts_all, and timeline sit side-by-side at top level.  ￼

This proposal is intentionally careful and incremental.
It does not assume a breaking cutover.

⸻

2. Migration goals

The refactor must:
	1.	preserve current UI behavior during migration
	2.	avoid silent regressions
	3.	make temporal semantics explicit
	4.	isolate derived interpretation from raw measurements
	5.	separate event context from current/forecast values
	6.	support staged frontend adoption

⸻

3. Migration constraints

3.1. No hard break

The UI must continue to work while the backend gradually emits the new structure.

3.2. Additive-first migration

New fields/blocks should be added first. Old fields should remain until the UI no longer consumes them.

3.3. Case-by-case handling

Every renamed or removed field must be treated explicitly.

3.4. No silent semantic changes

If a field changes meaning, it must also change name or move location.

⸻

4. Current top-level structure

The current payload contains these important groups:
	•	schema_version
	•	updated_utc
	•	source
	•	metrics
	•	summary
	•	scales
	•	forecast
	•	aurora_hint
	•	observer_impacts
	•	coronal_hole
	•	alerts_preview
	•	alerts_all
	•	timeline
	•	cme_tracker
	•	raw  ￼

Within metrics, current scalar fields and time series are mixed together, for example:
	•	kp_latest
	•	kp_time_utc
	•	kp_forecast_3h
	•	kp_history_1h
	•	xray_flux_wm2
	•	xray_history_1h
	•	solar_wind_kms
	•	wind_history_1h
	•	imf_bz_nt
	•	bz_history_1h
	•	bz_history_5m  ￼

This is useful for ingestion, but weak for UI semantics.

⸻

5. Proposed target top-level structure

v2 target model

helio_now.json
├── schema_version
├── updated_utc
├── source
├── current
├── history
├── forecast
├── interpretation
├── events
├── experimental
└── raw

Meaning of each block

current
Current measured/latest observed values only.

history
Past series only.

forecast
Future series and compact forecast summaries only.

interpretation
UI/product-facing derived summaries only.

events
Alert/event/timeline objects only.

experimental
Optional future-facing blocks not yet part of stable UI.

raw
Bookkeeping/debug counts.

⸻

6. Target structure in detail

6.1. current

"current": {
  "kp": {
    "value": 1.33,
    "t_utc": "2026-03-16T21:00:00Z"
  },
  "xray": {
    "flux_wm2": 3.818e-07,
    "class": "B"
  },
  "solar_wind": {
    "speed_kms": 493.1,
    "density_cm3": 0.77,
    "pressure_npa": 0.31
  },
  "imf": {
    "bz_nt": 2.58,
    "bt_nt": 3.81
  }
}

Purpose:
	•	Hero
	•	Indicators
	•	current Observer Impacts
	•	magnetosphere panel

⸻

6.2. history

"history": {
  "kp_3h": [...],
  "xray_1h": [...],
  "solar_wind_1h": [...],
  "bz_1h": [...],
  "bz_5m": [...]
}

Purpose:
	•	History panel only

Note:
Cadence is explicit in the field name.

⸻

6.3. forecast

"forecast": {
  "kp_3h": [...],
  "next_step": {
    "t_utc": "2026-03-17T03:00:00Z",
    "kp": 3.0
  },
  "next_24h": {
    "kp_max": 3.0,
    "kp_max_at_utc": "2026-03-17T03:00:00Z",
    "trend": "steady"
  },
  "storm_risk": {
    "g1_probability": 0,
    "g2_probability": 0,
    "g3_probability": 0
  },
  "scales_outlook": {
    "g": "G0",
    "r": "R0",
    "s": "S3"
  },
  "aurora_outlook": {
    "possible": true,
    "min_lat_est": 60,
    "label": "possible",
    "summary": "Aurora may be possible at high latitudes if activity increases."
  }
}

Purpose:
	•	Forecast section only

⸻

6.4. interpretation

"interpretation": {
  "hero_now": {
    "status": "quiet",
    "label": "Quiet",
    "text": "Geomagnetic conditions are quiet right now."
  },
  "hero_forecast": {
    "status": "none",
    "label": "No storm expected",
    "text": "No geomagnetic storm is expected in the next 24 hours."
  },
  "alert_context": {
    "label": "Active alert context",
    "text": "S3 radiation event remains active."
  },
  "observer_impacts_now": [...],
  "observer_impacts_outlook": [...],
  "coronal_hole": {
    "status": "watch",
    "estimated_speed_kms": 493.1,
    "note": "Elevated solar wind — possible HSS"
  }
}

Purpose:
	•	UI wording only
	•	no raw metrics
	•	no event records

⸻

6.5. events

"events": {
  "preview": [...],
  "all": [...],
  "timeline": [...],
  "cme_tracker": null
}

Purpose:
	•	alerts preview
	•	full alerts
	•	solar activity timeline
	•	future CME tracker

⸻

6.6. experimental

Reserved for unstable additions.

Examples:
	•	solar disk metadata
	•	active region overlays
	•	coronal hole geometry
	•	experimental probability models

This avoids polluting the stable contract too early.

⸻

7. Field-by-field migration plan

Below is the key part: what gets renamed, moved, deprecated, or removed.

⸻

7.1. Fields that keep the same name and location

These are already good enough.

Field	Action
schema_version	keep
updated_utc	keep
source	keep
raw	keep for now

Reason:
These are not driving current semantic confusion.

⸻

7.2. Fields that move, but keep core meaning

These are safe candidates for relocation.

Current field	New field	Action
metrics.kp_latest	current.kp.value	move + alias
metrics.kp_time_utc	current.kp.t_utc	move + alias
metrics.xray_flux_wm2	current.xray.flux_wm2	move + alias
metrics.xray_class	current.xray.class	move + alias
metrics.solar_wind_kms	current.solar_wind.speed_kms	move + alias
metrics.density	current.solar_wind.density_cm3	rename + move + alias
metrics.pressure_npa	current.solar_wind.pressure_npa	move + alias
metrics.imf_bz_nt	current.imf.bz_nt	move + alias
metrics.imf_bt_nt	current.imf.bt_nt	move + alias

Reason:
These are current-state measurements and belong together.

⸻

7.3. History series — move and rename for cadence clarity

Current field	New field	Action
metrics.kp_history_1h	history.kp_3h	rename + move
metrics.xray_history_1h	history.xray_1h	move
metrics.wind_history_1h	history.solar_wind_1h	rename + move
metrics.bz_history_1h	history.bz_1h	move
metrics.bz_history_5m	history.bz_5m	move

Important:
kp_history_1h should be renamed because the current name implies hourly cadence, while the actual points are coarse 3-hour values. The series visibly includes 03:00, 06:00, 09:00, etc. rather than hourly samples.  ￼

⸻

7.4. Forecast series — move cleanly

Current field	New field	Action
metrics.kp_forecast_3h	forecast.kp_3h	move + alias

Reason:
This is clearly a forecast time series and should not remain inside the generic metrics block.

⸻

7.5. Forecast summary — rename for clarity, keep semantics

Current field	New field	Action
forecast.kp_max_next_24h	forecast.next_24h.kp_max	move + rename
forecast.kp_max_at_utc	forecast.next_24h.kp_max_at_utc	move + rename
forecast.trend	forecast.next_24h.trend	move

Reason:
This keeps the good current logic but nests it under an explicit time horizon.

⸻

7.6. summary — split, do not rename in place

Current field	New field	Action
summary	interpretation.hero_now + interpretation.hero_forecast + interpretation.alert_context	split
summary.status	split	split
summary.label	split	split
summary.text	split	split

Reason:
The current summary is the highest-risk field because it appears to mix current conditions, forecast possibility, and alert context into one block. The current example says "status": "storm" and "label": "Storm Risk" while the same payload also has kp_latest = 1.33 and forecast.kp_max_next_24h = 3.0, which creates semantic contradiction at UI level.  ￼

Migration rule:
	•	do not silently reinterpret summary
	•	keep it during transition
	•	introduce split fields first
	•	move UI off summary
	•	deprecate later

⸻

7.7. scales — keep values, change semantics and location

Current field	New field	Action
scales.g_scale	forecast.scales_outlook.g or events.active_scales.g	split by semantics
scales.r_scale	forecast.scales_outlook.r or events.active_scales.r	split by semantics
scales.s_scale	forecast.scales_outlook.s or events.active_scales.s	split by semantics

Reason:
The current scales block is under-typed. It is not clear whether G2/R0/S3 describes:
	•	current state
	•	forecast
	•	watch context
	•	active alert context

Since the same payload shows g_scale = G2 while kp_max_next_24h = 3.0, the current meaning is not safe enough for direct UI use.  ￼

Migration rule:
	•	do not rename in place
	•	add explicit new blocks first
	•	temporarily treat current scales as deprecated mixed semantics

⸻

7.8. aurora_hint — move under forecast

Current field	New field	Action
aurora_hint	forecast.aurora_outlook	move + alias
aurora_hint.aurora_possible	forecast.aurora_outlook.possible	rename + move
aurora_hint.aurora_min_lat_est	forecast.aurora_outlook.min_lat_est	rename + move
aurora_hint.aurora_label	forecast.aurora_outlook.label	rename + move
aurora_hint.summary	forecast.aurora_outlook.summary	move

Reason:
This is not a raw metric and should not live at top level. It is forecast-like observer-facing outlook.

⸻

7.9. observer_impacts — split into now vs outlook

Current field	New field	Action
observer_impacts	interpretation.observer_impacts_now	move
future derived impacts	interpretation.observer_impacts_outlook	add new

Reason:
The current block is useful but semantically unclear. Since the UI already treats Hero/Indicators/Observer Impacts as current-state sections, the backend should support that explicitly.

Migration rule:
	•	current observer_impacts becomes observer_impacts_now
	•	forecast-aware impact rows become a separate future block later

⸻

7.10. coronal_hole — move under interpretation

Current field	New field	Action
coronal_hole	interpretation.coronal_hole	move + alias

Reason:
This is not measured current telemetry. It is a heuristic explanatory driver.

⸻

7.11. Alerts — nest under events

Current field	New field	Action
alerts_preview	events.preview	move + alias
alerts_all	events.all	move + alias
timeline	events.timeline	move + alias
cme_tracker	events.cme_tracker	move + alias

Reason:
These fields are already event intelligence. Nesting them makes the contract much clearer without changing their internal structure.

⸻

7.12. Fields to deprecate later

These should not be removed immediately.

Field	Status	Removal condition
summary	deprecated after split	UI fully migrated
scales	deprecated after semantic split	UI migrated to explicit forecast / events badges
metrics as catch-all container	deprecated in future	all consumers use current/history/forecast
metrics.kp_history_1h	deprecated alias	UI migrated to history.kp_3h


⸻

7.13. Fields to remove only after compatibility window

No field should be removed in the first migration step.

Actual removal candidates:
	•	legacy aliases after UI migration
	•	mixed semantic containers after all consumers are off them

⸻

8. Migration phases

Phase 0 — Inventory and freeze

No payload changes.
Use the field inventory to map all current UI consumers.

Phase 1 — Add new blocks, keep old fields

Emit:
	•	current
	•	history
	•	forecast
	•	interpretation
	•	events

while still emitting:
	•	metrics
	•	summary
	•	scales
	•	alerts_preview
	•	alerts_all
	•	timeline

This is the key safe phase.

Phase 2 — UI migration

Frontend gradually switches to:
	•	current.*
	•	history.*
	•	forecast.*
	•	interpretation.*
	•	events.*

while old fields remain.

Phase 3 — Validation period

Run both shapes in parallel.
Check:
	•	no visual regressions
	•	no semantic drift
	•	no missing fields
	•	no stale aliases

Phase 4 — Deprecation warnings

Mark old fields as deprecated in spec and comments.

Phase 5 — Removal

Remove only fields no longer used anywhere.

⸻

9. Compatibility strategy

9.1. Alias policy

For every moved field, emit both old and new paths during migration.

9.2. Split-field policy

For mixed fields like summary and scales, do not reinterpret in place. Add new explicit fields instead.

9.3. UI safety rule

Frontend must never switch to the new field unless:
	•	the field exists
	•	the field is validated in staging
	•	the old field remains available during rollout

9.4. One-case-at-a-time policy

Do not migrate:
	•	summary
	•	scales
	•	events
	•	history cadence names
all in one frontend step

Each should be staged separately.

⸻

10. Regression-risk matrix

Low-risk changes
	•	moving current scalar metrics into current
	•	moving event blocks under events
	•	moving aurora_hint under forecast

Medium-risk changes
	•	renaming history series for cadence clarity
	•	splitting observer impacts into now/outlook

High-risk changes
	•	splitting summary
	•	splitting scales
	•	removing old alias fields

These should be the last changes in the sequence.

⸻

11. Recommended backend implementation order
	1.	add current
	2.	add history
	3.	add forecast.kp_3h and forecast.next_24h
	4.	add events
	5.	add interpretation as a parallel structure
	6.	keep old fields untouched
	7.	migrate UI in small steps
	8.	remove aliases only after proven safe

⸻

12. Recommended frontend migration order
	1.	switch History panel to history.*
	2.	switch Forecast panel to forecast.*
	3.	switch Alerts / Timeline to events.*
	4.	switch Hero current values to current.*
	5.	switch Hero wording to interpretation.hero_*
	6.	switch badges off scales last

This minimizes visible regressions.

⸻

13. Validation checklist per migrated field group

For each migration group, confirm:
	•	values are identical or intentionally clarified
	•	timestamps are preserved
	•	no unit changes
	•	no cadence changes hidden behind same name
	•	no UI label mismatch
	•	fallback states still work
	•	tooltip/detail consumers still resolve

⸻

14. Acceptance criteria

This proposal is acceptable when:
	1.	every moved field has an explicit target location
	2.	every renamed field has a migration alias strategy
	3.	every removed field is deferred until after UI migration
	4.	summary and scales are treated as special high-risk cases
	5.	the migration can happen incrementally without UI regressions
	6.	current, history, forecast, interpretation, and events become separate semantic domains

⸻

15. Immediate practical takeaway

For the fast path:
	•	do not break the current payload
	•	add the new semantic blocks first
	•	migrate UI section-by-section
	•	split summary and scales only after the rest is stable

That is the safest path to a clean Helio model without sacrificing all the UI work already done.

If useful, the next step is a field-by-field migration checklist in a terse implementation format for Claude, so the backend work can be executed in small safe commits.