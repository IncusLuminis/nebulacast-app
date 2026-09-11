# Widget lifecycle evidence (2026-09-11)

This note records the observable evidence used for Story #90. The migration
specification does not define numeric performance budgets, so these checks do
not invent latency, request-count, or bundle-size thresholds.

## Evidence covered

- `tests/sky-platform.test.mjs` loads one Sky data URL twice, observes one
  network fetch, mutates the first returned payload, and verifies the second
  caller receives an independent unchanged object. The parsed response stays
  cached; callers receive defensive clones.
- `tests/browser/widget-lifecycle-performance.spec.mjs` records browser module
  and data request paths for the standalone Events host. It asserts that the
  selected adapter is loaded and unrelated Sky/Weather modules and Weather API
  requests are absent.
- The same browser spec instruments the observable `setInterval`,
  `ResizeObserver`, and `visibilitychange` resources owned by mounted Weather
  instances. It exercises hidden-tab teardown, explicit destroy, repeated
  remount, and two simultaneous instances. Assertions compare active resources
  before and after those lifecycle transitions; they are not performance
  budgets.

## Lifecycle policy

Sky's module/data cache is shared only as an efficiency mechanism. A cached
parsed payload is never returned directly to a widget instance, so rendering
or preparation in one instance cannot mutate another instance's input. UI
state, context subscriptions, timers, observers, and listeners remain
instance-owned and must be released by `destroy()`.
