Magnetosphere Status Visualization — Spec v1

1. Purpose

The Magnetosphere Status Visualization translates complex solar–terrestrial physics parameters into an intuitive visual indicator.

Instead of showing only numeric values such as:

IMF Bz: -5.2 nT
Solar wind: 404 km/s

the component visually represents how the solar wind interacts with Earth’s magnetosphere.

The goal is to help users quickly understand:
	•	whether the magnetosphere is stable
	•	whether energy from the solar wind is coupling into the magnetosphere
	•	whether conditions favor auroral activity

This visualization is interpretive, not a physical simulation.

⸻

2. Concept

The component depicts a simplified interaction:

Sun → Solar wind → Magnetosphere → Earth

The magnetosphere reacts to solar wind conditions.

Two key states:

Closed magnetosphere

Occurs when:

IMF Bz > 0

Solar wind magnetic field aligns with Earth’s field.

Energy transfer is minimal.

⸻

Open magnetosphere

Occurs when:

IMF Bz < 0

Magnetic reconnection occurs.

Energy enters the magnetosphere.

Auroral activity becomes possible.

⸻

3. Component placement

The Magnetosphere Visualization appears inside Helio.

Recommended location:

Hero panel
right side

Example layout:

Kp Gauge        Magnetosphere Diagram

This visually links:

Kp index → magnetosphere state


⸻

4. UI Diagram

Simplified diagram.

Solar wind →

☀   →→→→→→→→→

       _________
     /           \
    |    Earth    |
     \___________/

Elements:

Element	Description
Sun	source of solar wind
Arrows	solar wind flow
Magnetosphere	protective magnetic bubble
Earth	central body


⸻

5. Magnetosphere shape states

The magnetosphere outline changes depending on solar wind pressure.

Quiet state

     _________
   /           \
  |             |
   \___________/

Balanced shape.

⸻

Compressed state

High solar wind pressure.

     _______
   /        \
  |          |
   \________/

Day-side compressed.

⸻

Storm state

Strong coupling and energy input.

    ____ 
  /      \
 |        |
  \__/\__/

Tail extended.

For MVP this can be simplified to two states only.

⸻

6. State classification

Magnetosphere state is derived from:

IMF Bz
solar wind speed
Kp index


⸻

Stable

Conditions:

Bz > 0
Kp ≤ 3
solar wind < 400 km/s

Label:

Stable

Color:

green


⸻

Active

Conditions:

Bz between -5 and 0
Kp 4–5

Label:

Active coupling

Color:

yellow


⸻

Storm

Conditions:

Bz < -5
Kp ≥ 6

Label:

Storm conditions

Color:

red


⸻

7. Solar wind visualization

Solar wind is represented as moving arrows.

Example:

→→→→→

Arrow density can reflect wind speed.

Low speed

→   →   →

Moderate speed

→→→→→

High speed

⇒⇒⇒⇒⇒

Speed thresholds:

Speed	Interpretation
<350 km/s	slow wind
350–500 km/s	moderate
>500 km/s	high-speed stream


⸻

8. Coupling indicator

The component should display magnetosphere coupling strength.

Derived mainly from:

IMF Bz


⸻

Example labels

Bz	Coupling
+5 nT	Weak
0 nT	Neutral
−5 nT	Moderate
−10 nT	Strong


⸻

9. Hover interaction

Hovering over the diagram displays details.

Example tooltip:

Solar wind: 404 km/s
IMF Bz: -5.2 nT

Magnetosphere coupling:
Moderate

Optional extra data:

Solar wind density
Dynamic pressure


⸻

10. Color scheme

The diagram background or magnetosphere outline should use a color scale.

State	Color
Stable	green
Active	yellow
Storm	red

Example:

Magnetosphere outline color


⸻

11. Dynamic behavior

The visualization should update whenever Helio data refreshes.

Typical refresh interval:

1–5 minutes

Data source examples:

NOAA DSCOVR
ACE spacecraft


⸻

12. Data inputs

Required parameters:

IMF Bz
solar wind speed
Kp index

Optional parameters:

solar wind density
dynamic pressure
Bt magnitude


⸻

13. Data sources

Typical real-time sources:

NOAA SWPC
DSCOVR spacecraft
ACE spacecraft

These provide solar wind measurements at L1.

⸻

14. Integration with Helio

Magnetosphere diagram is tied to these Helio metrics:

IMF Bz
Solar wind
Kp

These metrics should remain visible next to the diagram.

Example:

Solar wind: 404 km/s
IMF Bz: -5.2 nT
Kp: 4


⸻

15. User benefit

The visualization helps users understand space weather intuitively.

Without the diagram:

IMF Bz = -5.2 nT

is meaningless to most users.

With the diagram:

Magnetosphere open
Energy entering magnetosphere
Aurora possible

The physics becomes visually obvious.

⸻

16. MVP scope

For the first release:

Include:

magnetosphere outline
solar wind arrows
color-coded state
hover tooltip

Exclude:

3D simulation
field lines
particle flows


⸻

17. Future extensions

Later versions may add:

magnetotail visualization
reconnection point
auroral precipitation zones
bow shock location

These features are not required for the initial release.

⸻

18. Acceptance criteria

The component is complete when:
	1.	magnetosphere state reflects IMF Bz
	2.	solar wind arrows reflect wind speed
	3.	diagram updates with real-time data
	4.	hover reveals physical parameters
	5.	users can visually infer storm risk

The visualization must remain simple, intuitive, and lightweight.