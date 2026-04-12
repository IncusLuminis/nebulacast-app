Spec: Global Location Propagation — Phased Implementation

Context

The current Observer Console has a partially working global location system, but it is inconsistent:
	•	Some components correctly react to location via shared state
	•	Some rely on precomputed JSON tied to a fixed site (Warsaw)
	•	The time player is not part of canonical state
	•	Several panels do not refetch or recompute on location change

This leads to a critical UX issue:

The UI may show one location, while underlying data corresponds to another.

This spec defines a phased implementation plan to fix this safely without breaking the system.

Source audit:  ￼

⸻

Goals
	1.	Ensure all components react consistently to location changes
	2.	Introduce a proper ObserverContext (location + time)
	3.	Avoid large risky rewrites — proceed incrementally
	4.	Keep system usable at every phase

⸻

Non-goals
	•	No full backend redesign in one step
	•	No immediate replacement of all static JSON
	•	No breaking existing widgets

⸻

Target Architecture (Summary)

All components must derive context from:

ObserverContext = {
  location: { lat, lon, tz, name }
  effectiveTime: { mode, datetimeISO }
}

Rules:
	•	Single source of truth
	•	All components must either:
	•	recompute locally
	•	or refetch data
	•	No silent fallback to baked location

⸻

Phase Plan

⸻

Phase 1 — Fix State & Wiring (Low risk, immediate)

Objective

Make location and time fully reliable inputs across the app.

Tasks

1. Fix time in state

Problem:
	•	setState({ time }) is ignored (not merged)

Action:
	•	Extend state.js to support:

state = {
  location,
  time: {
    mode: 'live' | 'manual',
    datetimeISO: string | null
  },
  profile,
  range,
  source
}

	•	Ensure:
	•	getState().time works
	•	subscribe emits correctly
	•	_cbSetTime updates real state

⸻

2. Standardize ObserverContext access

Define a helper:

getObserverContext()

Returns:
	•	location
	•	effectiveTime

All components should read from this instead of ad-hoc logic.

⸻

3. Audit and fix subscriptions

Ensure ALL components:
	•	subscribe to storeApi
	•	react to:
	•	location change
	•	time change

Fix specifically:
	•	Hero → must re-trigger load
	•	Observer panel → must re-init or reload
	•	Ranking feed → must refetch (placeholder until backend ready)

⸻

4. Map subscription cleanup

Fix duplicate subscription risk:
	•	Ensure initMapIfNeeded registers only one listener
	•	Store unsubscribe or guard properly

⸻

Acceptance Criteria
	•	time is visible in getState()
	•	Changing time affects at least:
	•	Sky
	•	Weather (hour selection if possible)
	•	Changing location triggers:
	•	Weather reload
	•	Map recenter
	•	Sun/Moon recompute
	•	No duplicate subscriptions

⸻

Phase 2 — Frontend Consistency Layer

Objective

Eliminate silent inconsistencies even before backend changes.

Tasks

1. Add “data origin awareness”

If a dataset is site-bound, UI must indicate it.

Example:

Data: Warsaw (default site)

Apply to:
	•	Hero panel
	•	Ranking feed
	•	Observer weather panel
	•	Any /sky/data/*.json

⸻

2. Disable misleading panels (temporary)

If location ≠ default site:
	•	Ranking → show:
	•	disabled state OR
	•	“Not available for selected location yet”
	•	Observer weather snapshot → same

⸻

3. Hero panel refetch strategy

Temporarily:
	•	Refetch JSON on location change
	•	BUT mark clearly as default-site data

⸻

4. Time alignment (frontend)

Ensure:
	•	components prefer:
	•	effectiveTime.datetimeISO
	•	fallback to now

Apply to:
	•	Sky
	•	Weather (hour selection)
	•	Map (optional)

⸻

Acceptance Criteria
	•	No panel silently shows wrong-location data
	•	User can visually distinguish:
	•	real location-based data
	•	default/static data
	•	Time player visibly affects at least 2–3 components

⸻

Phase 3 — Backend/Data Refetch Layer

Objective

Make location-dependent data truly dynamic

Tasks

1. Introduce parameterized endpoints

Replace static JSON usage:

/sky/data/ranking.json

With:

/api/sky/ranking?lat=...&lon=...

Same for:
	•	objects_today
	•	alerts (if location-sensitive)
	•	observer_weather_now

⸻

2. Refactor frontend fetch

All location-bound components must:
	•	refetch on location change
	•	use query params
	•	debounce requests

⸻

3. Caching strategy

Introduce:
	•	CDN caching
	•	short TTL
	•	key = lat/lon rounded grid (optional)

⸻

Acceptance Criteria
	•	Ranking changes when location changes
	•	Hero reflects correct observer site
	•	No dependency on Warsaw-only data

⸻

Phase 4 — Sky Domain Refactor (High complexity)

Objective

Fix the most critical domain: Sky

Tasks

1. Separate concerns

Split:
	•	projection (client-side)
	•	ranking (server-side or recomputed)

⸻

2. Remove dependency on baked JSON

Stop relying on:
	•	objects_today.json
	•	ranking.json

Unless parameterized

⸻

3. Ensure full location correctness

Sky must:
	•	recompute alt/az using current location
	•	align with time player
	•	match ranking feed

⸻

4. Fix feed → sky interaction
	•	Clicking “Best object” should:
	•	pass object id
	•	focus Sky view

⸻

Acceptance Criteria
	•	Sky fully matches selected location
	•	No Warsaw artifacts remain
	•	Ranking + Sky consistent

⸻

Phase 5 — Final Consistency & Cleanup

Objective

Unify system behavior

Tasks
	•	Remove all fallback static datasets (or isolate them)
	•	Ensure all widgets follow same contract
	•	Remove debug labels (Phase 2 artifacts)
	•	Optimize performance

⸻

Component Classification (from audit)

Low effort (Phase 1–2)
	•	Helio core metrics
	•	Global alerts
	•	Sun/Moon (already correct)

Medium effort (Phase 1–3)
	•	Weather
	•	Map
	•	Hero panel
	•	Observer weather panel

High effort (Phase 3–4)
	•	Sky
	•	Ranking
	•	Best objects
	•	Alerts tied to observer

⸻

Risks
	•	Backend complexity for dynamic sky data
	•	Performance (many refetches)
	•	Partial states during migration
	•	User confusion if mixed data not clearly labeled

⸻

Key Principle

Never display location-specific data unless it is actually computed for that location.

⸻

Acceptance Criteria (overall)
	•	Changing location updates ALL relevant components
	•	No component silently uses stale/default site data
	•	Time player is fully integrated into state
	•	System remains usable at every phase
	•	Migration is incremental, not all-at-once

⸻

Implementation Notes

Claude/Codex may:
	•	choose state structure details
	•	define API shape
	•	decide debounce/caching strategy
	•	decide UI for “data origin”

But must follow:
	•	phased rollout
	•	no breaking changes early
	•	correctness over completeness
