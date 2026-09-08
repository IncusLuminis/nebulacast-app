
Spec 1 — External Global Tile Fallback

# Weather Map — External Global Cloud Tile Fallback
## Enhancement Spec v1.2 / Path 1

---

## 1. Purpose

This spec introduces a pragmatic global cloud coverage solution for low zoom levels by using an external weather tile provider.

Goal:
- eliminate visible cloud-domain cutoff when zooming out
- preserve the current regional raster system
- deliver fast product value with minimal backend work
- avoid immediate implementation of a full internal global tile pipeline

This is an additive enhancement over:
- Map v1
- Map v1.1 zoom-aware cloud profiles

It does not replace the existing regional raster cloud layer.

---

## 2. Design Principle

The cloud system becomes hybrid:

- **global / low zoom** → external tile-based cloud layer
- **regional / high zoom** → internal raster cloud layer

This must be treated as an explicit hybrid architecture, not as one hidden uniform source.

---

## 3. Non-Breaking Rule

Path 1 MUST NOT:
- change the global player model
- change the master timeline
- remove or degrade the current raster profiles
- require frontend-side timeline stitching
- pretend that external tiles and internal raster frames are the same source

The existing regional raster path remains valid and unchanged.

---

## 4. Scope

### In scope
- low-zoom external cloud tile profile
- profile switching by zoom
- clear source transparency in metadata
- integration into existing weather map cloud layer selection

### Out of scope
- internal tile rendering pipeline
- GRIB ingestion
- ownership of global low-zoom cloud visualization
- custom rendering style for low-zoom global coverage

---

## 5. Core Architecture

```text
shared timeline + shared player
        ↓
cloud profile selector
        ↓
if low zoom → external tile profile
if high zoom and supported region → internal raster profile
else → external tile profile


⸻

6. Cloud Profile Types

This enhancement formalizes two delivery modes.

6.1 External tile profile

Used for:
	•	world / continental overview
	•	low zoom
	•	universal fallback

6.2 Internal raster profile

Used for:
	•	supported regions
	•	medium/high zoom
	•	custom render style

⸻

7. Profile Model

Each cloud profile must declare:

interface CloudProfile {
  id: string;
  kind: "external_tiles" | "internal_raster";
  zoom_min: number;
  zoom_max: number;
  available: boolean;
  source_name: string;
  source_owned: boolean;
}

Required semantics

For external low-zoom profile:
	•	kind = "external_tiles"
	•	source_owned = false

For internal regional profile:
	•	kind = "internal_raster"
	•	source_owned = true

⸻

8. Recommended Initial Profiles

8.1 Global fallback profile

id: world_external
kind: external_tiles
zoom: 0–5

Purpose:
	•	remove hard cutoff on zoom out
	•	provide universal fallback everywhere

8.2 Existing regional profile

id: europe_raster
kind: internal_raster
zoom: 6+

Purpose:
	•	preserve current high-quality regional cloud rendering

Additional raster profiles may be added later:
	•	usa_raster
	•	new_england_raster
	•	great_lakes_raster

⸻

9. Selection Policy

Frontend selects cloud profile using:
	1.	current zoom
	2.	current viewport or supported region coverage
	3.	profile priority

Recommended rule

if zoom <= external_profile.zoom_max:
    use external profile

else:
    if current viewport intersects supported raster profile:
        use raster profile
    else:
        use external profile


⸻

10. Time Model

Important rule

Time and space remain independent.

time → controlled by global player
space → controlled by zoom/profile selection

Implication

External global profile may have different time semantics from internal hourly frames.

Therefore Path 1 must support one of two modes:

Mode A — static latest cloud tiles
Acceptable for first implementation

Mode B — provider time parameter if available
Preferred if provider supports time-addressable cloud tiles

The frontend must still remain under shared player architecture, but the external layer may degrade to “latest available snapshot” if true timeline alignment is not possible.

This degradation must be explicit.

⸻

11. Source Transparency

The system MUST NOT hide the fact that low-zoom cloud coverage is external.

Each cloud profile should expose metadata such as:

meta: {
  source_kind: "external_tiles" | "internal_raster";
  source_name: string;
  timeline_mode: "live_latest" | "time_addressable";
  styling_mode: "provider_native" | "internal_style";
}

This is primarily for diagnostics and QA.

⸻

12. Rendering Model

External profile

Frontend uses provider tile URL pattern, e.g.:

/{z}/{x}/{y}.png

or provider-specific equivalent.

Internal raster profile

Frontend uses current pre-rendered internal frame overlays.

⸻

13. Visual Consistency Expectation

Perfect visual consistency is NOT required in Path 1.

Expected:
	•	low zoom may visually differ from internal raster style
	•	transition should still be operationally acceptable

Required:
	•	no broken map
	•	no hard empty domain edges
	•	no ambiguity about active layer source

⸻

14. Frontend Integration

Frontend must support both cloud delivery modes.

For external tile profile
	•	attach provider tile layer
	•	update time parameter if supported
	•	otherwise use latest available

For internal raster profile
	•	render current frame overlay by player index

Frontend must not
	•	merge external tiles with raster in one composite cloud layer
	•	invent missing time alignment
	•	resample or restyle provider tiles

⸻

15. Data Contract Extension

Cloud layer contract must allow profile-specific delivery mode.

Recommended extension:

interface WeatherMapCloudProfile {
  id: string;
  kind: "external_tiles" | "internal_raster";
  zoom_min: number;
  zoom_max: number;
  bbox?: {
    min_lat: number;
    min_lon: number;
    max_lat: number;
    max_lon: number;
  } | null;
  tile_url_template?: string | null;
  frames?: WeatherMapLayerFrame[] | null;
  available: boolean;
  meta?: Record<string, string | number | boolean | null>;
}

Rules
	•	external tile profile uses tile_url_template
	•	internal raster profile uses frames
	•	profile kind determines rendering logic

⸻

16. Failure Handling

External provider unavailable

Fallback options:
	1.	keep internal raster if available
	2.	hide global cloud coverage
	3.	preserve map usability

Raster profile unavailable

Fallback to external tiles even at higher zoom.

This is one of the biggest advantages of Path 1.

⸻

17. Operational Notes

This path minimizes backend work because:
	•	no global tile generation
	•	no GRIB parsing
	•	no R2 tile storage
	•	no global tile upload pipeline

Backend continues generating only internal raster assets.

Frontend carries the new complexity.

⸻

18. Risks

Product risks
	•	visual inconsistency between low zoom and high zoom
	•	dependence on third-party service
	•	API limits / licensing / availability
	•	weaker control of styling
	•	possible mismatch with shared player time semantics

Engineering risks
	•	profile switching artifacts
	•	provider-specific implementation quirks
	•	future migration cost to owned tile pipeline

⸻

19. Acceptance Criteria

Path 1 is complete when:
	1.	zooming out no longer reveals empty cloud domain
	2.	low zoom uses global external tile coverage
	3.	high zoom preserves current raster cloud profiles
	4.	switching between profiles works reliably
	5.	map remains usable when raster profile is absent
	6.	player architecture remains intact
	7.	source transparency is preserved in metadata and diagnostics

⸻

20. Summary

Path 1 is the fastest practical enhancement.

It provides:
	•	immediate global fallback
	•	preservation of current internal raster work
	•	minimal backend changes

It is explicitly a transitional hybrid architecture, not the final owned cloud delivery system.

---