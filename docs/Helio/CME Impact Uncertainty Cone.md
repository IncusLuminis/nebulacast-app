CME Impact Uncertainty Cone — Specification v1

1. Purpose

The CME Impact Uncertainty Cone visualizes the uncertainty in the predicted trajectory of a Coronal Mass Ejection (CME) relative to Earth.

The component shows whether Earth lies:
	•	inside the predicted CME propagation envelope
	•	near the edge of the envelope
	•	outside the probable path

The visualization communicates forecast confidence, not the CME event itself.

⸻

2. Concept

A CME is a large expanding plasma cloud ejected from the Sun.

Forecast models estimate:
	•	direction of propagation
	•	angular width
	•	velocity
	•	arrival time

Because observations come from coronagraph images (2D projection), the actual trajectory contains uncertainty. Models therefore approximate the CME as an expanding cone.

The uncertainty cone represents the range of possible propagation directions.

⸻

3. Physical Model

In simplified CME propagation models:

CME propagation ≈ expanding cone

Parameters:

Parameter	Description
launch_direction	central propagation vector
angular_width	CME half-angle
speed	radial propagation speed
uncertainty_angle	directional uncertainty

The uncertainty cone expands outward from the Sun.

⸻

4. Visual Concept

The UI displays:
	•	Sun at center
	•	CME propagation cone
	•	Earth position
	•	trajectory axis

Example conceptual diagram:

          Sun
           ☀
           │
          / \
         /   \
        /     \
       /       \
      /         \
               🌍 Earth

The cone represents the possible CME envelope.

⸻

5. Visual Layout

The component renders a radial cone projection.

Elements:

Element	Description
Sun	origin of CME
Cone boundaries	uncertainty limits
Trajectory axis	central propagation direction
Earth marker	Earth’s heliographic position

Example layout:

CME Impact Uncertainty

          ☀
         / \
        /   \
       /  ●  \
      /       \
     /         \
              🌍

Where:
	•	● = predicted CME centerline
	•	cone edges = uncertainty bounds

⸻

6. Interpretation Logic

Earth position relative to cone	Meaning
Inside cone center	direct impact likely
Near cone edge	glancing blow possible
Outside cone	impact unlikely


⸻

7. Confidence Zones

Visual zones within the cone communicate likelihood.

Zone	Meaning	Color
Central corridor	high probability	red/orange
Mid cone	moderate probability	yellow
Outer cone	low probability	grey

Outside cone:

Zone	Meaning
Outside envelope	no expected impact


⸻

8. UI Labels

Example display:

CME Impact Forecast

Arrival: 13 Mar 21:00 UTC
Uncertainty: ±10 hours
Impact Probability: 60%


⸻

9. Component Inputs

Minimum required fields:

interface CMEImpactForecast {
  cme_id: string;

  launch_time_utc: string;

  arrival_time_utc: string | null;

  arrival_uncertainty_hours: number;

  central_longitude_deg: number;

  cone_half_angle_deg: number;

  uncertainty_angle_deg: number;

  speed_kms: number;

  impact_probability: number;

  updated_utc: string;
}

Example:

{
  "cme_id": "CME-2026-03-13-A",
  "launch_time_utc": "2026-03-13T02:40:00Z",
  "arrival_time_utc": "2026-03-13T21:00:00Z",
  "arrival_uncertainty_hours": 10,
  "central_longitude_deg": -10,
  "cone_half_angle_deg": 45,
  "uncertainty_angle_deg": 20,
  "speed_kms": 980,
  "impact_probability": 0.6
}


⸻

10. Data Sources

Typical operational sources:

Source	Data
NASA DONKI	CME analysis
NOAA SWPC	space weather alerts
SOHO LASCO	CME observations
STEREO	multi-angle CME detection
WSA–ENLIL model	propagation simulation

The cone parameters may come from:
	•	ENLIL model output
	•	CME analysis catalogs
	•	manual event interpretation

⸻

11. Interaction

Hover

Tooltip example:

CME Impact Forecast

Speed: 980 km/s
Angular width: 90°
Central direction: −10°

Arrival: 13 Mar 21:00 UTC
Uncertainty: ±10 h
Probability: 60%


⸻

Click

Opens detail panel:

CME Event Details

Launch time: 13 Mar 02:40 UTC
Speed: 980 km/s
Width: 90°

Forecast arrival: 13 Mar 21:00 UTC
Arrival window: 11 h

Impact probability: 60%

Optional additions:
	•	shock arrival prediction
	•	expected geomagnetic response

⸻

12. Temporal Behavior

Forecasts evolve as models update.

Typical update cadence:

30–60 minutes

The cone may:
	•	rotate
	•	widen
	•	narrow
	•	shift arrival window

The UI should animate changes smoothly.

⸻

13. Integration with Helio Dashboard

This component belongs to the CME forecasting layer.

Related modules:

Module	Role
Solar Disk	eruption origin
CME Tracker	CME propagation
Impact Cone	trajectory uncertainty
Solar Wind Monitor	actual plasma conditions
Magnetosphere Indicator	Earth response


⸻

14. Compact Layout

For limited space:

CME Impact Forecast

Probability: 60%
Arrival: 13 Mar ±10h

The full cone visualization is preferred.

⸻

15. Handling Missing Data

If trajectory parameters are unavailable:

CME Impact Forecast
Trajectory unknown

Fallback view:
	•	event information only
	•	no cone rendering

⸻

16. User Benefit

Users often misinterpret CME alerts as deterministic predictions.

The uncertainty cone communicates:
	•	direction uncertainty
	•	arrival time window
	•	impact likelihood

This improves interpretability of space weather forecasts.

⸻

17. MVP Scope

Include:
	•	cone visualization
	•	Earth position indicator
	•	arrival time window
	•	probability indicator
	•	hover details

Exclude:
	•	full heliospheric 3D simulation
	•	CME density modeling
	•	shock propagation graphics

⸻

18. Acceptance Criteria

The component is considered complete when:
	1.	CME trajectory cone renders correctly
	2.	Earth position relative to cone is visible
	3.	arrival time and uncertainty window are displayed
	4.	probability estimate is shown
	5.	component updates when new CME data arrives

⸻

The CME Impact Uncertainty Cone provides an intuitive visualization of forecast confidence in CME impacts, complementing solar wind and geomagnetic indicators within the Helio system.