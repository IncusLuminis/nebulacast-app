
Task: Create new 3-column Solar → Space → Earth status panel

Goal

Create a new compact status panel that summarizes the causal chain of space weather across three stages:
	•	Sun = what is happening now on the Sun
	•	Space = what is currently propagating toward Earth
	•	Earth = what is happening now at Earth

This panel is meant to provide a fast, human-readable overview of the full situation.
It should help explain the relationship between solar events, propagation through space, and current terrestrial impact.

This is a new panel. Do not remove existing panels yet.
We want to add it first and evaluate how it works with the rest of the widget.

Possible later placement: this panel may become the first major panel above the other indicators, so implement it as a standalone reusable block.

⸻

Panel title

Use a clear title, for example:

Space Weather Chain

Alternative acceptable title:

Solar → Space → Earth


⸻

Layout

Create a 3-column layout:

SUN    |    SPACE    |    EARTH

Each column contains:
	1.	a signal lamp / status indicator in the column header
	2.	a short status label
	3.	1–3 short message lines below

Optional:
	•	faint directional arrows between columns:
	•	Sun → Space
	•	Space → Earth

Start static first. No animation required.

⸻

Column semantics

1. SUN column

Represents source activity on the Sun now.

Examples of content:
	•	solar flare activity
	•	coronal hole / high-speed stream source
	•	general solar source state

Example messages:

High-speed stream: Active
Fast solar wind from coronal hole

Possible flare example:

Solar flare: M2
Elevated X-ray activity

This column should answer:

What is happening on the Sun right now?


⸻

2. SPACE column

Represents what is currently traveling from Sun to Earth.

Examples:
	•	Earth-directed CME detected
	•	CME ETA
	•	expected impact

Example messages:

Earth-directed CME detected
ETA: 03:00 UTC
Expected impact: G2

If nothing is propagating:

No Earth-directed events

This column should answer:

What is currently on the way to Earth?


⸻

3. EARTH column

Represents what is happening at Earth now.

Examples:
	•	current G level
	•	current geomagnetic state
	•	Kp / impact summary

Example messages:

G2
Moderate geomagnetic storm
Kp 6.3

If quiet:

G0
Quiet geomagnetic conditions
Kp 3.0

This column should answer:

What is happening at Earth right now?


⸻

Signal lamps

Each column header should include a compact signal lamp.

The lamp is not decorative only.
It must encode severity / activity state for that column.

General rule

Use the same semantic severity scale across all 3 columns:
	•	quiet / none → dim gray
	•	low / minor → green
	•	moderate → yellow
	•	strong → orange
	•	severe / extreme → red

Do not animate yet.
Just support variable brightness / active state by color and glow intensity.

⸻

Lamp meaning by column

SUN lamp

Represents source activity level on the Sun

Examples:
	•	quiet Sun → gray
	•	coronal hole active or minor flare → green/yellow
	•	strong flare / major source activity → orange/red

SPACE lamp

Represents incoming threat / propagation severity

Examples:
	•	no incoming Earth-directed event → gray
	•	weak incoming event → yellow
	•	significant incoming CME → orange/red

EARTH lamp

Represents current impact at Earth

Examples:
	•	G0 / quiet → gray
	•	G1–G2 → yellow
	•	G3+ → orange/red

⸻

Suggested column status labels

Keep large status labels short.

Examples:

SUN
	•	Quiet
	•	Active
	•	Elevated
	•	Strong

SPACE
	•	Clear
	•	Incoming
	•	Active
	•	Impacting

EARTH
	•	Quiet
	•	Active
	•	Storm
	•	Severe

⸻

Message rules
	•	Keep messages short
	•	Maximum 3 short lines per column
	•	Do not overload with raw metrics
	•	Prefer interpreted, human-readable text
	•	Use raw numbers only if they are essential

⸻

Initial fallback content

Support good empty states.

SUN fallback

Quiet
No significant solar source activity

SPACE fallback

Clear
No Earth-directed events

EARTH fallback

Quiet
No significant geomagnetic impact


⸻

Data model

Use/add a backward-compatible derived structure like:

{
  "chain_panel": {
    "sun": {
      "state": "active",
      "severity": "moderate",
      "messages": [
        "High-speed stream: Active",
        "Fast solar wind from coronal hole"
      ]
    },
    "space": {
      "state": "clear",
      "severity": "none",
      "messages": [
        "No Earth-directed events"
      ]
    },
    "earth": {
      "state": "quiet",
      "severity": "none",
      "messages": [
        "G0",
        "Quiet geomagnetic conditions",
        "Kp 3.0"
      ]
    }
  }
}

All additions must be additive-only.
Do not break existing schema.

⸻

Visual requirements
	•	Match current dark theme
	•	Keep panel compact and readable
	•	Use clear column separation
	•	Use subtle arrows between columns only if they help
	•	No large decorative graphics yet
	•	No heavy bitmap art
	•	Prefer CSS/SVG-only implementation

⸻

Placement

For now:
	•	add this as a new standalone panel
	•	do not remove or reorder existing panels yet

Important:
this panel may later become the first panel above all indicators, so implement it in a reusable way and make sure it works well near the top of the widget.

⸻

Constraints
	•	No major refactor of existing panels yet
	•	No schema-breaking changes
	•	No animation required
	•	No large images
	•	Minimal invasive diff
	•	Keep implementation modular

⸻

Acceptance criteria
	•	New 3-column panel is rendered
	•	Columns are Sun, Space, Earth
	•	Each column has:
	•	signal lamp
	•	status label
	•	short messages
	•	Lamps reflect column severity/state
	•	Good fallback states exist for empty/no-event conditions
	•	Panel visually fits with the rest of the widget
	•	Existing panels continue to work unchanged