Spike: Global Location Propagation Audit (Observer Dashboard)

Context

We are introducing a global location control in the Observer Dashboard (top bar), which must act as a single source of truth for:
	•	location (lat/lon, timezone)
	•	effective time (player)

The goal is that all dashboard components react consistently when the location changes.

At the moment, the system is heterogeneous:
	•	some components are global (location-independent)
	•	some are location-aware but loosely coupled
	•	some rely on precomputed JSON baked for a specific observer location

This creates a high risk of inconsistency:
	•	UI shows a new location
	•	but some components still render data from the old one
	•	or silently display incorrect results

This is not acceptable for an “Observer Console”.

⸻

Goal

Conduct a full audit of all dashboard-relevant components to determine:
	1.	Which components:
	•	already support dynamic location
	•	require minor frontend adjustments
	•	require refetching data
	•	require backend/data pipeline changes
	2.	What architectural changes are needed to support:

Global Location → All Components React Consistently


⸻

Preliminary classification (hypothesis)

This is a starting assumption to validate or correct.

Likely low impact (location-independent or nearly so)
	•	Space Weather / Helio (Kp, X-ray, solar wind, IMF Bz)
	•	Global alerts not tied to observer position
	•	Sun image / general solar panels

Likely medium impact
	•	Weather Conditions
	•	Hourly forecast / Best Observing Window
	•	Matrix / Observing cards
	•	Map (at least recentering, possibly data reload)
	•	Moon / Sun local calculations

Likely high impact
	•	Sky
	•	Object visibility / ranking
	•	“Best objects today”
	•	Any astronomy JSON precomputed for a fixed observer location

This classification must be verified against the actual codebase.

⸻

Scope

This spike focuses on analysis only.
	•	No code changes
	•	No refactoring
	•	No API changes
	•	No commits modifying implementation

The goal is to understand current behavior and define next steps.

⸻

Audit plan

Codex should analyze all relevant components and produce a structured report.

Step 1. Identify all dashboard components

List all components used in:
	•	Dashboard
	•	Weather page
	•	Space Weather page
	•	Sky
	•	Map
	•	Supporting panels (Matrix, Observing, Best Window, etc.)

⸻

Step 2. For each component, document:

1. Data source
	•	Static JSON (which file?)
	•	API endpoint
	•	Computed in frontend
	•	Mixed

2. Location dependency
	•	Does output depend on location?
	•	yes / no / partially

3. Time dependency
	•	Does output depend on time?
	•	yes / no

4. Current location handling
	•	Does the component:
	•	receive location via props/context?
	•	read from a global store?
	•	use hardcoded/default location?
	•	rely on precomputed location-specific JSON?

5. Update mechanism
When location changes, does the component:
	•	rerender automatically (reactive)
	•	require manual refetch
	•	not update at all

6. Data validity risk
If location changes but no extra logic is applied, is the component:
	•	still correct
	•	partially incorrect
	•	completely incorrect

7. Required change type
Classify each component into one of:
	•	NONE
Works correctly without changes
	•	FRONTEND_ONLY
Needs props/context wiring or rerender trigger
	•	REFETCH_REQUIRED
Needs new data request on location change
	•	BACKEND_REQUIRED
Data pipeline or precomputation must change

⸻

Step 3. Special attention areas

Codex must explicitly analyze:

Sky
	•	How positions are computed
	•	Whether alt/az is derived client-side or precomputed
	•	Whether data is tied to a fixed observer

Weather
	•	Whether current JSON is location-specific
	•	Whether multiple locations are supported

Map
	•	Whether it supports dynamic location center
	•	Whether data overlays are location-bound

Best Objects / Ranking
	•	Whether ranking is location-dependent
	•	Where it is computed

⸻

Step 4. Identify inconsistencies

List cases where:
	•	UI location changes but data does not
	•	Multiple components use different location sources
	•	Some components are global while others are local, without clear separation

⸻

Step 5. Propose target model

Based on findings, propose a target architecture:
	•	single ObserverContext (location + time)
	•	consistent data flow
	•	clear separation between:
	•	global data (space weather)
	•	location-based data (weather, sky)

⸻

Deliverable

Produce a single markdown document:

docs/RnD/Location-Audit.md

Structure:
	1.	Overview
	2.	Component inventory
	3.	Detailed audit table
	4.	Problem analysis
	5.	Risk areas
	6.	Proposed architecture
	7.	Recommended next steps (phased if needed)

⸻

Acceptance Criteria
	•	A complete audit document is produced in Markdown
	•	All major dashboard components are covered
	•	Each component is classified by:
	•	location dependency
	•	update behavior
	•	required change type
	•	High-risk areas (especially Sky and astronomy data) are clearly identified
	•	Inconsistencies are explicitly described
	•	A clear target model for global location handling is proposed
	•	No code changes are made in the repository
	•	The document is ready for review and architectural decision-making

⸻

Non-goals
	•	No implementation
	•	No refactoring
	•	No optimization
	•	No UI changes

This is a pure R&D / architecture audit spike.