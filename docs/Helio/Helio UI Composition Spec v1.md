Helio UI Composition Spec v1

1. Purpose

This spec defines how the new helio component should present normalized space-weather data in the UI.

Scope of this spec:
	•	widget structure
	•	block priority
	•	collapsed vs expanded behavior
	•	data-to-UI mapping
	•	missing-data behavior
	•	text rules
	•	visual semantics at the specification level

Out of scope:
	•	implementation code
	•	CSS details
	•	exact pixel layout
	•	animation behavior
	•	provider logic

The component is internally named Helio, while the user-facing title remains Space Weather.

⸻

2. UI goals

The component must answer, at a glance:
	1.	What is the current space-weather state?
	2.	Is anything important expected soon?
	3.	Is there anything relevant for an observer?
	4.	Are there recent notable SWPC alerts worth opening?

The component must not behave like a raw NOAA console.
It must behave like an interpreted operational card for the Observer’s Console.

⸻

3. Product positioning

Helio is not:
	•	a scientific heliophysics dashboard
	•	a raw SWPC message log
	•	a full aurora forecast tool
	•	a radio-operations instrument panel

Helio is:
	•	a compact observer-facing summary of solar-terrestrial activity
	•	a bridge between NOAA SWPC data and user-readable meaning
	•	a secondary operational context card that complements Sky and Weather

This means:
	•	interpretation first
	•	raw detail second
	•	action relevance over data volume

⸻

4. Placement in the broader console

Helio is a separate domain component and must not be visually or semantically mixed into:
	•	sky
	•	weather

In the console, it should read as:
	•	Sky — what is up there
	•	Weather — what the atmosphere is doing
	•	Space Weather / Helio — what solar-terrestrial conditions are doing

This separation should be visible both in naming and in component boundaries.

⸻

5. Component states

The widget has two main display states:
	1.	collapsed
	2.	expanded

Optional future state:
3. compact/mini for dashboard tiles

v1 only requires collapsed and expanded.

⸻

6. Information priority

The layout should follow this strict priority order:
	1.	top summary state
	2.	key operational metrics
	3.	next-24h Kp forecast summary
	4.	observer-facing impacts
	5.	alerts preview
	6.	full alerts list in expanded mode

This means the UI must not allow the alert list to visually dominate the card before the summary and impacts are understood.

⸻

7. Top-level structure

Recommended component structure:

HelioCard
  Header
  SummaryBlock
  MetricsRow
  ForecastBlock
  ObserverImpactBlock
  AlertsPreviewBlock
  AlertsExpandedBlock (expanded state only)


⸻

8. Header

8.1. Content

Header must contain:
	•	title: Space Weather
	•	freshness indicator
	•	expand/collapse affordance if relevant in current layout

Optional:
	•	provider badge only in subtle detail level, not primary display

8.2. Title

User-facing title:

Space Weather

Internal term Helio must not be shown to users unless explicitly desired later for branding.

8.3. Freshness indicator

Header should show update recency in a compact human-readable way, such as:
	•	Updated 12 min ago
	•	Updated 1h ago

Fallback:
	•	Updated recently
	•	Update time unavailable

Freshness should remain secondary to the main state.

⸻

9. Summary block

This is the top-most and most important section.
It corresponds to what the earlier data spec called hero or summary.

9.1. Purpose

It provides the immediate answer to:
	•	how serious is the current state?
	•	what is the main takeaway?

9.2. Content

The summary block contains:
	•	status label
	•	one-line summary text
	•	primary compact values:
	•	Kp
	•	G
	•	R
	•	S

Recommended structure:

Space Weather Status
Quiet

Quiet geomagnetic conditions. No significant observer impact.

Kp 2.3   G0   R0   S0

9.3. Data mapping

From aggregate state:
	•	summary.label
	•	summary.text
	•	kp_latest
	•	g_scale
	•	r_scale
	•	s_scale

9.4. Rules
	•	status label must be visually dominant
	•	summary text must be 1 line if possible, 2 lines max
	•	the block must remain understandable even if only this section is visible

9.5. Tone semantics

Status labels map to UI tone:
	•	quiet → calm / neutral
	•	active → mild emphasis
	•	elevated → warning-lite
	•	storm → strongest emphasis

Exact colors are implementation detail, but semantic differentiation is required.

⸻

10. Metrics row

10.1. Purpose

This row gives compact supporting telemetry without overwhelming the user.

10.2. Metrics included

Target set for v1:
	•	Solar Wind
	•	X-ray
	•	IMF Bz
	•	Aurora

If IMF Bz is unavailable, that slot may be hidden.

If hidden, layout may become 3-column or preserve spacing depending on implementation.

10.3. Metric card structure

Each metric cell should contain:
	•	label
	•	value
	•	optional tone

Examples:

Solar Wind
503 km/s

X-ray
B-class

IMF Bz
−7 nT

Aurora
Possible

10.4. Data mapping

Solar Wind
	•	source: solar_wind_kms
	•	display:
	•	integer or rounded value
	•	km/s
	•	fallback:
	•	—

X-ray
	•	source: xray_class
	•	display:
	•	A-class, B-class, C-class, M-class, X-class
	•	fallback:
	•	—

IMF Bz
	•	source: imf_bz_nt
	•	display:
	•	signed value in nT
	•	fallback:
	•	hidden or —

Aurora
	•	source: aurora_hint.aurora_label
	•	display:
	•	None
	•	Possible
	•	Good

10.5. Rules
	•	metric labels must be short
	•	metric row must not become a raw instrumentation panel
	•	values should be readable without tooltip dependency

⸻

11. Forecast block

11.1. Purpose

Show the next-24h geomagnetic trend in a compact observer-friendly form.

11.2. Block contents

The forecast block must contain:
	1.	one summary sentence
	2.	a compact visual strip or bar/timeline representation of kp_3h

Recommended summary format:
	•	Peak Kp next 24h: 3.7 at 06:00 UTC
	•	Kp remains low in the next 24 hours
	•	Geomagnetic activity may rise overnight

11.3. Data mapping

From:
	•	forecast.kp_max_next_24h
	•	forecast.kp_max_at_utc
	•	forecast.trend
	•	forecast.kp_3h[]

11.4. Rendering principles

The visual forecast should make these readable:
	•	relative rise/fall
	•	approximate peak
	•	time ordering

It should not require scientific interpretation.

Good choices:
	•	small bar strip
	•	compact sparkline-like row
	•	segmented timeline with labels

Avoid:
	•	dense graph axes
	•	over-annotated charting
	•	scientific plot styling

11.5. Fallback rules

If no forecast points are available:
	•	hide the chart/strip
	•	show text:
	•	Kp forecast unavailable

⸻

12. Observer impact block

12.1. Purpose

This is the most product-specific part of the component.

It answers:
	•	what matters to the observer?

12.2. Contents

The block must contain exactly three stable rows:
	1.	Aurora
	2.	Radio impact
	3.	Solar activity

12.3. Row structure

Each row contains:
	•	label
	•	level badge or tone
	•	one-line summary

Example:

Aurora        Possible   Aurora may be possible at high latitudes.
Radio impact  Low        Minor HF radio impact possible.
Solar activity Low       Low flare activity.

12.4. Data mapping

From:
	•	observer_impacts[]

12.5. Rules
	•	exactly three rows in stable order
	•	rows must remain short and scannable
	•	wording must be non-alarmist
	•	this block should appear before alerts

⸻

13. Alerts preview block

13.1. Purpose

Expose the most relevant interpreted SWPC events without dumping the full feed.

13.2. Header

Header format:

SWPC Alerts (N)

Where N is the total count of retained interpreted alerts or deduplicated alert rows available for display.

13.3. Preview length

Default preview:
	•	3 items

Allowed larger layout:
	•	up to 5 items

13.4. Preview item structure

Each preview alert should contain:
	•	level marker
	•	human-readable title
	•	short summary
	•	timestamp

Example:

[Warning] Minor radio blackout warning
Brief HF radio degradation possible on the sunlit side of Earth.
8 Mar, 14:58 UTC

13.5. Data mapping

From:
	•	alerts_preview[]

13.6. Rules
	•	raw SWPC code must not be the title
	•	raw SWPC code may be shown only as low-priority metadata
	•	preview items should be relevance-ranked, not just newest-first

⸻

14. Expanded alerts block

14.1. Purpose

Show the fuller interpreted history without overwhelming collapsed mode.

14.2. Expanded-only visibility

This block must only appear in expanded state.

14.3. Content

It contains:
	•	all retained deduplicated interpreted alerts
	•	sorted by time descending or relevance according to product choice

Recommended v1:
	•	full list sorted by time descending

14.4. Item structure

Expanded items may include more detail than preview items:
	•	level
	•	title
	•	summary
	•	timestamp
	•	source code
	•	optional raw title on second-detail level

Example:

[Watch] Geomagnetic storm watch
Geomagnetic conditions may intensify in the next forecast window.
9 Mar, 03:00 UTC
SWPC code: ALTK05

14.5. Rules
	•	expanded list must still remain human-readable
	•	raw provider phrasing remains secondary
	•	no wall of uncategorized text

⸻

15. Collapsed state composition

Collapsed state should contain:
	1.	Header
	2.	Summary block
	3.	Metrics row
	4.	Forecast block
	5.	Observer impact block
	6.	Alerts preview block

Collapsed state should not contain:
	•	full alerts list
	•	long raw event descriptions
	•	detailed provider metadata

This is the main operational layout.

⸻

16. Expanded state composition

Expanded state contains everything from collapsed state plus:
	•	full alerts list
	•	optional richer detail for each alert item

Expanded state may also:
	•	show more preview items
	•	show slightly fuller forecast labeling

But it must not turn into a different product.
The order of sections should remain the same.

⸻

17. Visibility rules by data availability

17.1. Summary block

Always visible if payload is valid.

Even with sparse data, it must still show:
	•	title
	•	status
	•	fallback summary

17.2. Metrics row

Visible if at least 2 metrics are available.

If one metric is missing:
	•	hide that cell or render placeholder

If most metrics are missing:
	•	keep only available cells
	•	do not show a row full of empty boxes

17.3. Forecast block

Visible if forecast data exists.

If not:
	•	show compact fallback text or hide chart area

17.4. Observer impact block

Always visible if payload is valid.

It is part of the product promise and should remain stable.

17.5. Alerts preview

Visible if at least 1 interpreted event exists.

If no alerts:
	•	show compact empty state:
	•	No significant recent SWPC alerts

17.6. Expanded alerts block

Only visible when expanded and when there are alert rows.

⸻

18. Empty-state behavior

If the component has valid transport but little or no meaningful space-weather signal, it should still look intentional.

Preferred empty-state behaviors:

No alerts
	•	No significant recent SWPC alerts

No forecast
	•	Kp forecast unavailable

Sparse telemetry
	•	show summary + available metrics only

Fully degraded but valid payload
	•	Space weather data is partially unavailable
	•	keep stable layout where possible

Do not show:
	•	raw JSON-like placeholders
	•	cryptic missing-field labels
	•	error-style panic unless transport actually failed

⸻

19. Error-state behavior

If the dataset cannot be loaded or is invalid, show a distinct component error state.

Recommended minimal error content:
	•	title: Space Weather
	•	body:
	•	Space weather data unavailable
	•	optional retry hint if product supports it

This state should be visually different from “quiet” or “no alerts”.

⸻

20. Text style rules

All displayed text must follow these rules:
	•	short
	•	human-readable
	•	operationally meaningful
	•	non-alarmist
	•	no unexplained acronyms unless standard and already expected in context

Allowed:
	•	Kp
	•	G1
	•	R2
	•	S0
	•	CME

Avoid as primary text:
	•	WARK04
	•	ALTK05
	•	SWPC message code
	•	raw provider bulletin names

Use observer-oriented phrasing:
	•	Aurora may be possible at high latitudes
	•	Minor HF radio impact possible
	•	Elevated flare activity

Avoid overclaiming:
	•	You will see aurora
	•	Major disruption is guaranteed
	•	Dangerous conditions unless directly supported by strong event classes

⸻

21. Timestamp presentation rules

All normalized data stays in UTC internally.

UI timestamp display for alert items should be:
	•	short
	•	absolute
	•	UTC-explicit

Recommended format:
	•	8 Mar, 14:58 UTC
	•	09 Mar 03:00 UTC

Do not show raw ISO strings in the visible UI.

⸻

22. Ordering rules inside the component

Stable section order is required:
	1.	Header
	2.	Summary
	3.	Metrics
	4.	Forecast
	5.	Observer impacts
	6.	Alerts preview
	7.	Expanded alerts list

Do not move alerts above summary or impacts.
Do not allow raw feed volume to dominate above the fold.

⸻

23. Interaction rules

23.1. Expand/collapse

The card may be expandable.

Expand should reveal:
	•	full alerts list
	•	possibly richer detail

Expand should not reorder the card.

23.2. Alert item details

If alert items are individually interactive later:
	•	default visible text must still be sufficient without click
	•	click may reveal raw provider detail

23.3. Metric tooltips

Optional, not required for v1.

The UI must remain understandable without tooltips.

⸻

24. Responsive behavior

At smaller widths:
	•	summary remains at top
	•	metrics row may wrap
	•	forecast visualization may simplify
	•	observer impacts must remain readable
	•	preview alert count may drop from 3 to 2 if necessary

Priority on narrow screens:
	1.	summary
	2.	metrics
	3.	impacts
	4.	forecast summary
	5.	alerts preview

The detailed full list remains expanded-only.

⸻

25. Minimum viable visible payload

A valid minimal visible widget should still work with only:
	•	title
	•	updated time
	•	summary status + text
	•	Kp/G/R/S
	•	observer impacts
	•	zero or one alerts message

This is important for partial-data resilience.

⸻

26. Recommended visible semantics for tones

Implementation can choose the exact visual design, but these semantic mappings should exist:

Status tones
	•	Quiet → neutral/calm
	•	Active → mild highlight
	•	Elevated → moderate warning emphasis
	•	Storm → strong warning emphasis

Impact tones
	•	none → subdued
	•	low → light emphasis
	•	moderate → medium emphasis
	•	high → strong emphasis

Alert levels
	•	info → low visual prominence
	•	watch → medium prominence
	•	warning → highest prominence

These semantics must be consistent across the card.

⸻

27. Non-goals for v1 UI

The v1 Helio UI should not attempt to include:
	•	large scientific charts
	•	full proton flux panels
	•	multi-axis solar wind instrumentation
	•	aurora maps
	•	geographic overlays
	•	long-form educational explanations
	•	provider-specific bulletin dumps

Those can be future expansions, but not in the main card.

⸻

28. Acceptance criteria

Helio UI composition v1 is acceptable when:
	1.	the card is understandable in collapsed mode without opening anything
	2.	the first visible takeaway is the interpreted state, not raw data
	3.	observer-facing impacts are always visible in a stable location
	4.	alerts preview is concise and human-readable
	5.	expanded mode adds depth without changing the meaning of the card
	6.	missing telemetry does not destroy the layout
	7.	the component is visibly separate from both Sky and Weather domains

⸻

29. Recommended next spec block

The next clean spec would be:

Helio content and wording catalog v1

That would define:
	•	canonical labels
	•	canonical summaries
	•	empty-state texts
	•	status texts
	•	alert title templates
	•	impact summaries
	•	fallback wording rules

That is useful because it gives Claude a constrained text dictionary instead of letting implementation invent copy ad hoc.