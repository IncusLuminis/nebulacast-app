hero в этой спеке — это просто верхний, главный summary-блок компонента.
То есть “главная карточка / главный статус / first-glance state”.

Обычно под hero section в UI понимают верхнюю наиболее заметную зону, которая первой отвечает на вопрос “что здесь главное?”. В нашем случае это:
	•	общий статус Space Weather
	•	короткая интерпретация
	•	ключевые значения вроде Kp / G / R / S

Если термин не нравится, его можно спокойно заменить на что-то более инженерное и менее дизайнерское. Например:
	•	summary
	•	headline
	•	overview
	•	topline

Для вашей кодовой базы я бы даже предпочел summary, потому что это проще и самодокументируемо.
Но если в уже вставленной спеке hero не мешает — можно оставить как UI-термин.

С учетом вашего naming rule фиксируем:
	•	pipeline: services/helio/pipelines/gen_helio.py
	•	старый компонент не трогаем
	•	новый компонент строим отдельно
	•	вывод старого из эксплуатации делаем потом отдельным шагом

Ниже — mapping spec для интерпретатора SWPC alerts.

⸻

SWPC Alerts Interpreter Mapping Spec v1

1. Purpose

The interpreter converts raw SWPC alert/feed records into a normalized event model suitable for:
	•	alerts_preview
	•	alerts_all
	•	g_scale, r_scale, s_scale
	•	observer_impacts
	•	summary / top-level component state

The interpreter must hide SWPC-specific message noise from the UI and produce human-readable, observer-oriented events.

⸻

2. Input

Interpreter input is a list of normalized raw records from NOAA SWPC provider.

Minimal raw record shape:

export interface RawSwpcAlertRecord {
  issuedUtc: string | null;
  messageCode: string | null;
  messageType: string | null;
  title: string | null;
  body: string | null;
  url: string | null;
  source: "NOAA_SWPC";
}

Notes:
	•	messageCode may contain codes such as WARK04, ALTK05, etc.
	•	title and body may vary in structure and completeness
	•	issuedUtc is the canonical event timestamp
	•	interpreter must tolerate partial or malformed records

⸻

3. Output

Interpreter output is a normalized event array:

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

4. Classification goals

Every raw SWPC record must be mapped to one primary class only.

Priority order:
	1.	geomagnetic_storm
	2.	radio_blackout
	3.	radiation_storm
	4.	cme_arrival
	5.	geomagnetic_watch
	6.	cme_watch
	7.	aurora_watch
	8.	solar_flare
	9.	space_weather_info
	10.	unknown

This avoids double-classifying one message into several categories.

⸻

5. Classification rules

5.1. Geomagnetic storm

Map to:

kind = "geomagnetic_storm"
domain = "G"

Triggers:
	•	explicit G1..G5
	•	text contains geomagnetic storm
	•	text contains minor/moderate/strong/severe/extreme geomagnetic storm
	•	text contains kp 5+ only if clearly part of storm classification text

Severity extraction:
	•	G1 -> 1
	•	G2 -> 2
	•	G3 -> 3
	•	G4 -> 4
	•	G5 -> 5

Severity label:
	•	1 → minor
	•	2 → moderate
	•	3 → strong
	•	4 → severe
	•	5 → extreme

Human title examples:
	•	Minor geomagnetic storm
	•	Strong geomagnetic storm in progress

Short summaries:
	•	Elevated geomagnetic activity may improve aurora chances at high latitudes.
	•	Geomagnetic conditions are strongly disturbed.

Level:
	•	warning

⸻

5.2. Geomagnetic watch

Map to:

kind = "geomagnetic_watch"
domain = "G"

Triggers:
	•	text contains geomagnetic watch
	•	text contains geomagnetic activity expected
	•	text contains geomagnetic conditions likely
	•	text contains G1..G5 in forecast/watch context rather than confirmed storm context

Severity extraction:
	•	same as for storm if present, else null

Human title examples:
	•	Geomagnetic storm watch
	•	Elevated geomagnetic activity possible

Short summaries:
	•	Geomagnetic conditions may intensify in the next forecast window.
	•	Aurora chances may improve if activity increases.

Level:
	•	watch

⸻

5.3. Radio blackout

Map to:

kind = "radio_blackout"
domain = "R"

Triggers:
	•	explicit R1..R5
	•	text contains radio blackout
	•	text contains HF radio blackout
	•	text contains x-ray event caused radio blackout
	•	SWPC warning/watch language tied to blackout

Severity extraction:
	•	R1 -> 1
	•	R2 -> 2
	•	R3 -> 3
	•	R4 -> 4
	•	R5 -> 5

Severity labels:
	•	1 → minor
	•	2 → moderate
	•	3 → strong
	•	4 → severe
	•	5 → extreme

Human title examples:
	•	Minor radio blackout warning
	•	Strong radio blackout in progress

Short summaries:
	•	Brief HF radio degradation possible on the sunlit side of Earth.
	•	Radio communication impact may be significant.

Level:
	•	warning if confirmed/current
	•	watch if forecast/possible wording only

⸻

5.4. Radiation storm

Map to:

kind = "radiation_storm"
domain = "S"

Triggers:
	•	explicit S1..S5
	•	text contains solar radiation storm
	•	text contains proton event
	•	text contains energetic particle event in SWPC storm context

Severity extraction:
	•	S1 -> 1
	•	S2 -> 2
	•	S3 -> 3
	•	S4 -> 4
	•	S5 -> 5

Human title examples:
	•	Solar radiation storm
	•	Moderate radiation storm warning

Short summaries:
	•	Energetic particle activity is elevated.
	•	Radiation environment is disturbed.

Level:
	•	warning if current
	•	watch if expected/possible

⸻

5.5. CME arrival

Map to:

kind = "cme_arrival"
domain = "cme"

Triggers:
	•	text contains CME arrival
	•	text contains shock arrival
	•	text contains interplanetary shock
	•	text contains CME impact detected
	•	text contains coronal mass ejection arrival

Severity:
	•	null unless message explicitly includes linked G-scale expectation, in which case keep kind as CME but do not convert severity to G automatically in event row

Human title examples:
	•	CME arrival detected
	•	Interplanetary shock arrival

Short summaries:
	•	A coronal mass ejection has reached near-Earth space.
	•	Geomagnetic activity may increase after shock arrival.

Level:
	•	warning if detected/arrived
	•	watch if arrival expected

⸻

5.6. CME watch

Map to:

kind = "cme_watch"
domain = "cme"

Triggers:
	•	text contains CME expected
	•	text contains CME arrival expected
	•	text contains shock likely
	•	text contains CME may arrive

Human title examples:
	•	CME arrival possible
	•	Coronal mass ejection expected

Short summaries:
	•	Solar ejecta may reach Earth in the forecast window.
	•	Geomagnetic conditions could intensify after arrival.

Level:
	•	watch

⸻

5.7. Aurora watch

Map to:

kind = "aurora_watch"
domain = "aurora"

Use only when the message is explicitly aurora-oriented and is not better classified as a geomagnetic event.

Triggers:
	•	text contains aurora may be visible
	•	text contains auroral activity
	•	text contains aurora watch

Human title examples:
	•	Aurora watch
	•	Auroral activity possible

Short summaries:
	•	Aurora visibility may improve at high latitudes.
	•	Elevated auroral activity is possible.

Level:
	•	watch

⸻

5.8. Solar flare

Map to:

kind = "solar_flare"
domain = "flare"

Use only if message is clearly about flare activity and does not already map better to radio blackout.

Triggers:
	•	explicit flare class such as M1.2, X2.0
	•	text contains solar flare
	•	text contains x-class flare
	•	text contains m-class flare

Severity:
	•	keep null
	•	severity_label may store flare class family:
	•	M
	•	X

Human title examples:
	•	M-class solar flare
	•	X-class flare detected

Short summaries:
	•	Solar flare activity is elevated.
	•	A strong flare was detected from the Sun.

Level:
	•	info by default
	•	warning only for explicit X-class with operational impact language

⸻

5.9. Space weather info

Map to:

kind = "space_weather_info"
domain = "info"

Triggers:
	•	generic SWPC message
	•	no clear operational class
	•	summary/information bulletin
	•	miscellaneous operational update

Human title examples:
	•	Space weather update
	•	SWPC information message

Short summaries:
	•	General space weather information update.
	•	No specific observer-relevant impact identified.

Level:
	•	info

⸻

5.10. Unknown

Fallback only.

Map to:

kind = "unknown"
domain = "unknown"

Human title:
	•	Unclassified space weather message

Short summary:
	•	Message could not be classified reliably.

Level:
	•	info

Interpreter must still preserve:
	•	source code
	•	raw title
	•	raw body

⸻

6. Level mapping

Operational display level:

type EventLevel = "info" | "watch" | "warning";

Rules:
	•	warning:
	•	confirmed/current storm or blackout
	•	arrival detected
	•	strong operational event in progress
	•	watch:
	•	forecast / possible / expected / likely
	•	info:
	•	generic update
	•	flare message without clear operational consequences
	•	unclassified bulletin

⸻

7. Severity extraction rules

Interpreter should extract severity in this order:
	1.	Explicit domain scales:
	•	G1..G5
	•	R1..R5
	•	S1..S5
	2.	Verbal severity keywords:
	•	minor -> 1
	•	moderate -> 2
	•	strong -> 3
	•	severe -> 4
	•	extreme -> 5
	3.	Otherwise null

Important:
	•	verbal severity should only be applied when tied to the correct domain
	•	e.g. strong flare is not the same as G3

⸻

8. Title generation rules

UI title must be human-readable and short.

Preferred format:
	•	[severity] [domain/event type]
	•	no raw SWPC code in title
	•	no Space Weather Message Code: ... in title

Examples:
	•	Minor geomagnetic storm
	•	Geomagnetic storm watch
	•	Minor radio blackout warning
	•	CME arrival detected
	•	M-class solar flare
	•	Space weather update

Max target length:
	•	about 50–70 characters

⸻

9. Summary generation rules

summary_short should be a one-line consequence-oriented interpretation.

Good:
	•	Aurora chances may improve at high latitudes.
	•	Brief HF radio degradation possible on the sunlit side of Earth.
	•	Geomagnetic conditions may intensify after CME arrival.

Bad:
	•	raw bulletin copy
	•	cryptic SWPC jargon
	•	exact reproduction of NOAA phrasing if it is too technical

Target:
	•	1 sentence
	•	observer-oriented
	•	no unnecessary scientific detail

⸻

10. Dedupe rules

The feed may contain repeated or near-duplicate messages.

Each event must produce a dedupe_key:

dedupe_key = `${kind}|${domain}|${severity ?? "na"}|${level}|${time_bucket}`

Where:
	•	time_bucket = UTC time truncated to 6-hour bucket

Deduplication rule:
	•	if same dedupe_key occurs multiple times:
	•	keep the newest record
	•	or keep the record with richer title/body if timestamps equal

Do not dedupe across different kinds.

Examples:
	•	two radio_blackout R1 messages within same 6h bucket -> keep one
	•	geomagnetic_watch G2 and geomagnetic_storm G2 -> keep both, different kind

⸻

11. Relevance scoring

Interpreter must assign relevance for preview ranking.

Base weights:

geomagnetic_storm   = 1.00
cme_arrival         = 0.95
radio_blackout      = 0.90
radiation_storm     = 0.88
geomagnetic_watch   = 0.82
cme_watch           = 0.78
aurora_watch        = 0.74
solar_flare         = 0.68
space_weather_info  = 0.30
unknown             = 0.20

Modifiers:
	•	+ 0.08 * severity if severity exists
	•	+ 0.10 for warning
	•	+ 0.04 for watch
	•	freshness decay over time
	•	optional duplicate penalty if similar events remain after dedupe

Reference formula:

relevance =
  (baseWeight + severityBoost + levelBoost) * freshnessFactor

Where:
	•	freshnessFactor decays from 1.0 toward 0.15 over 72 hours

⸻

12. Preview selection

alerts_preview should not be a plain slice of newest messages.

Selection algorithm:
	1.	classify all messages
	2.	dedupe
	3.	compute relevance
	4.	sort by relevance desc, then by time desc
	5.	take top N

N:
	•	compact card: 3
	•	expanded card / larger layout: up to 5

Constraint:
	•	try to avoid filling preview with 3 events of identical type if other significant domains exist
	•	soft diversity rule is desirable:
	•	prefer mix across G / R / S / CME when available

⸻

13. Scale derivation rules from events

Interpreter also contributes to aggregate state.

13.1. G-scale

Take maximum confirmed or forecast geomagnetic severity within active time window.

Priority:
	1.	current confirmed geomagnetic storm severity
	2.	geomagnetic watch severity
	3.	default G0

13.2. R-scale

Take maximum radio blackout severity within active window.

Priority:
	1.	confirmed/current blackout
	2.	forecast/watch blackout
	3.	default R0

13.3. S-scale

Take maximum radiation storm severity within active window.

Priority:
	1.	confirmed/current storm
	2.	forecast/watch storm
	3.	default S0

Recommended active window:
	•	24h for “current state”
	•	optionally 48h for extended summary
	•	v1 should stay conservative and use 24h

⸻

14. Time handling

Rules:
	•	canonical output field is always t_utc
	•	if raw timestamp missing but provider record has parseable fallback timestamp, use it
	•	if no reliable time exists, drop the record from preview/all event arrays
	•	never emit local time in normalized event objects

⸻

15. Fault tolerance

Interpreter must not fail the whole pipeline because of one malformed SWPC message.

Required behavior:
	•	skip unreadable records
	•	classify ambiguous records as space_weather_info or unknown
	•	preserve raw text where possible
	•	log parse/classification failures upstream, but still produce JSON

⸻

16. Keyword mapping hints

A practical keyword dictionary should be maintained in code, but spec-level guidance is:

Geomagnetic
	•	geomagnetic
	•	g1, g2, g3, g4, g5
	•	kp=5, kp 5
	•	magnetic field disturbance

Radio blackout
	•	radio blackout
	•	hf radio
	•	r1, r2, r3, r4, r5
	•	x-ray event
	•	degradation on sunlit side

Radiation storm
	•	radiation storm
	•	solar radiation
	•	proton event
	•	energetic particles
	•	s1, s2, s3, s4, s5

Flare
	•	solar flare
	•	m-class
	•	x-class
	•	m1., x1.

CME
	•	cme
	•	coronal mass ejection
	•	shock arrival
	•	interplanetary shock

Aurora
	•	aurora
	•	auroral

This dictionary should be case-insensitive.

⸻

17. Human-readable title mapping examples

Suggested canonical mappings:
	•	geomagnetic_storm + G1 → Minor geomagnetic storm
	•	geomagnetic_storm + G2 → Moderate geomagnetic storm
	•	geomagnetic_watch + G1 → Geomagnetic storm watch
	•	radio_blackout + R1 → Minor radio blackout warning
	•	radio_blackout + R3 → Strong radio blackout
	•	radiation_storm + S2 → Moderate radiation storm
	•	cme_arrival → CME arrival detected
	•	cme_watch → CME arrival possible
	•	solar_flare + M → M-class solar flare
	•	solar_flare + X → X-class solar flare
	•	aurora_watch → Aurora watch
	•	space_weather_info → Space weather update

⸻

18. Non-goals

Interpreter v1 does not:
	•	predict aurora for a specific user location
	•	infer exact visibility conditions
	•	provide scientific-grade heliophysics analysis
	•	merge solar wind / Bz time-series into event rows
	•	attempt deep NLP over SWPC prose

It is a robust operational classifier, not a research parser.

⸻

19. Recommended backend split

For the new component, the interpreter responsibilities should be isolated conceptually as:
	•	provider layer:
	•	fetch raw NOAA SWPC products
	•	normalizer layer:
	•	unify raw provider payloads into internal raw records
	•	interpreter layer:
	•	classify alerts into normalized HelioEvent
	•	derive aggregate scales G/R/S
	•	build preview ranking inputs

Even if Claude later chooses a different exact file split in codebase, this separation should remain at the spec level.

⸻

20. Acceptance criteria for v1

Interpreter v1 is acceptable when:
	1.	Raw SWPC message codes no longer appear as primary UI text
	2.	Top alerts are human-readable
	3.	Major domains G / R / S / CME / flare are classified consistently
	4.	Duplicate alerts are reduced
	5.	alerts_preview shows top relevant events, not just latest events
	6.	Aggregate g_scale, r_scale, s_scale can be derived from interpreted events when needed
	7.	Malformed raw records do not break the pipeline