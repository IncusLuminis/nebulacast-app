Spec 2 — Embed Demo Page

Purpose

Create a dedicated demo page that demonstrates how a widget is embedded into external host pages under realistic conditions.

This page validates integration behavior, not widget business logic.

Scope

One or more demo pages per widget showing typical host scenarios.

Goals
	•	demonstrate the real embed pattern
	•	validate that the widget behaves correctly inside foreign layouts
	•	detect CSS leakage and container assumptions
	•	provide a reference page for future consumers of the widget

Non-Goals
	•	this page is not the canonical widget environment
	•	this page is not a showcase catalog
	•	this page is not a multi-widget dashboard

Functional Requirements

Each embed demo page must show the widget inside a host page scenario.

At minimum, it should validate:
	•	fixed-size container
	•	responsive-width container
	•	narrow column container
	•	dark host page
	•	light host page, if theme support exists

The widget must work when mounted into a generic host container and must not assume control over the whole document.

Host Page Constraints

The host page must be treated as untrusted:
	•	foreign fonts may exist
	•	foreign resets may exist
	•	foreign spacing rules may exist
	•	parent width/height may vary
	•	sibling blocks may exist above and below the widget

The widget must remain stable under these conditions.

Embed Contract

The embed demo must use the same public API that real consumers will use.
No internal shortcuts, no direct access to internal modules, no page-only hacks.

If the widget requires assets or data, the embed example must show how they are resolved through baseUrl or equivalent configuration.

Demo Variants

Recommended variants:
	•	compact card
	•	full-width block
	•	narrow sidebar
	•	constrained-height panel

For complex widgets such as Sky or Map, include at least one realistic interactive container size.

Styling Rules

The demo page must intentionally include generic host styles to simulate real-world sites.
This is where CSS collisions and layout fragility should become visible.

The widget must:
	•	keep its internal layout intact
	•	avoid leaking styles outside its root
	•	avoid being broken by common host styles

Documentation Requirement

Each widget’s embed demo must be accompanied by a short usage description:
	•	script include strategy
	•	mount call
	•	required container
	•	required config
	•	optional config
	•	data/base path expectations

Acceptance Criteria

The embed demo is complete when:
	•	the widget mounts using only public API
	•	it works inside a generic host page
	•	it remains stable in constrained containers
	•	it does not pollute the host page visually
	•	the embed pattern is simple enough to copy into another site

Risks
	•	dependence on full-page layout
	•	size calculation bugs
	•	theme conflicts
	•	CSS leakage
	•	asset path failures when embedded outside staging

⸻

