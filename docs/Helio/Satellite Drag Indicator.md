Satellite Drag Indicator — Spec v1

1. Purpose

The Satellite Drag Indicator communicates the current and expected impact of space weather on low-Earth orbit (LEO) satellites due to thermospheric expansion.

Geomagnetic storms heat the upper atmosphere, increasing density at altitudes where many satellites operate. This increases aerodynamic drag, causing satellites to lose orbital altitude faster.

Instead of exposing users to complex parameters such as:

thermospheric density
exospheric temperature

the component provides a clear operational message:

Satellite Drag
Low

or

Satellite Drag
High during storm

This indicator connects space weather events → orbital environment effects.

⸻

2. Physical background

When geomagnetic activity increases:

solar wind energy
      ↓
magnetosphere coupling
      ↓
thermosphere heating
      ↓
atmospheric expansion
      ↓
density increase at LEO altitudes

Typical affected altitude range:

200–600 km

Key consequences:
	•	increased satellite drag
	•	faster orbital decay
	•	more frequent orbit correction maneuvers
	•	increased re-entry probability for very low satellites

Example historical case:

A moderate geomagnetic storm in February 2022 caused atmospheric expansion that led to the loss of dozens of newly launched satellites in low orbit.

⸻

3. Component role in Helio

This indicator belongs to the space weather impact layer.

It represents effects on orbital infrastructure, complementing other impact indicators.

Helio impact components:

Component	Impact domain
Radio Blackout (R-scale)	ionosphere / radio
Geomagnetic Storm Probability (G-scale)	magnetosphere
Aurora Probability	visible aurora
Satellite Drag	orbital environment

Conceptual chain:

Solar activity
      ↓
Geomagnetic storm
      ↓
Thermosphere heating
      ↓
Satellite drag


⸻

4. UI concept

Minimal display:

Satellite Drag
──────────────

Low

During increased geomagnetic activity:

Satellite Drag
──────────────

High during storm


⸻

5. Preferred visual layout

A simple indicator scale:

Satellite Drag

Low      ███
Moderate █████
High     ████████

The current level is highlighted.

Example:

Satellite Drag

Low      ███
Moderate █████
High     ████████   ◄


⸻

6. Compact UI version

For small UI spaces:

Satellite Drag
Low

or

Satellite Drag: Moderate


⸻

7. Severity levels

Three levels are sufficient for operational understanding.

Level	Meaning
Low	normal atmospheric density
Moderate	slightly elevated density
High	strong thermospheric expansion

These levels correspond roughly to geomagnetic activity.

⸻

8. Mapping from geomagnetic activity

Satellite drag risk can be estimated using geomagnetic indicators such as Kp index or storm level.

Suggested mapping:

Kp	Drag level
Kp ≤ 3	Low
Kp 4–5	Moderate
Kp ≥ 6	High

If storm classification is available:

Storm level	Drag level
none	Low
G1	Moderate
G2+	High


⸻

9. Data sources

Possible sources:
	•	NOAA SWPC geomagnetic indices
	•	thermospheric density models
	•	space weather forecast products

Operational inputs may include:

Kp index
geomagnetic storm forecast
thermospheric density estimates

For MVP, geomagnetic storm level or Kp is sufficient.

⸻

10. Data model

Suggested internal representation:

export interface SatelliteDragState {
  level: "low" | "moderate" | "high";

  kp_index: number | null;
  storm_level: string | null;

  explanation: string | null;

  updated_utc: string;
  source: string;
}

Example:

{
  "level": "moderate",
  "kp_index": 5,
  "storm_level": "G1",
  "explanation": "Geomagnetic activity increasing thermospheric density",
  "updated_utc": "2026-03-14T08:00:00Z"
}


⸻

11. Hover interaction

Hovering the component shows additional details.

Example tooltip:

Satellite Drag

Current level: Moderate

Kp index: 5
Geomagnetic storm: G1

Reason:
Thermosphere expansion during geomagnetic activity

Optional extra parameters:

solar wind speed
IMF Bz


⸻

12. Click interaction

Clicking the component opens a detailed panel.

Example:

Satellite Drag

Current level: Moderate

Geomagnetic conditions:
Kp = 5
Storm level: G1

Expected effects:
Higher orbital decay rate
Increased atmospheric density at 400 km

Optional extension:
	•	explanation of thermospheric expansion
	•	altitude range most affected

⸻

13. Color scheme

Color encodes severity.

Level	Color
Low	green
Moderate	yellow
High	orange/red

Colors should remain subtle to maintain visual balance with other Helio components.

⸻

14. Integration with other Helio components

Satellite drag depends strongly on geomagnetic conditions.

Connections:

Component	Relationship
Geomagnetic Storm Probability	predicts drag increases
IMF Bz Indicator	affects storm potential
Solar Wind Indicator	indicates energy input
CME Tracker	possible storm driver

Example combined context:

CME inbound
G2 storm probability: 30%

Satellite Drag
High expected


⸻

15. Temporal behavior

Satellite drag changes on timescales of:

hours to days

The component should update whenever geomagnetic indices change.

Typical update cadence:

every 1–3 hours


⸻

16. Empty state

If required parameters are unavailable:

Satellite Drag
Data unavailable

Avoid displaying stale information.

⸻

17. User benefit

Most users cannot interpret:

thermospheric density increase

But they easily understand:

Satellite Drag: High

The indicator translates space weather → orbital consequences.

⸻

18. MVP scope

Include:
	•	drag level indicator
	•	mapping from Kp or storm level
	•	hover explanation
	•	automatic updates

Exclude:
	•	full thermospheric density models
	•	altitude-specific drag predictions
	•	orbital decay simulations

These features may be added later.

⸻

19. Future extensions

Possible upgrades:
	•	thermosphere density graph
	•	altitude-specific drag indicators
	•	satellite orbit decay estimation
	•	integration with satellite tracking services

⸻

20. Acceptance criteria

The component is considered complete when:
	1.	drag level (low/moderate/high) is displayed
	2.	severity reflects geomagnetic conditions
	3.	hover reveals explanatory information
	4.	updates occur when geomagnetic indices change
	5.	the indicator integrates with the space weather dashboard

⸻

This component completes the space weather impact chain:

Solar activity
      ↓
Solar wind / CME
      ↓
Geomagnetic storm
      ↓
Aurora
      ↓
Satellite drag

It extends Helio from solar and magnetospheric monitoring to orbital environment awareness.