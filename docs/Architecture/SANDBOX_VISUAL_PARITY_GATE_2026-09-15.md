# Console Sandbox visual parity gate

Date: 2026-09-15  
Branch: `codex/widget-platform-planning`  
Story: #118 — Validate Sandbox visual parity against staging widget routes

## Scope

`tests/browser/sandbox-visual-parity.spec.mjs` is a deterministic, non-pixel
gate for all 13 `widgetCatalog` entries. Its explicit matrix records each
Registry type, approved staging route/root, stable widget-owned probe, expected
layout mode, and exact stylesheet manifest source.

The gate covers:

- Sandbox desktop and narrow viewports;
- horizontal/vertical oriented modes and Sky square-only behavior;
- manifest stylesheet insertion and approved route stylesheet presence;
- widget-owned computed typography/spacing/layout properties;
- missing stylesheet requests, console/page errors, and unreadable stylesheets;
- widget-root and page-level overflow diagnostics.

The route comparison intentionally excludes generic host resets such as
`base.css` `box-sizing` defaults. Only properties explicitly owned by the
manifest stylesheet for the selected probe are compared. Entries with an empty
manifest remain covered by root/probe, layout, diagnostics, and overflow checks;
their inline/module-owned presentation is not mislabeled as a manifest source.

## Overflow policy and recorded gap

Overflow is not suppressed. The Hero desktop strip records its intentional
horizontal scroll baseline; any other overflow must be contained by the widget
(`auto`, `scroll`, `hidden`, or `clip`) and the page itself must not overflow
horizontally. A new uncontained overflow fails the gate.

Observed local baseline for the Sandbox desktop Hero probe:

```text
clientWidth = 658px
scrollWidth = 683px
approved horizontal overflow = +25px
approved vertical overflow = 0px
```

This is recorded as a known presentation constraint in the test matrix. Narrow
mode has no approved Hero overflow baseline and will expose a new uncontained
overflow.

The approved route matrix also records one existing legacy gap: `/map/` does
not advertise the two Registry stylesheet links used by the Sandbox
(`/weather/assets/weather.css` and `/weather/widgets/map/map.css`). The gap is
explicitly asserted so a different or additional missing route stylesheet
fails the gate; it is not silently treated as parity.

## Commands and results

Passed local gate:

```text
npm run typecheck                         PASS
npm run typecheck:test                    PASS
node --test \
  tests/console-sandbox-model.test.mjs \
  tests/widget-stylesheet-loader.test.mjs \
  tests/widget-css-scope.test.mjs \
  tests/standalone-widget-host.test.mjs \
tests/javascript-embed.test.mjs         28 passed
git diff --check                          PASS
npx playwright test tests/browser/sandbox-visual-parity.spec.mjs \
  --workers=1 --reporter=line --trace=off 3 passed
```

The browser gate uses deterministic local fixtures and verifies all 13 catalog
entries in desktop and narrow modes, plus route-to-route comparisons. No
commit, push, merge, GitHub Projects operation, or staging deployment was
performed for this Story yet.
