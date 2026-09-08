Helio Implementation Checklist v1

1. Purpose

This checklist is the implementation handoff for the new helio domain and the new Space Weather component.

It is intentionally execution-oriented.

Its goals:
	•	define what must be created
	•	define what must not be touched
	•	define the implementation order
	•	define validation points
	•	define migration boundaries
	•	define cutover readiness criteria

This checklist assumes:
	•	the new component is built separately
	•	the legacy component remains in place during development
	•	cutover happens only after the new path is validated

⸻

2. Scope of work

Implementation includes:
	•	new helio backend pipeline
	•	new normalized dataset helio_now.json
	•	new interpreted SWPC event flow
	•	new aggregate derivation layer
	•	new frontend widget/component for Space Weather
	•	integration of the new widget into the UI as a separate path

Implementation does not include:
	•	refactoring old space-weather code in place
	•	deleting legacy files during initial development
	•	merging Helio into sky
	•	merging Helio into weather
	•	redesigning unrelated widgets

⸻

3. Architectural constraints

The following constraints are fixed.

3.1. Domain separation

Must remain separate from:
	•	sky
	•	weather

Internal namespace:
	•	helio

User-facing title:
	•	Space Weather

3.2. Pipeline naming

Main pipeline file:

services/helio/pipelines/gen_helio.py

3.3. Output artifact

Main output dataset:

sites/staging/data/helio_now.json

3.4. Migration strategy

The legacy component must remain operational while the new one is built.

This is a parallel implementation, not an in-place rewrite.

⸻

4. Files and modules to create

Recommended minimum backend structure:

services/helio/
  pipelines/
    gen_helio.py
  providers/
    noaa_swpc.py
  normalizers/
    helio_now.py
  interpreters/
    swpc_alerts.py
  aggregators/
    helio_state.py

Recommended minimum frontend structure:

sites/staging/js/widgets/
  helio/
    helio.types.ts
    helio.model.ts
    helio.render.ts
    helio.interpret.ts

Optional supporting files if the codebase prefers them:

sites/staging/js/widgets/helio/
  helio.constants.ts
  helio.format.ts
  helio.view.ts

The exact split may vary, but the responsibilities must remain distinct.

⸻

5. Legacy files that must not be touched initially

During initial implementation, do not modify for behavior change:
	•	existing legacy space-weather widget files
	•	existing legacy space_weather_now.json generation path
	•	existing services/weather/... space-weather logic unless needed only for reference
	•	existing UI bindings that power the current production/staging card

Allowed:
	•	read old code for reference
	•	compare outputs
	•	reuse patterns selectively

Not allowed in initial phase:
	•	replacing old wiring in place
	•	silently repointing old component to new dataset
	•	removing legacy files early

⸻

6. Recommended implementation sequence

Implementation should follow this order.

Phase 1 — backend foundation
	1.	create new services/helio/ domain structure
	2.	create gen_helio.py
	3.	implement NOAA SWPC provider ingestion
	4.	normalize raw provider payloads into internal raw structures

Deliverable:
	•	raw ingest works under new domain path

Phase 2 — alert interpretation
	1.	implement SWPC alert interpreter
	2.	classify raw alert records into normalized HelioEvent
	3.	implement severity extraction
	4.	implement level mapping
	5.	implement dedupe
	6.	implement relevance scoring

Deliverable:
	•	stable alerts_all and alerts_preview inputs exist

Phase 3 — aggregate state
	1.	derive summary
	2.	derive g_scale, r_scale, s_scale
	3.	derive forecast
	4.	derive aurora_hint
	5.	derive observer_impacts

Deliverable:
	•	full helio_now.json can be produced

Phase 4 — output contract
	1.	serialize final contract exactly as specified
	2.	write sites/staging/data/helio_now.json
	3.	validate field presence, nullability, ordering

Deliverable:
	•	contract-stable backend artifact

Phase 5 — frontend model
	1.	create helio.types.ts
	2.	create helio.model.ts
	3.	map helio_now.json into frontend presentation model
	4.	ensure frontend does not parse raw NOAA semantics

Deliverable:
	•	stable frontend data adapter

Phase 6 — frontend rendering
	1.	create helio.render.ts
	2.	render collapsed state
	3.	render expanded state
	4.	apply missing-data behavior
	5.	apply wording catalog consistently

Deliverable:
	•	standalone new widget works locally

Phase 7 — staging integration
	1.	mount new widget separately from legacy component
	2.	verify no regressions in unrelated widgets
	3.	compare new vs legacy outputs side by side if useful

Deliverable:
	•	new widget visible in staging without replacing legacy one

Phase 8 — cutover preparation
	1.	validate correctness
	2.	validate UI behavior
	3.	validate missing-data behavior
	4.	verify readiness criteria
	5.	only then plan legacy decommission

Deliverable:
	•	explicit cutover readiness decision

⸻

7. Backend checklist

7.1. Provider layer checklist

Must do:
	•	fetch NOAA SWPC products under new helio namespace
	•	normalize timestamps to UTC
	•	tolerate partial provider failures
	•	return structured data, not UI text

Must not do:
	•	mix frontend wording into provider layer
	•	emit provider-specific noise directly to final output

Validation:
	•	provider returns parseable raw structures even if one product is missing

⸻

7.2. Normalization layer checklist

Must do:
	•	normalize Kp latest
	•	normalize Kp forecast points
	•	normalize X-ray flux/class
	•	normalize solar wind speed
	•	normalize IMF Bz if available
	•	normalize raw alert rows into a stable raw input shape

Must not do:
	•	compute UI summaries here unless your codebase merges this with aggregation intentionally

Validation:
	•	all normalized raw structures use UTC
	•	arrays are ordered
	•	nullability is preserved

⸻

7.3. Interpreter layer checklist

Must do:
	•	classify alerts into HelioEvent
	•	support:
	•	geomagnetic storm
	•	geomagnetic watch
	•	radio blackout
	•	radiation storm
	•	solar flare
	•	CME arrival
	•	CME watch
	•	aurora watch
	•	generic info
	•	unknown fallback
	•	extract severity when possible
	•	assign level
	•	assign human-readable title
	•	assign summary_short
	•	compute dedupe_key
	•	compute relevance

Must not do:
	•	emit raw code as primary title
	•	fail whole pipeline on one malformed alert

Validation:
	•	mixed real-world alert samples classify consistently
	•	duplicates are reduced
	•	preview ranking is meaningful

⸻

7.4. Aggregate derivation checklist

Must do:
	•	derive summary.status
	•	derive summary.label
	•	derive summary.text
	•	derive g_scale, r_scale, s_scale
	•	derive forecast.kp_max_next_24h
	•	derive forecast.kp_max_at_utc
	•	derive forecast.trend
	•	derive aurora_hint
	•	derive exactly 3 observer impact rows

Must not do:
	•	overstate aurora certainty
	•	use raw NOAA wording in summary
	•	require IMF Bz to produce valid output

Validation:
	•	valid payload produced even when some metrics are missing
	•	quiet fallback works
	•	scales always populated

⸻

7.5. Serialization checklist

Must do:
	•	write full top-level contract
	•	preserve required fields even when null/empty
	•	preserve array ordering rules
	•	write output atomically if project conventions support that

Must not do:
	•	omit required keys when data is missing
	•	write partially shaped objects

Validation:
	•	JSON schema matches spec
	•	frontend can load without defensive guesswork

⸻

8. Frontend checklist

8.1. Data model checklist

Must do:
	•	load helio_now.json
	•	map backend contract into frontend model
	•	keep frontend interpretation minimal
	•	treat nulls and empty arrays safely

Must not do:
	•	interpret raw NOAA codes directly
	•	invent fallback semantics inconsistent with backend

Validation:
	•	frontend model builds from full, sparse, and empty-ish valid payloads

⸻

8.2. Rendering checklist

Must do:
	•	render title Space Weather
	•	render freshness
	•	render summary block
	•	render metrics row
	•	render forecast block
	•	render observer impact block
	•	render alerts preview
	•	render expanded alerts block

Must do when data missing:
	•	show stable fallback copy
	•	hide unavailable metric cells or show placeholder cleanly
	•	keep layout readable

Must not do:
	•	expose raw provider dump as main UI
	•	let alert list dominate above the fold
	•	collapse into broken layout when one field is null

Validation:
	•	collapsed mode understandable by itself
	•	expanded mode adds depth only

⸻

8.3. Copy checklist

Must do:
	•	use wording from the catalog
	•	keep raw SWPC codes secondary
	•	use calm operational tone

Must not do:
	•	invent alarming copy
	•	mix multiple vocabularies for same concept
	•	show backend/debug text to user

Validation:
	•	visible text matches catalog or its allowed variants

⸻

9. Contract validation checklist

Before considering backend complete, verify:

top-level presence
	•	updated_utc
	•	source
	•	metrics
	•	summary
	•	scales
	•	forecast
	•	aurora_hint
	•	observer_impacts
	•	alerts_preview
	•	alerts_all
	•	raw

object completeness
	•	all required nested keys present
	•	nullable fields use null
	•	arrays exist even if empty

ordering
	•	kp_forecast_3h ascending by time
	•	alerts_preview sorted by relevance desc, then time desc
	•	alerts_all sorted by time desc
	•	observer_impacts in fixed order

semantics
	•	summary.label matches summary.status
	•	g_scale, r_scale, s_scale never absent
	•	alert titles are human-readable
	•	alerts_count consistent with retained alerts

⸻

10. Test checklist

Implementation should be checked against at least these scenarios.

Scenario A — quiet conditions

Expected:
	•	Quiet
	•	G0/R0/S0
	•	low/no alert relevance
	•	aurora none

Scenario B — geomagnetic watch

Expected:
	•	watch-class event visible
	•	g_scale >= G1
	•	summary not overstated
	•	aurora possible if supported

Scenario C — confirmed radio blackout

Expected:
	•	radio_blackout event in preview
	•	r_scale >= R1
	•	radio impact row not none

Scenario D — flare-heavy but low geomagnetic

Expected:
	•	X-ray/solar activity elevated
	•	geomagnetic status may remain quiet/active
	•	not everything escalates to storm

Scenario E — sparse data

Expected:
	•	valid payload still produced
	•	no crash
	•	fallback wording used

Scenario F — malformed raw alert

Expected:
	•	one alert may fall to unknown or be skipped
	•	pipeline still succeeds

Scenario G — duplicate alerts

Expected:
	•	duplicates reduced
	•	preview not filled with near-identical rows

⸻

11. Migration and coexistence checklist

During migration:
	•	old component remains active
	•	new helio dataset is produced independently
	•	new widget can be rendered independently
	•	no hidden dependency should point old widget to new data
	•	no old path should be removed yet

Recommended coexistence period:
	•	enough to compare outputs and verify rendering stability in staging

⸻

12. Cutover readiness checklist

The new component is ready for cutover only when all of the following are true:
	1.	helio_now.json is generated reliably
	2.	all required fields are present and stable
	3.	alerts are human-readable
	4.	summary/scales/aurora/impacts behave correctly under real data
	5.	frontend collapsed mode is readable and useful
	6.	expanded mode works without raw-noise overload
	7.	sparse/missing-data cases are handled cleanly
	8.	no regressions are introduced in surrounding UI
	9.	the new component is judged better than legacy by function, not just by structure

Until then:
	•	legacy remains the production path

⸻

13. Legacy decommission checklist

Only after cutover is accepted:
	1.	switch UI binding from legacy component to Helio component
	2.	verify staging after switch
	3.	verify data path after switch
	4.	remove legacy dataset dependency
	5.	remove legacy component files
	6.	remove obsolete legacy backend generation logic
	7.	clean dead imports and routing
	8.	update documentation

Important:
	•	decommission should be a separate controlled step
	•	do not mix it into initial implementation PR unless the change is tiny and already validated

⸻

14. Documentation checklist

At minimum, implementation should leave behind:
	•	path to pipeline entrypoint
	•	path to generated dataset
	•	short explanation of provider sources
	•	summary of contract
	•	note that helio is internal namespace and Space Weather is UI label
	•	note that legacy component was left intact during migration phase

⸻

15. Final acceptance criteria

Implementation handoff is complete when:
	•	Claude can build without guessing architecture
	•	backend responsibilities are separated clearly enough
	•	frontend can render without parsing provider semantics
	•	migration path is explicit
	•	cutover criteria are explicit
	•	legacy removal is deferred until validation

⸻

16. Recommended closing spec block

The last useful block would be:

Helio rollout / cutover plan v1

That would be a short operational plan:
	•	dev phase
	•	staging verification
	•	side-by-side validation
	•	enablement
	•	legacy shutdown
	•	rollback conditions

That is the final layer if you want the whole spec package to be complete end-to-end.