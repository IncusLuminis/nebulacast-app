
Phase 1 — Small Bodies Layer (Additive, Non-Breaking)

We start with the highest value / lowest risk addition:

🎯 Target: small_bodies (☄️)

This will include:
	•	NEO (Near Earth Objects)
	•	NEA (Near Earth Asteroids)
	•	Close Approaches
	•	Potentially hazardous objects (PHA)

This layer is ideal because:
	•	We already compute ephemerides offline (DE421)
	•	We already compute magnitudes reasonably well
	•	Data is structured (JPL APIs are stable)
	•	It visually enriches the sky immediately

⸻

Architectural Plan

We will add:

services/sky/pipelines/gen_small_bodies.py

It will:
	1.	Fetch:
	•	Close approaches (today + 7 days)
	•	NEO feed (if available without auth)
	2.	Compute:
	•	Sky position (RA/DEC, Alt/Az)
	•	Estimated magnitude
	3.	Output:
	•	small_bodies_today.json
	•	small_bodies_week.json

Structure must match objects_today.json / objects_week.json

No deviations.

⸻

JSON Contract (Small Bodies)

Group name (NEW):

"group": "small_bodies"

Emoji (frontend mapping later):

☄️

Item type:

"type": "asteroid"

Minimum required fields (legacy-compatible):

{
  "id": "2026_AB12",
  "type": "asteroid",
  "group": "small_bodies",
  "title": "2026 AB12",
  "score": 0.0,
  "date_local": "2026-02-22",
  "vis": {
    "ra_deg": 123.45,
    "dec_deg": -12.34,
    "alt_deg": 22.1,
    "az_deg": 180.4,
    "mag": 18.4
  },
  "meta": {
    "miss_distance_km": 450000,
    "diameter_m": 120,
    "velocity_km_s": 12.4,
    "pha": true,
    "source": "NASA JPL Close Approach API"
  }
}

Everything additive.
No legacy modifications.

⸻

Data Sources (Stable & Free)

Primary candidate:

1️⃣ NASA JPL Close Approach API

https://ssd-api.jpl.nasa.gov/cad.api

Advantages:
	•	No API key
	•	Stable
	•	JSON
	•	Includes:
	•	Designation
	•	Close approach date
	•	Distance
	•	Relative velocity
	•	H magnitude
	•	Orbit class

We convert H → V magnitude using:

V ≈ H + 5 log10(r Δ)

(we already have r and Δ from ephemeris calculation)

Accuracy: ~0.3–0.5 mag typical

This is sufficient for scoring.

⸻

Scoring Strategy (Safe Version 1)

We DO NOT change ranking algorithm.

Instead:
	•	Small bodies get a base score derived from:
	•	altitude
	•	magnitude
	•	proximity factor

Example:

score = visibility_weight * (10 - mag)

Keep simple.
No ranking refactor yet.

⸻

Output Integration Strategy

We do NOT inject into ranking immediately.

Step-by-step:
	1.	Generate small_bodies_today.json
	2.	Generate small_bodies_week.json
	3.	Verify frontend compatibility manually
	4.	Add to ranking input list
	5.	Monitor output

No big bang merge.

⸻

Phase 2 (Later)

After small bodies stable:
	•	GRB feed
	•	TNS alt source
	•	AAVSO alerts
	•	Space Weather

But first, we stabilize asteroid layer.

⸻

Immediate Next Step

Before writing code:

We must decide:

Filter policy

Do we:

A) Include all close approaches
B) Only objects brighter than mag 20
C) Only objects closer than X lunar distances
D) Only PHA
E) Hybrid (recommended)

I recommend:
	•	distance < 0.1 AU
	•	OR mag < 20
	•	OR PHA flag true

This avoids thousands of irrelevant rocks.
