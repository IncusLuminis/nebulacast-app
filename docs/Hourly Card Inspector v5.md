Спецификация полностью соответствует иерархии Scoring v5:

Final Score
→ Category Scores
→ Raw Parameters

модель скоринга описана в Scoring v5  ￼.

⸻

Hourly Card — Scoring Inspector (v5)

Observer Console

Component: Hourly Forecast Card / Scoring Inspector

Purpose: Explain the observing score for a specific hour

⸻

1. Purpose

The Hourly Card provides a transparent breakdown of the scoring model for a specific forecast hour.

It answers the question:

Why is the score 75?

The dialog exposes the full hierarchy:

Final Observing Quality
    ↓
Category Scores
    ↓
Physical parameters

This allows the observer to understand:
	•	what affects observing conditions
	•	which factor is limiting the score
	•	whether conditions are improving or degrading

⸻

2. Layout Structure

The dialog is structured into three vertical layers.

HEADER
FINAL SCORE

CATEGORY SCORES

CATEGORY BREAKDOWN (expandable)


⸻

3. Header

Top section shows the context.

Example:

08:00
Clear sky · Calm wind · Visibility 9.3 km · 2°C

Fields:

forecast hour
weather summary
temperature
wind descriptor

Optional:

moon state
twilight state


⸻

4. Final Score Panel

Large score display.

Example:

75
EXCELLENT

Elements:

score value
score label
score bar
gate state

Example:

75
GOOD

Gate: OPEN

████████░░░░░░

Score range:

Score	Label
90–100	Excellent
75–89	Good
60–74	Fair
40–59	Poor
<40	Very Poor


⸻

5. Gate Indicator

Gate shows whether observing is physically possible.

States:

OPEN
MARGINAL
CLOSED

Example:

● OPEN
Clear sky

Gate is computed independently of categories
as defined in the scoring model  ￼.

⸻

6. Category Score Section

Below the final score the card shows four category scores.

Atmosphere
Sky Darkness
Dew Safety
Stability

Example layout:

Atmosphere      86 >
Sky Darkness    74 >
Dew Safety      91 >
Stability       65 >

Each row contains:

category name
category score
toggle button >

Clicking the row expands the parameter breakdown.

⸻

7. Expandable Category Inspector

Clicking a category reveals the raw parameters used to compute it.

Example:

Atmosphere      86 ▼

Expanded:

Clouds (low)      0%
Clouds (mid)      0%
Clouds (high)     8%

Seeing            1.1"
Seeing Score      80

Transparency      Fair
TransparencyScore 75


⸻

8. Category Models

Atmosphere

Represents optical atmospheric quality.

Expanded parameters:

cloud_low
cloud_mid
cloud_high
seeing_fwhm
seeing_score
transparency_proxy
transparency_score

Optional:

jet_stream_speed

Score formula (displayed optionally):

AtmosphereScore =
0.40 CloudsScore +
0.35 SeeingScore +
0.25 TransparencyScore


⸻

Sky Darkness

Represents sky brightness.

Expanded parameters:

sun_altitude
twilight_state
moon_altitude
moon_phase
bortle_class

Example:

Sun altitude      -24°
Moon altitude     14°
Moon phase        35%
Bortle            6

Optional computed items:

twilight_penalty
moon_penalty


⸻

Dew Safety

Represents condensation risk.

Parameters:

temperature
dew_point
dew_spread
humidity
wind

Example:

Temperature     2°C
Dew point       0.5°C
Spread          1.5°C

Humidity        92%
Wind            2.8 m/s

Optional:

dew_score_modifier


⸻

Stability

Represents environmental stability.

Parameters:

wind_speed
humidity
pressure
pressure_trend
temperature_gradient

Example:

Wind           2.8 m/s
Humidity       72%
Pressure       1025 hPa
PressureTrend  stable


⸻

9. Visual Indicators

Each parameter may include a quality indicator.

Example:

Seeing        1.1"    GOOD
Clouds        0%      EXCELLENT
Humidity      92%     WARNING

Possible indicators:

Excellent
Good
Moderate
Poor
Critical


⸻

10. Limiting Factor Highlight

The inspector highlights the lowest category score.

Example:

Limiting factor

Sky Darkness
Moon altitude 14°

This helps the observer quickly understand the constraint.

⸻

11. Parameter Ordering

Parameters inside categories should be ordered by importance.

Example:

Atmosphere:

Seeing
Clouds
Transparency

Sky Darkness:

Sun altitude
Moon altitude
Moon phase
Bortle


⸻

12. Responsive Behaviour

Mobile layout collapses categories.

Atmosphere 86 >
Sky Dark   74 >
Dew Risk   91 >
Stability  65 >

Click opens full screen breakdown.

⸻

13. Interaction Model

Actions:

click category → expand parameters
click again → collapse

Optional:

tap parameter → show tooltip explanation

Example tooltip:

Seeing
Atmospheric blurring measured in arcseconds.
Lower values are better.


⸻

14. Data Requirements

The inspector requires the following data for each hour:

observing_quality
gate_state

atmosphere_score
sky_darkness_score
dew_safety_score
stability_score

cloud_low
cloud_mid
cloud_high

seeing_fwhm
transparency_proxy

sun_altitude
moon_altitude
moon_phase
bortle_class

temperature
dew_point
humidity
wind_speed
pressure


⸻

15. Design Philosophy

The scoring inspector must follow three rules.

Transparency

User must see how the score is produced.

⸻

Hierarchical clarity

Structure must follow scoring model.

Score
→ categories
→ parameters


⸻

Scientific credibility

Values must remain physical parameters, not arbitrary UI labels.

⸻

16. Result

The Hourly Card becomes a scoring debugger for observers.

Instead of showing just weather:

75
Good

the user sees:

75
Good

Atmosphere 86
Sky Darkness 74
Dew Safety 91
Stability 65

and can expand each category to see exactly why.
