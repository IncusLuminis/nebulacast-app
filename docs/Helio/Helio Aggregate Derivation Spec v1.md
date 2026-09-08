Aggregate Derivation Spec v1

1. Purpose

This layer builds the top-level Space Weather state from two upstream inputs:
	1.	numeric metrics
	•	Kp latest
	•	Kp forecast
	•	X-ray flux / class
	•	solar wind speed
	•	IMF Bz if available
	2.	interpreted events
	•	HelioEvent[] from SWPC alerts interpreter

Its output is the normalized aggregate state used by the new component:
	•	summary
	•	g_scale
	•	r_scale
	•	s_scale
	•	topline status
	•	aurora_hint
	•	observer_impacts
	•	alerts_preview
	•	alerts_all

This layer must be deterministic, conservative, and observer-oriented.

⸻

2. Inputs

2.1. Metrics input

export interface HelioMetricsInput {
  updated_utc: string;
  kp_latest: number | null;
  kp_time_utc: string | null;
  kp_forecast_3h: Array<{
    t_utc: string;
    kp: number;
  }>;
  xray_flux_wm2: number | null;
  xray_class: "A" | "B" | "C" | "M" | "X" | null;
  solar_wind_kms: number | null;
  imf_bz_nt: number | null;
}

2.2. Events input

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

3. Output

Recommended aggregate object:

export interface HelioAggregateState {
  updated_utc: string;

  summary: {
    status: "quiet" | "active" | "elevated" | "storm";
    label: string;
    text: string;
  };

  scales: {
    g_scale: "G0" | "G1" | "G2" | "G3" | "G4" | "G5";
    r_scale: "R0" | "R1" | "R2" | "R3" | "R4" | "R5";
    s_scale: "S0" | "S1" | "S2" | "S3" | "S4" | "S5";
  };

  forecast: {
    kp_max_next_24h: number | null;
    kp_max_at_utc: string | null;
    trend: "falling" | "steady" | "rising" | "unknown";
  };

  aurora_hint: {
    aurora_possible: boolean;
    aurora_min_lat_est: number | null;
    aurora_label: "none" | "possible" | "good";
    summary: string;
  };

  observer_impacts: Array<{
    kind: "aurora" | "radio" | "solar_activity";
    level: "none" | "low" | "moderate" | "high";
    label: string;
    summary: string;
  }>;

  alerts_preview: HelioEvent[];
  alerts_all: HelioEvent[];
}


⸻

4. Time window rules

Aggregate derivation must use explicit windows.

4.1. Current-state window

Use the last 24 hours relative to updated_utc for:
	•	current G/R/S derivation
	•	summary/status derivation
	•	alerts relevance for preview
	•	observer impact state

4.2. Forecast window

Use the next 24 hours for:
	•	kp_max_next_24h
	•	kp_max_at_utc
	•	aurora_hint

4.3. Extended retention window

Keep up to 72 hours of events in alerts_all if they remain relevant enough for display/history, but do not let stale events dominate current state.

⸻

5. Aggregate scale derivation

5.1. G-scale derivation

Goal: produce one aggregate g_scale.

Priority order:
	1.	maximum geomagnetic_storm severity in current-state window
	2.	maximum geomagnetic_watch severity in current-state window
	3.	Kp fallback mapping
	4.	default G0

Rule

If any geomagnetic_storm event exists in last 24h:
	•	g_scale = max severity among those events

Else if any geomagnetic_watch event exists in last 24h:
	•	g_scale = max severity among those events

Else if Kp metrics available:
	•	infer from Kp fallback:
	•	kp < 5 → G0
	•	5 <= kp < 6 → G1
	•	6 <= kp < 7 → G2
	•	7 <= kp < 8 → G3
	•	8 <= kp < 9 → G4
	•	kp >= 9 → G5

Else:
	•	G0

Note

Event-derived G scale has priority over Kp fallback, because SWPC event classification is semantically stronger than local heuristic mapping.

⸻

5.2. R-scale derivation

Priority order:
	1.	maximum radio_blackout severity in current-state window
	2.	X-ray fallback only if no event severity exists
	3.	default R0

Rule

If radio_blackout events exist in last 24h:
	•	r_scale = max severity among those events

Else fallback from X-ray class:
	•	X → at least R3
	•	M → at least R1
	•	C/B/A/null → R0

Conservative v1 mapping:
	•	X → R3
	•	M → R1
	•	other → R0

Else:
	•	R0

Note

Do not attempt fine R1..R5 derivation from X-ray flux alone in v1.

⸻

5.3. S-scale derivation

Priority order:
	1.	maximum radiation_storm severity in current-state window
	2.	default S0

Rule

If radiation_storm events exist in last 24h:
	•	s_scale = max severity among those events
Else:
	•	S0

No metric fallback is required in v1.

⸻

6. Kp forecast derivation

6.1. kp_max_next_24h

Take maximum Kp over forecast points where:
	•	t_utc >= updated_utc
	•	t_utc < updated_utc + 24h

If no eligible forecast points exist:
	•	kp_max_next_24h = null
	•	kp_max_at_utc = null

6.2. kp_max_at_utc

Timestamp of the first maximum value in the next-24h forecast window.

6.3. Trend derivation

Trend is derived from forecast sequence only.

Rule:
	•	need at least 2 forecast points
	•	compare first eligible point and last eligible point

Suggested thresholds:
	•	if last - first >= 0.7 → rising
	•	if last - first <= -0.7 → falling
	•	otherwise → steady

If not enough forecast points:
	•	unknown

⸻

7. X-ray normalization rule

If xray_class is missing but xray_flux_wm2 exists, derive class from flux.

if flux < 1e-7 => "A"
if flux < 1e-6 => "B"
if flux < 1e-5 => "C"
if flux < 1e-4 => "M"
else "X"

If both class and flux are missing:
	•	class remains null

If both exist and disagree:
	•	prefer provider class if source is trusted
	•	otherwise prefer flux-derived class
	•	implementation detail can stay backend-specific, but output must be consistent

⸻

8. Top-level status derivation

The aggregate top-level status must be a single conservative label:

"quiet" | "active" | "elevated" | "storm"

8.1. Status priority model

This should be severity-driven, not metric-count-driven.

storm

Set status to storm if any of the following is true:
	•	g_scale >= G3
	•	r_scale >= R3
	•	s_scale >= S3
	•	confirmed cme_arrival plus g_scale >= G2
	•	xray_class == "X"

elevated

Set status to elevated if not storm and any of the following is true:
	•	g_scale >= G1
	•	r_scale >= R1
	•	s_scale >= S1
	•	xray_class == "M"
	•	kp_latest >= 5
	•	kp_max_next_24h >= 5

active

Set status to active if not above and any of the following is true:
	•	kp_latest >= 4
	•	kp_max_next_24h >= 4
	•	solar_wind_kms >= 550
	•	imf_bz_nt <= -5 if available
	•	relevant geomagnetic_watch or aurora_watch exists

quiet

Otherwise:
	•	quiet

⸻

8.2. Status label mapping

quiet    -> "Quiet"
active   -> "Active"
elevated -> "Elevated"
storm    -> "Storm Risk"

UI may change wording later, but normalized label should stay stable.

⸻

9. Top-level summary text derivation

The summary text is a one-line human-oriented interpretation.

It should be generated from status + dominant drivers.

9.1. Summary generation priority

Choose one primary driver in this order:
	1.	storm-level geomagnetic event
	2.	storm-level radio blackout
	3.	storm-level radiation storm
	4.	CME arrival
	5.	elevated geomagnetic conditions / aurora potential
	6.	elevated flare activity
	7.	quiet conditions

9.2. Canonical summary templates

Quiet
	•	Quiet geomagnetic conditions. No significant observer impact.
	•	Quiet space weather conditions. No major impact expected.

Active
	•	Space weather is mildly active. Conditions may improve aurora chances at high latitudes.
	•	Activity is elevated slightly, but no major operational impact is indicated.

Elevated
	•	Elevated space weather conditions. Aurora chances may improve at high latitudes.
	•	Elevated activity may bring minor radio or geomagnetic effects.

Storm
	•	Storm-level space weather conditions are present or possible. Operational impacts may increase.
	•	Strong geomagnetic or radio impacts are possible in the current window.

9.3. Text rules
	•	maximum 1–2 short sentences
	•	observer-oriented
	•	no raw SWPC jargon
	•	no numeric overload
	•	no promises for specific locations

⸻

10. Aurora hint derivation

This is a separate lightweight product-facing inference.

10.1. Inputs used

In priority order:
	1.	kp_max_next_24h
	2.	current/forecast geomagnetic events
	3.	imf_bz_nt if available
	4.	kp_latest

10.2. v1 rule set

Use conservative thresholds.

Base derivation from kp_max_next_24h
	•	if kp_max_next_24h < 4:
	•	aurora_possible = false
	•	aurora_min_lat_est = null
	•	aurora_label = "none"
	•	if 4 <= kp_max_next_24h < 6:
	•	aurora_possible = true
	•	aurora_min_lat_est = 60
	•	aurora_label = "possible"
	•	if kp_max_next_24h >= 6:
	•	aurora_possible = true
	•	aurora_min_lat_est = 55
	•	aurora_label = "good"

10.3. Event adjustment

If there is a geomagnetic_storm or geomagnetic_watch event with severity >= 2:
	•	do not downgrade below possible

If there is storm severity >= 3:
	•	allow upgrade to good even if Kp forecast is sparse but current state supports it

10.4. IMF Bz adjustment

If imf_bz_nt exists and is strongly southward:
	•	imf_bz_nt <= -10:
	•	may strengthen confidence by one step, but only if base aurora state is already at least possible

Do not generate possible from Bz alone in v1.

10.5. Aurora summary text

Canonical outputs:

none
	•	No meaningful aurora chance for most users.
	•	No notable aurora signal in the next 24 hours.

possible
	•	Aurora may be possible at high latitudes if activity increases.
	•	Some auroral activity is possible at high latitudes.

good
	•	Aurora chances look favorable at high latitudes.
	•	Geomagnetic conditions may support stronger auroral activity.

10.6. Boundaries

This is not a personal aurora forecast.
It must not mention exact user visibility unless later integrated with location-aware logic.

⸻

11. Observer impacts derivation

The aggregate must produce three observer-facing impact rows:
	•	aurora
	•	radio
	•	solar_activity

These are intentionally product-level summaries, not scientific classifications.

11.1. Aurora impact

Source:
	•	aurora_hint

Mapping:
	•	aurora_label = none -> level = none
	•	aurora_label = possible -> level = low
	•	aurora_label = good -> level = moderate

Summary:
	•	reuse or lightly adapt aurora_hint.summary

Label:
	•	Aurora

11.2. Radio impact

Source:
	•	r_scale

Mapping:
	•	R0 -> none
	•	R1 -> low
	•	R2 or R3 -> moderate
	•	R4 or R5 -> high

Canonical summaries:
	•	none:
	•	No major radio blackout expected.
	•	low:
	•	Minor HF radio impact possible.
	•	moderate:
	•	Noticeable HF radio degradation is possible.
	•	high:
	•	Strong radio blackout conditions may affect communications.

Label:
	•	Radio impact

11.3. Solar activity impact

Source priority:
	1.	xray_class
	2.	flare events in current-state window

Mapping:
	•	null -> none
	•	A/B/C -> low
	•	M -> moderate
	•	X -> high

Canonical summaries:
	•	none:
	•	No significant flare signal.
	•	low:
	•	Low flare activity.
	•	moderate:
	•	Elevated flare activity.
	•	high:
	•	Strong flare activity is present or possible.

Label:
	•	Solar activity

⸻

12. Alerts list derivation

12.1. alerts_all

Contains all deduplicated interpreted events retained within display window, typically up to 72h.

Sorting:
	•	newest first for full list
or
	•	relevance desc then time desc if product wants importance-first list

Recommended v1:
	•	full list sorted by time descending
	•	preview sorted by relevance descending

12.2. alerts_preview

Selection steps:
	1.	take events in current relevance window, usually 72h
	2.	remove deduplicates
	3.	compute relevance
	4.	sort by relevance desc, time desc
	5.	apply soft diversity rule
	6.	take top N

Soft diversity rule

When possible:
	•	do not fill preview with only one event kind if another significant domain exists with comparable relevance

Example:
	•	if top 3 are all space_weather_info, but one radio_blackout exists slightly below, prefer the blackout in preview

This is a product rule, not a physics rule.

⸻

13. Dominant-driver derivation

For summary text and possibly future UI badges, it is useful to derive one dominant driver.

type DominantDriver =
  | "geomagnetic"
  | "radio"
  | "radiation"
  | "cme"
  | "aurora"
  | "flare"
  | "quiet";

Priority order:
	1.	highest severity storm event
	2.	highest severity blackout
	3.	highest severity radiation event
	4.	CME arrival
	5.	aurora watch / geomagnetic watch
	6.	flare
	7.	quiet

This does not need to be exposed in JSON v1 unless useful, but it should guide text generation.

⸻

14. Missing-data behavior

Aggregate derivation must degrade gracefully.

14.1. Missing Kp latest
	•	do not fail status derivation
	•	use events + forecast only

14.2. Missing Kp forecast
	•	kp_max_next_24h = null
	•	kp_max_at_utc = null
	•	trend = unknown
	•	aurora hint relies more on events/current state

14.3. Missing X-ray
	•	xray_class = null
	•	solar activity impact may be driven by flare events or remain none

14.4. Missing solar wind
	•	do not use solar wind in active threshold

14.5. Missing IMF Bz
	•	no Bz adjustment
	•	component must remain fully valid

⸻

15. Conflict resolution rules

Metrics and events may disagree.

15.1. Events vs metrics

Rule:
	•	use events for categorical aggregate scales when available
	•	use metrics as fallback or secondary context

Examples:
	•	Kp suggests active conditions, but explicit G2 watch exists → G2
	•	X-ray class is M, but R2 blackout event exists → R2 wins for radio impact

15.2. Current vs forecast

Rule:
	•	summary/status should emphasize current or near-current state
	•	aurora hint may use forecast more strongly
	•	preview alerts may include recent watches even if current numeric state looks quiet

This prevents overreacting to forecast-only data in the main headline.

⸻

16. Conservative wording policy

The aggregate layer must not overstate.

Use:
	•	possible
	•	may
	•	elevated
	•	conditions could support

Avoid:
	•	will be visible
	•	will affect you
	•	severe threat unless directly supported by event class
	•	location-specific claims

This is especially important for aurora and radio wording.

⸻

17. Recommended JSON field alignment

If you keep the earlier full JSON contract, this aggregate layer should populate:

{
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
    "kp_max_at_utc": "2026-03-09T06:00:00Z",
    "trend": "steady"
  },
  "aurora_hint": {
    "aurora_possible": false,
    "aurora_min_lat_est": null,
    "aurora_label": "none",
    "summary": "No meaningful aurora chance for most users."
  }
}

If you later rename summary to hero or overview, the derivation logic stays exactly the same.

⸻

18. Acceptance criteria for v1

Aggregate derivation is acceptable when:
	1.	one stable status is produced for every valid payload
	2.	g_scale, r_scale, s_scale are always populated
	3.	aurora_hint is always populated, even if conservative
	4.	observer_impacts contains exactly three stable product-facing rows
	5.	alerts_preview is relevance-based, not just newest-first
	6.	stale or malformed data does not break output
	7.	wording remains human-readable and non-alarmist

⸻

19. Recommended next spec block

The next logical spec is:

Helio UI composition spec v1

That would define:
	•	exact widget sections
	•	collapsed vs expanded states
	•	priority of blocks
	•	how summary, metrics, forecast, impacts, and alerts map to visible UI
	•	what should be hidden when data is missing
