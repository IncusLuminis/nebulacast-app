# Nebulacast Widget Platform Architecture and Migration Specification

**Repository:** `IncusLuminis/nebulacast-app`
**Version:** 1.0
**Date:** 2026-09-09
**Status:** Architecture and migration specification
**Basis:** Current implementation audit in `WIDGET_AUDIT_2026-09-09.md`

---

## 1. Purpose

Nebulacast.app shall evolve from a standalone console with several partially reusable UI components into a reusable widget platform.

The platform shall support four primary use cases:

1. Nebulacast Console assembled from independent widgets.
2. Standalone widget pages hosted by Nebulacast.app.
3. Widgets embedded into external websites through iframe embeds.
4. Widgets mounted programmatically into other Incus Luminis applications through a shared JavaScript runtime.

The migration must preserve the current application while gradually replacing page-specific integration logic with formal widget contracts.

This is primarily a frontend architecture migration.

Existing backend APIs, generated datasets, astronomy contracts, cron jobs, and deployment behavior must remain operational unless a later feature specifically requires an additive backend extension.

---

## 2. Current-State Constraints

The current implementation must be treated as the migration baseline.

Important existing constraints:

- `sites/staging/` is the public deploy root.
- There is no runtime frontend bundler.
- The application is primarily static HTML, JavaScript modules, CSS, generated assets, and Cloudflare Pages Functions.
- `sites/staging/index.html` is the current Console shell and contains significant inline markup, CSS, state, and integration logic.
- The modular weather application lives under `sites/staging/weather/`.
- The weather application already uses explicit widget mount functions and a shared browser state store.
- Sky is independently loadable but currently uses `window.SKY_CONFIG` and `window.__skyWidget`.
- News and Calendar use a separate generated/runtime model.
- Hero, Alerts, and several Console surfaces are not yet independent widgets.
- Browser astronomy calculations are not fully unified.
- Generated/static assets and source-like runtime modules coexist under the repository and must not be broken during migration.

The migration must be incremental. A full rewrite of the Console or a framework replacement is explicitly out of scope.

---

## 3. Architectural Principles

### 3.1 Widget-first frontend architecture

Every reusable visual surface shall eventually be implemented as an independent widget.

A widget must not depend on:

- a specific Console DOM hierarchy;
- a page-specific global variable;
- another widget's DOM;
- a specific parent layout;
- a hard-coded element id outside its own root;
- hidden state owned by the Console shell.

### 3.2 Existing data contracts remain stable

Widgetization must not require breaking changes to existing backend data.

Existing APIs and generated datasets remain valid data providers.

Any new fields must be additive.

### 3.3 One widget implementation, multiple layouts

Vertical and horizontal variants must not be implemented as separate widgets.

Each widget shall expose layout behavior through configuration.

Required baseline orientation values:

- `auto`
- `horizontal`
- `vertical`

Where appropriate, widgets may additionally support:

- `density`
- `size`
- feature visibility flags

### 3.4 Multi-instance safety

A page must be able to mount multiple instances of the same widget.

Each instance must own:

- its configuration;
- DOM subtree;
- timers;
- observers;
- fetch lifecycle;
- internal transient state;
- disposer.

Widget-specific preferences must not be stored in a global application singleton unless they are intentionally shared.

### 3.5 Shared context must remain small

Only genuinely shared observer/application context should be global.

The common platform context should contain:

- location / observer;
- effective time;
- locale;
- theme.

Widget-specific options such as forecast range, weather profile, alert filters, sky layers, or news category belong to widget configuration.

### 3.6 No framework migration

The target architecture shall continue using the current static ES module model.

React, Vue, Svelte, or another UI framework must not be introduced solely for widgetization.

### 3.7 Explicit lifecycle

Every widget shall implement an explicit lifecycle contract.

Mounting a widget must return a widget instance or disposer.

Unmounting must release all resources owned by the widget.

### 3.8 Console is a consumer

Nebulacast Console shall no longer be considered the owner of reusable visual components.

The Console shall become one consumer of the widget library.

---

## 4. Target Architecture

The target platform consists of the following layers:

```text
DATA PROVIDERS
    |
    +-- Cloudflare Pages Functions
    +-- generated JSON
    +-- RSS
    +-- generated astronomy catalogs
    +-- browser-only computation contracts
    |
    v
DOMAIN SERVICES / DATA ADAPTERS
    |
    +-- weather
    +-- astronomy
    +-- location
    +-- news
    +-- events
    +-- alerts
    |
    v
PLATFORM CONTEXT
    |
    +-- observer
    +-- time
    +-- locale
    +-- theme
    |
    v
WIDGET RUNTIME
    |
    +-- registry
    +-- mount
    +-- lifecycle
    +-- configuration
    +-- refresh policy
    +-- visibility handling
    +-- error/loading state
    |
    v
WIDGET INSTANCES
    |
    +-- hero
    +-- location
    +-- weather
    +-- sun-moon
    +-- astro
    +-- map
    +-- sky
    +-- news
    +-- events
    +-- alerts
    |
    +--------------> Console Composer
    |
    +--------------> Widget Gallery / Builder
    |
    +--------------> iframe pages
    |
    +--------------> JavaScript embeds
```

---

## 5. Proposed Repository Structure

The exact migration may adapt to existing naming, but the final architecture should converge toward the following responsibilities.

```text
sites/staging/
|
+-- widgets/
|   |
|   +-- runtime/
|   |   +-- index.mjs
|   |   +-- registry.mjs
|   |   +-- context.mjs
|   |   +-- lifecycle.mjs
|   |   +-- errors.mjs
|   |
|   +-- definitions/
|   |   +-- hero.mjs
|   |   +-- location.mjs
|   |   +-- weather.mjs
|   |   +-- sun-moon.mjs
|   |   +-- astro.mjs
|   |   +-- map.mjs
|   |   +-- sky.mjs
|   |   +-- news.mjs
|   |   +-- events.mjs
|   |   +-- alerts.mjs
|   |
|   +-- pages/
|       +-- index.html
|       +-- widget.html
|
+-- console/
|   +-- console-config.mjs
|   +-- console-composer.mjs
|
+-- weather/
+-- sky/
+-- shared/
+-- index.html
```

This is a target responsibility map, not a requirement to move all existing files immediately.

During migration, adapters may reference existing implementations in:

- `sites/staging/weather/widgets/**`
- `sites/staging/sky/widget.js`
- `frontend/assets/js/widget_runtime.js`
- `frontend/templates/partials/**`
- `sites/staging/index.html`

File moves should happen only when the relevant widget has already been isolated and tested.

---

## 6. Platform Context

### 6.1 Purpose

Platform Context represents state that multiple widgets may intentionally share.

It must not become a new monolithic application store.

### 6.2 Initial contract

```js
{
  observer: {
    name: string | null,
    lat: number,
    lon: number,
    timezone: string,
    source: "url" | "user" | "geolocate" | "default" | "fallback"
  },

  time: {
    mode: "live" | "manual",
    datetimeISO: string | null
  },

  locale: string,

  theme: "auto" | "dark" | "light"
}
```

### 6.3 Relationship to current weather state

Current:

`sites/staging/weather/core/state.js`

already provides most required observer and time semantics.

The first platform context implementation should adapt the existing weather state API rather than replace it.

The current fields:

- `profile`
- `range`

must be treated as weather-widget configuration in the target architecture.

They may remain supported in the existing store during the migration period for backwards compatibility.

### 6.4 Context API

The platform context should expose an API conceptually equivalent to:

```js
context.get()
context.subscribe(listener)
context.update(patch)
context.getObserver()
```

Widgets must not read observer context directly from:

- URL parameters;
- `localStorage`;
- global variables;
- page-specific DOM.

Those operations belong to context adapters or the Location widget.

---

## 7. Widget Definition Contract

Each widget type shall register a definition.

Conceptual definition:

```js
{
  type: "weather",
  version: 1,

  defaults: {
    orientation: "auto"
  },

  capabilities: {
    observerAware: true,
    timeAware: true,
    multiInstance: true,
    embed: true
  },

  mount
}
```

A widget definition describes the type.

A widget instance is a mounted copy of that definition with its own configuration and runtime state.

---

## 8. Widget Instance Contract

Every widget shall support the following conceptual lifecycle:

```js
const instance = await mountWidget(root, {
  context,
  config
});
```

The returned instance should expose:

```js
{
  update(configPatch),
  resize(),
  refresh(),
  destroy()
}
```

Not every widget must perform meaningful work for every method.

The runtime may provide no-op defaults where appropriate.

### 8.1 Required lifecycle rules

A widget must:

- render only inside its supplied root;
- cleanly destroy itself;
- clear timers on destroy;
- disconnect ResizeObserver / IntersectionObserver instances;
- unsubscribe from shared context;
- abort owned in-flight requests where possible;
- remove owned event listeners;
- avoid leaking globals;
- tolerate repeated mount/destroy cycles.

### 8.2 Mount return compatibility

Existing widgets that currently return only a disposer may initially be adapted as:

```js
{
  destroy: disposer
}
```

This allows migration without rewriting otherwise functional modules.

---

## 9. Widget Configuration Model

Each widget instance owns its configuration.

Example:

```js
{
  id: "weather-main",
  type: "weather",

  config: {
    orientation: "horizontal",
    density: "normal",
    range: "48h",
    profile: "visual"
  }
}
```

### 9.1 Common configuration fields

All widgets should support where applicable:

```js
{
  orientation: "auto" | "horizontal" | "vertical",
  theme: "inherit" | "auto" | "dark" | "light",
  density: "compact" | "normal" | "comfortable"
}
```

### 9.2 Widget-specific fields

Examples:

Weather:

```js
{
  range: "today" | "48h" | "7d",
  profile: "default" | "visual" | "broadband" | "planetary"
}
```

Alerts:

```js
{
  groups: ["grb", "neocp", "transient"],
  maxItems: 20
}
```

Sky:

```js
{
  orientation: "auto",
  layers: {},
  controls: {},
  ranking: true
}
```

News:

```js
{
  category: null,
  maxItems: 12
}
```

Configuration must not be confused with Platform Context.

---

## 10. Orientation and Responsive Layout

### 10.1 Required modes

Every widget intended for reuse must support:

- `auto`
- `horizontal`
- `vertical`

### 10.2 Auto mode

`auto` must be the default.

Auto behavior should be based primarily on the widget root/container size, not on global viewport width.

Use container-aware logic through:

- CSS container queries where appropriate;
- `ResizeObserver` where runtime decisions are required.

### 10.3 No duplicated implementations

The following pattern is prohibited as a final design:

```text
weather.js
weather-vertical.js

sky.js
sky-horizontal.js
```

Legacy vertical variants may temporarily remain during migration but must not become the platform model.

### 10.4 Layout responsibility

The widget owns internal layout.

The Console or embedding page owns only:

- outer dimensions;
- placement;
- grid/span;
- visibility.

The parent must not manipulate internal widget DOM to produce vertical or horizontal layout.

---

## 11. Widget Registry

A single registry shall define available widget types.

Conceptual interface:

```js
registry.register(definition)
registry.get(type)
registry.list()
```

Example:

```js
registry.register({
  type: "weather",
  loader: () => import("/weather/widgets/weather/weather.js")
});
```

Lazy loading should be preferred for expensive widgets.

The registry shall become the authoritative list used by:

- Console Composer;
- Widget Gallery / Builder;
- JavaScript embed runtime;
- standalone widget pages.

This prevents each surface from maintaining a different list of supported widgets.

---

## 12. Widget Runtime

The Widget Runtime is responsible for common platform behavior.

It must not contain domain-specific rendering.

Responsibilities:

- resolve widget definition from registry;
- lazy-load widget implementation;
- create instance identity;
- provide Platform Context;
- normalize configuration;
- mount;
- destroy;
- update;
- refresh;
- common error boundary;
- common loading state when appropriate;
- root/container observation;
- optional page visibility handling.

Conceptual public API:

```js
Nebulacast.mount(root, specification)
Nebulacast.unmount(root)
Nebulacast.getWidgets()
```

Example:

```js
const widget = await Nebulacast.mount(
  document.querySelector("#weather"),
  {
    widget: "weather",
    config: {
      orientation: "vertical",
      range: "48h"
    }
  }
);
```

The exact global/module name may be chosen during implementation, but only one public runtime API should exist.

---

## 13. Refresh Ownership

Each widget currently owns much of its refresh behavior.

This principle should remain, but refresh policies must become bounded and explicit.

Each widget must document:

- refresh trigger;
- minimum interval;
- cache behavior;
- hidden-tab behavior;
- timeout;
- retry strategy;
- stale-data behavior;
- rate-limit behavior;
- manual refresh support.

### 13.1 No global polling loop

The platform must not introduce a single page-level polling loop that blindly refreshes all widgets.

### 13.2 Visibility

Widgets with recurring network requests should pause or reduce polling while their document is hidden where practical.

### 13.3 Degraded state

Widgets consuming `/api/astro-weather` must distinguish rate-limited/stale/degraded responses from a normal empty dataset.

---

## 14. Error and Loading States

Reusable widgets must not depend on the Console for error rendering.

Each widget shall own local states for:

- loading;
- ready;
- empty;
- stale;
- degraded;
- error.

Errors in one widget must not prevent sibling widgets from mounting.

The runtime may provide a default error boundary, but widgets remain responsible for user-meaningful domain messages.

---

## 15. Data Provider Boundaries

Existing providers remain valid.

### 15.1 Existing on-demand APIs

Current APIs include:

- `/api/astro-weather`
- `/api/sun-moon`
- `/api/sky-ranking`
- `/api/geocode`
- `/api/revgeo`
- `/api/timezone`

### 15.2 Existing generated/static data

Current scheduled/static datasets include:

- News/RSS;
- Calendar/Event data;
- weather JSON;
- Sky catalogs;
- rankings;
- Sun/Moon frame data;
- astronomy-related generated artifacts.

### 15.3 Rule

Widgets consume data providers through domain adapters or their existing stable interfaces.

The Console must never become an intermediate data provider for a widget.

---

## 16. Astronomy Domain Ownership

Astronomy consistency is a separate architectural concern that becomes more important once widgets are independently reusable.

Current calculation ownership is split between:

1. `frontend/astronomy/lunar.ts`
2. `sites/staging/shared/lunar.mjs`
3. `functions/api/sun-moon.js`
4. `sites/staging/sky/widget.js`

The target architecture should converge toward an authoritative astronomy computation layer.

Conceptually:

```text
Astronomy Kernel
    |
    +-- LunarSnapshot
    +-- SolarSnapshot
    +-- ObserverGeometry
    +-- RiseSet
    +-- Visibility
```

Widgets should consume semantic astronomy results rather than scrape another widget or independently reproduce formulas.

### 16.1 Migration rule

Astronomy unification must not block initial widget extraction.

The first widget-platform phases should preserve existing behavior.

Astronomy formula consolidation should be performed as a separate controlled migration with regression comparisons.

---

## 17. Location Widget

Current source:

`sites/staging/weather/widgets/location/location.js`

The Location widget is close to the target model.

It should become the primary UI control for Platform Context observer changes.

Responsibilities:

- search;
- geolocation;
- reverse geocoding;
- timezone resolution;
- observer selection;
- shareable URL synchronization where enabled.

It must not become mandatory for all pages.

An embedding host must be able to provide observer context programmatically without rendering Location.

---

## 18. Weather Widget

Current source:

`sites/staging/weather/widgets/weather/weather.js`

Weather is the most mature reusable widget but also the largest.

Initial migration should wrap the current implementation rather than split it immediately.

Required target changes:

- formal registration in Widget Registry;
- mount through common runtime;
- configuration separated from shared Platform Context;
- support `auto`, `horizontal`, and `vertical`;
- multi-instance safety audit;
- bounded refresh behavior;
- explicit destroy;
- removal of assumptions about one global weather element.

Major internal decomposition may be considered later.

It is not a prerequisite for platform launch.

---

## 19. Sun & Moon Widget

Current source:

`sites/staging/weather/widgets/sun_moon/sun_moon.js`

This widget already has strong lifecycle characteristics.

Migration should:

- wrap/register it through common runtime;
- preserve the existing lunar snapshot contract;
- make orientation explicit;
- ensure timers and ResizeObserver remain instance-owned;
- allow multiple mounted instances.

---

## 20. Astro Widget

Current source:

`sites/staging/weather/widgets/astro/astro.js`

This is expected to be a low-risk migration.

It should consume Platform Context and widget-specific configuration while continuing to reuse current weather/astronomy data where appropriate.

---

## 21. Map Widget

Current source:

`sites/staging/weather/widgets/map/map.js`

`map2.js` and other POC/legacy variants must not automatically become platform code.

Before migration, implementation must identify the production Map path.

The platform widget should then wrap only the production implementation.

---

## 22. Sky Widget

Current source:

`sites/staging/sky/widget.js`

Sky is independently useful but does not currently implement the common lifecycle model.

Current integration depends on:

- `window.SKY_CONFIG`
- self-bootstrap
- `window.__skyWidget`

Target API:

```js
mountSky(root, context, options)
```

returning an independent instance.

Migration requirements:

- remove the requirement for `window.SKY_CONFIG` from the new runtime path;
- keep legacy bootstrap compatibility temporarily;
- eliminate dependence on one global `window.__skyWidget` for new mounts;
- preserve current standalone Sky behavior;
- support multiple instances;
- preserve catalog/ranking paths;
- preserve location/time updates;
- expose explicit destroy;
- support orientation/layout configuration.

The legacy global API may remain temporarily as a compatibility adapter.

---

## 23. News Widget

Current implementation uses:

- `frontend/templates/partials/`
- `frontend/assets/js/widget_runtime.js`
- generated RSS/static data.

News should be migrated into the same Widget Registry and runtime without introducing a second state layer.

News does not require observer/time context unless a future feature explicitly makes it location-aware.

Migration must preserve current generated data inputs.

---

## 24. Events / Calendar Widget

Current implementation uses generated calendar data and current generated/runtime infrastructure.

The target widget must be independently mountable and configurable.

Potential configuration:

```js
{
  orientation: "auto",
  maxItems: 10,
  timeRange: "upcoming"
}
```

Existing data generation must remain unchanged during initial extraction.

---

## 25. Alerts Widget

Alerts should become a first-class standalone widget.

The Console right sidebar is the initial primary use case.

Target default for Console:

```js
{
  orientation: "vertical"
}
```

The widget should consume the existing alerts dataset directly.

It must not depend on sidebar DOM or Console-specific classes.

Potential configuration:

```js
{
  groups: ["grb", "neocp", "transient"],
  maxItems: 20,
  orientation: "vertical"
}
```

A horizontal layout should be available for embedding outside the Console.

---

## 26. Hero Widget

The current Hero area inside `sites/staging/index.html` must be extracted as an independent widget.

It should consume:

- Platform Context;
- weather/current-condition data as required;
- shared lunar contract as required;
- any existing status/time information currently used by Hero.

The Hero widget must not read values from other widget DOM nodes.

It may combine multiple data providers internally.

This is valid because the Hero itself becomes the owner of that composition.

---

## 27. Console Composer

The target Console shall be described by configuration.

Conceptual configuration:

```js
export const consoleLayout = [
  {
    id: "hero",
    widget: "hero",
    slot: "hero"
  },
  {
    id: "sky-main",
    widget: "sky",
    slot: "main",
    config: {
      orientation: "horizontal"
    }
  },
  {
    id: "weather-main",
    widget: "weather",
    slot: "main",
    config: {
      orientation: "horizontal"
    }
  },
  {
    id: "events-main",
    widget: "events",
    slot: "main"
  },
  {
    id: "alerts-main",
    widget: "alerts",
    slot: "sidebar",
    config: {
      orientation: "vertical"
    }
  }
];
```

The Console Composer is responsible for:

- creating layout slots;
- mounting configured widgets;
- controlling placement;
- controlling grid/span;
- preserving responsive page layout;
- destroying widgets if configuration changes.

It must not contain widget-specific rendering logic.

---

## 28. Console Migration Strategy

`sites/staging/index.html` must not be rewritten first.

The migration should proceed in reverse:

1. create runtime and registry;
2. adapt already modular widgets;
3. adapt Sky;
4. extract News and Events;
5. extract Alerts;
6. extract Hero;
7. replace Console panel internals with widget mounts;
8. finally move Console composition into declarative configuration.

At all intermediate phases, `sites/staging/index.html` remains functional.

---

## 29. Widget Gallery / Builder

Nebulacast shall provide a dedicated widget selection/configuration surface.

The Gallery/Builder must use the same Widget Registry used by the Console.

For each widget it should provide:

- widget description;
- live preview;
- supported options;
- orientation selector;
- relevant widget-specific controls;
- iframe embed output;
- JavaScript embed output;
- serialized configuration.

The Builder must not maintain hard-coded duplicate widget definitions.

---

## 30. Standalone Widget Pages

Each widget should be renderable through a generic standalone host page.

Conceptual URL:

```text
/widgets/widget.html?widget=weather&orientation=vertical
```

or equivalent route.

The host page should:

1. parse allowed configuration;
2. initialize Platform Context;
3. mount the requested widget;
4. expose only the widget surface.

This generic host should power iframe embeds where practical.

Dedicated pages may remain for compatibility.

---

## 31. iframe Embed Model

iframe embedding is required for simple external integrations.

Use cases include:

- Blogger;
- CMS systems;
- static sites;
- external sites where direct JavaScript integration is undesirable.

Conceptual output:

```html
<iframe
  src="https://nebulacast.app/widgets/widget.html?widget=weather&orientation=vertical"
  loading="lazy">
</iframe>
```

### 31.1 Observer configuration

A standalone iframe may receive observer context through:

- URL configuration;
- default site location;
- explicit fixed coordinates;
- future parent messaging where needed.

### 31.2 Security

Only documented configuration keys should be accepted from URL parameters.

Arbitrary JavaScript or HTML configuration must never be accepted.

---

## 32. JavaScript Embed Model

A reusable ES module entry point shall be exposed.

Conceptual usage:

```html
<div id="nc-weather"></div>

<script type="module">
  import { mount } from
    "https://nebulacast.app/widgets/runtime/index.mjs";

  mount(document.querySelector("#nc-weather"), {
    widget: "weather",
    config: {
      orientation: "vertical"
    }
  });
</script>
```

This model is intended especially for:

- Local Bubble;
- Stellar Attractor;
- Roads of Times;
- other Incus Luminis applications;
- external applications requiring direct integration.

### 32.1 No private DOM dependency

External hosts may configure and mount widgets only through the documented API.

They must not rely on internal DOM selectors.

---

## 33. Styling Isolation

Reusable widget CSS must survive outside the Console.

Target rules:

- widget selectors anchored to a widget root;
- no reliance on Console grid class names;
- no global element selectors that unintentionally style the host page;
- no hard-coded page widths;
- no dependency on sibling widgets;
- CSS custom properties preferred for theme integration.

A widget root should expose a stable namespace, for example:

```text
.nc-widget
.nc-widget--weather
```

### 33.1 Shadow DOM

Shadow DOM is not required for the initial architecture.

CSS isolation should first be achieved through disciplined root scoping.

This keeps migration compatible with the existing application.

---

## 34. Theme Model

Widgets should support:

- inherited host theme;
- dark;
- light;
- auto.

Shared design tokens should be expressed as CSS custom properties where practical.

Example categories:

- surface;
- text;
- muted text;
- border;
- accent;
- warning;
- critical;
- spacing;
- radius;
- typography.

A widget must not require the complete Console stylesheet merely to render correctly.

---

## 35. Multi-instance Rules

The following patterns must be removed or adapted before a widget is marked multi-instance safe:

- fixed document ids;
- singleton globals;
- one global timer;
- one global ResizeObserver;
- `querySelector` calls against the full document for widget internals;
- page-owned mutable state;
- one global current data object;
- hard-coded parent selectors.

An instance may use ids internally only if they are unique within that instance.

---

## 36. Backwards Compatibility

The migration must preserve:

- current `/weather/` behavior;
- current standalone Sky behavior;
- current Console behavior;
- current News/Calendar generated pages;
- current backend API schemas;
- current generated data schemas;
- current URLs unless explicitly migrated;
- current Cloudflare deployment model.

Legacy APIs may be implemented as adapters over the new runtime.

For example:

`window.SKY_CONFIG` may remain supported while new code uses `mountSky()`.

Legacy adapters should be documented as deprecated only after the new path is stable.

---

## 37. Source and Generated Artifact Discipline

The repository currently contains generated/public artifacts beside source-like runtime files.

Widget-platform work must avoid silently creating multiple authoritative copies.

For every migrated widget, the implementation task must identify:

- authoritative source file;
- generated/copied artifact if any;
- build step if any;
- deploy path;
- local test path.

No widget should have two independently edited implementations.

---

## 38. Migration Phases

### Phase 0 — Architecture Baseline

Goal:

freeze terminology and contracts before implementation.

Deliverables:

- this architecture specification;
- final widget inventory;
- explicit production/legacy classification for ambiguous files;
- baseline screenshots and behavior checks.

No functional changes.

---

### Phase 1 — Runtime Foundation

Create:

- Widget Registry;
- Widget Runtime;
- Platform Context adapter;
- common lifecycle normalization;
- common configuration normalization;
- generic mount API.

Initially register adapters for modular Weather components.

No Console rewrite.

Acceptance:

- runtime can mount at least two different widgets;
- runtime can destroy them;
- existing `/weather/` remains unchanged;
- same widget can be mounted twice in a test page.

---

### Phase 2 — Modular Weather Family

Migrate/adapt:

- Location;
- Weather;
- Sun & Moon;
- Astro;
- production Map.

Goals:

- common registration;
- explicit widget configuration;
- orientation support;
- multi-instance safety;
- common Platform Context.

The existing weather app may then become another composition surface.

---

### Phase 3 — Sky

Convert Sky to explicit instance lifecycle.

Goals:

- `mountSky(root, context, config)`;
- no mandatory global config for new runtime;
- no singleton global instance for new runtime;
- legacy standalone compatibility;
- multi-instance support;
- explicit destroy;
- orientation behavior.

Do not combine this phase with astronomy algorithm unification.

---

### Phase 4 — News and Events

Move generated/runtime widgets into common registry.

Goals:

- common mount API;
- independent root;
- scoped styling;
- generic embed compatibility.

No new state architecture.

---

### Phase 5 — Alerts

Extract Alerts from Console-specific structure.

Goals:

- vertical Console sidebar mode;
- horizontal/auto embed modes;
- direct existing alerts dataset consumption;
- local loading/error/stale handling;
- common runtime registration.

---

### Phase 6 — Hero

Extract Hero from `sites/staging/index.html`.

Goals:

- independent mount;
- Platform Context consumption;
- direct data-provider consumption;
- shared lunar contract consumption;
- no DOM scraping;
- no Console-global data dependency.

---

### Phase 7 — Declarative Console

Introduce:

- Console layout configuration;
- Console Composer.

Replace direct panel initialization with configured widget mounts.

The Console shell remains responsible only for:

- navigation;
- overall layout;
- settings that genuinely affect Platform Context;
- widget placement.

Acceptance:

the main visible Console can be reconstructed from declarative widget configuration.

---

### Phase 8 — Widget Gallery / Builder

Create a public widget configuration page.

Goals:

- registry-driven widget list;
- live preview;
- configuration controls;
- iframe output;
- JavaScript output;
- serialized config.

---

### Phase 9 — Astronomy Consistency

Unify astronomy computation ownership separately.

Goals:

- authoritative semantic contracts;
- remove duplicated Sun/Moon formulas where appropriate;
- regression-test values across consumers;
- preserve presentation differences only.

This phase must have its own astronomy specification before implementation.

---

### Phase 10 — User-configurable Console

This is a later product feature, not required for initial platform migration.

Potential capabilities:

- add/remove widgets;
- reorder;
- change spans;
- configure widget instances;
- persist layouts;
- restore defaults;
- share/import layout configuration.

The architecture above must make this possible without another frontend rewrite.

---

## 39. Recommended Initial Widget Readiness

Based on the current implementation audit:

| Widget | Initial migration class |
|---|---|
| Location | Minor extraction / adaptation |
| Weather | Significant internal complexity, but strong existing mount model |
| Sun & Moon | Minor extraction / adaptation |
| Astro | Minor extraction |
| Map | Minor extraction after production path is confirmed |
| Sky | Significant lifecycle adaptation |
| News | Moderate runtime adaptation |
| Events / Calendar | Moderate runtime adaptation |
| Alerts | Significant extraction from Console |
| Hero | Significant extraction from Console |

This table is migration guidance, not a code-quality rating.

---

## 40. Non-goals

The widget-platform migration does not include by default:

- rewriting backend APIs;
- replacing Cloudflare Pages;
- introducing a SPA framework;
- replacing static deployment;
- redesigning all visual styles;
- rebuilding astronomy algorithms during Phase 1;
- replacing News or Calendar pipelines;
- redesigning scoring logic;
- user authentication;
- private/user-specific data APIs;
- drag-and-drop Console editing in the first release;
- deleting all legacy files immediately.

---

## 41. Implementation Rules

Every implementation task derived from this specification must:

1. name the exact current files being changed;
2. identify compatibility behavior;
3. identify authoritative source versus generated artifact;
4. provide local validation;
5. provide regression checks;
6. avoid unrelated refactors;
7. preserve stable backend contracts;
8. avoid new global state unless explicitly justified;
9. return/implement lifecycle cleanup;
10. preserve current deploy structure.

---

## 42. Testing Strategy

### 42.1 Required local environment

Primary baseline:

```text
make server
```

serving:

```text
sites/staging/
```

on port:

```text
8080
```

### 42.2 Widget contract tests

For every migrated widget verify:

- mount succeeds;
- destroy succeeds;
- remount succeeds;
- two simultaneous instances work;
- observer changes propagate where applicable;
- manual/live time changes propagate where applicable;
- config updates do not corrupt other instances;
- resize behaves correctly;
- orientation changes correctly;
- no duplicate timers remain after destroy.

### 42.3 Network behavior

Where applicable verify:

- normal response;
- timeout;
- stale response;
- rate-limited response;
- empty response;
- offline/error state.

### 42.4 Surface regression

At relevant phases verify:

- `/`
- `/weather/`
- standalone Sky
- widget host page
- iframe embed
- JavaScript embed.

---

## 43. Performance Requirements

Widgetization must not cause every widget to load every runtime dependency.

Required behavior:

- heavy widgets lazy-load;
- Sky loads only when mounted;
- widgets fetch only data they consume;
- hidden/unmounted widgets do not continue unnecessary polling;
- multiple instances may share browser/network cache where safe, but must not share mutable UI state;
- embed pages load only the selected widget plus shared runtime.

---

## 44. Accessibility Requirements

Migration must not reduce existing accessibility.

New widget shells and Builder controls should use:

- semantic headings/landmarks where appropriate;
- keyboard-operable controls;
- visible focus;
- labels for interactive controls;
- readable loading/error states;
- sufficient non-color signaling for warnings and statuses.

Canvas-based widgets should retain or add textual alternatives where the existing UI supports them.

---

## 45. Security and External Embedding

Current public APIs are suitable for public data use.

New widget runtime and iframe configuration must:

- validate supported query/config values;
- reject executable configuration;
- avoid arbitrary remote module URLs;
- avoid arbitrary HTML injection;
- avoid exposing private internal state;
- preserve same-origin assumptions where required by current APIs.

Any future authenticated or user-specific widget data requires a separate security design.

---

## 46. Versioning

The initial runtime should expose a stable versioned widget contract.

Widget implementation versions may evolve internally without breaking host code.

Public configuration should evolve additively where possible.

If a breaking widget configuration change becomes necessary, it must use explicit versioning rather than silently reinterpret existing embed URLs.

---

## 47. Definition of Platform Completion

The first major Widget Platform milestone is complete when:

1. the common Widget Runtime and Registry exist;
2. Weather-family widgets use the runtime;
3. Sky uses the runtime without requiring singleton globals;
4. News and Events can mount through the same runtime;
5. Alerts is a standalone widget;
6. Hero is a standalone widget;
7. the production Console is assembled from declarative widget configuration;
8. a generic standalone widget host exists;
9. iframe embeds are generated from the same registry/configuration model;
10. JavaScript embeds use the same runtime;
11. current Nebulacast URLs and backend contracts remain operational.

---

## 48. Definition of Future Product Completion

The later user-configurable Console capability becomes feasible when layout configuration can be safely persisted.

At that point the system should conceptually treat the default Console as simply:

```text
Nebulacast default layout configuration
```

and a user-created Console as:

```text
user layout configuration
```

Both must be rendered by the same Composer and Widget Runtime.

No separate user-dashboard architecture should be created.

---

## 49. Final Architectural Rule

Nebulacast must converge on one reusable frontend model:

```text
Data Provider
      |
      v
Domain Contract
      |
      v
Platform Context + Widget Configuration
      |
      v
Widget Runtime
      |
      v
Independent Widget Instance
      |
      +--> Console
      +--> Standalone page
      +--> iframe embed
      +--> JavaScript embed
```

The Console, Weather application, standalone widget pages, and external embeds must no longer represent separate implementation architectures.

They must become different compositions and hosts for the same widget library.
