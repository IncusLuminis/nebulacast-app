Helio Master Spec Index (Table of Contents)

This index defines the complete specification structure for the Helio domain and the Space Weather component.

It allows the document to be assembled into a single coherent specification file without losing structure or navigation.

The spec is organized in layers:
	1.	domain definition
	2.	alert interpretation
	3.	UI behavior
	4.	data contract
	5.	implementation
	6.	rollout and migration

Each section is intentionally separable so it can evolve independently.

⸻

Helio Domain Specification

1. Domain Definition

Purpose

Defines the architectural domain for solar–terrestrial activity.

Contents
	•	Helio domain concept
	•	relationship to other domains
	•	namespace conventions
	•	dataset naming
	•	architectural boundaries

Key ideas

Helio covers:
	•	solar activity
	•	geomagnetic activity
	•	space weather alerts
	•	aurora potential
	•	observer-relevant impacts

Helio explicitly excludes:
	•	atmospheric weather
	•	sky visibility
	•	astronomical object scoring

⸻

2. SWPC Alert Mapping Specification

Defines how NOAA SWPC alerts are interpreted.

Contents
	•	alert type classification
	•	severity extraction
	•	event kinds
	•	alert level mapping
	•	deduplication rules
	•	relevance scoring

Key outputs

Normalized structure:

HelioEvent

This transforms raw SWPC feed records into a stable semantic event model.

⸻

3. Helio UI Composition Specification

Defines how the Space Weather component is visually and logically structured.

Contents
	•	component layout
	•	collapsed vs expanded modes
	•	visual hierarchy
	•	UI priorities
	•	layout behavior under missing data

Main sections
	•	header
	•	metrics row
	•	forecast section
	•	observer impact section
	•	alerts preview
	•	expanded alerts panel

⸻

4. Wording and Text Catalog

Defines allowed wording patterns for user-facing text.

Contents
	•	summary phrasing
	•	observer impact language
	•	alert titles
	•	alert summaries
	•	fallback wording

Purpose:

Ensure the UI language is:
	•	calm
	•	operational
	•	readable
	•	not raw provider output

⸻

5. Helio Data Contract v1

Defines the exact structure of:

helio_now.json

This contract is the canonical backend output consumed by the frontend.

Contents
	•	top-level schema
	•	field definitions
	•	nullable rules
	•	ordering rules
	•	retention rules
	•	event schema
	•	validation rules

This section is the most implementation-critical part of the spec.

⸻

5a. Helio Data Contract v1.3

Additive amendments: optional **`hero`** object (hero scale labels + optional KPI mirrors), widget scroll **`id`** map for G/R/S/X chips, and notes for local verification on **port 8080**.

See: `docs/Helio/Helio Data Contract v1.3.md`

⸻

6. Alert Event Schema

Defines the normalized structure used for all alerts.

Main structure:

HelioEvent

Fields include:
	•	event time
	•	event kind
	•	domain classification
	•	severity
	•	alert level
	•	human title
	•	short summary
	•	relevance score
	•	deduplication key
	•	raw provider metadata

⸻

7. Aggregate State Derivation Rules

Defines how the overall state is computed from metrics and alerts.

Outputs include:
	•	summary state
	•	operational scales
	•	forecast summary
	•	aurora hint
	•	observer impacts

This section ensures the Helio component always produces a meaningful state even with incomplete upstream data.

⸻

8. Observer Impact Model

Defines the observer-facing interpretation layer.

This section translates space-weather signals into:
	•	aurora visibility potential
	•	radio communication effects
	•	solar flare activity context

The UI always renders three fixed rows:

Aurora
Radio impact
Solar activity


⸻

9. Forecast Model

Defines how Kp forecast data is interpreted.

Includes:
	•	normalized 3-hour forecast points
	•	next-24h peak extraction
	•	forecast trend calculation

This model powers the compact forecast block in the UI.

⸻

10. Aurora Hint Model

Defines how aurora potential is derived.

Inputs may include:
	•	forecast Kp
	•	geomagnetic alerts
	•	IMF Bz (optional)
	•	current Kp

Outputs:

aurora_possible
aurora_min_lat_est
aurora_label
summary

Aurora hints must remain conservative.

⸻

Implementation Specification

11. Backend Architecture

Defines backend responsibilities.

Layers:
	1.	provider ingestion
	2.	normalization
	3.	alert interpretation
	4.	aggregate state derivation
	5.	dataset serialization

File layout:

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


⸻

12. Frontend Architecture

Defines frontend responsibilities.

Modules:

helio.types.ts
helio.model.ts
helio.render.ts
helio.interpret.ts

Responsibilities:
	•	model mapping
	•	safe rendering
	•	minimal interpretation
	•	layout control

Frontend must not parse raw SWPC codes.

⸻

13. Implementation Checklist

Defines the step-by-step process for building the component.

Phases:
	1.	backend foundation
	2.	alert interpretation
	3.	aggregate state
	4.	dataset serialization
	5.	frontend model
	6.	frontend rendering
	7.	staging integration
	8.	cutover preparation

Each phase includes validation criteria.

⸻

Rollout Specification

14. Rollout Plan

Defines the controlled introduction of the new domain.

Phases:
	1.	development rollout
	2.	staging rollout
	3.	side-by-side validation
	4.	cutover decision
	5.	production enablement
	6.	legacy removal
	7.	observation window

The rollout ensures safe migration from the legacy component.

⸻

15. Cutover Plan

Defines the exact moment the new component replaces the old one.

Focus:
	•	controlled binding swap
	•	minimal code changes
	•	easy rollback

Cutover must not include large refactors.

⸻

16. Rollback Strategy

Defines recovery procedures if the new component fails.

Rollback includes:
	•	restoring legacy widget binding
	•	restoring legacy dataset usage
	•	leaving Helio code inactive but present

Rollback must be simple and fast.

⸻

17. Legacy Decommission Plan

Defines how the old implementation is removed.

Steps include:
	•	removing legacy dataset generation
	•	removing legacy widget files
	•	removing dead imports
	•	verifying no remaining consumers

This step occurs only after the new component proves stable.

⸻

Operational Documentation

18. Validation Scenarios

Defines test scenarios for real-world data conditions:
	•	quiet space weather
	•	geomagnetic watch
	•	radio blackout
	•	flare-heavy activity
	•	sparse data
	•	malformed alerts
	•	duplicate alerts

These scenarios ensure the component behaves robustly.

⸻

19. Acceptance Criteria

The Helio domain implementation is considered complete when:
	•	the new component is the active Space Weather component
	•	the Helio pipeline produces stable data
	•	alerts are readable and useful
	•	fallback behavior is reliable
	•	legacy components are safely removed

⸻

Appendix

A. Naming Conventions

Internal namespace:

helio

User-facing label:

Space Weather

Dataset:

helio_now.json

Pipeline:

gen_helio.py


⸻

B. Contract Stability Rules

For version helio_now/v1:
	•	additive changes allowed
	•	removal of existing fields not allowed
	•	enums may extend but not shrink
	•	frontend must tolerate extra fields
	•	backend must keep required fields

⸻

C. Spec Evolution

Future versions may introduce:
	•	solar wind time-series
	•	CME arrival modeling
	•	aurora oval estimation
	•	heliospheric imagery integration

But those are outside v1 scope.

⸻

Final Note

The Helio specification defines a new domain, not merely a widget.

It establishes:
	•	a clear architectural boundary
	•	a normalized space-weather interpretation model
	•	a stable frontend contract
	•	a controlled migration path

This allows the Space Weather component to evolve independently without polluting the sky or weather domains.