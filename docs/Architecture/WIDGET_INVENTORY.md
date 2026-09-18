# Widget inventory and artifact ownership

This is the frozen implementation baseline for Story #66. The machine-readable
source of truth is [`WIDGET_INVENTORY.json`](WIDGET_INVENTORY.json); validate it
from the repository root with:

```bash
python3 scripts/validate_widget_inventory.py
```

The inventory covers the ten platform widget families: Hero, Location, Weather,
Sun & Moon, Astro, Map, Sky, News, Events, and Alerts. Each entry records one
authoritative implementation path, derived/public artifacts, build path, deploy
path, local test path, and compatibility paths.

The current Runtime adapters are production delivery paths, not alternate
widget implementations: Weather, Map, Sun & Moon, and Astro use the
`platform-adapter.mjs` path recorded beside each widget's authoritative source.
For Location, `weather/widgets/location/platform-adapter.mjs` is the canonical
controller and `location.js` is only the legacy `mountLocation(root, storeApi)`
compatibility bridge. The adapters do not establish a second owner.

Location timezone resolution uses timezone data returned by geocoding when
available, then the documented country/coordinate fallback. There is no
`functions/api/timezone.*` endpoint in this repository, so `/api/timezone` is
not an implementation or ownership dependency.

## Ownership rule

Files listed as generated, copied, compatibility, legacy, or POC are not a
second editable implementation. A change that introduces another editable
widget implementation must update the JSON inventory in the same change and
identify its classification and ownership.

## Map decision

The production Map implementation is `sites/staging/weather/map-poc.html`.
Despite its historical filename, [`weather-map-entrypoint.md`](weather-map-entrypoint.md)
defines this route as the supported weather-map entry point. The modular Weather
tab uses `sites/staging/weather/widgets/map/map.js` as its production adapter.

`sites/staging/map/index.html` is a public host for the supported route, and
`sites/staging/weather/map1.html` is a redirect kept for bookmarks. Neither owns
map logic. `sites/staging/weather/widgets/map/map2.js`, its `map2.css`, and the
unreferenced `sites/staging/weather/widget.js` UI initializer are classified as
POC and must not be used as platform extension points.

The standalone Sun & Moon host is `sites/staging/sun/index.html`; it mounts the
same authoritative `weather/widgets/sun_moon/sun_moon.js` implementation. The
vertical Weather host remains compatibility-only, including
`weather_vertical.css`, and `sites/staging/poc.html` remains a historical Astro
Weather POC host.

## Sky legacy bootstrap boundary

`sites/staging/sky/widget.js` is the authoritative Sky implementation and
exports `mountSky(root, context, config)`. The Runtime uses it through
`sites/staging/sky/platform-adapter.mjs`.

`sites/staging/sky/legacy-bootstrap.mjs` is the sole code compatibility bridge
for `window.SKY_CONFIG` and `window.__skyWidget`. The standalone Sky page and
existing HTML integrations import that adapter; the platform runtime never
reads or writes those globals.

## Scope boundary

Story #66 freezes the current repository topology and does not extract widgets,
move files, delete legacy/POC paths, change the runtime, update staging, or
change deployment behavior.

## News and Events runtime migration

News and Events are registered once each in the common Widget Runtime catalog.
Both definitions are `observerAware: false`, `timeAware: false`, and
`multiInstance: true`; their adapters only delegate supplied-root mounts to the
canonical [`frontend/assets/js/widget_runtime.js`](../../frontend/assets/js/widget_runtime.js).

The generated copy at `sites/staging/assets/js/widget_runtime.js` and the
existing generated/legacy `news/widget.js` and `calendar/widget.js` paths remain
compatibility artifacts. News continues to read `/news/rss.xml`; Events
continues to read `/calendar/daily_signal.json`, supports `timeRange` (`upcoming`
by default), and retains its JSON/RSS links.
No backend, pipeline, data schema, Console, Sky, Weather, or Builder/Gallery
surface is part of this migration.

## Alerts Widget Runtime migration

Alerts is registered once in the common Widget Runtime with no observer or time
subscription and with multi-instance/embed support. Its authoritative UI source
is [`sites/staging/alerts/widget.js`](../../sites/staging/alerts/widget.js),
mounted through the delegation-only
[`platform-adapter.mjs`](../../sites/staging/alerts/platform-adapter.mjs) and
the root-scoped [`widget.css`](../../sites/staging/alerts/widget.css).

The widget reads only `/sky/data/alerts_now.json`; the Sky alert generator,
backend, schema, RSS feed, and pipelines remain unchanged. The Console mounts
the widget in `#fs-sky`. The legacy
[`assets/js/widget_alerts_feed.js`](../../sites/staging/assets/js/widget_alerts_feed.js)
and [`sky/alerts.html`](../../sites/staging/sky/alerts.html) paths remain
compatibility surfaces and are not removed.

## Hero Widget Runtime migration

Hero is registered once in the common Widget Runtime with observer-aware,
time-aware, and multi-instance capabilities. Its authoritative implementation
is [`hero/widget.js`](../../sites/staging/hero/widget.js), mounted through the
delegation-only [`hero/platform-adapter.mjs`](../../sites/staging/hero/platform-adapter.mjs)
and styled by the root-scoped [`hero/widget.css`](../../sites/staging/hero/widget.css).

The Console host in [`index.html`](../../sites/staging/index.html) preserves the
existing Hero layout, panel IDs, and launcher behavior. It provides the shared
Platform Context and consumes Hero data/actions through scoped
`nc:hero-data`/`nc:hero-action` events; it does not own Hero rendering, clock
timers, or a `window._dbHeroData` bridge. The former inline renderer is not an
active implementation. `console/data-loader.mjs` remains a temporary
compatibility data-loader path, and no generated or copied Hero widget exists.
