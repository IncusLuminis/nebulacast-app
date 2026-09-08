# Settings page — scope, model audit, and customization strategy

R&D deliverable for [docs/UI/SPIKE: Settings.md](docs/UI/SPIKE:%20Settings.md). **No code, schema, or UI was implemented** to produce this document.

Related audits: [docs/RnD/Location-Audit.md](docs/RnD/Location-Audit.md) (location as global context), [docs/RnD/Stats-Data-Audit.md](docs/RnD/Stats-Data-Audit.md) (data inventory).

---

## 1. Executive summary

- The Observer Console **does not yet have a real Settings page** — [`sites/staging/index.html`](sites/staging/index.html) `#page-settings` is a placeholder (“Coming soon”).
- **Configuration today is fragmented:** URL query + `localStorage` for location and prefs ([`state.js`](sites/staging/weather/core/state.js)), per-widget `localStorage` (weather profile, matrix overlays, Helio expand state, calendar filters, map POC layer state), and **no single place** that explains or validates “how observing quality is scored.”
- **Weather-related scoring is implemented in at least three different ways:**
  1. **TypeScript v5 hierarchical model** in [`services/astro_weather/score.ts`](services/astro_weather/score.ts), invoked from the **Cloudflare Pages** handler [`functions/api/astro-weather.ts`](functions/api/astro-weather.ts) for live API responses.
  2. **Python YAML factor engine** [`services/weather/engine/score_engine.py`](services/weather/engine/score_engine.py) + files under [`services/weather/scoring/`](services/weather/scoring/) (`default.yaml` maps to profile name `default`, `visual.yaml`, `planetary.yaml`, `photography.yaml`).
  3. **Python penalty model** `PROFILE_PENALTY_CONFIG` + `compute_observing_score_for_profile` in [`services/weather/pipelines/fetch_weather.py`](services/weather/pipelines/fetch_weather.py) (0–100 penalty-from-100, profile-specific coefficients).
- **Sky “best objects” and ranking** are driven by **build-time** rules in [`services/sky/pipelines/yml/rules.yml`](services/sky/pipelines/yml/rules.yml) and [`score_item`](services/sky/pipelines/gen_objects.py) in [`gen_objects.py`](services/sky/pipelines/gen_objects.py); alert sub-pipelines add their own scoring (e.g. NEO/risk). **No user-facing tuning** exists.
- **Helio** persists **UI chrome only** (expanded sections) to `localStorage`, not science thresholds ([`helio.widget.ts`](sites/staging/helio/src/helio.widget.ts) `HELIO_UI_STORAGE_KEY`).
- A future Settings page must **reconcile transparency vs consistency:** exposing weights without a **single source of truth** risks contradictory numbers between hero, weather widget, and pipelines.

---

## 2. Settings scope (what should be included)

Mapping spike domains to **today vs intended**.

| Domain | Include in Settings | Current state |
|--------|---------------------|---------------|
| **Global / console** | Location default, timezone, time mode (live vs scrub), units | Location + tz in [`state.js`](sites/staging/weather/core/state.js); time scrub in console top bar ([`index.html`](sites/staging/index.html)) — persistence gaps documented in Location audit; **no units toggle** in codebase today |
| **Weather** | Scoring model visibility, profile, thresholds, Bortle | Profile + range in `state.js` / URL; API passes `profile`, `bortle` ([`astro-weather.ts`](functions/api/astro-weather.ts)); `default` state profile maps to **`balanced` API profile** in [`weather.js`](sites/staging/weather/widgets/weather/weather.js) (not in API allowlist → fallback) |
| **Sky** | Filters, min altitude, ranking prefs | **None** — all in `rules.yml` / Python |
| **Alerts** | Sensitivity, min magnitude, group emphasis | **None** server-side for end users; client could filter **if** added |
| **Helio** | Alert emphasis, G/R/S “watch” thresholds, refresh | **Refreshing** configurable via `refreshMs` option; **threshold sensitivity** not exposed; scales come from JSON |
| **Map** | Default layers, zoom, remembered state | [`map-poc.html`](sites/staging/weather/map-poc.html) saves composite state to `localStorage` |
| **UI / UX** | Theme, density, animation | **No global theme system** found in staging console; Helio saves panel expansion only |

---

## 3. Weather scoring model audit

### 3.1 API path (what the browser usually loads)

- **Entry:** `GET /api/astro-weather` — [`functions/api/astro-weather.ts`](functions/api/astro-weather.ts).
- **Valid profiles:** `balanced`, `visual`, `broadband`, `planetary` (`VALID_PROFILES`).
- **Scoring:** [`computeScore`](services/astro_weather/score.ts) per hour with `pressureTrend` from [`computeDerived`](services/astro_weather/derived.ts) (not expanded here) and **Bortle** integer 1–9.
- **Structure:**
  - **Category weights** per profile: `PROFILE_WEIGHTS` — four pillars `atmosphere`, `sky_darkness`, `dew_safety`, `stability` (each profile has different splits).
  - **Atmosphere** — clouds, precip, visibility, etc. (piecewise tables such as `DEW_SPREAD_TABLE`, wind modifiers inside dew/stability).
  - **Sky darkness** — moon illumination + Bortle base table `BORTLE_BASE`.
  - **Gate** [`computeGate`](services/astro_weather/score.ts) — hard thresholds on cloud layers, precip, visibility, humidity → `CLOSED` / `MARGINAL` / `OPEN`; caps final score (e.g. `CLOSED` → max 20).
- **Hardcoded knobs:** all interpolation tables, gate cutoffs, category weight matrices, `scoreCategory` bands.

### 3.2 Python YAML engine (observer / legacy pipelines)

- **Engine:** [`compute_score`](services/weather/engine/score_engine.py) sums **enabled factors** from a loaded profile dict; each factor has `max`, `field`, `transform` (`linear_inverse`, `threshold`, `scale_discrete`, …).
- **Profiles:** [`default.yaml`](services/weather/scoring/default.yaml) (`profile: default`), `visual.yaml`, `planetary.yaml`, `photography.yaml`.
- **Used for:** e.g. `decision.mode_scores` path in [`observer_weather` normalizer](services/weather/normalizers/observer_weather.py) via `_compute_mode_scores` — loads **`default`** file for display key `balanced`, **`photography`** for key `balanced`’s twin in another map (see §4 naming).

### 3.3 Python penalty model (fetch pipeline)

- **`PROFILE_PENALTY_CONFIG`** in [`fetch_weather.py`](services/weather/pipelines/fetch_weather.py): per-profile `cloud_coef`, `precip_coef`, `wind_thresh`, `wind_factor`, discrete **seeing** / **transparency** scales (tuples).
- **Output:** penalty subtracted from 100 with structured breakdown — **different semantics** than v5’s weighted category model.

### 3.4 Implicit assumptions and risks

- **Multiple engines ⇒ incomparable numbers:** a “72” from the API is not the same construct as a YAML-engine score or penalty-model score.
- **`default` vs `balanced`:** [`state.js`](sites/staging/weather/core/state.js) uses `profile: "default"`; [`weather.js`](sites/staging/weather/widgets/weather/weather.js) maps any non-API profile to **`balanced`** for the API call. Mental model: **default means balanced for live weather.**

### 3.5 What could be user-configurable (safely)

| Parameter class | Expose as | Risk |
|-----------------|-----------|------|
| Profile choice only | Preset (Level 1) | Low — already partially there |
| Bortle class | Slider 1–9 or preset | Low — already API param |
| Category weights | Sliders with **normalize to 1** | Medium — breaks comparability unless versioned |
| Gate thresholds | Advanced editor | **High** — can flatten scores or invert meaning |
| Interpolation tables | JSON / import | **High** — invalidates docs and support |

**Recommendation:** Level 1–2 expose **profile + Bortle + optional “strictness” preset** that maps internally to **approved** weight vectors (no freeform per-table edit until v3 with validation service).

---

## 4. Weather profiles audit

### 4.1 Frontend / API profiles (and observer JSON naming)

| UI / state value | API [`astro-weather`](functions/api/astro-weather.ts) | Observer [`_compute_mode_scores`](services/weather/normalizers/observer_weather.py) (YAML file) |
|------------------|--------------------------------------------------------|--------|
| `default` | → `balanced` via [`weather.js`](sites/staging/weather/widgets/weather/weather.js) | key **balanced** → [`default.yaml`](services/weather/scoring/default.yaml) (`profile: default`) |
| `visual` | `visual` | **visual** → `visual.yaml` |
| `broadband` | `broadband` | **photography** → `photography.yaml` — **different label** than API profile name |
| `planetary` | `planetary` | **planetary** → `planetary.yaml` |

### 4.2 TypeScript profile differentiation

From [`PROFILE_WEIGHTS`](services/astro_weather/score.ts):

- **balanced:** balanced atmosphere / sky / dew / stability.
- **visual:** more atmosphere, less sky darkness.
- **broadband:** strongest sky_darkness weight (Milky Way / DSO bias).
- **planetary:** strongest atmosphere + stability; minimal sky_darkness.

### 4.3 YAML profile differentiation

[`default.yaml`](services/weather/scoring/default.yaml) vs [`visual.yaml`](services/weather/scoring/visual.yaml): different `max` points per factor (e.g. visual ups transparency weighting). **Moon** factor exists but disabled in `default`.

### 4.4 User capabilities to propose

| Capability | Feasibility | Notes |
|-----------|-------------|------|
| Choose among presets | **Now** | Wire clearly to one scoring stack per surface |
| Rename “default” → “Balanced” in UI | **Trivial** | Reduces confusion |
| Edit YAML-equivalent weights in UI | **Later** | Needs validation + server-side acceptance for API path |
| User-created profiles | **Later** | Store as versioned JSON; fallback to `balanced` on error |

---

## 5. Sky / Alerts scoring audit

### 5.1 Ranking and “best objects”

- **Inputs:** ephemeris + visibility stats per item (`VisibilityStats`), group (`planets`, `dso`, `calendar`, `alerts`).
- **Rules:** [`rules.yml`](services/sky/pipelines/yml/rules.yml) supplies base weights (`calendar_event`, `planets`, `dso`, …), altitude and magnitude parameters, meridian / deep-night bonuses, ranking quotas (`total_top`, `order`, `reserve`). The file contains **duplicate top-level `scoring:` keys** in YAML — loaders typically see the **last** block; audits should treat this as **technical debt** to confirm in `gen_objects` loader behavior.
- **Function:** [`score_item`](services/sky/pipelines/gen_objects.py) combines group weight, altitude-derived terms, meridian bonuses, etc.; output includes `score_breakdown`.

### 5.2 Alerts

- **NEO / risk** pipelines implement dedicated formulas (e.g. `_risk_score_0_1`, `_score_norm_and_raw` in [`gen_neo_alerts.py`](services/sky/pipelines/gen_neo_alerts.py)) — **not** user-tunable today.
- **Client:** [`widget.stats.js`](sites/staging/sky/widgets/widget.stats.js) visualizes **distribution of existing alerts** in `alerts_now.json`; it does not change scoring.

### 5.3 What could be configurable

| Item | Fixed now | Client-only option | Server option |
|------|-----------|-------------------|---------------|
| Ranking quotas | `rules.yml` | Filter top-N in UI | Regenerate with user rules file |
| Min altitude / magnitude cuts | In rules + code | Filter list post-fetch | Parameterize `rules.yml` |
| Alert sensitivity | Pipeline constants | Hide severity below threshold | Regenerate with thresholds |

**Must stay fixed (unless science review):** PHA prioritization logic, safety-related risk tagging.

---

## 6. Configuration model (basic to advanced)

Aligned with spike **Levels 1–3**:

### Level 1 — Basic

- **Presets only:** observing profile, Bortle, range (tonight / 48h / 7d).
- **Reset to recommended** for profile + Bortle.
- **Global:** location + tz from existing location widget (link out or embed summary).

### Level 2 — Intermediate

- **Sensitivity** sliders that map to **discrete approved bundles** (e.g. “stricter gates” selects a known alternate threshold set — **requires implementing** such bundles in code first).
- **Map:** layer defaults; restore map `localStorage` or clear.
- **Helio:** choose refresh interval (within min/max), default expanded panels.

### Level 3 — Advanced

- **Export/import** of a single **Settings document** (versioned schema).
- **Weight editor** for API scoring with live validation (sum of category weights = 1, ranges on gates).
- **JSON view** of `rules.yml` fragment — **only** with server-side validation and **never** raw edit on production without review.

---

## 7. Risks and constraints

1. **Score inconsistency** across hero (`observer_weather_now.json` paths), Weather widget (API `score.ts`), and any remaining penalty-model outputs — users will distrust the product if Settings implies one model but panels disagree.
2. **Comparability:** sharing screenshots or comparing “my score” across nights breaks if weights change without **schema version** on stored snapshots.
3. **Invalid configs:** zero weights, inverted gates, NaN from bad import — require **server validation** + client preview.
4. **Security / abuse:** if Settings ever sends overrides to an API, rate-limit and cap ranges.
5. **Build-time sky rules:** user overrides either **fork** static JSON (expensive) or **filter client-side** (cheap, doesn’t affect shared ranking file).
6. **Naming debt:** `default` / `balanced` / `photography` / `broadband` — document in UI and converge in a later refactor (**out of scope** for this spike).

**Mitigations:** “Reset to recommended,” explicit **model version** string in API payloads, Settings panel shows **which engine** powers each surface until unification.

---

## 8. Proposed Settings structure (information architecture)

**Suggested top-level groups** (no visual design):

1. **Observer context** — location, timezone, time mode, units (future).
2. **Observing models** — profile, Bortle, strictness preset; link to short explainer of v5 categories.
3. **Sky & ranking** — read-only summary of pipeline rules + **client filters** (min alt, hide daylight objects) if implemented.
4. **Space weather** — refresh interval, default expansions (Helio UI prefs), optional “alert noise” filter (client).
5. **Map** — sync/clear map state, default layers.
6. **Appearance & layout** — theme (future), compact mode (future).
7. **Data & privacy** — refresh hints, third-party sources (Open‑Meteo, 7Timer, NOAA).

Sub-pages can mirror **hero → detail** pattern: Level 1 controls on top, “Advanced” collapsed.

---

## 9. Recommendations and next steps

1. **Unify documentation:** maintain one internal doc that lists **which score** feeds hero vs widget vs observer JSON build — Settings UI should surface that **provenance** string.
2. **Phase A (low risk):** Ship Settings **Level 1** only: profile, Bortle, range, location summary, reset prefs, Helio refresh preset, clear map state.
3. **Phase B:** Introduce **strictness presets** implemented as **code-defined** bundles in `score.ts` (not user-authored).
4. **Phase C:** Sky **client-side filters** before editing `rules.yml` generation.
5. **Engineering debt:** Resolve YAML duplicate `scoring:` in [`rules.yml`](services/sky/pipelines/yml/rules.yml); align `default` naming in [`state.js`](sites/staging/weather/core/state.js) with API (`balanced`).

---

*End of audit — implementation deferred per spike.*
