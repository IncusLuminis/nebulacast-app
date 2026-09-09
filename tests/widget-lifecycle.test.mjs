import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createWidgetLifecycleHarness } from "./fixtures/widget-lifecycle-harness.mjs";
import {
  LIFECYCLE_FOUNDATION_TYPE,
  LIFECYCLE_FIXTURE_TYPE,
} from "./fixtures/widget-lifecycle-fixture.mjs";

const emptyResources = {
  timers: 0,
  observers: 0,
  listeners: 0,
  subscriptions: 0,
  requests: 0,
};

test("harness uses real runtime for mount, update, resize, context, destroy, and remount", async () => {
  const harness = createWidgetLifecycleHarness();
  const cases = [
    [LIFECYCLE_FIXTURE_TYPE, harness.roots.one],
    [LIFECYCLE_FOUNDATION_TYPE, harness.roots.foundationOne],
  ];
  for (const [type, root] of cases) {
    const first = await harness.mount(root, {
      widget: type,
      config: { orientation: "horizontal", theme: "dark", density: "compact" },
    });
    assert.equal(first.type, type);
    assert.deepEqual(harness.ledger.snapshot(), {
      timers: 1, observers: 1, listeners: 1, subscriptions: 1, requests: 1,
    });

    harness.update(first, { state: "stale" });
    harness.resize(first, { width: 320, height: 180 });
    harness.refresh(first);
    harness.context.update({ time: { mode: "manual", datetimeISO: "2026-09-09T18:00:00Z" } });
    assert.equal(harness.events.filter(event => event.type === type && event.phase === "update").length, 1);
    assert.equal(harness.events.filter(event => event.type === type && event.phase === "resize").length, 1);
    assert.equal(harness.events.filter(event => event.type === type && event.phase === "refresh").length, 1);
    assert.equal(harness.events.filter(event => event.type === type && event.phase === "context").length, 1);
    assert.equal(root.getAttribute("data-nc-state"), "stale");

    harness.destroy(first);
    assert.deepEqual(harness.ledger.snapshot(), emptyResources);
    const remounted = await harness.mount(root, { widget: type, config: { orientation: "vertical" } });
    assert.equal(remounted.type, type);
    assert.notEqual(remounted.id, first.id);
    harness.destroy(remounted);
    assert.deepEqual(harness.ledger.snapshot(), emptyResources);
  }
});

test("keeps two instances of each foundation type independent and destroys each exactly once", async () => {
  const harness = createWidgetLifecycleHarness();
  const cases = [
    [LIFECYCLE_FIXTURE_TYPE, harness.roots.one, harness.roots.two],
    [LIFECYCLE_FOUNDATION_TYPE, harness.roots.foundationOne, harness.roots.foundationTwo],
  ];
  for (const [type, firstRoot, secondRoot] of cases) {
    const first = await harness.mount(firstRoot, {
      widget: type,
      config: { orientation: "horizontal", theme: "dark", density: "compact" },
    });
    const second = await harness.mount(secondRoot, {
      widget: type,
      config: { orientation: "vertical", theme: "light", density: "comfortable" },
    });
    assert.notEqual(first.id, second.id);
    assert.equal(harness.ledger.total(), 10);
    assert.equal(firstRoot.getAttribute("data-nc-theme"), "dark");
    assert.equal(secondRoot.getAttribute("data-nc-theme"), "light");
    harness.update(first, { state: "empty" });
    harness.update(second, { state: "degraded" });
    assert.equal(firstRoot.getAttribute("data-nc-state"), "empty");
    assert.equal(secondRoot.getAttribute("data-nc-state"), "degraded");

    harness.destroy(first);
    harness.destroy(first);
    assert.equal(harness.ledger.total(), 5);
    assert.equal(secondRoot.getAttribute("data-nc-state"), "degraded");
    harness.destroy(second);
    harness.destroy(second);
    assert.deepEqual(harness.ledger.snapshot(), emptyResources);
  }
});

test("reports diagnostics for each type while isolating sibling mount failure", async () => {
  const harness = createWidgetLifecycleHarness();
  const cases = [
    [LIFECYCLE_FIXTURE_TYPE, harness.roots.one, harness.roots.sibling],
    [LIFECYCLE_FOUNDATION_TYPE, harness.roots.foundationOne, harness.roots.foundationSibling],
  ];
  for (const [type, goodRoot, failingRoot] of cases) {
    const good = await harness.mount(goodRoot, { widget: type });
    await assert.rejects(
      harness.mount(failingRoot, { widget: type, config: { failPhase: "mount" } }),
      error => error.widgetType === type && error.lifecyclePhase === "mount" &&
        new RegExp(`\\[widget:${type}\\] mount: intentional mount failure`).test(error.message),
    );
    assert.equal(good.type, type);
    assert.equal(harness.ledger.total(), 5);

    await assert.rejects(
      Promise.resolve().then(() => harness.update(good, { failPhase: "update" })),
      error => error.widgetType === type && error.lifecyclePhase === "update" &&
        /intentional update failure/.test(error.message),
    );
    harness.destroy(good);
    assert.deepEqual(harness.ledger.snapshot(), emptyResources);
  }
});

test("strict broken cleanup is a deliberate non-zero failure", () => {
  const harnessModule = new URL("./fixtures/widget-lifecycle-harness.mjs", import.meta.url).href;
  const script = `
    const { createWidgetLifecycleHarness } = await import(${JSON.stringify(harnessModule)});
    const harness = createWidgetLifecycleHarness({ includeBroken: true });
    const instance = await harness.mount(harness.roots.broken, { widget: "lifecycle-broken" });
    harness.destroy(instance);
  `;
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(`${result.stdout}\n${result.stderr}`, /lifecycle-broken.*destroy/);
});
