Patch List — Dark Sky Block Logic Fix

Goal

Make the current dark sky / sky darkness block logically consistent without changing the rest of the scoring system.

Do not refactor the whole widget.
Do not redesign unrelated scores.
Only fix this block’s local model and UI semantics.

⸻

1. Keep the score direction

Do not invert the final metric.

This block must follow the same convention as the rest of the system:

higher = better

Meaning:

0   = poor dark-sky conditions
100 = excellent dark-sky conditions


⸻

2. Rename the top-level metric

Replace the current ambiguous label with:

Dark Sky Level

Do not use:
	•	Sky Brightness
	•	Sky Quality

Reason:
	•	Sky Brightness would invert the direction
	•	Sky Quality is already used elsewhere
	•	Dark Sky Level matches the actual semantics

⸻

3. Rename the Daylight sub-factor

Replace:

Daylight

with:

Sun

or, if a slightly more explicit internal label is needed:

Sun impact

Important

This factor must no longer represent “presence of daylight”.

It must represent:

contribution of solar geometry to dark sky conditions


⸻

4. Fix Sun normalization

Current logic must be adjusted so that:
	•	Sun above horizon → 0
	•	Sun at twilight → intermediate value
	•	Sun below astronomical twilight threshold → 100

Required interpretation

sun_component = contribution to dark sky

Not:

daylight amount

Practical rule

Use Sun altitude:
	•	alt >= 0° → 0
	•	alt <= -18° → 100
	•	between 0° and -18° → interpolate linearly

⸻

5. Replace binary Moon logic

Replace the current binary logic like:

Moon below horizon = 100%

with a continuous moon-impact model.

Moon must depend on:
	•	illumination fraction
	•	altitude / visibility above horizon

Required interpretation

moon_component = contribution to dark sky

Behavioral expectations
	•	Moon below horizon → close to 100
	•	Thin crescent low above horizon → still high
	•	Full Moon high in the sky → low

Minimal acceptable implementation

Even a simple approximation is fine, as long as it is continuous and not binary.

⸻

6. Rename the Moon UI label

Do not display:

Moon below horizon

Display instead:

Moon

And show human-readable meaning such as:
	•	low impact
	•	moderate impact
	•	strong impact

Optional secondary detail:
	•	illumination percent
	•	rise/set or altitude state

But the main label should describe impact on dark sky, not geometry as a raw flag.

⸻

7. Fix Bortle normalization

Treat Bortle as a static baseline contribution to dark sky conditions.

Required mapping

Normalize explicitly so that:
	•	Bortle 1 → 100
	•	Bortle 9 → 0

Formula:

bortle_component = (9 - bortle) / 8 * 100

If the project uses a different Bortle range internally, adapt consistently, but preserve:

darker site = higher value


⸻

8. Rename the Bortle UI label

Do not show:

Bortle 5 = 65%

Show instead:

Light pollution: moderate
Bortle 5

If numeric contribution is shown, keep it secondary.

The primary user-facing meaning should be descriptive, not a mysterious percent.

⸻

9. Keep the existing weighted-sum structure

Do not redesign the aggregation structure.

Keep the same shape:

dark_sky_level =
  sun_component    * w_sun +
  moon_component   * w_moon +
  bortle_component * w_bortle

Existing weights may remain unchanged unless there is an obvious bug.

Current weight pattern is acceptable as a first pass.

⸻

10. Change the UI breakdown semantics

All rows in the breakdown must follow one rule:

every sub-factor is a positive contribution to dark sky conditions

That means no mixed semantics like:
	•	one row meaning “light present”
	•	another row meaning “darkness”
	•	another row meaning “penalty”

Everything must point in the same direction.

⸻

11. Change the display format of the breakdown

Replace confusing rows like:

Daylight 0% × 0.55
Moon below horizon 100% × 0.25
Bortle 65% × 0.20

with rows like:

Sun: astronomical night          100 × 0.55
Moon: low impact                  82 × 0.25
Light pollution: moderate         50 × 0.20

Rule

Show:
	1.	human-readable state
	2.	numeric contribution

Not the other way around.

⸻

12. Do not touch anything else

This patch must not change:
	•	other scoring categories
	•	NQI
	•	top-level weather score
	•	card layout outside this block
	•	pipelines unrelated to this block
	•	existing time model
	•	existing JSON contract structure unless adding safe derived fields is necessary

This is a local consistency fix only.

⸻

13. Acceptance criteria

The patch is complete when:
	1.	The top-level block is labeled Dark Sky Level.
	2.	The final score still follows higher = better.
	3.	Daylight is removed as a sub-factor label and replaced by Sun.
	4.	Sun contribution is inverted correctly:
	•	daytime = low score
	•	dark night = high score
	5.	Moon logic is continuous, not binary.
	6.	Bortle is explicitly normalized so darker sites score higher.
	7.	All three sub-factors point in the same semantic direction.
	8.	The UI breakdown reads naturally in human terms.
	9.	Nothing outside this block is refactored.

⸻

14. One-line implementation summary

Make Sun, Moon, and Bortle all contribute positively to dark-sky conditions, then present them with human-readable labels under a single metric called “Dark Sky Level”.