Coronal Hole / High-Speed Stream Indicator — Spec v1

1. Purpose

The Coronal Hole / High-Speed Stream Indicator informs users when a coronal hole on the Sun is facing Earth and may produce a high-speed solar wind stream (HSS) that can impact Earth in the coming days.

Unlike CME Tracker, which follows discrete eruption events, this component tracks persistent solar wind sources that can drive geomagnetic activity.

Typical user message:

Coronal hole facing Earth
High-speed stream expected
Arrival: ~16 Mar

The component helps explain periods of elevated geomagnetic activity when no CME is present.

⸻

2. Physical background

A coronal hole is a region of open magnetic field lines in the solar corona.

These open field lines allow solar wind plasma to escape more freely, producing high-speed solar wind streams.

Typical speeds:

Solar wind type	Speed
Background solar wind	300–450 km/s
High-speed stream (HSS)	500–800 km/s

When a coronal hole rotates into the Sun–Earth line, the stream reaches Earth after approximately:

2–4 days

These streams frequently cause:
	•	elevated Kp values
	•	recurrent geomagnetic activity
	•	enhanced auroral visibility

⸻

3. Component role in Helio

This component belongs to the solar drivers layer.

It complements:

Component	Role
Solar Disk	visual source on the Sun
CME Tracker	eruption event driver
Solar Wind Flow Indicator	real-time solar wind
IMF Bz Indicator	coupling efficiency
Geomagnetic Storm Probability	Earth response

Conceptual chain:

Coronal hole → High-speed stream → Solar wind increase → Magnetosphere coupling → Aurora


⸻

4. UI concept

Minimal informational layout:

Coronal Hole Stream
────────────────────

☀  Coronal hole facing Earth

High-speed stream expected
Arrival: 16 Mar
Speed: ~650 km/s

This communicates the essential message:

a fast solar wind stream is likely incoming.

⸻

5. Visual layout

Preferred simple diagram:

☀  ●──────►  🌍
   Coronal hole stream

Elements:

Element	Meaning
Sun icon	solar origin
dot/patch	coronal hole
arrow	solar wind stream
Earth icon	target


⸻

6. Alternate visual representation

If integrated with Solar Disk imagery:

☀ (coronal hole highlighted)
       │
       │ solar wind stream
       ▼
🌍 Earth

The highlighted solar region provides clear context.

⸻

7. Component states

7.1 Coronal hole detected

Coronal hole detected
Earth-facing soon

Used when rotation will soon bring the region into alignment.

⸻

7.2 Coronal hole facing Earth

Coronal hole facing Earth
High-speed stream expected

Primary operational state.

⸻

7.3 High-speed stream arrival window

High-speed stream arrival window
Elevated solar wind expected

Used when predicted arrival is near.

⸻

7.4 Stream active

High-speed stream detected
Solar wind elevated

Used when the fast stream is already measured.

⸻

8. Data sources

Primary observational sources include:
	•	SDO/AIA coronal hole imagery
	•	SWPC solar wind forecasts
	•	solar synoptic maps identifying coronal hole regions

Operational feeds may provide:

coronal hole location
estimated solar wind speed
predicted arrival time


⸻

9. Data model

Suggested normalized structure:

export interface CoronalHoleStream {
  event_id: string;

  detected_time_utc: string | null;

  facing_earth: boolean;

  predicted_arrival_utc: string | null;

  estimated_speed_kms: number | null;

  confidence: "low" | "medium" | "high" | null;

  status: "detected" | "facing_earth" | "arrival_window" | "active";

  summary: string;
  details_url: string | null;
}

Example:

{
  "event_id": "CH_2026_03_14_A",
  "facing_earth": true,
  "predicted_arrival_utc": "2026-03-16T12:00:00Z",
  "estimated_speed_kms": 650,
  "status": "facing_earth"
}


⸻

10. Arrival estimation

Arrival can be approximated from solar wind speed.

Approximate travel time:

distance Sun–Earth ≈ 1 AU

Typical HSS travel time:

Speed	Travel time
500 km/s	~3.5 days
600 km/s	~3 days
700 km/s	~2.5 days

Arrival estimates should be shown with moderate precision.

Example:

Arrival: ~16 Mar


⸻

11. Hover interaction

Hovering the component shows detailed information.

Example tooltip:

Coronal Hole Stream

Estimated solar wind speed: 650 km/s
Predicted arrival: 16 Mar 12:00 UTC
Confidence: Medium

Optional additional parameters:

Source region
Solar latitude
Solar longitude


⸻

12. Click interaction

Click opens detailed view.

Possible content:

Coronal Hole Stream

Coronal hole detected: 13 Mar
Facing Earth: Yes

Predicted solar wind speed: 650 km/s
Arrival window: 16–17 Mar

Potential geomagnetic impact: minor

Optional additions:
	•	solar disk visualization
	•	historical recurrence pattern

⸻

13. Color scheme

Color communicates expected impact strength.

Condition	Color
weak stream	green
moderate stream	yellow
strong stream	orange

Red should be avoided unless geomagnetic storm risk is high.

⸻

14. Integration with Solar Wind Indicator

When the stream arrives:

Solar wind speed increases

Example UI transition:

Before arrival:

Solar wind: 380 km/s
Coronal hole stream expected

After arrival:

Solar wind: 620 km/s
High-speed stream detected


⸻

15. Integration with Geomagnetic Forecast

High-speed streams often produce:

G1–G2 geomagnetic storms

The storm probability component may increase accordingly.

Example combined message:

High-speed stream expected
G1 storm probability: 40%


⸻

16. Integration with Aurora Map

Fast solar wind streams can expand the auroral oval.

The aurora component may show:

Aurora probability elevated

particularly during sustained southward IMF.

⸻

17. Recurrence pattern

Coronal holes often persist across multiple solar rotations.

Approximate recurrence:

~27 days

Future versions may show:

Recurring coronal hole stream


⸻

18. Empty state

If no relevant coronal hole is facing Earth:

The component should be hidden.

Optional fallback:

No Earth-facing coronal holes detected


⸻

19. MVP scope

Include:
	•	coronal hole Earth-facing status
	•	expected stream arrival
	•	estimated wind speed
	•	simple Sun→Earth diagram
	•	hover details

Exclude:
	•	full solar disk rendering
	•	coronal hole segmentation maps
	•	solar rotation modeling
	•	magnetohydrodynamic simulation

⸻

20. Future extensions

Possible improvements:
	•	solar disk with highlighted coronal holes
	•	multi-stream prediction
	•	recurrence tracking across rotations
	•	integration with EUV imagery
	•	animated solar rotation

⸻

21. Acceptance criteria

The component is considered complete when:
	1.	Earth-facing coronal holes are detected
	2.	expected high-speed streams are displayed
	3.	predicted arrival is shown
	4.	estimated wind speed is available
	5.	hover reveals additional information
	6.	the component integrates with solar wind and geomagnetic forecast indicators

⸻

This component complements:
	•	CME Tracker
	•	Solar Wind Flow Indicator
	•	IMF Bz Coupling Indicator

Together they explain the three main drivers of geomagnetic activity:

Solar flares
CME events
Coronal hole high-speed streams