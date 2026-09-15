# Console Sandbox local acceptance gate

Date: 2026-09-15  
Branch: `codex/widget-platform-planning`  
Environment: local server at `http://127.0.0.1:8080`

This gate covers Epic C (#109) work for the dedicated Console Sandbox. It does
not modify the production Dashboard and does not include staging or production
deployment.

## Product artifacts

- [Console Sandbox Composer Specification v1.0](./CONSOLE_SANDBOX_COMPOSER_SPECIFICATION_v1.0.md)
- Epic #109: Build the Console Sandbox composer
- C1–C5: #110–#114

## Checks

Passed:

```text
npm run typecheck
npm run typecheck:test
git diff --check

node --test tests/console-sandbox-model.test.mjs tests/widget-lab-model.test.mjs
12 tests passed

Console Sandbox static security scan
clean: no innerHTML/outerHTML/script/moduleUrl/postMessage/eval in console-sandbox/*.mjs
```

The complete local browser matrix passed with one worker:

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
  tests/browser/console-sandbox.spec.mjs \
  --workers=1 --reporter=line --trace=off
20 passed
```

## Covered behavior

- dedicated `/console-sandbox/` HTML host;
- Registry-derived palette and normalized allow-listed configuration;
- repeated independent Runtime instances in host-owned roots;
- add, select, reorder, resize, apply, remove, retry, and reset-all controls;
- desktop/narrow canvas viewport selection;
- square-only Sky and strict horizontal/vertical oriented layouts;
- empty, loading, ready, error, timeout, and invalid-state messaging;
- keyboard-reachable actions, selection semantics, live statuses, and safe DOM
  construction;
- existing Console, Weather, Sky, News, Calendar, Map, Helio, Sun/Moon, Widget
  Lab, and embed regression surfaces.

## Review state

The branch is locally ready for Validator review. Coder work remains on
`codex/widget-platform-planning`; final product acceptance and `Done` status
remain with the Product Owner. No merge or staging verification has been done.
