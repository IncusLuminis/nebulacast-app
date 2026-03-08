# Top Information Panels — Specification (v1)
Observer Console

## Purpose

The top section of the page provides a **compact operational overview** of the current observing context.

Instead of one large banner, the interface uses **four compact information panels** arranged in a single row.

Each panel answers a different primary question:

| Panel | Question |
|------|----------|
| Time & Location | Where and when am I observing? |
| Atmosphere Score | How good is the atmosphere right now? |
| Best Observing Window | When is the best time to observe? |
| Sky Conditions | What are the current sky and weather conditions? |

This structure increases **information density**, reduces vertical space usage, and makes the UI behave more like an **observing cockpit**.

---

# 1. Layout

The panels are arranged in a single horizontal row.

[ TIME & LOCATION ] [ SCORE ] [ OBSERVING WINDOW ] [ SKY CONDITIONS ]

Layout rules:

- 4 panels of equal width
- fixed row height
- responsive collapse on smaller screens

Recommended height:

90–110 px

Panels must remain visually compact and not dominate the page.

---

# 2. Panel 1 — Time & Location

## Purpose

Provides contextual information about **where and when the forecast applies**.

This panel anchors the entire interface in space and time.

## Content

Required fields:

Location name
Latitude / Longitude
Local date
Local time
Bortle class

Example:

Warsaw, Poland
52.23°N 21.01°E

Local Time
13:42 — Mar 7

Bortle 6

## Compact version

A condensed layout may be used:

📍 Warsaw
🕒 13:42
📅 Mar 7
🌌 Bortle 6

Optional additional fields:

Elevation
Timezone

## Interaction

Click action:

Open location selector

---

# 3. Panel 2 — Observational Opportunity Score

## Purpose

Displays the **current observational opportunity score** using the Scoring v5 model.

## Content

Required elements:

Score value
Score category
Active scoring mode
Score progress bar

Example:

18
POOR
Balanced

Score bar:

██████░░░░░░░░░░

Scoring modes available:

Balanced
Visual
Planetary
Broadband

These modes adjust the weight of parameters in the scoring model.

## Interaction

Click action:

Switch scoring mode

---

# 4. Panel 3 — Best Observing Window

## Purpose

Identifies the **best upcoming time interval for observing** based on forecast conditions.

This panel answers the practical question:

When should I observe tonight?

## Content

Required fields:

Best observing interval
Score range during the interval
Suggested observing type

Example:

Best window
20:00 — 01:00

Score 82–88
Deep Sky

Optional visual timeline:

░░░░██████░░░░

The filled segment represents the best observing window.

## Computation

The best window is derived from:

score(t)
cloud coverage
seeing
transparency
moon altitude

The algorithm searches for **continuous time segments with high atmospheric score**.

## Interaction

Click action:

Open extended nightly forecast

---

# 5. Panel 4 — Sky Conditions

## Purpose

Summarizes **current atmospheric and sky conditions** in a compact format.

This panel acts as a quick diagnostic view.

## Content

The panel displays three groups of parameters.

### Atmosphere

☁ Cloud cover
🔭 Seeing
🌫 Transparency

Example:

☁ 12%
🔭 1.1”
🌫 45 km

### Weather

🌬 Wind speed
🌡 Temperature
💧 Humidity

Example:

🌬 1.8 m/s
🌡 3°C
💧 72%

### Sky

🌙 Moon altitude
Moon phase

Example:

🌙 14°
35% phase

## Trend indicator (optional)

Atmospheric trend may be shown:

Atmosphere trend
↑ improving

Trend is calculated using:

score(t + 3h) − score(now)

Possible states:

↑ improving
→ stable
↓ deteriorating

## Interaction

Click action:

Open detailed weather panel

---

# 6. Responsive Behavior

On smaller screens:

4 panels → 2 rows

Layout:

[ TIME & LOCATION ] [ SCORE ]
[ OBSERVING WINDOW ] [ SKY CONDITIONS ]

If necessary, the least critical elements may be hidden.

---

# 7. Design Principles

The top panels must follow these rules:

Compact
Information-dense
Operational
Non-intrusive

They should not replicate detailed forecast information already shown in the matrix.

Instead, they provide **quick orientation and decision support**.

---

# 8. Relationship to Forecast Matrix

The panels summarize information derived from the same forecast dataset used by the matrix.

They provide **high-level insights**, while the matrix provides **hour-by-hour analysis**.

Workflow:

Top panels → overview
Forecast matrix → detailed analysis
Overlay graphs → parameter trends

This layered structure enables both **quick interpretation** and **deep analysis**.