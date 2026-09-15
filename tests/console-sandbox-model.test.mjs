import test from "node:test";
import assert from "node:assert/strict";
import { createCatalogRegistry } from "../sites/staging/shared/widget-catalog.mjs";
import {
  CONSOLE_SANDBOX_VIEWPORTS,
  createConsoleSandboxModel,
} from "../sites/staging/console-sandbox/console-sandbox-model.mjs";

test("Console Sandbox palette is derived from Registry metadata", () => {
  const model = createConsoleSandboxModel({ registry: createCatalogRegistry() });
  const palette = model.getPalette();
  assert.equal(palette.length, 13);
  assert.deepEqual(palette.find(item => item.type === "sky").userModes, ["square"]);
  assert.deepEqual(palette.find(item => item.type === "weather").userModes, ["horizontal", "vertical"]);
  assert.equal(Object.hasOwn(palette[0], "loader"), false);
  assert.equal(model.getSnapshot().palette, palette);
});

test("Console Sandbox creates independent normalized instances", () => {
  const model = createConsoleSandboxModel({ registry: createCatalogRegistry() });
  const weather = model.createInstance({
    widget: "weather",
    config: { profile: "visual" },
    layout: { mode: "horizontal", width: 640, height: 360 },
  });
  const secondWeather = model.createInstance({
    widget: "weather",
    config: { profile: "balanced" },
    layout: { mode: "vertical", width: 320, height: 640 },
  });

  assert.notEqual(weather.id, secondWeather.id);
  assert.equal(model.getSnapshot().selectedId, secondWeather.id);
  assert.equal(model.getInstance(weather.id).config.profile, "visual");
  assert.equal(model.getInstance(secondWeather.id).config.profile, "balanced");
  assert.deepEqual(model.getSnapshot().instances.map(item => item.position), [0, 1]);
});

test("Console Sandbox validates Sky square and oriented modes", () => {
  const model = createConsoleSandboxModel({ registry: createCatalogRegistry() });
  const sky = model.createInstance({ widget: "sky" });
  assert.deepEqual(sky.layout, { mode: "square", shape: "square", width: 400, height: 400, valid: true, error: null });

  const invalid = model.createInstance({
    widget: "sky",
    layout: { mode: "square", width: 400, height: 401 },
  });
  assert.equal(invalid.state, "invalid");
  assert.match(invalid.error, /square/);

  const oriented = model.createInstance({ widget: "alerts", layout: { mode: "vertical", width: 320, height: 640 } });
  assert.equal(oriented.layout.valid, true);
  assert.equal(oriented.config.orientation, "vertical");
});

test("Console Sandbox updates configuration/layout and preserves selection", () => {
  const model = createConsoleSandboxModel({ registry: createCatalogRegistry() });
  const instance = model.createInstance({ widget: "events", layout: { mode: "horizontal", width: 640, height: 360 } });
  const updated = model.updateInstance(instance.id, {
    config: { timeRange: "all" },
    layout: { mode: "vertical", width: 320, height: 640 },
  });
  assert.equal(updated.id, instance.id);
  assert.equal(updated.config.timeRange, "all");
  assert.equal(updated.config.orientation, "vertical");
  assert.deepEqual(model.getSnapshot().selectedId, instance.id);
});

test("Console Sandbox reorders and removes cards with deterministic selection", () => {
  const model = createConsoleSandboxModel({ registry: createCatalogRegistry() });
  const first = model.createInstance({ widget: "alerts" });
  const second = model.createInstance({ widget: "events" });
  const third = model.createInstance({ widget: "weather" });
  model.move(first.id, 2);
  assert.deepEqual(model.getSnapshot().instances.map(item => item.id), [second.id, third.id, first.id]);
  model.select(first.id);
  model.remove(first.id);
  assert.equal(model.getSnapshot().selectedId, third.id);
  assert.deepEqual(model.getSnapshot().instances.map(item => item.widget), ["events", "weather"]);
});

test("Console Sandbox supports viewport/reset lifecycle without persistence", () => {
  const model = createConsoleSandboxModel({ registry: createCatalogRegistry() });
  assert.deepEqual(CONSOLE_SANDBOX_VIEWPORTS, ["desktop", "narrow"]);
  model.createInstance({ widget: "alerts" });
  model.setViewport("narrow");
  assert.equal(model.getSnapshot().viewport, "narrow");
  model.resetAll();
  assert.equal(model.getSnapshot().instances.length, 0);
  assert.equal(model.getSnapshot().selectedId, null);
  assert.throws(() => model.setViewport("tablet"), /Viewport/);
  model.destroy();
  assert.throws(() => model.createInstance({ widget: "alerts" }), /destroyed/);
});
