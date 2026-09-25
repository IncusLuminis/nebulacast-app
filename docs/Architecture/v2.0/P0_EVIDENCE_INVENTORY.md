# P0 evidence inventory: current writers, consumers and publication paths

**Status:** as-is evidence collected 2026-09-25.  This is an inventory, not a
target architecture or an authorization to change a running writer.

## Scope and method

The inventory is derived from committed workflow definitions, pipeline entry
points, Pages Functions and browser route/widget imports.  It deliberately
does not infer Cloudflare account bindings, secret scopes, retention, or a
consumer population that is not represented in this repository.

## Scheduled writers and publication authority

| Writer / cadence (UTC) | Entry point | Published targets | Credential / authority evidenced |
| --- | --- | --- | --- |
| Weather, every 6 h | `services/weather/pipelines/run_weather.py`, `run_phase1.py` | `sites/staging/weather/daily_weather.json`, `sites/staging/data/weather/**`, `observer_weather_now.json`, `space_weather_now.json`, `services/weather/outputs/**` | workflow `GITHUB_TOKEN`, `contents: write`; pushes its triggering ref |
| Weather map, 08:00 and 20:00 | `gen_weather_map.py` | `sites/staging/data/weather_map_now.json`, `data/isobars/**` | workflow `GITHUB_TOKEN`, `contents: write`; explicitly rebases against `main` |
| GRIB tiles, 05:30 | `gen_grib_tiles.py` | tile manifests committed under `sites/staging/data/tile_manifests/**`; gitignored WebP tiles deployed from runner | `GITHUB_TOKEN` writes `main`; Cloudflare Pages deploy uses `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CF_PAGES_PROJECT` and `--commit-dirty` |
| Helio, every 3 h | `services/helio/pipelines/gen_helio.py` | `sites/staging/data/helio_now.json` | `GITHUB_TOKEN`, `contents: write`; pushes triggering ref |
| Sky alerts, every 12 h | `gen_{gcn,neo,neocp,risk}_alerts.py`, `gen_alerts.py` | `services/sky/data/generated/alerts_*.json`, `sites/staging/sky/data/alerts_now.json` | `GITHUB_TOKEN`, `contents: write`; NASA client id/secret are supplied to the producer |
| Sky objects, 00:00 and 12:00 | `services/sky/pipelines/gen_objects.py` | generated and public `objects_today.json`, `objects_week.json` and related Sky data | `GITHUB_TOKEN`, `contents: write`; pushes triggering ref |
| Sky ranking, 00:15 and 12:15 | `services/sky/pipelines/gen_ranking.py` | `services/sky/data/generated/ranking.json`, `sites/staging/sky/data/ranking.json` | `GITHUB_TOKEN`, `contents: write`; pushes triggering ref |
| Sky planets, 02:00 | `gen_planets.py` | generated and public `planets.json` | `GITHUB_TOKEN`, `contents: write`; pushes triggering ref |
| Sun/Moon, 02:10 | `gen_sunmoon.py` | generated and public `sun_moon.json` | `GITHUB_TOKEN`, `contents: write`; pushes triggering ref |
| Calendar, 03:20 | `services/calendar/pipelines/run_calendar.py` | `sites/staging/alerts/**`, `sites/staging/calendar/**`, `services/calendar/outputs/**` | `GITHUB_TOKEN`, `contents: write`; pushes triggering ref |
| News, 03:30 | `services/news/pipelines/run_news.py` | `sites/staging/news/**`, `services/news/outputs/**` | `GITHUB_TOKEN`, `contents: write`; pushes triggering ref |

`deploy-staging.yml` is an on-demand Pages deployment of `sites/staging` to
the `main` Pages branch.  The GRIB workflow is also a direct deployer and is
therefore the exception: a clean checkout cannot recreate the gitignored tile
WebPs that it sends using `wrangler --commit-dirty`.

## On-demand writers / dynamic routes

| Route | Producer | Input / target | Active consumers evidenced |
| --- | --- | --- | --- |
| `/api/astro-weather` | Pages Function `functions/api/astro-weather.ts` (built to JS) | upstream weather and astronomy calculation; response only | Weather widget and location controls |
| `/api/observer-weather` | Pages Function `functions/api/observer-weather.js` | fan-out to `/api/astro-weather`; response only | home/console and Hero |
| `/api/sun-moon` | Pages Function `functions/api/sun-moon.js` | location-specific astronomy frames; response only | console loader and Weather widget for a non-default location |
| `/api/sky-ranking` | Pages Function `functions/api/sky-ranking.js` | reads static `/sky/data/objects_today.json`, recalculates response | home and Sky UI for a non-default location |
| `/api/geocode`, `/api/revgeo` | Pages Functions | Nominatim lookup; response only | weather location widget and POC route |

No repository evidence establishes Pages Function runtime identities, upstream
API credentials, Cloudflare binding permissions, cache durability, or whether
external callers consume these routes.

## Public datasets: producer and consumer evidence

| Dataset family | Current producer | Static consumers | Dynamic/external consumer evidence |
| --- | --- | --- | --- |
| `data/weather/locations/**`, `weather/daily_weather.json` | Weather cron | weather pages / legacy POC | none proven |
| `data/observer_weather_now.json` | Weather Phase 1 cron | console loader, Stats, observer widget fallback | `/api/observer-weather` is the location-aware alternative |
| `data/space_weather_now.json` | Weather Phase 1 cron | space-weather widget | none proven |
| `data/helio_now.json` | Helio cron | console loader, Stats, Helio widget | embed/runtime source is configurable; outside consumers unknown |
| `data/weather_map_now.json`, `data/isobars/**`, `data/tile_manifests/**`, tiles | Weather map and GRIB crons | Map POC and Stats | direct Pages deployment of runner-local tiles; external consumers unknown |
| `sky/data/sun_moon.json` | Sun/Moon cron | console loader, Stats, Sky and Weather pages | `/api/sun-moon` provides per-location response |
| `sky/data/{objects_today,objects_week}.json` | Sky objects cron | Sky core/map, object widget, Stats | `/api/sky-ranking` reads `objects_today.json` |
| `sky/data/ranking.json` | Sky ranking cron | home, console Stats, Sky core/map | `/api/sky-ranking` is a separate location-aware calculation |
| `sky/data/{planets,stars,constellations,milkyway,dso_messier}.json` | Sky pipelines / catalog artefacts | Sky core/map and Stats | none proven |
| `sky/data/alerts_now.json` | Sky alerts cron | alerts widget, console Stats | embed URLs can be configured; outside consumers unknown |
| `calendar/daily_signal.json`, `alerts/rss.xml` | Calendar cron | home, console config, calendar widget/page, embed | public JSON/RSS links; external consumer population unknown |
| `news/rss.xml` | News cron | home, console config, News widget/page, embed | public RSS; external consumer population unknown |

## Evidence gaps and containment conclusions

1. Most crons push to the ref that invoked them; weather-map and GRIB explicitly
   operate on `main`, and GRIB deploys directly.  A feature or integration
   branch is therefore not a safe isolation boundary for production-like data.
2. The declared `contents: write` permission proves repository write authority,
   but not a named human owner, Cloudflare token scope, or separation of
   staging/production identities.
3. A static dataset can have multiple copies (`services/**/generated`,
   `services/**/outputs`, `sites/staging/**`).  This inventory records paths,
   not a canonical-copy decision.
4. Browser references demonstrate in-repository consumers only.  CDN fetch
   logs, Pages analytics, access logs and embed telemetry are required before
   deprecating a route or public file.
5. `sky-ranking` uses static `objects_today.json` as input for its dynamic
   route; correctness for arbitrary locations is not proven by this topology.
6. `rules.yml` is configuration shared by Sky producers.  Its duplicate-key /
   nesting risk must be closed by the separate strict-loader and effective
   configuration fixture story before treating ranking output as a trusted
   baseline.

## Source evidence

- `.github/workflows/{cron-weather,cron-weather-map,cron-grib-tiles,cron-helio,cron-sky-alerts,cron-sky-objects,cron-sky-ranking,cron-sky-planets,cron-sunmoon,cron-calendar,cron-news,deploy-staging}.yml`
- `functions/api/{astro-weather,observer-weather,sun-moon,sky-ranking,geocode,revgeo}.*`
- `sites/staging/{index.html,console/data-loader.mjs,console/stats_page.js,sky/core/**,weather/**,hero/**,embed/index.html,shared/widget-catalog.mjs}`
