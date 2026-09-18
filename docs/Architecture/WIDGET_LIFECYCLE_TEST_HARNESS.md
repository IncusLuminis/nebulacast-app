# Widget lifecycle test harness

Issue #71 adds a deterministic lifecycle harness around the real
`createNebulacast` runtime. It is intentionally separate from production
widgets, Console routes, backend code, and deployment data.

## Local command

```sh
npm run test:widget-lifecycle
```

The suite covers mount, update, resize, refresh, Platform Context emissions,
destroy, remount, two same-type instances, idempotent destroy, sibling failure
isolation, and errors annotated with widget type and lifecycle phase.

## Resource ledger

`tests/fixtures/widget-lifecycle-harness.mjs` provides deterministic ledger
tokens for timers, observers, listeners, subscriptions, and requests. It also
accepts real catalog definitions, a supplied Platform Context, and a root
factory. `tests/fixtures/widget-lifecycle-contract.mjs` executes the common
mount/update/resize/refresh/destroy/remount/two-instance contract through that
public harness interface. The same executor runs against the real Astro and
Sun/Moon foundation adapters in `tests/widget-lifecycle-adapters.test.mjs`.

The deterministic fixtures do not create real timers or browser resources.
Each deterministic instance acquires one token of each kind and releases all
tokens during destroy; the test asserts that the ledger returns to zero. The
real-adapter test tracks subscriptions, timers, and ResizeObservers in the
same way while preserving the adapters' own DOM and context behavior.

## Broken cleanup fixture

`widget-lifecycle-broken-fixture.mjs` deliberately throws from cleanup through
the opt-in `createLifecycle({ onError })` hook. The test runs that fixture in a
child Node process and asserts a non-zero exit, so a cleanup failure cannot be
silently converted into a passing lifecycle test. The normal lifecycle helper
behavior remains warning-only when no hook is supplied.

## Browser contract

`tests/browser/widget-lifecycle.spec.mjs` uses the existing Playwright config
and the static `sites/staging/widget-host` fixture. It exercises public host
metadata/state attributes, style containment, state transitions, independent
destroy/unmount, and remount. If Playwright or its browser binaries are absent,
the browser spec remains ready for a future runner; pure Node coverage is the
required deterministic validation.
