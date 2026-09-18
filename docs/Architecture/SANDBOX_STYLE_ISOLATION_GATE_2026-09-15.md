# Console Sandbox style-isolation local gate

Date: 2026-09-15
Branch: `codex/widget-platform-planning`
Story: #117 — Isolate Sandbox chrome styles from widget presentation

## Implemented boundary

- Sandbox document markers use `nc-console-sandbox-*` names;
- legacy `.page`, `.page-header`, and `.page-footer` selectors are not used by
  the Sandbox chrome;
- Sandbox visual tokens use `--nc-sandbox-*` custom properties;
- body defaults and the chrome reset are host-scoped;
- the reset deliberately excludes `.console-sandbox-runtime-root` and its
  descendants so mounted Runtime widgets retain ownership of presentation;
- shared Weather/Sky stylesheet files remain unchanged, preserving legacy
  `/weather/` and `/sky/` route behavior.

## Checks passed

```text
npm run typecheck
npm run typecheck:test
git diff --check

node --test \
  tests/console-sandbox-model.test.mjs \
  tests/widget-stylesheet-loader.test.mjs \
  tests/widget-css-scope.test.mjs \
  tests/standalone-widget-host.test.mjs \
  tests/javascript-embed.test.mjs
28 tests passed

npx playwright test \
  tests/browser/console-sandbox.spec.mjs \
  tests/browser/weather-page-composer.spec.mjs \
  tests/browser/widget-baseline-matrix.spec.mjs \
  tests/browser/core-page.spec.mjs \
  tests/browser/standalone-route-composition.spec.mjs \
  --workers=1 --reporter=line --trace=off
13 passed
```

No merge, staging deployment, or Product Owner `Done` transition is included.
