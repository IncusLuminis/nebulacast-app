
Spec: Stats Page — Phased Implementation

Context

We want to build a meaningful Stats page for the Observer Console.

This page should not be tied to a single widget domain.
Instead, it should provide a structured analytics layer over the JSON datasets already used by the system.

The audit showed that the data layer is a hybrid of:
	•	generated snapshot JSON
	•	reference catalogs
	•	event/alert feeds
	•	weather API responses
	•	map manifests / frame metadata
	•	space weather payloads

It also showed that:
	•	some datasets are highly suitable for descriptive statistics now
	•	some support time-based visualizations now
	•	many more advanced/inferential ideas require historical retention, which does not yet exist

So the Stats page should be implemented in phases, starting from what is already realistically available.

⸻

Goals
	1.	Build a useful Stats page from currently available data
	2.	Avoid overpromising advanced analytics before historical storage exists
	3.	Reuse existing JSON sources and charting patterns where possible
	4.	Organize stats into clear sections:
	•	data freshness
	•	catalog intelligence
	•	atmospheric / observing
	•	space weather
	•	events / alerts
	•	map pipeline
	5.	Keep implementation incremental and low-risk

⸻

Non-goals
	•	No backend/data pipeline redesign in the first phase
	•	No full ML / predictive analytics
	•	No long-range trend analysis without history
	•	No schema rewrite

⸻

Phase Plan

⸻

Phase 1 — Stats v1: Descriptive + In-snapshot Time Series

Objective

Deliver a first useful Stats page using only the datasets and time structures already available.

Data sources to use first

High-priority
	•	/data/observer_weather_now.json
	•	/data/helio_now.json
	•	/sky/data/sun_moon.json
	•	/sky/data/ranking.json
	•	/sky/data/alerts_now.json
	•	/calendar/daily_signal.json

Optional / secondary
	•	/data/weather_map_now.json
	•	/sky/data/stars.json
	•	/sky/data/dso_messier.json
	•	/sky/data/constellations.json

⸻

Phase 1 sections

1. Data Freshness / Health

Show update metadata for major datasets.

Examples:
	•	generated_utc
	•	updated_utc
	•	staleness / freshness indicators
	•	simple table of active datasets

Purpose:
	•	tell the user how current the console data is

⸻

2. Catalog Intelligence

Use static/reference datasets for simple descriptive distributions.

Examples:
	•	stars by magnitude bin
	•	stars by spectral class
	•	Messier objects by type
	•	constellation line/segment counts

Purpose:
	•	provide a stable, low-risk stats section independent of observer state

⸻

3. Atmosphere & Observing

Use observer weather payloads for direct charts and summaries.

Examples:
	•	cloud / wind / temperature over the next hours
	•	observing score/NQI by hour
	•	night-only overlays
	•	profile comparison if available in the payload
	•	Best Window / decision support metrics

Purpose:
	•	turn existing weather/observing data into a stats layer rather than only a widget layer

⸻

4. Space Environment

Use helio_now.json and its embedded forecast slices.

Examples:
	•	current Kp / G-R-S levels
	•	small forecast strip for Kp forecast steps
	•	alert inventory by severity/domain
	•	current solar wind / Bz snapshot KPIs

Purpose:
	•	provide compact statistical visibility into space weather state and forecast

⸻

5. Events & Alerts

Use feeds already loaded by the app.

Examples:
	•	counts by alert group / category
	•	ranking score distribution
	•	calendar events by type/source
	•	alert/event timeline if timestamps are available

Purpose:
	•	summarize “what is active now” and how data is distributed across categories

⸻

6. Map Pipeline Summary (lightweight)

Do not parse all frame geometry in v1.

Use only manifest-level stats from weather_map_now.json.

Examples:
	•	total frames
	•	current index
	•	frame cadence
	•	products/layers coverage
	•	history vs forecast frame split if available

Purpose:
	•	expose map data coverage without heavy client computation

⸻

Phase 1 implementation rules
	•	Build from existing JSON only
	•	No historical archive required
	•	No new backend endpoints required unless already trivial
	•	Favor:
	•	cards
	•	small tables
	•	histograms
	•	line charts
	•	small multiples
	•	Reuse chart vocabulary and patterns already present in Sky stats where possible

⸻

Acceptance Criteria for Phase 1
	•	Stats page exists and loads
	•	It includes at least:
	•	freshness section
	•	atmosphere/observing section
	•	space environment section
	•	events/alerts section
	•	It uses real current JSON sources
	•	It does not claim unsupported long-term trends
	•	It clearly distinguishes static distributions from time-dependent charts

⸻

Phase 2 — Stats v2: Cross-domain Summaries and Better Structure

Objective

Expand Stats from a collection of charts into a more coherent analytics surface.

Additions

1. Cross-domain overview

A top-level summary row combining:
	•	freshness
	•	active alerts
	•	observing score snapshot
	•	current Kp / storm state
	•	total active events

2. Better grouping and navigation

Introduce clear grouping between:
	•	static/reference stats
	•	operational time-based stats
	•	event/feed analytics
	•	map/data pipeline analytics

3. Derived descriptive metrics

Examples:
	•	ranking score histogram
	•	alert frequency by source/group
	•	weather variability within current forecast window
	•	min/max/range summaries for key weather variables
	•	distribution of calendar event categories

4. Provenance labels

For datasets tied to observer/site or generation time, clearly expose provenance:
	•	observer/site if relevant
	•	generated time
	•	data family / source

⸻

Acceptance Criteria for Phase 2
	•	Stats page feels organized rather than experimental
	•	Sections are clearly grouped by analytics purpose
	•	Data provenance/freshness is visible
	•	Cross-domain summary exists

⸻

Phase 3 — Historical Analytics Layer

Objective

Enable real temporal analytics beyond a single snapshot.

Requirement

This phase depends on historical retention/logging, which does not exist yet in the current static overwrite model.

Needed before implementation

Define and build a minimal historical archive for selected datasets, for example:
	•	observer weather snapshots
	•	helio snapshots
	•	ranking snapshots
	•	alerts feed snapshots
	•	possibly calendar/event snapshots

New capabilities enabled
	•	week-over-week or month-over-month observing conditions
	•	Kp trends across days/weeks
	•	alert rates over time
	•	ranking stability/change over time
	•	seasonality / distribution shifts

⸻

Acceptance Criteria for Phase 3
	•	Historical archive exists for selected domains
	•	Stats page can show multi-day or multi-week charts
	•	Historical charts are clearly separated from snapshot-only views

⸻

Phase 4 — Advanced / Inferential Analytics

Objective

Introduce realistic analytical features once sufficient history exists.

Possible features
	•	correlation summaries between variables
	•	anomaly detection
	•	seasonality summaries
	•	trend estimation
	•	lagged relationships (e.g. alerts vs Kp, weather vs observing score)

Important constraint

Do not introduce speculative or weak analytics without enough data quality and retention.

The audit explicitly suggests that many inferential ideas are:
	•	feasible later
	•	not meaningful now

So this phase must remain conservative.

⸻

Acceptance Criteria for Phase 4
	•	Only evidence-based advanced analytics are added
	•	Features are grounded in retained historical data
	•	No misleading causal or predictive claims are presented

⸻

Proposed Stats Page Structure

Recommended section layout

Stats
├── Overview / Freshness
├── Catalog Intelligence
├── Atmosphere & Observing
├── Space Environment
├── Events & Alerts
├── Map Pipeline
└── Advanced (collapsed or later)


⸻

Dataset-to-section mapping

Freshness / Health
	•	observer weather
	•	helio
	•	sun_moon
	•	ranking
	•	alerts
	•	calendar
	•	weather_map manifest

Catalog Intelligence
	•	stars
	•	dso_messier
	•	constellations
	•	optional planets/object catalogs where meaningful

Atmosphere & Observing
	•	observer weather JSON
	•	weather API-shaped responses
	•	sun/moon frames if needed for time overlays

Space Environment
	•	helio_now
	•	optional NOAA overlay feeds if already used and cheap to surface

Events & Alerts
	•	alerts_now
	•	daily_signal
	•	ranking
	•	optional grouped alert intermediates if truly active in runtime

Map Pipeline
	•	weather_map_now manifest
	•	layer/product availability
	•	frame coverage summaries

⸻

UI Principles
	1.	Start with what is real now
	•	descriptive statistics
	•	in-snapshot time series
	•	no fake history
	2.	Separate static and dynamic
	•	reference catalog stats should not be mixed with operational forecast charts
	3.	Surface provenance
	•	freshness and generation metadata should be visible
	4.	Avoid heavy client work in v1
	•	especially for map/isobar families
	5.	Treat advanced analytics as a later phase
	•	not part of initial delivery

⸻

Risks
	•	Mixing static catalog stats with live operational stats without clear separation
	•	Overloading the page with too many domains at once
	•	Attempting historical/inferential analytics without retained history
	•	Pulling in very large manifests or many frame files on the client
	•	Confusing “snapshot” data with true historical series

⸻

Recommended Delivery Sequence

Recommended order
	1.	Freshness / Health
	2.	Atmosphere & Observing
	3.	Space Environment
	4.	Events & Alerts
	5.	Catalog Intelligence
	6.	Map Pipeline
	7.	Historical analytics later

This gives the user value quickly while keeping implementation risk low.

⸻

Definition of Done (overall)

The Stats page implementation is successful when:
	•	it provides meaningful cross-domain analytics from existing data
	•	it distinguishes clearly between:
	•	static distributions
	•	live/snapshot summaries
	•	in-snapshot time series
	•	historical analytics (if later added)
	•	it avoids unsupported claims
	•	it can grow in phases without redesigning everything from scratch

⸻

Implementation Notes

Claude/Codex may decide:
	•	exact layout and charting library usage
	•	section ordering details
	•	whether to ship all Phase 1 sections at once or in two smaller slices

But the implementation must follow:
	•	phased delivery
	•	realism about data limitations
	•	correctness over visual ambition