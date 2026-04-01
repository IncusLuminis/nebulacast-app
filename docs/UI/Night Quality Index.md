Night Quality Index (NQI)

Implementation Specification

This feature introduces a second scoring layer for the weather/observing experience: a night-level decision metric that summarizes the overall usefulness of the current or upcoming night, instead of repeating the existing hourly score. It must be implemented as an additive feature only: no renaming of existing fields, no schema rewrites, no refactoring mixed into feature work, and all new time fields must use strict UTC with Z suffix. New fields are allowed, and new generators or new JSON datasets are allowed.  ￼  ￼

1. Objective

Add a Night Quality Index (NQI) for the current or upcoming night.

The NQI is intended for the top summary panel, not for the hourly cards.

It answers:

How good is this night overall for observing?

The NQI must be clearly different from the existing hourly 0–100 score.

⸻

2. Problem Statement

The current hourly score is useful for detailed inspection because it changes hour by hour and reflects instantaneous or near-instantaneous conditions.

It is not sufficient for the top summary layer because a simple average of hourly scores hides structure. Two nights with the same average can be operationally very different:
	•	one night may have a short excellent window and poor conditions otherwise
	•	another night may be consistently decent for many hours

Therefore, the top panel needs a decision-oriented summary metric, not a direct reuse of the hourly score.

⸻

3. Core Principle

Introduce two distinct score types:

3.1 Instant Score

Existing score.
	•	range: 0–100
	•	purpose: current hour / detailed timeline / cards / widget internals
	•	already used in hourly views

3.2 Night Quality Index (NQI)

New score.
	•	range: 0.0–10.0
	•	purpose: overall night usefulness
	•	used in top summary panel
	•	computed over the whole night window

The NQI must not be a simple linear average of hourly scores.

⸻

4. Time Scope

The NQI must be computed over the current night window only:

local sunset → next local sunrise

If the current time is before local sunrise, the active night is still the previous sunset → current sunrise interval.

If the current time is after sunrise and before sunset, the NQI should refer to the upcoming night.

Internally, newly introduced timestamps must use canonical UTC field names and UTC Z formatting, while local time may be derived for display.  ￼

⸻

5. Output Model

Add a new additive block to the weather/night summary JSON.

Recommended structure:

{
  "night_summary": {
    "generated_at": "2026-04-01T03:50:00Z",
    "start_utc": "2026-04-01T17:12:00Z",
    "end_utc": "2026-04-02T04:48:00Z",
    "nqi": {
      "balanced": {
        "value": 8.4,
        "class": "good"
      },
      "visual": {
        "value": 7.8,
        "class": "good"
      },
      "broadband": {
        "value": 6.1,
        "class": "usable"
      },
      "planetary": {
        "value": 8.9,
        "class": "excellent"
      }
    },
    "avg_score": {
      "balanced": 90,
      "visual": 84,
      "broadband": 71,
      "planetary": 93
    },
    "best_window": {
      "start_utc": "2026-04-01T18:00:00Z",
      "end_utc": "2026-04-01T23:00:00Z"
    },
    "components": {
      "balanced": {
        "median_score_norm": 0.82,
        "clear_fraction": 0.79,
        "best_window_norm": 0.83,
        "bad_time_fraction": 0.12,
        "stability_score": 0.74,
        "penalties": {
          "dew": 0.05,
          "wind": 0.02,
          "moon": 0.00
        }
      }
    }
  }
}

This must be additive only. Existing data structures must remain intact. Extra fields should be added safely, and additional data should remain safe for frontend compatibility.  ￼  ￼

⸻

6. NQI Semantics

The NQI is a night utility score, not a physics score and not a direct atmospheric average.

It is intended to support decisions such as:
	•	is this night worth observing at all
	•	is the night broadly usable or only briefly usable
	•	how strong is the observing opportunity across the whole night

It should reward:
	•	longer usable intervals
	•	stable conditions
	•	low cloud burden
	•	low disruption from dew / wind
	•	strong best observing window

It should penalize:
	•	fragmented good periods
	•	long bad intervals
	•	unstable conditions
	•	severe dew or wind problems
	•	profile-relevant moon interference, where applicable

⸻

7. Inputs

The NQI must be derived from existing weather and scoring outputs, not from a new unrelated pipeline.

Required inputs per time bin over the night window:
	•	hourly or sub-hourly existing score for selected profile
	•	cloud-related metrics
	•	wind metric
	•	dew / humidity / dew safety metric
	•	moon-related data where relevant
	•	time bins covering the whole night

Optional inputs:
	•	seeing / transparency / sky darkness, if already available in the existing scoring model
	•	precipitation, if present and reliable

No existing ranking layer should be rewritten to support this. The ranking contract must remain independent from new fields, and feature work must remain additive.  ￼

⸻

8. Profiles

The NQI must be computed separately for the same existing observing profiles already used in the UI:
	•	balanced
	•	visual
	•	broadband
	•	planetary

The top panel should switch the displayed NQI when the profile switch changes.

⸻

9. Computation Model

9.1 General Rule

Compute NQI from several normalized night-level components in the range [0..1], then convert to [0.0..10.0].

Do not use plain arithmetic mean of hourly scores as the final NQI.

⸻

9.2 Required Components

A. Median Score Component

Purpose: represent the typical quality of the night without overreacting to outliers.

median_score_norm = median(hourly_score_profile) / 100

Use median, not mean.

⸻

B. Clear Fraction Component

Purpose: measure how much of the night is reasonably usable from a cloud perspective.

Define a “clear enough” threshold using existing cloud/gate logic.
Example implementation rule:
	•	bin counts as clear-enough if gate is not closed
	•	or if cloud burden stays below the profile’s threshold

Then compute:

clear_fraction = usable_bins / total_bins


⸻

C. Best Window Component

Purpose: reward nights that have a strong continuous useful interval.

Compute the best continuous window according to the selected profile’s score, then normalize by duration and score strength.

Example normalization:

best_window_norm = min(1.0, best_window_hours / target_hours) * peak_window_quality

Where:
	•	target_hours may be 4.0
	•	peak_window_quality is normalized from the mean score within that window

⸻

D. Bad Time Fraction Component

Purpose: penalize nights dominated by poor conditions.

Define “bad” bins using existing gate or a low-score threshold.

Example:

bad_time_fraction = bad_bins / total_bins

This must reduce NQI rather than improve it.

⸻

E. Stability Component

Purpose: distinguish steady nights from erratic nights.

Compute score volatility over the night.

Example implementation:

stability_score = 1.0 - normalized_stddev(hourly_score_profile)

Higher stability means smoother, more reliable conditions.

⸻

F. Penalty Components

Purpose: apply additional domain-specific penalties.

Required penalties:
	•	dew penalty
	•	wind penalty

Optional penalty:
	•	moon penalty, only where relevant by profile

Penalties must be bounded and must not dominate the score unless conditions are genuinely severe.

⸻

9.3 Recommended Formula

Recommended baseline formula:

raw_nqi_norm =
    0.25 * median_score_norm +
    0.25 * clear_fraction +
    0.20 * best_window_norm +
    0.15 * (1.0 - bad_time_fraction) +
    0.15 * stability_score
    - dew_penalty
    - wind_penalty
    - moon_penalty_optional

Then:

nqi = clamp(raw_nqi_norm, 0.0, 1.0) * 10.0

Round to one decimal place for display.

This formula is the v1 baseline. Claude may tune thresholds, but should not change the overall structure unless the implementation clearly documents why.

⸻

10. Classification Bands

Map NQI to a qualitative class.

Recommended classes:
	•	0.0 – <3.0 → poor
	•	3.0 – <5.0 → marginal
	•	5.0 – <7.0 → usable
	•	7.0 – <9.0 → good
	•	9.0 – 10.0 → excellent

Store both:
	•	numeric value
	•	class string

Example:

{
  "value": 8.4,
  "class": "good"
}


⸻

11. Relationship to Existing Avg Score

The top panel may continue to show an average 0–100 score if useful, but it must be treated as a secondary metric.

Rule
	•	avg_score answers: “how strong were conditions on average”
	•	nqi answers: “how useful was this night overall”

Both may coexist, but NQI is the new primary summary metric.

⸻

12. UI Requirements

12.1 Top Panel

Add a night-level summary field:

Night Quality
8.4 / 10
Good

The profile switch must update:
	•	NQI value
	•	NQI class
	•	best observing window
	•	any profile-sensitive explanatory text if present

⸻

12.2 Explanatory Text

The text summary should explain the NQI, not duplicate raw metrics.

Examples:

Good night:

Mostly clear and stable conditions are expected through most of the night.
Best observing conditions are concentrated between 20:00 and 01:00.

Weak night:

Conditions are fragmented, with extended cloudy periods and only short usable intervals.
Observing is possible, but the night is not broadly favorable.

The text generator should remain deterministic and template-based.

⸻

13. Backend Placement

Recommended implementation path:
	•	keep existing hourly scoring generator unchanged
	•	add a new reusable computation module
	•	call it from the night summary / weather summary generation step

Recommended code location:

services/sky/pipelines/lib/night_quality.py

or equivalent existing shared library location, because reusable logic should live under the shared pipeline library rather than inside one-off generators.  ￼

Recommended public function:

def compute_nqi(
    bins: list[dict],
    profile: str,
    thresholds: dict | None = None,
) -> dict:
    ...

Recommended return shape:

{
    "value": 8.4,
    "class": "good",
    "components": {
        "median_score_norm": 0.82,
        "clear_fraction": 0.79,
        "best_window_norm": 0.83,
        "bad_time_fraction": 0.12,
        "stability_score": 0.74,
        "penalties": {
            "dew": 0.05,
            "wind": 0.02,
            "moon": 0.00,
        },
    },
}


⸻

14. Time and Field Naming Rules

All new fields introduced by this feature must follow the existing UTC contract:
	•	UTC is canonical
	•	use YYYY-MM-DDTHH:MM:SSZ
	•	use canonical names like generated_at, start_utc, end_utc
	•	local display values may be derived later in the UI or in derived display fields  ￼  ￼

Do not introduce custom time formats in the new JSON.

⸻

15. Non-Goals

This feature must not:
	•	replace the hourly score
	•	refactor the current scoring engine
	•	alter existing widget card semantics
	•	change old field names
	•	change legacy JSON structure
	•	introduce LLM-based text generation
	•	redesign the whole weather widget

⸻

16. Acceptance Criteria

The feature is complete when:
	1.	A new NQI is computed for the active night window for all four profiles.
	2.	NQI is in the range 0.0–10.0.
	3.	NQI is not implemented as plain average hourly score.
	4.	A qualitative class is returned for each profile.
	5.	Existing hourly scores remain unchanged.
	6.	Existing JSON outputs remain backward compatible.
	7.	New time fields use canonical UTC naming and Z formatting.
	8.	The top panel can display NQI and switch it per profile.
	9.	The explanatory text can reference the overall quality of the night using deterministic rules.
	10.	No unrelated refactors are introduced.  ￼  ￼

⸻

17. Recommended Implementation Order

Step 1: implement compute_nqi() in shared backend library.
Step 2: add night_summary.nqi block to the generated summary JSON.
Step 3: wire the top panel to render NQI and class.
Step 4: update the text summary generator to explain NQI in human-readable terms.
Step 5: validate several representative nights:
	•	one short excellent window night
	•	one stable medium-quality night
	•	one fragmented cloudy night
	•	one moon-penalized night

⸻

18. Developer Notes for Claude

Use the current hourly score as one input, not as the whole answer.

Prefer robust statistics:
	•	median over mean
	•	bounded penalties
	•	normalized components
	•	explicit clamping

Keep all additions incremental and reversible.

Do not rename or move existing fields unless absolutely required, and if anything must be added, add it as a new safe block rather than mutating current structures. That matches the current project contract and keeps frontend stability intact.  ￼  ￼