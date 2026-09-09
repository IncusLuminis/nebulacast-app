import test from "node:test";
import assert from "node:assert/strict";
import {
  DENSITIES,
  ORIENTATIONS,
  REQUESTED_ORIENTATIONS,
  RESOLVED_ORIENTATIONS,
  STATES,
  THEMES,
  createWidgetHost,
  normalizeWidgetConfig,
} from "../sites/staging/shared/widget-contract.mjs";
import { createFakeRoot } from "./fixtures/widget-runtime-fixture.mjs";

test("exports the finite common widget contract and applies immutable defaults", () => {
  assert.deepEqual(ORIENTATIONS, ["auto", "horizontal", "vertical"]);
  assert.strictEqual(ORIENTATIONS, REQUESTED_ORIENTATIONS);
  assert.deepEqual(RESOLVED_ORIENTATIONS, ["horizontal", "vertical"]);
  assert.deepEqual(THEMES, ["inherit", "auto", "dark", "light"]);
  assert.deepEqual(DENSITIES, ["compact", "normal", "comfortable"]);
  assert.deepEqual(STATES, ["loading", "ready", "empty", "stale", "degraded", "error"]);

  const config = normalizeWidgetConfig({ widgetSpecific: { label: "fixture" } });
  assert.deepEqual(config, {
    widgetSpecific: { label: "fixture" },
    orientation: "auto",
    theme: "inherit",
    density: "normal",
  });
  assert.equal(Object.isFrozen(config), true);
  assert.equal(Object.isFrozen(config.widgetSpecific), true);
  assert.throws(() => { config.orientation = "vertical"; }, TypeError);
  assert.throws(() => { config.widgetSpecific.label = "changed"; }, TypeError);
});

test("rejects invalid common values and arbitrary mount functions", () => {
  assert.throws(() => normalizeWidgetConfig(null), /must be an object/);
  assert.throws(() => normalizeWidgetConfig({ orientation: "diagonal" }), /orientation/);
  assert.throws(() => normalizeWidgetConfig({ theme: "sepia" }), /theme/);
  assert.throws(() => normalizeWidgetConfig({ density: "expanded" }), /density/);
  assert.throws(() => normalizeWidgetConfig({ mount: () => {} }), /arbitrary mount function/);
  assert.throws(
    () => normalizeWidgetConfig({ orientation: "auto" }, { resolveAutoOrientation: () => "diagonal" }),
    /resolved orientation/,
  );
  assert.throws(
    () => normalizeWidgetConfig({ orientation: "auto" }, { resolveAutoOrientation: () => "auto" }),
    /resolved orientation/,
  );
});

test("keeps explicit orientation and resolves auto only through an injected resolver", () => {
  const root = createFakeRoot("auto");
  let resolverCalls = 0;
  const resolveAutoOrientation = ({ root: resolverRoot, config }) => {
    resolverCalls += 1;
    assert.strictEqual(resolverRoot, root);
    assert.equal(config.theme, "dark");
    return "vertical";
  };

  const auto = normalizeWidgetConfig(
    { orientation: "auto", theme: "dark" },
    { root, resolveAutoOrientation },
  );
  const explicit = normalizeWidgetConfig(
    { orientation: "horizontal" },
    { root, resolveAutoOrientation },
  );

  assert.equal(auto.orientation, "vertical");
  assert.equal(explicit.orientation, "horizontal");
  assert.equal(resolverCalls, 1);
});

test("attaches isolated root metadata, theme/density attributes, and all state transitions", () => {
  const firstRoot = createFakeRoot("first");
  const secondRoot = createFakeRoot("second");
  firstRoot.classList.add("sentinel");
  const firstConfig = normalizeWidgetConfig({ orientation: "horizontal", theme: "dark", density: "compact" });
  const secondConfig = normalizeWidgetConfig({ orientation: "vertical", theme: "light", density: "comfortable" });
  const firstHost = createWidgetHost(firstRoot, { id: "widget-1", type: "astro", config: firstConfig });
  const secondHost = createWidgetHost(secondRoot, { id: "widget-2", type: "sun-moon", config: secondConfig });

  assert.deepEqual(firstHost.getMetadata(), {
    id: "widget-1",
    type: "astro",
    orientation: "horizontal",
    theme: "dark",
    density: "compact",
  });
  assert.equal(Object.isFrozen(firstHost.getMetadata()), true);
  assert.equal(firstRoot.classList.contains("nc-widget"), true);
  assert.equal(firstRoot.getAttribute("data-nc-widget"), "astro");
  assert.equal(firstRoot.getAttribute("data-nc-widget-id"), "widget-1");
  assert.equal(firstRoot.getAttribute("data-nc-orientation"), "horizontal");
  assert.equal(firstRoot.getAttribute("data-nc-theme"), "dark");
  assert.equal(firstRoot.getAttribute("data-nc-density"), "compact");
  assert.equal(firstHost.getState(), "loading");

  for (const state of STATES) {
    assert.equal(firstHost.setState(state), state);
    assert.equal(firstHost.getState(), state);
    assert.equal(firstRoot.getAttribute("data-nc-state"), state);
  }

  assert.equal(secondHost.getState(), "loading");
  assert.equal(secondRoot.getAttribute("data-nc-widget"), "sun-moon");
  firstHost.destroy();
  assert.equal(firstRoot.classList.contains("nc-widget"), false);
  assert.equal(firstRoot.classList.contains("sentinel"), true);
  assert.equal(firstRoot.getAttribute("data-nc-widget"), null);
  assert.equal(firstRoot.getAttribute("data-nc-state"), null);
  assert.equal(secondRoot.classList.contains("nc-widget"), true);
  assert.equal(secondHost.getState(), "loading");
  secondHost.destroy();
});

test("updates host metadata without changing the host identity", () => {
  const root = createFakeRoot("config");
  const host = createWidgetHost(root, {
    id: "widget-3",
    type: "astro",
    config: normalizeWidgetConfig({ orientation: "auto" }),
  });
  const nextConfig = normalizeWidgetConfig({ orientation: "vertical", theme: "auto", density: "comfortable" });

  assert.strictEqual(host.setConfig(nextConfig), host.getMetadata());
  assert.equal(root.getAttribute("data-nc-orientation"), "vertical");
  assert.equal(root.getAttribute("data-nc-theme"), "auto");
  assert.equal(root.getAttribute("data-nc-density"), "comfortable");
  assert.equal(root.getAttribute("data-nc-state"), "loading");
  host.destroy();
});
