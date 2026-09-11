# Nebulacast Widget Platform: Console Surface Migration and Showcase Sandbox

**Repository:** `IncusLuminis/nebulacast-app`  
**Branch:** `codex/widget-platform-planning`  
**Version:** 1.0  
**Date:** 2026-09-11  
**Status:** Proposed planning specification; implementation and Project changes require owner approval  
**Parent architecture:** `Nebulacast_Widget_Platform_Architecture_and_Migration_Specification_v1.0.md`

## 1. Decision summary

Nebulacast will converge on one rule for the user-facing Console surfaces:

> The page owns navigation, landmarks, placement, sizing, and page-level controls. Every user-facing data or visualization surface is owned by an independent Widget Runtime instance.

The target pages are:

- Dashboard (`/`)
- Sky (`/sky/`)
- Weather (`/weather/`)
- Space Weather (`/helio/`)
- Map (`/map/` and the Map tab in `/weather/`)
- Events (`/calendar/` and the Events page in the Console)
- Sun & Moon (`/sun/` and the corresponding Console panel)

Showcase, Settings, and Stats remain host applications rather than being forced into the widget model. Showcase is a special-purpose host for creating and inspecting Widget Runtime instances; Settings and Stats remain application tools.

This document is a delta plan over the completed platform work in #66–#91. It does not reopen or duplicate those stories.

## 2. Current baseline and target boundary

| Surface | Current widget/runtime state | Remaining inline, legacy, or iframe ownership | Target boundary | Migration note |
|---|---|---|---|---|
| Dashboard `/` | `console-config.mjs` and `console-composer.mjs` already mount Hero, Location, Weather, Sun & Moon, Sky, Alerts, Events, and News in several slots | `index.html` still contains the Console shell, dashboard panel orchestration, Helio/solar inline renderers, anchor iframes for Sky/Map, a lazy Weather iframe, a lazy Helio iframe, and page-specific state/event wiring | `index.html` keeps navigation, page routing, landmarks, settings and empty mount roots; all visible data surfaces are Composer-managed widget instances | Complete route-level composition; remove widget-specific DOM/data ownership from the shell incrementally |
| Weather `/weather/` | Location, Weather, Sun & Moon, Astro and Map have Runtime adapters; Sky has an explicit new mount API with a legacy adapter | The page directly imports legacy mount functions, owns tab switching and Sky bootstrap globals, includes shared modal markup, and contains a second page-level composition path | A Weather page composition mounts registered widgets through Runtime and uses Platform Context; tab/presentation shell remains page-owned | Preserve URL, location controls, tab persistence and `?embed=1`; direct legacy mounts become compatibility adapters |
| Sky `/sky/` | `sky/platform-adapter.mjs` and `mountSky()` exist; legacy bootstrap is isolated | Standalone HTML still bootstraps `widget.js` through the compatibility path and owns Sky-specific chrome/player markup | Generic or dedicated host mounts `sky` through Runtime; legacy globals are used only by a documented compatibility entry point | Keep current route and catalog/ranking behavior; do not combine with astronomy-kernel unification |
| Space Weather `/helio/` | `helio/dist/helio.widget.js` exposes `window.HelioWidget`; the Console also renders Helio-like panels inline | Global script API, inline mount wrapper, diagnostics markup, and duplicated Console Helio/solar/storm presentation | A `space-weather` Registry definition owns Helio data, rendering, refresh, loading/degraded/error state and disposal; page keeps only host shell and root | This is a new Runtime registration/adaptation story, not a rewrite of data generation |
| Map `/map/` and Weather Map tab | A registered `map` adapter exists; `map/index.html` wraps `weather/map-poc.html` in an iframe | Production route and Console still use iframe/POC path and postMessage/same-origin DOM poking; `map-poc.html` remains a large legacy implementation | Direct `map` Runtime instance in the generic host/page composition; iframe retained only as an explicit compatibility route while needed | Reconfirm the production implementation from #75 before deleting or deprecating POC assets |
| Events `/calendar/` | `events` is Registry-backed and can use the common Runtime | Standalone calendar page still renders legacy markup and calls `window.runCalendarWidget()` | Generic host or dedicated thin shell mounts `events`; generated JSON/RSS contracts remain unchanged | Keep public calendar URL and JSON/RSS links |
| Sun & Moon `/sun/` | `sun-moon` is Registry-backed and has instance lifecycle | Standalone page directly imports the legacy weather store and `mountSunMoon`; page owns CDN setup and wrapper markup | Generic host or thin composition mounts `sun-moon` through Runtime and Platform Context | Preserve lunar snapshot and existing horizon-event semantics |
| Showcase `/showcase/` | #88 provides a Registry-driven card gallery, per-card controls, one preview per widget type, and outputs for supported embeds | No shared stage, no independent instances of the same type, no explicit container sizing/mode, limited preview eligibility, and legacy links remain a separate hard-coded section | A creative multi-instance Widget Lab host backed by Registry metadata and Runtime | Extend #88; do not create a second catalog, config schema, or embed generator |
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

### 3.2 Space Weather contract

The existing Helio data schema and generated `/data/helio_now.json` remain the provider contract. The new widget definition must expose an instance-local equivalent of:

```js
{
  type: "space-weather",
  version: 1,
  defaults: {
    orientation: "auto",
    theme: "inherit",
    density: "normal",
    dataUrl: "/data/helio_now.json"
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

### 3.3 Compatibility contract

The following must remain operational during migration:

- `/`, `/weather/`, `/sky/`, `/helio/`, `/map/`, `/calendar/`, and `/sun/` URLs;
- existing Weather `?embed=1` behavior and location/time URL semantics;
- standalone Sky `SKY_CONFIG`/`__skyWidget` behavior through `legacy-bootstrap.mjs` only;
- generated calendar, alerts, sky, weather, and Helio assets;
- backend API schemas and Cloudflare Pages deployment structure;
- existing iframe and JavaScript embed APIs already delivered by #85–#87.

Compatibility pages may be thin adapters or redirects after a supported replacement is proven. No legacy file is deleted merely because a Runtime adapter exists.

## 4. Showcase Widget Lab UX

Showcase becomes a small visual laboratory rather than a list of documentation cards. The user flow is:

1. Choose a registered widget from the catalog.
2. Create a sandbox instance.
3. Choose orientation (`auto`, `horizontal`, `vertical`) and a bounded container preset or custom width/height.
4. Edit only controls declared in that widget definition's Registry metadata.
5. Launch the real Runtime instance into the sandbox container.
6. Change controls and apply an update; if the widget contract requires remount, the old instance is destroyed before the new one is mounted.
7. Inspect the live result, status, serialized configuration, and supported iframe/JavaScript output.
8. Add another instance, reset one instance, or reset the whole stage.

### 4.1 Proposed layout

```text
+----------------------+-----------------------------+----------------------+
| Widget catalog       | Sandbox stage              | Inspector / outputs  |
| search + descriptions| instance cards/containers  | selected instance    |
| Create instance      | resize/orientation preview | allow-listed fields  |
|                      | status + reset/destroy     | config/embed output  |
+----------------------+-----------------------------+----------------------+
```

On narrow screens the three regions become a logical sequence: catalog, selected instance inspector, then stage/output details. The layout must not rely on a fixed viewport width; the stage uses container sizing.

### 4.2 Sandbox instance model

Each created instance has a unique host id and an immutable identity separate from its widget type:

```js
{
  id: "sandbox-3",
  widget: "weather",
  config: { orientation: "vertical", ... },
  container: {
    mode: "fixed" | "responsive",
    width: 420,
    height: 600
  },
  state: "idle" | "loading" | "ready" | "error" | "timeout" | "destroyed"
}
```

The host controls `container.mode`, bounded dimensions, visual frame, and placement. The widget controls its own internal layout and lifecycle. There is no one-instance-per-widget restriction: two Weather instances with different configuration must coexist without shared mutable UI state.

The state machine must make transitions deterministic:

```text
idle -> loading -> ready
idle -> loading -> error|timeout
ready -> loading -> ready|error|timeout
ready -> destroyed
error|timeout -> loading (retry) | destroyed
```

### 4.3 Registry-driven controls and outputs

- Catalog cards come from `registry.list()` / `widgetCatalog` metadata.
- Widget option controls come from `supportedOptions`; values are normalized by the existing `widget-config` contract.
- Common options are rendered only when declared by the definition.
- Host dimensions and mode are sandbox controls, not widget-specific configuration.
- Outputs use the existing `serializeWidgetConfig`, `buildStandaloneWidgetUrl`, `buildIframeEmbedSnippet`, and JavaScript embed serialization paths.
- Unsupported outputs are explained as unavailable; no fake snippet is generated.
- The UI never accepts a loader, mount function, arbitrary URL, HTML fragment, script, or callback as configuration.

### 4.4 Accessibility, security, and resilience

- Use landmarks for catalog, stage, inspector and output regions.
- Every control has a visible label; custom dimensions have min/max and invalid-value feedback.
- Create, Apply, Retry, Reset, and Destroy are keyboard-operable with visible focus.
- Selected instance and status changes are exposed through a polite live region; errors are also available as readable text, not color alone.
- Focus moves to the newly created instance heading or error summary when appropriate and returns predictably after destruction.
- Canvas widgets retain their textual/semantic alternative where available.
- The sandbox uses the existing allow-list and versioned config normalizer; it never evaluates user text or loads remote code.
- A hanging loader or request reaches a bounded timeout state and offers retry/destroy without blocking sibling instances.
- Reset destroys every owned Runtime instance and clears timers, observers, listeners, pending requests and generated state.

## 5. Explicit non-goals

This plan does not include:

- changing Settings or Stats into widgets;
- building user authentication, persistence or a shareable user-created Console layout;
- drag-and-drop layout editing for the production Console;
- replacing Cloudflare Pages, the static ES-module approach, or generated data pipelines;
- rewriting Weather scoring, Helio scoring, Map rendering, Sky astronomy algorithms, or the astronomy kernel;
- accepting arbitrary user JavaScript, HTML, CSS, remote modules, data endpoints, or third-party widgets;
- deleting every legacy page or file in the first migration;
- inventing new priorities, estimates, sizes, dates, milestones, or status values.

## 6. Phased delivery

### Phase A — Contract and UX sign-off

Approve this page-boundary map, the Space Weather widget contract, and the Showcase Widget Lab interaction/wireframe. No implementation story enters `Ready` before the UI-facing contract is agreed.

### Phase B — Runtime surface completion

Register/adapt Space Weather and introduce route-level composition descriptors. Do not change the visible Console behavior until the adapters have independent lifecycle and compatibility tests.

### Phase C — Console and page migration

Migrate Dashboard first, then Weather, Sky, Map, Space Weather, Events, and Sun & Moon. Each route should become a thin host of Runtime instances while legacy URLs remain covered by compatibility tests.

### Phase D — Showcase Widget Lab

Deliver the stage model, metadata-driven inspector, multi-instance preview lifecycle, generated outputs, reset/error/timeout behavior, accessibility and security checks.

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
- #85–#87 — generic host, iframe and JavaScript embed contracts;
- #88 — initial Registry-driven Gallery and output generation;
- #89–#91 — compatibility, performance, accessibility and embed-security gates.

The new backlog below is a delta: it completes route-level ownership and substantially extends #88 into the requested multi-instance sandbox. Existing stories remain dependencies or evidence; they are not recreated as children of the new epics.

## 8. Proposed issue-ready backlog

Issue types are shown explicitly. Proposed issues have no priority, size, estimate, start date, target date, or Project status assigned by this planning document.

### Epic A — Complete Console and public page migration to Widget Runtime

**Scope:** Replace remaining page-owned data surfaces, inline renderers, and iframe composition on Dashboard and the seven target public pages with thin host shells and Registry-backed Runtime instances.

**Outcome / Definition of Done:** Each in-scope route renders its user-facing data surfaces through independently mountable widgets, preserves existing URLs/data contracts and compatibility behavior, and passes the route-level regression gate. Settings, Stats, and Showcase remain host applications according to their separate contracts.

#### A1. Establish route composition descriptors and ownership audit

**Scope:** Define the route/page composition contract, slot naming, context policy, legacy adapter policy, and an auditable page-to-widget ownership matrix for `/`, `/weather/`, `/sky/`, `/helio/`, `/map/`, `/calendar/`, and `/sun/`.

**Acceptance criteria**

- [ ] Each target route has a documented composition descriptor with widget type, root/slot, context requirement, and compatibility route.
- [ ] Every visible data/visualization surface is classified as Runtime widget, host shell, or temporary compatibility adapter.
- [ ] The descriptor references Registry types and does not duplicate widget schemas or loaders.
- [ ] The matrix names authoritative source files, public/generated artifacts, and local validation commands.
- [ ] Settings, Stats, and Showcase are explicitly classified as host applications.

**Validation:** Static descriptor/inventory tests and review against the current architecture audit; no Project status change.

**Dependencies:** #66, #69–#71, #83–#85.

**Out of scope:** Implementing any route migration or redesigning visual styles.

#### A2. Register Space Weather as an independent Runtime widget

**Scope:** Adapt the existing Helio widget/data contract into a `space-weather` Registry definition with instance-local lifecycle, configuration normalization, bounded refresh and local state rendering.

**Acceptance criteria**

- [ ] `space-weather` is discoverable from the single Registry and can mount through the common Runtime.
- [ ] Existing `/data/helio_now.json` schema and generated pipeline remain unchanged.
- [ ] No new path depends on `window.HelioWidget` or page-owned Helio DOM; any legacy API is isolated in an adapter.
- [ ] Two instances have independent DOM, refresh/dispose state, error state and configuration.
- [ ] Normal, empty, stale/degraded, timeout and error responses render bounded readable local states.
- [ ] `destroy()` clears timers/listeners/observers and aborts owned requests where applicable.

**Validation:** Unit contract/lifecycle tests, malformed/timeout fixture tests, and local `/helio/` browser smoke.

**Dependencies:** #69–#71, #90–#91.

**Out of scope:** Astronomy-kernel or Helio scoring redesign.

#### A3. Complete Dashboard migration to Composer-owned widget surfaces

**Scope:** Finish the `/` Dashboard composition after #84 by replacing remaining Sky/Map/Weather/Helio iframes and inline Helio/solar/storm data rendering with registered widget slots or explicitly approved host-only controls.

**Acceptance criteria**

- [ ] Dashboard data and visualization surfaces are mounted from a declarative Composer configuration.
- [ ] `index.html` does not read sibling widget DOM, serve as a data provider, or own widget-specific renderers for migrated surfaces.
- [ ] Dashboard Sky, Map, Weather, Sun & Moon and Space Weather instances receive Platform Context/configuration through Runtime.
- [ ] Navigation, Settings, Stats, page routing, modal ownership where genuinely shared, and outer layout remain functional.
- [ ] Existing `/` URL, responsive layout, location/time changes and lazy-loading behavior remain compatible.
- [ ] A widget failure does not prevent sibling slots from mounting.

**Validation:** Dashboard browser matrix for load, navigation, resize, location/time changes, iframe removal and remount cleanup; static scan for forbidden new iframe/DOM-provider patterns.

**Dependencies:** A1, A2, #72–#84, #90–#91.

**Out of scope:** Settings/Stats widgetization and user-customizable Dashboard layouts.

#### A4. Migrate Weather page to a Runtime composition host

**Scope:** Convert `/weather/` from direct legacy imports plus page-owned Sky bootstrap/tab wiring into a thin composition host using Runtime and Platform Context for Location, Weather, Map, Sun & Moon, Astro and Sky.

**Acceptance criteria**

- [ ] Weather page mounts registered widgets through one composition path.
- [ ] Tab navigation and `nc-weather-tab` persistence remain functional and do not create duplicate instances.
- [ ] `?embed=1`, location URL parameters, manual/live time and observer changes remain compatible.
- [ ] Sky no longer requires `SKY_CONFIG`/`__skyWidget` on the new path; only the documented legacy adapter may use them.
- [ ] Page-level modals are either owned by the responsible widget or explicitly documented as shared host infrastructure.
- [ ] Existing Weather-family lifecycle, two-instance and responsive tests remain passing.

**Validation:** `/weather/` browser smoke for every tab, context update, resize/orientation, remount and embed query; unit/static composition tests.

**Dependencies:** A1, #72–#78, #83–#85.

**Out of scope:** Splitting the large Weather module or redesigning tabs.

#### A5. Migrate standalone Sky and Map routes to direct Runtime hosts

**Scope:** Make `/sky/` and `/map/` thin Runtime hosts. Replace the supported Map route's POC iframe composition and preserve explicit compatibility behavior for legacy Map URLs and standalone Sky bootstrap.

**Acceptance criteria**

- [ ] `/sky/` mounts the registered Sky widget through the explicit instance API and preserves catalog/ranking/player behavior.
- [ ] `/map/` mounts the selected production Map implementation directly through Runtime, or documents a tested temporary adapter with a removal condition.
- [ ] POC/legacy Map files do not become a second production implementation.
- [ ] Same-origin/postMessage coupling is removed from the new path unless required and documented by the selected Map adapter.
- [ ] Existing route URLs and any deliberate compatibility redirects/adapters are browser-tested.

**Validation:** Sky and Map route smoke, two-instance/remount tests, map layer/error behavior, and static scan for unsupported page-global ownership.

**Dependencies:** A1, #75–#78, #85, and the production-path decision from #75.

**Out of scope:** Map rendering rewrite or Sky astronomy algorithm unification.

#### A6. Migrate Space Weather, Events, and Sun & Moon standalone hosts

**Scope:** Replace direct global/legacy standalone bootstrap for `/helio/`, `/calendar/`, and `/sun/` with thin Runtime compositions using the `space-weather`, `events`, and `sun-moon` definitions.

**Acceptance criteria**

- [ ] Each route has a single root and mounts its widget through the common Runtime.
- [ ] `/calendar/` preserves generated JSON/RSS links and event filtering behavior.
- [ ] `/sun/` preserves lunar snapshot, Sun Equation and event semantics without creating a second astronomy contract.
- [ ] `/helio/` preserves Helio diagnostics/freshness semantics while no longer requiring a page-global `HelioWidget` on the new path.
- [ ] Invalid configuration and provider failures remain local readable states.

**Validation:** Route-level browser smoke, generated-data regression, lifecycle/remount tests and legacy URL compatibility checks.

**Dependencies:** A2, #73, #80–#82, #85.

**Out of scope:** Changing generated data formats, event taxonomy or astronomy calculations.

#### A7. Run the post-migration Console surface compatibility gate

**Scope:** Validate all seven target pages plus Dashboard after the route-level migration, including normal, resize, context, failure, compatibility and cleanup behavior.

**Acceptance criteria**

- [ ] Covers `/`, `/weather/`, `/sky/`, `/helio/`, `/map/`, `/calendar/`, and `/sun/` from local `sites/staging/` serving.
- [ ] Verifies mount, update, destroy, remount, two instances, orientation/size and sibling failure isolation where applicable.
- [ ] Verifies existing iframe/JavaScript embed contracts remain operational after route changes.
- [ ] Verifies no unsupported cross-page globals, duplicate catalog/schema or orphan polling remains.
- [ ] Records deterministic evidence and leaves the branch clean.

**Validation:** Node/unit/typecheck/static checks plus Playwright route matrix with network fixtures and explicit timeout/error assertions.

**Dependencies:** A3–A6, #89–#91.

**Out of scope:** Staging deployment and human `Done` transitions.

### Epic B — Build the Showcase Widget Lab sandbox

**Scope:** Extend #88's Registry-driven Gallery into a visual multi-instance sandbox for selecting, configuring, mounting, resizing, inspecting and destroying real Runtime widgets.

**Outcome / Definition of Done:** A user can create several independent sandbox containers, configure only Registry-allow-listed options, launch real Runtime previews, change orientation/size, inspect generated outputs, recover from failures, and reset the stage without leaks or unsafe evaluation.

#### B1. Approve the Widget Lab UX flow and accessible wireframe

**Scope:** Specify the catalog → create → configure → preview → inspect → reset flow, responsive regions, focus behavior, empty/loading/error/timeout states, and the visual language of the sandbox stage.

**Acceptance criteria**

- [ ] Wireframe covers desktop and narrow layouts for catalog, stage and inspector/output regions.
- [ ] All user actions and keyboard/focus behavior are specified.
- [ ] Instance lifecycle states and recovery actions are specified.
- [ ] The design distinguishes widget configuration from host container controls.
- [ ] The design is reviewed by Product Owner and UI/UX role before the implementation story enters `Ready`.

**Validation:** UX walkthrough and accessibility checklist against the contract in section 4.

**Dependencies:** A1, #88, #91.

**Out of scope:** Implementing the Showcase.

#### B2. Implement the sandbox instance model and lifecycle state machine

**Scope:** Add a host-owned model for unique instances, container dimensions/mode, selected instance, state transitions, and Runtime mount/update/destroy orchestration.

**Acceptance criteria**

- [ ] Each instance has a unique identity independent of widget type.
- [ ] Multiple instances of one or different widget types coexist with isolated configuration and lifecycle.
- [ ] Update/remount destroys the prior instance before replacing it and handles pending mounts safely.
- [ ] Destroy/reset clears all instance records and owned generated output.
- [ ] State transitions expose loading, ready, error, timeout and destroyed states deterministically.

**Validation:** Unit tests with fixture Runtime, delayed mount, rejected mount, timeout and repeated reset/destroy sequences.

**Dependencies:** B1, #69–#71, #88.

**Out of scope:** Catalog control rendering and visual styling polish.

#### B3. Build Registry-driven catalog, orientation and container inspector

**Scope:** Replace the card-only interaction with catalog selection and an inspector that derives widget controls from Registry metadata while providing bounded sandbox host dimensions/modes.

**Acceptance criteria**

- [ ] Catalog contents and labels are derived from the single Registry/catalog metadata source.
- [ ] Orientation offers `auto`, `horizontal`, and `vertical` only where the definition supports them.
- [ ] Widget-specific controls and values come only from `supportedOptions` and the existing config normalizer.
- [ ] Container mode and width/height presets/custom values are validated, bounded and never passed as arbitrary widget options.
- [ ] Changing the selected widget or inspector values updates the selected instance without affecting other instances.
- [ ] No duplicate widget list, loader map, schema or unsafe config path is introduced.

**Validation:** Metadata equality tests, invalid-option tests, keyboard form tests and browser inspector smoke.

**Dependencies:** B1, B2, #88, #85.

**Out of scope:** Arbitrary CSS/theme editor and drag-and-drop layout editing.

#### B4. Mount real Runtime previews in independent visual containers

**Scope:** Render the stage and mount the selected Registry widget into each sandbox container, including resize/orientation updates, remount and destroy controls.

**Acceptance criteria**

- [ ] Preview content is produced by the real Widget Runtime, not a mock or duplicate renderer in production code.
- [ ] At least two simultaneous instances can be visible and remain independent.
- [ ] Fixed and responsive container modes produce deterministic orientation behavior, including `auto`.
- [ ] Apply/update, retry, destroy and per-instance reset work without stale DOM or leaked resources.
- [ ] A failed widget leaves sibling previews usable.

**Validation:** Browser tests with deterministic widget/data fixtures, ResizeObserver/viewport changes, two instances and repeated remount.

**Dependencies:** B2, B3, #88, #90.

**Out of scope:** Persisting sandbox layouts between sessions.

#### B5. Add generated config, iframe and JavaScript output inspector

**Scope:** Show outputs for the selected sandbox instance using the existing versioned serializers and capability flags.

**Acceptance criteria**

- [ ] Serialized config exactly matches the normalized instance configuration and version.
- [ ] iframe URL/HTML is shown only for definitions enabled for standalone/iframe output.
- [ ] JavaScript snippet is shown only for definitions enabled for JavaScript embed and contains no loader, executable config, arbitrary HTML or private DOM dependency.
- [ ] Output updates after configuration changes and never contains stale values from another instance.
- [ ] Copy/selectable output has accessible status feedback and safe link attributes.

**Validation:** Serializer contract tests, output allow-list/security fixtures and browser copy/status smoke.

**Dependencies:** B3, B4, #85–#88.

**Out of scope:** New embed protocols or remote deployment changes.

#### B6. Add reset, timeout/error recovery, accessibility and security hardening

**Scope:** Complete Widget Lab resilience and release behavior for failures, keyboard use, readable state feedback and unsafe configuration rejection.

**Acceptance criteria**

- [ ] Reset selected and reset-all destroy Runtime instances and clear pending operations/output state.
- [ ] Loader/request timeout becomes an actionable local timeout state with retry/destroy; sibling instances are unaffected.
- [ ] Catalog, stage, inspector and outputs have semantic landmarks, labels, focus handling and non-color status messaging.
- [ ] Canvas previews expose or preserve textual alternatives where supported.
- [ ] Arbitrary module URLs, functions, HTML, script-like values and unallow-listed config keys are rejected.
- [ ] No unsafe `innerHTML` path is introduced for user-provided configuration or output.

**Validation:** Accessibility-oriented browser checks, invalid-config fixtures, timeout/retry tests, static security scan and lifecycle leak checks.

**Dependencies:** B2–B5, #90–#91.

**Out of scope:** Authentication or multi-user sharing.

#### B7. Run the deterministic Showcase Widget Lab acceptance matrix

**Scope:** Prove the complete sandbox flow locally with real Registry/runtime integration and deterministic network/fixture behavior.

**Acceptance criteria**

- [ ] Covers widget selection, creation, orientation, bounded size/mode, allow-listed options, launch, update/remount, destroy, reset and output inspection.
- [ ] Covers two instances of the same widget and two different widgets.
- [ ] Covers loading, ready, empty, error and timeout/retry states without arbitrary sleeps.
- [ ] Confirms catalog/control inventory equals Registry metadata and has no duplicate schema.
- [ ] Confirms branch tests pass and generated test artifacts are cleaned before handoff.

**Validation:** Unit, typecheck, static/diff checks and Playwright Showcase tests against local `sites/staging/`.

**Dependencies:** B1–B6, A7.

**Out of scope:** Staging deployment and human `Done` transitions.

## 9. Project status recommendations

These are recommendations only; this document makes no Project or issue-status changes.

- Keep Epic A and Epic B, and all new stories, in `Backlog` until this specification and the UX wireframe are approved.
- After acceptance criteria, dependencies, and (where required) UI/UX review are agreed, move only implementation-ready stories to `Ready`.
- Product Owner moves a story to `Ready`; Coder moves the actively implemented story to `In Progress`; Validator moves a validated handoff to `In Review` and leaves it there; the human owner moves validated work to `Done`.
- Do not populate Priority, Size, Estimate, Start date, Target date, or other fields from this plan. They remain unspecified until the owner explicitly supplies them through normal triage.
- Recommended implementation order is A1 → A2 → A3 → A4/A5/A6 in parallel where dependencies permit → A7, with B1 before B2 and B3, then B4 → B5 → B6 → B7. A7 is a prerequisite for the final Showcase acceptance gate because it proves the same Runtime contracts across target surfaces.

## 10. Approval gate

Before issue creation or Project grooming, the human owner should approve:

1. the definition of “widget-only surface” as host shell plus independent Runtime roots;
2. the new `space-weather` Registry identity and compatibility approach;
3. direct Map route migration versus a temporary tested adapter;
4. the Widget Lab wireframe and whether custom dimensions are included in the first delivery;
5. the two-epic backlog and its dependencies.

Until then, this branch contains planning/specification only.
