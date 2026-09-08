Night Overview Panel

Specification (Composite Widget Panel)

⸻

1. Objective

Create a single horizontal composite panel that summarizes the upcoming night for observational use.

The panel aggregates multiple existing subsystems into a high-level decision layer:
	•	space weather impact
	•	solar state
	•	textual night summary
	•	lunar conditions
	•	average night score (per profile)
	•	best observing window (time + drivers)

This panel is not a detailed analysis tool.
It is a top-level entry point answering:

"Is tonight worth observing, and when?"


⸻

2. Layout Structure

Left → right fixed sequence:
	1.	Space Weather
	2.	Sun
	3.	Night Summary (text)
	4.	Moon
	5.	Night Score (average)
	6.	Best Observing Window

Single row, horizontally scrollable if needed.

⸻

3. Data Scope

Time scope:

current night only:
[local sunset → next sunrise]

All derived values must respect this window.

⸻

4. Panel 1 — Space Weather

4.1 Source

Reuse existing space weather widget logic (no redesign).

4.2 Data
	•	Kp index (current)
	•	trend (↑ ↓ →)
	•	storm level (G-scale)
	•	radio blackout (R-scale)
	•	solar radiation (S-scale)

4.3 Rendering
	•	large Kp value
	•	label: Storm Risk
	•	badges: G / R / S

4.4 Constraints
	•	identical visual + logic reuse
	•	no additional aggregation

⸻

5. Panel 2 — Sun

5.1 Source

Existing solar visualization module.

5.2 Behavior
	•	animated Sun
	•	visualization mode depends on solar activity / risk

5.3 Data
	•	solar activity index (same as space weather driver)
	•	sunrise time
	•	sunset time

5.4 Rendering
	•	center: animated solar disk
	•	bottom:

↓ sunset_time   ↑ sunrise_time

Example:

↓ 19:08   ↑ 05:40

5.5 Rules
	•	use local time
	•	no UTC display here

⸻

6. Panel 3 — Night Summary (Text)

6.1 Purpose

Human-readable synthesis of:
	•	weather conditions
	•	seeing / transparency (if available)
	•	cloud cover
	•	wind
	•	humidity / dew
	•	space weather (only if impactful)

⸻

6.2 Input Signals

From existing pipelines:
	•	cloud %
	•	wind speed
	•	dew point / humidity
	•	precipitation
	•	space weather severity
	•	average night score

⸻

6.3 Output Format

2–3 sentences max.

Structure:

[Primary condition]

[Key limiting factor]

[Optional note]


⸻

6.4 Examples

Good night:

Clear skies expected throughout the night with low wind.
Conditions are favorable for most types of observations.

Bad night:

High cloud cover and strong winds will limit visibility.
Observing conditions are poor for most of the night.

Solar impact:

Increased geomagnetic activity may affect radio observations.


⸻

6.5 Priority Logic

Order of importance:
	1.	clouds
	2.	precipitation
	3.	wind
	4.	dew/humidity
	5.	space weather (only if strong)

⸻

6.6 Constraints
	•	deterministic templates (no LLM)
	•	no long text
	•	no speculation

⸻

7. Panel 4 — Moon

7.1 Data
	•	phase (0–100%)
	•	illumination %
	•	moonrise
	•	moonset

⸻

7.2 Rendering
	•	moon disk with shadow overlay (phase)
	•	bottom:

98%   ↓16:08   ↑03:44


⸻

7.3 Rules
	•	phase must be visually correct (terminator)
	•	illumination numeric must match rendering

⸻

8. Panel 5 — Night Score (Average)

8.1 Purpose

Provide single-number summary of the night quality

⸻

8.2 Input

Use existing scoring system:

From rules:
	•	altitude
	•	visibility
	•	brightness
	•	time visible
	•	etc  ￼

⸻

8.3 Computation

For each profile:

average(score(t)) over [sunset → sunrise]

Profiles:
	•	Balanced
	•	Visual
	•	Broadband
	•	Planetary

⸻

8.4 UI
	•	large number:

90

	•	label:

Excellent / Good / Poor


⸻

8.5 Profile Switch

Buttons:

Balanced | Visual | Broadband | Planetary

Switch updates:
	•	score value
	•	label

⸻

8.6 Constraints
	•	no recomputation on UI
	•	precomputed in backend preferred

⸻

9. Panel 6 — Best Observing Window

9.1 Purpose

Answer:

"When exactly should I observe?"


⸻

9.2 Window Calculation

Find:

continuous time segment with max score

Constraints:
	•	minimum duration: configurable (e.g. ≥ 1h)
	•	must lie within night window

⸻

9.3 Output

8:00 PM — 1:00 AM


⸻

9.4 Graph

X-axis:

time from sunset → sunrise

Y-axis:
	•	selected metric

⸻

9.5 Metrics (switch via chips)

Chips:

Cloud | Dew | Wind


⸻

9.6 Behavior
	•	chip click → updates graph
	•	no layout shift

⸻

9.7 Graph Type
	•	bar or stepped histogram
	•	fixed resolution (e.g. 30 min bins)

⸻

9.8 Highlight
	•	best window visually highlighted

⸻

10. Data Pipeline

10.1 Inputs
	•	weather forecast (hourly)
	•	solar data
	•	lunar data
	•	scoring output
	•	space weather

⸻

10.2 Derived Data

Backend should produce:

{
  "night_window": { "start": "...", "end": "..." },
  "avg_scores": {
    "balanced": 90,
    "visual": 85,
    "broadband": 70,
    "planetary": 95
  },
  "best_window": {
    "start": "...",
    "end": "..."
  },
  "timeseries": {
    "cloud": [...],
    "dew": [...],
    "wind": [...]
  }
}


⸻

11. Performance Constraints
	•	all heavy computation backend-side
	•	frontend = rendering only
	•	payload size minimized (timeseries compressed)

⸻

12. Dependencies

Reuses:
	•	space weather module
	•	solar rendering
	•	lunar rendering
	•	scoring engine
	•	weather pipeline

⸻

13. Acceptance Criteria

Panel is complete when:
	1.	All 6 sections render in one row
	2.	Data corresponds strictly to current night
	3.	Theme switching does not break layout
	4.	Score updates when profile changes
	5.	Best window reflects scoring peak
	6.	Text summary reflects actual conditions
	7.	No panel blocks rendering if one source fails

⸻

14. Risks

14.1 Data inconsistency

Different sources → misaligned timelines

14.2 Over-simplification

Average score hides variability

14.3 UX overload

Too many signals in one row

⸻

15. Recommended Implementation Order
	1.	Layout skeleton
	2.	Plug existing Space Weather + Sun + Moon
	3.	Add Night Score
	4.	Add Best Window
	5.	Add text summary last (depends on all inputs)

⸻

16. Core Design Principle

This panel is not about precision.

It is about:

fast situational awareness

User decides:
	•	go outside or not
	•	when to observe
	•	which widget to open next
