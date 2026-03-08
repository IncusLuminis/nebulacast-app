Ниже итоговая спецификация для Scoring Model v5 в части категорий, параметров и explainable-расчёта.
Она опирается на исходную иерархию v5 — Observing Quality → Category Scores → Parameter Breakdown — но фиксирует более строгую и прозрачную механику нормализации и расчёта, чтобы UI можно было объяснить без “скрытой магии”.  ￼

⸻

Observing Scoring Model v5 — Final Parameter & Category Spec

1. Purpose

The scoring system must be:
	•	physically meaningful
	•	monotonic
	•	explainable to the user
	•	verifiable directly in the UI

The user must always be able to read any score as:

physical value
→ normalized score (0..100)
→ parameter weight inside category
→ category raw score (0..100)
→ category weight
→ final contribution

No negative internal values are allowed in category scoring.
All parameter subscores and category raw scores must remain in the range:

0..100

This is the core rule of v5 explainability.

⸻

2. Scoring Hierarchy

Level 1 — Final Score

Observing Quality = sum(category contributions)

Level 2 — Categories
	•	Atmosphere
	•	Sky Darkness
	•	Dew Safety
	•	Stability

Each category has:
	•	raw score 0..100
	•	category weight
	•	contribution to final score

Level 3 — Parameters

Each category is calculated from normalized parameter scores 0..100.

⸻

3. Final Score Formula

ObservingQuality =
    Atmosphere_raw   * W_atmosphere
  + SkyDarkness_raw  * W_skydarkness
  + DewSafety_raw    * W_dewsafety
  + Stability_raw    * W_stability

Where category weights depend on the selected observing profile.
Profiles and category-weight logic remain aligned with the v5 scoring model.  ￼

Example profile weights

Balanced:

W_atmosphere   = 0.35
W_skydarkness  = 0.30
W_dewsafety    = 0.20
W_stability    = 0.15

Constraint:

sum(category weights) = 1.0

Therefore final score is always:

0..100


⸻

4. Gate Logic

Final score and observability are separate concepts.

Score answers

How good are the conditions?

Gate answers

Can observing happen now?

Gate states:
	•	OPEN
	•	MARGINAL
	•	CLOSED

Required Gate rules

Sun altitude > -6°         → CLOSED (Daytime / bright twilight)
Sun altitude -6°..-12°     → MARGINAL
Sun altitude < -12°        → OPEN

Additional closing conditions may include:
	•	heavy precipitation
	•	very low visibility / fog
	•	low or mid clouds above blocking threshold

Gate does not recalculate category scores.
It is an observing-availability state layered on top of score.
This preserves physically valid high atmosphere quality even when observing is impossible.  ￼

⸻

5. Category Specifications

5.1 Atmosphere

Meaning

Represents optical quality of the atmosphere for observing.

Inputs
	•	clouds_low_pct
	•	clouds_mid_pct
	•	clouds_high_pct
	•	seeing_fwhm_arcsec
	•	transparency_km or transparency_proxy_score

Formula

Atmosphere_raw =
    Clouds_score        * 0.40
  + Seeing_score        * 0.30
  + Transparency_score  * 0.30

Constraint:

0.40 + 0.30 + 0.30 = 1.00

So:

Atmosphere_raw ∈ [0..100]


⸻

5.1.1 Clouds Score

Clouds are treated as a weighted penalty by layer.

Low clouds block strongest, then mid, then high.

Layer weights

low  = 0.60
mid  = 0.30
high = 0.10

Formula

cloud_penalty =
    0.60 * low_cloud_pct
  + 0.30 * mid_cloud_pct
  + 0.10 * high_cloud_pct

Clouds_score = 100 - cloud_penalty

Clamp:

Clouds_score = min(100, max(0, Clouds_score))

Examples

0 / 0 / 0      → penalty 0   → score 100
0 / 50 / 20    → penalty 17  → score 83
100 / 0 / 0    → penalty 60  → score 40
0 / 100 / 0    → penalty 30  → score 70
0 / 0 / 100    → penalty 10  → score 90
100/100/100    → penalty 100 → score 0


⸻

5.1.2 Seeing Score

Seeing is represented by FWHM in arcseconds.

Lower FWHM = better.

Recommended mapping

FWHM	Seeing_score
≤0.7	100
0.8–1.0	95
1.1–1.3	90
1.4–1.6	85
1.7–2.0	75
2.1–2.5	60
2.6–3.0	40
>3.0	20

If source data comes as a seeing index, it must first be converted to approximate FWHM, as already outlined in v5.  ￼

⸻

5.1.3 Transparency Score

Transparency must also be normalized to 0..100.

If a direct physical metric is available, use it.
If only proxy data is available, normalize from visibility / humidity / haze.

Recommended simple mapping by visibility

Visibility	Transparency_score
≥50 km	100
40 km	90
30 km	80
20 km	65
10 km	45
5 km	25
<5 km	10

If proxy mode is used, the UI must still expose a normalized score and absolute source value.

⸻

5.2 Sky Darkness

Meaning

Represents how dark the sky is for observing.

Important semantic rule:

0   = bright sky / daylight
100 = fully dark sky

This category must never use negative penalties in UI-facing breakdown.

Inputs
	•	sun_altitude_deg
	•	twilight_state
	•	moon_altitude_deg
	•	moon_illum_pct
	•	bortle_class

Formula

SkyDarkness_raw =
    SolarDarkness_score * 0.55
  + MoonDarkness_score  * 0.25
  + BortleDarkness_score* 0.20

Constraint:

0.55 + 0.25 + 0.20 = 1.00


⸻

5.2.1 Solar Darkness Score

This replaces the confusing Daylight = -70 model.

Recommended mapping

Solar state	Sun altitude	SolarDarkness_score
Daylight	> 0°	0
Civil twilight	0° to -6°	25
Nautical twilight	-6° to -12°	50
Astronomical twilight	-12° to -18°	75
Full astronomical darkness	< -18°	100

This is the required normalization rule for explainable UI.

⸻

5.2.2 Moon Darkness Score

This describes how little the Moon harms darkness.

Higher score = darker sky.

Recommended rule
If Moon below horizon:

MoonDarkness_score = 100

If Moon above horizon, reduce score using altitude + illumination.

Example heuristic

Moon condition	MoonDarkness_score
below horizon	100
low altitude, low phase	85
low altitude, bright phase	70
mid altitude, low phase	70
mid altitude, bright phase	45
high altitude, bright phase	20

The exact lookup can be tuned, but output must remain 0..100.

⸻

5.2.3 Bortle Darkness Score

Map Bortle directly to darkness quality.

Bortle	BortleDarkness_score
1	100
2	95
3	90
4	80
5	65
6	50
7	35
8	20
9	10

This keeps compatibility with the v5 darkness logic while making it monotonic and explicit.  ￼

⸻

5.3 Dew Safety

Meaning

Represents how safe optics are from dew formation.

Inputs
	•	temperature_c
	•	dew_point_c
	•	humidity_pct
	•	wind_kmh or wind_ms

Formula

DewSafety_raw =
    DewSpread_score * 0.80
  + DewWind_score   * 0.20

Constraint:

0.80 + 0.20 = 1.00


⸻

5.3.1 Dew Spread Score

Primary variable:

dew_spread = temperature - dew_point

Higher spread = safer.

Mapping

Spread	DewSpread_score
>6°C	100
4–6°C	85
3–4°C	70
2–3°C	50
1–2°C	25
<1°C	5

This follows the spirit of v5 dew-risk logic but keeps score normalized.  ￼

⸻

5.3.2 Dew Wind Score

Light wind can reduce local condensation risk somewhat.

Recommended mapping

Wind	DewWind_score
0–2 km/h	60
3–8 km/h	85
9–15 km/h	100
>15 km/h	85

This modifier must stay secondary.

⸻

5.4 Stability

Meaning

Represents steadiness and general observing comfort.

Inputs
	•	wind_speed_kmh
	•	humidity_pct
	•	pressure_trend_hpa_per_6h

Formula

Stability_raw =
    WindStability_score     * 0.45
  + HumidityStability_score * 0.35
  + PressureTrend_score     * 0.20

Constraint:

0.45 + 0.35 + 0.20 = 1.00

This matches the conceptual v5 structure while making it explicitly normalized.  ￼

⸻

5.4.1 Wind Stability Score

Lower wind is generally better for stability.

Wind speed	WindStability_score
<5 km/h	100
5–10	90
10–15	80
15–20	65
20–30	40
>30	15


⸻

5.4.2 Humidity Stability Score

Lower-to-moderate humidity usually supports better stability and comfort.

Humidity	HumidityStability_score
<50%	100
50–60	90
60–70	80
70–80	65
80–90	40
>90	20


⸻

5.4.3 Pressure Trend Score

Stable pressure is preferable.

Pressure change / 6h	PressureTrend_score
stable (±0.5 hPa)	100
slow change (±1.5 hPa)	85
moderate change (±3 hPa)	65
strong change (>3 hPa)	40


⸻

6. Explainability Rules for UI

6.1 Category row format

Each category must be readable as:

Category_raw × Category_weight = Contribution

Example:

Atmosphere   81 × 0.35 = 28

6.2 Parameter row format

Each parameter inside category must be readable as:

Absolute value   → Normalized score   × Parameter weight = Points

Example:

Seeing   1.5"   → 85   × 0.30 = 26

6.3 Clouds row format

Clouds must show all three layers explicitly.

Example:

Clouds   0 / 50 / 20 %   → 83   × 0.40 = 33

Optional expanded formula:

Penalty = 0.60×0 + 0.30×50 + 0.10×20 = 17
Clouds_score = 100 - 17 = 83

This formula may be shown in tooltip or expanded details, but main row must stay compact.

6.4 No hidden negative values

User-facing inspector must never show:
	•	negative daylight score
	•	negative moon penalty
	•	raw intermediate values outside 0..100

All visible subscores must stay normalized.

⸻

7. Example Full Calculation

Example inputs

Clouds low/mid/high = 0 / 50 / 20
Seeing = 1.5"
Transparency = 50 km

Sun altitude = -8°
Moon below horizon
Bortle = 5

Temperature = 13°C
Dew point = 3.6°C
Wind = 8 km/h

Humidity = 53%
Pressure trend = +0.7 hPa / 6h

Atmosphere

Clouds_score        = 83
Seeing_score        = 85
Transparency_score  = 100

Atmosphere_raw =
    83*0.40 + 85*0.30 + 100*0.30
  = 33.2 + 25.5 + 30
  = 88.7 → 89

Contribution = 89 * 0.35 = 31

Sky Darkness

SolarDarkness_score  = 50
MoonDarkness_score   = 100
BortleDarkness_score = 65

SkyDarkness_raw =
    50*0.55 + 100*0.25 + 65*0.20
  = 27.5 + 25 + 13
  = 65.5 → 66

Contribution = 66 * 0.30 = 20

Dew Safety

dew_spread = 13 - 3.6 = 9.4°C
DewSpread_score = 100
DewWind_score   = 85

DewSafety_raw =
    100*0.80 + 85*0.20
  = 80 + 17
  = 97

Contribution = 97 * 0.20 = 19

Stability

WindStability_score     = 90
HumidityStability_score = 90
PressureTrend_score     = 85

Stability_raw =
    90*0.45 + 90*0.35 + 85*0.20
  = 40.5 + 31.5 + 17
  = 89

Contribution = 89 * 0.15 = 13

Final

ObservingQuality = 31 + 20 + 19 + 13 = 83

If Gate is CLOSED because of daylight, the UI must show:

Score: 83
Gate: CLOSED — Daytime

not OPEN.

⸻

8. Final Rules to Freeze

Must keep
	•	all visible parameter scores normalized to 0..100
	•	all category raw scores normalized to 0..100
	•	parameter weights inside category summing to 1.0
	•	category weights summing to 1.0
	•	category line shown as raw × weight = contribution
	•	parameter line shown as value → score × weight = points

Must remove
	•	negative daylight penalties in inspector
	•	ambiguous mixed units like 20/300 = 0.0667 in main UI
	•	unexplained hidden clamp logic in user-facing view

⸻

9. Minimal UI Text Pattern

Recommended inspector presentation:

> Atmosphere      89 × 0.35 = 31
  Clouds          0 / 50 / 20 %   → 83   × 0.40 = 33
  Seeing          1.5"            → 85   × 0.30 = 26
  Transparency    50 km           → 100  × 0.30 = 30

> Sky Darkness    66 × 0.30 = 20
  Sun altitude    -8°             → 50   × 0.55 = 28
  Moon            below horizon   → 100  × 0.25 = 25
  Bortle          5               → 65   × 0.20 = 13

> Dew Safety      97 × 0.20 = 19
  Spread          9.4°C           → 100  × 0.80 = 80
  Wind            8 km/h          → 85   × 0.20 = 17

> Stability       89 × 0.15 = 13
  Wind            8 km/h          → 90   × 0.45 = 41
  Humidity        53%             → 90   × 0.35 = 32
  Pressure trend  +0.7 hPa/6h     → 85   × 0.20 = 17


  where → 85 means a bar from 0 to 100 and 85% labeled in its center
