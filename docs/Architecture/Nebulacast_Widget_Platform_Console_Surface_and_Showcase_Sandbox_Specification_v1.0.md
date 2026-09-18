# Nebulacast Widget Platform: Console Surface Migration and Showcase Sandbox

**Repository:** `IncusLuminis/nebulacast-app`  
**Branch:** `codex/widget-platform-planning`  
**Version:** 1.1
**Date:** 2026-09-11  
**Status:** Proposed planning specification; implementation and Project changes require owner approval  
**Parent architecture:** `Nebulacast_Widget_Platform_Architecture_and_Migration_Specification_v1.0.md`

## 1. Decision summary

Nebulacast will converge on one rule for the user-facing Console surfaces:

> The page owns navigation, landmarks, placement, sizing, and page-level controls. Every user-facing data or visualization surface is owned by an independent Widget Runtime instance.

The public layout contract has one deliberate exception:

- `sky` is a square-only widget. It has no horizontal or vertical user mode; every preview and external embed must use a validated square container (`width === height`).
- Every other widget exposed by the Registry has exactly two user-facing modes: `horizontal` (`width > height`) and `vertical` (`height > width`). `auto` may remain an internal Runtime/legacy resolution value, but it is not a Showcase control, public embed input, or generated output.

The target pages are:

- Dashboard (`/`)
- Sky (`/sky/`)
- Weather (`/weather/`)
- Space Weather (`/helio/`)
- Map (`/map/` and the Map tab in `/weather/`)
- Events (`/calendar/` and the Events page in the Console)
- Sun & Moon (`/sun/` and the corresponding Console panel)

Showcase, Settings, and Stats remain host applications rather than being forced into the widget model. Showcase is a special-purpose external-embed constructor: it selects a Registry widget, validates its allow-listed parameters and a preview container, opens a dedicated preview stage, mounts the real Runtime widget, and produces copyable `<div>` JavaScript and iframe HTML. Settings and Stats remain application tools.

This document is a delta plan over the completed platform work in #66–#91. It does not reopen or duplicate those stories.

## 2. Current baseline and target boundary

| Surface | Current widget/runtime state | Remaining inline, legacy, or iframe ownership | Target boundary | Migration note |
|---|---|---|---|---|
| Dashboard `/` | `console-config.mjs` and `console-composer.mjs` already mount Hero, Location, Weather, Sun & Moon, Sky, Alerts, Events, and News in several slots | `index.html` still contains the Console shell, dashboard panel orchestration, Helio/solar inline renderers, anchor iframes for Sky/Map, a lazy Weather iframe, a lazy Helio iframe, and page-specific state/event wiring | `index.html` keeps navigation, page routing, landmarks, settings and empty mount roots; all visible data surfaces are Composer-managed widget instances | Complete route-level composition; remove widget-specific DOM/data ownership from the shell incrementally |
| Weather `/weather/` | Location, Weather, Sun & Moon, Astro and Map have Runtime adapters; Sky has an explicit new mount API with a legacy adapter | The page directly imports legacy mount functions, owns tab switching and Sky bootstrap globals, includes shared modal markup, and contains a second page-level composition path | A Weather page composition mounts registered widgets through Runtime and uses Platform Context; tab/presentation shell remains page-owned | Preserve URL, location controls, tab persistence and `?embed=1`; direct legacy mounts become compatibility adapters |
| Sky `/sky/` | `sky/platform-adapter.mjs` and `mountSky()` exist; legacy bootstrap is isolated | Standalone HTML still bootstraps `widget.js` through the compatibility path and owns Sky-specific chrome/player markup | Generic or dedicated host mounts `sky` through Runtime in a square root; legacy globals are used only by a documented compatibility entry point | Keep current route and catalog/ranking behavior; do not combine with astronomy-kernel unification; reject non-square dimensions |
| Space Weather `/helio/` | `helio/dist/helio.widget.js` exposes `window.HelioWidget`; the Console also renders Helio-like panels inline | Global script API, inline mount wrapper, diagnostics markup, and duplicated Console Helio/solar/storm presentation | A `space-weather` Registry definition owns Helio data, rendering, refresh, loading/degraded/error state and disposal; page keeps only host shell and root | This is a new Runtime registration/adaptation story, not a rewrite of data generation |
| Map `/map/` and Weather Map tab | A registered `map` adapter exists; `map/index.html` wraps `weather/map-poc.html` in an iframe | Production route and Console still use iframe/POC path and postMessage/same-origin DOM poking; `map-poc.html` remains a large legacy implementation | Direct `map` Runtime instance in the generic host/page composition; iframe retained only as an explicit compatibility route while needed | Reconfirm the production implementation from #75 before deleting or deprecating POC assets |
| Events `/calendar/` | `events` is Registry-backed and can use the common Runtime | Standalone calendar page still renders legacy markup and calls `window.runCalendarWidget()` | Generic host or dedicated thin shell mounts `events`; generated JSON/RSS contracts remain unchanged | Keep public calendar URL and JSON/RSS links |
| Sun & Moon `/sun/` | `sun-moon` is Registry-backed and has instance lifecycle | Standalone page directly imports the legacy weather store and `mountSunMoon`; page owns CDN setup and wrapper markup | Generic host or thin composition mounts `sun-moon` through Runtime and Platform Context | Preserve lunar snapshot and existing horizon-event semantics |
| Showcase `/showcase/` | #88 provides a Registry-driven card gallery, per-card controls, one preview per widget type, and outputs for the currently opted-in embed types | No dedicated preview stage, no independent instances of the same type, no shape-aware validation, no explicit width/height workflow, and the current JavaScript output is not yet a complete public `<div>` contract for every eligible widget | A Widget Lab host backed by one Registry, normalized public config, real Runtime previews, a dedicated dialog stage, and two external output forms: JavaScript mount into `<div>` and iframe HTML | Follow up #88 and #87; do not reopen or duplicate either closed story and do not create a second catalog, config schema, or embed generator |
| Settings `/` page `settings` | Application settings UI | Deliberately non-widget controls and persistence | Remains host-owned | Out of scope for this migration |
| Stats `/` page `stats` | `console/stats_page.js` application surface | Deliberately non-widget analytics/diagnostic UI | Remains host-owned | Out of scope for this migration |

## 3. Architecture contract

### 3.1 Page composition contract

Each target page must have a thin composition descriptor with:

```js
{
  page: "weather",
  version: 1,
  context: "platform",
  slots: [
    { id: "weather-main", root: "#weather-main", widget: "weather", config: {} }
  ],
  compatibility: {
    legacyRoute: "/weather/weather-vertical.html"
  }
}
```

The exact module and selector names are implementation decisions. The rules are not:

- the descriptor references Registry widget types, never page-specific renderer functions;
- the page shell owns slot placement, tabs, navigation, page title, outer dimensions and visibility;
- a widget owns all markup, data fetching, lifecycle, internal responsive layout and meaningful loading/error/empty states;
- the page never becomes an intermediate data provider for a widget;
- context-aware widgets consume the shared Platform Context, not URL/localStorage globals directly;
- page changes destroy hidden/unmounted instances when the chosen policy does not require preservation;
- a compatibility adapter may keep an existing URL or global API alive, but it cannot become the new composition path.

### 3.2 Public shape and orientation contract

Shape is part of Registry metadata and is enforced at the host boundary before a Runtime mount. It is not inferred from CSS, viewport width, or a widget's private renderer.

Every definition must declare a layout capability equivalent to:

```js
{
  layout: {
    shape: "square" | "oriented",
    userModes: ["square"] | ["horizontal", "vertical"],
    defaultMode: "square" | "horizontal" | "vertical"
  }
}
```

The required rules are:

- `sky` declares `shape: "square"`, `userModes: ["square"]`, and accepts only a container whose finite width and height are equal and greater than zero.
- Every other user-facing Registry definition declares `shape: "oriented"` and exactly `userModes: ["horizontal", "vertical"]`. Horizontal validation is strict `width > height`; vertical validation is strict `height > width`; equal dimensions are invalid.
- The Showcase and public embed normalizers expose only `userModes`. They never expose `auto`.
- Runtime may continue to resolve `orientation: "auto"` for existing Console/legacy callers and compatibility tests. That internal value is not a third product mode and must not appear in new generated snippets.
- The host owns width, height, and shape validation. The widget receives the normalized public orientation/mode plus only its declared widget options. A widget cannot silently override the container contract.
- Presets, if offered, must satisfy these same inequalities. Custom dimensions are finite, positive, bounded by the approved UI contract, and revalidated on every mode or size change.

Sky's square rule is a product invariant, not a suggestion: the preview cannot launch with an invalid rectangle, and iframe/`<div>` output must carry the same square dimensions or a clear square-container requirement.

### 3.3 Registry metadata and normalized public configuration

The single Registry remains authoritative for catalog entries, loaders, defaults, supported widget options, capabilities, and external output eligibility. The migration adds shape/output metadata; it does not add a Showcase-only catalog or schema. A definition should provide metadata equivalent to:

```js
{
  type: "sky",
  version: 1,
  layout: {
    shape: "square",
    userModes: ["square"],
    defaultMode: "square"
  },
  supportedOptions: { theme: ["inherit", "dark", "light"] },
  capabilities: {
    multiInstance: true,
    divEmbed: true,
    iframeEmbed: true
  }
}
```

For a non-Sky widget, `layout.userModes` is exactly `["horizontal", "vertical"]`. The metadata must distinguish:

- widget options, which are normalized by the existing `widget-config` contract;
- host layout, which contains the validated mode and width/height;
- output capabilities, which determine whether JavaScript `<div>` and/or iframe output is available.

The public embed input is a registered widget name, a versioned allow-listed widget config, and a validated host layout. It never contains a loader, module URL, mount function, callback, HTML, arbitrary data endpoint, or executable value. The normalized output is deterministic and serializable. Existing `widget-config.v1` and JavaScript Embed API v1 compatibility remain intact for #85–#89; the follow-up public `<div>` story may add a separately versioned facade or capability without changing those legacy inputs.

### 3.4 Space Weather contract

The existing Helio data schema and generated `/data/helio_now.json` remain the provider contract. The new widget definition must expose an instance-local equivalent of:

```js
{
  type: "space-weather",
  version: 1,
  defaults: {
    orientation: "horizontal",
    theme: "inherit",
    density: "normal",
    dataUrl: "/data/helio_now.json"
  },
  layout: {
    shape: "oriented",
    userModes: ["horizontal", "vertical"]
  },
  capabilities: {
    observerAware: false,
    timeAware: false,
    multiInstance: true,
    embed: true
  }
}
```

Only fields actually supported by the Helio implementation may be exposed in `supportedOptions`. `dataUrl`, loader paths, executable callbacks, arbitrary HTML and arbitrary module URLs are never user configuration. The widget must support bounded refresh, abort/dispose, normal/empty/stale/degraded/error states, and independent instances.

The first migration does not unify astronomy formulas or redesign the Helio scoring model. Those remain separate work unless a later approved specification changes the scope.

### 3.5 Compatibility contract

The following must remain operational during migration:

- `/`, `/weather/`, `/sky/`, `/helio/`, `/map/`, `/calendar/`, and `/sun/` URLs;
- existing Weather `?embed=1` behavior and location/time URL semantics;
- standalone Sky `SKY_CONFIG`/`__skyWidget` behavior through `legacy-bootstrap.mjs` only;
- generated calendar, alerts, sky, weather, and Helio assets;
- backend API schemas and Cloudflare Pages deployment structure;
- existing iframe and JavaScript embed APIs already delivered by #85–#87.

Compatibility pages may be thin adapters or redirects after a supported replacement is proven. No legacy file is deleted merely because a Runtime adapter exists.

## 4. Showcase Widget Lab UX

Showcase becomes a visual external-embed constructor rather than a list of documentation cards. The primary flow is:

1. Choose a registered widget from the catalog.
2. Create a sandbox instance and select only its Registry-declared widget parameters.
3. Choose the user-facing layout mode: `square` for Sky, or `horizontal`/`vertical` for every other widget.
4. Enter or choose bounded `width` and `height`. The form rejects `width === height` for oriented widgets and rejects `width !== height` for Sky.
5. Open the dedicated Preview Stage and mount the real Runtime instance in the validated container.
6. Change parameters or dimensions and apply an update; if the widget contract requires remount, the old instance is destroyed before the new one is mounted.
7. Inspect the live result and copy the normalized external output: JavaScript that mounts into a caller-owned `<div>` and a separate iframe HTML snippet. The outputs include the selected dimensions and mode where their public contract supports them.
8. Add another instance, retry a failed instance, reset one instance, close the stage, or reset the whole lab.

### 4.1 Dedicated Preview Stage

The default “separate window” is a same-document modal `<dialog>` (the **Preview Stage**), not a browser `window.open()` popup. It is large enough to inspect the selected container, but keeps the catalog/inspector context and works reliably in the local static Showcase without popup permissions or a second application route. A future pop-out may reuse the same public embed route, but it is not required for the first delivery.

The dialog contains:

- a labelled stage toolbar with widget name, mode, width, height, Apply, Retry, Reset and Close controls;
- one or more independently framed preview containers, each labelled with widget type, instance id and current state;
- a readable validation/error area for an invalid rectangle, failed mount or timeout;
- an output panel for the selected instance, with copyable JavaScript `<div>` and iframe HTML tabs.

Opening the dialog moves focus to its heading or first invalid field. Focus is trapped while open, `Escape` closes it, and focus returns to the control that opened it. Closing the dialog does not destroy instances unless the user selects Reset/Destroy or the lifecycle policy explicitly requires cleanup; reopening must show the same deterministic state. A page-level fallback panel is allowed when native `<dialog>` is unavailable, but it must preserve the same modal semantics, labelling and focus return.

### 4.2 Proposed layout

```text
+----------------------+-----------------------------------------------+
| Widget catalog       | Preview Stage dialog                         |
| search + descriptions| toolbar: widget | mode | width | height       |
| Create preview       | real Runtime containers + state/actions      |
|                      | output tabs: JS <div> | iframe HTML          |
+----------------------+-----------------------------------------------+
```

On narrow screens the catalog and inspector become a logical sequence and the Preview Stage becomes a full-screen dialog. The stage uses the exact width/height supplied by the user; it does not infer a third orientation from the viewport.

### 4.3 Sandbox instance model and state

Each created instance has a unique host id and immutable identity separate from its widget type:

```js
{
  id: "sandbox-3",
  widget: "weather",
  config: { orientation: "vertical", ... },
  layout: {
    mode: "vertical",
    width: 420,
    height: 600,
    valid: true
  },
  preview: "closed" | "open",
  state: "idle" | "loading" | "ready" | "error" | "timeout" | "destroyed"
}
```

`layout.mode` is `square` for Sky and otherwise `horizontal` or `vertical`; it is never `auto` in this public model. The host owns dimensions, validation, the dialog, visual frame and placement. The widget controls its internal layout and lifecycle. There is no one-instance-per-widget restriction: two Weather instances with different configuration must coexist without shared mutable UI state.

The state machine must make transitions deterministic:

```text
idle -> loading -> ready
idle -> loading -> error|timeout
ready -> loading -> ready|error|timeout
ready -> destroyed
error|timeout -> loading (retry) | destroyed
```

Invalid layout is a host validation state before `loading`; it cannot invoke Runtime. Closing the Preview Stage is a UI state change, not an implicit successful mount or a substitute for `destroyed`.

### 4.4 Registry-driven controls and outputs

- Catalog cards, shape/mode metadata, widget controls and output capabilities come from `registry.list()` / `widgetCatalog` metadata.
- Widget option controls come from `supportedOptions`; values are normalized by the existing `widget-config` contract.
- `Sky` renders no horizontal/vertical selector. All other widgets render exactly those two choices and never render `auto`.
- Host dimensions and mode are Sandbox controls, not widget-specific configuration. The normalized external config records the host layout separately from widget options where the public embed contract requires it.
- The JavaScript output is a public, versioned API call that mounts the selected normalized widget into a caller-owned `<div>` and can be unmounted/destroyed. It uses only a documented public module URL and public API names; it does not import private adapters or registry loaders.
- The iframe output is a separate self-contained HTML snippet with a documented public host URL, safe title, validated width/height and normalized config. It does not depend on same-origin DOM access or a private page path.
- `serializeWidgetConfig`, `buildStandaloneWidgetUrl`, `buildIframeEmbedSnippet`, and the existing JavaScript serialization paths are reused or wrapped; a follow-up story must close the gap where the current JS output supports only the existing opt-in types and does not yet prove a complete public `<div>` contract.
- Unsupported output capability is explicit and readable. No fake snippet is generated, and a widget is not advertised as externally embeddable until its metadata and public contract are validated.
- The UI never accepts a loader, mount function, arbitrary URL, HTML fragment, script, callback, module path or data endpoint as configuration.

### 4.5 Accessibility, security, and resilience

- Use landmarks for catalog, stage, inspector and outputs; the Preview Stage is a labelled modal dialog with an accessible name and description.
- Every control has a visible label; width/height fields have bounded numeric input, invalid-value feedback and an explicit explanation of the square/strict-inequality rule.
- Create, Apply, Retry, Reset, Destroy and Close are keyboard-operable with visible focus. Focus is trapped and restored according to 4.1.
- Selected instance, mode, dimension validation and lifecycle changes are exposed through a polite live region; errors are readable text, not color alone.
- Canvas widgets retain their textual/semantic alternative where available.
- The lab uses the existing allow-list and versioned config normalizer; it never evaluates user text or loads remote code.
- A hanging loader or request reaches a bounded timeout state and offers retry/destroy without blocking sibling instances.
- Generated JavaScript and iframe HTML contain only public, normalized, serializable data. They do not expose private module paths, arbitrary module/config input, executable callbacks or unsafe HTML injection paths.
- Reset destroys every owned Runtime instance and clears timers, observers, listeners, pending requests and generated state. Closing the dialog never leaves an orphaned preview root.

## 5. Explicit non-goals

This plan does not include:

- changing Settings or Stats into widgets;
- building user authentication, persistence or a shareable user-created Console layout;
- drag-and-drop layout editing for the production Console;
- replacing Cloudflare Pages, the static ES-module approach, or generated data pipelines;
- rewriting Weather scoring, Helio scoring, Map rendering, Sky astronomy algorithms, or the astronomy kernel;
- accepting arbitrary user JavaScript, HTML, CSS, remote modules, data endpoints, or third-party widgets;
- making `auto` a user-selectable Showcase or external-embed mode;
- treating Sky as an oriented widget or allowing a non-square Sky container;
- deleting every legacy page or file in the first migration;
- inventing new priorities, estimates, sizes, dates, milestones, or status values.

## 6. Phased delivery

### Phase A — Contract and UX sign-off

Approve this page-boundary map, the Space Weather widget contract, the square/oriented layout metadata, the public `<div>`/iframe output contract, and the Showcase Widget Lab dialog/wireframe. No implementation story enters `Ready` before the UI-facing contract is agreed.

### Phase B — Runtime surface completion

Register/adapt Space Weather and introduce route-level composition descriptors. Do not change the visible Console behavior until the adapters have independent lifecycle and compatibility tests.

### Phase C — Console and page migration

Migrate Dashboard first, then Weather, Sky, Map, Space Weather, Events, and Sun & Moon. Each route should become a thin host of Runtime instances while legacy URLs remain covered by compatibility tests.

### Phase D — Showcase Widget Lab

Deliver the dedicated Preview Stage dialog, shape-aware metadata-driven inspector, multi-instance preview lifecycle, public JavaScript `<div>` contract, separate iframe HTML output, reset/error/timeout behavior, accessibility and security checks.

### Phase E — Cross-surface release gate

Run deterministic local browser tests for every target route, all supported embed paths, two-instance behavior, resize/orientation changes, context changes, normal/error/degraded states, and remount cleanup. Human owner decides when validated cards move to `Done`.

## 7. Reuse and non-duplication map

Reuse the completed work rather than opening replacement issues for:

- #66 — inventory and ownership;
- #69–#71 — Registry, Runtime, context and lifecycle harness;
- #72 — Location adapter;
- #73 — Sun & Moon and Astro adapters;
- #74 — Weather Runtime/multi-instance adaptation;
- #75 — production Map selection and registration;
- #76–#78 — Sky lifecycle, legacy bootstrap and regressions;
- #79–#82 — News, Events, Alerts and Hero adapters;
- #83–#84 — declarative Composer and first Console panel migration;
- #85–#87 — generic host, iframe and current opt-in JavaScript embed contracts;
- #88 — initial Registry-driven Gallery and output generation; extended by the new Widget Lab stories;
- #89–#91 — compatibility, performance, accessibility and embed-security gates.

The new backlog below is a delta: it completes route-level ownership and substantially extends #88 into the requested multi-instance embed lab. Existing stories remain dependencies or evidence; they are not recreated as children of the new epics. The new public `<div>` contract is a follow-up to #87 because the current implementation exposes JavaScript mounting only for its existing opt-in definitions; it does not duplicate or reopen #87.

## 8. Proposed issue-ready backlog

Issue types are shown explicitly. Proposed issues have no priority, size, estimate, start date, target date, or Project status assigned by this planning document.

### 8.1 Backlog delta from v1.0

This revision does not create or modify GitHub Issues. It is the planning delta to apply only after owner approval:

- **Changed stories:** A1–A7, B1–B4, B6–B8. They now carry `[CHANGED]` in this document and add shape validation, removal of public `auto`, dedicated Preview Stage behavior, or output compatibility requirements.
- **New story:** B5, **Deliver the public JavaScript `<div>` embed contract**. It is an additive follow-up to #87, not a duplicate or reopening of #87, because the current API is opt-in for only existing definitions and the requested external `<div>` contract is not yet proven for the Widget Lab's eligible catalog.
- **Renumbering:** The former B5/B6/B7 responsibilities are now B6/B7/B8 so the new public `<div>` contract has an explicit dependency and acceptance boundary.
- **Closed work reused, not duplicated:** #66–#91 remain dependencies/evidence. In particular, #85–#89 continue to provide the generic host, iframe, JavaScript, compatibility and initial Gallery foundations; B5/B6 extend them without recreating their acceptance criteria.
- **Dependencies added or made explicit:** A1 and A2 carry the layout metadata contract; B3 depends on #89 for compatibility/config safety; B5 depends on #85, #87, #88, #89 and B3; B6 depends on B5; B8 depends on A7 and all B stories.

### Epic A — Complete Console and public page migration to Widget Runtime

**Scope:** Replace remaining page-owned data surfaces, inline renderers, and iframe composition on Dashboard and the seven target public pages with thin host shells and Registry-backed Runtime instances.

**Outcome / Definition of Done:** Each in-scope route renders its user-facing data surfaces through independently mountable widgets, preserves existing URLs/data contracts and compatibility behavior, and passes the route-level regression gate. Settings, Stats, and Showcase remain host applications according to their separate contracts.

#### A1. [CHANGED] Establish route composition descriptors and ownership audit

**Scope:** Define the route/page composition contract, slot naming, context policy, legacy adapter policy, and an auditable page-to-widget ownership matrix for `/`, `/weather/`, `/sky/`, `/helio/`, `/map/`, `/calendar/`, and `/sun/`.

**Acceptance criteria**

- [ ] Each target route has a documented composition descriptor with widget type, root/slot, context requirement, and compatibility route.
- [ ] Every visible data/visualization surface is classified as Runtime widget, host shell, or temporary compatibility adapter.
- [ ] Every Registry definition used by a target route declares the shape contract: Sky is square-only; all other widgets expose exactly horizontal/vertical public modes.
- [ ] The matrix distinguishes internal/legacy `auto` resolution from public modes and confirms `auto` is not emitted by Showcase/embed generators.
- [ ] The descriptor references Registry types and does not duplicate widget schemas or loaders.
- [ ] The matrix names authoritative source files, public/generated artifacts, and local validation commands.
- [ ] Settings, Stats, and Showcase are explicitly classified as host applications.

**Validation:** Static descriptor/inventory tests and review against the current architecture audit; no Project status change.

**Dependencies:** #66, #69–#71, #83–#85.

**Out of scope:** Implementing any route migration or redesigning visual styles.

#### A2. [CHANGED] Register Space Weather as an independent Runtime widget

**Scope:** Adapt the existing Helio widget/data contract into a `space-weather` Registry definition with instance-local lifecycle, configuration normalization, bounded refresh and local state rendering.

**Acceptance criteria**

- [ ] `space-weather` is discoverable from the single Registry and can mount through the common Runtime.
- [ ] Its Registry metadata declares an oriented shape with exactly horizontal/vertical public modes; any internal `auto` compatibility behavior is not public configuration.
- [ ] Existing `/data/helio_now.json` schema and generated pipeline remain unchanged.
- [ ] No new path depends on `window.HelioWidget` or page-owned Helio DOM; any legacy API is isolated in an adapter.
- [ ] Two instances have independent DOM, refresh/dispose state, error state and configuration.
- [ ] Normal, empty, stale/degraded, timeout and error responses render bounded readable local states.
- [ ] `destroy()` clears timers/listeners/observers and aborts owned requests where applicable.

**Validation:** Unit contract/lifecycle tests, malformed/timeout fixture tests, and local `/helio/` browser smoke.

**Dependencies:** #69–#71, #90–#91.

**Out of scope:** Astronomy-kernel or Helio scoring redesign.

#### A3. [CHANGED] Complete Dashboard migration to Composer-owned widget surfaces

**Scope:** Finish the `/` Dashboard composition after #84 by replacing remaining Sky/Map/Weather/Helio iframes and inline Helio/solar/storm data rendering with registered widget slots or explicitly approved host-only controls.

**Acceptance criteria**

- [ ] Dashboard data and visualization surfaces are mounted from a declarative Composer configuration.
- [ ] `index.html` does not read sibling widget DOM, serve as a data provider, or own widget-specific renderers for migrated surfaces.
- [ ] Dashboard Sky, Map, Weather, Sun & Moon and Space Weather instances receive Platform Context/configuration through Runtime.
- [ ] Dashboard supplies square dimensions to Sky and a strict horizontal/vertical mode plus valid dimensions to every other oriented widget.
- [ ] Navigation, Settings, Stats, page routing, modal ownership where genuinely shared, and outer layout remain functional.
- [ ] Existing `/` URL, responsive layout, location/time changes and lazy-loading behavior remain compatible.
- [ ] A widget failure does not prevent sibling slots from mounting.

**Validation:** Dashboard browser matrix for load, navigation, resize, location/time changes, iframe removal and remount cleanup; static scan for forbidden new iframe/DOM-provider patterns.

**Dependencies:** A1, A2, #72–#84, #90–#91.

**Out of scope:** Settings/Stats widgetization and user-customizable Dashboard layouts.

#### A4. [CHANGED] Migrate Weather page to a Runtime composition host

**Scope:** Convert `/weather/` from direct legacy imports plus page-owned Sky bootstrap/tab wiring into a thin composition host using Runtime and Platform Context for Location, Weather, Map, Sun & Moon, Astro and Sky.

**Acceptance criteria**

- [ ] Weather page mounts registered widgets through one composition path.
- [ ] Tab navigation and `nc-weather-tab` persistence remain functional and do not create duplicate instances.
- [ ] `?embed=1`, location URL parameters, manual/live time and observer changes remain compatible.
- [ ] Sky no longer requires `SKY_CONFIG`/`__skyWidget` on the new path; only the documented legacy adapter may use them.
- [ ] Weather's Sky tab always uses a square root; every other tab's widget uses only horizontal or vertical public mode and valid dimensions.
- [ ] Page-level modals are either owned by the responsible widget or explicitly documented as shared host infrastructure.
- [ ] Existing Weather-family lifecycle, two-instance and responsive tests remain passing.

**Validation:** `/weather/` browser smoke for every tab, context update, resize/orientation, remount and embed query; unit/static composition tests.

**Dependencies:** A1, #72–#78, #83–#85.

**Out of scope:** Splitting the large Weather module or redesigning tabs.

#### A5. [CHANGED] Migrate standalone Sky and Map routes to direct Runtime hosts

**Scope:** Make `/sky/` and `/map/` thin Runtime hosts. Replace the supported Map route's POC iframe composition and preserve explicit compatibility behavior for legacy Map URLs and standalone Sky bootstrap.

**Acceptance criteria**

- [ ] `/sky/` mounts the registered Sky widget through the explicit instance API and preserves catalog/ranking/player behavior.
- [ ] `/sky/` validates and maintains a square root at initial mount and resize; no horizontal/vertical Sky selector or non-square fallback exists.
- [ ] `/map/` mounts the selected production Map implementation directly through Runtime, or documents a tested temporary adapter with a removal condition.
- [ ] POC/legacy Map files do not become a second production implementation.
- [ ] Same-origin/postMessage coupling is removed from the new path unless required and documented by the selected Map adapter.
- [ ] Existing route URLs and any deliberate compatibility redirects/adapters are browser-tested.

**Validation:** Sky and Map route smoke, two-instance/remount tests, map layer/error behavior, and static scan for unsupported page-global ownership.

**Dependencies:** A1, #75–#78, #85, and the production-path decision from #75.

**Out of scope:** Map rendering rewrite or Sky astronomy algorithm unification.

#### A6. [CHANGED] Migrate Space Weather, Events, and Sun & Moon standalone hosts

**Scope:** Replace direct global/legacy standalone bootstrap for `/helio/`, `/calendar/`, and `/sun/` with thin Runtime compositions using the `space-weather`, `events`, and `sun-moon` definitions.

**Acceptance criteria**

- [ ] Each route has a single root and mounts its widget through the common Runtime.
- [ ] Each non-Sky route declares and validates exactly one public mode, horizontal or vertical, without exposing `auto`.
- [ ] `/calendar/` preserves generated JSON/RSS links and event filtering behavior.
- [ ] `/sun/` preserves lunar snapshot, Sun Equation and event semantics without creating a second astronomy contract.
- [ ] `/helio/` preserves Helio diagnostics/freshness semantics while no longer requiring a page-global `HelioWidget` on the new path.
- [ ] Invalid configuration and provider failures remain local readable states.

**Validation:** Route-level browser smoke, generated-data regression, lifecycle/remount tests and legacy URL compatibility checks.

**Dependencies:** A2, #73, #80–#82, #85.

**Out of scope:** Changing generated data formats, event taxonomy or astronomy calculations.

#### A7. [CHANGED] Run the post-migration Console surface compatibility gate

**Scope:** Validate all seven target pages plus Dashboard after the route-level migration, including normal, resize, context, failure, compatibility and cleanup behavior.

**Acceptance criteria**

- [ ] Covers `/`, `/weather/`, `/sky/`, `/helio/`, `/map/`, `/calendar/`, and `/sun/` from local `sites/staging/` serving.
- [ ] Verifies mount, update, destroy, remount, two instances, orientation/size and sibling failure isolation where applicable.
- [ ] Verifies Sky square-only behavior and strict horizontal/vertical dimension inequalities for every other target widget.
- [ ] Verifies existing iframe/JavaScript embed contracts remain operational after route changes.
- [ ] Verifies no unsupported cross-page globals, duplicate catalog/schema or orphan polling remains.
- [ ] Records deterministic evidence and leaves the branch clean.

**Validation:** Node/unit/typecheck/static checks plus Playwright route matrix with network fixtures and explicit timeout/error assertions.

**Dependencies:** A3–A6, #89–#91.

**Out of scope:** Staging deployment and human `Done` transitions.

### Epic B — Build the Showcase Widget Lab sandbox

**Scope:** Extend #88's Registry-driven Gallery into a visual external-embed constructor: select a widget, configure allow-listed options, choose its valid shape/mode, set width/height, inspect a real Runtime preview in a dedicated stage, and copy JavaScript `<div>` and iframe HTML outputs.

**Outcome / Definition of Done:** A user can create several independent sandbox containers, configure only Registry-allow-listed options, launch real Runtime widgets, change validated dimensions, inspect the normalized public configuration, copy both supported external embed forms, recover from failures, and reset the lab without leaks or unsafe evaluation. Sky remains square-only; all other widgets expose exactly horizontal/vertical.

#### B1. [CHANGED] Approve the Widget Lab UX flow and accessible Preview Stage wireframe

**Scope:** Specify the catalog → create → configure → Preview Stage → inspect/copy → reset flow, responsive regions, the same-document modal `<dialog>` behavior, focus handling, and empty/loading/error/timeout states.

**Acceptance criteria**

- [ ] Wireframe covers desktop and narrow layouts for catalog, inspector, Preview Stage and output regions.
- [ ] The default separate preview is a labelled, focus-managed modal/dedicated panel; browser pop-out is optional, not required.
- [ ] Sky is represented as square-only; every other widget as exactly horizontal/vertical.
- [ ] Width/height entry, invalid rectangle feedback, output tabs and close/reset behavior are specified.
- [ ] All user actions and keyboard/focus behavior are specified, including focus return after close.
- [ ] The design is reviewed by Product Owner and UI/UX role before implementation enters `Ready`.

**Validation:** UX walkthrough and accessibility checklist against section 4.

**Dependencies:** A1, #88, #91.

**Out of scope:** Implementing the Showcase.

#### B2. [CHANGED] Implement the sandbox instance model and lifecycle state machine

**Scope:** Add a host-owned model for unique instances, validated layout dimensions/mode, selected instance, Preview Stage open/closed state, and Runtime mount/update/destroy orchestration.

**Acceptance criteria**

- [ ] Each instance has a unique identity independent of widget type and keeps its own config, layout and lifecycle state.
- [ ] Multiple instances of one or different widget types coexist with isolated configuration and lifecycle.
- [ ] Sky layout is valid only when width and height are equal; oriented layout is valid only when the selected strict inequality holds.
- [ ] Invalid layout never invokes Runtime; update/remount destroys the prior instance before replacing it and handles pending mounts safely.
- [ ] Destroy/reset clears all instance records, stage roots and owned generated output.
- [ ] Preview open/close does not create duplicate mounts or silently change lifecycle state.
- [ ] State transitions expose loading, ready, error, timeout and destroyed states deterministically.

**Validation:** Unit tests with fixture Runtime, invalid dimensions, delayed mount, rejected mount, timeout and repeated reset/destroy sequences.

**Dependencies:** B1, #69–#71, #88.

**Out of scope:** Catalog control rendering and visual styling polish.

#### B3. [CHANGED] Build Registry-driven catalog, shape/mode and container inspector

**Scope:** Replace the card-only interaction with catalog selection and an inspector derived from Registry metadata, including shape, exactly two oriented modes or Sky square-only, and bounded width/height controls.

**Acceptance criteria**

- [ ] Catalog contents, labels, layout metadata and output capabilities are derived from the single Registry/catalog source.
- [ ] Sky renders only `square`; every other widget renders exactly `horizontal` and `vertical`; `auto` is absent from public controls and generated output.
- [ ] Widget-specific controls and values come only from `supportedOptions` and the existing config normalizer.
- [ ] Width/height presets and custom values are finite, bounded, keyboard-editable and validated against the selected shape/mode.
- [ ] Host dimensions/mode remain separate from widget options and are not passed as arbitrary config keys.
- [ ] Changing the selected widget or inspector values updates only the selected instance.
- [ ] No duplicate widget list, loader map, schema or unsafe config path is introduced.

**Validation:** Metadata equality tests, shape/inequality and invalid-option tests, keyboard form tests and browser inspector smoke.

**Dependencies:** B1, B2, #88, #85, #89.

**Out of scope:** Arbitrary CSS/theme editor and drag-and-drop layout editing.

#### B4. [CHANGED] Mount real Runtime previews in independent Preview Stage containers

**Scope:** Render the dedicated stage and mount the selected Registry widget into each validated sandbox container, including resize/mode updates, remount and destroy controls.

**Acceptance criteria**

- [ ] Preview content is produced by the real Widget Runtime, not a mock or duplicate renderer in production code.
- [ ] At least two simultaneous instances can be visible and remain independent.
- [ ] Sky preview remains square during create, resize and update; oriented previews preserve the strict selected inequality.
- [ ] Apply/update, retry, destroy and per-instance reset work without stale DOM or leaked resources.
- [ ] A failed widget leaves sibling previews usable.
- [ ] The Preview Stage remains usable at custom dimensions without relying on a browser pop-out.

**Validation:** Browser tests with deterministic widget/data fixtures, ResizeObserver/viewport changes, two instances and repeated remount.

**Dependencies:** B2, B3, #88, #90.

**Out of scope:** Persisting sandbox layouts between sessions.

#### B5. [NEW] Deliver the public JavaScript `<div>` embed contract

**Scope:** Audit the JavaScript output delivered by #87 and add the missing public contract needed to mount eligible Registry widgets into an external page's caller-owned `<div>`. The current implementation is an opt-in API for only the existing definitions and uses a runtime module path that must not be treated as a private dependency in new generated code.

**Acceptance criteria**

- [ ] A documented, versioned public module/API entry point exposes mount plus unmount/destroy semantics for each widget marked `divEmbed`.
- [ ] The API accepts only a registered widget type, normalized allow-listed widget config and validated host layout; it rejects loaders, arbitrary module/config paths, callbacks, HTML, scripts and unsafe values.
- [ ] The generated example mounts into a caller-owned `<div>` and carries or documents the selected width/height and mode; Sky's example is square-only.
- [ ] Every widget advertised by Showcase as a JavaScript `<div>` output is explicitly marked and tested in Registry metadata; unsupported widgets are visibly unavailable rather than given a misleading snippet.
- [ ] The public API is self-contained from the integrator's perspective: no private adapter import, Console DOM selector, same-origin bridge or undocumented data contract is required.
- [ ] Existing #87 JavaScript Embed API v1 behavior and #85–#89 compatibility tests remain passing; this story is an additive follow-up, not a rewrite of those stories.

**Validation:** Public API contract tests for one square and at least two oriented widgets, normalized-config/security fixtures, external HTML fixture smoke, and compatibility tests from #87.

**Dependencies:** #85, #87, #88, #89, B3.

**Out of scope:** New authentication, remote deployment, or arbitrary third-party widget loading.

#### B6. [CHANGED] Add normalized config and separate iframe HTML output inspector

**Scope:** Show outputs for the selected sandbox instance using the public `<div>` contract from B5 and the existing versioned iframe/standalone serializers, with width/height and mode kept consistent with the preview.

**Acceptance criteria**

- [ ] Serialized config exactly matches the normalized instance configuration and version, with host layout represented according to the approved public contract.
- [ ] JavaScript output is the public `<div>` snippet from B5 and contains no loader, executable config, arbitrary HTML or private DOM dependency.
- [ ] iframe output is a separate self-contained HTML snippet with a documented public host URL, safe title, validated width/height and normalized config.
- [ ] Sky iframe output is square; oriented iframe output preserves the selected horizontal/vertical inequality.
- [ ] Output updates after configuration changes and never contains stale values from another instance.
- [ ] Copy/selectable output has accessible status feedback, safe link attributes and explicit unavailable messaging when a capability is not enabled.

**Validation:** Serializer contract tests, output allow-list/security fixtures and browser copy/status smoke.

**Dependencies:** B3–B5, #85–#88.

**Out of scope:** New embed protocols or remote deployment changes.

#### B7. [CHANGED] Add reset, timeout/error recovery, accessibility and security hardening

**Scope:** Complete Widget Lab resilience and release behavior for failures, keyboard use, readable state feedback, modal lifecycle and unsafe configuration rejection.

**Acceptance criteria**

- [ ] Reset selected and reset-all destroy Runtime instances and clear pending operations, stage roots and output state.
- [ ] Loader/request timeout becomes an actionable local timeout state with retry/destroy; sibling instances are unaffected.
- [ ] Catalog, stage, inspector, dialog and outputs have semantic landmarks, labels, focus handling and non-color status messaging.
- [ ] Canvas previews expose or preserve textual alternatives where supported.
- [ ] Arbitrary module URLs, functions, HTML, script-like values and unallow-listed config keys are rejected before mount or serialization.
- [ ] No unsafe `innerHTML` path is introduced for user-provided configuration or generated output.
- [ ] Close/reopen and fallback non-`<dialog>` behavior do not leak listeners, observers, timers or Runtime instances.

**Validation:** Accessibility-oriented browser checks, invalid-config fixtures, timeout/retry tests, static security scan and lifecycle leak checks.

**Dependencies:** B2–B6, #90–#91.

**Out of scope:** Authentication or multi-user sharing.

#### B8. [CHANGED] Run the deterministic Showcase Widget Lab acceptance matrix

**Scope:** Prove the complete sandbox and external-embed flow locally with real Registry/Runtime integration and deterministic network/fixture behavior.

**Acceptance criteria**

- [ ] Covers widget selection, creation, allow-listed options, Sky square mode, oriented horizontal/vertical modes, bounded width/height, Preview Stage launch, update/remount, destroy and reset.
- [ ] Covers two instances of the same widget and two different widgets.
- [ ] Covers real Runtime loading, ready, empty, error and timeout/retry states without arbitrary sleeps.
- [ ] Confirms catalog/control/layout/output inventory equals Registry metadata and has no duplicate schema.
- [ ] Confirms generated JavaScript `<div>` and iframe HTML are externally usable, public-path-only and consistent with preview dimensions/mode.
- [ ] Confirms #85–#91 compatibility paths remain passing, branch tests pass, and generated test artifacts are cleaned before handoff.

**Validation:** Unit, typecheck, static/diff checks and Playwright Showcase/external fixture tests against local `sites/staging/`.

**Dependencies:** B1–B7, A7.

**Out of scope:** Staging deployment and human `Done` transitions.

## 9. Project status recommendations

These are recommendations only; this document makes no Project or issue-status changes.

- Keep Epic A and Epic B, and all new stories, in `Backlog` until this specification and the UX wireframe are approved.
- After acceptance criteria, dependencies, and (where required) UI/UX review are agreed, move only implementation-ready stories to `Ready`.
- Product Owner moves a story to `Ready`; Coder moves the actively implemented story to `In Progress`; Validator moves a validated handoff to `In Review` and leaves it there; the human owner moves validated work to `Done`.
- Do not populate Priority, Size, Estimate, Start date, Target date, or other fields from this plan. They remain unspecified until the owner explicitly supplies them through normal triage.
- Recommended implementation order is A1 → A2 → A3 → A4/A5/A6 in parallel where dependencies permit → A7, with B1 before B2/B3, then B4 → B5 → B6 → B7 → B8. B5 must be approved as an additive public contract before B6 generates external snippets. A7 is a prerequisite for the final Showcase acceptance gate because it proves the same Runtime contracts across target surfaces.

## 10. Approval gate

Before issue creation or Project grooming, the human owner should approve:

1. the definition of “widget-only surface” as host shell plus independent Runtime roots;
2. the new `space-weather` Registry identity and compatibility approach;
3. direct Map route migration versus a temporary tested adapter;
4. the Widget Lab wireframe with a same-document modal/dedicated Preview Stage as the default separate window;
5. Sky's square-only metadata and the two-mode contract for every other widget;
6. the public `<div>` embed contract and its public versioned module/API entry point, including whether all currently catalogued widgets should be externally embeddable or some require an explicit capability exception;
7. the two-epic backlog delta and its dependencies.

Until then, this branch contains planning/specification only.
