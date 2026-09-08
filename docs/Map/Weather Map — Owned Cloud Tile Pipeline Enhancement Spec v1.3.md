# Spec 2 — Owned GRIB Tile Pipeline

# Weather Map — Owned Global/Continental Cloud Tile Pipeline
## Enhancement Spec v1.3 / Path 2

---

## 1. Purpose

This spec defines the target architecture for owned low-zoom global and continental cloud coverage using forecast raster data and internally generated map tiles.

Goal:
- replace external low-zoom cloud dependency
- provide scalable global/continental coverage
- preserve the shared player / timeline architecture
- keep regional internal raster profiles for high-detail supported regions

This is the long-term cloud delivery model for the weather map.

---

## 2. Design Principle

The cloud system becomes a controlled hybrid:

- **global / continental / low zoom** → internally generated tile pyramid
- **regional / high zoom** → internally generated raster overlays

Both are owned by the same weather map system.

---

## 3. Non-Breaking Rule

Path 2 MUST NOT:
- change the existing shared player architecture
- change the master timeline model
- break current internal raster profiles
- move weather map ownership into sky
- require frontend to perform meteorological interpolation

This enhancement extends delivery architecture, not the logical time model.

---

## 4. Scope

### In scope
- ingestion of gridded cloud forecast data
- low-zoom tile generation
- global or continental cloud coverage
- storage and delivery of generated tiles
- coexistence with regional raster profiles

### Out of scope
- dynamic on-demand tile rendering
- per-user raster generation
- global high-zoom detailed tiles everywhere
- blending multiple forecast models in v1.2
- full meteorological assimilation

---

## 5. Core Architecture

```text
forecast grid data (GRIB)
→ extract cloud field
→ normalize
→ render tile pyramid for low zoom
→ publish to object storage/CDN
→ frontend selects tile profile by zoom

regional profile pipeline (existing)
→ render raster overlays
→ frontend uses raster for supported high-zoom regions


⸻

6. Canonical Delivery Model

Cloud delivery supports two internal owned profile kinds:

6.1 Tile pyramid profile

Used for:
	•	world / continental coverage
	•	low to medium zoom
	•	scalable cloud delivery

6.2 Raster frame profile

Used for:
	•	supported regions
	•	high-detail rendering
	•	premium visual quality

⸻

7. Source Model

Preferred input source class

forecast_model_grid

Required properties
	•	gridded forecast field
	•	global or continental coverage
	•	predictable update cadence
	•	direct cloud variable available
	•	suitable for raster extraction without point interpolation

Canonical variable
	•	total_cloud_cover
	•	normalized to 0..100

⸻

8. Timeline Model

Core rule

The master timeline remains unchanged:

[-48h … +72h]
step = 1 hour
121 frames

Path 2 practical delivery note

For global tile generation, initial implementation may restrict published tile frames to forecast-only or a reduced horizon if needed.

However, the long-term target remains full alignment with the master weather map timeline.

Strong requirement

Each generated tile frame must correspond to a canonical frame index.

⸻

9. Profile Model

Recommended structure:

interface WeatherMapCloudProfile {
  id: string;
  kind: "internal_tiles" | "internal_raster";
  zoom_min: number;
  zoom_max: number;
  available: boolean;
  source_name: string;
  source_owned: true;
  bbox?: {
    min_lat: number;
    min_lon: number;
    max_lat: number;
    max_lon: number;
  } | null;
  tile_manifest_url?: string | null;
  frames?: WeatherMapLayerFrame[] | null;
}


⸻

10. Recommended Initial Profiles

10.1 World tile profile

id: world_tiles
kind: internal_tiles
zoom: 0–4

10.2 Continental tile profile (optional first extension)

id: europe_tiles
kind: internal_tiles
zoom: 5–6

10.3 Existing raster profile

id: europe_raster
kind: internal_raster
zoom: 7+

Later possible:
	•	usa_raster
	•	new_england_raster
	•	great_lakes_raster

⸻

11. Tile Pyramid Scope Policy

This spec does NOT require “full world at all zoom levels”.

Recommended policy
	•	zoom 0–4 → world
	•	zoom 5–6 → selected continents/regions only
	•	zoom 7+ → regional raster profiles

This is critical for keeping generation and storage cost manageable.

⸻

12. Tile Generation Pipeline

High-level flow

download forecast grid
→ extract cloud field
→ normalize to canonical cloud opacity
→ reproject to Web Mercator
→ render RGBA cloud layer
→ slice to z/x/y tiles
→ encode as WebP
→ upload to object storage
→ publish manifest

Pipeline responsibilities
	•	run-level anchor consistency
	•	profile-level tile coverage generation
	•	stable naming
	•	versioned output per forecast run
	•	cleanup of old runs

Pipeline must not
	•	depend on per-user viewport
	•	generate tiles on-demand in frontend
	•	infer missing cloud fields from point APIs at world scale

⸻

13. Tile Storage Model

Recommended path structure:

/clouds/{run_id}/{frame_index}/{z}/{x}/{y}.webp

Example:

/clouds/20260321T0000Z/048/3/4/2.webp

Required semantics
	•	run_id identifies forecast run
	•	frame_index maps to shared timeline frame
	•	{z}/{x}/{y} follow standard tile indexing

⸻

14. Manifest Model

Each tile profile should publish manifest metadata:

interface TileProfileManifest {
  profile_id: string;
  run_id: string;
  zoom_min: number;
  zoom_max: number;
  frame_indexes: number[];
  url_template: string;
  generated_at: string;
  source_name: string;
}

Frontend uses this manifest to resolve active tile paths.

⸻

15. Rendering Policy

Visual goals
	•	same cloud semantics as raster profiles
	•	acceptable stylistic consistency
	•	scalable delivery

Shared rules with raster
	•	same cloud variable meaning
	•	same opacity philosophy
	•	same projection family
	•	no false color weather-map semantics

Allowed differences
	•	tile layer may be visually simpler than regional raster
	•	low zoom prioritizes structure and coverage over beauty

⸻

16. Frontend Integration

Frontend must support profile selection by:
	•	current zoom
	•	region support
	•	active profile availability

Selection rule

if zoom in tile profile range:
    use internal tile profile
else:
    if supported raster region exists:
        use raster profile
    else:
        fallback to nearest available tile profile

Frontend must not
	•	stitch raw meteorological grids
	•	synthesize tiles
	•	recompute cloud interpolation

⸻

17. Failure Handling

Tile profile failure

If tile generation fails for a run:
	•	keep previous valid run if allowed
	•	otherwise mark tile profile unavailable
	•	raster profiles continue to work

Raster profile failure

Fallback to tile profile.

Frame-level failure

Missing tile frame must not break map.
Map should either:
	•	skip cloud rendering for that frame
	•	or fall back to last valid tile run if explicitly supported

⸻

18. Operational Model

Build cadence

Recommended:
	•	aligned to forecast model runs
	•	initial target cadence: every 6 hours

Execution environment
	•	offline pipeline
	•	CI/CD or scheduled job
	•	object storage upload after generation

Delivery
	•	tiles served from object storage + CDN
	•	frontend uses stable URL template

⸻

19. Storage and Retention

Recommended retention policy:
	•	keep current run
	•	keep previous run
	•	optionally keep one older fallback run for rollback/debug

Do not accumulate unlimited historical tile runs unless explicitly needed.

⸻

20. Performance Strategy

Backend

Control cost by limiting:
	•	frame count
	•	zoom bands
	•	spatial coverage for higher zooms

Frontend

Use:
	•	lazy loading
	•	native tile caching
	•	current frame only
	•	optional prefetch of nearby time frames

⸻

21. Risks

Engineering risks
	•	GRIB parsing complexity
	•	tile generation time
	•	object storage versioning
	•	run switching logic
	•	tile cache invalidation

Product risks
	•	low-zoom layer may still look visually simpler than raster
	•	temporal granularity may initially lag behind ideal hourly full-range coverage
	•	operational complexity becomes higher than Path 1

⸻

22. Acceptance Criteria

Path 2 is complete when:
	1.	low zoom global coverage no longer depends on external tile providers
	2.	cloud tiles are generated from owned forecast grid data
	3.	frontend can render tile profiles by zoom without custom meteorological logic
	4.	supported regions can still switch to raster profiles at higher zoom
	5.	tile profile generation is operationally stable
	6.	the system remains aligned to the shared player/timeline architecture
	7.	object storage delivery works reliably in production

⸻

23. Summary

Path 2 is the target architecture.

It provides:
	•	owned low-zoom global cloud delivery
	•	scalable weather map coverage
	•	compatibility with existing regional raster work
	•	long-term extensibility for other layers such as pressure and wind

It is more complex than Path 1, but it is the correct durable solution if the weather map is intended to become a real platform capability.
