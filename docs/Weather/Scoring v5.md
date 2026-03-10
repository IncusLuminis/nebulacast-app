Ниже спецификация Scoring v5 в чистом Markdown. Она опирается на всё, что вы решили: иерархия скоринга, категории, Gate, профили и сохранение легаси параметров.

⸻

Observing Scoring Model — Version 5

Overview

Scoring v5 introduces a hierarchical observing quality model designed to support both casual users and advanced analysis.

The model is structured into three levels:

Level 1 — Observing Quality (single final score)

Level 2 — Category Scores
    Atmosphere
    Sky Darkness
    Dew Risk
    Stability

Level 3 — Parameter Breakdown
    Individual parameters used to compute category scores

This architecture allows:
	•	a single simple score for quick interpretation
	•	category scores for understanding conditions
	•	parameter-level transparency for advanced users

⸻

Level 1 — Observing Quality

Observing Quality: 0–100

The final score shown prominently in the UI.

Purpose:
	•	quick decision indicator
	•	compatible with existing interface
	•	weighted combination of category scores

Observing Quality is calculated as:

ObservingQuality =
    weighted_sum(
        AtmosphereScore,
        SkyDarknessScore,
        DewSafetyScore,
        StabilityScore
    )

The weights depend on the selected observing profile.

The final value is then limited by Observability Gate.

⸻

Observability Gate

The gate determines whether observing conditions are physically possible.

OPEN
MARGINAL
CLOSED

Gate is computed from hard conditions:

CLOSED

rain > threshold
snow > threshold
fog / visibility extremely low
low or mid clouds > 95%

MARGINAL

precipitation probability moderate
very high humidity
low clouds 70–95%

OPEN

No blocking conditions.

Gate effect on final score

CLOSED   → ObservingQuality max = 20
MARGINAL → ObservingQuality max = 69
OPEN     → no limitation

Gate does not modify category scores, only the final score.

⸻

Level 2 — Category Scores

Each category produces a score from 0–100.

100 = excellent
0   = unusable

Categories represent independent aspects of observing conditions.

⸻

1. Atmosphere Score

Represents optical quality of the atmosphere.

Computed from:

Clouds
Seeing (FWHM)
Transparency (proxy)

Example weighting:

AtmosphereScore =
    0.4 * CloudsScore +
    0.35 * SeeingScore +
    0.25 * TransparencyScore

Notes

Cloud layers should be evaluated separately:

low clouds
mid clouds
high clouds

Rules:

low/mid clouds dominate scoring
high clouds reduce score moderately

FWHM precision is limited:

values rounded to 0.1 arcsec
minimum realistic value ≈ 0.5"

Transparency is currently a proxy value derived from:

humidity
visibility
cloud context

Future versions may replace this with aerosol-based transparency models.

⸻

2. Sky Darkness Score

Represents background sky brightness.

Factors:

Sun altitude
Twilight state
Moon altitude
Moon illumination
Bortle class

Example conceptual model:

SkyDarknessScore =
    base_darkness_from_bortle
    - moon_brightness_penalty
    - twilight_penalty

Special rule:

Daytime → SkyDarknessScore = minimum

UI may show labels such as:

Excellent
Dark
Moderate
Bright
Daylight

Internally a numeric value is always preserved.

⸻

3. Dew Safety Score

Represents risk of dew formation.

Computed from:

temperature
dew point
dew point spread
humidity
wind (optional modifier)

Primary parameter:

dew_spread = temperature − dew_point

Example scoring:

spread > 6°C → excellent
spread 4–6°C → good
spread 2–4°C → moderate
spread < 2°C → high dew risk

UI label:

Dew Risk

Internally stored as DewSafetyScore where:

100 = safe
0   = high dew risk


⸻

4. Stability Score

Represents atmospheric stability affecting observing comfort and image steadiness.

Factors:

Wind
Humidity
Pressure trend
Temperature gradient

Example model:

StabilityScore =
    wind_factor +
    humidity_factor +
    pressure_trend_factor

Interpretation:

High stability improves:

tracking
long exposures
general observing comfort


⸻

Level 3 — Parameter Breakdown

Each category exposes its parameters for advanced users.

Example structure:

Atmosphere
    clouds_low
    clouds_mid
    clouds_high
    seeing_fwhm
    transparency_proxy

Sky Darkness
    sun_altitude
    twilight_state
    moon_altitude
    moon_illumination
    bortle_class

Dew Risk
    temperature
    dew_point
    dew_spread
    humidity

Stability
    wind_speed
    humidity
    pressure_trend
    temperature

These values are visible in advanced UI mode.

⸻

Observing Profiles

Profiles determine category weights.

Existing profiles are preserved:

Balanced
Visual
Broadband
Planetary

Example weight table:

Profile	Atmosphere	Sky Darkness	Dew Safety	Stability
Balanced	0.35	0.30	0.20	0.15
Visual	0.40	0.25	0.20	0.15
Broadband	0.30	0.45	0.15	0.10
Planetary	0.55	0.10	0.20	0.15

Explanation:
	•	Planetary prioritizes seeing
	•	Broadband prioritizes dark sky
	•	Balanced distributes weights evenly

⸻

Daytime Behaviour

Atmospheric scoring remains valid during daytime.

Rules:

Sun above horizon does NOT affect AtmosphereScore
Sun above horizon → SkyDarknessScore minimal

This allows the system to report:

excellent atmosphere
but bright sky

which is physically correct.

⸻

UI Implications

The scoring hierarchy maps directly to the UI.

Level 1

Large display:

Observing Quality


⸻

Level 2

Category indicators:

Atmosphere
Sky Darkness
Dew Risk
Stability

Each shows:

label
score (optional)


⸻

Level 3

Advanced breakdown:

parameter table
graphs
layer visualization

Accessible through matrix or inspector views.

⸻

Version Scope

Scoring v5 uses existing data sources only.

Included:

cloud layers
seeing (7Timer conversion)
humidity
wind
temperature
pressure
sun position
moon position
bortle

No new data pipelines required.

⸻

Future Improvements (v6)

Planned enhancements:

dedicated seeing data sources
aerosol / AOD transparency
jet stream correction
advanced dew model
local terrain corrections
target-specific scoring

These will require backend extensions and new data sources.

⸻

FORMULAS

# Observing Scoring Model — Version 5

## Purpose

Scoring v5 introduces a **hierarchical observing model** designed to:

- keep a **single final score** for quick interpretation
- expose **category-level scores** for understanding conditions
- allow **parameter-level transparency** for advanced users

The model uses **existing data sources only** and does not require backend changes.

---

# Scoring Hierarchy

The system is organized in three levels.

Level 1 — Observing Quality (single final score)

Level 2 — Category Scores
Atmosphere
Sky Darkness
Dew Safety
Stability

Level 3 — Parameter Breakdown
Individual physical parameters used in scoring

---

# Level 1 — Observing Quality

Observing Quality: 0–100

This is the **main score displayed in the UI**.

Purpose:

- quick decision indicator
- consistent with existing interface
- derived from category scores

Formula:

ObservingQuality =
weighted_sum(
AtmosphereScore,
SkyDarknessScore,
DewSafetyScore,
StabilityScore
)

Weights depend on the selected **observing profile**.

After calculation, the result is limited by **Observability Gate**.

---

# Observability Gate

Gate defines whether observing is physically possible.

States:

OPEN
MARGINAL
CLOSED

Gate is computed before the final score is displayed.

### CLOSED conditions

rain > threshold
snow > threshold
fog / extremely low visibility
low clouds ≥ 95%
mid clouds ≥ 95%

### MARGINAL conditions

low clouds 70–95%
precipitation probability moderate
humidity extremely high

### OPEN

No blocking conditions.

---

### Gate effect on final score

CLOSED   → ObservingQuality max = 20
MARGINAL → ObservingQuality max = 69
OPEN     → no limitation

Gate **does not modify category scores**.

---

# Level 2 — Category Scores

Each category produces a score:

0–100
100 = excellent
0   = unusable

Categories represent **independent aspects of observing conditions**.

---

# Category 1 — Atmosphere Score

Represents optical quality of the atmosphere.

Parameters:

cloud layers
seeing (FWHM)
transparency (proxy)

### Atmosphere formula

AtmosphereScore =
0.40 * CloudsScore +
0.35 * SeeingScore +
0.25 * TransparencyScore

---

## Clouds Score

Cloud layers evaluated separately.

cloud_low
cloud_mid
cloud_high

Low and mid clouds dominate.

CloudsScore =
100
- 0.6 * cloud_low
- 0.3 * cloud_mid
- 0.1 * cloud_high

Values clipped to:

0–100

High clouds reduce score moderately but do not close the gate.

---

## Seeing Score

Seeing represented as **FWHM in arcseconds**.

Input source:

7Timer seeing index (1–7)

Converted to approximate FWHM:

1 → 0.7”
2 → 0.9”
3 → 1.1”
4 → 1.4”
5 → 1.8”
6 → 2.5”
7 → 3.5”

FWHM rounded to:

0.1”

Minimum physical limit:

0.5”

Seeing score mapping:

| FWHM | Score |
|-----|-----|
| ≤0.7 | 100 |
| 0.8–1.0 | 90 |
| 1.1–1.3 | 80 |
| 1.4–1.6 | 70 |
| 1.7–2.0 | 60 |
| 2.1–2.5 | 45 |
| 2.6–3.0 | 30 |
| >3.0 | 15 |

---

## Transparency Score (Proxy)

Transparency is currently estimated from proxy indicators.

Parameters:

humidity
visibility
cloud context

Simplified model:

TransparencyScore =
100
- humidity_penalty
- visibility_penalty

Example penalties:

humidity > 90% → −25
humidity 80–90 → −15
humidity 70–80 → −5

Visibility penalty:

visibility < 5 km → −30
visibility 5–10 km → −15
visibility 10–20 km → −5

Transparency values clipped to:

0–100

Note:

This is a **proxy transparency model**.

Future versions may use aerosol optical depth.

---

# Category 2 — Sky Darkness Score

Represents **background sky brightness**.

Parameters:

sun altitude
twilight state
moon altitude
moon illumination
bortle class

---

## Base darkness from Bortle

| Bortle | Base Score |
|------|------|
| 1 | 100 |
| 2 | 95 |
| 3 | 90 |
| 4 | 80 |
| 5 | 70 |
| 6 | 55 |
| 7 | 40 |
| 8 | 25 |
| 9 | 10 |

---

## Twilight penalty

Sun altitude < −18° → 0 penalty
−18° to −12° → −20
−12° to −6° → −40
−6° to 0° → −70
Sun > 0° → SkyDarknessScore = 0

---

## Moon brightness penalty

Penalty depends on:

moon illumination
moon altitude

Example:

moon_altitude > 60° AND illumination > 75% → −45
moon_altitude > 40° AND illumination > 50% → −30
moon_altitude > 20° AND illumination > 25% → −15
moon_altitude < 10° → −5
moon below horizon → 0

Final value clipped to:

0–100

---

# Category 3 — Dew Safety Score

Represents risk of condensation on optics.

Parameters:

temperature
dew point
humidity
wind

Primary variable:

dew_spread = temperature − dew_point

Scoring:

| Spread | Score |
|------|------|
| >6°C | 100 |
| 4–6°C | 80 |
| 3–4°C | 60 |
| 2–3°C | 40 |
| 1–2°C | 20 |
| <1°C | 5 |

Wind modifier:

wind > 10 km/h → +5
wind < 2 km/h → −5

Clipped:

0–100

UI label:

Dew Risk

Internal variable:

DewSafetyScore

---

# Category 4 — Stability Score

Represents environmental stability affecting observing comfort and imaging.

Parameters:

wind
humidity
pressure trend
temperature gradient

---

## Wind component

| Wind speed | Score |
|------|------|
| <5 km/h | 100 |
| 5–10 | 85 |
| 10–15 | 70 |
| 15–20 | 50 |
| 20–30 | 30 |
| >30 | 10 |

---

## Humidity component

| Humidity | Score |
|------|------|
| <50% | 100 |
| 50–60 | 90 |
| 60–70 | 80 |
| 70–80 | 60 |
| 80–90 | 40 |
| >90 | 20 |

---

## Pressure trend component

stable pressure → 100
slow change → 80
rapid drop → 50
rapid rise → 60

---

## Stability formula

StabilityScore =
0.45 * WindScore +
0.35 * HumidityScore +
0.20 * PressureTrendScore

---

# Level 3 — Parameter Breakdown

Each category exposes its parameters.

Example:

Atmosphere
cloud_low
cloud_mid
cloud_high
seeing_fwhm
transparency_proxy

Sky Darkness
sun_altitude
twilight_state
moon_altitude
moon_illumination
bortle_class

Dew
temperature
dew_point
dew_spread
humidity

Stability
wind_speed
humidity
pressure_trend
temperature

These values are visible in **advanced UI mode**.

---

# Observing Profiles

Profiles determine category weights.

Profiles preserved from current system:

Balanced
Visual
Broadband
Planetary

---

## Profile weight table

| Profile | Atmosphere | Sky Darkness | Dew Safety | Stability |
|------|------|------|------|------|
| Balanced | 0.35 | 0.30 | 0.20 | 0.15 |
| Visual | 0.40 | 0.25 | 0.20 | 0.15 |
| Broadband | 0.30 | 0.45 | 0.15 | 0.10 |
| Planetary | 0.55 | 0.10 | 0.20 | 0.15 |

Interpretation:

Planetary prioritizes seeing
Broadband prioritizes dark sky
Balanced distributes weights

---

# Daytime Behaviour

Atmosphere scoring remains valid during daytime.

Rules:

Sun above horizon DOES NOT affect AtmosphereScore
Sun above horizon → SkyDarknessScore = minimum

This allows reporting:

excellent atmosphere
but bright sky

---

# Data Sources

Scoring v5 uses existing data only.

cloud layers
seeing index (7Timer)
humidity
wind
temperature
pressure
sun position
moon position
bortle class
visibility

No backend changes required.

---

# Planned Improvements (v6)

Future enhancements may include:

dedicated seeing sources
aerosol transparency models
jet stream corrections
advanced dew modeling
terrain corrections
target-specific scoring

These require additional data pipelines.

---