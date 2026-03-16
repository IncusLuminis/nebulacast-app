Solar Cycle Indicator — Specification v1.1

1. Purpose

The Solar Cycle Indicator provides long-term context for current solar activity by showing the current phase of the ongoing solar cycle on a bell-shaped activity curve.

Unlike short-term operational indicators such as:
	•	Kp
	•	IMF Bz
	•	Solar wind speed
	•	Dynamic pressure

this component explains the broader background of solar activity:
	•	minimum
	•	rising phase
	•	maximum
	•	declining phase

Its purpose is to answer:

Where are we now in the long-term solar activity cycle?

⸻

2. Product role

This is a context panel, not an operational forecast.

It should help users understand why the Sun may currently produce:
	•	more sunspots
	•	more flares
	•	more CME events

It represents:

short-term space weather inside long-term solar activity background


⸻

3. Temporary placement

For v1, the component will be placed as a small separate card inside or near:

OBSERVER IMPACTS

This is a temporary placement decision.

Later it may move to:
	•	a Solar context block
	•	a Helio overview area
	•	a Solar Disk companion panel

⸻

4. Preferred UI concept

The indicator is shown as a bell curve with a marker for the current position.

Example wireframe:

┌──────────────────────────────┐
│ SOLAR CYCLE                  │
│                              │
│              ▲ now           │
│            /   \             │
│          /       \           │
│        /           \         │
│ _____/               \_____  │
│ min     max phase      min   │
│                              │
│ Solar Cycle 25               │
│ Phase: Maximum               │
└──────────────────────────────┘

More compact version:

┌──────────────────────────────┐
│ Solar Cycle 25               │
│          ▲                   │
│       __/ \__                │
│    __/       \__             │
│ min   maximum   decline      │
│ Phase: Maximum               │
└──────────────────────────────┘


⸻

5. What the component communicates

The panel should show:
	1.	current cycle identifier
	2.	activity curve shape
	3.	current position on the curve
	4.	current phase label
	5.	optional subtitle such as:
	•	Near solar maximum
	•	Peak expected ~2025

⸻

6. Data model

export interface SolarCycleIndicator {
  cycle_name: string;              // e.g. "Solar Cycle 25"
  cycle_number: number;            // e.g. 25

  phase: "minimum" | "rising" | "maximum" | "declining";

  progress_0_1: number;            // normalized cycle position
  activity_level_0_1: number;      // normalized bell height at current point

  cycle_start_year: number | null;
  expected_peak_year: number | null;
  expected_end_year: number | null;

  subtitle: string | null;
  updated_utc: string | null;
}


⸻

7. Visual model

The bell curve is a schematic activity envelope, not a measured scientific plot.

It should visually communicate:
	•	low activity at both ends
	•	high activity near the middle
	•	current position marker

The marker should move along the curve according to progress_0_1.

⸻

8. Bell-curve behavior

Left side

Cycle rising from minimum.

Top region

Solar maximum.

Right side

Cycle declining toward minimum.

This gives immediate visual intuition:
	•	rising
	•	peak
	•	falling

⸻

9. Phase labels

Recommended visible labels:

Phase	Visible label
minimum	Minimum
rising	Rising
maximum	Maximum
declining	Declining

Optional richer variants:

Phase	Alternative
minimum	Solar minimum
rising	Rising phase
maximum	Solar maximum
declining	Declining phase

For v1, short labels are preferred.

⸻

10. Subtitle text

Recommended subtitle examples:
	•	Near solar maximum
	•	Peak expected ~2025
	•	Activity remains elevated
	•	Declining after peak

Only one subtitle line should be shown.

⸻

11. Tooltip content

Hover or info tooltip should explain what the curve means.

Example:

Solar Cycle

The Sun follows an activity cycle of about 11 years.

This curve shows the long-term level of solar activity.
Near maximum, the Sun usually produces more sunspots, flares, and CME events.

Shorter version:

Solar Cycle

Long-term background level of solar activity.
This is context, not an immediate forecast.


⸻

12. Observer meaning

This component should be framed as background context, not tonight’s forecast.

Recommended wording:
	•	Long-term solar activity is currently elevated.
	•	This increases the chance of active regions, flares, and CME events over time.
	•	It does not by itself imply immediate storm conditions.

⸻

13. Color scheme

Recommended v1 styling:
	•	curve: muted warm neutral line
	•	marker: accent highlight
	•	maximum region: slightly brighter
	•	labels: subdued

Suggested phase emphasis:

Phase	Color emphasis
minimum	gray / muted green
rising	yellow
maximum	orange
declining	muted amber / blue-gray

Because this sits temporarily in Observer Impacts, it should remain visually secondary to operational alerts.

⸻

14. Marker rules

The marker should indicate current cycle position.

Recommended behavior:
	•	small dot or triangle
	•	placed directly on the curve
	•	optional vertical guide line to baseline

Example:

        ▲
      _/ \_
   __/     \__

The marker should be the only dynamic element.

⸻

15. Axis labeling

For v1, the curve should not be overloaded with dates.

Minimal labels are enough:
	•	min
	•	max
	•	min

Optional year labels may be added later.

If included, keep them subtle:

2019      2025      2030

But this is not required in v1.

⸻

16. Implementation note

The curve can be rendered in a very lightweight way:
	•	SVG path for the bell shape
	•	circle or triangle for the marker
	•	text labels below
	•	no chart library required

Recommended rendering strategy:

SVG curve + current-position marker

This is easier and clearer than a progress bar.

⸻

17. Placement rules

For the current temporary placement in or near Observer Impacts:
	•	the panel should remain compact
	•	it should read as contextual background
	•	it should not compete with Aurora / Radio / GNSS cards

Recommended ordering:
	1.	Aurora
	2.	Radio impact
	3.	GNSS / navigation
	4.	Optical observing
	5.	Solar Cycle context card

⸻

18. Missing-data behavior

If cycle metadata is unavailable:

Solar Cycle
Context unavailable

In practice this should be rare, because the data is low-frequency and can be stored as configuration.

⸻

19. Acceptance criteria

The component is complete when:
	1.	it shows the current solar cycle name
	2.	it displays a bell-shaped activity curve
	3.	it marks the current position on the curve
	4.	it shows the current phase
	5.	it includes a short tooltip explanation
	6.	it clearly reads as long-term context, not immediate risk

⸻

20. Recommended v1 implementation choice

Use a compact bell-curve card:

Solar Cycle 25
        ▲
     __/ \__
  __/      \__
min  maximum  decline
Phase: Maximum
Peak expected ~2025

This is more intuitive than a linear progress bar because it immediately conveys:
	•	the rise
	•	the peak
	•	the decline