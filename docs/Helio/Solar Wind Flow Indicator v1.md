Solar Wind Flow Indicator — Spec v1

1. Purpose

The Solar Wind Flow Indicator provides a simple animated visualization of solar wind streaming from the Sun toward Earth.

Instead of displaying only numeric values such as:

Solar wind speed: 404 km/s

the component visually represents the flow of charged particles moving through interplanetary space.

The goal is to make solar wind conditions intuitive:
	•	faster arrows → stronger solar wind
	•	slower arrows → quiet solar wind

This animation is symbolic, not a physical simulation.

⸻

2. Concept

Solar wind constantly flows outward from the Sun.

Typical speeds:

Speed	Interpretation
<350 km/s	slow wind
350–500 km/s	normal wind
500–700 km/s	high-speed stream
>700 km/s	strong solar wind event

The indicator visualizes this as a flow animation:

☀ →→→→→ Earth


⸻

3. Component placement

The Solar Wind Flow Indicator appears inside Helio.

Recommended placement:

Hero panel
near solar wind metric

Example layout:

Solar wind
404 km/s

☀ →→→→→ Earth

This connects the numeric value with the visual flow.

⸻

4. Visual layout

Minimal diagram:

☀      →→→→→→→→→      🌍
Sun      solar wind     Earth

Elements:

Element	Description
Sun icon	solar source
Arrow stream	solar wind flow
Earth icon	destination


⸻

5. Animation behavior

The arrows move from the Sun toward Earth.

Animation direction:

left → right

This visually represents particle flow.

⸻

6. Speed mapping

Arrow animation speed depends on solar wind speed.

Suggested mapping:

Solar wind speed	Animation
<350 km/s	slow arrows
350–500 km/s	moderate flow
500–700 km/s	fast arrows
>700 km/s	rapid flow


⸻

Example

Slow solar wind

☀  →   →   →   →   🌍

Moderate solar wind

☀  →→→→→→→→  🌍

High-speed stream

☀  ⇒⇒⇒⇒⇒⇒⇒⇒  🌍


⸻

7. Arrow density

Arrow spacing may also reflect wind strength.

Speed	Arrow density
slow	sparse arrows
moderate	normal density
fast	dense arrows


⸻

8. Data input

Required parameter:

solar_wind_speed

Units:

km/s

Example:

404 km/s


⸻

9. Data sources

Solar wind measurements typically come from spacecraft at the L1 Lagrange point.

Common sources:

Spacecraft	Data
DSCOVR	solar wind plasma
ACE	solar wind plasma
SWPC	aggregated feed


⸻

10. Update interval

Solar wind data updates roughly every:

1–5 minutes

The animation should update smoothly when values change.

⸻

11. Hover interaction

Hovering over the animation shows a tooltip.

Example:

Solar wind speed: 404 km/s
Density: 6.2 p/cm³
Dynamic pressure: 2.1 nPa

Optional fields may include:

temperature
Bt magnetic field


⸻

12. Color scheme

The arrow color may reflect activity level.

Condition	Color
slow wind	green
normal wind	yellow
high-speed stream	orange
storm conditions	red

Example:

☀ →→→→→ 🌍   (yellow)


⸻

13. Coupling hint (optional)

When IMF Bz is strongly southward:

Bz < -5 nT

the flow indicator may visually emphasize energy coupling.

Example:

☀ ⇒⇒⇒⇒⇒ 🌍

with a label:

Strong solar wind coupling

This connects the component with the magnetosphere visualization.

⸻

14. Performance

The animation must be lightweight.

Recommended implementation:

CSS animation
SVG arrows

Avoid:

canvas particle simulations
WebGL effects

The goal is minimal CPU usage.

⸻

15. Accessibility

Users must still see the solar wind state even if animations are disabled.

Fallback:

☀ →→→→→ Earth
Solar wind: 404 km/s


⸻

16. Integration with Helio metrics

The Solar Wind Flow Indicator should appear next to:

Solar wind speed
IMF Bz
Kp index

These parameters together determine geomagnetic coupling.

Example:

Solar wind: 404 km/s
IMF Bz: -5.2 nT
Kp: 4

☀ →→→→→ 🌍


⸻

17. User benefit

Most users do not intuitively understand:

solar wind speed = 404 km/s

The animation provides an immediate visual cue:
	•	faster arrows → stronger solar wind
	•	slower arrows → quiet conditions

This helps users understand space weather dynamics quickly.

⸻

18. MVP scope

For the first release include:

Sun icon
Earth icon
animated arrow flow
speed mapping
hover tooltip

Exclude:

3D solar wind simulations
particle physics visualization
magnetohydrodynamic models


⸻

19. Future extensions

Future versions may include:

solar wind density visualization
CME shock front
dynamic pressure indicators

These are not required for the MVP.

⸻

20. Acceptance criteria

The component is considered complete when:
	1.	arrow animation reflects solar wind speed
	2.	direction clearly shows Sun → Earth flow
	3.	tooltip reveals physical parameters
	4.	the animation remains lightweight
	5.	users can visually infer solar wind strength