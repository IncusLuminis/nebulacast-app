# Scoring v4 — Atmosphere Quality + Profiles Model
Observer Console

## Purpose

Scoring v4 defines the atmospheric scoring architecture for the Observer Console.

The model is designed to achieve four goals:

1. keep the score **physically meaningful**
2. remove **Sun / Moon / twilight** from the score itself
3. preserve **profile-based scoring**
4. avoid regression from the current functionality

Scoring v4 measures **atmospheric observing quality**, while astronomical geometry is handled separately in the UI.

This version replaces the simplified v3 proposal and restores the missing flexibility.

---

# 1. Core Principle

Scoring v4 answers:

**How good is the atmosphere for observing under the selected observing profile?**

It does **not** answer:

- whether the Sun is above the horizon
- whether the Moon is above the horizon
- whether it is twilight or full night

These are **context layers**, not score factors.

---

# 2. High-Level Architecture

Scoring v4 is split into three layers:

```text
Observability Gate
        ↓
Atmosphere Score
        ↓
Profile Score

Layer meanings

Layer	Purpose
Observability Gate	determines whether observing is blocked
Atmosphere Score	calculates pure atmospheric quality
Profile Score	adjusts weighting for observing style


⸻

3. Observability Gate

The Gate is separate from the score.

Its purpose is to determine whether conditions are effectively blocked.

Possible states:

OPEN
MARGINAL
CLOSED

3.1 CLOSED conditions

Observing is blocked if any of the following occurs:

rain_mm > 0
or snow_mm > 0
or cloud_low >= 95
or cloud_mid >= 95
or visibility_km <= 1.0

Optional future extension:

thunderstorm = true

3.2 MARGINAL conditions

Observing is degraded if any of the following occurs:

cloud_low >= 70
or cloud_mid >= 70
or cloud_high >= 80
or visibility_km <= 5.0
or humidity_pct >= 90

3.3 OPEN conditions

All other states.

3.4 Gate behavior

The Gate does not compute the score itself.

It only applies caps and labels.

Recommended caps:

if gate == "CLOSED":
    final_score <= 20

if gate == "MARGINAL":
    final_score <= 69


⸻

4. Atmosphere Score Components

The atmosphere score is derived from the following parameter groups:

4.1 Core components

These are the most important physical factors:

Clouds
Seeing
Transparency

4.2 Stability modifiers

These influence observing quality but are secondary:

Wind
Humidity
Pressure trend
Temperature / thermal stability

4.3 Gate-only components

These do not contribute points directly:

Rain
Snow
Fog / very low visibility
Thunderstorm


⸻

5. Atmospheric Parameters

5.1 Clouds

Clouds are the most important factor.

Effective cloud coverage is calculated using cloud layers:

effective_cloud =
0.65 × cloud_low +
0.25 × cloud_mid +
0.10 × cloud_high

Cloud quality:

CloudQuality = max(0, 100 − effective_cloud)

High cloud blanket penalty

To avoid unrealistically high scores under dense cirrus:

cloud_high ≥ 95 → penalty 20
cloud_high ≥ 85 → penalty 15
cloud_high ≥ 70 → penalty 10
cloud_high ≥ 50 → penalty 5

This penalty is applied after the weighted score.

⸻

5.2 Seeing

Seeing is represented using FWHM (arcseconds).

Precision policy
	•	clamp to a realistic range
	•	round to 0.1 arcsec for display
	•	use a continuous mapping for scoring

Limits:

0.5″ ≤ FWHM ≤ 4.0″

Mapping:

FWHM	SeeingQuality
0.5″	100
1.0″	90
1.5″	75
2.0″	60
2.5″	45
3.0″	30
4.0″	15

Linear interpolation is used between anchor points.

If no FWHM is available:

SeeingQuality = normalized seeing proxy / model score


⸻

5.3 Transparency

Transparency represents atmospheric clarity.

Preferred source:
	•	dedicated transparency estimate

Fallback source:
	•	visibility-based proxy

Suggested mapping using visibility:

Visibility	TransparencyQuality
≥ 50 km	100
30–50 km	85
20–30 km	70
10–20 km	50
5–10 km	30
< 5 km	10


⸻

5.4 Wind

Wind affects telescope stability and local turbulence.

Suggested mapping:

Wind Speed	WindQuality
0–3 m/s	100
3–6 m/s	80
6–10 m/s	55
>10 m/s	30


⸻

5.5 Humidity

Humidity affects dew risk and scattering.

Suggested mapping:

Humidity	HumidityQuality
<60%	100
60–70%	80
70–80%	60
80–90%	40
>90%	20


⸻

5.6 Pressure Trend

Pressure trend is treated as a stability modifier, not a primary factor.

Its role is predictive:
	•	rising pressure often indicates improving stability
	•	falling pressure often suggests degrading weather

Suggested mapping:

Pressure Trend (6h)	PressureTrendQuality
≥ +2 hPa	100
+1 to +2 hPa	80
-1 to +1 hPa	60
-2 to -1 hPa	40
< -2 hPa	20

This component should have a low weight.

⸻

5.7 Temperature / Thermal Stability

Temperature itself is not the signal; thermal stability is.

Preferred factor:
	•	temperature trend
	•	dewpoint spread
	•	local thermal gradient proxy

Suggested heuristic:

if dewpoint_spread_c < 1.0 → poor
if dewpoint_spread_c 1.0–2.0 → fair
if dewpoint_spread_c 2.0–4.0 → good
if dewpoint_spread_c > 4.0 → excellent

This acts as a small modifier, mainly to reflect condensation risk and local instability.

⸻

6. Base Atmosphere Score

Scoring v4 uses a base atmospheric model that all profiles inherit from.

Recommended base weighting:

BaseAtmosphereScore =
0.35 × CloudQuality +
0.25 × SeeingQuality +
0.20 × TransparencyQuality +
0.10 × WindQuality +
0.05 × HumidityQuality +
0.03 × PressureTrendQuality +
0.02 × ThermalQuality

Then apply:

BaseAtmosphereScore -= HighCloudPenalty

Clamp to:

0..100


⸻

7. Observing Profiles

Profiles are retained in Scoring v4.

They do not change the raw weather data.
They only change the importance of atmospheric parameters.

Supported profiles:

Balanced
Visual
Broadband
Planetary


⸻

7.1 Balanced

Purpose:
	•	general all-purpose observing

Weights:

Clouds       0.35
Seeing       0.25
Transparency 0.20
Wind         0.10
Humidity     0.05
Pressure     0.03
Thermal      0.02


⸻

7.2 Visual

Purpose:
	•	visual observing
	•	general sky usability
	•	less sensitivity to small seeing differences

Weights:

Clouds       0.40
Transparency 0.25
Wind         0.10
Seeing       0.10
Humidity     0.08
Pressure     0.04
Thermal      0.03


⸻

7.3 Broadband

Purpose:
	•	widefield / broadband imaging
	•	strong dependence on transparency and clouds

Weights:

Transparency 0.30
Clouds       0.30
Seeing       0.15
Wind         0.10
Humidity     0.07
Pressure     0.05
Thermal      0.03


⸻

7.4 Planetary

Purpose:
	•	planetary / lunar / high-resolution imaging
	•	strongest dependence on seeing and wind

Weights:

Seeing       0.40
Wind         0.20
Clouds       0.20
Transparency 0.10
Humidity     0.05
Pressure     0.03
Thermal      0.02


⸻

8. Profile Score Formula

For each profile:

ProfileScore =
Σ(parameter_quality × profile_weight)
− HighCloudPenalty

Then apply gate caps.

Final score:

FinalScore = clamp(ProfileScore, 0, 100)


⸻

9. Sun, Moon, Twilight Handling

These are explicitly excluded from the score.

They are displayed as contextual layers in the UI:
	•	Sun row in matrix
	•	Moon row in matrix
	•	card corner indicators
	•	twilight/day/night shading

Meaning:

Score = atmosphere quality
Sun/Moon = observing context

Example:

14:00   ☀
Score: 82
Excellent atmosphere

Interpretation:

The atmosphere is excellent,
but the Sun is above the horizon.

This is correct and intentional.

⸻

10. Score Categories

Recommended categories:

Score	Category
0–29	Poor
30–49	Fair
50–74	Good
75–100	Excellent

Optional profile-specific labels may be added later, but category thresholds remain shared.

⸻

11. UI Interpretation

The UI must present Scoring v4 as:
	•	atmosphere score
	•	profile-aware
	•	independent from Sun/Moon geometry

Required UI behavior
	•	Sun and Moon rows remain visible
	•	profile selector remains available
	•	score panel shows active profile
	•	if gate is CLOSED, card and panel reflect blocked conditions
	•	if gate is MARGINAL, score is capped and visually marked

⸻

12. Why Scoring v4 Replaces v3

Scoring v3 removed too much functionality.

Scoring v4 preserves the original product strengths while keeping the atmosphere model physically correct.

v4 restores:
	•	profile-based scoring
	•	pressure trend contribution
	•	thermal / temperature stability contribution
	•	precipitation as a gate condition

v4 removes only:
	•	Sun contribution to score
	•	Moon contribution to score
	•	twilight contribution to score

That was the original architectural goal.

⸻

13. Advantages

Scoring v4 provides:
	•	physically cleaner atmosphere score
	•	no regression in analytical richness
	•	support for different observing styles
	•	clear separation of score vs context
	•	future extensibility for better seeing / transparency sources

The result is a more correct and more capable scoring architecture than v3.

⸻

14. Out of Scope

The following are not required for initial v4 implementation:
	•	dedicated premium FWHM source integration
	•	advanced dew model
	•	stacked cloud profile scoring by target altitude
	•	target-specific object score coupling
	•	local topography / jet stream corrections

These may be added in later versions without changing the v4 architecture.

