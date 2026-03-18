Helio UI — Temporal Anchoring (Now / Last Step / Next Step)

Specification v1.0

⸻

1. Purpose

Introduce a clear time-based separation across Helio UI sections to eliminate ambiguity between:
	•	current conditions
	•	recent past
	•	upcoming forecast

This is a UI-only change.
No backend or data model changes are required.

⸻

2. Core Principle

Each section must explicitly represent a distinct temporal reference:

Section	Meaning
Hero + Indicators + Observer Impacts	Now (current conditions)
History	Last available step (past)
Forecast	Next available step (future)

Because data is not strictly hourly, use:

Last step
Next step

—not “previous hour” / “next hour”.

⸻

3. Terminology Rules

Allowed labels
	•	Now
	•	Current conditions
	•	Last step
	•	Recent history
	•	Next step
	•	Forecast

Avoid
	•	“current + possible” mixed phrasing
	•	“next hour” (too precise)
	•	unlabeled time context

⸻

4. Hero Section

4.1. Role

Represents current observed conditions only.

4.2. Required label

Current conditions

4.3. Content rules
	•	All values must reflect now
	•	No forecast wording inside primary description

Example

Kp 1.3 ↓
Current conditions

Geomagnetic activity is quiet.


⸻

5. Indicators Section

5.1. Role

Displays current measured values

Includes:
	•	IMF Bz
	•	Solar Wind
	•	X-Ray
	•	Aurora (current interpretation)

5.2. Rule

All indicators must represent Now only.

No forecast values allowed here.

⸻

6. Observer Impacts

6.1. Role

Represents current impact assessment

Examples:
	•	Aurora: Low
	•	Radio impact: None
	•	Solar activity: Low

6.2. Rule
	•	Must reflect current state only
	•	No forecast wording inside collapsed rows

⸻

7. History Section

7.1. Role

Represents the most recent completed data step

This is not continuous history visualization, but a snapshot anchor.

⸻

7.2. Header format

Recent history · Last step <time>

Example

Recent history · Last step 18:00 UTC


⸻

7.3. Data rules

History shows values for:
	•	Kp
	•	IMF Bz
	•	Solar Wind
	•	X-Ray

All values correspond to the latest available completed interval (e.g. last 3-hour block).

⸻

7.4. Display rules
	•	Top numeric tiles reflect last step values
	•	Graphs (if present) show historical trend
	•	No forecast data allowed here

⸻

8. Forecast Section

8.1. Role

Represents the next available forecast step

⸻

8.2. Header format

Forecast · Next step <time>

Example

Forecast · Next step 21:00 UTC


⸻

8.3. Data rules

Forecast includes only forecast-capable metrics:
	•	Kp forecast
	•	Storm Risk
	•	G scale outlook
	•	R scale outlook
	•	S scale outlook
	•	Aurora outlook (if available)

⸻

8.4. Display rules
	•	Top numeric tiles reflect next forecast step
	•	Probability panels (e.g. G1–G3) remain here
	•	No current-state values mixed into this section

⸻

9. Storm Risk Panel

9.1. Reclassification

Storm Risk must be treated strictly as:

Forecast (Next step / next 24h)


⸻

9.2. Title

Storm Risk — Next step

or

Storm Risk — Next 24h


⸻

9.3. Rules
	•	Derived from Kp forecast only
	•	Must not contradict current Kp
	•	Must not appear as “current state”

⸻

10. Temporal Consistency Rules

10.1. No mixing

A single UI block must not mix:

current + past + future


⸻

10.2. Cross-section consistency
	•	Hero = Now
	•	History = Last step
	•	Forecast = Next step

These must not contradict each other semantically.

⸻

10.3. Example (correct)

Hero:
Kp 1.3 — Quiet now

History:
Last step 18:00 UTC — Kp 2.0

Forecast:
Next step 21:00 UTC — Kp 3.0 expected


⸻

11. Time Display Rules

Each non-current section must include a visible time reference.

Required:
	•	UTC timestamp
	•	attached to section header

Optional:
	•	local time (future enhancement)

⸻

12. Minimal UI Changes

This spec requires only:

1. Add labels
	•	Current conditions
	•	Recent history · Last step
	•	Forecast · Next step

⸻

2. Add timestamps
	•	History → last step time
	•	Forecast → next step time

⸻

3. Adjust wording
	•	remove mixed “present or possible” phrases
	•	separate current vs forecast descriptions

⸻

13. No Backend Changes

This spec explicitly avoids:
	•	data model refactoring
	•	new data sources
	•	interpolation
	•	synthetic forecast generation

All values reuse existing pipeline outputs.

⸻

14. Acceptance Criteria

The feature is complete when:
	1.	each section clearly communicates its time context
	2.	users can distinguish:
	•	now
	•	last step
	•	next step
	3.	current Kp no longer conflicts visually with Storm Risk
	4.	History and Forecast display timestamps
	5.	no UI block mixes temporal meanings

⸻

15. Implementation Priority

This is a high-impact, low-cost change and should be implemented before:
	•	model refactoring
	•	scoring improvements
	•	new data integrations

⸻

16. Summary

This change introduces a simple but critical rule:

Now → Last step → Next step

applied consistently across Helio.

It resolves confusion without increasing system complexity and prepares the UI for future model improvements.