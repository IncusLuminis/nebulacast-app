# Console route composition and ownership matrix

This is the readable companion to [`CONSOLE_ROUTE_COMPOSITION.json`](CONSOLE_ROUTE_COMPOSITION.json), the auditable descriptor for Story #98. The JSON is the validation source of truth; this document explains how to read the current boundary.

Validate both the route descriptor and its relationship to the frozen widget inventory from the repository root:

```bash
python3 scripts/validate_route_composition.py
python3 scripts/validate_widget_inventory.py
```

## Composition rules

- The page host owns navigation, landmarks, tabs, placement, outer sizing, and application controls.
- A `runtime_widget` is mounted by the common Registry/Runtime path and owns its root-scoped UI and lifecycle.
- A `temporary_adapter` is an explicit record of current legacy, inline, global, direct-mount, or iframe ownership. It is not a second authoritative widget implementation.
- Every visible surface records its Registry type, root/slot, Platform Context boundary, authoritative source, compatibility route, current classification, and target classification.
- `sky` is `square` only. Its public mode list is exactly `square` and requires `width === height`.
- Every other Registry widget is `oriented` with exactly `horizontal` and `vertical` public modes. Horizontal requires `width > height`; vertical requires `height > width`.
- `auto` remains an internal Runtime/legacy resolution value only. It is not a public mode, host input, or generated output.
- Showcase, Settings, and Stats are intentionally host applications and are listed separately as excluded applications.

## Route matrix

| Route | Host root/source | Visible data and visualization surfaces | Current boundary | Target boundary |
|---|---|---|---|---|
| `/` Dashboard | `.console-root` · `sites/staging/index.html` | Hero `#console-hero`; Location `#w-location`; Weather `#w-weather`; Forecast Matrix `#w-weather-matrix`; Sun & Moon `#w-sunmoon-panel`; Sky `#db-sky-root`; Alerts `#fs-sky`; Events `#nrc-main`; News `#nrw-main`; observing window `#dbp-window-body`; Space Weather `#dbp-helio-body`; Solar Activity `#dbp-solar-body`; Map `#db-map-root` | Composer widgets are Runtime-backed, including dashboard Weather, Forecast Matrix, Sky, Space Weather, Solar Activity, Map, and Best observing window slots. Weather instances own their internal observing/matrix modes and receive profile/range updates through Runtime APIs. The observing-window widget owns its root and loads observer weather plus Sun/Moon data through Platform Context. Map still uses the legacy POC iframe inside its documented adapter. | All data/visualization surfaces become independent Runtime instances; Console keeps shell and empty roots. |
| `/weather/` Weather | `.page-wrap` · `sites/staging/weather/index.html` | Location `#w-location`; Weather `#w-weather`; Sun & Moon `#w-sun`; Astro `#w-astro`; Sky `#skyMount`; Map `#w-map` | `weather-composer.mjs` is the single Runtime composition host. Tabs and embed visibility remain host shell; legacy widget modules are reached only through their registered adapters. | Runtime composition uses shared Platform Context; Sky stays square-only and lazy-loaded. |
| `/sky/` Sky | `.sky-page` · `sites/staging/sky/index.html` | Sky chart `#skyMount`; player `#skyPlayer` | `page-composer.mjs` mounts the registered Sky Runtime widget in a square root; player remains host-owned control. The legacy bootstrap remains compatibility-only. | Direct Runtime Sky instance in a square root. |
| `/helio/` Space Weather | `.page-shell` · `sites/staging/helio/index.html` | Space Weather `#w-helio`; diagnostics `.page-diag` | The independent `space-weather` type is registered and its Runtime adapter consumes Platform Context; the current page remains a legacy global compatibility host. Diagnostics are host shell. | A later composition story mounts the registered widget directly and retires the page-global path. |
| `/map/` Map | `body` · `sites/staging/map/index.html` | Runtime root `#mapRoot`; compatibility iframe is inside the Map adapter | `map-composer.mjs` mounts the registered Map Runtime adapter and passes bounded URL observer values. The adapter retains the tested `map-poc.html` iframe boundary until the production Map implementation replaces it. | Direct Map Runtime host with a documented temporary adapter. |
| `/calendar/` Events | `.page-wrap` · `sites/staging/calendar/index.html` | Events calendar `#nrc-root-page`; JSON/RSS links `.rss-link` | Calendar page invokes generated `window.runCalendarWidget`; feed links remain host-owned compatibility links. | Thin Runtime Events host preserving JSON/RSS contracts. |
| `/sun/` Sun & Moon | `body` · `sites/staging/sun/index.html` | Sun & Moon `#w-sun` | Standalone page directly mounts the legacy module through a weather store facade. | Thin Runtime Sun & Moon host using shared Platform Context. |

The complete per-surface fields, including exact source paths and compatibility routes, are in the JSON descriptor. The matrix intentionally records current gaps rather than claiming migrations that have not happened.

## Explicitly excluded host applications

| Application | Route/root | Classification | Reason |
|---|---|---|---|
| Showcase | `/showcase/` · `body` | `host_shell` | Widget Lab constructor and preview application; it composes widgets but is not itself a widget. |
| Settings | `/?page=settings` · `#page-settings` | `host_shell` | Application settings and persistence. |
| Stats | `/?page=stats` · `#page-stats` | `host_shell` | Application analytics and diagnostics. |

## Non-duplication boundary

This descriptor references the existing Registry and the authoritative paths in `WIDGET_INVENTORY.json`. It does not define loaders, schemas, mount functions, or a second catalog. Future migration stories must update the descriptor and its checks when a surface changes classification, while continuing to update the inventory only when ownership paths change.

## Solar Activity Runtime note

[`Solar Activity Widget Contract v1`](../Helio/Solar%20Activity%20Widget%20Contract%20v1.md)
defines the `solar-activity` type, its horizontal/vertical layout, the
three-column X-Ray/Solar Activity/Solar Wind presentation, and the canonical
`helio_now/v1` timeline fields. `#dbp-solar-body` is now mounted by the
registered Runtime adapter through the `dashboard-solar-activity` Composer
slot; the legacy inline renderer is no longer an active owner.
