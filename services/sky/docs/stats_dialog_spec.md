
## Sky Alerts — Statistics Dialog Specification

1. Purpose

The Alerts Statistics Dialog provides a structured analytical overview of the current alerts_now.json dataset.

It is designed to:
	•	Provide situational awareness
	•	Highlight hazard concentration
	•	Visualize observational characteristics
	•	Reveal temporal clustering
	•	Support scientific interpretation

This dialog is read-only and computed entirely from alerts_now.json.

⸻

2. Data Source Contract

All statistics are computed from:

alerts_now.json
{
  "generated_utc": "...",
  "items": [
    {
      "id": "...",
      "group": "...",
      "score_norm": 0.83,
      "ra_deg": 123.4,
      "dec_deg": -12.3,
      "mag": 19.2,
      "updated_utc": "...",
      "ingested_utc": "...",
      "meta": {
        "moid_au": 0.004,
        "dist_au": 0.012,
        "diameter_est_km": 0.35,
        "ip": 1e-6,
        "ps": -2.3,
        "ts": 0,
        "hazard_score": 0.65,
        "urgency_score": 0.42
      }
    }
  ]
}

The dialog must:
	•	Use only alerts_now.json
	•	Not depend on per-group JSON files
	•	Tolerate missing fields gracefully

⸻

3. UI Layout

+=============================================================================+
| Alerts Statistics                                                           |
| [Close]                                                                     |
+=============================================================================+
| 1) Distribution by Group                                                    |
|-----------------------------------------------------------------------------|
| 2) Close Approaches                                                         |
|-----------------------------------------------------------------------------|
| 3) Magnitude Distribution                                                   |
|-----------------------------------------------------------------------------|
| 4) Diameter Distribution                                                    |
|-----------------------------------------------------------------------------|
| 5) Event Time Distribution                                                  |
|-----------------------------------------------------------------------------|
| 6) Risk Monitoring Overview                                                 |
+=============================================================================+

Design principles:
	•	Dark theme
	•	Minimal spacing
	•	Scientific typography
	•	No decorative UI
	•	Compact and readable

⸻

4. Chart Specifications

⸻

4.1 Distribution by Group (Donut Chart)

Purpose

Show dataset composition by alert type.

Data Source

item.group

Groups
	•	NEO
	•	PHA
	•	Risk
	•	NEOCp
	•	Transient
	•	GRB
	•	GCN
	•	Other (fallback)

Display Rules
	•	Donut chart
	•	Center label: Total Alerts: N
	•	Legend on right
	•	Color mapping:

Group	Color
PHA	Red
Risk	Orange
NEO	Blue
NEOCp	Yellow
Transient	Purple
GRB	Cyan
GCN	Grey

Tooltip

Group: NEO
Count: 42
Percentage: 35%


⸻

4.2 Close Approaches Chart

Purpose

Visualize minimum Earth distances.

Included Groups
	•	NEO
	•	PHA
	•	Risk (if MOID exists)

Data Priority
	1.	meta.moid_au
	2.	meta.dist_au
	3.	meta.dist_ld (converted)

Chart Type

Vertical bar chart:
	•	X-axis: Object ID
	•	Y-axis: Distance (AU or LD)
	•	Sorted ascending (smallest first)

Highlighting
	•	PHA → Red
	•	Risk → Orange
	•	Others → Default

Tooltip

Object: 2026 DK
Distance: 0.012 AU
PHA: Yes
Hazard Score: 0.81


⸻

4.3 Magnitude Distribution (Histogram)

Purpose

Understand brightness distribution.

Data Sources

item.mag
meta.mag
meta.vmag

Chart
	•	Histogram
	•	X-axis: Magnitude bins
	•	Y-axis: Count
	•	Only include objects with magnitude

Optional:
	•	Vertical line for mean magnitude

⸻

4.4 Diameter Distribution (NEO / PHA)

Purpose

Show physical size distribution.

Data Source

meta.diameter_est_km

Chart
	•	Histogram
	•	X-axis: Diameter (km)
	•	Y-axis: Count
	•	Log scale recommended

Optional:
	•	Highlight PHA bins

⸻

4.5 Event Time Distribution

Purpose

Reveal clustering in time.

Data Priority
	1.	meta.t_utc_iso
	2.	updated_utc
	3.	ingested_utc

Chart Modes

Mode A — Daily histogram
	•	X-axis: Date
	•	Y-axis: Count

Mode B — Hour-of-day heat map
	•	X-axis: Hour (UTC)
	•	Y-axis: Group
	•	Color intensity: Count

⸻

4.6 Risk Monitoring Overview (KPI Panel)

Purpose

Provide quantitative hazard summary.

Computed Metrics
	•	Count of Risk objects
	•	Count of PHA objects
	•	Maximum Impact Probability
	•	Maximum Hazard Score
	•	Average Hazard Score
	•	Highest Torino Scale
	•	Highest Palermo Scale

Example Layout

Active Risk Objects: 50
PHA Objects: 4

Max Impact Probability: 2.1e-6
Max Torino Scale: 1
Max Palermo Scale: -1.3

Highest Hazard Score: 0.82
Average Hazard Score: 0.17


⸻

5. Optional Advanced Panels

⸻

5.1 Hazard vs Urgency Scatter

Purpose

Separate physical danger from observational interest.

Axes
	•	X-axis: Hazard Score
	•	Y-axis: Urgency Score
	•	Color: Group

⸻

5.2 Altitude Distribution (If Available)

If meta.max_alt_deg exists:
	•	Histogram of max altitude
	•	Count objects above 30°
	•	Count objects below horizon

⸻

6. Performance Requirements
	•	All calculations client-side
	•	No backend requests
	•	<200ms render for 500 objects
	•	Charts degrade gracefully if data missing

⸻

7. Interaction Rules
	•	Modal dialog
	•	No map interaction
	•	Recompute automatically when alerts_now.json refreshes
	•	No filtering inside dialog (analytics only)

⸻

8. Styling Guidelines
	•	Dark background
	•	Subtle grid lines
	•	Neutral typography
	•	Compact layout
	•	Monospaced numeric labels optional
	•	No oversized headings

⸻

9. Future Extensions
	•	Time window selector (24h / 7d / 30d)
	•	Hazard-only filter
	•	Export as CSV / PNG
	•	Comparison between time slices

⸻

10. Summary

The Statistics Dialog transforms alerts_now.json from:
	•	A list of events

into:
	•	A scientific analytical dashboard

It provides:
	•	Structural overview
	•	Hazard visibility
	•	Observational distribution
	•	Temporal patterns
	•	Quantitative risk snapshot
