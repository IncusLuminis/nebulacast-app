Helio Improvement 1.3 — Solar Disk Mini Loop

Specification v1.0

1. Purpose

Add a live solar disk animation to the Helio widget to visually represent current solar activity.

The goal is to introduce a small, continuously updating Sun animation sourced from real observational data (SDO), providing:
	•	visual context for space weather
	•	immediate indication of solar dynamics
	•	stronger scientific credibility of the interface
	•	an engaging, living UI element

The component is intentionally lightweight and non-interactive in v1.0.

⸻

2. UI Concept

A small animated solar disk appears in the top-right corner of the Helio widget.

┌───────────────────────────────┐
│ Space Weather                  │
│                                │
│ KP      4                      │
│ Bz     -5.2 nT                 │
│ Solar Wind  520 km/s           │
│                                │
│                         ☀      │
│                     (SDO loop) │
└───────────────────────────────┘

Visual behavior
	•	Smooth looping animation
	•	Silent
	•	No controls
	•	Always playing
	•	Subtle presence

Label (optional overlay)

SDO AIA 171
Last 24h solar activity


⸻

3. Data Source

Primary source:

Solar Dynamics Observatory

via

Helioviewer Movie API.

Helioviewer provides programmatic generation of solar observation timelapse videos using SDO imagery.

⸻

4. Solar Imaging Channel

Default channel for v1.0:

Channel	Source ID	Reason
AIA 171	10	visually clear coronal structures

Alternative channels (future):

Channel	Use
AIA 304	chromosphere / prominences
AIA 193	hotter coronal regions

Default:

SDO AIA 171 Å


⸻

5. Animation Content

The loop represents solar activity over the previous 24 hours.

Parameters

Parameter	Value
Time range	last 24 hours
Frames	24–48
Frame rate	12–15 fps
Duration	~3–5 seconds
Loop	continuous

The animation is cyclic and seamless.

⸻

6. Video Format

Preferred format:

MP4 (H.264)

Reasons:
	•	smaller size than GIF
	•	hardware decoding
	•	smoother playback
	•	wide browser support

Alternative fallback:

WebM


⸻

7. UI Dimensions

Recommended sizes:

Context	Size
Helio widget	120–160 px
Large panel	200–300 px

Aspect ratio:

1 : 1


⸻

8. Rendering Implementation

HTML structure example:

<div class="helio-solar-mini">
  <video autoplay loop muted playsinline>
    <source src="/assets/helio/sun_loop.mp4" type="video/mp4">
  </video>
</div>

CSS example:

.helio-solar-mini {
  position: absolute;
  top: 8px;
  right: 10px;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  overflow: hidden;
}

.helio-solar-mini video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}


⸻

9. Backend Generation Pipeline

Solar animations are generated server-side using the Helioviewer Movie API.

Step 1 — queue movie generation

Example request:

https://api.helioviewer.org/v2/queueMovie/

Parameters:

Parameter	Value
startTime	now − 24h
endTime	now
layers	AIA 171
format	mp4
frameRate	15
maxFrames	48


⸻

Step 2 — check movie status

Endpoint:

getMovieStatus

States:

Code	Meaning
0	queued
1	processing
2	finished
3	invalid


⸻

Step 3 — download video

When ready:

downloadMovie

Save locally:

/assets/helio/sun_loop.mp4


⸻

10. Update Frequency

Solar animation should be regenerated periodically.

Recommended interval:

every 6 hours

Reasons:
	•	solar structures evolve
	•	keeps animation fresh
	•	minimal server load

⸻

11. Performance Impact

Network

Video size expected:

1–2 MB

Cached by browser.

CPU

Minimal:
	•	video hardware decoding
	•	no JavaScript animation
	•	no canvas rendering

Memory

Negligible.

⸻

12. Interaction (v1.0)

None.

The solar disk acts as a visual indicator only.

Future versions may add:
	•	click to open solar activity panel
	•	active region overlays
	•	coronal hole overlays
	•	flare markers

⸻

13. Future Extensions

Planned for later releases.

Solar Disk Modal

Clicking the Sun opens a larger solar viewer.

Features:
	•	full solar disk
	•	active region markers
	•	coronal hole polygons
	•	flare events

⸻

Solar Activity Overlay

Possible overlays:

Overlay	Data
Active Regions	NOAA AR catalog
Coronal Holes	Helioviewer events
Solar Flares	GOES flare catalog


⸻

CME Detection Integration

Link solar disk with:
	•	CME launch markers
	•	CME trajectory viewer
	•	solar activity timeline

⸻

14. Failure Handling

If solar animation fails to load:

Fallback to static image:

/assets/helio/sun_static.jpg

Label:

Solar activity (SDO)


⸻

15. Accessibility

Add alt description:

Solar disk animation showing solar activity over the past 24 hours.


⸻

16. Acceptance Criteria

Feature is considered complete when:
	•	Helio widget displays animated solar disk
	•	animation loops smoothly
	•	video updates automatically
	•	playback works on all major browsers
	•	fallback image appears if video unavailable
	•	CPU impact is negligible

⸻

17. Scope Control

This improvement must remain minimal for release readiness.

v1.0 includes:
	•	solar animation
	•	automated refresh
	•	lightweight video embed

Explicitly excluded:
	•	solar event overlays
	•	solar flare detection
	•	interactive solar viewer
	•	heliophysics analytics

Those belong to Helio v2.

⸻

This component provides a living solar context for the Helio widget and strengthens the conceptual link between:

Sun → solar wind → magnetosphere → space weather

without adding complexity to the MVP interface.