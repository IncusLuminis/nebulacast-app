Event Importance Scoring — Specification v1

1. Purpose

Event Importance Scoring provides a unified way to rank incoming alerts and events by their operational significance.

The goal is to help users quickly identify:
	•	events that require attention
	•	events that are interesting but not urgent
	•	informational updates

Each event is assigned one of four severity levels:

Critical
Major
Minor
Info

This ranking determines:
	•	alert ordering
	•	visual prominence
	•	notification behavior

⸻

2. Role in the System

Sky Console aggregates events from multiple sources:
	•	space weather
	•	astronomical alerts
	•	sky events
	•	solar activity

Without scoring, the alert stream becomes noisy.

Event Importance Scoring provides a global prioritization layer.

Event flow:

External data sources
        ↓
Alert ingestion
        ↓
Event scoring
        ↓
Alert ranking
        ↓
UI display


⸻

3. Severity Levels

Critical

Events that may have immediate scientific or operational impact.

Typical examples:
	•	strong geomagnetic storm (Kp ≥ 8)
	•	Earth-directed CME with high probability
	•	major solar flare (X-class)
	•	gravitational wave detection with high significance

Characteristics:
	•	high prominence in UI
	•	may trigger notification
	•	always placed at top of alert list

⸻

Major

Events that are significant but not urgent.

Examples:
	•	moderate geomagnetic storm
	•	strong aurora forecast
	•	bright supernova discovery
	•	notable comet outburst
	•	large solar flare (M-class)

These events are important for observers but not critical.

⸻

Minor

Events of moderate interest.

Examples:
	•	small solar flares
	•	minor space weather disturbances
	•	routine astronomical discoveries
	•	moderate NEO discoveries

These appear in the alert list but do not dominate the UI.

⸻

Info

Low-priority informational updates.

Examples:
	•	routine catalog updates
	•	small observational reports
	•	minor detections with low significance

These events are mostly informational.

⸻

4. Scoring Model

Internally, each event receives a numeric score.

Example range:

0.0 – 1.0

Severity mapping:

Score	Severity
≥ 0.80	Critical
0.60–0.79	Major
0.30–0.59	Minor
< 0.30	Info

This allows flexible ranking while preserving a simple UI classification.

⸻

5. Data Model

Suggested structure:

interface EventImportance {
  score_raw: number
  severity: "critical" | "major" | "minor" | "info"

  source: string
  reason: string | null

  updated_utc: string
}

Example:

{
  "score_raw": 0.86,
  "severity": "critical",
  "source": "swpc",
  "reason": "X-class solar flare",
  "updated_utc": "2026-03-14T08:20:00Z"
}


⸻

6. Integration with Alerts

Each alert object includes the importance score.

Example:

{
  "id": "alert_123",
  "type": "solar_flare",
  "note": "X2.1 flare detected",
  "score_raw": 0.87,
  "severity": "critical"
}


⸻

7. UI Representation

Severity is displayed using visual indicators.

Level	Color	Label
Critical	red	Critical
Major	orange	Major
Minor	yellow	Minor
Info	grey	Info

Example alert card:

[Critical] X2.1 Solar Flare


⸻

8. Alert Sorting

Alerts should be sorted using the following priority:

severity
    ↓
score_raw
    ↓
updated_utc

Result:
	1.	Critical events first
	2.	Major events
	3.	Minor events
	4.	Informational items

Within each category, higher score appears first.

⸻

9. Notification Behavior

Severity also controls notifications.

Severity	Notification
Critical	immediate alert
Major	optional alert
Minor	no alert
Info	silent

Implementation may vary by platform.

⸻

10. Scoring Inputs

The scoring system may use different parameters depending on event type.

Examples:

Space Weather

Inputs:
	•	Kp index
	•	solar flare class
	•	CME speed
	•	CME impact probability

⸻

Astronomical Alerts

Inputs:
	•	brightness
	•	scientific significance
	•	discovery type
	•	detection confidence

⸻

Transient Events

Inputs:
	•	classification probability
	•	signal significance
	•	observational importance

⸻

11. Example Scoring Rules

Example rules:

X-class solar flare → Critical
M-class flare → Major
C-class flare → Minor

Kp ≥ 8 → Critical
Kp 6–7 → Major
Kp 4–5 → Minor

GW detection FAR < 1e-10 → Critical

The ruleset can evolve as the system expands.

⸻

12. Filtering

Users may filter alerts by severity.

Example UI filter:

Show:
☑ Critical
☑ Major
☐ Minor
☐ Info

This helps reduce noise.

⸻

13. Visual Density Control

If too many alerts exist, the UI may collapse low-severity items.

Example:

Critical: 2
Major: 4
Minor: 18
Info: 53

Minor and Info alerts can be grouped.

⸻

14. Handling Unknown Scores

If scoring fails:

severity = info
score_raw = 0.0

This prevents unranked alerts from appearing at the top.

⸻

15. Update Behavior

Events may change severity as new data arrives.

Examples:
	•	CME impact probability increases
	•	transient classification updated
	•	storm intensifies

The scoring system must allow reclassification.

⸻

16. User Benefit

Without scoring, the alert stream becomes overwhelming.

Example:

32 alerts today

With scoring:

Critical: 1
Major: 3
Minor: 8
Info: 20

Users can focus on the most important events.

⸻

17. MVP Scope

Include:
	•	four severity levels
	•	numeric scoring
	•	alert sorting
	•	visual indicators

Exclude:
	•	machine learning scoring models
	•	complex multi-source weighting

⸻

18. Acceptance Criteria

The system is considered complete when:
	1.	every alert receives a severity level
	2.	alerts are sorted by severity
	3.	severity is visually indicated in UI
	4.	filtering by severity works
	5.	alerts can be reclassified when new data arrives

⸻

The Event Importance Scoring system provides a unified prioritization mechanism that keeps the alert stream readable while ensuring that critical events are immediately visible.