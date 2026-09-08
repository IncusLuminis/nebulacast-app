CME Tracker — Spec v1

1. Purpose

CME Tracker visualizes a discrete solar eruption event traveling from the Sun toward Earth.

Unlike the continuous Solar Wind Flow Indicator, which shows the background solar wind state near Earth, CME Tracker shows a specific propagating event:
	•	CME launch
	•	travel through interplanetary space
	•	predicted arrival at Earth
	•	expected impact severity

Its purpose is to help users understand the event chain:

Solar flare → CME launch → CME propagation → Earth impact

This is an event tracker, not a plasma monitor.

⸻

2. User value

CME Tracker should answer:
	1.	Is there an Earth-directed CME right now?
	2.	When is it expected to arrive?
	3.	How fast is it moving?
	4.	How important is the expected impact?

Without this component, users only see downstream indicators like:

Kp = 5
Geomagnetic storm watch

With CME Tracker, they see the cause:

A CME is on the way and may reach Earth at 21:00 UTC


⸻

3. Component role inside Helio

CME Tracker is a conditional event block inside Helio.

It should appear only when there is at least one relevant CME event.

Recommended placement:

below Hero / Magnetosphere
above Solar Activity Timeline

This gives a natural narrative flow:

Sun state → CME event → magnetosphere impact → aurora


⸻

4. Conceptual distinction from other Helio elements

4.1. Solar Wind Flow Indicator

Shows:

continuous background flow

Source type:

real-time measurements near Earth

Examples:
	•	DSCOVR
	•	ACE
	•	SWPC real-time solar wind

⸻

4.2. CME Tracker

Shows:

discrete propagating eruption

Source type:

event analysis / modeled arrival estimate

Examples:
	•	NASA DONKI CME analysis
	•	SWPC CME arrival forecast
	•	related event products

⸻

5. Display logic

The block should be visible only if at least one CME meets the relevance criteria.

Show CME Tracker when:
	•	an Earth-directed CME exists
	•	a CME arrival forecast exists
	•	an interplanetary shock arrival forecast exists
	•	a recently detected CME is still relevant to the current 24–72h space-weather context

Hide CME Tracker when:
	•	no active or upcoming CME is relevant
	•	available CME events are stale and no longer operationally useful

⸻

6. UI concept

6.1. Minimal visual layout

CME Tracker
────────────────────────────

☀ ────────► 🌍

CME travel time
Arrival: 13 Mar 21:00 UTC
Speed: 820 km/s
Impact: Moderate

This is the simplest useful version.

⸻

6.2. Enhanced visual layout

CME Tracker
────────────────────────────

☀    ○----○----●----○    🌍
        CME trajectory

Arrival: 13 Mar 21:00 UTC
Speed: 820 km/s
Expected impact: Moderate

Where:
	•	Sun icon = launch origin
	•	Earth icon = target
	•	circles = path ticks
	•	filled marker = current estimated progress position of CME

This version is more expressive and still lightweight.

⸻

7. Visual elements

The component contains:
	•	Sun icon
	•	Earth icon
	•	trajectory line
	•	optional progress marker
	•	short event summary
	•	arrival time
	•	speed
	•	impact label

Optional:
	•	uncertainty band
	•	shock icon
	•	multiple CME markers in future versions

⸻

8. Main states

8.1. CME detected / early stage

CME launched
Arrival estimate pending

Use when:
	•	CME has been identified
	•	Earth-directed relevance exists
	•	arrival estimate is not yet stable

⸻

8.2. CME inbound

CME inbound
Arrival: 13 Mar 21:00 UTC

Use when:
	•	there is a valid arrival forecast

This is the main and most important state.

⸻

8.3. CME arriving / impact window

CME impact window
Expected now / soon

Use when:
	•	predicted arrival is within a near-current window
	•	e.g. ±6 hours around expected arrival

⸻

8.4. CME arrived

CME arrival detected
Geomagnetic activity may increase

Use when:
	•	shock arrival has been observed
	•	event has transitioned from forecast to current impact context

⸻

9. Data sources

Primary source candidates:
	•	NASA DONKI
	•	SWPC event/forecast products
	•	related CME and shock forecast feeds

Preferred source priority for v1:
	1.	source with explicit Earth-directed CME arrival estimate
	2.	source with clear event timestamp, speed, and expected arrival
	3.	source with impact metadata or enough information to derive operational relevance

⸻

10. Data model

Recommended normalized event model for CME Tracker:

export interface CmeTrackerEvent {
  event_id: string;
  source: "DONKI" | "SWPC" | "OTHER";
  source_event_type: string | null;

  launch_time_utc: string | null;
  detected_time_utc: string | null;

  arrival_time_utc: string | null;
  arrival_window_start_utc: string | null;
  arrival_window_end_utc: string | null;

  speed_kms: number | null;
  earth_directed: boolean | null;

  impact_level: "low" | "moderate" | "high" | null;
  impact_summary: string | null;

  status: "detected" | "inbound" | "arrival_window" | "arrived" | "stale";
  title: string;
  summary: string;

  confidence: "low" | "medium" | "high" | null;
  details_url: string | null;
}


⸻

11. Required vs optional fields

Required for a valid displayed event

At minimum, the tracker should have:
	•	event_id
	•	status
	•	title
	•	summary

Strongly preferred for useful tracking
	•	arrival_time_utc
	•	speed_kms
	•	impact_level

Optional
	•	details_url
	•	confidence
	•	arrival_window_start_utc
	•	arrival_window_end_utc

⸻

12. Event selection rules

If multiple CME events exist, the component should choose the most relevant one for the main visible block.

Priority order:
	1.	Earth-directed CME with arrival forecast in the next 72h
	2.	Earth-directed CME with active arrival window
	3.	Earth-directed CME recently arrived
	4.	newly detected Earth-directed CME without stable arrival forecast
	5.	other CME events only if clearly relevant

If multiple relevant events exist:
	•	main block shows the most operationally relevant one
	•	secondary events can appear in details view or timeline

⸻

13. Event status derivation

13.1. detected

Use when:
	•	CME exists
	•	Earth-directed relevance exists
	•	no stable arrival estimate yet

13.2. inbound

Use when:
	•	arrival estimate exists
	•	current time is clearly before arrival window

13.3. arrival_window

Use when:
	•	current time is close to predicted arrival
	•	e.g. within configured tolerance window around arrival time

13.4. arrived

Use when:
	•	shock arrival or CME arrival has been observed/reported

13.5. stale

Use when:
	•	event is no longer operationally relevant
	•	should usually not be shown in main tracker

⸻

14. Impact level derivation

Impact level can come from source metadata or be inferred conservatively.

Allowed values:
	•	low
	•	moderate
	•	high

Suggested inference inputs:
	•	CME speed
	•	Earth-directed confidence
	•	linked geomagnetic watch/storm forecast
	•	arrival shock severity if available

Conservative heuristic for v1:
	•	low:
	•	slower CME and/or weak expected geomagnetic consequences
	•	moderate:
	•	meaningful geomagnetic response likely
	•	high:
	•	strong storm potential or strong shock forecast

This is an operational label, not a scientific classification.

⸻

15. Progress visualization

If launch_time_utc and arrival_time_utc are known, the tracker may estimate progress.

Simple normalized progress:

progress =
(now_utc - launch_time_utc) / (arrival_time_utc - launch_time_utc)

Clamped to:

0.0 … 1.0

This drives the position of the trajectory marker:

☀    ○----●----○----○    🌍

If launch or arrival time is missing:
	•	hide progress marker
	•	keep simple Sun → Earth line

⸻

16. Hover interaction

Hovering over the visual path or summary should show a tooltip.

Example:

CME
Speed: 820 km/s
Expected arrival: 13 Mar 21:00 UTC
Expected impact: Moderate
Confidence: Medium

Optional extra fields:
	•	launch time
	•	source
	•	arrival window
	•	linked flare region

⸻

17. Click interaction

Clicking the component opens a detail view, popover, or modal.

Detail content may include:

CME Tracker

Launch: 11 Mar 04:22 UTC
Estimated arrival: 13 Mar 21:00 UTC
Speed: 820 km/s
Earth-directed: Yes
Expected impact: Moderate

Source: NASA DONKI
[Open event details]

If multiple CME events exist:
	•	show list of related CME events
	•	allow switching between them

⸻

18. Color scheme

Use color to encode expected impact.

Impact	Color
low	green
moderate	yellow
high	red

These colors may apply to:
	•	trajectory line
	•	progress marker
	•	status badge
	•	impact label

Do not overuse color on the entire card; the main emphasis should remain readable.

⸻

19. Text catalog

Recommended visible titles:
	•	CME detected
	•	CME inbound
	•	CME arrival window
	•	CME arrival detected

Recommended summary lines:
	•	Arrival: 13 Mar 21:00 UTC
	•	Speed: 820 km/s
	•	Expected impact: Moderate
	•	Geomagnetic activity may increase after arrival

The block should remain concise.

⸻

20. Time handling

All internal times remain UTC.

Visible times should be shown as short absolute UTC labels.

Preferred format:

13 Mar 21:00 UTC

Do not use raw ISO strings in the visible UI.

⸻

21. Integration with Solar Activity Timeline

CME Tracker should connect naturally with the timeline.

Example sequence:

☀ flare
● CME launch
● CME inbound
● CME arrival
● geomagnetic storm watch

Recommended interaction:
	•	clicking the CME event in the timeline opens or focuses CME Tracker details

This creates a coherent story across Helio.

⸻

22. Integration with Magnetosphere and Aurora

CME Tracker is upstream of:
	•	magnetosphere response
	•	geomagnetic activity
	•	aurora potential

When a relevant CME is inbound, the rest of Helio can reflect that context:
	•	Magnetosphere block may show elevated readiness
	•	Aurora block may show increased possible activity
	•	Hero summary may mention approaching CME impact

This does not require hard coupling in v1, but the conceptual link should be preserved.

⸻

23. Empty state

If no relevant CME event exists:
	•	the CME Tracker block should be hidden

Alternative minimal fallback, if needed:
	•	No Earth-directed CME event currently tracked

For MVP, hidden is preferable to visual clutter.

⸻

24. Error tolerance

If CME data is partially missing:
	•	keep the block if core event meaning is still available
	•	hide unavailable fields
	•	do not show broken placeholders

If source is temporarily unavailable:
	•	hide the block rather than displaying misleading stale information, unless stale display policy is explicitly implemented

⸻

25. MVP scope

Include:
	•	one main CME event block
	•	Sun → Earth visual
	•	speed
	•	arrival time
	•	impact level
	•	hover details
	•	click details

Exclude:
	•	3D heliosphere simulation
	•	full orbital geometry
	•	ensemble forecast cones
	•	animated CME shell expansion
	•	multiple simultaneous event graphing

⸻

26. Future extensions

Possible later upgrades:
	•	uncertainty cone
	•	multiple CME events
	•	ENLIL-style propagation context
	•	animated progress over time
	•	linked flare source region on solar disk
	•	direct tie-in to geomagnetic forecast probabilities

These are explicitly outside v1.

⸻

27. Acceptance criteria

CME Tracker is complete for v1 when:
	1.	it appears only for relevant CME events
	2.	it clearly shows Sun → Earth propagation
	3.	it displays expected arrival time when available
	4.	it displays speed when available
	5.	it conveys expected impact in simple terms
	6.	click reveals more detail
	7.	it complements, rather than duplicates, Solar Wind Flow Indicator

⸻

28. Recommended next spec block

The next useful piece would be:

Helio Interaction Model v1

That would define how all Helio subcomponents work together:
	•	Hero
	•	Magnetosphere
	•	Solar Wind Flow
	•	Solar Disk
	•	CME Tracker
	•	Aurora Map
	•	Solar Activity Timeline
	•	Alerts

This would prevent the component from becoming a pile of unrelated widgets.