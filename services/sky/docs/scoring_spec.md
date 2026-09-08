# Scoring v1 Spec (services/sky/pipelines/lib/scoring.py)

## Goal

Add a single backend module that computes three scoring models used across alert groups and produces a stable frontend contract via `alerts_now.json`:

1) **External scoring** (`external_v1`) — cross-group comparable score (already exists in `gen_alerts.py`, must be moved to `lib/scoring.py` unchanged behavior unless explicitly noted).
2) **Orbital hazard scoring** (`hazard_v1`) — “risk of collision / hazardous close approach” (new).
3) **Observational urgency scoring** (`urgency_v1`) — “how urgent/interesting to observe now” (new).

The generator `services/sky/pipelines/gen_alerts.py` stays as the orchestrator that merges per-group items into `alerts_now.json`, but scoring logic lives in `lib/scoring.py`.

Non-goals: scientific precision; this is a UX ranking scale for triage. It must be explainable (components + weights) and stable.

---

## Input datasets (examples)

- `alerts_neo.json` items (from NEO close approaches) include:
  - `meta.dist_ld`, `meta.dist_au`, `meta.moid_au`, `meta.diameter_est_km`, `meta.v_rel_kms`, `meta.h`, `meta.t_close_utc_iso`, etc.
- `alerts_risk.json` items (from JPL Sentry) include:
  - `meta.ip`, `meta.ps`, `meta.ts`, `meta.last_obs_jd`, `meta.sb_h`, plus raw payloads.
- `alerts_neocp*.json` items (from MPC NEOCP / TOCP sources) include:
  - usually only `ra_deg/dec_deg`, `mag`, `updated_utc`, and a generic `note`.

`alerts_pha.json` is currently empty but reserved for future PHA labeling and priority rules.

---

## Output contract (frontend)

`alerts_now.json` already stores scoring under `item.meta.scoring` like:

```json
"meta": {
  "scoring": {
    "version": "v1",
    "internal": {...},
    "external": {...},
    "global": {...}
  }
}
```

This spec extends it to include the two new models, without breaking existing consumers:

```json
"meta": {
  "scoring": {
    "version": "v1",
    "internal": {...},               // per-group native score
    "hazard": { ... },               // NEW: hazard_v1 model
    "urgency": { ... },              // NEW: urgency_v1 model
    "external": { ... },             // external_v1 (may reuse hazard/urgency outputs)
    "global": { ... }                // merge policy output
  }
}
```

### Rules
- All model scores are normalized to `[0..1]` (`score_norm`) and duplicated as `score_raw` in `[0..100]` with 2 decimals.
- Each model exposes `components` and `weights` so the UI can render an explainable breakdown.
- Model payloads must be compact; raw upstream payload stays in `meta.*_raw` as it is today.

---

## Module placement and API

Create: `nebulacast-app/services/sky/pipelines/lib/scoring.py`

Recommended public API (functions only; no global state):

```py
def score_external_v1(item: dict, *, observer: dict | None = None, now_utc_iso: str | None = None,
                      weights_profile: str = "default") -> dict:
    ...

def score_hazard_v1(item: dict) -> dict:
    ...

def score_urgency_v1(item: dict, *, observer: dict | None = None, now_utc_iso: str | None = None) -> dict:
    ...

def merge_global_score_v1(scoring: dict, *, pha_floor: float = 0.95) -> dict:
    ...
```

Return value for each `score_*` is a dict with a fixed schema:

```py
{
  "model": "hazard_v1",
  "components": { "moid": 0.7, "dist": 0.5, ... },   # each in [0..1]
  "weights":    { "moid": 0.35, "dist": 0.35, ... }, # sum=1.0
  "score_norm": 0.63,
  "score_raw":  63.0,
  "notes": { ... optional small debug fields ... }
}
```

---

## Model 1: External scoring (external_v1)

### Purpose
Cross-group comparable ranking layer. It should remain a stable “single number” for sorting mixed groups.

### Current location
`services/sky/pipelines/gen_alerts.py` (must be migrated into `lib/scoring.py`).

### Shape (existing)
External scoring stores:

- `model: "external_v1"`
- `features`: dict of normalized features:
  - `urgency`, `observability`, `brightness`, `hazard`, `reliability`, `novelty`, `localization`
- `weights`: weights profile (currently `default`)
- `score_norm`, `score_raw`

### Change policy
- Behavior must remain identical **unless** we explicitly switch `features.hazard` to `hazard_v1.score_norm` and `features.urgency` to `urgency_v1.score_norm`. This switch is recommended because it keeps the external model explainable and consistent.

If the switch is enabled:
- `external.features.hazard := scoring.hazard.score_norm`
- `external.features.urgency := scoring.urgency.score_norm`
- other features unchanged.

---

## Model 2: Orbital hazard (hazard_v1)

### Purpose
A UX “hazard” score that ranks:
1) PHA (if/when available)
2) confirmed risky (Sentry)
3) close approaches / small MOID
4) other NEO
5) NEOCP candidates (unknown orbit → low hazard unless flagged)

### Output
`meta.scoring.hazard` as described above.

### Inputs by group

A) `group="risk"` (JPL Sentry):
- Prefer `meta.ts` (Torino scale 0..10) if present.
- Else prefer `meta.ps` (Palermo scale, typically negative).
- Else fallback to `meta.ip` (impact probability).

B) `group="neo"` (close approaches):
- Use `meta.moid_au` when present.
- Use `meta.dist_ld` / `meta.dist_au` as “actual encounter distance”.
- Size proxy: `meta.diameter_est_km` and/or `meta.h` (absolute magnitude).
- Optional: `meta.v_rel_kms` (relative velocity).

C) `group="neocp"`:
- Orbit is unconfirmed; default hazard low.
- If future dataset provides `meta.moid_au` / preliminary orbit, it can feed the same components as NEO.

### Components (normalized [0..1])

For `risk` group:
- `torino`: `clamp(ts/10)`
- `palermo`: map `ps` from [-10..0] to [0..1] using `clamp((ps+10)/10)` (log-friendly)
- `ip`: map `log10(ip)` from [-10..-3] to [0..1] using `clamp((log10(ip)+10)/7)`

Then `hazard` uses the first available in priority order:
- `hazard_core = torino if ts else palermo if ps else ip else 0`

For `neo` group:
- `moid`: `moid_au` mapped log-scale (smaller is worse):
  - `moid_score = clamp((log10(0.05) - log10(moid_au)) / (log10(0.05) - log10(1e-4)))`
  - Typical range: 0.05 AU (safe-ish) down to 1e-4 AU (very close).
- `encounter_dist`: use `dist_ld` if present else `dist_au` mapped similarly:
  - LD mapping: 10 LD → 0, 0.1 LD → 1 (log-scale)
- `size`: use `diameter_est_km` if present, else `h`:
  - diameter: 0.02 km → 0, 1 km → 1 (log-scale)
  - H: 26 → 0, 18 → 1 (linear)
- `vrel`: 5 km/s → 0, 30 km/s → 1 (linear)

Recommended weights (sum=1):
- `moid`: 0.35
- `encounter_dist`: 0.35
- `size`: 0.20
- `vrel`: 0.10

For `neocp` group:
- default:
  - `unknown_orbit = 0.1` (constant)
  - `size_from_mag` if `mag` available: brighter = bigger likelihood to matter:
    - mag 22 → 0, mag 16 → 1 (clamp)
  - weights: unknown_orbit 0.7, size_from_mag 0.3

### PHA handling
When `alerts_pha.json` becomes populated or when an item is marked `meta.is_pha == true`:
- `hazard.score_norm = max(hazard.score_norm, 0.95)` (or via global merge `pha_floor`), and
- `hazard.notes.is_pha = true`

---

## Model 3: Observational urgency (urgency_v1)

### Purpose
Rank “what should I look at now / soon” regardless of hazard. Emphasis:
- time proximity (soonest/most relevant time)
- observability (altitude quality / above horizon)
- brightness (magnitude)
- novelty / action type (new, updated, retracted)
- localization (if uncertainties exist; for now: presence of RA/DEC)

### Output
`meta.scoring.urgency`

### Inputs
- `updated_utc`, group-specific event time fields (for NEO: `meta.t_close_utc_iso`; for risk: primary VI time if known)
- `ra_deg/dec_deg` presence (for localization)
- `mag` when present
- optional: per-item `vis.*` if any exist for alerts (if later computed)

### Components (normalized)

Recommended components:
1) `time_proximity`: based on absolute delta between `event_time` and `now`:
   - delta <= 2h → 1
   - delta >= 72h → 0
   - use smooth decay (e.g., `exp(-delta_hours / 18)`) or piecewise linear
2) `visibility`: if we have per-item visibility precomputed (future), use it; else:
   - 1 if RA/DEC present (can at least point), 0 otherwise
3) `brightness`: mag mapping (smaller mag => brighter):
   - mag <= 12 → 1
   - mag >= 22 → 0
4) `action`: `meta.action` mapping:
   - new: 1.0, updated: 0.7, other: 0.4
5) `localization`: 1 if RA/DEC present, else 0

Suggested weights:
- time_proximity 0.45
- visibility 0.20
- brightness 0.20
- action 0.10
- localization 0.05

Notes:
- For NEO close approaches, use `event_time := meta.t_close_utc_iso` if present; else `updated_utc`.
- For Sentry risk, if `meta.t_utc_iso` exists (impact time), use it; else `updated_utc`.

---

## Global merge policy (merge_v1)

### Purpose
Produce a single `meta.scoring.global.score_norm` used for final sorting.

### Proposed policy
- Start with `external.score_norm` (cross-group comparability).
- Apply PHA floor if item is PHA.
- Allow optional boosts:
  - if hazard is high (>0.8), blend in hazard: `score = max(score, 0.7*external + 0.3*hazard)`
  - if urgency is high (>0.8), blend in urgency similarly.

Keep this conservative to avoid destabilizing rankings.

Example implementation:

```py
score = external
if is_pha: score = max(score, pha_floor)
if hazard > 0.8: score = max(score, 0.7*external + 0.3*hazard)
if urgency > 0.8: score = max(score, 0.75*score + 0.25*urgency)
```

Store:
```json
"global": {
  "policy": "merge_v1",
  "pha_floor": 0.95,
  "score_norm": ...,
  "score_raw": ...
}
```

---

## Integration steps (gen_alerts.py)

1) Import from `pipelines.lib.scoring`:
   - `score_external_v1`, `score_hazard_v1`, `score_urgency_v1`, `merge_global_score_v1`
2) After loading and merging group items:
   - Compute `hazard := score_hazard_v1(item)`
   - Compute `urgency := score_urgency_v1(item, observer=?, now_utc_iso=generated_utc)`
   - Compute `external := score_external_v1(item, ...)` (optionally using hazard/urgency outputs)
   - Compute `global := merge_global_score_v1(scoring)`
3) Persist into `item.meta.scoring` keeping `internal` unchanged.
4) Ensure every item has `meta.scoring.version="v1"`.

---

## UI implications

Frontend can render:
- A compact “Global score” row
- Expandable breakdown:
  - external_v1: feature bars + weights
  - hazard_v1: components + weights
  - urgency_v1: components + weights

No extra requests; everything is inside `alerts_now.json`.

---

## Validation checklist

- `alerts_now.json` remains valid JSON; no NaN/Infinity.
- All scores are clamped to [0..1].
- Missing fields never crash scoring; they degrade gracefully.
- Ranking stable across runs (no dependence on item ordering except tie-breakers).
- `hazard_v1` for `risk` group correlates with ts/ps/ip priority.
- `urgency_v1` places near-term events above far-future events.

