Helio Data Contract v1 (Final Consolidated)

1. Purpose

This document defines the final consolidated data contract for the new helio domain.

It serves as the implementation-facing source of truth for:
	•	provider normalization assumptions
	•	interpreted SWPC event model
	•	aggregate state derivation output
	•	final helio_now.json schema
	•	required vs optional fields
	•	nullability rules
	•	ordering and retention rules

This contract is designed for the new component only.
The legacy space-weather component and legacy dataset remain untouched during migration.

⸻

2. Naming and scope

Internal naming:
	•	domain: helio
	•	pipeline: services/helio/pipelines/gen_helio.py
	•	dataset: sites/staging/data/helio_now.json

User-facing naming:
	•	component title: Space Weather

This contract covers:
	•	solar-terrestrial state
	•	geomagnetic activity
	•	radio blackout state
	•	radiation storm state
	•	aurora hint
	•	Kp forecast
	•	interpreted SWPC alerts

This contract does not cover:
	•	atmospheric weather
	•	sky-object visibility
	•	aurora maps
	•	geographic overlays
	•	scientific time-series dashboards

⸻

3. Architectural position

The new helio pipeline should be logically separated into these layers:
	1.	provider layer
	2.	normalization layer
	3.	interpretation layer
	4.	aggregate derivation layer
	5.	output serialization layer

At the spec level, this contract describes the final output of those layers, regardless of exact code file split.

⸻

4. Final output artifact

The pipeline must produce:

sites/staging/data/helio_now.json

This artifact must be self-contained enough for the frontend to build the new card without parsing raw provider semantics.

The frontend may still map it into a presentation model, but must not need to interpret NOAA raw codes.

⸻

5. Top-level JSON schema

Final top-level shape:

export interface HelioNow {
  updated_utc: string;

  source: {
    domain: "helio";
    provider: "NOAA_SWPC";
    products: string[];
  };

  metrics: HelioMetrics;
  summary: HelioSummary;
  scales: HelioScales;
  forecast: HelioForecast;
  aurora_hint: HelioAuroraHint;
  observer_impacts: HelioObserverImpact[];
  alerts_preview: HelioEvent[];
  alerts_all: HelioEvent[];
  raw: HelioRawMeta;
}


⸻

6. Field-by-field contract

6.1. updated_utc

updated_utc: string;

Meaning:
	•	canonical output generation timestamp in UTC

Rules:
	•	required
	•	ISO 8601 UTC string
	•	must represent time of final dataset generation, not provider event time

Example:

"updated_utc": "2026-03-10T00:58:00Z"


⸻

6.2. source

interface HelioSource {
  domain: "helio";
  provider: "NOAA_SWPC";
  products: string[];
}

Meaning:
	•	source provenance and high-level provider inventory

Rules:
	•	required
	•	domain must be constant: helio
	•	provider must be constant in v1: NOAA_SWPC
	•	products is the list of upstream products actually used for current payload

Examples:

{
  "domain": "helio",
  "provider": "NOAA_SWPC",
  "products": [
    "planetary_k_index_1m",
    "kp_forecast_3d",
    "alerts",
    "xray_flux",
    "solar_wind"
  ]
}


⸻

6.3. metrics

interface HelioMetrics {
  kp_latest: number | null;
  kp_time_utc: string | null;
  kp_forecast_3h: HelioKpPoint[];
  xray_flux_wm2: number | null;
  xray_class: "A" | "B" | "C" | "M" | "X" | null;
  solar_wind_kms: number | null;
  imf_bz_nt: number | null;
}

6.3.1. kp_latest

Meaning:
	•	latest available Kp value

Rules:
	•	nullable
	•	numeric when available
	•	no string formatting in data layer

Example:

"kp_latest": 2.3

6.3.2. kp_time_utc

Meaning:
	•	UTC timestamp for kp_latest

Rules:
	•	nullable
	•	ISO UTC string when present

6.3.3. kp_forecast_3h

interface HelioKpPoint {
  t_utc: string;
  kp: number;
}

Meaning:
	•	normalized 3-hour Kp forecast points

Rules:
	•	always present as array
	•	may be empty
	•	ordered ascending by t_utc
	•	each point must have:
	•	valid UTC time
	•	numeric Kp

Example:

[
  { "t_utc": "2026-03-10T03:00:00Z", "kp": 2.7 },
  { "t_utc": "2026-03-10T06:00:00Z", "kp": 3.3 }
]

6.3.4. xray_flux_wm2

Meaning:
	•	normalized X-ray flux value in W/m²

Rules:
	•	nullable
	•	numeric when available

6.3.5. xray_class

Meaning:
	•	canonical flare class derived or normalized to:
	•	A
	•	B
	•	C
	•	M
	•	X

Rules:
	•	nullable
	•	must be internally consistent with flux if both exist

6.3.6. solar_wind_kms

Meaning:
	•	solar wind speed in km/s

Rules:
	•	nullable
	•	numeric when available

6.3.7. imf_bz_nt

Meaning:
	•	IMF Bz value in nT

Rules:
	•	nullable
	•	numeric when available
	•	optional in practice; v1 must not depend on it

⸻

6.4. summary

interface HelioSummary {
  status: "quiet" | "active" | "elevated" | "storm";
  label: string;
  text: string;
}

Meaning:
	•	top-level interpreted state for the component

Rules:
	•	required
	•	always populated if payload is valid

6.4.1. status

Allowed values:
	•	quiet
	•	active
	•	elevated
	•	storm

6.4.2. label

Canonical values:
	•	Quiet
	•	Active
	•	Elevated
	•	Storm Risk

Rule:
	•	should match status

6.4.3. text

Meaning:
	•	one-line or short two-line summary for the user

Rules:
	•	required
	•	human-readable
	•	non-alarmist
	•	no raw provider jargon

Example:

{
  "status": "quiet",
  "label": "Quiet",
  "text": "Quiet geomagnetic conditions. No significant observer impact."
}


⸻

6.5. scales

interface HelioScales {
  g_scale: "G0" | "G1" | "G2" | "G3" | "G4" | "G5";
  r_scale: "R0" | "R1" | "R2" | "R3" | "R4" | "R5";
  s_scale: "S0" | "S1" | "S2" | "S3" | "S4" | "S5";
}

Meaning:
	•	aggregate categorical operational scales

Rules:
	•	required
	•	always populated
	•	defaults:
	•	G0
	•	R0
	•	S0

Scale derivation priority:
	•	interpreted events first
	•	metric fallback where defined
	•	safe default otherwise

Example:

{
  "g_scale": "G0",
  "r_scale": "R1",
  "s_scale": "S0"
}


⸻

6.6. forecast

interface HelioForecast {
  kp_max_next_24h: number | null;
  kp_max_at_utc: string | null;
  trend: "falling" | "steady" | "rising" | "unknown";
}

Meaning:
	•	compact next-24h forecast summary derived from kp_forecast_3h

Rules:
	•	required as object
	•	individual fields may be null / unknown

6.6.1. kp_max_next_24h

Meaning:
	•	maximum forecast Kp in next 24 hours

Rules:
	•	nullable numeric

6.6.2. kp_max_at_utc

Meaning:
	•	timestamp of first occurrence of max Kp in next 24 hours

Rules:
	•	nullable UTC string

6.6.3. trend

Allowed values:
	•	falling
	•	steady
	•	rising
	•	unknown

Rule:
	•	always populated

Example:

{
  "kp_max_next_24h": 4.7,
  "kp_max_at_utc": "2026-03-10T21:00:00Z",
  "trend": "rising"
}


⸻

6.7. aurora_hint

interface HelioAuroraHint {
  aurora_possible: boolean;
  aurora_min_lat_est: number | null;
  aurora_label: "none" | "possible" | "good";
  summary: string;
}

Meaning:
	•	lightweight observer-facing aurora inference

Rules:
	•	required
	•	always populated
	•	conservative wording only

6.7.1. aurora_possible

Boolean summary field.

6.7.2. aurora_min_lat_est

Meaning:
	•	rough minimum latitude estimate for meaningful auroral visibility potential

Rules:
	•	nullable
	•	approximate only
	•	must not be interpreted as guaranteed visibility threshold

6.7.3. aurora_label

Allowed values:
	•	none
	•	possible
	•	good

6.7.4. summary

Human-readable summary.

Example:

{
  "aurora_possible": true,
  "aurora_min_lat_est": 60,
  "aurora_label": "possible",
  "summary": "Aurora may be possible at high latitudes if activity increases."
}


⸻

6.8. observer_impacts

interface HelioObserverImpact {
  kind: "aurora" | "radio" | "solar_activity";
  level: "none" | "low" | "moderate" | "high";
  label: string;
  summary: string;
}

Meaning:
	•	stable product-facing observer relevance rows

Rules:
	•	required
	•	must contain exactly 3 rows
	•	fixed order:
	1.	aurora
	2.	radio
	3.	solar_activity

6.8.1. kind

Allowed values:
	•	aurora
	•	radio
	•	solar_activity

6.8.2. level

Allowed values:
	•	none
	•	low
	•	moderate
	•	high

6.8.3. label

Canonical values:
	•	Aurora
	•	Radio impact
	•	Solar activity

6.8.4. summary

Human-readable one-line summary.

Example:

[
  {
    "kind": "aurora",
    "level": "low",
    "label": "Aurora",
    "summary": "Aurora may be possible at high latitudes if activity increases."
  },
  {
    "kind": "radio",
    "level": "none",
    "label": "Radio impact",
    "summary": "No major radio blackout expected."
  },
  {
    "kind": "solar_activity",
    "level": "low",
    "label": "Solar activity",
    "summary": "Low flare activity."
  }
]


⸻

6.9. alerts_preview

Meaning:
	•	compact relevance-ranked subset of interpreted alerts for collapsed UI

Type:

HelioEvent[]

Rules:
	•	required as array
	•	may be empty
	•	sorted by relevance descending, then time descending
	•	target size:
	•	typically 3
	•	may be up to 5 in larger layout contexts
	•	must already be deduplicated

⸻

6.10. alerts_all

Meaning:
	•	fuller interpreted alert list for expanded UI

Type:

HelioEvent[]

Rules:
	•	required as array
	•	may be empty
	•	deduplicated
	•	retained within configured time window
	•	recommended sort:
	•	time descending

⸻

6.11. raw

interface HelioRawMeta {
  alerts_count: number;
}

Meaning:
	•	minimal operational metadata about retained alert volume

Rules:
	•	required as object
	•	alerts_count must be integer >= 0
	•	represents retained/deduplicated alert rows available to UI, not necessarily raw provider line count unless implementation explicitly chooses so

Example:

{
  "alerts_count": 7
}


⸻

7. HelioEvent schema

export interface HelioEvent {
  t_utc: string;
  kind:
    | "geomagnetic_storm"
    | "geomagnetic_watch"
    | "radio_blackout"
    | "radiation_storm"
    | "solar_flare"
    | "cme_arrival"
    | "cme_watch"
    | "aurora_watch"
    | "space_weather_info"
    | "unknown";
  domain: "G" | "R" | "S" | "flare" | "cme" | "aurora" | "info" | "unknown";
  severity: number | null;
  severity_label: string | null;
  level: "info" | "watch" | "warning";
  title: string;
  summary_short: string;
  source_code: string | null;
  raw_title: string | null;
  raw_body: string | null;
  relevance: number;
  dedupe_key: string;
}


⸻

8. HelioEvent field rules

8.1. t_utc

Meaning:
	•	canonical event timestamp

Rules:
	•	required
	•	ISO UTC string
	•	if raw record has no reliable time, event should not be emitted

8.2. kind

Allowed values:
	•	geomagnetic_storm
	•	geomagnetic_watch
	•	radio_blackout
	•	radiation_storm
	•	solar_flare
	•	cme_arrival
	•	cme_watch
	•	aurora_watch
	•	space_weather_info
	•	unknown

Rules:
	•	exactly one primary kind per event

8.3. domain

Allowed values:
	•	G
	•	R
	•	S
	•	flare
	•	cme
	•	aurora
	•	info
	•	unknown

Rules:
	•	must correspond logically to kind

8.4. severity

Meaning:
	•	categorical severity if available

Rules:
	•	nullable
	•	typically 1–5 for G/R/S events
	•	null for flare/CME/info unless explicitly justified

8.5. severity_label

Meaning:
	•	human-readable severity or class marker

Examples:
	•	minor
	•	moderate
	•	strong
	•	severe
	•	extreme
	•	M
	•	X

Rules:
	•	nullable
	•	must remain consistent with event type

8.6. level

Allowed values:
	•	info
	•	watch
	•	warning

Rules:
	•	required
	•	derived from operational meaning

8.7. title

Meaning:
	•	human-readable event title for UI

Rules:
	•	required
	•	short
	•	must not be raw provider code

8.8. summary_short

Meaning:
	•	one-line consequence-oriented summary

Rules:
	•	required
	•	human-readable
	•	no raw NOAA dump text as primary wording

8.9. source_code

Meaning:
	•	provider message code such as WARK04

Rules:
	•	nullable
	•	preserved for detail view / debugging
	•	never primary title

8.10. raw_title

Meaning:
	•	provider raw title if available

Rules:
	•	nullable

8.11. raw_body

Meaning:
	•	provider raw body if available

Rules:
	•	nullable

8.12. relevance

Meaning:
	•	numeric relevance score for preview ranking

Rules:
	•	required
	•	numeric
	•	recommended normalized practical range: 0.0 to ~2.0
	•	exact scale implementation-specific, relative ordering matters more than absolute number

8.13. dedupe_key

Meaning:
	•	stable deduplication identity

Rules:
	•	required
	•	string
	•	generated upstream
	•	not intended for direct user display

⸻

9. Required vs optional summary

9.1. Always required at top level

These fields must always exist in a valid payload:
	•	updated_utc
	•	source
	•	metrics
	•	summary
	•	scales
	•	forecast
	•	aurora_hint
	•	observer_impacts
	•	alerts_preview
	•	alerts_all
	•	raw

9.2. Always required inside objects

Even if values are unknown, these keys must exist:
	•	all keys inside summary
	•	all keys inside scales
	•	all keys inside forecast
	•	all keys inside aurora_hint
	•	all keys inside every observer_impacts row

9.3. Nullable scalar fields

These may be null:
	•	metrics.kp_latest
	•	metrics.kp_time_utc
	•	metrics.xray_flux_wm2
	•	metrics.xray_class
	•	metrics.solar_wind_kms
	•	metrics.imf_bz_nt
	•	forecast.kp_max_next_24h
	•	forecast.kp_max_at_utc
	•	aurora_hint.aurora_min_lat_est
	•	HelioEvent.severity
	•	HelioEvent.severity_label
	•	HelioEvent.source_code
	•	HelioEvent.raw_title
	•	HelioEvent.raw_body

9.4. Arrays that may be empty but must exist
	•	metrics.kp_forecast_3h
	•	alerts_preview
	•	alerts_all

⸻

10. Ordering rules

10.1. metrics.kp_forecast_3h

Must be sorted:
	•	ascending by t_utc

10.2. alerts_preview

Must be sorted:
	•	relevance descending
	•	then t_utc descending

10.3. alerts_all

Recommended sort:
	•	t_utc descending

10.4. observer_impacts

Must be fixed order:
	1.	aurora
	2.	radio
	3.	solar_activity

⸻

11. Retention rules

11.1. Forecast retention

kp_forecast_3h may contain more than 24 hours of normalized forecast points if provider data supports it.

However:
	•	aggregate forecast fields must use next 24h only

11.2. Alerts retention

Recommended retention windows:
	•	current-state derivation: last 24h
	•	preview relevance window: up to 72h
	•	alerts_all retention: up to 72h

This allows context without letting stale alerts dominate current state.

⸻

12. Derivation precedence rules

12.1. Scales

Use:
	1.	interpreted events
	2.	metric fallback
	3.	default scale

12.2. Summary status

Use:
	•	scales first
	•	then major metrics
	•	then supporting watch/aurora context

12.3. Aurora hint

Use:
	1.	Kp next-24h forecast
	2.	geomagnetic events
	3.	IMF Bz adjustment if available
	4.	current Kp fallback

12.4. Observer impacts

Use:
	•	aurora hint for aurora row
	•	R-scale for radio row
	•	X-ray / flare signals for solar-activity row

⸻

13. Missing-data behavior

The contract must remain valid even with sparse upstream input.

13.1. Minimal valid payload

A minimal valid payload may have:
	•	kp_latest = null
	•	empty kp_forecast_3h
	•	no xray_class
	•	no solar_wind_kms
	•	no imf_bz_nt
	•	empty alert arrays

But it must still produce:
	•	summary
	•	scales
	•	forecast
	•	aurora_hint
	•	3 observer impact rows

13.2. Safe fallback defaults

Recommended defaults when insufficient signal exists:
	•	summary.status = "quiet"
	•	summary.label = "Quiet"
	•	summary.text = "Quiet space weather conditions. No major impact expected."
	•	g_scale = "G0"
	•	r_scale = "R0"
	•	s_scale = "S0"
	•	forecast.trend = "unknown"
	•	aurora_label = "none"
	•	observer impacts default to calm wording

⸻

14. Example final payload

{
  "updated_utc": "2026-03-10T00:58:00Z",
  "source": {
    "domain": "helio",
    "provider": "NOAA_SWPC",
    "products": [
      "planetary_k_index_1m",
      "kp_forecast_3d",
      "alerts",
      "xray_flux",
      "solar_wind"
    ]
  },
  "metrics": {
    "kp_latest": 2.3,
    "kp_time_utc": "2026-03-10T00:00:00Z",
    "kp_forecast_3h": [
      { "t_utc": "2026-03-10T03:00:00Z", "kp": 2.7 },
      { "t_utc": "2026-03-10T06:00:00Z", "kp": 3.3 },
      { "t_utc": "2026-03-10T09:00:00Z", "kp": 3.7 }
    ],
    "xray_flux_wm2": 6.2e-7,
    "xray_class": "B",
    "solar_wind_kms": 503,
    "imf_bz_nt": null
  },
  "summary": {
    "status": "quiet",
    "label": "Quiet",
    "text": "Quiet geomagnetic conditions. No significant observer impact."
  },
  "scales": {
    "g_scale": "G0",
    "r_scale": "R0",
    "s_scale": "S0"
  },
  "forecast": {
    "kp_max_next_24h": 3.7,
    "kp_max_at_utc": "2026-03-10T09:00:00Z",
    "trend": "steady"
  },
  "aurora_hint": {
    "aurora_possible": false,
    "aurora_min_lat_est": null,
    "aurora_label": "none",
    "summary": "No meaningful aurora chance for most users."
  },
  "observer_impacts": [
    {
      "kind": "aurora",
      "level": "none",
      "label": "Aurora",
      "summary": "No meaningful aurora chance for most users."
    },
    {
      "kind": "radio",
      "level": "none",
      "label": "Radio impact",
      "summary": "No major radio blackout expected."
    },
    {
      "kind": "solar_activity",
      "level": "low",
      "label": "Solar activity",
      "summary": "Low flare activity."
    }
  ],
  "alerts_preview": [
    {
      "t_utc": "2026-03-09T18:00:00Z",
      "kind": "space_weather_info",
      "domain": "info",
      "severity": null,
      "severity_label": null,
      "level": "info",
      "title": "Space weather update",
      "summary_short": "General space weather information update.",
      "source_code": "ALTK05",
      "raw_title": "Space Weather Message Code: ALTK05",
      "raw_body": null,
      "relevance": 0.28,
      "dedupe_key": "space_weather_info|info|na|info|2026-03-09T18"
    }
  ],
  "alerts_all": [
    {
      "t_utc": "2026-03-09T18:00:00Z",
      "kind": "space_weather_info",
      "domain": "info",
      "severity": null,
      "severity_label": null,
      "level": "info",
      "title": "Space weather update",
      "summary_short": "General space weather information update.",
      "source_code": "ALTK05",
      "raw_title": "Space Weather Message Code: ALTK05",
      "raw_body": null,
      "relevance": 0.28,
      "dedupe_key": "space_weather_info|info|na|info|2026-03-09T18"
    }
  ],
  "raw": {
    "alerts_count": 1
  }
}


⸻

15. Contract stability rules

For v1, the contract should follow these stability rules:
	•	additive changes are allowed
	•	removal or renaming of existing fields is not allowed after implementation starts
	•	enums may be extended only if backward-compatible
	•	frontend must tolerate extra fields
	•	backend must preserve required fields even when values are null or arrays are empty

⸻

16. Versioning note

If you want to future-proof the dataset, you may add:

"schema_version": "helio_now/v1"

at top level.

This is optional for v1 but useful if you expect fast iteration.

If added, it should be placed near the top:

interface HelioNow {
  schema_version?: "helio_now/v1";
  updated_utc: string;
  ...
}


⸻

17. Acceptance criteria

The final contract is acceptable when:
	1.	a frontend can render the new component without parsing raw NOAA semantics
	2.	all top-level objects are always present
	3.	nullable fields are used instead of omitted keys
	4.	alert rows are already normalized and human-readable
	5.	summary/scales/aurora/impacts are always derivable into stable UI
	6.	sparse upstream data still produces a valid payload
	7.	the contract is clearly separate from both sky and weather

⸻

18. Recommended next spec block

The next useful block would be:

Helio implementation checklist v1

That would be a short handoff list for Claude:
	•	what files to create
	•	what legacy parts not to touch
	•	sequence of implementation steps
	•	validation checklist
	•	migration and cutover plan

That would turn the spec set into an execution-ready package.