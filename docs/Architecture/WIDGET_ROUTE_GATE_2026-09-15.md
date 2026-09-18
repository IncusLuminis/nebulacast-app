# Widget Platform route gate — 2026-09-15

This is the local post-migration gate for Story #96. It was run from the
isolated branch `codex/widget-platform-planning` against the server serving
`sites/staging/` on `127.0.0.1:8080`. No staging or production environment was
used.

## Static and HTTP checks

```text
validate_widget_baseline.py: 5/5 local HTTP surfaces served
validate_widget_inventory.py: 13 widgets, all ownership paths exist
validate_route_composition.py: 7 routes, 27 visible surfaces passed
```

The baseline script currently covers the original Console, Weather, Sky, News,
and Calendar HTTP smoke set. The added standalone Helio, Map, and Sun route
coverage is included in the browser gate below.

## Browser gate

Command:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:8080 \
npx playwright test \
  tests/browser/console-composer.spec.mjs \
  tests/browser/weather-page-composer.spec.mjs \
  tests/browser/widget-baseline-matrix.spec.mjs \
  tests/browser/map-platform.spec.mjs \
  tests/browser/standalone-route-composition.spec.mjs \
  tests/browser/core-page.spec.mjs \
  --workers=1 --reporter=line --trace=off
```

Result: **13/13 PASS**.

The gate covered:

- Console Runtime slots and Hero navigation;
- Weather Runtime composition, observer update, resize, API failure, lazy
  square Sky, and removal of page-owned Sky globals;
- standalone Sky query configuration and compatibility URL behavior;
- standalone Map Runtime root with the compatibility iframe contained inside
  the registered Map adapter;
- standalone Space Weather, Events, and Sun/Moon Runtime hosts;
- legacy `/weather/map1.html` redirect behavior.

No merge was performed. The branch remains local/staging-only for review.
