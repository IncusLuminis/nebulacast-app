
Spike: Stats Page Data Audit and Statistical Opportunities

Context

We want to design a meaningful Stats page for the Observer Console.

This page should not be limited to one widget domain (for example, only Sky).
Instead, it should provide a cross-cutting view over all JSON datasets currently used by the system.

The goal is to understand:
	•	what data we actually have
	•	how it is structured
	•	which parts are static vs dynamic
	•	which descriptive statistics are meaningful
	•	which time-based analytics and charts are possible
	•	whether any inferential/statistical modeling opportunities exist

This is an R&D / analysis task only.
We do not want implementation yet.
We want an audit document that can later drive the UI design of the Stats page.

⸻

Goal

Conduct a full audit of the JSON datasets used by the project and produce a structured analysis of statistical possibilities for the future Stats page.

The outcome should help answer:
	1.	What data do we currently use?
	2.	How is it organized?
	3.	Which datasets are static vs dynamic?
	4.	What descriptive statistics can we show?
	5.	What time-based charts can we build?
	6.	Is there any meaningful inferential/statistical layer we could add later?

⸻

Scope

Analyze the JSON datasets currently used by the system, including both:
	•	static/reference datasets
	•	dynamic/time-dependent/generated datasets

The audit should cover datasets used across the major console domains, including at least where applicable:
	•	Sky
	•	Weather
	•	Space Weather / Helio
	•	Calendar / Events
	•	Alerts
	•	Ranking / Best objects
	•	Any other active JSON inputs/outputs used by the current app

This is not limited to one page or one widget.

⸻

Important constraints
	•	No programming changes
	•	No refactoring
	•	No new code
	•	No UI implementation
	•	No changes to existing JSON contracts

This is a research / architecture / analytics audit spike only.

⸻

Audit objectives

1. Inventory all JSON datasets in active use

Build a complete inventory of JSON files that are currently used by the app/dashboard/pages.

For each dataset, identify:
	•	file path
	•	domain / feature area
	•	whether it is:
	•	static/reference
	•	generated/dynamic
	•	time-series
	•	event feed
	•	summary/derived
	•	whether it is consumed directly by frontend or indirectly through another layer

⸻

2. Build a dataset table

Create a structured dataset table covering at least:
	•	dataset name
	•	path
	•	domain
	•	purpose
	•	primary entities contained
	•	time dependency:
	•	none
	•	snapshot
	•	daily
	•	hourly
	•	event-driven
	•	historical series
	•	location dependency:
	•	yes / no / partial
	•	data shape:
	•	array
	•	object
	•	nested frames
	•	time series
	•	grouped feed
	•	approximate statistical usefulness:
	•	low / medium / high

This table should be part of the final document.

⸻

3. Identify static descriptive statistics opportunities

For datasets that are effectively static or reference-like, propose what descriptive statistics are meaningful.

Examples of the kind of questions to answer:
	•	how are the records structured?
	•	what categories/classes exist?
	•	what distributions can be computed?
	•	what summary counts, frequencies, ranges, quantiles, and histograms make sense?

Possible examples:
	•	object categories
	•	magnitude distributions
	•	constellation/object counts
	•	alert type breakdowns
	•	source distribution by group
	•	ranking score distributions
	•	any relevant static metadata coverage

The exact statistics should be proposed based on actual data discovered in the audit.

⸻

4. Identify dynamic/time-based statistics opportunities

For datasets that vary over time, determine what time-based analysis and charting are possible.

Examples of the kind of questions to answer:
	•	what variables evolve over time?
	•	what can be shown as line charts, timelines, heatmaps, histograms, rolling windows, distributions over time?
	•	which datasets are true time series vs repeated snapshots?
	•	which views would be most useful for a Stats page?

Consider examples such as:
	•	weather over time
	•	observing score over time
	•	space weather time-dependent indicators
	•	alert/event counts over time
	•	calendar/event density over time
	•	ranking changes over time if available
	•	any generated daily/hourly frames

Again, do not assume charts in advance — infer them from the real datasets.

⸻

5. Inferential / analytical opportunities

Assess whether the current data could support any meaningful inferential / analytical statistics beyond pure description.

This should be a realistic assessment, not speculative fluff.

Examples of questions to evaluate:
	•	correlations between variables
	•	predictive opportunities
	•	clustering/grouping
	•	anomaly detection
	•	confidence or uncertainty summaries
	•	trend estimation
	•	relationships between observing conditions and object ranking
	•	relationships between space weather conditions and alerts
	•	seasonality or temporal structure
	•	feature engineering opportunities for future ML/analytics

If inferential opportunities are weak or premature, say so clearly.

The output should distinguish:
	•	feasible now
	•	feasible later with additional history
	•	not meaningful with current data

⸻

6. Organize findings into Stats Page design implications

The audit must also translate data findings into UI implications for a future Stats page.

For example:
	•	which sections should likely exist
	•	which statistics are naturally grouped together
	•	what could be shown as cards vs tables vs charts
	•	what belongs to:
	•	summary
	•	breakdown
	•	trends
	•	advanced analytics

Do not design the actual UI yet.
Just provide a structured recommendation layer that can later feed the UI design.

⸻

Recommended analysis plan

Codex should follow roughly this plan:

Step 1. Discover datasets

Find all currently used JSON files and identify which ones matter for the app.

Step 2. Classify datasets

Group them into logical categories, for example:
	•	reference/static
	•	generated snapshot
	•	time series
	•	event/alert feed
	•	ranking/derived
	•	calendar/event
	•	space weather
	•	weather
	•	sky/astronomy

Step 3. Build the dataset table

Produce the inventory table described above.

Step 4. Static descriptive statistics audit

For each relevant non-time-series dataset, propose meaningful descriptive statistics.

Step 5. Dynamic/time-series audit

For each relevant time-dependent dataset, propose useful temporal analyses and chart types.

Step 6. Inferential opportunities review

Assess realistic analytical/statistical opportunities.

Step 7. Consolidate into one document

Produce a clean review-ready markdown report.

⸻

Deliverable

Produce a single markdown document:

docs/RnD/Stats-Data-Audit.md

Suggested structure:
	1.	Executive summary
	2.	Dataset inventory
	3.	Dataset table
	4.	Static/descriptive statistics opportunities
	5.	Dynamic/time-based statistics opportunities
	6.	Inferential/analytical opportunities
	7.	Risks / limitations
	8.	Recommendations for future Stats page structure
	9.	Next steps

⸻

Acceptance Criteria
	•	A markdown document is created at:
	•	docs/RnD/Stats-Data-Audit.md
	•	All major JSON datasets currently used by the system are inventoried
	•	A structured dataset table is included
	•	Static/descriptive statistical opportunities are proposed
	•	Dynamic/time-based analytical opportunities are proposed
	•	Inferential/statistical opportunities are assessed realistically
	•	The document clearly distinguishes:
	•	what is available now
	•	what requires historical accumulation
	•	what is not currently feasible
	•	The report is coherent and ready for review
	•	No code changes are made
	•	No UI implementation is attempted

⸻

Non-goals
	•	No new stats page implementation
	•	No dashboards/charts built yet
	•	No JSON schema changes
	•	No backend/frontend modifications

This is a pure R&D spike intended to inform future Stats page UI and analytics design.
