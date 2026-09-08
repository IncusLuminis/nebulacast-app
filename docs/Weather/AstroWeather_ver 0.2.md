
Astro Weather Scoring Specification

Observer’s Console

Three-Level Architecture
	1.	Observability Gate
	2.	Weather Quality
	3.	Seeing Quality

This architecture separates hard observational constraints from atmospheric quality and image stability.

⸻

1. System Overview

The system evaluates observing conditions in three sequential levels.

Level	Purpose	Effect
Level 1 — Observability Gate	Determines if observing is possible at all	Can block the UI
Level 2 — Weather Quality	Evaluates sky quality if observing is possible	Determines sky usability
Level 3 — Seeing Quality	Evaluates image sharpness	Important for planetary/lunar

If Level 1 returns CLOSED, deeper levels are not evaluated in the UI.

⸻

2. Level 1 — Observability Gate

Purpose: determine whether observation is physically possible.

Gate output:

gate.status = OPEN | CAUTION | CLOSED
gate.reasons = [ ... ]
gate.score = 0..100

UI behavior:

Status	UI Behavior
OPEN	Full UI available
CAUTION	Weather panel available
CLOSED	Weather/Object panels disabled


⸻

3. Cloud Layer Model

Clouds must be evaluated per atmospheric layer.

Input parameters:

cloud_low_pct
cloud_mid_pct
cloud_high_pct

These correspond to typical meteorological layers:

Layer	Approx altitude
Low clouds	< 2 km
Mid clouds	2–6 km
High clouds	> 6 km

Astronomically:

Layer	Impact
Low	blocks sky completely
Mid	blocks sky almost completely
High	may allow partial observing


⸻

4. Observability Gate Logic

4.1 Hard CLOSE conditions

Night is CLOSED if any of the following is true:

cloud_low_pct >= 95
cloud_mid_pct >= 95
precipitation > 0
visibility_km <= 1.0

Optional additional conditions:

cloud_base_m <= 300
thunder_probability high

Rationale:

Low and mid clouds physically block the sky.

⸻

4.2 CAUTION conditions

If not CLOSED, the gate returns CAUTION when:

cloud_low_pct 70–94
cloud_mid_pct 70–94
cloud_high_pct >= 80
visibility_km 1–3
precip_probability >= 10

Rationale:

Observing may be possible intermittently.

High cirrus clouds often allow:
	•	planetary observation
	•	bright star observing
	•	some imaging

⸻

4.3 OPEN conditions

Gate returns OPEN when none of the above apply.

Typical conditions:

cloud_low_pct < 70
cloud_mid_pct < 70
cloud_high_pct < 80
visibility_km > 3
precip_probability < 10


⸻

5. Effective Cloud Factor

Weather Quality requires a single cloud metric derived from layers.

Use a weighted model:

effective_cloud =
    low * 0.6 +
    mid * 0.3 +
    high * 0.1

Rationale:

Layer	Weight	Reason
Low	0.6	dominant sky blocker
Mid	0.3	significant blocker
High	0.1	often semi-transparent


⸻

6. Level 2 — Weather Quality

Purpose: evaluate overall sky usability.

Inputs:

effective_cloud
transparency_index
wind_speed
humidity
moon_altitude
moon_illumination

Normalization to 0–100.

⸻

6.1 Cloud factor

cloud_q = 100 - effective_cloud


⸻

6.2 Transparency factor

If transparency index exists (0–10):

trans_q = transparency_index * 10

Fallback proxy:

trans_q = clamp((visibility_km / 10) * 100)


⸻

6.3 Wind factor

wind_q =
    100  if wind <= 3 m/s
     70  if wind <= 7
     40  if wind <= 12
     20  otherwise


⸻

6.4 Moon factor (optional but recommended)

If Moon above horizon:

moon_q = 100 - illumination_pct * moon_weight

Moon weights by profile:

Profile	Moon weight
Balanced	0.3
Visual	0.5
Photography	0.6
Planetary	0.1

If Moon below horizon:

moon_q = 100


⸻

6.5 Weather Score

weather.score =
    0.45 * cloud_q +
    0.30 * trans_q +
    0.15 * moon_q +
    0.10 * wind_q

Class mapping:

Score	Class
0–39	POOR
40–59	FAIR
60–79	GOOD
80–100	EXCELLENT


⸻

7. Level 3 — Seeing Quality

Purpose: evaluate image sharpness.

Important for:
	•	planetary observing
	•	double stars
	•	high-resolution imaging

⸻

7.1 Input

Preferred input:

seeing_fwhm_arcsec

Fallback:

seeing_index (1–5)


⸻

7.2 Conversion

If FWHM available:

FWHM	Score
0.5”	100
1.0”	80
1.5”	60
2.0”	40
3.0”	20

Linear interpolation between points.

If index:

1 → 20
2 → 40
3 → 60
4 → 80
5 → 95

Class mapping:

Score	Class
<40	BAD
40–59	FAIR
60–79	GOOD
80+	EXCELLENT


⸻

8. Hour Score Calculation

Hour score depends on profile.

If gate.status == CLOSED:

hour_score = 0–20

Otherwise:

Profile	Formula
Balanced	0.7 weather + 0.3 seeing
Visual	0.85 weather + 0.15 seeing
Photography	0.9 weather + 0.1 seeing
Planetary	0.4 weather + 0.6 seeing


⸻

9. Night Score and Best Window

Night score represents best observing window.

Steps:
	1.	Compute hour_score for all night hours.
	2.	Apply rolling mean window (3 hours recommended).
	3.	Select maximum value.

night_score = max(rolling_mean(hour_score, 3))

Best window is the time interval of that maximum.

Example:

Best window: 21:00–01:00


⸻

10. UI Behavior

10.1 Main Panel

Shows:
	•	Night score
	•	Night class
	•	Heads-up message
	•	Best window
	•	Hourly cards

⸻

10.2 Hourly Cards

Each card shows:

hour_score
gate.status
key factors (cloud %, wind, visibility)

Color logic:

Status	Color
OPEN	green
CAUTION	yellow
CLOSED	red/grey


⸻

11. Hour Detail Dialog

Three expandable sections.

Section 1 — Observability Gate

Always visible.

Shows:
	•	Gate status
	•	Reasons list

Example:

✗ Low clouds 100%
✓ Calm wind
✗ Visibility 0.7 km

If CLOSED:

Display message:

Observing not recommended due to cloud coverage.

Other sections disabled.

⸻

Section 2 — Weather Quality

Visible only if gate != CLOSED.

Shows factor bars:

Clouds
Transparency
Moon
Wind

Plus total Weather Score.

⸻

Section 3 — Seeing Quality

Visible only if gate != CLOSED.

Shows:

Seeing class
FWHM estimate
Seeing score


⸻

12. Object Ranking

Objects are ranked only if:

gate.status != CLOSED

Weather modifies object scores.

For DSO:

object_factor = weather.score / 100

For planets:

object_factor = (0.5 weather + 0.5 seeing) / 100

Final score:

final_object_score =
    base_object_score * object_factor


⸻

13. Data Model Additions

Hourly dataset should include:

gate: {
  status,
  score,
  reasons
}

weather: {
  score,
  class,
  breakdown
}

seeing: {
  score,
  class,
  fwhm_arcsec
}

hour_score

These fields must be additive and not break existing schema.