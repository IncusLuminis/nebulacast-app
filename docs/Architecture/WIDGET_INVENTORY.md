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
map logic. `sites/staging/weather/widgets/map/map2.js` is classified as POC and
must not be used as a platform extension point.

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
