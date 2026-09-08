Helio Content and Wording Catalog v1

1. Purpose

This catalog defines the canonical user-facing text for the new helio component.

Its goal is to ensure that:
	•	wording is stable
	•	the UI does not invent ad hoc copy
	•	the component sounds consistent across all states
	•	raw SWPC language is translated into product language
	•	observer-facing phrasing remains conservative and readable

This is a copy/spec layer, not a code layer.

⸻

2. Writing principles

All visible Helio text must follow these rules:
	•	short
	•	plain-language
	•	operational
	•	observer-oriented
	•	conservative
	•	non-dramatic
	•	consistent across states

The component should sound like a calm operational console, not like a raw government feed and not like a sensational news card.

⸻

3. Allowed terminology

These terms are allowed as-is in visible UI because they are short and standard enough:
	•	Space Weather
	•	Kp
	•	G0–G5
	•	R0–R5
	•	S0–S5
	•	CME
	•	X-ray
	•	IMF Bz
	•	Aurora
	•	Solar Wind
	•	UTC

These terms should not require special explanation in the card itself.

⸻

4. Disallowed or secondary-first terminology

These must not appear as primary visible wording:
	•	WARK04
	•	ALTK05
	•	Space Weather Message Code
	•	raw NOAA bulletin labels as title text
	•	unexplained provider acronyms as the main headline
	•	long copied SWPC bulletin fragments

These may appear only in low-priority detail areas.

⸻

5. Component title catalog

5.1. Primary title

Use:

Space Weather

5.2. Do not use as visible title

Do not use:
	•	Helio
	•	SWPC
	•	NOAA SWPC Feed
	•	Solar-Terrestrial Conditions

Those may exist internally, but not as primary v1 UI title.

⸻

6. Freshness wording catalog

Use compact relative wording in header.

Preferred forms:
	•	Updated just now
	•	Updated 5 min ago
	•	Updated 18 min ago
	•	Updated 1h ago
	•	Updated 3h ago

Fallbacks:
	•	Updated recently
	•	Update time unavailable

Do not use:
	•	raw ISO timestamp
	•	last modified
	•	ingested at
	•	provider sync complete

⸻

7. Status label catalog

Canonical status labels:
	•	Quiet
	•	Active
	•	Elevated
	•	Storm Risk

These labels are short, stable, and easy to scan.

Do not use in v1:
	•	Nominal
	•	Moderate
	•	Severe
	•	Disturbed
	•	Critical

Reason:
	•	they create ambiguity with severity scales or sound too alarming.

⸻

8. Top summary text catalog

This is the main one-line summary under the status label.

8.1. Quiet

Preferred:
	•	Quiet geomagnetic conditions. No significant observer impact.
	•	Quiet space weather conditions. No major impact expected.

Allowed fallback:
	•	Conditions are quiet. No notable space weather impact.

8.2. Active

Preferred:
	•	Space weather is mildly active. Conditions may improve aurora chances at high latitudes.
	•	Activity is mildly elevated, with no major operational impact indicated.

Allowed fallback:
	•	Conditions are somewhat active, but impacts remain limited.

8.3. Elevated

Preferred:
	•	Elevated space weather conditions. Aurora chances may improve at high latitudes.
	•	Elevated activity may bring minor radio or geomagnetic effects.

Allowed fallback:
	•	Conditions are elevated and may bring observer-relevant effects.

8.4. Storm

Preferred:
	•	Storm-level space weather conditions are present or possible. Operational impacts may increase.
	•	Strong geomagnetic or radio impacts are possible in the current window.

Allowed fallback:
	•	Space weather activity is at storm level or trending there.

⸻

9. Summary text rules

Summary text must satisfy all of the following:
	•	1 sentence preferred
	•	2 short sentences maximum
	•	no raw codes
	•	no exact scientific diagnostics unless needed
	•	no user-specific promise
	•	no sensational phrasing

Avoid:
	•	Dangerous conditions
	•	Major disruption imminent
	•	Severe solar threat
	•	Aurora will be visible tonight

⸻

10. Metric label catalog

Use these canonical labels:
	•	Solar Wind
	•	X-ray
	•	IMF Bz
	•	Aurora

Do not rename casually to:
	•	Wind Speed
	•	Solar Flux
	•	Bz Index
	•	Auroral Outlook

Reason:
	•	v1 should keep labels compact and stable.

⸻

11. Metric value wording catalog

11.1. Solar Wind

Format:
	•	503 km/s
	•	621 km/s

Fallback:
	•	—

Do not use:
	•	too many decimals
	•	kilometers per second

11.2. X-ray

Format:
	•	A-class
	•	B-class
	•	C-class
	•	M-class
	•	X-class

Fallback:
	•	—

11.3. IMF Bz

Format:
	•	−7 nT
	•	+3 nT

Fallback:
	•	—

11.4. Aurora

Format:
	•	None
	•	Possible
	•	Good

Do not use here:
	•	full sentence in metric cell
	•	Likely visible
	•	Strong opportunity

⸻

12. Forecast summary catalog

This is the one-line sentence above the Kp forecast strip.

12.1. When a forecast peak exists

Preferred:
	•	Peak Kp next 24h: 3.7 at 06:00 UTC
	•	Peak Kp next 24h: 5.0 at 03:00 UTC

12.2. When forecast remains low

Preferred:
	•	Kp remains low in the next 24 hours
	•	No notable geomagnetic rise is indicated in the next 24 hours

12.3. When trend is rising

Preferred:
	•	Geomagnetic activity may rise in the next 24 hours
	•	Kp is expected to increase later in the forecast window

12.4. When trend is falling

Preferred:
	•	Geomagnetic activity may ease in the next 24 hours
	•	Kp is expected to decrease through the forecast window

12.5. Missing forecast

Use:
	•	Kp forecast unavailable

Do not use:
	•	No data points returned
	•	Forecast ingest failed
	•	Null forecast

⸻

13. Observer impact label catalog

Stable row labels:
	•	Aurora
	•	Radio impact
	•	Solar activity

These should remain fixed across states.

Do not use:
	•	HF status
	•	Flare index
	•	Auroral potential

Those can exist later, but not in v1 main rows.

⸻

14. Observer impact summary catalog

14.1. Aurora impact

none

Preferred:
	•	No meaningful aurora chance for most users.
	•	No notable aurora signal in the next 24 hours.

low

Preferred:
	•	Aurora may be possible at high latitudes if activity increases.
	•	Some auroral activity is possible at high latitudes.

moderate

Preferred:
	•	Aurora chances look favorable at high latitudes.
	•	Geomagnetic conditions may support stronger auroral activity.

high

Not generally expected in v1, but if needed:
	•	Strong auroral activity may be possible at high latitudes.

Note:
Do not mention a specific city or user unless future location-aware logic exists.

14.2. Radio impact

none

Preferred:
	•	No major radio blackout expected.
	•	No notable HF radio impact is indicated.

low

Preferred:
	•	Minor HF radio impact possible.
	•	Brief radio degradation may occur on the sunlit side of Earth.

moderate

Preferred:
	•	Noticeable HF radio degradation is possible.
	•	Radio communication impact may be more sustained.

high

Preferred:
	•	Strong radio blackout conditions may affect communications.
	•	Significant HF radio disruption is possible.

14.3. Solar activity

none

Preferred:
	•	No significant flare signal.
	•	No notable flare activity is indicated.

low

Preferred:
	•	Low flare activity.
	•	Solar flare activity remains low.

moderate

Preferred:
	•	Elevated flare activity.
	•	Moderate solar flare activity is present or possible.

high

Preferred:
	•	Strong flare activity is present or possible.
	•	High-energy flare activity is elevated.

⸻

15. Alert level label catalog

Canonical visible level markers:
	•	Info
	•	Watch
	•	Warning

These are short and stable.

Do not use:
	•	Alert
	•	Emergency
	•	Advisory
	•	Bulletin

unless a future product decision changes the global vocabulary.

⸻

16. Alert title catalog

These are human-readable titles derived from interpreted event type.

16.1. Geomagnetic storm

Canonical titles by severity:
	•	Minor geomagnetic storm
	•	Moderate geomagnetic storm
	•	Strong geomagnetic storm
	•	Severe geomagnetic storm
	•	Extreme geomagnetic storm

If currently ongoing and product wants explicit wording:
	•	Geomagnetic storm in progress

Use sparingly.

16.2. Geomagnetic watch

Preferred:
	•	Geomagnetic storm watch
	•	Elevated geomagnetic activity possible

16.3. Radio blackout

Canonical titles by severity:
	•	Minor radio blackout warning
	•	Moderate radio blackout warning
	•	Strong radio blackout
	•	Severe radio blackout
	•	Extreme radio blackout

16.4. Radiation storm

Canonical titles by severity:
	•	Minor radiation storm
	•	Moderate radiation storm
	•	Strong radiation storm
	•	Severe radiation storm
	•	Extreme radiation storm

16.5. CME arrival

Preferred:
	•	CME arrival detected
	•	Interplanetary shock arrival

16.6. CME watch

Preferred:
	•	CME arrival possible
	•	Coronal mass ejection expected

16.7. Aurora watch

Preferred:
	•	Aurora watch
	•	Auroral activity possible

16.8. Solar flare

Preferred:
	•	M-class solar flare
	•	X-class solar flare
	•	Solar flare detected

16.9. Generic info

Preferred:
	•	Space weather update
	•	SWPC information update

16.10. Unknown

Preferred:
	•	Unclassified space weather message

⸻

17. Alert summary catalog

One-line alert summaries must explain consequence or meaning, not copy raw feed.

17.1. Geomagnetic storm

Preferred:
	•	Elevated geomagnetic activity may improve aurora chances at high latitudes.
	•	Geomagnetic conditions are strongly disturbed.

17.2. Geomagnetic watch

Preferred:
	•	Geomagnetic conditions may intensify in the next forecast window.
	•	Aurora chances may improve if activity increases.

17.3. Radio blackout

Preferred:
	•	Brief HF radio degradation possible on the sunlit side of Earth.
	•	Radio communication impact may be significant.

17.4. Radiation storm

Preferred:
	•	Energetic particle activity is elevated.
	•	Radiation conditions are disturbed.

17.5. CME arrival

Preferred:
	•	A coronal mass ejection has reached near-Earth space.
	•	Geomagnetic activity may increase after shock arrival.

17.6. CME watch

Preferred:
	•	Solar ejecta may reach Earth in the forecast window.
	•	Geomagnetic conditions could intensify after arrival.

17.7. Aurora watch

Preferred:
	•	Aurora visibility may improve at high latitudes.
	•	Elevated auroral activity is possible.

17.8. Solar flare

Preferred:
	•	Solar flare activity is elevated.
	•	A strong flare was detected from the Sun.

17.9. Generic info

Preferred:
	•	General space weather information update.
	•	No specific observer-relevant impact identified.

17.10. Unknown

Preferred:
	•	Message could not be classified reliably.

⸻

18. Empty-state catalog

18.1. No alerts

Use:
	•	No significant recent SWPC alerts

Allowed fallback:
	•	No notable recent alerts

18.2. No forecast

Use:
	•	Kp forecast unavailable

18.3. Sparse telemetry

Use:
	•	Some space weather metrics are currently unavailable

18.4. Partial data degradation

Use:
	•	Space weather data is partially unavailable

18.5. Full dataset load error

Use:
	•	Space weather data unavailable

Do not use:
	•	backend error wording
	•	stack traces
	•	provider-specific failure text

⸻

19. Placeholder and fallback symbol rules

Use em dash for missing scalar values:
	•	—

Examples:
	•	X-ray: —
	•	Solar Wind: —
	•	IMF Bz: —

Do not use:
	•	null
	•	N/A everywhere
	•	undefined
	•	missing

For narrative fallback, use explicit short sentences instead.

⸻

20. Timestamp wording catalog

Alert timestamps in visible UI should be short and UTC-explicit.

Preferred:
	•	8 Mar, 14:58 UTC
	•	09 Mar, 03:00 UTC

Relative wording may be used in header freshness only, not for alert row timestamps.

Do not use:
	•	raw ISO strings
	•	locale-dependent ambiguous numeric dates like 03/08/26

⸻

21. Kp / scale display wording rules

Use compact notation in summary block:
	•	Kp 2.3
	•	G0
	•	R1
	•	S0

Do not expand in the main top row to:
	•	Geomagnetic Scale G0
	•	Radio Blackout Scale R1
	•	Radiation Storm Scale S0

Those are too verbose for the main card.

If a future tooltip layer exists, expansion can happen there.

⸻

22. Tone rules for caution wording

The card should use graded caution language.

low-signal language
	•	possible
	•	minor
	•	limited
	•	low
	•	mildly active

medium-signal language
	•	elevated
	•	noticeable
	•	stronger
	•	more sustained

high-signal language
	•	strong
	•	severe
	•	storm-level
	•	significant

Avoid jumping from low to catastrophic language.

⸻

23. Prohibited wording patterns

Do not use in v1 visible UI:
	•	threat
	•	danger
	•	hazard unless domain absolutely demands it
	•	catastrophic
	•	massive solar attack
	•	Earth under solar assault
	•	You are likely to see aurora tonight
	•	Communications will fail
	•	Critical event
	•	red alert

This component is operational, not sensational.

⸻

24. Canonical wording table

Context	Canonical text
Title	Space Weather
Quiet status	Quiet
Active status	Active
Elevated status	Elevated
Storm status	Storm Risk
No alerts	No significant recent SWPC alerts
No forecast	Kp forecast unavailable
Data unavailable	Space weather data unavailable
Partial data	Space weather data is partially unavailable
Aurora none	No meaningful aurora chance for most users.
Aurora possible	Aurora may be possible at high latitudes if activity increases.
Aurora good	Aurora chances look favorable at high latitudes.
Radio none	No major radio blackout expected.
Radio low	Minor HF radio impact possible.
Radio moderate	Noticeable HF radio degradation is possible.
Radio high	Strong radio blackout conditions may affect communications.
Solar none	No significant flare signal.
Solar low	Low flare activity.
Solar moderate	Elevated flare activity.
Solar high	Strong flare activity is present or possible.

This table should be treated as the preferred wording baseline.

⸻

25. Copy flexibility rules

Implementation may choose among the preferred phrases listed above, but must not:
	•	invent new severity vocabulary casually
	•	rewrite terms into a different tone
	•	expose provider raw codes as titles
	•	add educational paragraphs into the card
	•	mix scientific detail and user copy inconsistently

If a phrase is not in the catalog, it should follow the same tone and structure.

⸻

26. Localization readiness note

Even if v1 is English-first, wording should remain localization-friendly:
	•	keep sentences short
	•	avoid idioms
	•	avoid metaphors
	•	avoid humor in operational text
	•	avoid culture-specific expressions

This will make future RU/EN parity easier.

⸻

27. Acceptance criteria

The wording catalog is acceptable when:
	1.	the component can be fully rendered without ad hoc copy invention
	2.	primary titles and summaries are human-readable
	3.	alert titles are not raw SWPC bulletin text
	4.	empty and degraded states have stable language
	5.	aurora/radio/solar rows sound consistent with the rest of the card
	6.	the component tone remains calm and operational across all states

⸻

28. Recommended next spec block

The next logical spec is:

Helio data contract v1 (final consolidated)

That would merge everything already defined into one implementation-ready contract:
	•	input assumptions
	•	normalized event model
	•	aggregate state model
	•	final helio_now.json schema
	•	required vs optional fields
	•	nullability rules
	•	ordering and retention rules

That would give you one clean source-of-truth section to hand over for implementation.