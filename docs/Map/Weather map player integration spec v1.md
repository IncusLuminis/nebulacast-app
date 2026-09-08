Weather Map — Player Integration Spec v1

1. Purpose

This specification defines how the Weather Map component integrates with the global timeline player used across the application.

The goal is to ensure that:
	•	all time-dependent components stay synchronized
	•	map animation follows the same timeline as Sky and Weather cards
	•	the UI has one consistent time controller

The player must control a shared time state, not separate component timelines.

⸻

2. System principle

The application must operate with a single global time controller.

This controller drives:
	•	Sky visualization
	•	Weather hourly cards
	•	Weather map animation
	•	future time-aware components

Therefore:

one player
one timeline
many subscribers

Components never control time directly.

⸻

3. Global time model

The system maintains one global state variable:

global_time_index

This represents the currently selected frame in the timeline.

All time-aware components read this value.

⸻

3.1 Timeline range

For MVP the master timeline range is:

[-48h ... +72h]

Relative to the anchor time.

⸻

3.2 Timeline step

Step size:

1 hour

This matches:
	•	weather hourly forecast
	•	cloud animation frames
	•	typical sky calculation intervals

⸻

3.3 Timeline size

Total number of frames:

121 frames

Indexing:

0   = anchor - 48h
48  = anchor (current hour)
120 = anchor + 72h


⸻

4. Anchor time

The entire system uses one anchor time.

anchor_utc = floor_to_hour(now_utc)

All datasets must be aligned to the same anchor.

This ensures:
	•	sky calculations match weather
	•	cloud frames match forecast
	•	alerts can be aligned if needed

⸻

5. Player responsibilities

The player is responsible for:
	•	controlling the global timeline index
	•	handling playback
	•	emitting time-change events
	•	synchronizing UI components

The player does not render any domain-specific data.

⸻

6. Player state

The player maintains the following state.

current_index
is_playing
playback_speed
timeline_size


⸻

6.1 current_index

Integer.

0..120

Represents the currently selected time frame.

⸻

6.2 is_playing

Boolean.

Indicates if animation playback is active.

⸻

6.3 playback_speed

Number of frames per second.

Recommended default:

1 frame / second

This makes the 5-day timeline animate in about two minutes.

⸻

7. Player actions

The player must support the following actions.

play

Start timeline playback.

⸻

pause

Stop playback.

⸻

step_forward

Advance by one frame.

current_index += 1

Clamp to maximum.

⸻

step_back

Move back one frame.

current_index -= 1

Clamp to minimum.

⸻

scrub

Set timeline to an arbitrary frame.

set_index(n)

This is typically triggered by dragging the timeline slider.

⸻

8. Player event model

Components must subscribe to time updates.

Event:

timeline_change

Payload:

{
  index: number
  t_utc: string
}

Whenever the player changes time, this event is broadcast.

⸻

9. Weather Map subscription

The Weather Map subscribes to the timeline.

When a time change event occurs:

frame_index = event.index

The map then loads the corresponding cloud frame.

cloud_frame = clouds.frames[frame_index]

If available:

render cloud overlay

If unavailable:

render nothing


⸻

10. Frame switching policy

Frame switching must be instant.

No interpolation between frames is required for MVP.

Animation style:

step animation

One frame per hour.

⸻

11. Asset loading policy

Map frames should not load all 121 assets immediately.

Recommended approach:

lazy loading

Load frames when first requested.

⸻

prefetch window

Prefetch frames near the current index.

Example window:

current_index ± 5

This improves playback smoothness.

⸻

12. Playback boundaries

The timeline has fixed limits.

Minimum:

index = 0

Maximum:

index = 120

Behavior when playback reaches the end:

Option A (recommended)

Stop playback.

⸻

Option B

Loop playback.

Looping is optional and not required for MVP.

⸻

13. Initial state

When the page loads:

current_index = 48

This corresponds to:

current time

Playback should start in paused state.

⸻

14. Synchronization with other components

When the player index changes:

Sky component

Recalculate sky view for the selected time.

⸻

Weather cards

Update highlighted hour.

⸻

Map

Switch cloud frame.

⸻

Future components may subscribe as well.

⸻

15. Time label formatting

The player should display the selected time.

Recommended format:

Mon 02:00
Tue 14:00
Wed 22:00

Timezone should match the observer location.

⸻

16. Timeline visualization

The timeline should visually distinguish three segments.

history  |  current  |  forecast

Example:

[-48h … -1h] [0h] [+1h … +72h]

This helps the user understand:
	•	past observations
	•	current conditions
	•	model forecast

⸻

17. Performance requirements

Player interactions must be responsive.

Recommended limits:
	•	frame switch < 50 ms
	•	animation smooth at 1 fps
	•	memory usage controlled via lazy loading

⸻

18. Error tolerance

If a frame asset is missing:
	•	skip rendering
	•	keep timeline intact
	•	continue playback

Player must never crash due to missing frames.

⸻

19. Player ownership

The player should live in a shared UI module, not inside Sky or Weather.

Recommended location:

ui/components/player

This ensures it can be reused across all timeline-driven components.

⸻

20. Future compatibility

The player architecture must allow additional subscribers.

Potential future components:
	•	precipitation map
	•	air mass visualization
	•	aurora oval projection
	•	observing condition score timeline

The player should remain generic and domain-agnostic.

⸻

21. Acceptance criteria

Player integration is considered complete when:
	1.	a single player controls time
	2.	sky, weather cards, and map stay synchronized
	3.	map animation follows player index
	4.	timeline covers -48h to +72h
	5.	playback works smoothly
	6.	missing frames do not break playback
	7.	player remains reusable for future components

⸻

22. MVP summary

For the first production release the player must support:
	•	shared timeline
	•	cloud animation
	•	synchronization with sky
	•	synchronization with weather forecast
	•	manual scrubbing
	•	play/pause

No advanced interpolation or time warping is required.

⸻

If you want, the next useful step would be to write a short Release-1 architecture summary tying together:
	•	Helio
	•	Weather Map
	•	Cloud Layer
	•	Player

into one coherent system diagram before you freeze the MVP.