Weather Map Data Contract v1

1. Purpose

This contract defines the minimum backend-facing data shape required by the MVP Map component inside the weather domain.

Its role is to keep implementation constrained and predictable.

The contract must support:
	•	cloud animation across [-48h … +72h]
	•	shared player time
	•	optional isobar overlay
	•	optional wind overlay
	•	current observing location marker

This contract is for MVP only.

It does not attempt to define a generic GIS system.

⸻

2. Scope

The contract covers:
	•	map time coverage
	•	timeline steps
	•	cloud frames
	•	optional pressure frames
	•	optional wind frames
	•	map viewport defaults
	•	observing location marker
	•	source/freshness metadata

The contract does not cover:
	•	spatial scoring
	•	route suggestions
	•	nearby best areas
	•	precipitation layers
	•	humidity layers
	•	light pollution overlays
	•	advanced forecast reasoning

⸻

3. Architectural placement

The component remains inside the weather domain.

Recommended artifact:

sites/staging/data/weather_map_now.json

This keeps naming explicit and avoids mixing it with Helio or Sky.

Suggested pipeline ownership can remain under the existing weather pipeline area.

⸻

4. Main design rule

The frontend must not assemble historical and forecast frames from unrelated sources on its own.

Backend must output one unified timeline contract covering:

-48h ... now ... +72h

That unified structure is the source of truth for the player-driven map.

⸻

5. Top-level schema

export interface WeatherMapNow {
  updated_utc: string;

  source: {
    domain: "weather";
    dataset: "weather_map_now";
    products: string[];
  };

  viewport: WeatherMapViewport;
  location: WeatherMapLocation;
  timeline: WeatherMapTimeline;
  layers: WeatherMapLayers;
  playback: WeatherMapPlayback;
}


⸻

6. Top-level field definitions

6.1. updated_utc

updated_utc: string;

Meaning:
	•	generation timestamp of the full map dataset

Rules:
	•	required
	•	ISO 8601 UTC string

Example:

"updated_utc": "2026-03-10T02:00:00Z"


⸻

6.2. source

interface WeatherMapSource {
  domain: "weather";
  dataset: "weather_map_now";
  products: string[];
}

Meaning:
	•	provenance metadata for the dataset

Rules:
	•	required
	•	domain fixed as weather
	•	dataset fixed as weather_map_now
	•	products lists actual upstream layer sources used

Example:

{
  "domain": "weather",
  "dataset": "weather_map_now",
  "products": [
    "satellite_cloud_history",
    "cloud_forecast_hourly",
    "pressure_isobars_hourly",
    "wind_hourly"
  ]
}


⸻

7. Viewport contract

interface WeatherMapViewport {
  center_lat: number;
  center_lon: number;
  default_zoom: number;
  min_zoom: number | null;
  max_zoom: number | null;
}

Meaning:
	•	initial map framing defaults

Rules:
	•	required
	•	center should normally match selected observing location
	•	zoom values are numeric and renderer-compatible
	•	min_zoom and max_zoom may be null if not constrained in MVP

Example:

{
  "center_lat": 52.2297,
  "center_lon": 21.0122,
  "default_zoom": 6,
  "min_zoom": 4,
  "max_zoom": 9
}


⸻

8. Location contract

interface WeatherMapLocation {
  lat: number;
  lon: number;
  label: string | null;
}

Meaning:
	•	current observing location marker

Rules:
	•	required
	•	label nullable
	•	lat/lon required if payload is valid

Example:

{
  "lat": 52.2297,
  "lon": 21.0122,
  "label": "Warsaw"
}


⸻

9. Timeline contract

interface WeatherMapTimeline {
  step_hours: number;
  current_index: number;
  frames: WeatherMapFrameRef[];
}

Meaning:
	•	shared time axis for all map layers

Rules:
	•	required
	•	step_hours should be 1 for MVP
	•	current_index points to the frame corresponding to current hour
	•	frames is the canonical ordered time list used by the player

⸻

10. Frame reference contract

interface WeatherMapFrameRef {
  index: number;
  t_utc: string;
  phase: "history" | "current" | "forecast";
}

Meaning:
	•	one timeline step

Rules:
	•	required
	•	index must be contiguous and stable
	•	t_utc required
	•	phase must indicate whether the frame belongs to historical satellite, current step, or forecast period

Example:

{
  "index": 48,
  "t_utc": "2026-03-10T02:00:00Z",
  "phase": "current"
}


⸻

11. Timeline rules

The MVP timeline spans:

-48h ... +72h

With 1h step this yields:

121 frames

Recommended indexing:
	•	frame 0 = updated_utc - 48h
	•	frame 48 = current hour
	•	frame 120 = updated_utc + 72h

Rule:
	•	timeline must be continuous
	•	missing frames should be avoided
	•	if some upstream source is missing, backend should still preserve the timeline and mark unavailable layers at frame level

⸻

12. Layers contract

interface WeatherMapLayers {
  clouds: WeatherMapLayer;
  isobars: WeatherMapLayer;
  wind: WeatherMapLayer;
}

Meaning:
	•	layer inventory and per-frame access

Rules:
	•	required top-level object
	•	all three keys must exist
	•	each layer may be enabled/available differently

⸻

13. Generic layer contract

interface WeatherMapLayer {
  enabled_by_default: boolean;
  available: boolean;
  opacity: number | null;
  frames: WeatherMapLayerFrame[];
}

Meaning:
	•	one visual layer across the full unified timeline

Rules:
	•	required object
	•	available indicates whether this layer is usable at all
	•	enabled_by_default controls initial UI state
	•	opacity optional hint for frontend default rendering
	•	frames aligned to the master timeline

⸻

14. Layer-frame contract

interface WeatherMapLayerFrame {
  index: number;
  t_utc: string;
  available: boolean;
  asset_type: "tile" | "image" | "vector";
  asset_url: string | null;
  meta?: Record<string, string | number | boolean | null>;
}

Meaning:
	•	one renderable layer asset for one timeline step

Rules:
	•	index must match a frame in timeline.frames
	•	t_utc must match the corresponding timeline frame
	•	available=false is allowed when source data for that step is missing
	•	asset_url may be null only if available=false
	•	asset_type defines renderer handling

⸻

15. Clouds layer contract

layers.clouds

Purpose:
	•	main animated layer

Rules:
	•	required
	•	available should normally be true for MVP
	•	enabled_by_default = true

Clouds frames may come from:
	•	historical satellite imagery for past range
	•	current cloud frame at t=0
	•	forecast cloud model for future range

Important:
	•	despite mixed origin, frontend sees one continuous layer timeline

Example:

{
  "enabled_by_default": true,
  "available": true,
  "opacity": 0.85,
  "frames": [
    {
      "index": 0,
      "t_utc": "2026-03-08T02:00:00Z",
      "available": true,
      "asset_type": "tile",
      "asset_url": "https://.../clouds/000.png"
    }
  ]
}


⸻

16. Isobars layer contract

layers.isobars

Purpose:
	•	optional pressure overlay

Rules:
	•	required object
	•	may be globally unavailable if upstream source not ready
	•	enabled_by_default = false

Expected asset behavior:
	•	usually vector or transparent raster overlay
	•	must be aligned to same timeline indexes

Example:

{
  "enabled_by_default": false,
  "available": true,
  "opacity": 0.7,
  "frames": [
    {
      "index": 48,
      "t_utc": "2026-03-10T02:00:00Z",
      "available": true,
      "asset_type": "image",
      "asset_url": "https://.../isobars/048.png"
    }
  ]
}


⸻

17. Wind layer contract

layers.wind

Purpose:
	•	optional wind-direction and wind-speed overlay

Rules:
	•	required object
	•	enabled_by_default = false
	•	may use:
	•	vector arrows
	•	rasterized arrows
	•	particle field
	•	MVP recommendation: simple arrows

asset_type may therefore be:
	•	vector
	•	image

Example:

{
  "enabled_by_default": false,
  "available": true,
  "opacity": 0.8,
  "frames": [
    {
      "index": 48,
      "t_utc": "2026-03-10T02:00:00Z",
      "available": true,
      "asset_type": "vector",
      "asset_url": "https://.../wind/048.json"
    }
  ]
}


⸻

18. Playback contract

interface WeatherMapPlayback {
  player_id: string;
  shared: boolean;
  supported_actions: Array<"play" | "pause" | "step_back" | "step_forward" | "scrub">;
  recommended_fps: number | null;
}

Meaning:
	•	playback integration metadata

Rules:
	•	required
	•	shared=true for MVP, because player is shared with Sky
	•	player_id should match the global player namespace used by the UI system
	•	supported_actions enumerates the controls the map expects
	•	recommended_fps is advisory only

Example:

{
  "player_id": "global_time_player",
  "shared": true,
  "supported_actions": ["play", "pause", "step_back", "step_forward", "scrub"],
  "recommended_fps": 1
}


⸻

19. Alignment rules across layers

This is critical.

All layer frame arrays must align to the master timeline by:
	•	identical index
	•	identical t_utc

Frontend must be able to do:

show clouds.frames[i]
show isobars.frames[i]
show wind.frames[i]

without guessing time alignment.

This is more important than the exact asset format.

⸻

20. Missing-frame behavior

A layer may be missing a specific step.

In that case:

{
  "index": 77,
  "t_utc": "2026-03-11T07:00:00Z",
  "available": false,
  "asset_type": "image",
  "asset_url": null
}

Rules:
	•	timeline frame must still exist
	•	layer frame entry must still exist
	•	frontend should simply skip rendering that layer for that time step

This prevents array desynchronization.

⸻

21. Asset format guidance

The spec should remain format-neutral, but MVP-friendly guidance is:

Clouds

Prefer:
	•	pre-rendered tiles or transparent rasters

Reason:
	•	simplest for animation and reliable rendering

Isobars

Prefer:
	•	transparent raster overlay first
	•	vector later if needed

Wind

Prefer:
	•	simple vector JSON or raster arrow overlay

Reason:
	•	particles are visually nice but not required for MVP

⸻

22. Freshness and consistency rules

Because the map combines past and future products, backend should guarantee internal consistency.

Rules:
	•	updated_utc must represent one coherent generation pass
	•	all frame references must be generated against that same anchor hour
	•	historical and forecast segments must meet at the same current time boundary

This avoids timeline jumps.

⸻

23. Required vs optional fields

23.1. Always required

Top-level:
	•	updated_utc
	•	source
	•	viewport
	•	location
	•	timeline
	•	layers
	•	playback

Layer objects:
	•	clouds
	•	isobars
	•	wind

Timeline:
	•	step_hours
	•	current_index
	•	frames

23.2. Nullable fields

May be null:
	•	viewport.min_zoom
	•	viewport.max_zoom
	•	location.label
	•	layer.opacity
	•	layerFrame.asset_url
	•	playback.recommended_fps

23.3. Arrays that may be empty only in degraded cases
	•	timeline.frames
	•	layer.frames

But for a valid working MVP payload they should be populated consistently.

⸻

24. Ordering rules

timeline.frames

Must be:
	•	sorted ascending by index
	•	contiguous

each layer.frames

Must be:
	•	sorted ascending by index
	•	aligned with timeline

This allows simple indexed playback.

⸻

25. Minimum valid payload behavior

A minimally valid operational payload should still allow map rendering with:
	•	full timeline
	•	clouds available
	•	isobars unavailable
	•	wind unavailable

That would still satisfy MVP.

Therefore:
	•	clouds are the essential layer
	•	isobars and wind are important but optional per-step/per-source

⸻

26. Example final payload

{
  "updated_utc": "2026-03-10T02:00:00Z",
  "source": {
    "domain": "weather",
    "dataset": "weather_map_now",
    "products": [
      "satellite_cloud_history",
      "cloud_forecast_hourly",
      "pressure_isobars_hourly",
      "wind_hourly"
    ]
  },
  "viewport": {
    "center_lat": 52.2297,
    "center_lon": 21.0122,
    "default_zoom": 6,
    "min_zoom": 4,
    "max_zoom": 9
  },
  "location": {
    "lat": 52.2297,
    "lon": 21.0122,
    "label": "Warsaw"
  },
  "timeline": {
    "step_hours": 1,
    "current_index": 48,
    "frames": [
      { "index": 0, "t_utc": "2026-03-08T02:00:00Z", "phase": "history" },
      { "index": 48, "t_utc": "2026-03-10T02:00:00Z", "phase": "current" },
      { "index": 120, "t_utc": "2026-03-13T02:00:00Z", "phase": "forecast" }
    ]
  },
  "layers": {
    "clouds": {
      "enabled_by_default": true,
      "available": true,
      "opacity": 0.85,
      "frames": [
        {
          "index": 48,
          "t_utc": "2026-03-10T02:00:00Z",
          "available": true,
          "asset_type": "tile",
          "asset_url": "https://example.com/clouds/048.png"
        }
      ]
    },
    "isobars": {
      "enabled_by_default": false,
      "available": true,
      "opacity": 0.7,
      "frames": [
        {
          "index": 48,
          "t_utc": "2026-03-10T02:00:00Z",
          "available": true,
          "asset_type": "image",
          "asset_url": "https://example.com/isobars/048.png"
        }
      ]
    },
    "wind": {
      "enabled_by_default": false,
      "available": true,
      "opacity": 0.8,
      "frames": [
        {
          "index": 48,
          "t_utc": "2026-03-10T02:00:00Z",
          "available": true,
          "asset_type": "vector",
          "asset_url": "https://example.com/wind/048.json"
        }
      ]
    }
  },
  "playback": {
    "player_id": "global_time_player",
    "shared": true,
    "supported_actions": ["play", "pause", "step_back", "step_forward", "scrub"],
    "recommended_fps": 1
  }
}


⸻

27. MVP acceptance criteria

The contract is acceptable for MVP when:
	1.	one unified timeline covers -48h … +72h
	2.	clouds animate across the whole timeline
	3.	map can be driven by the shared player
	4.	isobars can be toggled when available
	5.	wind can be toggled when available
	6.	current location marker can always be shown
	7.	layer alignment does not require frontend guesswork

⸻

28. Recommended next spec block

The next logical block is:

Weather Map UI Composition v1

That would pin down:
	•	header
	•	layer toggles
	•	player integration
	•	viewport behavior
	•	loading state
	•	unavailable-layer behavior
	•	how map and controls are arranged visually