Below is a concise implementation spec in English.

⸻

Spec: Observer Console Dashboard Wireframe

Goal

Design and implement a more complete Observer Console dashboard layout that gives the product a finished, operational feel.

This task is about dashboard structure and hierarchy, not about adding new data sources.

The dashboard should feel like a control console for observing conditions, with clear separation between:
	•	global controls
	•	navigation
	•	main operational summary
	•	alerts stream
	•	secondary widgets

Implementation details are up to you. Preserve existing functionality wherever possible.

⸻

Core layout

Use a 3-column application layout:

[ TOP BAR ]
[ LEFT NAV ] [ MAIN DASHBOARD ] [ RIGHT ALERTS ]

Top bar

Global controls only:
	•	location
	•	time / player
	•	optional global mode/status

These controls must be treated as global context for the widgets displayed in the dashboard.

Left column

This is navigation, not data.

Move away from using the left rail for live content blocks like alerts or object lists.

Use it for application-level destinations such as:
	•	Dashboard
	•	Sky
	•	Weather
	•	Space Weather
	•	Map
	•	Events

Secondary links:
	•	Stats
	•	Showcase
	•	Settings

The exact naming and grouping can be refined, but the left column should clearly behave as navigation.

Right column

This is the alerts / events stream.

Move alerts here from the left side.

This area should behave like a compact event feed:
	•	recent space weather alerts
	•	sky alerts
	•	event notifications
	•	potentially important system or observation alerts

It should be visually secondary to the main dashboard but always available.

⸻

Main dashboard structure

The center column is the main operational dashboard.

Recommended vertical structure:

1. Hero summary block

Place a large hero block at the top of the main dashboard.

This hero should summarize the overall causal chain of space weather and observing state in a compact way.

Use the new concept:

Sun → Space → Earth

The hero is intended as the top summary layer.

It should communicate:
	•	what is happening on the Sun now
	•	what is propagating through space toward Earth
	•	what is currently happening at Earth

This block may later become the most important summary panel in the whole console, so design it as a strong visual anchor.

2. Primary operational metrics row

Below the hero, place a row of primary metric cards.

These should summarize the most important decision-making metrics, such as:
	•	Observing Quality
	•	Sky Status
	•	Best Observing Window

The number of cards should stay controlled. Prefer 3 cards, possibly 4 at most.

Each card should have:
	•	one strong primary signal
	•	minimal supporting information
	•	optional action / detail entry point

3. Timeline / hourly layer

Below the primary cards, keep a timeline or hourly layer.

This is the operational time navigation area for conditions.

It should still support the existing hourly/weather/observation style behavior, but visually it should now read as a major dashboard section, not just a widget.

4. Secondary widgets

Below the timeline, place secondary widgets or summary blocks.

These are compact dashboard representations of major widgets such as:
	•	Weather Conditions
	•	Space Weather

These widgets are shown without their standalone page-level top panels, because global context already exists in the dashboard top bar.

They should act as embedded dashboard widgets:
	•	compact
	•	synchronized to global context
	•	expandable or clickable into full-page views if needed

⸻

Widget/page distinction

This is important.

We have:
	1.	widgets, which may also be embedded externally or used on standalone pages
	2.	full pages, built from these widgets
	3.	dashboard, where these widgets are reused in compact form

For Weather Conditions and Space Weather:
	•	On standalone pages, they may use full top context panels if needed
	•	On the dashboard, they must appear without duplicated top panels
	•	Instead, they should rely on the global dashboard context from the top bar

A compact read-only context hint inside a widget is acceptable if needed, but do not duplicate the full location/time/player UI inside dashboard widgets

⸻

Interaction model

Global context

The top bar location/time/player should conceptually drive all dashboard widgets.

The dashboard should read as one synchronized system.

Summary first, detail second

The dashboard should emphasize:
	•	summary at the top
	•	details below
	•	drill-down by click or navigation

No heavy duplication

Avoid showing the same major metric in multiple prominent places unless each occurrence serves a clearly different purpose:
	•	summary
	•	detail
	•	forecast
	•	history

⸻

Visual priorities

The dashboard should feel more finished and product-like by enforcing:

1. Strong hierarchy

The user should immediately see:
	•	where the global context is
	•	where the main summary is
	•	where the operational metrics are
	•	where alerts live

2. Clear separation of roles
	•	Left = navigation
	•	Center = main console
	•	Right = alerts/events

3. Reduced clutter

Avoid making every block equally important.

The hero and primary metric row should visually dominate more than the secondary widgets.

4. Reusable component thinking

Do not hardwire one-off dashboard-only logic if it can be avoided.
The layout should be assembled from reusable pieces.

⸻

What should change now
	1.	Move alerts to the right side
	2.	Turn the left side into page/navigation rail
	3.	Add a top-level hero summary block in the main dashboard
	4.	Keep the global top bar as the source of context
	5.	Reuse Weather Conditions and Space Weather as dashboard widgets without duplicating their standalone top panels
	6.	Reorganize the main center column around:
	•	hero
	•	primary cards
	•	timeline
	•	secondary widgets

⸻

What not to do in this task
	•	Do not add new data sources
	•	Do not redesign every widget internally
	•	Do not break standalone widget pages
	•	Do not duplicate context bars inside dashboard widgets
	•	Do not overcomplicate with too many new sections

⸻

Acceptance criteria

The updated dashboard should:
	•	have a clear 3-column app structure
	•	use the left column as navigation
	•	use the right column as alerts/events stream
	•	show a strong hero summary block at the top of the main dashboard
	•	include a primary metrics row below the hero
	•	include timeline/hourly section below that
	•	include compact embedded Weather Conditions and Space Weather widgets without duplicated top panels
	•	feel more like a coherent observer console than a collection of unrelated widgets

⸻

Implementation freedom

Codex / Claude may decide:
	•	exact layout system
	•	exact component breakdown
	•	CSS/grid approach
	•	routing implications
	•	how much of the current layout can be preserved vs. rearranged

The important part is the final dashboard hierarchy and role separation, not a specific pixel-perfect implementation.