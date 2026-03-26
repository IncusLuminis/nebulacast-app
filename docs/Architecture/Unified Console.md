Spec 4 — Unified Console / Cockpit

Purpose

Create a composed multi-widget experience that combines selected standalone widgets into one coordinated observational workspace.

This is a higher-level product surface built on top of already stabilized widgets.

Preconditions

This work starts only after:
	•	standalone pages exist
	•	embed demos exist
	•	showcase exists
	•	widget contracts are stable enough

The console is a composition milestone, not a starting point.

Goals
	•	provide one integrated workspace
	•	combine decision, explanation, and tools
	•	reuse existing widget contracts rather than bypass them
	•	keep composition thin and reversible

Non-Goals
	•	no rewriting widget internals just for the console
	•	no hidden console-only widget versions
	•	no schema changes forced by layout alone

Product Principle

The console must answer one primary question first:
“Can I observe now, and what should I prioritize?”

Everything else is secondary.

Therefore the console should be structured around:
	1.	decision
	2.	priorities
	3.	supporting tools

Recommended Layout

Layer 1 — Hero / Decision

A compact top-level decision area showing:
	•	observing score
	•	status
	•	best window
	•	key blockers or drivers

Layer 2 — Priority Feed

A ranked list of objects/events to observe.

Layer 3 — Context Tools

Tabbed or segmented access to:
	•	Sky
	•	Conditions
	•	Map
	•	Helio
	•	Alerts/News/Calendar where appropriate

This avoids turning the console into a long, flat wall of widgets.

Composition Rules

The console must use public widget mount contracts wherever possible.
If a widget cannot be mounted into the console through its public API, that is an architecture defect to fix upstream.

The console must not depend on private widget internals.

State Coordination

Shared state may exist only at the orchestration layer.

Possible shared inputs:
	•	location
	•	theme
	•	locale
	•	selected time
	•	selected target

The console may broadcast these to widgets, but widgets must still remain independently operable outside the console.

Performance Rules

The console must avoid mounting every heavy panel eagerly.

Preferred behavior:
	•	mount hero and primary feed first
	•	mount secondary widgets lazily
	•	use tabs/sections for heavy views
	•	avoid duplicate data fetches where feasible, but not through brittle coupling

UX Rules

The console must not look like a random collection of equal-weight cards.
There must be a clear hierarchy:
	•	first answer
	•	then ranking
	•	then exploration

Data Contract Considerations

The console should consume existing ranking and group outputs rather than inventing a parallel data model.
If additional aggregation is needed, it should be done in a thin adapter/orchestrator layer, not by mutating stable widget contracts.

Acceptance Criteria

The console is ready when:
	•	it composes existing widgets without bespoke forks
	•	it has a clear primary decision layer
	•	it exposes ranked priorities
	•	it uses tabs/segmentation for secondary tools
	•	widgets remain independently usable outside the console
	•	console logic stays thinner than widget logic

Risks
	•	rebuilding widgets specifically for console needs
	•	over-coupling shared state
	•	excessive eager rendering
	•	flattening all tools into one page without hierarchy
	•	accidental creation of two incompatible product models: standalone vs console
