Geomagnetic Storm Probability Indicator — Spec v1

1. Purpose

The Geomagnetic Storm Probability Indicator displays the probability of geomagnetic storm levels over the next 24 hours.

Instead of showing only the current geomagnetic state (e.g., Kp = 3), this component communicates forecasted risk levels using the NOAA G-scale.

Example:

Next 24h

G1 40%
G2 15%
G3 5%

This allows users to understand storm potential, not just current conditions.

The component is particularly useful for:
	•	aurora observers
	•	satellite operators
	•	radio operators
	•	space weather enthusiasts

⸻

2. Physical background

Geomagnetic storms occur when solar wind energy strongly couples with the magnetosphere.

Typical drivers:
	•	CME impacts
	•	high-speed solar wind streams
	•	sustained southward IMF Bz

These processes increase the Kp index, which determines geomagnetic storm levels.

The NOAA storm scale:

Level	Description	Typical Kp
G0	Quiet	Kp ≤ 4
G1	Minor storm	Kp = 5
G2	Moderate storm	Kp = 6
G3	Strong storm	Kp = 7
G4	Severe storm	Kp = 8
G5	Extreme storm	Kp = 9

For Helio v1 the UI focuses on:

G1–G3

which cover the majority of real events.

⸻

3. Component role in Helio

The Geomagnetic Storm Probability Indicator belongs to the magnetosphere forecast layer.

It connects upstream space-weather drivers with Earth impacts.

Conceptual chain:

Solar flare / CME
        ↓
Solar wind + IMF Bz
        ↓
Magnetosphere coupling
        ↓
Geomagnetic storm probability
        ↓
Aurora activity

This component answers:

What is the chance of geomagnetic storms in the next 24 hours?

⸻

4. UI concept

Simple probability ladder.

Example layout:

Geomagnetic Storm Probability
Next 24h
────────────────

G1  40%
G2  15%
G3   5%

This communicates risk clearly.

⸻

5. Visual style

Each storm level is shown with a probability bar.

Example:

Next 24h

G1  ████████░░░░░░  40%
G2  ███░░░░░░░░░░░  15%
G3  █░░░░░░░░░░░░░   5%

Bar length represents probability.

⸻

6. Color scheme

Color encodes severity.

Level	Color
G1	yellow
G2	orange
G3	red

Example:

G1  ████████  40%   (yellow)
G2  ███       15%   (orange)
G3  █          5%   (red)

Higher storm levels visually stand out.

⸻

7. Data source

Primary data source:

NOAA SWPC geomagnetic storm probability forecast

Typical product:

Geomagnetic Storm Forecast
Probability of G1–G3 events

Forecast horizon:

next 24 hours

Optional secondary sources:
	•	SWPC 3-day geomagnetic forecast
	•	space-weather prediction models

⸻

8. Data model

Suggested internal structure:

export interface GeomagneticStormProbability {
  horizon_hours: number;

  g1_probability: number;
  g2_probability: number;
  g3_probability: number;

  forecast_issued_utc: string;
  source: string;
}

Example:

{
  "horizon_hours": 24,
  "g1_probability": 40,
  "g2_probability": 15,
  "g3_probability": 5
}


⸻

9. Hover interaction

Hovering the component shows additional context.

Example tooltip:

Geomagnetic Storm Probability

Next 24 hours

G1: 40%
G2: 15%
G3: 5%

Forecast issued: 12 Mar 18:00 UTC
Source: NOAA SWPC

Optional additional context:
	•	solar wind conditions
	•	CME impact expectation

⸻

10. Click interaction

Clicking the component opens a detail panel.

Example:

Geomagnetic Storm Forecast

Next 24 hours

G1 (Minor storm): 40%
G2 (Moderate storm): 15%
G3 (Strong storm): 5%

Drivers:
CME arrival expected
Southward IMF likely

Source: NOAA SWPC

Optional additions:
	•	explanation of G-scale
	•	aurora latitude estimates

⸻

11. Integration with Aurora Map

The storm probability indicator is directly linked to aurora visibility.

Example interpretation:

Storm level	Typical aurora reach
G1	high latitudes
G2	mid-high latitudes
G3	mid latitudes

The Aurora Map component may reference this forecast.

⸻

12. Integration with CME Tracker

When a CME is inbound, storm probabilities may increase.

Example:

CME inbound
Arrival: 13 Mar 21:00 UTC

Storm probability:
G1 40%
G2 15%
G3 5%

This helps explain why storm risk is elevated.

⸻

13. Compact layout option

If space is limited:

Storm probability (24h)

G1 40%
G2 15%
G3 5%

or

Storm risk
G1: 40%

However, the full ladder is preferred.

⸻

14. Update cadence

Storm probability forecasts typically update:

every 6 hours

The component should update when new forecast data becomes available.

⸻

15. Handling missing data

If forecast data is unavailable:

Storm probability
Forecast unavailable

The component should not display outdated forecasts without timestamp.

⸻

16. User benefit

Most users cannot interpret:

Kp forecast = 6

But they easily understand:

G1 storm chance: 40%

Thus the component converts space-weather forecast → operational probability.

⸻

17. MVP scope

Include:
	•	G1–G3 probability display
	•	bar visualization
	•	hover details
	•	forecast timestamp

Exclude:
	•	regional geomagnetic forecasts
	•	dynamic Kp simulation
	•	multi-day probability curves

These can be added later.

⸻

18. Future extensions

Possible improvements:
	•	3-day storm probability chart
	•	integration with aurora visibility model
	•	storm probability timeline
	•	historical comparison

⸻

19. Acceptance criteria

The component is complete when:
	1.	probabilities for G1–G3 are displayed
	2.	bar lengths reflect probability values
	3.	colors encode severity
	4.	hover reveals forecast metadata
	5.	updates occur when new forecasts arrive

⸻

This component completes the space-weather impact layer alongside:
	•	Radio Blackout Indicator (R-scale)
	•	IMF Bz Coupling Indicator
	•	Aurora Probability Map

Together they translate complex solar-terrestrial physics into clear operational signals for observers.