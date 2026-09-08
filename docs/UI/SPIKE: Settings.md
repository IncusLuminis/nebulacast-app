Settings Page Scope, Models Audit, and Customization Strategy

Context

We want to design a Settings page for the Observer Console.

The purpose of this page is not only basic configuration, but also to expose advanced control over scoring and interpretation models used across the system.

Key idea:

We do not assume our scoring models are universally correct.
We provide defaults + recommendations, but allow advanced users to tune the system.

This includes:
	•	Weather scoring
	•	Sky/Alerts scoring
	•	Observing profiles
	•	Possibly thresholds, weights, and interpretation layers

At the same time, Settings must remain usable:
	•	basic users → simple toggles and presets
	•	advanced users → deeper control (weights, thresholds, rules)

⸻

Goal

Conduct a full audit and design exploration of:
	1.	What should be included in Settings
	2.	How scoring models currently work
	3.	How they can be exposed for customization
	4.	What configuration layers exist or should exist
	5.	What advanced capabilities are feasible without breaking system consistency

⸻

Scope

This is an R&D spike only.
	•	No implementation
	•	No code changes
	•	No schema changes
	•	No UI build

We want a structured document that defines:
	•	settings domains
	•	scoring model structure
	•	customization opportunities
	•	risks and constraints

⸻

Core questions to answer

1. What belongs in Settings?

Define the full scope of settings across domains:

Global / Console-level
	•	location defaults
	•	time behavior (auto vs manual)
	•	units (metric/imperial)
	•	timezone handling

Weather
	•	scoring model
	•	thresholds (clouds, wind, humidity, etc.)
	•	observing profiles

Sky
	•	object filtering
	•	visibility thresholds
	•	ranking preferences

Space Weather / Helio
	•	alert sensitivity
	•	thresholds for G/R/S/X interpretation
	•	notification levels

Map
	•	layers
	•	overlays
	•	default zoom/center behavior

UI / UX
	•	themes
	•	skins (including alarm styles, visual density)
	•	compact vs expanded layout
	•	animation preferences

⸻

2. Weather scoring model audit

Analyze how Weather scoring currently works:
	•	where it is defined (frontend/backend)
	•	what inputs it uses (clouds, wind, humidity, etc.)
	•	how scores are computed
	•	whether weights/thresholds are hardcoded

Identify:
	•	implicit assumptions
	•	normalization logic
	•	aggregation method

Then evaluate:
	•	which parameters could be user-configurable
	•	how to expose them safely
	•	whether presets vs free tuning is more appropriate

⸻

3. Weather profiles audit (Observing cards)

Analyze:
	•	how observing profiles are defined
	•	how many profiles exist
	•	what differentiates them
	•	whether profiles are:
	•	static
	•	configurable
	•	derived from scoring

Then propose:
	•	whether users should:
	•	choose profiles
	•	edit profiles
	•	create new profiles
	•	what parameters define a profile (weights, thresholds, constraints)

⸻

4. Sky / Alerts scoring audit

Analyze:
	•	how object ranking works
	•	how “best objects” are selected
	•	how alerts are generated or filtered
	•	whether there is a scoring model or rule-based system

Identify:
	•	inputs (altitude, magnitude, visibility window, etc.)
	•	weighting logic
	•	filtering rules

Then evaluate:
	•	what could be configurable
	•	what must remain fixed
	•	what is too complex for user exposure

⸻

5. Customization model design

Define a layered customization model:

Level 1 — Basic users
	•	presets only
	•	minimal configuration
	•	“recommended defaults”

Level 2 — Intermediate users
	•	adjustable sliders (weights, thresholds)
	•	profile selection
	•	sensitivity tuning

Level 3 — Advanced users
	•	full control over:
	•	weights
	•	thresholds
	•	rule toggles
	•	possibly JSON-based or advanced editor (if feasible later)

⸻

6. Consistency and safety constraints

Evaluate risks of exposing scoring controls:
	•	inconsistent results across components
	•	breaking comparability of scores
	•	confusing UI interpretation
	•	invalid configurations (e.g. zero weights, contradictory thresholds)

Propose:
	•	validation rules
	•	fallback to defaults
	•	“reset to recommended”
	•	configuration versioning if needed

⸻

7. Additional settings opportunities

Identify additional configuration areas, such as:
	•	themes / skins (including industrial styles, alarm visuals)
	•	animation behavior (on/off, intensity)
	•	dashboard layout preferences
	•	default open panels
	•	notification preferences
	•	data refresh frequency (if relevant)

⸻

Audit plan

Codex should proceed as follows:

Step 1. Discover configuration points

Find all places in code where:
	•	scoring is defined
	•	thresholds are used
	•	profiles are defined
	•	configuration-like constants exist

Step 2. Group by domain

Group findings into:
	•	Weather
	•	Sky
	•	Alerts
	•	Map
	•	Space Weather
	•	UI

Step 3. Analyze models

For each domain:
	•	describe current logic
	•	identify parameters
	•	identify hardcoded vs configurable elements

Step 4. Evaluate configurability

For each parameter:
	•	safe to expose?
	•	requires constraints?
	•	too complex?

Step 5. Define Settings structure

Propose a clean structure of the Settings page.

⸻

Deliverable

Produce a single markdown document:

docs/RnD/Settings-Audit.md

Suggested structure:
	1.	Executive summary
	2.	Settings scope (what should be included)
	3.	Weather scoring model audit
	4.	Weather profiles audit
	5.	Sky / Alerts scoring audit
	6.	Configuration model (basic → advanced)
	7.	Risks and constraints
	8.	Proposed Settings structure
	9.	Recommendations and next steps

⸻

Acceptance Criteria
	•	A complete markdown document is produced at:
	•	docs/RnD/Settings-Audit.md
	•	All major domains are covered (Weather, Sky, Alerts, Map, Helio, UI)
	•	Weather scoring model is clearly described and decomposed
	•	Weather profiles are analyzed and categorized
	•	Sky/Alerts scoring is analyzed
	•	Configurable vs non-configurable elements are identified
	•	A layered customization model is proposed
	•	Risks of user customization are explicitly documented
	•	A proposed Settings structure is included
	•	No code changes are made

⸻

Non-goals
	•	No UI implementation
	•	No refactoring
	•	No new APIs
	•	No persistence model implementation

This is a design and architecture spike to define how Settings should work before any implementation begins.
