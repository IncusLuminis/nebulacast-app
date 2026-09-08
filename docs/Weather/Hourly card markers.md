# Observer Console — Hourly Card UI Specification (v1.0)

## Purpose

This specification defines the **final layout and behavior of hourly cards** in the Observer Console.

The design must allow users to:

- rapidly scan observing conditions across many hours
- distinguish **day / twilight / night**
- see **moon phase and altitude**
- understand **observing score**
- quickly assess **key observing factors**

The UI must remain **compact**, **scannable**, and **scientific-instrument-like**.

---

# 1. Card Layout Overview

Final vertical structure of each hourly card:

┌────────────────────────
│ 23:00           🌔45°
│
│ ▇ ▇ ▇ ▇
│ ☁ 🌫 🔭 🌙
│
│ 76
│ GOOD
│
│ ● 0.9”
│
│ ☁ 10%
│ 🌡 4°C
│ 🌬 3.1 m/s
│ 👁 50 km
└────────────────────────

Visual hierarchy:

| Position | Element |
|--------|---------|
top-left | hour |
top-right | moon badge |
below hour | condition markers |
below markers | marker icons |
center | observing score |
below score | seeing indicator |
bottom | weather rows |

---

# 2. Solar State (Day / Twilight / Night)

Each card represents one of three solar states.

| State | Definition |
|------|------------|
Night | Sun altitude ≤ -18° |
Twilight | -18° < Sun altitude ≤ 0° |
Day | Sun altitude > 0° |

### Visual representation

Solar state affects **card background tint only**.

| State | Background |
|------|-------------|
Night | dark |
Twilight | muted dusk tone |
Day | lighter tone |

CSS classes:

.hour-card.night
.hour-card.twilight
.hour-card.day

---

# 3. Moon Badge

A moon indicator appears in the **top-right corner** of the card.

Example:

🌔45°

Components:

| Element | Meaning |
|--------|--------|
Moon icon | phase |
Number | altitude above horizon |

Rules:

| Condition | Behavior |
|----------|----------|
Moon above horizon | badge visible |
Moon below horizon | badge hidden |
Daytime | badge hidden |

### Tooltip

Hover text:

Moon
Phase: Waxing gibbous
Altitude: 45°
Illumination: 78%

---

# 4. Condition Markers

Markers represent **four observing factors**.

They appear in **one horizontal row** directly **below the hour**.

Example:

▇ ▇ ▇ ▇

Each marker corresponds to a parameter.

Order is fixed:

| Position | Parameter |
|--------|-----------|
1 | Clouds |
2 | Transparency |
3 | Seeing |
4 | Moon brightness |

Markers allow **rapid visual scanning across cards**.

---

# 5. Marker Icons

Icons appear **directly below markers**.

Example:

☁ 🌫 🔭 🌙

Meaning:

| Icon | Parameter |
|-----|-----------|
☁ | Cloud cover |
🌫 | Transparency |
🔭 | Seeing |
🌙 | Moon brightness |

### Tooltip

Each marker supports hover tooltip.

Example:

Cloud cover quality
Transparency quality
Seeing quality
Moon brightness impact

---

# 6. Marker Color Mapping

Marker color reflects parameter quality.

| Color | Meaning |
|------|--------|
Green | excellent |
Light green | good |
Yellow | fair |
Red | poor |
Grey | unavailable |

---

# 7. Observing Score

The observing score is the **primary metric** in Observing Mode.

Displayed in the center of the card.

Example:

76
GOOD

### Score range

0–100

### Score classes

| Score | Class |
|------|------|
≥80 | EXCELLENT |
60–79 | GOOD |
40–59 | FAIR |
<40 | POOR |

### Score colors

| Score | Color |
|------|------|
≥70 | green |
40–69 | yellow |
<40 | red |

---

# 8. Observability Gate

Gate states:

OPEN
MARGINAL
CLOSED

### Indicators

| State | UI |
|------|----|
OPEN | no bracket |
MARGINAL | yellow side bracket |
CLOSED | red side bracket |

---

# 9. CLOSED Card Layout

If observing is impossible:

┌────────────────
│ 22:00
│
│ ✕
│ CLOSED
│
│ ☁ 100%
│ 🌡 2°C
│ 🌬 2.8 m/s
│ 👁 0.7 km
└────────────────

Rules:

- score hidden
- markers optional
- seeing indicator hidden

---

# 10. Seeing Indicator (FWHM)

Seeing is displayed using **FWHM in arcseconds**.

Example:

● 0.9”

Rounded to **one decimal place**.

### Seeing classes

| FWHM | Class |
|------|------|
≤1.0 | Excellent |
1.0–1.5 | Good |
1.5–2.5 | Fair |
>2.5 | Poor |

### Symbol mapping

| Symbol | Meaning |
|------|--------|
● | excellent |
◉ | good |
○ | fair |
◯ | poor |

---

# 11. Weather Rows

Weather rows provide context.

Standard rows:

☁ cloud cover
🌡 temperature
🌬 wind speed
👁 visibility

These appear in **both modes**.

---

# 12. Weather Mode

Cards support a second presentation mode.

Header switch:

Hourly

[ Observing ] [ Weather ]

### Weather Mode Layout

┌────────────────
│ 14:00
│
│ ☁
│ 4°C
│
│ ☁ 10%
│ 🌬 3.1 m/s
│ 👁 50 km
│
│ Observing: 76
└────────────────

Priority:

| Element | Priority |
|------|-----------|
Weather icon | primary |
Temperature | primary |
Weather rows | secondary |
Observing score | informational |

---

# 13. Rendering Logic

### Observing Mode

if gate == CLOSED
renderClosedCard()
else
renderMoonBadge()
renderMarkers()
renderScore()
renderSeeing()
renderWeatherRows()

### Weather Mode

renderWeatherIcon()
renderTemperature()
renderWeatherRows()
renderObservingScoreSmall()

---

# 14. Required Data Fields

Hourly JSON must include:

hour

solar.state

moon.phase
moon.altitude
moon.illumination

score
score_class

gate.status

cloud_low
cloud_mid
cloud_high

temperature
wind
visibility

seeing.fwhm_arcsec
seeing.score
seeing.class

conditions.cloud
conditions.transparency
conditions.seeing
conditions.moon

---

# 15. CSS State Classes

.hour-card

.hour-card.day
.hour-card.twilight
.hour-card.night

.hour-card.good
.hour-card.fair
.hour-card.poor

.hour-card.closed
.hour-card.marginal

---

# 16. UX Benefits

This layout provides:

- rapid scanning of observing conditions
- intuitive visual interpretation
- separation of **astronomy vs weather**
- integration of **moon and twilight context**
- clear observing score interpretation

Users can instantly recognize:

- best observing windows
- cloud interruptions
- seeing quality
- moon interference


⸻
