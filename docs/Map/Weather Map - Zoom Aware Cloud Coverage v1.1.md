# Weather Map — Zoom-Aware Cloud Coverage  
## Enhancement Spec v1.1

---

## 1. Purpose

This spec extends Map v1 with **zoom-aware cloud coverage**.

Goal:
- remove hard edges of cloud domain when zooming out
- preserve existing architecture (timeline, player, pipeline)
- avoid dynamic backend complexity

This is an additive enhancement over v1.

---

## 2. Non-breaking rule

v1.1 MUST NOT:
- break `weather_map_now.json` consumers
- change timeline model
- change player model
- change existing layer semantics

v1 behavior must continue to work if only one cloud profile exists.

---

## 3. Core Concept

Introduce **cloud coverage profiles**.

Each profile:
- represents a different spatial domain
- shares the same timeline
- has its own frame assets

Frontend selects profile based on zoom.

---

## 4. Key Principle

```text
time selection → controlled by player
spatial coverage → controlled by zoom

These are independent axes.

⸻

5. Data Contract Extension

5.1 Clouds layer update

Replace:

layers.clouds.frames[]

with:

layers.clouds.profiles[]


⸻

5.2 New structure

interface WeatherMapCloudProfile {
  id: string;

  zoom_min: number;
  zoom_max: number;

  bbox: {
    min_lat: number;
    min_lon: number;
    max_lat: number;
    max_lon: number;
  };

  width: number;
  height: number;

  frames: WeatherMapLayerFrame[];
}


⸻

5.3 Updated clouds layer

interface WeatherMapCloudLayer {
  enabled_by_default: boolean;
  available: boolean;
  opacity: number | null;

  profiles: WeatherMapCloudProfile[];
}


⸻

5.4 Backward compatibility

If:

profiles.length == 1

→ frontend behaves exactly like v1.

⸻

6. Profile Selection (Frontend)

6.1 Selection rule

profile = profiles.find(
  p => zoom >= p.zoom_min && zoom <= p.zoom_max
)


⸻

6.2 Fallback rule

If no exact match:
	•	choose closest matching profile
	•	prefer wider coverage (lower zoom_min)

⸻

6.3 Switching behavior
	•	switch instantly on zoom change
	•	no interpolation required
	•	reuse same frame index

⸻

7. Timeline Consistency (Critical)

All profiles MUST:
	•	have identical frame count
	•	have identical indexes
	•	have identical t_utc
	•	be aligned to same anchor_utc

profiles[i].frames[j].index == global timeline index

Violation of this rule breaks player sync.

⸻

8. Pipeline Changes

8.1 Current v1 behavior

Single pipeline run → one domain → one asset set

⸻

8.2 v1.1 behavior

Pipeline must generate:

N profiles × 121 frames


⸻

8.3 Recommended profiles (MVP)

1. eu_wide
   zoom: 0–4

2. eu_central
   zoom: 5–7

3. local
   zoom: 8+


⸻

8.4 Pipeline extension

For each profile:

for profile in profiles:
  build same timeline
  normalize to profile bbox
  rasterize frames
  publish assets


⸻

8.5 Important constraint

Profiles must NOT:
	•	use different time anchors
	•	use different source mixing policies

Only spatial domain differs.

⸻

9. Render Consistency Rules

Profiles MUST share:
	•	color palette
	•	alpha mapping
	•	smoothing
	•	projection (Web Mercator)
	•	rendering algorithm

This extends Render Policy v1  ￼

⸻

10. Seam Rules (New)

There are now TWO seams:

10.1 Temporal seam (existing)

history ↔ forecast at t = 0h


⸻

10.2 Spatial seam (new)

profile A ↔ profile B at zoom boundary


⸻

10.3 Spatial seam requirements

Switch must NOT:
	•	change palette
	•	change opacity curve
	•	introduce visual discontinuity
	•	change perceived cloud density

Allowed:
	•	resolution change
	•	detail change

⸻

11. Asset Layout

11.1 Directory structure

assets/weather/map/clouds/

  eu_wide/
    cloud_000.webp
    ...

  eu_central/
    cloud_000.webp
    ...

  local/
    cloud_000.webp
    ...


⸻

11.2 Naming remains index-based

cloud_000.webp … cloud_120.webp

Player compatibility preserved.

⸻

12. Performance Considerations

12.1 Backend

Cost increases linearly with number of profiles.

Mitigation:
	•	reuse cached normalized fields
	•	reuse intermediate grid
	•	render per-profile only

⸻

12.2 Frontend
	•	only one profile active at a time
	•	lazy load per profile
	•	drop previous profile cache optionally

⸻

13. Failure Handling

13.1 Profile-level failure

If one profile fails:

profile.available = false

Frontend must fallback to nearest available profile.

⸻

13.2 Frame-level failure

Same as v1:

available = false


⸻

14. Acceptance Criteria

Feature is complete if:
	•	map no longer shows hard domain edge on zoom out
	•	profile switching is seamless
	•	timeline remains synchronized
	•	player behavior unchanged
	•	no frontend stitching logic introduced
	•	no visual inconsistency between profiles
	•	performance remains acceptable

⸻

15. Explicit Non-Goals

v1.1 does NOT introduce:
	•	dynamic viewport-based backend rendering
	•	tile pyramid generation
	•	vector cloud fields
	•	multi-model blending
	•	spatial interpolation between profiles

⸻

16. Migration Strategy

Step 1

Keep current v1 profile as:

local


⸻

Step 2

Add:

eu_wide


⸻

Step 3

Optionally add:

eu_central


⸻

Step 4

Update frontend selector

⸻

17. Summary

v1:
	•	single spatial domain
	•	breaks on zoom out

v1.1:
	•	multiple spatial profiles
	•	same timeline
	•	zoom-aware selection

Architecture remains:

static dataset + shared player

No shift to dynamic backend required.

⸻

18. Key Outcome

This upgrade transforms Map from:

fixed overlay

into:

zoom-aware time-synchronized cloud system

without changing core system design.
