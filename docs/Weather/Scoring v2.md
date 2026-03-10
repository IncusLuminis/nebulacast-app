# Observer Console — Observing Score Model (Scoring v2)

## Purpose

This document defines the **observing score calculation model** used in the Observer Console.

The goals of the model are:

- provide a **stable and physically plausible observing score**
- prevent **high scores under overcast conditions**
- correctly distinguish **low/mid vs high clouds**
- integrate **weather, seeing, and moon conditions**
- produce scores that **match user intuition**

The model works with existing weather JSON fields and does not require schema changes.

---

# 1. Scoring Architecture

The calculation is divided into four sequential layers:

Observability Gate
↓
Weather Quality
↓
Seeing Quality
↓
Final Hour Score

If the **Gate is CLOSED**, the final score is forced to a low value.

---

# 2. Observability Gate

The Gate determines whether observing is possible at all.

Possible states:

OPEN
MARGINAL
CLOSED

## 2.1 CLOSED Conditions

Observing is impossible when any of the following occurs:

```python
if rain_mm > 0:
    gate = "CLOSED"

elif cloud_low >= 95:
    gate = "CLOSED"

elif cloud_mid >= 95:
    gate = "CLOSED"

elif visibility_km <= 1.0:
    gate = "CLOSED"

Meaning:
	•	rain closes the sky
	•	low or mid clouds above 95% indicate overcast
	•	extremely poor visibility indicates fog or heavy haze

High clouds do not close the gate.

⸻

2.2 MARGINAL Conditions

The sky is usable but degraded.

elif cloud_low >= 70:
    gate = "MARGINAL"

elif cloud_mid >= 70:
    gate = "MARGINAL"

elif cloud_high >= 80:
    gate = "MARGINAL"

elif visibility_km <= 5.0:
    gate = "MARGINAL"

Meaning:
	•	partial low/mid cloud layers
	•	dense cirrus coverage
	•	significant haze

⸻

3. Cloud Model

Cloud impact is computed using a layer-weighted model.

3.1 Effective Cloud Coverage

effective_cloud =
    0.65 × cloud_low +
    0.25 × cloud_mid +
    0.10 × cloud_high

Interpretation:

Layer	Weight
Low clouds	dominant
Mid clouds	moderate
High clouds	weak

Low clouds affect transparency the most.

⸻

3.2 Cirrus Blanket Penalty

High clouds require an additional penalty because a dense cirrus layer can cover the entire sky.

cloud_high ≥ 95 → penalty 20
cloud_high ≥ 85 → penalty 15
cloud_high ≥ 70 → penalty 10
cloud_high ≥ 50 → penalty 5

This prevents unrealistic scores such as:

100% cirrus → score 85


⸻

4. Weather Quality Score

Weather quality is derived from four factors:

clouds
visibility
wind
moon brightness

All components are normalized to 0–100.

⸻

4.1 Cloud Quality

cloud_q = 100 − effective_cloud

Example:

Effective Cloud	Cloud Quality
10%	90
50%	50
80%	20


⸻

4.2 Visibility Quality

visibility ≥ 20 km → 100
10–20 km → 80
5–10 km → 60
2–5 km → 35
<2 km → 10

This captures haze and mist conditions.

⸻

4.3 Wind Quality

wind ≤ 3 m/s → 100
3–6 m/s → 80
6–10 m/s → 55
>10 m/s → 30

Wind mainly affects telescope stability.

⸻

4.4 Moon Brightness Factor

The moon affects deep sky visibility when above the horizon.

moon_alt ≤ 0 → moon_q = 100
moon_alt > 0 → moon_q = 100 − 0.7 × moon_illumination

Example:

Illumination	Moon Score
20%	86
50%	65
90%	37


⸻

4.5 Base Weather Score

weather_base =
    0.45 × cloud_q +
    0.20 × visibility_q +
    0.15 × wind_q +
    0.20 × moon_q


⸻

4.6 Apply Cirrus Penalty

weather_score = weather_base − cirrus_penalty

Clamped to range:

0–100


⸻

5. Seeing Quality Score

Seeing quality is based on FWHM (arcseconds).

The value is clamped and rounded:

fwhm = clamp(fwhm_arcsec, 0.5, 4.0)
fwhm = round(fwhm, 1)


⸻

5.1 FWHM Mapping

FWHM	Score
0.5”	100
1.0”	90
1.5”	75
2.0”	60
2.5”	45
3.0”	30
4.0”	15

Intermediate values use linear interpolation.

If FWHM is unavailable, fallback:

seeing_score = seeing.score


⸻

6. Solar Context

The solar altitude defines three illumination regimes.

Sun altitude	State
≤ −18°	Night
−18° to 0°	Twilight

0° | Day |

Each state applies a multiplier:

night → 1.00
twilight → 0.75
day → 0.20

This prevents daytime hours from receiving high observing scores.

⸻

7. Final Hour Score

For an OPEN or MARGINAL gate:

hour_raw =
    weather_weight × weather_score +
    seeing_weight × seeing_score

Default Balanced profile:

0.70 weather
0.30 seeing

Then apply solar factor:

hour_score = hour_raw × solar_factor


⸻

8. Profile Variants

Different observing modes can change weights.

Profile	Weather	Seeing
Balanced	0.70	0.30
Visual	0.85	0.15
Astrophotography	0.90	0.10
Planetary	0.45	0.55


⸻

9. Score Caps

To avoid unrealistic results several caps are applied.

9.1 CLOSED Gate

hour_score ≤ 20

9.2 MARGINAL Gate

hour_score ≤ 69

9.3 Dense Cirrus Blanket

cloud_high ≥ 95 → hour_score ≤ 60


⸻

10. Expected Behavior

Examples.

Case 1 — Clear Sky

cloud_low = 0
cloud_mid = 0
cloud_high = 5
seeing = 1.0"
moon below horizon

Result:

Score ≈ 85–95
Gate = OPEN


⸻

Case 2 — Dense Cirrus Layer

cloud_high = 98
cloud_low = 0
cloud_mid = 0

Result:

Score ≈ 50–60
Gate = MARGINAL


⸻

Case 3 — Overcast

cloud_low = 100

Result:

Gate = CLOSED
Score ≤ 20


⸻

Case 4 — Rain

rain_mm > 0

Result:

Gate = CLOSED
Score ≤ 10


⸻

11. Advantages of Scoring v2

This model:
	•	prevents high scores under 100% cloud cover
	•	correctly distinguishes cirrus vs stratus
	•	integrates seeing and weather
	•	handles moon interference
	•	produces scores that match visual expectations
	•	works with existing weather JSON fields

The system becomes predictable and trustworthy for observers.

