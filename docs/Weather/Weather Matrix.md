# Forecast Matrix Layout (Sun & Moon Rows)
Observer Console — Weather / Observing UI

## Purpose

This specification defines a **time-synchronized forecast matrix** for the Observer Console.

Instead of a separate celestial chart, the interface uses **Sun and Moon rows at the top of the matrix**, aligned with all other atmospheric parameters.

The matrix allows the user to quickly answer two questions:

1. **When is the sky observable?** (Sun / Moon geometry)
2. **When are atmospheric conditions good?** (weather parameters and observing score)

All rows share a **single time axis** and can be read:

- **horizontally** → evolution of a parameter over time  
- **vertically** → complete conditions for a specific hour

---

# 1. Layout Overview

The interface is composed of three layers.

Hourly Cards (overview)
↓
Forecast Matrix (time grid)
↓
Selected Hour Weather Panel

---

# 2. Master Time Axis

All components share a **single hourly grid**.

time_step = 1 hour
range = 72 hours

Each column represents one hour.

hour_index = 0..71

Horizontal position is calculated as:

x = hour_index * column_width

This ensures perfect alignment between:

- hourly cards
- Sun row
- Moon row
- atmospheric rows
- score row

---

# 3. Forecast Matrix Structure

Each **row represents a parameter**.

Each **column represents one hour**.

Example:

Hour →      18 19 20 21 22 23 00 01

Sun         ███░░░░░░░░░░░░░
Moon        ░░░░░░🌙🌙🌙🌙🌙
Score       🟥 🟨 🟩 🟩 🟩 🟩
Clouds      ▓▓ ▒▒ ░░ ░░ ░░ ░░
Seeing      ▓▓ ▒▒ ░░ ░░ ░░ ░░
Transparency▒▒ ▒▒ ░░ ░░ ░░ ░░
Wind        ░░ ░░ ░░ ░░ ░░ ░░
Temperature ░░ ░░ ░░ ░░ ░░ ░░
Humidity    ░░ ░░ ░░ ░░ ░░ ░░
Pressure    ░░ ░░ ░░ ░░ ░░ ░░

---

# 4. Matrix Row Order

Recommended order:

Sun
Moon
Score
Clouds
Seeing
Transparency
Wind
Temperature
Humidity
Pressure

### Reasoning

Rows are ordered by **observational importance**.

1. Celestial constraints
2. Observing score
3. Atmospheric parameters
4. General meteorology

---

# 5. Sun Row

The Sun row indicates whether the Sun is above or below the horizon.

Possible states:

| State | Meaning |
|------|------|
Day | Sun above horizon |
Civil twilight | Sun between 0° and −6° |
Nautical twilight | Sun between −6° and −12° |
Astronomical twilight | Sun between −12° and −18° |
Night | Sun below −18° |

Example encoding:

Day                light gray
Civil twilight     soft blue
Nautical twilight  darker blue
Astronomical tw    deep blue
Night              black

This row visually defines the **usable night window**.

---

# 6. Moon Row

The Moon row indicates whether the Moon is above the horizon.

Each column may contain:

🌙 icon  → moon above horizon
empty    → moon below horizon

Optional enhancements:

- brightness intensity representing **moon illumination**
- tooltip showing:
  - altitude
  - phase
  - illumination percentage

Example:

Moon
░░░░░░🌙🌙🌙🌙🌙░░░░

---

# 7. Score Row

Displays the **observing score classification**.

Colors:

| Color | Meaning |
|------|------|
Red | Poor |
Yellow | Fair |
Green | Good |
Bright green | Excellent |

Derived from the **Scoring v2 model**.

---

# 8. Clouds Row

Represents effective cloud coverage.

Possible visualization:

clear        ░
light cloud  ▒
moderate     ▓
heavy cloud  █

Optional tooltip:

low / mid / high cloud breakdown

---

# 9. Seeing Row

Represents atmospheric seeing quality.

Based on **FWHM (arcseconds)**.

Example mapping:

| FWHM | Quality |
|------|--------|
<1.0″ | excellent |
1.0–1.5″ | good |
1.5–2.5″ | fair |
>2.5″ | poor |

---

# 10. Transparency Row

Represents atmospheric clarity.

May be derived from:

visibility
aerosol content
model transparency estimate

Possible mapping:

excellent
good
fair
poor

---

# 11. Wind Row

Represents wind speed impact.

Example buckets:

0–3 m/s
3–6 m/s
6–10 m/s

10 m/s

Higher wind may degrade observing stability.

---

# 12. Temperature Row

Displays hourly temperature.

Useful for:

- thermal turbulence
- dew risk
- observer comfort

---

# 13. Humidity Row

Indicates risk of dew formation.

Example mapping:

<60%  safe
60–80% caution

80%  dew risk

---

# 14. Pressure Row

Displays atmospheric pressure trends.

While pressure itself does not directly determine observing quality, it helps identify:

- approaching weather systems
- stable high-pressure regimes

---

# 15. Selected Hour Interaction

Clicking a **matrix column** selects that hour.

Actions triggered:

update selected_hour
highlight column
update weather panel
update hourly cards highlight

---

# 16. Selected Hour Weather Panel

The bottom panel shows detailed information for the selected hour.

It includes:

Date / Time (Local)
Observability Gate
Weather Quality
Seeing Quality
Final Score
Moon phase + altitude
Cloud breakdown
Wind
Visibility
Temperature

---

# 17. Synchronization Rules

All components share the same timeline:

Hourly Cards
Forecast Matrix
Selected Hour Panel

Each column must correspond to the **same hour across the entire interface**.

---

# 18. Advantages

This layout provides:

- clear visualization of **night vs daylight**
- instant visibility of **moon interference**
- full comparison of atmospheric parameters
- fast identification of **best observing windows**
- scalable visualization for **72-hour forecasts**

The result is a **compact observing planner interface** suitable for both casual observers and advanced users.