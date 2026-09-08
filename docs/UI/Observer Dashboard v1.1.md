
Spec: Observer Dashboard built from widget fragments

Goal

Build the main Observer Dashboard as a composed summary workspace using already-proven fragments from existing widgets.

Important constraint:
	•	Do not modify existing widgets
	•	Existing widgets must remain intact for:
	•	standalone pages
	•	showcase
	•	external embedding if applicable

For the dashboard only, it is allowed to copy and reuse selected internal UI fragments from widgets and assemble them into a new dashboard layout.

The dashboard is not a full widget page.
It is a higher-level summary and launcher surface.

⸻

High-level idea

The dashboard should let the observer understand the current day/night status at a glance, and then drill into details by clicking summary elements.

The main interaction model is:
	•	Hero Strip = summary + launcher
	•	Clicking hero items opens corresponding subpanels below
	•	Sky and Map remain persistent anchor panels underneath
	•	Newly opened subpanels are inserted between the Hero Strip and the Sky / Map area
	•	Vertical scrolling is acceptable and expected

Do not limit the number of open subpanels for now.
If the user opens all available panels, they should all remain visible in a vertical stack.

There are only a small number of such subpanels, so this is acceptable if performance allows.

⸻

Dashboard structure

1. Global Control Bar (top of dashboard)

At the very top of the dashboard, include a clear operational control area for:
	•	location
	•	date/time
	•	time player / transport controls

This is the global context controller for the entire dashboard.

It should stay visible and act as the primary control source for all dashboard content.

⸻

2. Hero Strip

Below the control bar, create a horizontal Hero Strip that summarizes the current state of the day/night and acts as the launcher for dashboard subpanels.

Hero items should include at least:
	•	Date / Time
	•	Night Quality (5.0 Usable style)
	•	Tonight
	•	Moon
	•	Kp
	•	Sun

Each item should show summary information only in collapsed state.

Clicking a Hero item should expand/open the related subpanel below.

⸻

Hero item → panel mapping

Use this interaction mapping:

Date / Time

Opens:
	•	Weather cards panel

Night Quality (5.0 Usable)

Opens:
	•	Matrix panel

Any observing profile chip

Opens:
	•	Observing cards panel

Tonight

Opens:
	•	Best Observing Window panel

Moon

Opens:
	•	Sun Equation panel

Kp

Opens:
	•	Space Weather panel

Sun

Opens:
	•	Space Weather panel

If a mapped panel is already open, clicking again may:
	•	toggle it closed
	•	or scroll to it if already open

Implementation choice is up to you, but behavior must be consistent and clear.

⸻

3. Expanded panels stack

Below the Hero Strip, create a vertical stack area for expanded panels.

When the user clicks Hero items, the corresponding dashboard subpanels appear here.

Rules:
	•	panels are inserted below Hero Strip
	•	multiple panels may remain open at once
	•	no arbitrary maximum number of open panels for now
	•	if all available panels are open, they should simply stack vertically
	•	vertical scrolling is acceptable

These subpanels are dashboard-specific compositions built from existing widget fragments.

⸻

4. Persistent anchor panels

Below the expanded panels stack, place two large persistent panels:
	•	SKY
	•	MAP

These should remain visible as the stable main visual field of the dashboard.

Requirements:
	•	use the existing Sky widget as-is
	•	use the existing Map widget as-is
	•	do not redesign or break them
	•	place them side by side
	•	split the available width roughly in half
	•	both panels should be square:
	•	width = height
	•	equal visual size

If expanded panels push them downward, that is acceptable.

⸻

Optional lower sections

For now, ignore additional secondary lower strips or tertiary metrics.
They can be added later.

⸻

Dashboard purpose

The dashboard should solve this problem:

The observer should be able to understand the current day/night summary immediately, and then click into the parts they want to inspect in detail.

The dashboard is a summary-and-launch surface, not a full replacement for widget pages.

⸻

State persistence

Dashboard state persistence is important.

If possible, preserve:
	•	which dashboard subpanels are currently open
	•	their open/closed state across reload
	•	any selected hero/profile state relevant to dashboard usage

Use a simple mechanism such as local storage if appropriate.

This allows the user to shape the dashboard into a preferred personal workspace.

⸻

Alarm lamps integration

We also want to introduce the new alarm-lamp visual language into the dashboard.

Placement

Do not make the lamp panel a large standalone block for now.

Instead, integrate it into the Hero area as a compact mini status panel.

Suggested approach:
	•	place a compact subpanel on the right side of the Hero Strip
	•	if necessary, slightly reduce the visual width/size of:
	•	Moon
	•	Kp
	•	Sun
to make room

Content

Use 3 small alarm indicators:
	•	SUN
	•	SPACE
	•	EARTH

These lamps should summarize:
	•	current solar source activity
	•	current/incoming propagation through space
	•	current impact at Earth

This mini alarm strip acts as a compact status rail rather than a full content block.

Interaction

Ideally, clicking these alarm indicators should open the related space-weather subpanels, but exact behavior may be decided during implementation.

⸻

Important constraints

Existing widgets
	•	must remain unchanged
	•	must continue to work on their own pages
	•	must continue to work in showcase
	•	should not be restructured just for the dashboard

Dashboard
	•	may reuse/copy selected internal UI fragments from widgets
	•	may build new summary sections using those fragments
	•	should not duplicate full standalone widget headers where unnecessary

⸻

Design priorities
	1.	One glance summary
The dashboard should immediately communicate:
	•	current time/status
	•	quality of the upcoming night
	•	current space/weather state
	2.	Click for depth
Hero items should act as intuitive launch points to deeper sections.
	3.	Stable visual anchors
Sky and Map should remain central and persistent.
	4.	No forced panel limits
Do not auto-close or block opening a 4th panel.
If multiple panels are open, stack them and allow scrolling.
	5.	Widgets stay intact
Dashboard is built from fragments and reused visual pieces, not by rewriting the original widgets.

⸻

Suggested dashboard layout

[ GLOBAL CONTROL BAR ]

[ HERO STRIP ]
  Date/Time | Night Quality | Tonight | Moon | Kp | Sun | Mini Alarm Rail

[ EXPANDED PANELS STACK ]
  0..N open dashboard subpanels

[ SKY ] [ MAP ]
  side by side, square, persistent


⸻

Acceptance criteria
	•	Dashboard uses a global control bar at the top
	•	Hero Strip exists and acts as summary + launcher
	•	Clicking Hero items opens mapped subpanels below
	•	Multiple subpanels may remain open at once
	•	No arbitrary open-panel limit is enforced
	•	Sky and Map remain persistent square anchor panels below
	•	Existing widgets are not modified for this task
	•	Dashboard reuses/copies widget fragments where needed
	•	A compact alarm-lamp mini panel is integrated into the Hero area
	•	The dashboard feels like a personalized observer workspace rather than a stacked list of full widgets

⸻

Implementation freedom

Claude/Codex may decide:
	•	exact layout/grid system
	•	component composition
	•	exact subpanel toggle behavior
	•	local storage model
	•	exact way to fit the mini alarm strip into the Hero area

The key requirement is the overall dashboard model and interaction flow, not a specific pixel-perfect implementation.