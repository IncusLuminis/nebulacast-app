Helio Field Inventory and Semantic Classification

Specification v1.0

1. Purpose

This document inventories the fields currently present in helio_now.json and classifies each field by:
	•	semantic class
	•	source origin
	•	temporal type
	•	expected UI consumers
	•	consistency risk

The goal is to provide a backend-facing map of the current data model before refactoring.

This is not yet a redesign spec.
It is a field-level diagnostic model to support:
	•	JSON cleanup
	•	UI consistency work
	•	future contract refactoring

⸻

2. Semantic classes

Each field should be assigned one of these semantic classes.

A. Metadata

Schema, provenance, timestamps, source inventory.

B. Measured current state

Observed or latest measured current values.

C. Historical time series

Recent past series.

D. Forecast time series

Future series.

E. Derived forecast summary

Compact forecast products derived from forecast series.

F. Derived interpretation

Product-facing explanatory or observer-oriented summaries.

G. Event / alert intelligence

Normalized alerts, event streams, event timelines.

H. Debug / raw bookkeeping

Counts, residuals, implementation metadata.

⸻

3. Temporal types

Each field should be assigned one temporal type.

meta

Not time-state content; provenance or schema information.

now

Represents the current/latest state.

past_series

Represents recent history.

future_series

Represents future forecast sequence.

future_summary

Represents compact forecast outlook.

event_context

Represents events, alerts, watches, warnings, or timeline context.

derived_current

Derived from current conditions.

derived_mixed

Derived from multiple temporal layers and therefore semantically risky.

⸻

4. Source-origin classes

swpc_metrics

NOAA SWPC measured metrics / forecasts.

swpc_alerts

NOAA SWPC alerts / watches / warnings.

donki_events

NASA DONKI event intelligence.

derived_internal

Derived in your own pipeline.

unknown_mixed

Not clear from current contract; likely derived from multiple upstream sources.

⸻

5. Inventory table

Below is the recommended field classification for the current JSON.

⸻

5.1 Top-level metadata

Field	Semantic class	Source origin	Temporal type	UI consumer	Consistency risk
schema_version	Metadata	derived_internal	meta	none / debugging	low
updated_utc	Metadata	derived_internal	meta	header freshness	low
source	Metadata	derived_internal	meta	diagnostics / debugging	low
source.domain	Metadata	derived_internal	meta	none	low
source.provider	Metadata	derived_internal	meta	none / debug	low
source.products	Metadata	derived_internal	meta	none / debug	low


⸻

5.2 Current measured metrics

Field	Semantic class	Source origin	Temporal type	UI consumer	Consistency risk
metrics.kp_latest	Measured current state	swpc_metrics	now	Hero, Current Kp	low
metrics.kp_time_utc	Metadata	swpc_metrics	now	Hero timestamp / debugging	low
metrics.xray_flux_wm2	Measured current state	swpc_metrics	now	X-ray indicator	low
metrics.xray_class	Measured current state	swpc_metrics	now	X-ray indicator, radio interpretation	low
metrics.solar_wind_kms	Measured current state	swpc_metrics	now	Solar Wind indicator, hero	low
metrics.density	Measured current state	swpc_metrics	now	tooltip / detailed plasma	low
metrics.pressure_npa	Measured current state	swpc_metrics	now	Dynamic Pressure indicator	low
metrics.imf_bz_nt	Measured current state	swpc_metrics	now	IMF Bz, coupling, magnetosphere	low
metrics.imf_bt_nt	Measured current state	swpc_metrics	now	detailed magnetic field tooltip	low


⸻

5.3 Historical time series

Field	Semantic class	Source origin	Temporal type	UI consumer	Consistency risk
metrics.kp_history_1h	Historical time series	swpc_metrics	past_series	History panel	medium
metrics.xray_history_1h	Historical time series	swpc_metrics	past_series	History panel	low
metrics.wind_history_1h	Historical time series	swpc_metrics	past_series	History panel	low
metrics.bz_history_1h	Historical time series	swpc_metrics	past_series	History panel	low
metrics.bz_history_5m	Historical time series	swpc_metrics	past_series	detailed short-history / magnetosphere	medium

Note

kp_history_1h is currently semantically risky because the suffix suggests hourly cadence, but the data may actually reflect coarser steps. This is a naming-quality issue, not necessarily a data-validity issue.

⸻

5.4 Forecast time series

Field	Semantic class	Source origin	Temporal type	UI consumer	Consistency risk
metrics.kp_forecast_3h	Forecast time series	swpc_metrics	future_series	Forecast panel, Storm Risk	low

Important

This is currently the only clearly structured future time series among the main four physics indicators.

⸻

5.5 Derived summary layer

Field	Semantic class	Source origin	Temporal type	UI consumer	Consistency risk
summary	Derived interpretation	derived_internal / unknown_mixed	derived_mixed	Hero summary	high
summary.status	Derived interpretation	derived_internal / unknown_mixed	derived_mixed	Hero label	high
summary.label	Derived interpretation	derived_internal / unknown_mixed	derived_mixed	Hero label	high
summary.text	Derived interpretation	derived_internal / unknown_mixed	derived_mixed	Hero explanation	high

Reason for high risk

The summary appears to mix current conditions, forecast risk, and alert context into a single hero-level state.

⸻

5.6 Scale badges

Field	Semantic class	Source origin	Temporal type	UI consumer	Consistency risk
scales	Derived interpretation	unknown_mixed	derived_mixed	Hero badges	high
scales.g_scale	Derived interpretation	unknown_mixed	derived_mixed	Hero badge / forecast	high
scales.r_scale	Derived interpretation	unknown_mixed	derived_mixed	Hero badge / radio risk	medium
scales.s_scale	Derived interpretation	unknown_mixed	derived_mixed	Hero badge / radiation context	high

Reason for risk

The contract does not currently tell the UI whether these are:
	•	current active scales
	•	forecast scales
	•	alert-context scales
	•	recent-event scales

⸻

5.7 Derived forecast summary

Field	Semantic class	Source origin	Temporal type	UI consumer	Consistency risk
forecast	Derived forecast summary	derived_internal	future_summary	Forecast section	low
forecast.kp_max_next_24h	Derived forecast summary	derived_internal from swpc_metrics	future_summary	Forecast summary, Storm Risk	low
forecast.kp_max_at_utc	Derived forecast summary	derived_internal from swpc_metrics	future_summary	Forecast summary	low
forecast.trend	Derived forecast summary	derived_internal from swpc_metrics	future_summary	Forecast summary	low

This block is one of the cleanest parts of the current contract.

⸻

5.8 Aurora and observer interpretation

Field	Semantic class	Source origin	Temporal type	UI consumer	Consistency risk
aurora_hint	Derived interpretation	derived_internal	derived_mixed	Aurora hint / hero / impacts	medium
aurora_hint.aurora_possible	Derived interpretation	derived_internal	derived_mixed	Aurora UI	medium
aurora_hint.aurora_min_lat_est	Derived interpretation	derived_internal	derived_mixed	Aurora UI / tooltip	medium
aurora_hint.aurora_label	Derived interpretation	derived_internal	derived_mixed	Aurora UI	medium
aurora_hint.summary	Derived interpretation	derived_internal	derived_mixed	Aurora text	medium

Note

This block is likely forecast-aware, not purely current, so it should not be presented as “now” without temporal labeling.

⸻

5.9 Observer impacts

Field	Semantic class	Source origin	Temporal type	UI consumer	Consistency risk
observer_impacts	Derived interpretation	derived_internal	derived_current / derived_mixed	Observer Impacts UI	medium
observer_impacts[].kind	Derived interpretation	derived_internal	derived_current / derived_mixed	Observer Impacts UI	low
observer_impacts[].level	Derived interpretation	derived_internal	derived_current / derived_mixed	Observer Impacts UI	medium
observer_impacts[].label	Derived interpretation	derived_internal	derived_current / derived_mixed	Observer Impacts UI	low
observer_impacts[].summary	Derived interpretation	derived_internal	derived_current / derived_mixed	Observer Impacts UI	medium

Note

These are product-facing and useful, but they need a clearer statement of whether they describe:
	•	current impacts
	•	next-step impacts
	•	mixed current+forecast context

⸻

5.10 Coronal hole block

Field	Semantic class	Source origin	Temporal type	UI consumer	Consistency risk
coronal_hole	Derived interpretation	derived_internal	derived_mixed	Solar driver card	medium
coronal_hole.status	Derived interpretation	derived_internal	derived_mixed	Solar driver card	medium
coronal_hole.estimated_speed_kms	Derived interpretation	derived_internal	derived_mixed	Solar driver card	medium
coronal_hole.note	Derived interpretation	derived_internal	derived_mixed	Solar driver card	medium

Note

This appears to be a heuristic interpretation block and should not be conflated with measured current solar wind speed.

⸻

5.11 Alert preview and full alert set

Field	Semantic class	Source origin	Temporal type	UI consumer	Consistency risk
alerts_preview	Event / alert intelligence	swpc_alerts + donki_events + derived_internal	event_context	Alert preview UI	low
alerts_all	Event / alert intelligence	swpc_alerts + donki_events + derived_internal	event_context	Expanded alerts UI	low

Common alert fields:

Field	Semantic class	Source origin	Temporal type	UI consumer	Consistency risk
kind	Event / alert intelligence	derived_internal	event_context	alert rendering	low
domain	Event / alert intelligence	derived_internal	event_context	filtering / grouping	low
severity	Event / alert intelligence	derived_internal	event_context	alert rendering	medium
severity_label	Event / alert intelligence	derived_internal	event_context	alert rendering	medium
level	Event / alert intelligence	derived_internal	event_context	alert rendering	low
title	Event / alert intelligence	derived_internal	event_context	alert rendering	low
summary_short	Event / alert intelligence	derived_internal	event_context	alert rendering	low
source_code	Event / alert intelligence	swpc_alerts / donki_events	event_context	debug / detail popover	low
raw_title	Event / alert intelligence	swpc_alerts / donki_events	event_context	debug / detail popover	low
raw_body	Event / alert intelligence	swpc_alerts / donki_events	event_context	debug / detail popover	low
relevance	Event / alert intelligence	derived_internal	event_context	alert ordering	medium
dedupe_key	Event / alert intelligence	derived_internal	event_context	backend / debug	low


⸻

5.12 Timeline

Field	Semantic class	Source origin	Temporal type	UI consumer	Consistency risk
timeline	Event / alert intelligence	swpc_alerts + donki_events + derived_internal	event_context	Solar Activity Timeline	low

Common timeline fields:

Field	Semantic class	Source origin	Temporal type	UI consumer	Consistency risk
event_time	Event / alert intelligence	derived_internal	event_context	timeline placement	low
event_type	Event / alert intelligence	derived_internal	event_context	icon / timeline rendering	low
event_title	Event / alert intelligence	derived_internal	event_context	timeline rendering	low
level	Event / alert intelligence	derived_internal	event_context	timeline styling	low
severity_label	Event / alert intelligence	derived_internal	event_context	timeline styling	medium
description	Event / alert intelligence	derived_internal	event_context	tooltip / detail	low
source	Event / alert intelligence	swpc_alerts / donki_events	event_context	debug / tooltip	low
is_active	Event / alert intelligence	derived_internal	event_context	highlight logic	medium
is_future	Event / alert intelligence	derived_internal	event_context	timeline styling	medium
metadata	Event / alert intelligence	mixed	event_context	detail expansion	medium


⸻

5.13 Reserved / future blocks

Field	Semantic class	Source origin	Temporal type	UI consumer	Consistency risk
cme_tracker	Derived interpretation / event view	derived_internal	event_context / future_summary	CME Tracker UI	currently unused

If this remains null or incomplete, it should not be treated as part of current operational UI.

⸻

5.14 Raw / debug

Field	Semantic class	Source origin	Temporal type	UI consumer	Consistency risk
raw	Debug / raw bookkeeping	derived_internal	meta	none / debug	low
raw.alerts_count	Debug / raw bookkeeping	derived_internal	meta	debug	low


⸻

6. Current architectural diagnosis

The current JSON is structurally useful, but semantically it blends multiple layers.

Clean areas

These are relatively well-behaved:
	•	current scalar metrics
	•	historical series
	•	Kp forecast series
	•	forecast summary
	•	normalized alerts / timeline

Risky areas

These are semantically mixed and likely cause UI confusion:
	•	summary
	•	scales
	•	parts of observer_impacts
	•	aurora_hint
	•	coronal_hole

⸻

7. Main consistency risks

Risk 1 — Current vs forecast ambiguity

Fields such as summary, scales, and aurora_hint do not explicitly declare whether they refer to:
	•	current state
	•	forecast state
	•	watch/alert context

Risk 2 — Badge ambiguity

g_scale, r_scale, s_scale are currently under-typed from the UI perspective.

Risk 3 — Mixed derivation horizon

A single hero-level interpretation may draw from:
	•	current Kp
	•	next-24h Kp forecast
	•	active alerts
	•	future event context

That makes it hard for the UI to remain internally consistent.

Risk 4 — Cadence mismatch

Historical series use different cadences:
	•	Kp coarse step
	•	X-ray hourly
	•	Bz 5m
This is manageable, but needs explicit handling.

⸻

8. Recommended semantic grouping for future refactor

This is not yet a required change, but it is the recommended future target model.

HelioNow
├── meta
├── current
├── history
├── forecast
├── interpretation
└── events

current

Current measured scalar values only.

history

Past time series only.

forecast

Future series and compact future summaries only.

interpretation

Observer-oriented and product-facing wording layers.

events

Alerts, preview, timeline, CME/event intelligence.

⸻

9. Immediate practical use of this table

This inventory can already support three short-term improvements:

A. UI temporal anchoring

Only use:
	•	metrics.* current in Hero / Indicators / current Observer Impacts
	•	metrics.*history* in History
	•	forecast + kp_forecast_3h in Forecast

B. Badge relabeling

Treat scales as alert/forecast context until backend semantics are clarified.

C. Refactor planning

Use this table to identify which fields must later move into:
	•	current
	•	forecast
	•	events
	•	interpretation

⸻

10. Acceptance criteria

This field inventory is complete when:
	1.	every top-level and major nested field is classified
	2.	temporal ambiguity is identified explicitly
	3.	risky derived fields are distinguished from clean measured data
	4.	the table can be used to drive UI cleanup and later JSON refactoring
	5.	current, forecast, interpretation, and event layers are clearly separated conceptually

⸻

11. Recommended next step

The most useful next document would be:

Helio JSON Refactor Proposal v1

That would not yet rewrite the backend, but would propose:
	•	target top-level structure
	•	field moves
	•	renamed fields
	•	deprecated fields
	•	compatibility strategy

That would turn this inventory into an actual migration map for the backend.