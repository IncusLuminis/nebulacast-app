IMF Bz Coupling Indicator — Spec v1

1. Purpose

The IMF Bz Coupling Indicator visualizes the orientation of the interplanetary magnetic field Bz component, which is the most critical parameter controlling solar wind–magnetosphere coupling.

For most users, a raw value such as:

Bz = -5.2 nT

is difficult to interpret.

This component converts that measurement into an intuitive visual scale showing whether the magnetosphere is:
	•	closed / stable (northward Bz)
	•	neutral
	•	open to solar wind energy input (southward Bz)

This directly relates to aurora probability and geomagnetic activity.

⸻

2. Physical background

The Bz component describes the north–south orientation of the interplanetary magnetic field relative to Earth.

Two situations exist.

Northward IMF

Bz > 0

Magnetosphere coupling is weak.

Result:
	•	stable magnetosphere
	•	low aurora probability

⸻

Southward IMF

Bz < 0

Magnetic reconnection occurs at the dayside magnetopause.

Result:
	•	energy enters magnetosphere
	•	geomagnetic activity increases
	•	aurora becomes more likely

This makes Bz the single most important short-term predictor of aurora activity.

⸻

3. Component role in Helio

The IMF Bz Indicator belongs to the solar wind–magnetosphere interaction layer.

It complements:
	•	Solar wind speed
	•	Solar wind density
	•	Magnetosphere visualization
	•	Aurora probability map

Conceptual chain:

Solar wind → IMF Bz → magnetosphere coupling → aurora


⸻

4. UI concept

The indicator uses a vertical or horizontal scale centered on zero.

Example concept:

IMF Bz

+10   |████
  0   |██
-10   |██████

Where:
	•	the bar length indicates magnitude
	•	direction indicates northward or southward orientation

⸻

5. Preferred visual design

A centered axis with positive and negative values.

Example:

        IMF Bz (nT)

 +10   ████
  +5   ███
   0   │
  -5   █████
 -10   ███████

The current value marker is emphasized.

Example:

        IMF Bz

 +10
  +5
   0  ──────●
  -5  █████████
 -10


⸻

6. Highlighted condition

When Bz is negative, the component should display a contextual label.

Example:

IMF Bz: -5.2 nT

Southward IMF
Aurora favorable

If Bz is positive:

IMF Bz: +3.1 nT

Northward IMF
Stable magnetosphere


⸻

7. Color scheme

Color indicates coupling state.

Condition	Color
Strong northward	green
Near neutral	yellow
Southward	orange
Strong southward	red

Example:

IMF Bz

 +10  ████   (green)
  0   │
 -10  ███████ (red)


⸻

8. Threshold interpretation

Suggested interpretation ranges:

Bz value	Interpretation
> +5 nT	stable magnetosphere
+5 to 0 nT	weak coupling
0 to −5 nT	moderate coupling
< −5 nT	strong coupling
< −10 nT	storm-level coupling

These thresholds are not strict physical limits but operational heuristics.

⸻

9. Data source

Primary source:

solar wind monitors at L1

Examples:
	•	DSCOVR
	•	ACE
	•	SWPC real-time solar wind feed

Typical parameter:

IMF Bz (nT)


⸻

10. Update cadence

Solar wind magnetic field updates approximately every:

1–2 minutes

The indicator should update automatically when new measurements arrive.

⸻

11. Hover interaction

Hovering over the scale reveals detailed parameters.

Example tooltip:

IMF Bz: -5.2 nT
IMF Bt: 8.1 nT

Solar wind speed: 520 km/s
Dynamic pressure: 2.6 nPa

Optional additional information:
	•	measurement source
	•	timestamp

⸻

12. Click interaction

Clicking the component opens a detailed panel.

Possible content:

Interplanetary Magnetic Field

Bz: -5.2 nT
Bt: 8.1 nT

Solar wind speed: 520 km/s
Density: 7.2 p/cm³

Magnetosphere coupling: moderate
Aurora conditions: favorable

Optional extension:
	•	small magnetosphere diagram
	•	recent Bz trend chart

⸻

13. Trend indicator

The indicator may optionally include a short-term trend arrow.

Example:

Bz: -5.2 nT  ↓

Meaning:
	•	becoming more negative
	•	increasing auroral potential

Possible arrows:

Arrow	Meaning
↑	Bz becoming more positive
↓	Bz becoming more negative
→	stable


⸻

14. Integration with Magnetosphere visualization

The Bz indicator directly drives the Magnetosphere diagram.

Example logic:

Bz < 0
→ magnetosphere open

Bz > 0
→ magnetosphere closed

Thus both components should remain visually consistent.

⸻

15. Integration with Aurora Map

The indicator should influence aurora messaging.

Example:

IMF Bz: -6.8 nT

Southward IMF
Aurora favorable

The aurora component may reference this state.

⸻

16. User interpretation guidance

The UI should emphasize two simple messages.

When Bz positive

Northward IMF
Magnetosphere stable
Aurora unlikely

When Bz negative

Southward IMF
Magnetosphere open
Aurora favorable

This helps users understand space-weather dynamics without needing magnetospheric physics knowledge.

⸻

17. Compact layout option

For smaller UI spaces:

Bz: -5.2 nT
↓ Southward IMF

or

Bz
██████  -5.2

The full scale version is preferred for Helio.

⸻

18. Error handling

If Bz data is unavailable:

IMF Bz
Data unavailable

Avoid displaying stale values without timestamp.

⸻

19. MVP scope

Include:
	•	Bz value
	•	centered scale
	•	color-coded coupling state
	•	hover details

Exclude:
	•	full IMF vector visualization
	•	3D magnetospheric simulation
	•	long-term Bz history charts

These can be added later.

⸻

20. Acceptance criteria

The component is complete when:
	1.	Bz value is displayed clearly
	2.	scale shows positive vs negative orientation
	3.	southward IMF is highlighted
	4.	hover reveals contextual parameters
	5.	users can quickly understand whether aurora conditions are favorable

⸻

This component is especially powerful when combined with:
	•	Solar Wind Speed Indicator
	•	Magnetosphere Visualization
	•	Aurora Probability Map

Together they explain why aurora may occur, not just whether it might.