Storm Progress Indicator — Specification v1

1. Purpose

The Storm Progress Indicator visualizes the current phase of a geomagnetic storm.

Instead of showing only raw indices (Kp, Dst, Bz), the component communicates the temporal evolution of the storm.

Example state:

Geomagnetic Storm

Rising → Peak → Decline

The indicator helps users understand:
	•	whether the storm is strengthening
	•	at maximum intensity
	•	weakening

⸻

2. Role in Sky Console

This component belongs to the geomagnetic activity monitoring layer.

It complements:

Component	Role
Solar Wind Monitor	upstream solar wind conditions
IMF Bz Indicator	magnetic coupling
Geomagnetic Storm Index	intensity level (G1–G5)
Storm Progress Indicator	temporal storm phase

Conceptual chain:

Solar wind disturbance
        ↓
Geomagnetic storm
        ↓
Storm phase evolution


⸻

3. Storm Phases

A geomagnetic storm typically evolves through three stages.

Rising Phase

The storm intensity is increasing.

Typical characteristics:
	•	Kp increasing
	•	Bz strongly negative
	•	solar wind pressure elevated

User interpretation:

Storm strengthening


⸻

Peak Phase

The storm has reached maximum intensity.

Characteristics:
	•	Kp near maximum
	•	strongest auroral expansion
	•	strongest magnetosphere compression

User interpretation:

Storm at maximum


⸻

Decline Phase

The storm is weakening.

Characteristics:
	•	Kp decreasing
	•	Bz returning toward neutral
	•	solar wind pressure stabilizing

User interpretation:

Storm weakening


⸻

4. State Machine

Storm phase detection follows a simple state model.

Quiet
  ↓
Rising
  ↓
Peak
  ↓
Decline
  ↓
Quiet

The indicator activates when a geomagnetic storm begins.

⸻

5. Trigger Conditions

Storm progress is evaluated when:

Condition	Value
Kp index	≥ 5
or	geomagnetic storm alert active

Below storm threshold the indicator is hidden or inactive.

⸻

6. Data Inputs

Required parameters:

Field	Description
kp_index	current planetary Kp
kp_trend	change in Kp
bz_nt	IMF Bz
solar_wind_speed	solar wind velocity
timestamp	observation time

Optional:

Field	Description
dst_index	ring current strength
pressure_npa	solar wind pressure


⸻

7. Data Model

Example structure:

interface StormProgress {
  active: boolean

  phase: "rising" | "peak" | "decline" | "quiet"

  kp_current: number
  kp_trend: number

  bz_nt: number | null

  updated_utc: string
}

Example:

{
  "active": true,
  "phase": "rising",
  "kp_current": 6,
  "kp_trend": 1,
  "bz_nt": -9,
  "updated_utc": "2026-03-14T08:30:00Z"
}


⸻

8. Phase Detection Logic

Example heuristic rules.

Rising

kp increasing
AND bz < -5 nT

Peak

kp stable near maximum
OR kp_trend ≈ 0

Decline

kp decreasing
AND bz trending toward neutral

These rules may evolve with improved storm models.

⸻

9. UI Layout

The indicator appears as a three-stage progress bar.

Example:

Geomagnetic Storm

[Rising] → Peak → Decline

Current phase is highlighted.

⸻

10. Visual Representation

Example progress visualization:

Geomagnetic Storm

● Rising → Peak → Decline

or

Geomagnetic Storm

Rising → ● Peak → Decline

or

Geomagnetic Storm

Rising → Peak → ● Decline


⸻

11. Color Scheme

Recommended colors:

Phase	Color
Rising	orange
Peak	red
Decline	yellow
Quiet	grey

Example:

[orange Rising] → [red Peak] → [yellow Decline]


⸻

12. Hover Information

Hover tooltip shows supporting parameters.

Example:

Geomagnetic Storm

Phase: Rising

Kp: 6
IMF Bz: -9 nT
Solar wind: 620 km/s


⸻

13. Integration with Other Indicators

Storm progress depends on several upstream signals.

Component	Role
Solar Wind Speed	driver of disturbances
Solar Wind Pressure	magnetosphere compression
IMF Bz	magnetic coupling
Kp Index	geomagnetic response

The Storm Progress Indicator summarizes these signals.

⸻

14. Update Frequency

Space weather conditions evolve rapidly.

Recommended update cadence:

5–10 minutes

Phase transitions should update automatically.

⸻

15. Compact Layout

If UI space is limited:

Storm phase: Rising

or

Geomagnetic storm rising

Full progress visualization is preferred.

⸻

16. Failure Handling

If storm detection is uncertain:

Storm status uncertain

If no storm is active:

No geomagnetic storm


⸻

17. User Benefit

Most users cannot interpret raw geomagnetic indices.

Example:

Kp = 6
Bz = -8 nT

The indicator converts these values into a simple narrative:

Geomagnetic storm rising

This helps users understand the current stage of the disturbance.

⸻

18. MVP Scope

Include:
	•	storm phase detection
	•	three-phase progress indicator
	•	Kp-based heuristics
	•	hover details

Exclude:
	•	full storm lifecycle modeling
	•	magnetospheric energy estimates
	•	advanced prediction models

⸻

19. Acceptance Criteria

The component is considered complete when:
	1.	storm activity is detected
	2.	storm phase is classified
	3.	progress indicator shows current phase
	4.	indicator updates automatically
	5.	hover displays supporting parameters

⸻

The Storm Progress Indicator provides a clear representation of how a geomagnetic storm evolves over time, complementing intensity indicators and solar wind monitors in the Sky Console.