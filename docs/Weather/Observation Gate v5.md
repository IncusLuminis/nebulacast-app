# Observation Gate — UI Specification

## Purpose

Observation Gate indicates whether astronomical observing is physically possible at the current time.

Gate is independent of the Observational Score.

Score describes quality of conditions.
Gate describes observability state.

Example:

Atmosphere excellent
But Sun above horizon
→ Gate CLOSED

Score must not be altered by gate state.

⸻

Gate Representation

Gate is represented by the card border color.

State	Color	Meaning
OPEN	Green	Observing conditions available
MARGINAL	Yellow	Limited observing (twilight or moderate obstruction)
CLOSED	Red	Observing impossible

This border must surround the entire hourly card.

⸻

Card Content

Card displays:

Observational Score

Example:

88
GOOD

The card does not display Gate text unless expanded.

Gate is communicated visually via the border.

⸻

Gate Logic

Gate is determined by hard observing constraints, not by score.

CLOSED

Sun altitude > -6°
Heavy precipitation
Fog / visibility extremely low
Clouds blocking sky (>95%)

MARGINAL

Sun altitude between -6° and -12°
Clouds 60–95%
Very strong wind

OPEN

Sun altitude < -12°
Cloud cover < 60%
No precipitation

Exact thresholds may be tuned but logic must remain deterministic.

⸻

Interaction

Clicking a card opens the Scoring Inspector.

Inspector shows:

Observation Gate: CLOSED
Reason: Daytime
Sun altitude: +3°

This avoids clutter in the card itself while keeping the explanation accessible.

⸻

UX Advantages

This design has several benefits.

1. Immediate visual scanning

Users can instantly scan the forecast:

green → observing possible
yellow → questionable
red → impossible

2. Score remains meaningful

Example:

Score 90
Red card

User immediately understands:

conditions excellent
but observing not possible yet

3. Clean card layout

Card only shows:

time
weather summary
observational score

No extra UI elements.

⸻

Example

Daytime hour:

Card border: RED
Score: 89

Night hour:

Card border: GREEN
Score: 82

Twilight hour:

Card border: YELLOW
Score: 71


⸻

Important Rule

Observation Gate must never modify the score.

Score calculation pipeline:

parameters
→ category scores
→ observational score

Gate calculation pipeline:

sun altitude
cloud obstruction
precipitation
→ gate state

Two independent systems.

⸻

Recommended Visual Detail

Border thickness:

2–3 px

Color palette suggestion:

OPEN     #3FB950  (green)
MARGINAL #F2CC60  (yellow)
CLOSED   #F85149  (red)

These align with GitHub-style semantic colors and are readable on dark UI.
