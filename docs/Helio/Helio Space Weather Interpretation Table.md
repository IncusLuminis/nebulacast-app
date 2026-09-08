Below is a compact implementation table you can directly give to development.
It defines what the UI shows, what the tooltip explains, and how the state is interpreted.

This is intentionally short, stable wording suitable for production UI.

⸻

Helio Space Weather Interpretation Table

Version 1.0

1. Kp Index

Label

Kp Index

Tooltip

Planetary geomagnetic activity index (0–9).

0–2 Quiet
3–4 Active
5+ Geomagnetic storm

Higher values increase the chance of aurora.

State Labels

Range	State	UI Color	Interpretation
0–2	Quiet	green	Geomagnetic conditions are calm.
3–4	Active	yellow	Magnetic field is moderately disturbed.
5–6	Storm	orange	Minor to moderate geomagnetic storm.
7–9	Strong Storm	red	Strong geomagnetic storm conditions.

Observer Meaning

Aurora
Aurora may become visible at lower latitudes when Kp ≥ 5.

Radio
HF radio noise may increase during storms.

Navigation
Satellite positioning accuracy may degrade slightly.

Optical Observing
No direct impact except possible aurora.

⸻

2. IMF Bz

Label

IMF Bz

Tooltip

North–south component of the solar wind magnetic field.

Bz > 0
Magnetosphere tends to remain closed.

Bz < 0
Energy from the solar wind can enter Earth’s magnetosphere.

Southward Bz favors aurora activity.

State Labels

Range (nT)	State	UI Color	Interpretation


+5 | Northward | green | Magnetosphere tends to remain closed. |
+5 to 0 | Weak Northward | green | Limited solar wind coupling. |
0 to -5 | Southward | yellow | Some energy transfer into the magnetosphere. |
< -5 | Strong Southward | orange | Favorable conditions for geomagnetic activity. |

Observer Meaning

Aurora
Strong southward Bz significantly increases aurora potential.

Radio
Possible ionospheric disturbances during strong coupling.

Navigation
GNSS signals may fluctuate during strong geomagnetic activity.

Optical Observing
No direct impact.

⸻

3. Solar Wind Speed

Label

Solar Wind Speed

Tooltip

Speed of charged particles flowing from the Sun.

300–450 km/s Typical
500+ km/s Elevated
700+ km/s High-speed stream

Fast solar wind can intensify geomagnetic activity.

State Labels

Speed	State	UI Color	Interpretation
< 350 km/s	Slow	green	Solar wind is relatively calm.
350–500	Typical	green	Solar wind conditions are normal.
500–700	Elevated	yellow	Solar wind may support geomagnetic activity.

700 | High-speed | orange | Strong solar wind stream detected. |

Observer Meaning

Aurora
Fast solar wind increases the chance of aurora if Bz is southward.

Radio
Possible disturbances in polar radio propagation.

Navigation
Minimal impact unless combined with strong geomagnetic storms.

Optical Observing
No direct effect.

⸻

4. Dynamic Pressure

Label

Solar Wind Pressure

Tooltip

Pressure of the solar wind on Earth’s magnetosphere.

1–2 nPa Typical
2–4 nPa Elevated
4+ nPa Strong compression

Higher pressure compresses Earth’s magnetic shield.

State Labels

Pressure	State	UI Color	Interpretation
< 2 nPa	Normal	green	Magnetosphere compression is low.
2–4 nPa	Elevated	yellow	Magnetosphere moderately compressed.

4 nPa | High | orange | Strong solar wind pressure detected. |

Observer Meaning

Aurora
Compression may trigger short auroral bursts.

Radio
Possible transient disturbances.

Navigation
Minor effects possible during strong compression.

Optical Observing
No direct impact.

⸻

5. Geomagnetic Storm Scale (G)

Label

Geomagnetic Storm Level

Tooltip

NOAA geomagnetic storm classification.

G0 Quiet
G1 Minor storm
G2 Moderate
G3 Strong
G4 Severe
G5 Extreme

Higher levels indicate stronger geomagnetic effects.

State Labels

Level	State	UI Color	Interpretation
G0	Quiet	green	No significant geomagnetic disturbance.
G1	Minor	yellow	Minor geomagnetic storm.
G2	Moderate	orange	Moderate geomagnetic storm.
G3+	Strong	red	Strong geomagnetic storm conditions.

Observer Meaning

Aurora
Aurora may extend to mid-latitudes during G2–G3 storms.

Radio
HF communication disruptions possible.

Navigation
GNSS accuracy may degrade during strong storms.

Optical Observing
Aurora may brighten the sky.

⸻

6. Radio Blackout Scale (R)

Label

Radio Blackout Level

Tooltip

Solar X-ray radiation affecting the ionosphere.

R0 None
R1 Minor
R2 Moderate
R3+ Strong

Higher levels affect HF radio communication.

State Labels

Level	State	UI Color	Interpretation
R0	None	green	No radio blackout conditions.
R1	Minor	yellow	Minor HF radio disruption possible.
R2	Moderate	orange	Moderate HF communication disruption.
R3+	Strong	red	Strong radio blackout conditions.

Observer Meaning

Aurora
Not directly related to aurora.

Radio
HF communication may be disrupted on the sunlit side of Earth.

Navigation
Possible temporary navigation signal degradation.

Optical Observing
No effect.

⸻

7. Magnetosphere Coupling

Label

Magnetosphere Coupling

Tooltip

Interaction strength between solar wind and Earth’s magnetic field.

Strong coupling allows solar wind energy to enter the magnetosphere.

State Labels

State	Color	Interpretation
Closed	green	Solar wind energy transfer is minimal.
Weak coupling	yellow	Some energy entering the magnetosphere.
Active coupling	orange	Significant energy transfer occurring.

Observer Meaning

Aurora
Active coupling often precedes strong aurora.

Radio
Possible ionospheric disturbance.

Navigation
Possible GNSS fluctuations.

Optical Observing
Aurora may become visible.

⸻

8. Aurora Probability

Label

Aurora Forecast

Tooltip

Estimated aurora visibility potential based on geomagnetic conditions.

Higher values mean better chances of aurora.

State Labels

Probability	State	Color
Low	Unlikely	green
Moderate	Possible	yellow
High	Likely	orange
Very High	Strong	red

Observer Meaning

Aurora
Indicates likelihood of visible aurora at relevant latitudes.

Radio
Minor ionospheric disturbances possible.

Navigation
Minor GNSS fluctuations during strong activity.

Optical Observing
Aurora may brighten the night sky.

⸻

Global Summary Output

The interpretation layer should generate 2–4 short lines summarizing the current situation.

Example (quiet)

Space weather is currently calm.
The magnetosphere is mostly closed.
Aurora is unlikely outside high latitudes.

Example (active)

Solar wind is elevated.
Southward IMF allows moderate energy transfer.
Aurora may be visible at high latitudes tonight.

Example (storm)

Geomagnetic storm conditions are active.
Strong coupling is driving energy into the magnetosphere.
Aurora visibility may extend well beyond polar regions.

⸻

Intended UX Outcome

A user unfamiliar with space weather should understand:
	•	what each parameter means
	•	whether conditions are calm or disturbed
	•	whether aurora is possible
	•	whether radio/navigation may be affected

without leaving the widget.
