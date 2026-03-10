# Sky Alerts: Data & UI Specification
This document describes the JSON schemas currently produced by the sky pipelines and proposes a UI representation for the sky widget (map + lists + dialogs). It is based on the current sample outputs:
- `alerts_now` → `alerts_now.json`
- `alerts_neocp_tocp_grb` → `alerts_neocp_tocp_grb.json`
- `alerts_neo` → `alerts_neo.json`
- `alerts_risk` → `alerts_risk.json`
- `alerts_gcn` → `alerts_gcn.json`

## 1. Data products and their roles
We now have multiple upstream datasets, each written as a standalone JSON, and a final merged product consumed by the frontend.

1) **alerts_neocp_tocp_grb.json** — discovery/observation-driven sky alerts.
   - `neocp`: newly discovered NEO candidates (with RA/DEC + mag).
   - `transient` (TOCP): transient candidates (often J-coord based, sometimes mag).
   - `grb`: GRB localizations (RA/DEC, no mag).

2) **alerts_neo.json** — *event alerts* for close approaches (CAD) enriched with Horizons + SBDB.
   - `neo` group, `bucket` inside meta: `pha` / `10ld`.
   - includes RA/DEC/Alt/Az/Mag when Horizons succeeds.
   - includes SBDB physical/orbit enrichment (MOID, H, albedo, diameter estimates).

3) **alerts_risk.json** — *dynamic risk monitoring layer* from Sentry.
   - `risk` group.
   - may not have RA/DEC (these are not sky-position alerts, rather object-level monitoring).

4) **alerts_gcn.json** — event stream ingestion from NASA/GCN Kafka.
   - `gcn` group.
   - in practice this may be empty if no events were received during the consume window.

5) **alerts_now.json** — merged, deduped, sorted union for the frontend.
   - contract: `generated_utc`, `observer`, `raw`, `counts`, `groups`, `items`.

## 2. alerts_now.json top-level contract
Top-level fields (frontend contract):

- `generated_utc` (str, ISO UTC)
- `observer` (dict): `{lat_deg, lon_deg}` (metadata only; no observer-dependent filtering here)
- `raw` (list): provenance entries `{source, path}` for each merged input
- `counts` (dict): `{total_filtered, by_group}`
- `groups` (dict): group → array of items
- `items` (list): flat array of all items, globally sorted

Current group counts (sample):

```
grb: 3
neocp: 16
transient: 9
```

## 3. Unified AlertItem schema
All alert items share a common envelope. Group-specific content lives under `meta` (and sometimes `discovery`).

Common envelope fields:

- `id` (str): object identifier (group-dependent). For CAD close approaches, it is now only the designation (e.g., `2026 DK`).
- `source` (str): feed identifier (e.g., `neocp`, `tocp`, `grb_fermi`, `jpl-cad+horizons+sbdb`, `jpl-sentry`, `gcn-kafka`).
- `group` (str): UI grouping key (`neocp`, `transient`, `grb`, `neo`, `risk`, `gcn`, ...).
- `type` (str): semantic subtype (e.g., `neo`, `grb`, `risk`, `transient`).
- `title` (str|nullable): short human title.
- `note` (str|nullable): short annotation.
- `score_norm` (float|nullable): normalized score `[0..1]` (the value used for sorting in UI).
- `score_raw` (float|int|nullable): raw score in the producing feed (often 0..100 or feed-specific).
- `ra_deg`, `dec_deg` (float|nullable): sky coordinates in degrees (nullable for non-sky layers like Sentry).
- `mag` (float|nullable): apparent magnitude if known.
- `updated_utc` (str|nullable): for most sources this is the event time (ISO). For NEO CAD it is close-approach time.
- `ingested_utc` (str|nullable): pipeline ingest time (ISO).
- `discovery` (dict|nullable): present mainly in NEOCP.
- `meta` (dict|nullable): group-specific data + provenance + scoring details.

Notes on time fields:

- Keep `updated_utc` for backwards-compatibility, but treat it as *event time*.
- Additive fields in `meta` (already present for NEO CAD): `t_utc` (legacy label) and `t_utc_iso` (parseable ISO).

## 4. Group-specific meta schemas
Below are the observed meta keys per group in the current merged output. These are *not* exhaustive guarantees, but represent what downstream UI should expect.

### 4.1 Group `grb`

Meta keys: `trigger_name`

### 4.2 Group `neocp`

Meta keys: `action`

### 4.3 Group `transient`

Meta keys: `designation_raw`, `observation_date`, `title`

### 4.X Scoring block (meta.scoring)

Most items contain `meta.scoring` with a structured breakdown:

```
meta.scoring = {
  version: 'v1',
  internal: { score_norm, score_raw, source },
  external: {
    model: 'external_v1', weights_profile,
    features: { urgency, observability, brightness, hazard, reliability, novelty, localization },
    weights:  { ... },
    score_norm, score_raw,
  },
  global: { policy: 'merge_v1', pha_floor, score_norm, score_raw }
}
```

UI should treat `score_norm` at the top-level as the authoritative value for ranking and display, and show the `meta.scoring` breakdown in the object details view (debug/advanced section).

## 5. UI representation model
The sky widget UI should separate three concepts:

A) **Sky overlays**: items with valid `ra_deg`+`dec_deg` that can be plotted.
B) **Non-sky lists**: items without coordinates (e.g., Sentry risk objects) that still belong in alerts.
C) **Object knowledge**: object-level enrichment (SBDB/Sentry) shown in details, not necessarily as a sky point.

### 5.1 Primary screens/panels

1) **Sky Map (canvas)**
   - Plots items with RA/DEC.
   - Uses group-based marker styling (shape/color) and score-based size/alpha.
   - Hover: quick tooltip (title, group, score, mag, updated time).
   - Click: opens Object Detail modal (see below).

2) **Alerts Sidebar (dock panel)**
   - Tabbed by group (`neo`, `neocp`, `transient`, `grb`, `risk`, `gcn`).
   - Each tab shows a sorted list (by `score_norm`, then recency).
   - Each row: compact “card line” with (score badge, title/id, key metrics, timestamp).
   - Row click: centers map (if RA/DEC present) and opens Object Detail modal.

3) **Filters/Legend Popover**
   - Group toggles (show/hide overlays).
   - Score threshold slider.
   - Time window filter (e.g., last N hours/days based on `updated_utc`).
   - “Hide non-sky items” toggle for map.

### 5.2 Dialogs and interactions

Proposed dialogs (minimal but scalable):

A) **Quick Tooltip (on hover)**
   - Non-modal.
   - Fields: `title` (or `id`), `group`, `score_norm`, `mag` (if any), `updated_utc`.

B) **Object Detail Modal (primary)**
   - Opens on click from map or list.
   - Header: group badge + id + title.
   - Body: tabbed sections:
     1. Summary
        - Score (global) + reason chips (from scoring features)
        - Coordinates, mag, observability (alt/az) if present
        - Event time (updated_utc) and ingestion time
     2. NEO / Orbit / Physical (shown when available)
        - For `neo`: close approach distance (AU/LD), v_rel, H, albedo, diameter_km / diameter_est_km, MOID
        - For `risk`: Sentry metrics (impact probability, date range, Palermo/Torino if present, last obs)
     3. Provenance
        - `source`, input dataset, `cad_url_*`, `sbdb_url`, etc.
     4. Raw JSON (collapsible)
        - show `meta.*_raw` blocks and original rows for debugging.

C) **External Links Popover** (inside modal)
   - Contains pre-built URLs to JPL CAD, SBDB, Sentry, GCN notice page (topic-based) when possible.

### 5.3 Map ↔ Dialog linkage

- Selecting an item in the Alerts Sidebar should:
  1) set it as `activeAlertId`
  2) if RA/DEC exists → pan/zoom the sky map to it
  3) open Object Detail Modal.

- Closing the modal keeps selection (optional) but clears highlight after a timeout.

- From the modal, clicking “Show on map” should focus the map (if RA/DEC). If not available, the button is disabled and the modal explains why.

## 6. Recommended information architecture (IA)
To keep the UI coherent as datasets grow, represent each item in 3 levels:

1) **Card-level (list row / tooltip)**
   - identity: `group`, `id`, `title`
   - rank: `score_norm`
   - time: `updated_utc`
   - 1–2 group-specific metrics:
     - NEO: `dist_ld`, `mag`
     - NEOCP: `mag`, `meta.action`
     - TOCP: `meta.designation_raw` / `meta.observation_date`
     - GRB: none (localization only)
     - Risk: `meta.ip` (impact probability) or “active monitoring”

2) **Detail-level (modal summary)**
   - show everything needed for an informed human decision (observe? ignore? urgent?).

3) **Debug-level (raw/provenance)**
   - show `meta.*_url`, `meta.*_fields`, `meta.*_row`, `meta.*_raw`.

This aligns with the current data: each pipeline already stores raw rows/JSON under `meta`.

## 7. UI components inventory
Minimal component set (JS, no framework assumptions):

1) `AlertsPanel` (dock sidebar)
   - props: `alertsNow` (whole doc)
   - state: `activeGroup`, `activeAlertId`, filters.

2) `AlertsList` (virtualized list recommended once items > ~500)
   - renders rows, supports search by id/title.

3) `SkyOverlayLayer` (map integration)
   - takes filtered alerts with RA/DEC.
   - handles hover/click.

4) `AlertDetailsModal`
   - tabs: Summary / Physics+Orbit / Provenance / Raw.

5) `FiltersPopover`
   - group toggles, score threshold, time window.


## 8. Open points / risks / boundaries
- **Risk layer lacks RA/DEC**: by design; it will not render on the sky map unless you later add Horizons ephemerides for Sentry objects.
- **GCN stream is bursty**: the hourly batch may often be empty. UI should handle empty groups gracefully.
- **Time semantics** differ by source; treat `updated_utc` as event time, but show source label in details.
- **Dedup key**: if IDs collide across datasets, the dedupe rule includes source+group+coords; this is acceptable but should be documented.
