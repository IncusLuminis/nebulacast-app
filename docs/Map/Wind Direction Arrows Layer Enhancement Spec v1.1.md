# Weather Map — Wind Direction Arrows Layer  
## Enhancement Spec v1.1

---

## 1. Purpose

This spec introduces a new optional map layer:

**wind direction arrows**

Goal:
- show wind direction and basic flow structure
- provide practical weather context around the observing location
- preserve the existing Map architecture: shared timeline, shared player, additive optional layers

This is an additive enhancement over Map v1 / v1.1. The current data contract already reserves `layers.wind` as an optional map layer; this document defines the semantics, rendering model, and implementation rules for that layer.  [oai_citation:8‡Weather Map Data Contract v1.md](sediment://file_00000000993c720abc292795d3e717f1)

---

## 2. Non-breaking Rule

This layer MUST NOT:
- change the timeline model
- change player controls
- change cloud layer semantics
- require wind to exist for the map to work
- require frontend-side wind computation

Default behavior remains:
- `enabled_by_default = false`

Map must still work with:
- clouds only
- clouds + isobars
- clouds + wind
- clouds + isobars + wind

---

## 3. Layer Role

Wind arrows are a **context and motion-interpretation layer**.

They are intended to:
- show local and regional wind direction
- help interpret cloud motion and weather structure
- provide a quick, intuitive reading of flow direction

They are not intended to:
- replace the cloud layer
- provide full fluid-dynamics visualization
- provide turbulence/seeing estimation
- act as a particle animation system in v1.1

The Map overview already positions wind as an optional additional layer, visually useful but potentially cluttering, so it should remain off by default.  [oai_citation:9‡Map Overview v1.md](sediment://file_0000000091ac720a9b064d3bcff4655c)

---

## 4. Temporal Model

Wind arrows MUST follow the same master timeline as the rest of the map.

### Timeline rules
- range: `[-48h … +72h]`
- step: `1 hour`
- frame count: `121`
- current index: `48`

### Alignment rule

Each wind frame MUST align exactly to:
- `timeline.frames[index].index`
- `timeline.frames[index].t_utc`

Frontend must be able to do:

```text
render wind.frames[current_index]

without any additional time conversion or interpolation logic.

This is consistent with the global player model and the layer-alignment rule in the map contract.  ￼  ￼

⸻

5. Source Model

Allowed source class

forecast_model

Required source semantics

The source must provide wind information that can be converted into:
	•	direction
	•	optionally speed magnitude

Typical acceptable inputs:
	•	u/v wind components
	•	wind direction + wind speed fields
	•	gridded hourly wind forecast

Source strategy

Use one stable hourly forecast family for the run.

Do not:
	•	switch providers per frame
	•	mix multiple incompatible wind definitions
	•	compute wind from unrelated products on the frontend

⸻

6. Canonical Wind Model

Internal normalized wind frame should be conceptually representable as:

interface CanonicalWindFrame {
  index: number;
  t_utc: string;
  available: boolean;
  vectors: Array<{
    lat: number;
    lon: number;
    dir_deg: number;
    speed_ms?: number | null;
  }>;
}

This canonical structure is internal.
Frontend does not need raw grids if render-ready assets are produced.

Minimum required semantic
	•	arrow direction is required

Optional semantic
	•	speed may influence arrow size or style
	•	speed may be stored in metadata

⸻

7. Data Contract

This layer fills the existing layers.wind block in weather_map_now.json.  ￼

Layer structure

interface WeatherMapLayer {
  enabled_by_default: boolean;
  available: boolean;
  opacity: number | null;
  frames: WeatherMapLayerFrame[];
}

Frame structure

interface WeatherMapLayerFrame {
  index: number;
  t_utc: string;
  available: boolean;
  asset_type: "tile" | "image" | "vector";
  asset_url: string | null;
  meta?: Record<string, string | number | boolean | null>;
}

Recommended asset_type

Preferred for v1.1:
	•	"vector"

Allowed fallback:
	•	"image"

Why vector first

Wind arrows are naturally sparse symbolic objects.
Vector assets are preferable because:
	•	they remain crisp on zoom
	•	they are lighter than full raster overlays
	•	they allow simple arrow rendering without heavy animation logic

⸻

8. Visual Design

Rendering mode

Preferred v1.1:
	•	sparse vector arrow field

Visual goals
	•	instantly readable direction
	•	low visual clutter
	•	compatible with clouds and isobars
	•	stable during frame switching

Arrow style
	•	simple directional arrows
	•	moderate density
	•	consistent size policy
	•	subdued but readable color

Recommended appearance
	•	light cyan / pale blue / muted white
	•	medium opacity
	•	thin stroke
	•	no glow-heavy cockpit styling in the operational weather map

Forbidden
	•	particle flow fields in v1.1
	•	dense barbs everywhere
	•	full-screen animated streamlines
	•	oversized arrows covering the map
	•	per-arrow text labels by default

⸻

9. Density Policy

Wind arrows MUST be decimated to a readable density.

Recommended rule

Render wind arrows on a coarser sampling grid than the underlying forecast grid.

Example:
	•	source grid may be dense
	•	displayed arrows every Nth point only

Reason

Raw wind fields are usually too dense for direct display.

Goal

The user should see:
	•	regional flow structure
	•	approximate local direction

not a wall of arrows.

⸻

10. Speed Encoding Policy

Minimum v1.1
	•	direction only

Optional v1.1 enhancement

Use speed to slightly vary:
	•	arrow length
or
	•	arrow opacity

But only subtly.

Forbidden in v1.1
	•	Beaufort icons
	•	complex wind barbs classification
	•	color heatmap mixed into arrows
	•	animated particle speed effects

⸻

11. Spatial Model

Wind overlays MUST match the active map spatial basis.

If Map v1.1 uses cloud profiles by zoom, wind should eventually support the same profile strategy:
	•	eu_wide
	•	eu_central
	•	local

At minimum:
	•	same bbox family as active cloud layer
	•	same projection family
	•	same timeline index

This preserves the architectural rule:

time → player
space → active map profile


⸻

12. Asset Layout

Recommended path:

assets/weather/map/wind/

If profile-based:

assets/weather/map/wind/eu_wide/
assets/weather/map/wind/eu_central/
assets/weather/map/wind/local/

Naming

For vector assets:

wind_000.json
...
wind_120.json

If raster fallback is used:

wind_000.webp
...
wind_120.webp

Index naming must remain stable for player alignment.

⸻

13. Metadata

Recommended frame-level metadata:

meta: {
  source_name: string;
  wind_unit: "m/s";
  density_mode: "decimated_grid";
  vector_count?: number;
}

Recommended defaults:
	•	enabled_by_default = false
	•	opacity = 0.80

⸻

14. Pipeline Responsibilities

Add a wind-layer branch under weather map generation.

High-level flow

fetch hourly wind field
→ align to master timeline
→ normalize to active spatial basis
→ decimate sampling grid
→ build vector arrows
→ publish assets
→ fill layers.wind.frames[]

Pipeline must handle
	•	same anchor_utc as map
	•	same frame index model
	•	same profile family if zoom-aware map is used
	•	consistent direction semantics

Pipeline must not
	•	ask frontend to derive wind from clouds
	•	introduce a separate timeline
	•	switch providers silently mid-run

⸻

15. Frontend Rendering Rules

Frontend responsibility should remain simple:

For vector assets
	•	load current frame JSON
	•	draw arrows on current map projection
	•	clear and redraw on frame change

For image fallback
	•	treat as transparent overlay like other layers

Frontend must not:
	•	reconstruct wind field from raw meteorological grids
	•	interpolate between arbitrary time steps
	•	infer missing time alignment

⸻

16. Performance Strategy

Backend
	•	decimate vector count aggressively
	•	cache by anchor_utc + profile + frame_index + render_version

Frontend
	•	lazy load wind frames
	•	render only when wind layer is enabled
	•	optionally prefetch nearby frames

Because wind is optional, it must not slow the core map experience when disabled.

⸻

17. Failure Handling

Layer-level failure

If upstream wind data is unavailable:

{
  "enabled_by_default": false,
  "available": false,
  "opacity": 0.80,
  "frames": []
}

or aligned unavailable frames if required by contract.

Frame-level failure

{
  "index": 54,
  "t_utc": "...",
  "available": false,
  "asset_type": "vector",
  "asset_url": null
}

Timeline remains intact.
Playback continues normally.

⸻

18. Acceptance Criteria

The wind arrows layer is complete when:
	1.	it can be toggled independently
	2.	it aligns exactly to the master timeline
	3.	it is readable over clouds and base map
	4.	arrow density does not overload the view
	5.	missing wind frames do not break playback
	6.	player behavior remains unchanged
	7.	frontend does not perform meteorological reconstruction logic

⸻

19. Explicit Non-Goals

This enhancement does NOT introduce:
	•	streamlines
	•	particles
	•	animated wind flow
	•	turbulence or gust visualization
	•	seeing estimation
	•	wind scoring for observing suitability
	•	complex aviation/marine wind notation

⸻

20. Summary

This layer adds directional wind context to the weather map.

It is:
	•	optional
	•	timeline-aligned
	•	weather-owned
	•	lightweight
	•	non-breaking to the existing player/cloud architecture

Its primary purpose is clarity, not atmospheric simulation complexity.
