Task: Use alarm GIFs in the new Sun → Space → Earth panel

Goal

Render animated alarm GIFs inside the 3-column Sun → Space → Earth panel using pre-generated assets from:

sites/staging/assets/gifs/

Use these GIFs as the visual state indicators for each column.

Do not generate graphics in code for this task.
Just map current column states to existing GIF files.

⸻

Asset path

Base path:

const GIF_BASE = "sites/staging/assets/gifs";

Files follow this naming convention:

{mode}_{color}_{label}.gif

Examples:
	•	off_green_quiet.gif
	•	steady_green_normal.gif
	•	blink_fast_yellow_watch.gif
	•	breathe_slow_red_alert.gif
	•	beacon_red_storm.gif

⸻

Core rule

For most states, mapping is 1:1 from:
	•	mode
	•	color
	•	label

to the corresponding GIF filename.

However, there is one important override:

Special override
	•	For Sun and Space severe alert states, use:

breathe_slow_red_alert.gif

	•	For Earth severe storm state, use:

beacon_red_storm.gif

This distinction is intentional:
	•	Sun / Space = alert / incoming warning
	•	Earth = active storm impact

⸻

Column-specific mapping

SUN column

Use alarm GIF based on solar source activity.

Recommended mapping:
	•	quiet / none
→ off_green_quiet.gif
	•	active normal / mild source activity
→ steady_green_normal.gif
	•	elevated / watch
→ blink_fast_yellow_watch.gif
	•	alert / strong solar source event
→ breathe_slow_red_alert.gif

⸻

SPACE column

Use alarm GIF based on propagation / incoming event state.

Recommended mapping:
	•	clear / none
→ off_green_quiet.gif
	•	normal transit / low concern
→ steady_green_normal.gif
	•	watch / possible incoming event
→ blink_fast_yellow_watch.gif
	•	incoming alert / Earth-directed CME / significant propagation risk
→ breathe_slow_red_alert.gif

⸻

EARTH column

Use alarm GIF based on current Earth impact.

Recommended mapping:
	•	quiet / G0
→ off_green_quiet.gif
	•	active low / minor activity
→ steady_green_normal.gif
	•	watch / elevated but not storm
→ blink_fast_yellow_watch.gif
	•	storm / significant current impact
→ beacon_red_storm.gif

⸻

Suggested mapping helper

Implement a helper such as:

function getAlarmGif(column, severity) {
  const base = "sites/staging/assets/gifs";

  const defaultMap = {
    quiet: "off_green_quiet.gif",
    normal: "steady_green_normal.gif",
    watch: "blink_fast_yellow_watch.gif",
    alert: "breathe_slow_red_alert.gif",
    storm: "beacon_red_storm.gif",
  };

  if ((column === "sun" || column === "space") && severity === "storm") {
    return `${base}/breathe_slow_red_alert.gif`;
  }

  if (column === "earth" && (severity === "alert" || severity === "storm")) {
    return `${base}/beacon_red_storm.gif`;
  }

  return `${base}/${defaultMap[severity] || defaultMap.quiet}`;
}

You may rename severity keys if needed, but preserve the behavior.

⸻

Visual usage

In each column header area:
	•	render the corresponding GIF as the alarm indicator
	•	keep status text and messages below it

The GIF should act as the main visual signal lamp for the column.

⸻

Size / layout
	•	Keep GIF compact
	•	It should fit naturally in the column header
	•	Recommended:
	•	fixed width or max-width
	•	preserve aspect ratio
	•	no stretching

Example CSS:

.chain-alarm {
  display: block;
  width: 100%;
  max-width: 180px;
  height: auto;
  margin: 0 auto 12px;
}

Adjust to actual panel layout as needed.

⸻

Fallback behavior

If a GIF file is missing:
	•	fail gracefully
	•	optionally fall back to:
	•	off_green_quiet.gif
	•	do not break the panel

⸻

Constraints
	•	Do not redesign the panel
	•	Do not replace text content
	•	Only wire GIF-based visual indicators
	•	Minimal invasive diff
	•	Reuse current panel states if already available

⸻

Acceptance criteria
	•	Sun, Space, and Earth columns each show a GIF indicator
	•	GIFs are loaded from sites/staging/assets/gifs/
	•	Normal mapping is 1:1
	•	Special override is applied:
	•	Sun/Space severe → breathe_slow_red_alert.gif
	•	Earth severe/current storm → beacon_red_storm.gif
	•	Panel remains readable and visually aligned