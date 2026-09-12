# Solar Activity Widget Contract v1

**Status:** contract-first design; implementation is not part of this change
**Type:** `solar-activity`
**Version:** `1`
**Shape:** `oriented`
**Public modes:** `horizontal`, `vertical`
**Multi-instance:** `true`

## 1. Scope and boundary

This document defines the v1 contract for the Solar Activity widget that will
replace the Dashboard's current inline `_dbRenderSolar` renderer in a later
implementation step. It does not register a widget, add a loader, change
JavaScript, change the backend, or add an endpoint.

The widget presents the existing Dashboard Solar Activity summary as three
columns:

1. **X-Ray**
2. **Solar Activity**
3. **Solar Wind**

The three-column composition is retained in both public modes. `horizontal`
is intended for a container whose width is greater than its height;
`vertical` is intended for a container whose height is greater than its width.
The widget does not expose `square` or `auto` as public modes.

## 2. Source and data boundary

The source is the existing `helio_now/v1` dataset, serialized at:

`sites/staging/data/helio_now.json`

The `schema_version` value is `helio_now/v1`. The widget may consume the
existing aggregate blocks already present in that dataset, including:

- `updated_utc`;
- `metrics.xray_class`, `metrics.xray_flux_wm2`, and
  `metrics.xray_history_1h`;
- `metrics.solar_wind_kms`, `metrics.density`, `metrics.pressure_npa`,
  `metrics.imf_bz_nt`, `metrics.imf_bt_nt`, and `metrics.wind_history_1h`;
- `scales.r_scale`;
- `chain_panel.sun` when present;
- `observer_impacts[]` with `kind: "solar_activity"` when present;
- `timeline` when present.

This contract does not prescribe a new transport mechanism. A future adapter
must use the repository's existing `helio_now/v1` source path and must not
create a second provider or endpoint for this widget.

The widget is **not observer-aware** and **not time-aware** in v1:

```text
observerAware = false
timeAware = false
```

Its display is a summary of the supplied Helio dataset. It must not claim that
`observer_impacts` makes the widget location-aware, and it must not derive a
different Helio dataset from Platform Context location or time.

## 3. Presentation contract

### 3.1 X-Ray column

Use the existing X-Ray aggregate fields to show the current class and flux,
with the optional `metrics.xray_history_1h` series as a compact history. The
`scales.r_scale` value may be shown as the existing radio-blackout scale
indicator. A null metric is displayed as unavailable; it is not converted to
zero or another guessed value.

### 3.2 Solar Activity column

Use `chain_panel.sun` for the current solar state and
`observer_impacts[kind="solar_activity"]` for the observer-impact summary
when those blocks exist. Use the normalized `timeline` event fields defined
below for recent solar events. The column remains present when any of these
blocks is absent.

### 3.3 Solar Wind column

Use the existing solar-wind and IMF metrics and, when present,
`metrics.wind_history_1h` as a compact history. Null values remain visibly
unavailable and are not silently substituted with zero.

## 4. Canonical timeline event model

The Solar Activity widget consumes normalized timeline entries with these
required canonical fields:

```typescript
interface SolarActivityTimelineEventV1 {
  event_time: string;       // ISO-8601 UTC timestamp
  event_type: SolarActivityEventType;
  event_title: string;
  level: "info" | "watch" | "warning";
  severity_label: string | null;
  description: string;
}
```

The supported `event_type` values are:

```text
solar_flare
cme_launch
cme_arrival
geomagnetic_storm
geomagnetic_watch
radio_blackout
radiation_storm
space_weather_info
```

`cme_arrival` is the canonical arrival event name. `cme_impact` is not a v1
event type and must not be emitted or required by the widget.

The current dataset may also carry non-rendering provenance or state fields
such as `source`, `is_active`, `is_future`, and `metadata`. They may be
preserved by an adapter, but they are not substitutes for the six canonical
fields above and are not required for the v1 summary to render.

The following legacy aliases are not part of this contract:

- `event_description` — use `description`;
- an unqualified `severity` field — use `severity_label` for the display label
  and `level` for the operational level;
- `cme_impact` — use `cme_arrival` when the event means arrival.

## 5. Missing, null, and empty data behavior

The widget must preserve its three-column shell while degrading locally:

| Input condition | Required behavior |
|---|---|
| Missing, malformed, or unparsable dataset | Render an error state scoped to this widget; do not throw into the host or prevent sibling widgets from rendering. |
| Missing or invalid `updated_utc` | Treat the dataset as an error; do not display an invented freshness time. |
| Valid dataset with an old `updated_utc` | Render the available values with a visible stale state and retain the last valid values; stale data must not be presented as current. The freshness threshold is owned by the existing source/runtime policy and is not a new backend field in v1. |
| `chain_panel` is null, missing, or empty | Keep all three columns. The Solar Activity column shows an unavailable/neutral state and does not invent a severity, label, or message. X-Ray and Solar Wind still render independently from their own metrics. |
| A `chain_panel` column is missing | Degrade only that column to its unavailable/neutral state. |
| `timeline` is null, missing, or an empty array | Keep the Solar Activity column and show the existing no-recent-events state. Do not fabricate events. |
| A timeline entry has a null `severity_label` | Render the event using `level` and the title; do not infer a severity label. |
| An individual metric or history point is null | Display an unavailable marker and continue rendering other fields. |

`error` and `stale` are mutually meaningful display states: an error means the
current source could not be consumed; stale means a valid source was consumed
but its `updated_utc` is outside the applicable freshness policy. A cached
stale payload may be shown as stale, never as fresh.

## 6. Lifecycle contract

The future Runtime adapter must expose the standard widget lifecycle:

```text
mount(rootEl, context, config) -> instance
instance.update(patch) -> void
instance.resize() -> void
instance.destroy() -> void
```

Requirements:

- `mount` renders only inside the supplied root and accepts the public
  orientation from `config`.
- `update` refreshes the supplied Helio snapshot or display configuration
  without requiring a page-level renderer or a sibling root lookup.
- `resize` recalculates layout for the current root and orientation.
- `destroy` removes listeners, observers, timers, pending work, and owned DOM
  state; a later mount must start cleanly.
- Multiple instances must not share mutable state, timers, requests, or DOM
  nodes. No global singleton is part of this contract.
- A failure in one instance must be isolated from the Console host and other
  Runtime instances.

## 7. Rendering and security

All values originating in `helio_now/v1` are data, not trusted markup. The
implementation must render event titles, descriptions, timestamps, source
strings, and metric labels with text-safe DOM APIs (`textContent`, text nodes,
or an equivalently safe escaping path). It must not interpolate source data
into `innerHTML`, executable attributes, CSS, or URLs without validation and
escaping.

## 8. Explicitly deferred work

The following are implementation work for a later story/step:

- registering `solar-activity` in the widget catalog;
- adding the Console Composer slot and Runtime adapter;
- replacing `_dbRenderSolar` while preserving the panel shell and controls;
- adding JavaScript, lifecycle, browser, and security tests;
- changing or generating `helio_now/v1` data.

Until that work is complete, the Dashboard composition descriptor must keep
Solar Activity classified as a `temporary_adapter` owned by the inline
renderer.
