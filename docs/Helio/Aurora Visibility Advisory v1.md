Aurora Visibility Advisory — Specification v1

1. Purpose

The Aurora Visibility Advisory provides a human-readable observing recommendation when auroral activity is expected to be visible from the user’s location.

Instead of presenting only geomagnetic indices (Kp, Bz, solar wind), the component converts space weather conditions into a practical observing instruction.

Example message:

Aurora expected
Look north after 23:00

The goal is to answer a simple question for the user:

“Should I go outside and try to see the aurora tonight?”

⸻

2. Role in Sky Console

This component belongs to the space weather → sky observation bridge.

Data flow:

Solar activity
      ↓
Solar wind / geomagnetic activity
      ↓
Auroral oval expansion
      ↓
Aurora visibility at user latitude
      ↓
Aurora Visibility Advisory

The advisory transforms scientific parameters into actionable guidance.

⸻

3. Trigger Conditions

The advisory appears only when auroral visibility is plausible for the user’s location.

Typical conditions include:

Parameter	Typical threshold
Kp index	≥ 5
Auroral oval latitude	reaches user latitude
Bz IMF	negative for extended period
Solar wind speed	elevated

Exact thresholds depend on the implemented aurora model.

⸻

4. Input Data

The component requires:

Field	Description
user_lat	observer latitude
user_lon	observer longitude
kp_index	planetary Kp
auroral_oval_latitude	equatorward boundary
sunset_time	local sunset
local_time	current time

Optional inputs:

Field	Description
moon_phase	moon illumination
cloud_cover	weather conditions


⸻

5. Data Model

Example structure:

interface AuroraAdvisory {
  visible: boolean

  kp_index: number

  aurora_latitude_deg: number

  user_latitude_deg: number

  best_time_local: string | null

  direction: "north" | "south"

  updated_utc: string
}

Example:

{
  "visible": true,
  "kp_index": 6,
  "aurora_latitude_deg": 52,
  "user_latitude_deg": 52.2,
  "best_time_local": "23:00",
  "direction": "north"
}


⸻

6. Message Generation Logic

The advisory converts model output into a short instruction.

Examples:

Case 1 — Aurora likely

Aurora expected
Look north after 23:00

Case 2 — Aurora possible

Aurora possible tonight
Look north after 22:30

Case 3 — Strong storm

Aurora likely overhead
Best viewing after 21:30

Case 4 — Low probability

Aurora unlikely at your latitude


⸻

7. Direction Logic

The recommended direction depends on latitude.

Observer latitude	Direction
mid-latitudes	look north
auroral zone	overhead
southern hemisphere	look south

Example output:

Look north

or

Aurora overhead possible


⸻

8. Time Recommendation

Auroras are most visible during local night hours, typically near magnetic midnight.

The system calculates a recommended observation window:

best_time = max(sunset + darkness_buffer, aurora_activity_peak)

Typical buffer:

darkness_buffer ≈ 1–2 hours after sunset

Example:

Look north after 23:00


⸻

9. UI Layout

The advisory is displayed as a two-line notification card.

Example:

Aurora expected
Look north after 23:00

Elements:

Element	Description
title	aurora visibility status
instruction	observing direction and time


⸻

10. Visual Styling

Recommended styling:

Condition	Style
Aurora expected	bright aurora color (green/violet)
Aurora possible	muted aurora color
Aurora unlikely	grey

Optional background:

aurora gradient or subtle glow.

⸻

11. Iconography

Optional icon:

🌌

or

aurora arc symbol.

Example:

🌌 Aurora expected
Look north after 23:00


⸻

12. Hover Details

Hover tooltip can show supporting data.

Example:

Aurora Forecast

Kp index: 6
Auroral oval latitude: 52°

Observer latitude: 52.2°
Direction: north

Best viewing time: after 23:00


⸻

13. Integration with Other Components

The advisory depends on upstream modules:

Component	Role
Solar Wind Monitor	solar wind conditions
IMF Bz Indicator	geomagnetic coupling
Geomagnetic Storm Index	storm intensity
Auroral Oval Model	aurora latitude


⸻

14. Update Frequency

Aurora conditions can change quickly.

Typical update interval:

5–10 minutes

The advisory should update automatically.

⸻

15. Compact Mode

If space is limited:

Aurora possible
After 23:00


⸻

16. Failure Handling

If aurora forecast data is unavailable:

Aurora forecast unavailable

The advisory should not display outdated recommendations.

⸻

17. User Benefit

Most users do not understand:
	•	Kp index
	•	IMF Bz
	•	solar wind pressure

The advisory converts complex space weather data into a simple observing instruction.

Example transformation:

Kp = 6
Bz = −8 nT
Solar wind = 650 km/s

→

Aurora expected
Look north after 23:00


⸻

18. MVP Scope

Include:
	•	aurora visibility detection
	•	direction recommendation
	•	viewing time suggestion
	•	simple two-line advisory

Exclude:
	•	full auroral oval map
	•	detailed magnetosphere modeling
	•	aurora brightness prediction

⸻

19. Acceptance Criteria

The component is considered complete when:
	1.	aurora visibility conditions are detected
	2.	a clear observing instruction is generated
	3.	recommended direction is displayed
	4.	recommended observation time is shown
	5.	advisory updates automatically with new data

⸻

The Aurora Visibility Advisory converts geomagnetic activity into clear observing guidance, making space weather data immediately useful for observers.