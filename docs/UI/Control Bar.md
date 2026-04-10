
Global dashboard control bar

A dedicated global control bar must exist at the very top of the dashboard main area.

This control bar is required and is one of the key elements of the Observer Console.

Purpose

It must provide a clear and convenient way to control the global context for the entire dashboard, especially:
	•	location
	•	date/time
	•	time playback / stepping

This control bar is the main interaction point for navigating conditions across time.

Required controls

1. Location control
Provide a clear location selector at the top of the dashboard.

It should support at least:
	•	current selected location display
	•	change location action
	•	optional “my location” shortcut if already supported

The selected location must act as global context for all widgets in the dashboard.

2. Time control
Provide a clear current date/time display tied to the dashboard context.

This should show the currently selected effective time for the console.

3. Time player / transport control
The dashboard needs a strong and usable time navigation control at the top.

This should behave like a player/transport control rather than a simple timestamp label.

Expected capabilities:
	•	play / pause
	•	step forward / backward
	•	scrub through time
	•	move across forecast hours conveniently
	•	visibly show the currently selected time position

This is an important operational control and should be designed as a first-class dashboard tool.

Scope of effect

The global location/time/player bar must conceptually drive all main dashboard widgets, including at least:
	•	Weather Conditions
	•	Space Weather
	•	any timeline/hourly panels
	•	any summary cards that depend on time/location

The dashboard should behave like one synchronized console, not like isolated widgets.

Placement

Place this control bar at the top of the main dashboard area, above:
	•	hero summary
	•	primary metric cards
	•	timeline
	•	secondary widgets

It may coexist with the app-level top bar, but within the dashboard itself there must be a clearly visible operational control area for location/time/player.

UX requirements
	•	It must be easy to understand at a glance
	•	It must feel like a proper console control, not a decorative header
	•	It should reduce ambiguity about what time and location the dashboard is currently showing
	•	It should make time exploration fast and comfortable

Important rule

Standalone widget pages may have their own full context panels if needed, but on the dashboard this global control bar is the primary source of location/time control and should prevent duplicated context UIs inside embedded widgets.