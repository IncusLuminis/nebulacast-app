Spec: Settings Page — Phased Implementation

Context

We want to build a real Settings page for the Observer Console.

Right now, configuration is fragmented across:
	•	URL query parameters
	•	localStorage
	•	per-widget internal state
	•	hardcoded scoring models
	•	build-time YAML rules
	•	pipeline constants

There is no unified user-facing explanation of:
	•	what can be configured
	•	how scoring works
	•	which engine powers which surface
	•	what is safe for users to tune
	•	what should stay fixed

At the same time, we want to preserve an important product principle:

We do not claim that our scoring models are the only correct interpretation.
We provide defaults and recommendations, but advanced users should be able to tune the system.

However, the audit also confirmed a major constraint:
	•	Weather scoring is currently implemented in multiple engines
	•	Sky/Alerts scoring is mostly build-time
	•	Helio mostly stores UI preferences, not science thresholds

So the Settings page must be implemented in phases, starting from what is safe and coherent now.

Source audit:  ￼

⸻

Goals
	1.	Create a coherent Settings page structure
	2.	Expose safe and understandable controls first
	3.	Avoid exposing model controls that would produce contradictory or invalid results
	4.	Build toward advanced tuning gradually
	5.	Make model provenance visible so users understand what powers each surface

⸻

Non-goals
	•	No attempt to unify all scoring engines immediately
	•	No raw freeform editing of YAML or scoring tables in the first versions
	•	No unsafe “expert mode” without validation
	•	No backend rewrite in Phase 1

⸻

Key Product Principle

Settings should support three user levels:
	•	Basic — use presets and recommended defaults
	•	Intermediate — adjust selected safe parameters
	•	Advanced — eventually tune models more deeply, but only with validation and clear scope

⸻

Phase Plan

⸻

Phase 1 — Settings v1: Safe, Coherent, Low Risk

Objective

Ship a real Settings page with only the safest, highest-value controls.

Scope

1. Observer Context

Add a section for:
	•	default location summary
	•	timezone
	•	time mode (if available / meaningful in current architecture)
	•	future placeholder for units

This section should not duplicate the main location widget experience, but it should give users a clear place to review and reset observer context preferences.

⸻

2. Observing Model Basics

Expose only the controls that are already close to existing system behavior:
	•	observing profile
	•	Bortle class
	•	forecast range (Tonight / 48h / 7d if relevant)
	•	reset to recommended defaults

Important:
	•	In the UI, prefer the user-facing name Balanced instead of internal default where appropriate
	•	Make naming consistent and human-readable even if internal model names differ

⸻

3. Helio / Space Weather UI Preferences

Expose only UI-safe settings such as:
	•	refresh interval preset (within safe allowed bounds)
	•	default expanded/collapsed panel states
	•	optional “quiet/noisy alerts” display preference if this can be implemented client-side without changing science logic

Do not expose solar/space-weather science thresholds yet.

⸻

4. Map Preferences

Expose only safe presentation/state settings such as:
	•	clear saved map state
	•	default visible layers (if already supported)
	•	restore defaults

No heavy map model customization in Phase 1.

⸻

5. Appearance / Layout

Introduce a basic shell for UI customization, even if only partially implemented:
	•	theme placeholder
	•	density / compact mode placeholder
	•	animation preference placeholder

If real functionality is not yet ready, it is acceptable to ship this section partially disabled or labeled “coming soon,” but the structure should exist.

⸻

6. Data / Sources / Transparency

Add a read-only section explaining:
	•	major third-party sources
	•	refresh model
	•	which scoring model is currently used by which surface
	•	model/version labels where possible

This is important because the audit showed scoring model fragmentation.

⸻

Acceptance Criteria for Phase 1
	•	Settings page exists as a real page, not a placeholder
	•	It includes at least:
	•	Observer Context
	•	Observing Model Basics
	•	Helio UI Preferences
	•	Map Preferences
	•	Data / Sources / Transparency
	•	It exposes only safe controls
	•	It provides a clear “Reset to recommended defaults”
	•	It does not expose raw model internals yet
	•	It improves naming clarity (Balanced vs default, etc.)

⸻

Phase 2 — Settings v2: Intermediate Controls

Objective

Add more tuning power, but only through approved presets and constrained controls

Scope

1. Weather “Strictness” Presets

Introduce a user-facing concept like:
	•	Relaxed
	•	Recommended
	•	Strict

These should not be freeform thresholds.
They should map internally to approved bundles of weights/thresholds.

This allows customization without losing comparability or safety.

⸻

2. Weather Sensitivity Controls

Potentially expose controlled sliders for:
	•	cloud strictness
	•	wind strictness
	•	humidity/dew strictness

But only if they map to bounded internal presets or validated parameter ranges.

Avoid raw gate threshold editing.

⸻

3. Sky Client-side Filters

Add safe, frontend-only filters such as:
	•	minimum altitude
	•	hide daylight objects
	•	hide low-score objects
	•	top-N display preference

Important:
	•	these are client filters
	•	they do not rewrite backend ranking logic yet

⸻

4. Alert Noise / Visibility Controls

Expose client-side filters for:
	•	minimum alert severity shown
	•	alert group emphasis
	•	noise reduction modes

Do not alter scientific pipeline scoring yet.

⸻

Acceptance Criteria for Phase 2
	•	Users can choose between recommended strictness levels
	•	Sky/alerts filters are clearly separated from underlying generation logic
	•	Controls are bounded and validated
	•	No contradictory or broken score outputs are introduced

⸻

Phase 3 — Settings v3: Advanced / Power User Layer

Objective

Introduce advanced controls in a safe and explicitly advanced mode

Scope

1. Export / Import Settings Document

Support a versioned user settings object that can be:
	•	exported
	•	imported
	•	reset
	•	validated

This is the foundation for advanced configuration portability.

⸻

2. Weather Weight Editor (validated)

Allow advanced users to tune model weights such as category balance, but only if:
	•	weights are validated
	•	sums are normalized
	•	invalid states are blocked
	•	model version is recorded

This should only apply once a single scoring source of truth is clear enough.

⸻

3. Advanced Model Explanation

Expose a detailed explanation layer showing:
	•	which engine powers which widget/page
	•	what assumptions are built into each model
	•	where user tuning applies and where it does not

Given the audit’s findings, this transparency is essential.

⸻

4. Advanced Sky / Alerts Tuning (future, carefully constrained)

Potential future options:
	•	ranking quotas
	•	min magnitude / altitude preferences
	•	alert thresholds

But only where:
	•	either frontend filtering is sufficient
	•	or a validated server-side override mechanism exists

Do not allow arbitrary raw YAML editing in production.

⸻

Acceptance Criteria for Phase 3
	•	Advanced mode is clearly separated from basic/intermediate settings
	•	Import/export is versioned and validated
	•	Weight editing cannot produce invalid configs
	•	Provenance / model scope is clearly explained

⸻

Phase 4 — Model Unification and Deep Customization

Objective

Only after enough backend/frontend cleanup, allow deeper customization without confusion

Required before this phase

The audit identified a major blocker:
	•	weather scoring currently exists in multiple engines
	•	sky/alerts scoring is build-time and not user-facing
	•	naming is inconsistent across layers

Before exposing deep settings, model ownership must be made clearer.

Targets for this phase
	•	converge or clearly partition scoring engines
	•	unify terminology (default vs balanced, broadband vs photography, etc.)
	•	define a real configuration contract between UI and backend

⸻

Proposed Settings Information Architecture

Top-level structure

Settings
├── Observer Context
├── Observing Models
├── Sky & Ranking
├── Space Weather
├── Map
├── Appearance & Layout
└── Data & Transparency


⸻

Section details

Observer Context
	•	location summary
	•	timezone
	•	time mode
	•	future units

Observing Models
	•	profile
	•	Bortle
	•	range
	•	strictness preset
	•	reset defaults

Sky & Ranking
	•	safe client-side filters first
	•	later advanced ranking preferences

Space Weather
	•	refresh preference
	•	UI panel defaults
	•	optional client-side alert noise controls

Map
	•	reset map state
	•	layer defaults
	•	visibility preferences

Appearance & Layout
	•	theme
	•	density
	•	animation preferences
	•	skin/styling hooks

Data & Transparency
	•	source list
	•	refresh behavior
	•	model provenance
	•	version labels

⸻

Important Model Rules

Rule 1 — Safe controls first

Expose only controls whose effect is clear and bounded.

Rule 2 — No contradictory model promises

Do not imply “one universal score model” if different surfaces are powered by different engines.

Rule 3 — Provenance must be visible

Settings should explain which model drives:
	•	Weather page
	•	hero / observer summary
	•	Sky/alerts ranking
	•	Helio UI

Rule 4 — Client filters are not model rewrites

If a user hides low-score objects in UI, that is not the same as changing ranking generation.

Rule 5 — Advanced mode must be validated

No raw power-user control without:
	•	constraints
	•	reset path
	•	versioning

⸻

Naming / UX Cleanup Requirements

The audit highlighted naming confusion such as:
	•	default vs balanced
	•	broadband vs photography

Phase 1 should already improve user-facing terminology, even if backend internals remain unchanged.

Implementation may keep internal keys, but UI should use consistent names.

⸻

Risks
	•	Users lose trust if settings imply more control than the product actually provides
	•	Exposing weights too early may create contradictions across widgets
	•	Unsafe configurations could break score meaning
	•	Naming mismatches will confuse both users and developers
	•	Build-time sky rules are harder to expose than frontend preferences

⸻

Recommended Delivery Sequence

Recommended order
	1.	Observer Context
	2.	Observing Models (basic presets only)
	3.	Helio UI preferences
	4.	Map preferences
	5.	Transparency section
	6.	Appearance/layout shell
	7.	Strictness presets
	8.	Advanced mode later

This gives immediate user value with low implementation risk.

⸻

Definition of Done (overall)

The Settings implementation is successful when:
	•	the page is real and usable
	•	it centralizes existing configurable behavior
	•	it explains model ownership clearly
	•	it allows safe customization without breaking consistency
	•	it can evolve into advanced tuning later without redesigning the whole page

⸻

Implementation Notes

Claude/Codex may decide:
	•	exact page layout
	•	section order details
	•	whether some subsections ship as disabled placeholders in Phase 1
	•	exact persistence mechanism

But the implementation must follow:
	•	phased delivery
	•	safe-before-powerful progression
	•	clear provenance and naming
	•	no premature deep model editing