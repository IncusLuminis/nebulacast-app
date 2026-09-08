
SKY PIPELINES DATA CONTRACT (v1)
	1.	Scope and goals

1.1. This contract defines:
	•	folder layout for sky pipelines and shared code;
	•	naming rules for generator scripts and JSON artifacts;
	•	JSON schemas (required vs optional fields);
	•	backward compatibility rules;
	•	object group taxonomy + frontend emoji mapping.

1.2. Goals:
	•	frontend must be able to consume JSON without schema drift;
	•	legacy JSON schemas are append-only;
	•	new generators must follow the same envelope patterns.

	2.	Repository layout (services/sky)

2.1. Generators live at:
	•	services/sky/pipelines/gen_<group>.py  (one generator per group of objects/events/alerts)

2.2. Shared library code lives at:
	•	services/sky/pipelines/lib/ (new folder; pure python modules, no side effects)
	•	examples: timefmt.py, astro.py, io.py, scoring.py, schema.py

2.3. Data directories:
	•	Source/raw assets (not committed, may be cached/downloaded):
services/sky/data/raw/
	•	Generated canonical outputs for service-side checks and reuse:
services/sky/data/generated/
	•	Published (static site staging) outputs used by frontend:
sites/staging/sky/data/

2.4. Output rule:
Every generator that produces a public dataset MUST write the same JSON to BOTH:
	•	services/sky/data/generated/<name>.json
	•	sites/staging/sky/data/<name>.json

	3.	Versioning and compatibility

3.1. “Legacy JSON” = any JSON already present and consumed by frontend today.
For legacy JSON:
	•	You may ONLY add new fields (append-only).
	•	Do NOT rename, remove, or change type/meaning of existing fields.
	•	Do NOT change time format for existing fields.
	•	Do NOT change numeric units for existing fields.

3.2. New JSON datasets must:
	•	use the same envelope conventions (version/generated_at/source/params/site/window),
	•	follow the same items or frames[]/items[] patterns as defined below.

3.3. version field is an integer schema version for that JSON file.
	•	Increment ONLY when you introduce a breaking change (which we avoid).
	•	For append-only changes, keep the same version.

	4.	Time, frames, coordinates, units

4.1. Time string format
Contract format for “Horizons-like display” timestamps:
	•	YYYY-Mon-DD HH:MMZ (example: 2026-Feb-25 10:02Z)
This is what you standardized to for Sun/Moon and is now the expected display-time format across sky datasets that use “frames”.

If a dataset uses ISO, it must be a different field name (append-only) and MUST NOT replace the existing time field.

4.2. Coordinates
	•	ra_deg, dec_deg are ICRS apparent coordinates in degrees (float).
	•	Alt/Az if present:
	•	alt_deg and az_deg in degrees (float), topocentric for site.

4.3. Magnitudes
	•	mag is V-band apparent magnitude estimate (float).
	•	Precision: store at 2 decimals where applicable.

4.4. Site
	•	site.lat, site.lon in degrees (float)
	•	site.elevation_km in kilometers (float)

	5.	Common JSON envelope (required for all “generated datasets”)

All generated JSON files MUST have:
	•	version: int
	•	generated_at: str (ISO UTC timestamp, e.g. 2026-02-18T11:51:49.496688Z)
	•	source: str (human-readable provenance)
	•	params: object (generator params; append-only)
	•	site: object (lat/lon/elevation_km) when dataset is observer-dependent
	•	window: object when dataset is time-windowed (start/end)

Optional but recommended:
	•	epoch: str (e.g. apparent)
	•	notes: str or warnings: [str] (append-only)

	6.	Dataset types

We support two primary dataset shapes:

A) Point-in-time list (“today”)
Filename pattern:
	•	<objects>_today.json

Schema:
	•	envelope fields (section 5)
	•	date_local: str (local date string; existing consumers rely on it)
	•	items: list[SkyItem]

B) Time-window frames (“week”)
Filename pattern:
	•	<objects>_week.json

Schema:
	•	envelope fields (section 5)
	•	frames: list[Frame]

Frame schema:
	•	date_local: str (existing)
	•	items: list[SkyItem]

	7.	SkyItem schema (must match existing objects_today/objects_week)

SkyItem REQUIRED fields:
	•	id: str (stable identifier)
	•	group: str (one of the group keys below)
	•	type: str (subtype within group; stable string)
	•	name: str (display name)
	•	ra_deg: float
	•	dec_deg: float
	•	mag: float (may be null only if the group cannot provide it; prefer always present)
	•	score: float (ranking score used by frontend lists)

SkyItem OPTIONAL fields (already present in your current JSON; do not break):
	•	meta: object (append-only; group-specific payload)
	•	vis: object (visibility summary; append-only keys)
	•	score_breakdown: object (debug; append-only keys)
	•	note: str (free text)

Important: meta, vis, score_breakdown contents are not strictly typed beyond “object with append-only keys”, because you already use rich breakdown dictionaries. The only hard rule: never remove or rename existing keys once shipped.
	8.	Group taxonomy + frontend emoji

Groups are stable API keys. Frontend should map group -> emoji + label.

Existing (already in your objects_today/week):
	•	planets  → 🪐
	•	dso      → 🌌

Contracted additional groups (to be implemented via new gen_.py only; no changes to existing generators required):

A) Alerts (RA/DEC + Mag direct-to-map)
These should always produce SkyItems with ra_deg/dec_deg/mag (or mag nullable only if impossible).
	•	grb              → 💥   (Gamma-ray bursts; Fermi/Swift feeds)
	•	transients       → 🌟   (TNS-like optical transients, SNe, novae)
	•	variables        → 📈   (AAVSO alerts, variable star outbursts)
	•	neutrino         → 🧊   (IceCube / high-energy neutrino alerts)
	•	gw               → 🌀   (Gravitational-wave sky localizations if converted to points/regions; points only in this contract)

B) Solar / space environment (can be map layers but not always “SkyItem”)
If represented as SkyItems, require RA/DEC only when meaningful; otherwise separate dataset.
	•	solar_flares     → ☀️
	•	aurora           → 🌈
	•	geomagnetic      → 🧲

C) Small bodies (ephemerides-derived; we compute topocentric sky position)
	•	neo              → ☄️   (NEOs/NEAs with ephemerides; daily refresh)
	•	close_approach   → ⚠️   (Close approaches / risk lists; ephemerides-driven)

D) Events (calendar-like but can still be SkyItems if they have a sky position/time)
	•	conjunctions     → 🤝
	•	occultations     → 🌑
	•	eclipses         → 🕶️
	•	meteor_showers   → 🌠   (radiant-based RA/DEC if available)

Rules:
	•	group is one of the above stable keys.
	•	type refines within group (e.g. for transients: sn, nova, cv; for neo: pha, nea, etc.).
	•	Emoji mapping is frontend-only but the group keys are backend API.

	9.	File set rules (what exists vs what we add)

9.1. Existing generators and their JSON are “legacy”:
	•	DO NOT modify their output schema except append-only fields.
	•	DO NOT rename files.

9.2. New generators are allowed ONLY for new groups.
Name pattern:
	•	gen_<group>.py
Outputs:
	•	if it’s “two-layer” dataset: <group>_today.json + <group>_week.json
	•	if it’s a singleton dataset (like ranking.json): keep current style, but must follow envelope.

	10.	Operational constraints

10.1. Determinism
	•	Given same inputs and same time window, generator should produce stable ordering of items (sort by score desc, then id asc).

10.2. Safety
	•	Generators must not require committed binaries. If a kernel is needed (e.g., DE421), it must be obtained via:
	•	Actions cache, and/or
	•	download during workflow runtime.

10.3. Performance
	•	“week” should target ~1000 frames max for 7 days @ 10 min, which you’re already hitting (1008–1010).
	•	Items per frame should remain bounded (frontend performance); if needed, cap and document in params.

	11.	Validation expectations (recommended)

Each generator SHOULD ship a pipelines/misc/check_<dataset>.py validator that checks:
	•	required envelope fields exist,
	•	time format matches contract,
	•	item required fields + types,
	•	ra/dec ranges,
	•	no NaNs.


-- All sky pipelines --
PYTHONPATH=services/sky python -u services/sky/pipelines/gen_all.py

(gen_objects needs calendar/daily_signal.json — run calendar-back first.)

-- Alerts (individual) --
PYTHONUNBUFFERED=1 PYTHONPATH=services/sky python -u services/sky/pipelines/gen_neo_alerts.py
PYTHONUNBUFFERED=1 PYTHONPATH=services/sky python -u services/sky/pipelines/gen_neocp_alerts.py
PYTHONUNBUFFERED=1 PYTHONPATH=services/sky python -u services/sky/pipelines/gen_risk_alerts.py

PYTHONUNBUFFERED=1 PYTHONPATH=services/sky python -u services/sky/pipelines/gen_gcn_alerts.py

PYTHONPATH=services/sky python -u services/sky/pipelines/gen_alerts.py

-- Objects Today --
PYTHONUNBUFFERED=1 PYTHONPATH=services/sky python -u services/calendar/pipelines/run_calendar.py
PYTHONUNBUFFERED=1 PYTHONPATH=services/sky python -u services/sky/pipelines/gen_objects.py
PYTHONUNBUFFERED=1 PYTHONPATH=services/sky python -u services/sky/pipelines/gen_ranking.py

-- Planets and Ranking --
PYTHONUNBUFFERED=1 PYTHONPATH=services/sky python -u services/sky/pipelines/gen_planets.py

-- Others --
PYTHONUNBUFFERED=1 PYTHONPATH=services/sky python -u services/sky/pipelines/gen_sunmoon.py
