Solar Activity Timeline — Spec v1

1. Purpose

The Solar Activity Timeline visualizes the sequence of solar and geomagnetic events affecting Earth.

Current alerts are usually presented as a flat list:

Geomagnetic storm watch
Elevated solar wind
Radio blackout risk

This makes it difficult to understand the causal chain of events.

The timeline organizes events chronologically so users can see:

solar flare → CME launch → CME arrival → geomagnetic storm

The goal is to present space weather as a process, not a set of isolated alerts.

⸻

2. Concept

Space weather follows a typical progression:

Solar flare
↓
Coronal Mass Ejection (CME)
↓
CME propagation through interplanetary space
↓
CME arrival at Earth
↓
Geomagnetic disturbance
↓
Auroral activity

The timeline visualizes these stages.

⸻

3. Component placement

The Solar Activity Timeline appears inside Helio.

Recommended placement:

below "Observer Impacts"
above "Alerts"

This allows the timeline to explain why alerts exist.

⸻

4. Timeline layout

The timeline is a vertical event chain.

Example:

Solar Activity Timeline
────────────────────────

Mar 11   ● C2 solar flare detected
Mar 11   ● CME launch
Mar 12   ● CME propagation
Mar 13   ● Geomagnetic storm watch
Mar 13   ● Expected CME arrival
Mar 13   ● Kp 5 peak


⸻

5. Visual design

Each event is represented as:

icon + timestamp + event label

Example:

☀ Solar flare
│
● CME launch
│
● CME arrival
│
● Geomagnetic storm


⸻

Icons

Event type	Icon
Solar flare	☀
CME launch	☄
CME arrival	🌍
Geomagnetic storm	⚡
Radio blackout	📡
Proton storm	☢

Icons help users quickly understand the type of event.

⸻

6. Event structure

Each timeline entry contains:

event_time
event_type
event_title
event_description
source
severity

Example object:

{
  "event_time": "2026-03-11T04:22Z",
  "event_type": "flare",
  "event_title": "C2 Solar Flare",
  "severity": "minor",
  "source": "SWPC"
}


⸻

7. Event types

Supported event categories:

solar_flare
cme_launch
cme_arrival
geomagnetic_storm_watch
geomagnetic_storm
radio_blackout
solar_radiation_storm

These correspond to NOAA alert systems.

⸻

8. Event severity

Severity helps prioritize events.

Recommended levels:

Level	Meaning
info	minor activity
watch	possible event
warning	likely event
alert	event occurring

Example:

geomagnetic_storm_watch
severity: watch


⸻

9. Data sources

Timeline events can be collected from multiple sources.

SWPC alerts

https://www.swpc.noaa.gov/products/alerts-watches-and-warnings

Provides:
	•	geomagnetic storm watches
	•	radio blackout alerts
	•	radiation storm alerts

⸻

NASA DONKI

https://ccmc.gsfc.nasa.gov/donki/

Provides:

solar flares
CMEs
CME impact predictions


⸻

10. Event merging

Events from multiple sources must be merged.

Process:

collect events
normalize event format
sort by timestamp

Result:

unified event timeline


⸻

11. Time range

Timeline should show events within:

past 72 hours
next 48 hours

This captures both:
	•	the origin of current activity
	•	upcoming impacts

⸻

12. Interactivity

Each event is clickable.

Action:

click → show details

Details panel example:

Solar Flare C2
Time: Mar 11 04:22 UTC

Active Region: AR3664
Peak X-ray flux: C2.3

Source: NOAA SWPC


⸻

13. Hover interaction

Hovering over an event displays quick info.

Example:

CME launch
Speed: 820 km/s
Direction: Earth-directed
Expected arrival: Mar 13 21:00 UTC


⸻

14. Event grouping

Multiple events may occur on the same day.

The timeline groups events by date.

Example:

Mar 13
● CME arrival forecast
● Geomagnetic storm watch
● Kp 5 peak


⸻

15. Highlighting active events

Events currently affecting Earth should be highlighted.

Example:

geomagnetic storm active

Visual style:

bold text
highlighted marker


⸻

16. Color scheme

Events use severity colors.

Severity	Color
info	gray
watch	yellow
warning	orange
alert	red

Example:

● Geomagnetic storm watch   (yellow)
● Geomagnetic storm warning (orange)


⸻

17. Timeline scale

The vertical spacing reflects chronological order, not exact time duration.

This keeps the component compact.

⸻

18. Performance considerations

Typical number of events:

5–15 events

Timeline rendering should be lightweight.

Data refresh interval:

10–30 minutes


⸻

19. Integration with Helio alerts

Alerts remain available as a list.

Timeline provides context for those alerts.

Example:

Timeline
↓
Explains why alerts exist


⸻

20. MVP scope

For the first release include:

event icons
timestamp
event label
hover info
click details

Exclude:

animated propagation
3D heliosphere simulation


⸻

21. User value

The timeline allows users to see the story of space weather events.

Without the timeline:

alerts appear disconnected

With the timeline:

users understand cause and effect

Example:

Solar flare → CME launch → CME arrival → geomagnetic storm

This makes Helio easier to interpret for both:
	•	casual users
	•	experienced observers.