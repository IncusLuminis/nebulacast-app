Understood. Below is the complete, consolidated, cleaned, and final version of the contract, preserving all prior sections (structure, grouping, generators, alerts, ranking, BSP, library rules, etc.) and incorporating the new strict UTC policy for all new data.

No duplication. No ambiguity. No language drift.

⸻

Sky Data Contract

Stable Legacy + Additive Schema + Strict UTC for New Data

⸻

0. Core Principle

This project operates under a strict non-breaking, additive-only contract model.

MUST NOT
	•	Modify existing (legacy) JSON structure
	•	Rename existing fields
	•	Change existing field formats
	•	Rewrite existing Python generators
	•	Require frontend rendering changes

Allowed
	•	Add new fields
	•	Add new groups
	•	Add new generators
	•	Add new JSON datasets

Refactoring is a separate task and must never be mixed with feature development.

⸻

1. Time Model (Authoritative Rule)

1.1 Legacy Time (Frozen)

Existing time formats remain untouched, including:
	•	date_local
	•	best_time_local
	•	"2026-Feb-19 04:48Z"
	•	"2026-02-17T05:16:48+00:00"

Legacy data is frozen.

⸻

1.2 NEW DATA — Mandatory UTC

All newly introduced time fields MUST use:

ISO 8601 UTC with Z suffix

Format:

YYYY-MM-DDTHH:MM:SSZ

Example:

2026-02-19T04:48:00Z

Rules:
	•	Always UTC
	•	Always include seconds
	•	Always use Z
	•	Never use +00:00
	•	Never use custom textual formats
	•	Never mix formats

UTC is the canonical source of truth.

⸻

2. Transitional Strategy

For compatibility with existing frontend:
	•	New generators write UTC fields.
	•	If needed, date_local may be derived from UTC.
	•	UTC remains canonical.
	•	Local time is derived only.

Example:

{
  "t_utc": "2026-02-19T04:48:00Z",
  "date_local": "2026-02-19"
}


⸻

3. Canonical Time Field Naming

New datasets must use the following time field names:

Purpose	Field
Event time	t_utc
Record update	updated_utc
Ingestion time	ingested_utc
Window start	start_utc
Window end	end_utc
Generation timestamp	generated_at

No custom time field names allowed.

⸻

4. Legacy JSON Structure (Frozen)

The following envelope is immutable:

objects_today.json / objects_week.json

Top-level:
	•	version
	•	days
	•	step_min
	•	site
	•	frames

Frame structure:

{
  "date_local": "...",
  "items": [...]
}

Item structure (minimum required):

{
  "id": "...",
  "type": "...",
  "group": "...",
  "title": "...",
  "score": 0.0,
  "vis": { ... },
  "meta": { ... }
}

Allowed:
	•	Add new fields
	•	Add new nested data under meta
	•	Add safe new top-level fields

Forbidden:
	•	Renaming
	•	Removing
	•	Restructuring
	•	Changing types

⸻

5. Group Taxonomy

5.1 Legacy Groups (Frozen)

These must remain unchanged:
	•	planets 🪐
	•	dso 🌀
	•	calendar 📅

Frontend ranking depends on these keys.

⸻

5.2 Structured Conceptual Group Tree

Conceptual classification only. Does not alter legacy keys.

A. Solar System
	•	planets 🪐 (legacy)
	•	sunmoon ☀️ (data-only)
	•	small_bodies ☄️
	•	neo
	•	nea
	•	close_approach
	•	risk

B. Deep Sky
	•	dso 🌀 (legacy)
	•	galaxies
	•	nebulae
	•	clusters

C. Events
	•	calendar 📅 (legacy)
	•	transient ✨
	•	grb 💥
	•	supernova 🌟
	•	comet ☄️

D. Space Environment (future)
	•	space_weather 🌞
	•	aurora 🌌
	•	solar_flare 🔥

Only legacy groups participate in current ranking.

⸻

6. Alerts Model

Alerts:
	•	Generated daily
	•	Contain TODAY only
	•	No weekly alerts file
	•	May be high-volume

Must follow legacy item structure exactly.

Time fields must use strict ISO UTC.

Additional API fields must go under meta.

⸻

7. Objects Model (today / week)

Ranking consumes:
	1.	calendar
	2.	alerts
	3.	planets
	4.	dso

No structural change allowed to:
	•	Envelope
	•	Frame structure
	•	Site object
	•	Naming conventions

⸻

8. sources.yml Rule

If group mapping conflicts occur:

Modify sources.yml.

Never modify legacy generators to solve naming inconsistencies.

sources.yml is the single source of truth for source-to-group mapping.

⸻

9. API Data Strategy

Policy: extract maximum data from APIs.

Store extra data in:
	•	meta.*
	•	Safe additional fields

Do not trim fields prematurely.

We collect first, optimize later.

⸻

10. New Generators

Naming convention:

gen_<group>.py

Requirements:
	•	Must preserve legacy schema
	•	Must use strict UTC for new time fields
	•	Must not modify legacy datasets
	•	Must write to both:

services/sky/data/generated/
sites/staging/sky/data/


⸻

11. Small Body Model (PHA-first Strategy)

Initial filter:
	•	PHA = true

Future:
	•	Distance ≤ 1 Lunar Distance
	•	MOID filters
	•	Close-approach windows

Requirements:
	•	Provide RA/DEC
	•	Provide estimated magnitude if possible
	•	Store raw fields under meta
	•	Follow legacy item structure

⸻

12. Planet Model
	•	Computed offline using DE421
	•	Magnitude empirical model
	•	Acceptable magnitude error ≤ 0.2 mag

Output:
	•	services/sky/data/generated/planets.json
	•	sites/staging/sky/data/planets.json

Must preserve legacy compatibility.

⸻

13. Sun & Moon Model
	•	Data-only layer
	•	Not ranked
	•	Schema preserved
	•	Strict UTC for new fields

Allowed additions:
	•	phase
	•	illum_pct
	•	waxing
	•	elongation
	•	rise/set times

⸻

14. Ranking Layer Contract

Ranking:
	•	Must depend only on legacy fields
	•	Must not require new fields
	•	Must not require schema migration

Any ranking refactor is separate work.

⸻

15. JSON Additive Safety Rule

Safe:
	•	Add new fields
	•	Add nested meta data
	•	Add UTC fields

Unsafe:
	•	Renaming score
	•	Renaming group
	•	Modifying vis
	•	Changing date formats in legacy
	•	Changing object types

⸻

16. File Output Locations (Immutable)

Generators must write to:

services/sky/data/generated/
sites/staging/sky/data/

File names must remain:
	•	objects_today.json
	•	objects_week.json
	•	planets.json
	•	sun_moon.json
	•	alerts_now.json

No renaming allowed.

⸻

17. Library Structure

Reusable logic must reside in:

services/sky/pipelines/lib/

Examples:
	•	time utilities
	•	magnitude models
	•	coordinate transforms
	•	API normalization
	•	JSON builders

Generators remain in:

services/sky/pipelines/


⸻

18. BSP / Ephemeris Handling
	•	BSP files must NOT be committed
	•	Must be downloaded or cached in CI
	•	Must not affect JSON schema
	•	Infrastructure detail only

⸻

19. Frontend Stability Guarantee

Deployment must follow:
	1.	Generate JSON
	2.	Write JSON
	3.	Refresh page
	4.	No frontend changes required

If frontend requires change → schema change → separate milestone.

⸻

20. Operational Discipline

We build incrementally.

Therefore:
	•	No mixed refactors
	•	No opportunistic cleanup
	•	No structural drift
	•	No silent schema changes

Feature work and refactor work must remain isolated.

⸻

This is now the authoritative contract version.

It preserves legacy.
It enforces strict UTC going forward.
It prevents structural drift.
It stabilizes time handling.
It protects frontend integrity.

If desired, next step is to formalize a UTC helper module and forbid manual datetime formatting in generators.