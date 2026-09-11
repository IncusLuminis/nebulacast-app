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
| `/` Dashboard | `.console-root` · `sites/staging/index.html` | Hero `#console-hero`; Location `#w-location`; Weather `#w-weather`; Forecast Matrix `#w-weather-matrix`; Sun & Moon `#w-sunmoon-panel`; Sky `#db-sky-iframe`; Alerts `#fs-sky`; Events `#nrc-main`; News `#nrw-main`; observing window `#dbp-window-body`; Space Weather `#dbp-helio-body`; Solar Activity `#dbp-solar-body`; Map `#db-map-iframe` | Composer widgets are already Runtime-backed. Dashboard weather panels, iframe anchors, and inline Helio/solar renderers remain temporary adapters. | All data/visualization surfaces become independent Runtime instances; Console keeps shell and empty roots. |
| `/weather/` Weather | `.page-wrap` · `sites/staging/weather/index.html` | Location `#w-location`; Weather `#w-weather`; Sun & Moon `#w-sun`; Astro `#w-astro`; Sky `#skyMount`; Map `#w-map` | Direct legacy mounts and Sky global bootstrap are temporary adapters. Tabs remain host shell. | One Runtime composition using shared Platform Context; Sky stays square-only. |
| `/sky/` Sky | `.sky-page` · `sites/staging/sky/index.html` | Sky chart `#skyMount`; player `#skyPlayer` | Sky chart uses the documented legacy bootstrap; player is host-owned control. | Direct Runtime Sky instance in a square root; legacy bootstrap remains compatibility-only. |
| `/helio/` Space Weather | `.page-shell` · `sites/staging/helio/index.html` | Space Weather `#w-helio`; diagnostics `.page-diag` | `window.HelioWidget` global path is a temporary adapter; diagnostics are host shell. `space-weather` is not registered yet. | A2 registers an independent `space-weather` Runtime widget with shared Platform Context. |
| `/map/` Map | `body` · `sites/staging/map/index.html` | Weather Map iframe `iframe[src='/weather/map-poc.html']` | Current public host is an explicit iframe adapter around the inventory-approved Map implementation. | Direct Map Runtime instance, or a documented tested adapter until the POC route can be retired. |
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
