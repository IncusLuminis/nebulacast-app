# Helio Data Contract v1.3

**Document revision:** 1.3  
**Extends:** [Helio Data Contract v1](./Helio%20Data%20Contract%20v1.md)

This revision is **additive only**. All required fields, nullability, and semantics from v1 remain unchanged. Clients that ignore v1.3 fields continue to work.

The serialized dataset still carries `"schema_version": "helio_now/v1"` in `helio_now.json` unless the project explicitly bumps that string in a future release. **Contract v1.3** refers to this documentation revision, not necessarily a new `schema_version` value.

---

## 1. Purpose of v1.3

- Document the optional **`hero`** object on `helio_now.json`, aligned with the Space Weather hero UI (G / R / S / X chips).
- Document **in-widget scroll targets** (HTML `id` anchors) used when chips jump to the Observer Impacts panel.

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

The embedded Helio widget (`sites/staging/helio/`) exposes **fragment targets** inside the card for hero chip clicks. These ids are **UI contract** details for the widget bundle, not additional JSON fields.

| Chip | Scroll target `id` | Intended section |
|------|-------------------|------------------|
| G | `geomagnetic` | Geomagnetic storm risk row (24h G-scale probability) |
| R | `radio` | HF radio / R-scale impact row |
| S | `radiation` | Solar activity / S-scale context row (row anchor) |
| X | `solar` | Solar disk / X-ray activity focus (inner target) |

Anchors exist in the DOM only when the Observer Impacts panel content is rendered; the widget may expand the panel before scrolling if it was collapsed.

---

## 4. Local verification (port 8080)

The repo’s standard local server serves **`sites/staging/`** on **port 8080**.

- **Start:** from the repo root, run `make server` (see `Makefile` and `docs/Architecture/ARCHITECTURE.md`). This matches `CLAUDE.md` / project workflow: validate on **http://localhost:8080** after merge.
- **Helio widget demo:** open [http://localhost:8080/helio/](http://localhost:8080/helio/) or [http://localhost:8080/helio-demo.html](http://localhost:8080/helio-demo.html) (paths are under `sites/staging/`).

Use any free port only for ad-hoc testing; **8080** is the conventional documented port for this project.

---

## 5. Changelog (v1 → v1.3)

| Revision | Change |
|----------|--------|
| **v1.3** | Optional **`hero`** block; documented widget scroll **`id`** map; local check on **:8080**. |
| **v1** | Baseline consolidated contract (see v1 doc). |
