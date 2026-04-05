# Helio Data Contract v1.4

**Document revision:** 1.4  
**Extends:** [Helio Data Contract v1](./Helio%20Data%20Contract%20v1.md)

This revision is **additive only**. All required fields, nullability, and semantics from v1 remain unchanged. Clients that ignore v1.4 fields continue to work.

The serialized dataset still carries `"schema_version": "helio_now/v1"` in `helio_now.json` unless the project explicitly bumps that string in a future release. **Contract v1.4** refers to this documentation revision, not necessarily a new `schema_version` value.

---

## 1. Purpose of v1.4

- Document the optional **`hero`** object on `helio_now.json`, aligned with the Space Weather hero UI (G / R / S / X chips).
- Document **in-widget scroll targets** (HTML `id` anchors) used when chips jump to the Observer Impacts panel.
- Document the optional **`storm_risk`** object for the Storm Risk impact row (observed G + 24h max-expected G; dual semicircle gauges in the widget).

---

## 2. Optional top-level field: `hero`

`hero` is **optional**. If omitted, consumers derive the same displayed values from existing **`scales`**, **`metrics.kp_latest`**, **`metrics.xray_class`**, and **`summary.label`** as today.

When present, it **must** be an object with the shape below. Individual sub-fields may be omitted unless noted; the pipeline may emit the full block for convenience.

### 2.1 TypeScript shape

```typescript
export interface HelioHeroScales {
  g?: string;  // e.g. "G0" … "G5" — mirrors scales.g_scale
  r?: string;  // e.g. "R0" … "R5" — mirrors scales.r_scale
  s?: string;  // e.g. "S0" … "S5" — mirrors scales.s_scale
  x?: string | null;  // GOES X-ray class letter only: "A" | "B" | "C" | "M" | "X", or null if unknown
}

export interface HelioHeroBlock {
  kp?: number | null;           // optional mirror of metrics.kp_latest
  status_label?: string | null; // optional mirror of summary.label
  scales?: HelioHeroScales;
}

// On HelioNow:
hero?: HelioHeroBlock;
```

### 2.2 Example

```json
{
  "hero": {
    "kp": 3.0,
    "status_label": "Quiet",
    "scales": {
      "g": "G0",
      "r": "R0",
      "s": "S0",
      "x": "B"
    }
  }
}
```

### 2.3 Semantics and merge rules

- **`hero.scales.g` / `r` / `s`:** Same meaning as **`scales.g_scale`**, **`scales.r_scale`**, **`scales.s_scale`**. Prefer the top-level **`scales`** object as the authoritative source when reconciling conflicts; **`hero`** is a denormalized mirror for compact UIs.
- **`hero.scales.x`:** Letter **only** (no `"X:"` prefix in JSON). The hero chip may render as `X:B` in the UI.
- **Nullability:** If **`x`** is `null`, clients should fall back to **`metrics.xray_class`** (and flux-based derivation where implemented).

**Reference implementation:** `services/helio/aggregators/helio_state.py` (emits `hero`) and `services/helio/pipelines/gen_helio.py` (includes it in the written JSON).

---

## 3. Widget scroll anchors (Observer Impacts)

The embedded Helio widget (`sites/staging/helio/`) exposes **fragment `id`s** on impact rows for hero scale chip navigation. These ids are **UI contract** details for the widget bundle, not JSON fields.

**Mapping (chip → sections):** ensure Observer Impacts is **open**, **expand** each mapped row (and the solar disk panel for **`solar`**), then **smooth-scroll** to the **first** existing target and apply a short **`section-flash`** on **all** found targets (~1.2s).

| Chip | Target element ids (order) |
|------|----------------------------|
| G | `aurora`, `storm_risk` |
| R | `radio` |
| S | `satellite_drag`, `gnss` |
| X | `solar` |

Corresponding DOM ids: `#aurora`, `#storm_risk`, `#radio`, `#satellite_drag`, `#gnss`, `#solar` (`#solar` is on the solar-disk wrapper inside the Solar activity row).

Anchors exist only when Observer Impacts content is rendered; the widget expands that panel before scrolling if it was collapsed. Missing ids are skipped; on localhost, the widget may log a console warning for missing targets.

---

## 4. Optional top-level field: `storm_risk`

`storm_risk` is **optional**. If omitted, the Helio widget **derives** an equivalent shape client-side from `scales.g_scale`, `metrics.kp_forecast_3h`, and the same Kp→G rules used server-side.

### 4.1 Shape

- **`now`:** observed geomagnetic storm level (integer **0–5**) and display **`label`** (e.g. Quiet … Extreme Storm).
- **`forecast_24h`:** includes **`max_expected`** (integer **0–5**), the **maximum G level implied** by the peak **Kp** in the **next 24 hours** (same window rules as `_derive_storm_risk` in `helio_state.py`).  
- **`G1` … `G5`** may still be present as floats in **[0, 1]** for backward compatibility; the current Storm Risk **UI does not render probabilities**—only **`now`** and **`max_expected`** drive the categorical gauges.

### 4.2 Kp → `max_expected` (integer G)

Threshold mapping (fractional Kp uses these cutoffs): **Kp &lt; 5 → G0**, **5 → G1**, **6 → G2**, **7 → G3**, **8 → G4**, **9 → G5**.

### 4.3 Example

```json
{
  "storm_risk": {
    "now": { "g_level": 0, "label": "Quiet" },
    "forecast_24h": {
      "G1": 0.0,
      "G2": 0.0,
      "G3": 0.0,
      "G4": 0.0,
      "G5": 0.0,
      "max_expected": 0
    }
  }
}
```

**Reference implementation:** `services/helio/aggregators/helio_state.py` (`_derive_storm_risk`, `_kp_to_max_g_level`), `services/helio/pipelines/gen_helio.py`, widget `sites/staging/helio/src/helio.widget.ts` (`resolveStormRisk`, `renderGeomagStormTip`).

---

## 5. Local verification (port 8080)

The repo’s standard local server serves **`sites/staging/`** on **port 8080**.

- **Start:** from the repo root, run `make server` (see `Makefile` and `docs/Architecture/ARCHITECTURE.md`). This matches `CLAUDE.md` / project workflow: validate on **http://localhost:8080** after merge.
- **Helio widget demo:** open [http://localhost:8080/helio/](http://localhost:8080/helio/) or [http://localhost:8080/helio-demo.html](http://localhost:8080/helio-demo.html) (paths are under `sites/staging/`).

Use any free port only for ad-hoc testing; **8080** is the conventional documented port for this project.

---

## 6. Changelog (v1 → v1.4)

| Revision | Change |
|----------|--------|
| **v1.4** | Optional **`storm_risk`** block; Storm Risk UI: dual semicircle gauges (**now** vs **`max_expected`** only); Kp→G thresholds for **`max_expected`**. |
| **v1.3** | Optional **`hero`** block; documented widget scroll **`id`** map; local check on **:8080**. |
| **v1** | Baseline consolidated contract (see v1 doc). |
