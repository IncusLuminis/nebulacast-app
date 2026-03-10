# Hourly Cards — Day / Twilight / Night State Specification

## Purpose

This specification introduces a **solar illumination state** for each hourly card in the Observer Console.

Each hour will be classified as one of three states:

- **Night**
- **Twilight**
- **Day**

The goal is to allow users to instantly understand whether an hour is:

- fully dark
- transitional twilight
- daylight

This state is **independent of weather and observing score** and purely reflects **solar geometry**.

---

# 1. Solar States

Each hour belongs to one of the following:

| State | Definition |
|------|------------|
| Night | Sun altitude ≤ -18° |
| Twilight | Sun altitude between 0° and -18° |
| Day | Sun altitude > 0° |

Twilight includes both:

- Civil twilight
- Nautical twilight
- Astronomical twilight

This simplifies the UI to a single **transitional twilight state**.

---

# 2. Twilight Interval Definition

Twilight spans two periods per day:

### Evening Twilight

sunset → end of astronomical twilight

### Morning Twilight

start of astronomical twilight → sunrise

Both intervals are classified as **Twilight**.

---

# 3. Hour Rounding

Hourly cards represent discrete hours.

Solar state must therefore be **rounded to the nearest hour**.

Rule:

state(hour) determined by sun altitude at hour midpoint

Example:

| Hour | Sun Alt | State |
|-----|--------|------|
18:00 | +3° | Day |
19:00 | -2° | Twilight |
20:00 | -8° | Twilight |
21:00 | -15° | Twilight |
22:00 | -19° | Night |

---

# 4. Data Source

Solar state is derived from:

sunmoon.json

or calculated in the module:

sun_equation

Required solar data:

sun_altitude_deg
sunset
sunrise
astro_twilight_start
astro_twilight_end

Preferred method:

sun_altitude_deg(hour_midpoint)

Fallback:

interval comparison using sunrise/sunset and twilight timestamps.

---

# 5. JSON Data Model

Each hourly object should include:

```json
{
  "solar_state": "day | twilight | night"
}

Optional extended format:

{
  "solar": {
    "state": "day | twilight | night",
    "sun_altitude_deg": -8.3
  }
}


⸻

6. UI Rendering Rules

Solar state controls card background tone.

Important:

Solar state must not interfere with weather scoring colors.

Existing rules remain:

Condition	Visual Indicator
Observability CLOSED	Red side bracket
Score quality	Score color
Solar state	Card background tint


⸻

7. Visual Design

Night

Current dark theme background.

deep space color

Example:

#0b0f14


⸻

Twilight

Intermediate tone between day and night.

muted dusk color

Example:

#1b2230

This should feel like dim sky illumination.

⸻

Day

Existing daylight card style.

lighter background

Example:

#273040


⸻

8. Visual Hierarchy

Card styling layers:

1. Solar state (background)
2. Observability gate (side bracket)
3. Score color
4. Weather icons

Example combinations:

Night + Good Observing

Dark card with green score.

⸻

Twilight + Fair Observing

Muted twilight card with yellow score.

⸻

Night + CLOSED (clouds)

Dark card + red bracket.

⸻

Day

Day-colored card regardless of observing score.

⸻

9. CSS Classes

Add solar state classes:

.hour-card.day
.hour-card.twilight
.hour-card.night

Example CSS:

.hour-card.night {
  background-color: var(--card-night);
}

.hour-card.twilight {
  background-color: var(--card-twilight);
}

.hour-card.day {
  background-color: var(--card-day);
}


⸻

10. Rendering Logic

Pseudo-logic:

if (solar_state === "night")
  card.classList.add("night")

if (solar_state === "twilight")
  card.classList.add("twilight")

if (solar_state === "day")
  card.classList.add("day")

Gate logic remains separate:

if (gate.status === "CLOSED")
  card.classList.add("closed")


⸻

11. Interaction with Observing Score

Solar state does not modify score directly, but influences interpretation:

State	Observing Relevance
Night	Full observing
Twilight	Limited observing
Day	Observing generally not possible

Optional future rule:

if solar_state == day
  hour_score ≤ 20


⸻

12. Timeline Integration

The Observability Timeline should also reflect solar state.

Example:

Day        Twilight        Night
███▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒███

Color mapping:

State	Color
Day	light grey
Twilight	dim blue
Night	dark blue


⸻

13. UX Benefits

This feature provides:
	•	immediate visual understanding of darkness
	•	separation of weather vs solar illumination
	•	intuitive identification of observing windows
	•	better interpretation of hourly scores

Users will instantly see:

night observing
twilight transition
daytime hours

without reading additional labels.

⸻

14. Future Extensions

Possible future enhancements:
	•	Moon illumination overlay
	•	Milky Way visibility indicator
	•	Deep-sky vs planetary twilight recommendations
	•	Astronomical darkness indicator on timeline

