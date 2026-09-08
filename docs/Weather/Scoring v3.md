# Scoring v3 — Atmosphere Quality Model
Observer Console

## Purpose

Scoring v3 defines the **atmospheric quality score** used in the Observer Console.

The score measures **only the quality of the atmosphere**, independent of astronomical geometry.

This means:

- **Sun altitude does not affect the score**
- **Moon altitude or illumination does not affect the score**

Sun and Moon are displayed in the interface as **observational context**, but they are **not part of the atmospheric scoring model**.

This separation ensures the score remains physically meaningful and avoids misleading results.

---

# 1. Conceptual Model

Scoring v3 answers the question:

How good is the atmosphere right now?

It does NOT answer:

Can astronomical observations be performed right now?

Astronomical visibility is determined by:

- Sun position
- Moon position
- twilight state

These are handled separately in the UI.

---

# 2. Score Range

score ∈ [0..100]

Score categories:

| Score | Category |
|------|-----------|
0–29 | Poor |
30–49 | Fair |
50–74 | Good |
75–100 | Excellent |

---

# 3. Atmospheric Components

The score is derived from five atmospheric parameters:

Clouds
Seeing
Transparency
Wind
Humidity

Each parameter is normalized to a **0–100 quality scale**.

---

# 4. Weighting Model

The final score is computed as a weighted sum:

Score =
0.40 × CloudQuality +
0.25 × SeeingQuality +
0.20 × TransparencyQuality +
0.10 × WindQuality +
0.05 × HumidityQuality

Weights reflect their relative impact on astronomical observing.

---

# 5. Cloud Quality

Cloud coverage is the most important parameter.

Low and mid-level clouds block the sky entirely, while high clouds degrade transparency.

Effective cloud coverage is calculated as:

effective_cloud =
0.65 × cloud_low +
0.25 × cloud_mid +
0.10 × cloud_high

Cloud quality:

CloudQuality = max(0, 100 − effective_cloud)

---

# 6. Seeing Quality

Seeing represents atmospheric turbulence affecting image sharpness.

Seeing is based on **FWHM (arcseconds)**.

Values are clamped:

0.5″ ≤ FWHM ≤ 4.0″

Values are rounded to **0.1″ precision**.

Mapping:

| FWHM | Quality |
|-----|--------|
0.5″ | 100 |
1.0″ | 90 |
1.5″ | 75 |
2.0″ | 60 |
2.5″ | 45 |
3.0″ | 30 |
4.0″ | 15 |

Intermediate values use linear interpolation.

---

# 7. Transparency Quality

Transparency measures atmospheric clarity.

It may be derived from:

- visibility
- aerosol content
- forecast transparency models

Suggested mapping using visibility:

| Visibility | Quality |
|-----------|--------|
≥ 50 km | 100 |
30–50 km | 85 |
20–30 km | 70 |
10–20 km | 50 |
5–10 km | 30 |
< 5 km | 10 |

---

# 8. Wind Quality

Wind can degrade telescope stability.

Mapping:

| Wind Speed | Quality |
|-----------|--------|
0–3 m/s | 100 |
3–6 m/s | 80 |
6–10 m/s | 55 |
>10 m/s | 30 |

---

# 9. Humidity Quality

High humidity increases dew risk and atmospheric scattering.

Mapping:

| Humidity | Quality |
|---------|--------|
<60% | 100 |
60–70% | 80 |
70–80% | 60 |
80–90% | 40 |
>90% | 20 |

---

# 10. Cloud Override Rule

Because cloud cover blocks observing entirely, heavy cloud cover imposes a hard cap.

if cloud_low ≥ 95 or cloud_mid ≥ 95:
score ≤ 20

This prevents unrealistic results such as high scores under overcast conditions.

---

# 11. Score Example

Example conditions:

cloud_low = 5
cloud_mid = 0
cloud_high = 10
FWHM = 1.4”
visibility = 45 km
wind = 2 m/s
humidity = 55%

Results:

CloudQuality ≈ 93
SeeingQuality ≈ 78
TransparencyQuality ≈ 90
WindQuality = 100
HumidityQuality = 100

Final score:

Score ≈ 87

Category:

Excellent

---

# 12. Sun and Moon Handling

Sun and Moon are **not used in scoring**.

Instead they are displayed as contextual indicators.

### Card indicators

| Condition | Indicator |
|----------|-----------|
Sun above horizon | ☀ icon |
Moon above horizon | 🌙 icon |

Optional tooltips:

Sun altitude
Moon altitude
Moon phase

---

# 13. Twilight Handling

Twilight states are shown in the **Sun row of the forecast matrix**, but do not affect score.

States:

Day
Civil twilight
Nautical twilight
Astronomical twilight
Night

These states provide **observational context only**.

---

# 14. Interface Interpretation

Under Scoring v3:

- **Score = atmospheric quality**
- **Sun row = daylight context**
- **Moon row = sky brightness context**

Example:

14:00   ☀
Score: 82
Excellent atmosphere

Meaning:

Atmosphere is excellent,
but the Sun is above the horizon.

---

# 15. Advantages

Scoring v3 provides:

- physically meaningful atmospheric quality
- separation between atmosphere and celestial geometry
- consistent score interpretation day and night
- better transparency for users
- simpler scoring logic

This model aligns with the behavior of many astronomy forecasting tools while preserving a clear and intuitive user experience.