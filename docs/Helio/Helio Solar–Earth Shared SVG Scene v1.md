Helio Solar–Earth Shared SVG Scene

Specification v1.0

1. Purpose

Create a single reusable SVG scene component for Helio sections that visualize the Sun–Earth system.

This component will be used by:
	•	Magnetosphere
	•	Coronal Hole
	•	CME Cone

The goal is to avoid redrawing nearly identical SVG layouts multiple times and instead use:
	•	one shared base scene
	•	multiple optional overlay layers
	•	per-section configuration

Benefits:
	•	less duplicated code
	•	lower maintenance cost
	•	consistent visual composition
	•	easier future tuning of proportions and styling

⸻

2. Scope

This spec defines:
	•	base SVG composition
	•	shared geometry
	•	optional overlay layers
	•	per-section layer combinations
	•	animation zones
	•	implementation structure

This spec does not define:
	•	backend data model
	•	event logic
	•	forecast logic
	•	tooltip content
	•	section copy text

⸻

3. Core concept

The component is a single SVG scene with this structure:

Base scene
+ optional Magnetosphere overlay
+ optional Coronal Hole overlay
+ optional CME Cone overlay

Each Helio section uses the same base scene and enables only the layers it needs.

⸻

4. Target sections

4.1. Magnetosphere

Uses:
	•	base scene
	•	solar wind animation layer
	•	magnetosphere emphasis layer

4.2. Coronal Hole

Uses:
	•	base scene
	•	coronal-hole stream layer

4.3. CME Cone

Uses:
	•	base scene
	•	CME uncertainty cone layer

⸻

5. Base scene geometry

The base scene must always include:

A. Sun on the left
	•	large solar disk
	•	positioned so that:
	•	left edge touches or nearly touches the left boundary
	•	top edge touches or nearly touches the top boundary
	•	bottom edge touches or nearly touches the bottom boundary

This makes the Sun feel large and dominant.

B. Earth on the right
	•	small Earth disk
	•	magnetosphere outline around Earth
	•	positioned so that:
	•	the rightmost edge of the magnetosphere touches or nearly touches the right boundary of the drawing

C. Central alignment line
	•	centers of Sun and Earth are connected by a thin white line
	•	this line is always present in the base scene
	•	it acts as the reference axis for all overlays

⸻

6. Base scene coordinate rules

Recommended normalized composition:
	•	SVG viewBox uses a stable landscape ratio, e.g.:
	•	0 0 1000 260
	•	or similar

Recommended anchors:
	•	Sun center approximately at:
	•	x = 120
	•	y = sceneMidY
	•	Earth center approximately at:
	•	x = 860
	•	y = sceneMidY
	•	Magnetosphere right boundary approximately at:
	•	x = 995

These are conceptual anchors; exact numbers may vary.

⸻

7. Base scene visual rules

7.1. Sun
	•	flat or lightly shaded disk
	•	no animation in base layer
	•	no coronal detail required in v1

7.2. Earth
	•	small blue disk
	•	simple latitude/longitude meridian lines optional
	•	should remain visually secondary to Sun

7.3. Magnetosphere outline
	•	included in base scene
	•	subtle by default
	•	can be emphasized by overlay in Magnetosphere mode

7.4. Axis line
	•	thin white or pale neutral line
	•	always visible
	•	runs exactly through Sun center and Earth center

⸻

8. Layer architecture

The SVG scene must be structured into named groups.

Recommended layer groups:

<g id="base-axis" />
<g id="base-sun" />
<g id="base-earth" />
<g id="base-magnetosphere" />

<g id="overlay-solar-wind" />
<g id="overlay-coronal-hole" />
<g id="overlay-cme-cone" />
<g id="overlay-labels" />

Each overlay group can be shown/hidden independently.

⸻

9. Magnetosphere section overlay

9.1. Purpose

Visualize current solar wind flow toward Earth’s magnetosphere.

9.2. Added layer

Enable:

overlay-solar-wind

9.3. Contents
	•	animated solar wind arrows or streaks
	•	animation spans from:
	•	right edge of Sun
	•	to left edge of Earth’s magnetosphere

9.4. Important rule

The solar wind animation must not pass through the solar disk or inside Earth.

It begins at the Sun’s right limb and ends at the magnetosphere’s left boundary.

9.5. Optional emphasis

This section may also visually strengthen:
	•	magnetosphere outline
	•	coupling region
	•	Bz marker

But those remain separate sublayers inside the same section config.

⸻

10. Coronal Hole section overlay

10.1. Purpose

Visualize a high-speed stream extending from the Sun toward Earth.

10.2. Added layer

Enable:

overlay-coronal-hole

10.3. Contents
	•	elongated narrow stream corridor
	•	directional flow from Sun to Earth
	•	optional subtle widening toward Earth
	•	optional dashed centerline

10.4. Base dependency

This layer must use the same:
	•	Sun position
	•	Earth position
	•	axis line
as the shared base scene

⸻

11. CME Cone section overlay

11.1. Purpose

Visualize CME impact uncertainty cone / trajectory envelope.

11.2. Added layer

Enable:

overlay-cme-cone

11.3. Contents
	•	cone-like propagation corridor
	•	wide expanding wedge from Sun toward Earth
	•	optional central dashed trajectory line
	•	optional Earth highlight ring
	•	optional uncertainty shading bands

11.4. Base dependency

This layer must also use the same shared geometry.

⸻

12. Section-to-layer mapping

Section	Base scene	Solar wind	Coronal hole	CME cone
Magnetosphere	yes	yes	no	no
Coronal Hole	yes	no	yes	no
CME Cone	yes	no	no	yes


⸻

13. Rendering contract

The component should accept a single mode/config.

Example conceptual API:

type HelioSceneMode = "magnetosphere" | "coronal_hole" | "cme_cone";

interface HelioSolarEarthSceneProps {
  mode: HelioSceneMode;
  animated?: boolean;
  showLabels?: boolean;
}

The mode decides which overlay groups are enabled.

⸻

14. Animation rules

14.1. Base scene

Base layer is static.

14.2. Magnetosphere animation
	•	solar wind arrows move left → right
	•	limited to wind corridor only

14.3. Coronal Hole animation
	•	stream animation follows the HSS corridor
	•	may be slower and broader than solar wind arrows

14.4. CME animation
	•	cone itself may remain static in v1
	•	optional moving pulse or central motion marker allowed
	•	no heavy particle animation required

⸻

15. Performance rules

This shared SVG scene is intended as a lightweight UI asset.

Requirements:
	•	reuse same base scene in all three sections
	•	do not rebuild full SVG markup separately for each section
	•	use CSS/SVG animation where possible
	•	avoid canvas/WebGL
	•	avoid complex filters for v1

Goal:
	•	lower code size
	•	lower DOM duplication
	•	simpler styling updates

⸻

16. Styling rules

The base scene should use the same Helio visual language as current panel graphics.

Suggested styling:
	•	Sun: warm yellow/gold
	•	Earth: cool blue
	•	Magnetosphere: muted amber or gold outline
	•	Axis line: pale white/neutral
	•	Overlays: section-specific emphasis

The base scene should be visually neutral enough to work under all three section overlays.

⸻

17. Label rules

Labels such as:
	•	Sun
	•	Earth
	•	Elevated
	•	Bz
	•	velocity / arrival

must not be hardcoded into the base scene.

They belong in:
	•	overlay-labels
	•	or section-specific text UI outside the SVG

This prevents the base scene from becoming section-specific.

⸻

18. Implementation structure

Recommended frontend structure:

helio/
  components/
    helio_solar_earth_scene.ts
    helio_solar_earth_scene.svg.ts
    helio_solar_earth_layers.ts

Suggested internal split:
	•	buildBaseScene()
	•	buildSolarWindLayer()
	•	buildCoronalHoleLayer()
	•	buildCmeConeLayer()
	•	renderScene(mode)

Alternative:
single SVG template with conditional groups.

⸻

19. Migration strategy

This should be implemented as a new shared scene component, then adopted incrementally.

Recommended sequence:
	1.	build shared base scene
	2.	migrate Magnetosphere to shared scene
	3.	migrate Coronal Hole to shared scene
	4.	migrate CME Cone to shared scene
	5.	remove duplicated legacy SVG markup

This avoids breaking all three sections at once.

⸻

20. Acceptance criteria

This feature is complete when:
	1.	one shared base SVG scene exists
	2.	Sun, Earth, magnetosphere, and axis line are rendered from the same base
	3.	Magnetosphere uses the shared base plus solar wind overlay
	4.	Coronal Hole uses the shared base plus HSS overlay
	5.	CME Cone uses the shared base plus cone overlay
	6.	duplicated SVG geometry across the three sections is removed
	7.	visual output remains functionally equivalent or better

⸻

21. Quick implementation note for Improvements v1.3

This fits well into v1.3 as a code consolidation + UI consistency task, because:
	•	it does not require model changes
	•	it reduces repeated SVG code
	•	it improves consistency across Helio detail sections
	•	it should be implementable with low regression risk if migrated section by section
