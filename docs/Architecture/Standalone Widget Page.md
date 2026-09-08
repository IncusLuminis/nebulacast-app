Spec 1 — Standalone Widget Page

Purpose

Create a canonical standalone page for each widget so that it can run, render, and be validated independently from any dashboard, showcase, or shared host page.

This page is the primary execution environment of the widget and the reference implementation for all further embedding.

Scope

Applies to each widget separately:
	•	Weather
	•	Map
	•	Sky
	•	Helio
	•	News
	•	Calendar

Each widget must have its own dedicated page and must not depend on other widgets being present.

Goals
	•	Prove that the widget works in isolation
	•	Eliminate hidden dependencies on shared layout, styles, scripts, or state
	•	Provide a stable page for manual QA and regression checks
	•	Provide a canonical target for future embedding and documentation

Non-Goals
	•	No multi-widget composition
	•	No shared dashboard orchestration
	•	No cross-widget synchronization
	•	No catalog or staging shell logic

Functional Requirements

Each widget must expose:
	•	its own HTML entry page
	•	its own mount container
	•	its own bootstrap script
	•	its own local configuration
	•	its own data loading path

The standalone page must:
	•	render the widget without any other widget on the page
	•	work with its own default configuration
	•	work after hard refresh
	•	work when opened directly by URL
	•	show an understandable empty/loading/error state

The widget must:
	•	initialize from a single public mount call
	•	not require global page-specific helpers
	•	not assume presence of host navigation or layout wrappers
	•	handle resize inside its own boundary

Public Mount Contract

Each widget must expose a stable public mount API with the same top-level shape:
	•	mountId
	•	baseUrl
	•	theme
	•	locale
	•	widget-specific options

Example shape only:

Widget.mount({ mountId, baseUrl, theme, locale, ...options })

Different widgets may accept different domain options, but the bootstrapping pattern must remain consistent.

Page Structure

Each standalone page should contain:
	•	page shell
	•	widget mount container
	•	minimal test controls if needed
	•	optional small diagnostics footer

The shell must be intentionally minimal. The page exists to validate the widget, not to decorate it.

Styling Rules

The widget must not rely on site-global CSS.
All widget styles must be either:
	•	scoped to widget root
	•	namespaced
	•	shadowed by strong prefixing discipline

The standalone page may add neutral host styling, but the widget must remain visually stable without shared application CSS.

Data Rules

Each widget must load data through its own declared paths.
No widget may implicitly reuse another widget’s runtime state.

If demo or staging data is used, it must be widget-local and replaceable.

Error Handling

The standalone page must visibly distinguish:
	•	loading
	•	no data
	•	invalid config
	•	fetch failure
	•	partial rendering

Silent failure is not acceptable.

Observability

Recommended optional diagnostics:
	•	widget version
	•	data freshness timestamp
	•	current config summary
	•	baseUrl in use

Diagnostics must be non-blocking and easy to disable later.

File/Folder Expectations

Suggested structure per widget:
	•	index.html
	•	widget.js
	•	styles.css
	•	data/
	•	README.md

Acceptance Criteria

The widget is considered standalone-ready when:
	•	it renders correctly on its dedicated page
	•	it does not depend on other widgets
	•	it does not require site-level CSS or JS to function
	•	it survives reload and direct URL access
	•	it exposes one stable mount API
	•	it shows correct loading/error states

Risks
	•	hidden CSS coupling
	•	hidden shared utility dependencies
	•	implicit global state
	•	host-size assumptions
	•	hardcoded data paths

⸻
