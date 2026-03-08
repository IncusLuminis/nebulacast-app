# Architecture Note for v6
Observer Console

## Purpose

This note defines the architectural principles for **v6** of the observing forecast backend.

The main goal of v6 is to evolve the system from a **proxy-based weather scoring model** into a **source-agnostic astro-weather service** that can ingest multiple data providers, compute normalized parameters, derive advanced metrics, and expose stable near-real-time JSON to the UI.

---

# 1. Core Principle

v6 must avoid coupling the scoring system directly to source-specific payloads.

The architecture must strictly separate:

1. **Raw source data**
2. **Normalized parameters**
3. **Derived metrics**
4. **Scoring results**

This separation is mandatory for long-term maintainability.

---

# 2. Required Processing Layers

The backend must be organized into four layers.

```text
Raw Sources
    ↓
Normalized Parameters
    ↓
Derived Metrics
    ↓
Scoring Engine


⸻

3. Layer Definitions

3.1 Raw Sources

Raw sources are external payloads fetched from providers.

Examples:
	•	Open-Meteo
	•	7Timer
	•	NOAA GFS
	•	Copernicus CAMS
	•	Meteoblue Astronomy
	•	internal sun/moon computations

At this layer:
	•	no scoring is performed
	•	no UI-specific formatting is performed
	•	no source values are modified except parsing

Raw payloads should remain traceable for debugging.

⸻

3.2 Normalized Parameters

All external data must be converted into a single internal schema.

Example normalized fields:

{
  "time_iso": "2026-03-08T22:00:00+01:00",
  "cloud_low_pct": 12,
  "cloud_mid_pct": 4,
  "cloud_high_pct": 35,
  "wind_surface_ms": 3.2,
  "wind_300hpa_ms": 27,
  "humidity_pct": 72,
  "visibility_km": 28,
  "temperature_c": 3.2,
  "dew_point_c": 0.8,
  "pressure_hpa": 1018.4,
  "sun_alt_deg": -22.0,
  "moon_alt_deg": 17.0,
  "moon_illum_frac": 0.35,
  "bortle": 6
}

The scoring engine must consume only normalized data.

⸻

3.3 Derived Metrics

Derived metrics are physical or analytical quantities computed from normalized parameters.

Examples:
	•	effective cloud cover
	•	seeing FWHM
	•	dew spread
	•	transparency proxy
	•	sky darkness score
	•	jet stream penalty
	•	airmass
	•	moon brightness penalty
	•	pressure trend score

Derived metrics are not yet final scores.

They are intermediate explainable values used by categories and profiles.

⸻

3.4 Scoring Engine

The scoring engine computes:
	•	category scores
	•	gate state
	•	final observing quality
	•	profile-specific results

The scoring engine must not know:
	•	which provider supplied the data
	•	which raw payload format was used
	•	whether a parameter came from a fallback source

It must operate only on normalized parameters and derived metrics.

⸻

4. Provenance

Each important parameter and metric must include provenance metadata.

Example:

{
  "seeing": {
    "value": 1.4,
    "source": "7timer",
    "method": "index_to_fwhm"
  },
  "transparency": {
    "value": 72,
    "source": "open_meteo",
    "method": "visibility_proxy"
  }
}

Provenance is required for:
	•	debugging
	•	source replacement
	•	model validation
	•	UI explainability

⸻

5. Determinism and Replayability

The scoring system must be deterministic.

Given the same normalized input and profile, the backend must always return the same result.

This enables:
	•	replay on archived datasets
	•	comparison of v5 vs v6
	•	regression testing
	•	score validation against observed nights

The scoring engine must therefore be implemented as a pure transformation.

⸻

6. Source Adapters

Each external provider must be isolated behind an adapter.

Example adapter responsibilities:
	•	fetch raw payload
	•	parse response
	•	normalize values
	•	annotate provenance
	•	handle missing values and fallbacks

Recommended abstraction:

Source Adapter
    fetch()
    parse()
    normalize()

Adapters should be independent and composable.

Examples:
	•	openMeteoAdapter
	•	sevenTimerAdapter
	•	gfsAdapter
	•	camsAdapter
	•	meteoblueAdapter

⸻

7. Fallback Strategy

v6 will combine multiple data sources.

The backend must support explicit fallback rules.

Example:

Seeing:
    Meteoblue seeing
    else 7Timer-derived FWHM

Transparency:
    CAMS AOD-derived transparency
    else visibility proxy

Sky darkness:
    moon model
    else simplified moon penalty

Fallback logic must be explicit and recorded in provenance.

⸻

8. Internal JSON Contract

The backend should produce a stable hour-based bundle.

Recommended structure:

{
  "time_iso": "2026-03-08T22:00:00+01:00",
  "normalized": { ... },
  "derived": { ... },
  "scores": {
    "gate": "OPEN",
    "atmosphere": 72,
    "sky_darkness": 58,
    "dew_safety": 46,
    "stability": 74,
    "observing_quality": 66
  },
  "provenance": { ... }
}

This contract must remain stable across source upgrades.

⸻

9. Frontend Contract Rule

The frontend must not depend on raw source payloads.

The frontend should consume only:
	•	normalized values
	•	derived metrics
	•	score bundles
	•	provenance where needed for advanced views

This keeps UI independent from backend source changes.

⸻

10. Backend Runtime Recommendation

For v6, the backend may run as a near-real-time service on Cloudflare Workers or another serverless platform.

Recommended responsibilities of the runtime:
	•	fetch external source data
	•	build normalized hourly bundles
	•	compute derived metrics
	•	compute category and final scores
	•	cache current forecast windows
	•	expose JSON endpoints for the UI

This runtime becomes the canonical scoring service.

⸻

11. Language Strategy

v6 should separate research implementation from production implementation.

Recommended model:

Python

Used for:
	•	notebooks
	•	scientific prototyping
	•	validation
	•	model comparison
	•	backtesting

TypeScript

Used for:
	•	production backend
	•	source adapters
	•	normalized schemas
	•	scoring service
	•	API endpoints
	•	scheduled jobs

This allows scientific flexibility without sacrificing production robustness.

⸻

12. Testing Requirements

v6 must include tests at three levels.

Adapter tests

Validate raw → normalized conversion.

Derived metric tests

Validate metric calculations from normalized parameters.

Scoring tests

Validate category and final score outputs for fixed fixtures.

Golden datasets should be stored for replay.

⸻

13. Architectural Rule to Preserve

The most important rule for v6 is:

Do not couple scoring logic to source-specific payloads.

All growth in v6 and later versions depends on preserving this separation.

⸻

14. Expected Outcome

If implemented correctly, v6 will provide:
	•	source-agnostic scoring
	•	better physical realism
	•	stable UI contracts
	•	easier debugging
	•	safe provider replacement
	•	replayable model evolution

This architecture enables the system to grow beyond a weather widget into a real astro-weather scoring service.