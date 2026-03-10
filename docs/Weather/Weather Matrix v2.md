# Forecast Matrix — Overlay Mode
Observer Console

## Purpose

This specification defines **Overlay Mode** for the Forecast Matrix.

Overlay Mode allows the user to visualize the **continuous evolution of a parameter across the time window** by drawing a graph on a semi-transparent layer above the matrix.

The matrix itself shows **discrete hourly values**, while the overlay graph reveals the **trend and structure of the parameter**.

This dual representation allows users to analyze:

- hourly conditions (matrix view)
- temporal dynamics (overlay view)

Overlay Mode applies to **all rows of the matrix**.

---

# 1. Concept

The Forecast Matrix is a **grid of hourly cells**:

columns = hours
rows = parameters

Overlay Mode adds a **semi-transparent graph layer** across the entire matrix.

Forecast Matrix
+
Overlay Graph Layer

The overlay graph represents the parameter associated with the **selected row**.

---

# 2. Entering Overlay Mode

Overlay Mode is activated by clicking a **row header**.

Example:

Score
Clouds
Seeing
Transparency
Wind
Temperature
Humidity
Pressure

Clicking a row header performs:

activate overlay(parameter)

The graph for that parameter is drawn over the matrix.

---

# 3. Overlay Behavior

When Overlay Mode is active:

- the selected row header is highlighted
- a graph appears above the matrix
- the matrix remains visible beneath the graph
- only one overlay can be active at a time

Clicking another row header switches the overlay to that parameter.

---

# 4. Overlay Exit

Overlay Mode can be exited by:

- clicking the active row header again
- pressing `Esc`
- clicking a close icon near the row header

When Overlay Mode exits:

overlay layer disappears
matrix returns to normal interaction

---

# 5. Interaction Rules

## Default Mode (Cell Mode)

click matrix column → select hour
click hourly card → select hour
click row header → activate overlay

## Overlay Mode

click row header → switch overlay parameter
drag horizontally → move time cursor
click matrix cells → disabled

The matrix becomes **read-only** while overlay mode is active.

This avoids conflicting interactions.

---

# 6. Time Cursor

A vertical **time cursor** is visible during Overlay Mode.

The cursor:

- indicates the currently selected hour
- moves when the user drags across the overlay
- aligns with the corresponding matrix column

Sun
Moon
Score  ███│███
Clouds ███│███

---

# 7. Horizontal Scrolling

The Forecast Matrix and Overlay Layer share a **single scroll container**.

matrixViewport
├─ matrixGrid
└─ overlayLayer

When the user scrolls horizontally:

- matrix cells move
- overlay graph moves
- time cursor remains aligned

All elements share the same **time axis**.

---

# 8. Overlay Graph Types

Each parameter uses a graph appropriate to its physical meaning.

| Parameter | Graph Type |
|----------|------------|
Sun | altitude curve |
Moon | altitude curve |
Score | line graph |
Clouds | area graph |
Seeing | inverted line graph |
Transparency | line graph |
Wind | line graph |
Temperature | line graph |
Humidity | line graph |
Pressure | line graph |

---

# 9. Sun Overlay

The Sun overlay displays the **solar altitude curve**.

sun_altitude(t)

Features:

- smooth curve across the time window
- horizon crossing points
- twilight regions optionally shaded

The graph represents:

Sun altitude in degrees

---

# 10. Moon Overlay

The Moon overlay displays the **lunar altitude curve**.

moon_altitude(t)

Features:

- smooth altitude curve
- horizon crossings
- optional moon phase markers

---

# 11. Score Overlay

The Score overlay shows the **atmospheric score evolution**.

Graph:

line chart

Optional:

- soft area fill beneath the line
- color gradient representing score category

---

# 12. Cloud Overlay

Cloud overlay displays **effective cloud coverage**.

Graph type:

area chart

Range:

0–100 %

Optional future enhancement:

stacked low / mid / high cloud layers

---

# 13. Seeing Overlay (Inverted Scale)

Seeing is measured using **FWHM (arcseconds)**.

Smaller values mean **better seeing**, therefore the overlay must use an **inverted scale**.

Meaning:

lower FWHM → higher graph position
higher FWHM → lower graph position

Example mapping:

| FWHM | Graph Position |
|-----|----------------|
0.5″ | top |
1.0″ | high |
2.0″ | middle |
3.0″ | low |
4.0″ | bottom |

This inversion ensures the visual meaning:

higher graph = better seeing

which matches user expectations.

---

# 14. Transparency Overlay

Transparency overlay uses a **line chart**.

Typical range:

0–100 quality

Higher values represent clearer atmosphere.

---

# 15. Wind Overlay

Wind overlay uses a **line graph**.

Range:

0–20 m/s

Graph color may change when wind exceeds observing thresholds.

---

# 16. Temperature Overlay

Temperature uses a **line chart**.

The graph reveals:

- daily heating cycles
- nighttime cooling

Units:

°C

---

# 17. Humidity Overlay

Humidity uses a **line chart**.

Range:

0–100 %

High humidity regions may be visually highlighted.

---

# 18. Pressure Overlay

Pressure uses a **line chart**.

Range:

~950–1050 hPa

This graph helps identify:

- high pressure systems
- approaching weather fronts

---

# 19. Graph Scaling

Each overlay graph uses its **own physical scale**.

Examples:

| Parameter | Units |
|----------|------|
Sun altitude | degrees |
Moon altitude | degrees |
Score | 0–100 |
Clouds | % |
Seeing | arcseconds |
Temperature | °C |
Wind | m/s |
Humidity | % |
Pressure | hPa |

Tooltips display exact values at the cursor position.

---

# 20. Visual Design

Overlay graphs use **semi-transparent rendering**.

Recommended opacity:

0.18–0.30

This ensures:

- matrix cells remain visible
- graph trend is clear

---

# 21. Row Header State

Row headers have three states:

| State | Description |
|------|-------------|
Default | normal label |
Hover | hint: “Show trend” |
Active | overlay enabled |

Active state styling:

accent highlight
optional close icon

---

# 22. Performance

Overlay graphs should be rendered using:

Canvas or SVG

The graph is recalculated only when:

- overlay parameter changes
- forecast window changes

Not on every frame.

---

# 23. Advantages

Overlay Mode provides:

- intuitive visualization of parameter trends
- improved interpretation of weather dynamics
- deeper analysis without leaving the matrix
- unified visualization across all parameters

The system becomes a **hybrid between a forecast matrix and a scientific chart viewer**.