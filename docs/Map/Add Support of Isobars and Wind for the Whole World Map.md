Add Support of Isobars and Wind for the Whole World Map

Title

Add support of isobars and wind for the whole world map

Purpose

Extend the map system to display global isobars and global wind over the full world map, so the user can inspect conditions anywhere on Earth instead of being limited to one regional weather box.

Background

A Europe-only or region-limited weather overlay is not sufficient for a global observing product.
If the user can choose any location on Earth, pressure and wind visualization must also work globally.

Cloud tiles solve one part of the problem. This task addresses the next layer:
	•	pressure field / isobars
	•	wind field / speed + direction
	•	full-world rendering

Goals
	•	Render isobars on a global map
	•	Render wind on a global map
	•	Support pan/zoom worldwide
	•	Keep map readable and performant
	•	Integrate with the same time player as cloud overlays
	•	Make this a reusable capability of the Map widget, not a staging-only hack

Non-Goals
	•	No rewrite of the entire map widget
	•	No requirement to animate every meteorological parameter at once
	•	No advanced meteorological analysis UI in this task
	•	No requirement to expose all raw model grids directly to the frontend

Functional Requirements

1. Global Isobar Support

The map must display pressure isolines worldwide:
	•	across the full longitude range
	•	across both hemispheres
	•	without artificial regional clipping
	•	stable across antimeridian crossing

Isobars must remain visually readable at global and regional zoom levels.

2. Global Wind Support

The map must display wind globally:
	•	direction
	•	relative strength
	•	support for the same time steps as the weather timeline where possible

Wind rendering may be implemented as:
	•	particles
	•	streamlines
	•	vectors/barbs
	•	another performant global representation

Exact visual method is implementation-defined, but it must be readable and performant.

3. Time Synchronization

Both global isobars and wind must support:
	•	playback by timestamp
	•	forward/backward time steps
	•	consistency with cloud overlay timestamps where feasible
	•	graceful behavior when one layer has fewer valid steps than another

4. Layer Controls

The UI must allow toggling independently:
	•	clouds
	•	isobars
	•	wind

Optional:
	•	opacity or intensity controls
	•	wind style mode
	•	pressure label density

5. Global Map Compatibility

The rendering must work with:
	•	full-world view
	•	zoom into any continent
	•	panning across date line
	•	north/south high latitudes within projection limits

Data Model Requirements

Pressure Data

Backend must provide or derive pressure field suitable for contour generation across the whole globe.

Accepted implementation paths:
	1.	pre-rendered vector/raster tiles of isobars
	2.	pre-generated contour GeoJSON/vector tiles
	3.	client-side contour generation from preprocessed global grid
	4.	hybrid approach

Preferred approach should minimize frontend CPU load.

Wind Data

Backend must provide or derive global wind field with at least:
	•	u/v components or equivalent
	•	timestamped grids
	•	sufficient spatial resolution for visually meaningful global display

Accepted implementation paths:
	1.	pre-tiled wind textures / flow fields
	2.	vector tiles
	3.	client-side particle advection from preprocessed grids
	4.	hybrid approach

Recommended Architecture

Layer Split

Treat this as three separate map overlays:
	•	cloud tiles
	•	isobars
	•	wind

They may share:
	•	time controller
	•	data manifest
	•	map instance

They must not be hard-coupled into one monolithic weather renderer.

Backend / Frontend Separation

Backend responsibilities:
	•	fetch or normalize global meteorological source data
	•	generate global-ready assets or preprocess fields
	•	emit manifests and timestamps

Frontend responsibilities:
	•	request the correct layer assets
	•	render layers efficiently
	•	sync them to player and map state
	•	handle toggles and fallbacks

Rendering Strategy Options

Option A — Pre-rendered Tiles

Best for isobars if contour styling is mostly fixed.
Pros:
	•	cheap in browser
	•	predictable performance
Cons:
	•	less flexible styling
	•	more storage

Option B — Vector / GeoJSON / Vector Tiles

Best for isobars if labels/styling may evolve.
Pros:
	•	scalable and crisp
	•	flexible
Cons:
	•	more implementation complexity

Option C — Client-side Wind Particles

Best for visually strong wind layer.
Pros:
	•	expressive, animated
Cons:
	•	heavier in browser
	•	needs careful tuning

Recommended Direction
	•	Isobars: pre-generated vector or tiled contour assets
	•	Wind: dedicated global wind renderer using preprocessed global fields

This keeps pressure readable and wind dynamic without overloading one pipeline.

Projection / Geographic Concerns

Special handling is required for:
	•	antimeridian wrap
	•	pole-adjacent behavior
	•	global bounding boxes
	•	continuity of contours across longitude seams

The implementation must explicitly avoid Europe-centric assumptions in coordinates, bounds, asset generation, and camera defaults.

Performance Requirements
	•	global layers must not freeze the UI
	•	no eager loading of the entire planet at max detail
	•	resolution/detail may vary by zoom
	•	playback must remain usable on ordinary desktop browsers
	•	memory must be released or reused across time changes

UX Requirements

At world zoom:
	•	wind must remain interpretable, not noisy
	•	isobars must remain sparse enough to read

At regional zoom:
	•	more detail may be shown
	•	labels and local structure may become denser

The map must not turn into an unreadable dense meteorological wallpaper.

Acceptance Criteria

This feature is complete when:
	•	the user can open the world map
	•	turn on isobars
	•	turn on wind
	•	pan to any region on Earth
	•	see meaningful global pressure and wind rendering
	•	step through time without breaking the layer system

Additionally:
	•	antimeridian behavior is acceptable
	•	performance remains usable
	•	layers can be toggled independently
	•	no region-specific hardcoded extent remains in rendering logic

Risks
	•	global data volume
	•	frontend performance with animated wind
	•	contour seams and wrap artifacts
	•	time-step mismatch between layer sources
	•	excessive visual clutter at world zoom
	•	implementation drift into one-off staging hacks

Assumptions
	•	cloud tiles v1.3 is already in place or close enough to reuse its time/layer architecture
	•	map widget already supports multiple overlays
	•	global meteorological source data is available or can be normalized into a stable preprocessing pipeline
