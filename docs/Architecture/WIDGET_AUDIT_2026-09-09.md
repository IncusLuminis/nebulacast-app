# Widget architecture audit

**Repository:** `IncusLuminis/nebulacast-app`  
**Audit basis:** `origin/main` (2026-09-09)  
**Purpose:** provide a reliable implementation map for a future ChatGPT generated feature specification.

## How to use this document

This is an implementation audit, not a feature specification. A future specification should treat the paths, contracts, lifecycle rules, and risks below as constraints to preserve unless it explicitly proposes a migration. The feature request still needs to define the user outcome, supported pages and embeds, backwards compatibility, and acceptance criteria.

## Executive findings

1. Nebulacast is a static site with a small set of Cloudflare Pages Functions. The public deploy root is `sites/staging/`; there is no application server or frontend bundler at runtime.
2. The main dashboard (`sites/staging/index.html`) is a large hand-authored shell. The weather application is a second, modular application under `sites/staging/weather/`, while `frontend/build.py` mainly generates the news and calendar pages and copies selected assets.
3. Weather has a central browser state store (`sites/staging/weather/core/state.js`) shared by Location, Weather, Map, Sun & Moon, Astro, and the lazy Sky integration. The dashboard has a separate state/rendering layer in its generated HTML. This is the main integration boundary for a new cross-widget feature.
4. Astronomy is not currently one executable pipeline. The browser Sun & Moon widget uses the shared `createLunarSnapshot` implementation (`frontend/astronomy/lunar.ts`, emitted as `sites/staging/shared/lunar.mjs`), while the Sky widget and the `/api/sun-moon` function contain independent low-precision Sun/Moon position algorithms. A new feature must state which calculations are authoritative and how generated/static consumers are kept consistent.
5. Location-aware behavior is supported end to end in the modular weather app: coordinates, timezone, name, profile, range, and selected time flow through the store and into API/widget updates. Several fallback paths still assume Warsaw or use heuristic timezone detection.
6. The repository contains committed generated/public code alongside source-like modules. Changes to the weather or Sky runtime normally require editing `sites/staging/**` directly and validating the same `sites/staging/` tree with the local server.

## Repository topology

| Area | Role | Primary entry points |
|---|---|---|
| `frontend/` | Python generator for the general pages, news/calendar markup, CSS, and runtime assets | `frontend/build.py`, `frontend/config/widgets.yaml`, `frontend/templates/` |
| `sites/staging/` | Single public/deploy root containing HTML, JS, CSS, JSON, RSS, and Functions-adjacent assets | `sites/staging/index.html`, `sites/staging/weather/index.html`, `sites/staging/sky/widget.js` |
| `functions/` | Cloudflare Pages Functions for on-demand location, weather, astronomy, and ranking APIs | `functions/api/*.ts`, `functions/api/*.js` |
| `services/` | Scheduled/offline data pipelines and catalogs | `services/astro_weather/`, `services/sky/`, `services/news/`, `services/calendar/`, `services/weather/` |
| `.github/workflows/` | Cron jobs that refresh generated artifacts and commit them | `cron-*.yml` |
| `docs/Architecture/` | Contracts, deployment notes, prior analyses, and design decisions | `ARCHITECTURE.md`, `WIDGET_API_ANALYSIS.md`, `lunar-snapshot-contract.md`, `sun-moon-ownership.md` |

The canonical local test command is `make server`, which serves `sites/staging/` on port 8080. A frontend build writes generated pages/assets into that same directory. Weather and Sky are not assembled by a modern build tool; their runtime modules and HTML are already present under `sites/staging/`.

## Widget inventory

### Dashboard shell

`sites/staging/index.html` contains the Console/dashboard UI, navigation, Hero strip, Sky Alerts, settings, statistics, and embedded weather/sky surfaces. It imports the weather modules from absolute `/weather/widgets/...` paths, lazy-loads `/sky/widget.js`, and imports `/shared/lunar.mjs` for Hero lunar data. It also contains substantial inline CSS and application logic, so changes to dashboard behavior must account for both markup and inline JavaScript.

### Modular weather application

Entry point: `sites/staging/weather/index.html`.

- Always mounts Location into `#w-location`.
- Mounts Weather, Sun & Moon, Map, and Astro into tab containers.
- Sky is lazy-loaded on first Sky tab activation; `window.SKY_CONFIG` must exist before importing `/sky/widget.js`.
- The active tab is persisted in `localStorage` under `nc-weather-tab`.
- `?embed=1` hides the Location widget for iframe/vertical embedding.
- Legacy `suncalc@1.9.0` is loaded globally, while the Sun & Moon module also uses the shared lunar snapshot.

### Location

`sites/staging/weather/widgets/location/platform-adapter.mjs` owns the canonical
instance-local Location controller, including search, geolocation, reverse
geocoding, timezone resolution, URL/share handling, and state updates.
`sites/staging/weather/widgets/location/location.js` remains the legacy
`mountLocation(root, storeApi)` compatibility bridge used by the Weather hosts.
The adapter uses same-origin Pages Functions (`/api/geocode`, `/api/revgeo`),
geocoder-provided timezone data when available, and country/coordinate fallback
logic; this repository has no `/api/timezone` endpoint. The adapter owns its
request cancellation and lifecycle cleanup.

### Weather

`sites/staging/weather/widgets/weather/weather.js` is the largest widget (about 4,800 lines). It renders current conditions, hourly cards, score explanations, factor chips, matrix overlays, mini charts, best windows, and the hour inspector. It fetches `/api/astro-weather` for location-aware data, with a legacy `/weather/daily_weather.json` fallback. It tracks profile, range, vertical layout, refresh timing, and several local-storage preferences. `mountWeather` returns a disposer and subscribes to the shared store.

### Sun & Moon

`sites/staging/weather/widgets/sun_moon/sun_moon.js` renders the Sun Equation canvas and event table for a three-day offset on either side of the selected date. It computes samples in the browser, uses `createLunarSnapshot` for lunar phase/illumination, and subscribes to location/time state. It owns a resize observer and an interval; its disposer clears both and unsubscribes.

### Astro

`sites/staging/weather/widgets/astro/astro.js` is a small panel that consumes the shared weather state/data. Its implementation is intentionally thin; new astronomy UI should generally integrate through the existing state and snapshot contracts instead of creating a parallel location/time source.

### Map

`sites/staging/weather/widgets/map/map.js` is a lightweight map surface with a companion POC/legacy implementation (`map2.js`). It receives the shared observer context and is a likely consumer of location and selected time. The POC files should not be treated as production extension points without an explicit cleanup decision.

### Sky

`sites/staging/sky/widget.js` is a self-bootstrapping canvas widget. The weather shell supplies `SKY_CONFIG` (`baseUrl`, mount id, lat/lon, optional `datetimeISO`, and feature options) before dynamic import. The module exposes `window.__skyWidget` with `update`, `resize`, and lifecycle-related methods and is also usable from standalone Sky pages. Sky loads generated catalogs/ranking data and computes observer visibility client-side; it contains its own solar/lunar position helpers.

### News and Calendar

News and Calendar are generated from `frontend/templates/partials/` and `frontend/assets/js/widget_runtime.js`. They fetch same-origin RSS/JSON from `sites/staging/news/`, `sites/staging/alerts/`, and `sites/staging/calendar/`. These widgets are structurally separate from the modular weather/Sky application and should not gain a second state mechanism unless the feature explicitly spans the whole dashboard.

## Shared state and lifecycle

`sites/staging/weather/core/state.js` is the canonical browser store for the modular weather application:

```js
{
  location: { name, lat, lon, tz },
  time: { mode: "live" | "manual", datetimeISO: string | null },
  profile: "default" | "visual" | "broadband" | "planetary",
  range: "today" | "48h" | "7d",
  source: "url" | "user" | "geolocate"
}
```

Important behavior:

- `getState()` returns a deep copy.
- `getObserverContext()` returns location plus effective time mode/ISO.
- `setState()` merges supported slices, clamps invalid coordinates, persists location/preferences, emits subscribers, dispatches `nc:state`, posts location to a parent iframe, and debounces URL replacement.
- URL initialization accepts `lat`, `lon`, `name`, `tz`, `profile`, and `range`.
- There is no first-class event model for “data fetch completed”; subscribers receive state changes, not a normalized data store.
- Each mounted widget is responsible for its own fetch/cache/render/dispose behavior. A new feature should avoid hidden global timers and should return a disposer when it mounts UI.

The dashboard shell has additional inline state (`_dbHeroData`, Sky handles, settings/local-storage state). It synchronizes selected location/time into Sky through tolerant adapters (`pickLatLonFromState`, `pickDatetimeISOFromState`) rather than importing the weather store directly.

## Data and API boundaries

### On-demand APIs

| Endpoint | Implementation | Input | Output/use |
|---|---|---|---|
| `/api/astro-weather` | `functions/api/astro-weather.ts` | `lat`, `lon`, optional `tz`, `hours`, `profile`, `bortle`, `name` | Merged hourly weather/astronomy records, additive score, derived windows; cached for 10 minutes |
| `/api/sun-moon` | `functions/api/sun-moon.js` | `lat`, `lon`, `days`, `step_min` | Sun/Moon position frames compatible with the Sky static contract |
| `/api/sky-ranking` | `functions/api/sky-ranking.js` | `lat`, `lon`, `tz` | Location-specific ranking computed from generated catalogs |
| `/api/geocode` | `functions/api/geocode.*` | query | Location candidates |
| `/api/revgeo` | `functions/api/revgeo.*` | coordinates | Place name |
| timezone fallback | `sites/staging/weather/widgets/location/platform-adapter.mjs` | geocoder timezone or coordinates/country | Timezone used by Location when no geocoder timezone is available; there is no `/api/timezone` function |

`/api/astro-weather` uses Open-Meteo and 7Timer providers, validates/merges them, computes derived values, and has graceful rate-limit/stale-cache handling. The frontend must treat an empty `hours` response with `source: "rate-limited"` as a degraded state, not as a normal forecast.

### Generated/static data

Cron/services populate RSS, calendar JSON, weather JSON, Helio data, Sky catalogs, rankings, and Sun/Moon frames under `sites/staging/`. Static files can be stale independently of on-demand APIs. A new feature must declare whether it needs live location-aware data, generated data, or both, and define freshness/error UI.

### Lunar contract

`frontend/astronomy/lunar.ts` defines `lunar-snapshot.v1` and the source marker `astronomy-engine@2.1.19`; the browser artifact is `sites/staging/shared/lunar.mjs`. The snapshot carries UTC computation time, normalized location, freshness/status, cycle phase, illuminated fraction/percent, waxing flag, name, emoji, and optional altitude/azimuth. Consumers should use the contract values directly and must not infer phase from rounded display percentages.

## Astronomy ownership and consistency risks

The current code has three relevant calculation surfaces:

1. Shared Astronomy Engine lunar phase/illumination (`frontend/astronomy/lunar.ts` → `/shared/lunar.mjs`) used by Sun & Moon and dashboard Hero.
2. Low-precision inline Sun/Moon position math in `functions/api/sun-moon.js`.
3. A separate copy of low-precision solar/lunar helpers in `sites/staging/sky/widget.js`.

The existing lunar snapshot removes the most visible phase/illumination drift for Hero and Sun Equation, but Sky still has an independent position implementation and its own data/render path. A future feature involving celestial labels, phase, illumination, rise/set, or dark-sky quality must explicitly choose one computation kernel and define adapters for every consumer. DOM scraping of another widget is not a valid integration boundary.

## Existing engineering risks

The prior `WIDGET_API_ANALYSIS.md` remains accurate for the legacy space/observer weather scripts: some fetches have no timeout or abort handling, refresh timers do not consistently pause on hidden tabs, and the News proxy can make multiple external requests. The modular weather code has additional risks relevant to new work:

- `sites/staging/weather/widgets/weather/weather.js` combines data access, scoring presentation, charts, overlays, inspectors, and multiple layouts in one module.
- Public runtime artifacts and source-like modules are committed together; generated files can drift from their intended source.
- Several legacy/P0 files coexist (`sun_moon_1.js`, `map2.js`, vertical variants, POC pages). Their production status must be established before reusing them.
- The dashboard and modular weather shell duplicate integration logic and do not share one formal event/data bus.
- Location fallback behavior can return UTC or Warsaw heuristically; any feature requiring reliable timezone semantics must surface source/fallback status.
- API CORS is permissive (`*`) and cache keys include query strings; new authenticated or user-specific data would need a different design.
- Browser-only calculations depend on a CDN-loaded global SunCalc in addition to bundled/shared astronomy code.

## Extension points for a new feature

Prefer the following seams, in order:

1. **Computation:** add or extend a pure module/service contract first; expose a typed, presentation-neutral result.
2. **Observer context:** consume `getObserverContext()` or the existing store API instead of reading URL/localStorage directly.
3. **Widget mount:** add a focused module under `sites/staging/weather/widgets/<feature>/` with explicit `mountX(root, storeApi, options)` and a disposer.
4. **Shell integration:** add one mount point/tab and wire location/time changes through the store; lazy-load expensive code where appropriate.
5. **Dashboard integration:** adapt the same contract in `sites/staging/index.html`; do not make the dashboard DOM the source of truth.
6. **API/generated data:** only add a Pages Function or cron artifact when browser computation cannot meet freshness, performance, or consistency requirements.

Avoid adding a second location model, a second phase/illumination formula, an unbounded polling loop, or a feature-specific global singleton without documenting why the existing seams cannot support it.

## Required inputs for the future feature specification

The ChatGPT-generated spec should answer these questions before implementation:

- What user problem and visible outcome does the feature solve?
- Which surfaces are in scope: dashboard, Weather app, standalone `/sky/`, iframe/vertical embed, or all of them?
- Is the feature location-aware and time-aware? What happens while geolocation, geocoding, timezone, or API requests fail?
- Which computation is authoritative, and what exact contract is exchanged between computation and UI?
- What are the freshness, timeout, retry, stale-data, and rate-limit rules?
- Does it need live API data, generated data, browser-only computation, or a hybrid?
- How should state be persisted and shared through URLs/iframes?
- What accessibility, responsive, canvas, and performance requirements apply?
- What existing legacy/P0 files are explicitly reused, deprecated, or removed?
- What local and CI validation proves consistency across all consumers?

## Recommended acceptance gates

A future implementation should not be considered ready until it demonstrates:

1. The feature mounts and disposes cleanly on every supported surface.
2. Location and manual/live time changes update the feature without a page reload or duplicate requests.
3. The authoritative computation produces identical semantic values for every consumer; formatting differences are presentation-only.
4. Network failures, stale data, hidden tabs, and rate limits produce bounded, understandable behavior.
5. The feature works from `sites/staging/` served on port 8080 and through the relevant embed URL.
6. Existing News, Calendar, Weather, Sun & Moon, Hero, and Sky behavior remains regression-free.

## Files to inspect first when writing the spec

- `docs/Architecture/ARCHITECTURE.md`
- `docs/Architecture/WIDGET_API_ANALYSIS.md`
- `docs/Architecture/lunar-snapshot-contract.md`
- `docs/Architecture/sun-moon-ownership.md`
- `sites/staging/weather/index.html`
- `sites/staging/weather/core/state.js`
- `sites/staging/weather/widgets/location/location.js`
- `sites/staging/weather/widgets/weather/weather.js`
- `sites/staging/weather/widgets/sun_moon/sun_moon.js`
- `sites/staging/sky/widget.js`
- `frontend/astronomy/lunar.ts`
- `functions/api/astro-weather.ts`
- `functions/api/sun-moon.js`
- `functions/api/sky-ranking.js`
