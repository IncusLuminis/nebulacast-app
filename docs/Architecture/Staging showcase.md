Spec 3 — Staging Showcase Catalog

Purpose

Create a central staging page that acts as a catalog of all available widgets, their current status, and entry points to their standalone pages and embed demos.

This is a product-facing engineering surface, not the final end-user experience.

Goals
	•	make all widgets discoverable in one place
	•	provide one operational entry point for QA and review
	•	expose widget readiness and freshness
	•	link to standalone and embed environments
	•	simplify validation before production rollout

Non-Goals
	•	not a unified console
	•	not a multi-widget operational dashboard
	•	not a replacement for standalone pages

Functional Requirements

The showcase page must list all widgets as cards or rows.

Each widget entry should include:
	•	widget name
	•	short description
	•	status
	•	version, if available
	•	updated timestamp, if available
	•	link to standalone page
	•	link to embed demo
	•	optional debug/info link

Suggested statuses:
	•	draft
	•	in progress
	•	staging-ready
	•	embed-ready
	•	production-ready

Information Architecture

The showcase page is a catalog, so structure matters more than visual density.

Recommended order:
	1.	observational core widgets
	2.	context/data widgets
	3.	supporting widgets

Possible groups:
	•	Observation: Weather, Sky, Map, Helio
	•	Information: News, Calendar
	•	Experimental/Future: additional widgets later

Widget Card Requirements

Each card should clearly answer:
	•	what this widget does
	•	whether it is usable
	•	where to open it
	•	whether it is safe to embed

The card must not require reading implementation notes to understand the current state.

Debug and QA Support

The showcase may include lightweight engineering metadata:
	•	data freshness
	•	build version
	•	health marker
	•	known issues label

This must remain secondary, not dominate the page.

Layout Requirements

The showcase should remain lightweight and fast.
It must not fully mount every heavy widget on load unless explicitly desired.

Preferred pattern:
	•	cards with preview image or static thumbnail
	•	click through to standalone/demo
	•	optional deferred live preview

Operational Value

This page becomes the central review surface for:
	•	manual QA
	•	stakeholder review
	•	regression verification
	•	production readiness assessment

Acceptance Criteria

The showcase is complete when:
	•	every widget is listed exactly once
	•	every widget links to standalone and embed demo
	•	widget readiness is visible without opening code
	•	the page is useful for QA and review
	•	the page does not itself become a fragile app shell

Risks
	•	catalog becoming a second dashboard
	•	trying to render all live widgets at once
	•	stale readiness/status metadata
	•	duplicate information already maintained elsewhere

⸻
