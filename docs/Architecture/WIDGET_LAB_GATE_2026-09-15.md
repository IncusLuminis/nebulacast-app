# Widget Lab / HUD Platform Local Acceptance Gate

Date: 2026-09-15  
Branch: `codex/widget-platform-planning`  
Environment: local staging server at `http://127.0.0.1:8080`

This gate covers the Widget Lab work for Epic #93 and its local integration with the HUD Platform widget runtime. No merge, staging deployment, or production operation is included.

## Static checks

The following checks passed:

```text
python3 scripts/validate_widget_baseline.py
PASS Console: / -> HTTP 200
PASS Weather: /weather/ -> HTTP 200
PASS Sky: /sky/ -> HTTP 200
PASS News: /news/ -> HTTP 200
PASS Calendar: /calendar/ -> HTTP 200
OK Issue #67 local route smoke matrix: 5 surfaces served from sites/staging

python3 scripts/validate_widget_inventory.py
OK WIDGET_INVENTORY.json: 13 widgets, all ownership paths exist

python3 scripts/validate_route_composition.py
OK CONSOLE_ROUTE_COMPOSITION.json: 7 routes, 27 visible surfaces, layout and ownership checks passed
```

## Automated checks

Targeted Widget Lab, embed, configuration, standalone-host, and showcase unit tests passed:

```text
node --test --test-reporter=dot \
  tests/standalone-widget-host.test.mjs \
  tests/widget-lab-model.test.mjs \
  tests/widget-lab-inspector.test.mjs \
  tests/widget-lab-output.test.mjs \
  tests/javascript-embed.test.mjs \
  tests/widget-config.test.mjs \
  tests/showcase-gallery.test.mjs
39 tests passed

npm run typecheck
npm run typecheck:test
git diff --check
all passed
```

The complete relevant browser matrix passed with one worker:

```text
PLAYWRIGHT_BASE_URL=http://127.0.0.1:8080 npx playwright test \
  tests/browser/console-composer.spec.mjs \
  tests/browser/weather-page-composer.spec.mjs \
  tests/browser/widget-baseline-matrix.spec.mjs \
  tests/browser/map-platform.spec.mjs \
  tests/browser/standalone-route-composition.spec.mjs \
  tests/browser/core-page.spec.mjs \
  tests/browser/javascript-embed.spec.mjs \
  tests/browser/showcase-gallery.spec.mjs \
  --workers=1 --reporter=line --trace=off
18 passed
```

The browser gate covers:

- independent Widget Lab Runtime previews and stage reopen/focus behavior;
- Sky square-dimension enforcement and oriented widget dimension rules;
- JavaScript and iframe embed output contracts;
- Console, Weather, Sky, News, Calendar, Map, Helio, and Sun route composition;
- route/API/data-error boundaries and compatibility iframe containment.

## Result

The Widget Lab implementation is locally ready for Validator review. Keep the work on `codex/widget-platform-planning`; the next environment for verification is staging only after the branch review is accepted.
