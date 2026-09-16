import test from "node:test";
import assert from "node:assert/strict";
import { createCatalogRegistry } from "../sites/staging/shared/widget-catalog.mjs";
import {
  CONSOLE_SANDBOX_LAYOUT_UNITS,
  CONSOLE_SANDBOX_VIEWPORTS,
  createConsoleSandboxModel,
  resolveConsoleSandboxLayout,
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
  assert.deepEqual(sky.layout, { mode: "square", shape: "square", unit: "percent", width: 100, height: 100, valid: true, error: null });

  const invalid = model.createInstance({
    widget: "sky",
    layout: { mode: "square", width: 400, height: 401 },
  });
  assert.equal(invalid.layout.unit, "px");
  assert.equal(invalid.state, "invalid");
  assert.match(invalid.error, /square/);

  const oriented = model.createInstance({ widget: "alerts", layout: { mode: "vertical", width: 320, height: 640 } });
  assert.equal(oriented.layout.valid, true);
  assert.equal(oriented.config.orientation, "vertical");
});

test("Console Sandbox exposes compatible labelled drop zones and converts orientation deterministically", () => {
  const model = createConsoleSandboxModel({ registry: createCatalogRegistry() });
  assert.deepEqual(model.getDropZones().map(zone => zone.id), ["horizontal", "vertical", "square"]);
  const weather = model.createInstance({ widget: "weather", config: { profile: "visual" }, zoneId: "horizontal", layout: { unit: "px", width: 640, height: 360 } });
  const originalConfig = weather.config;
  const moved = model.dropInstance(weather.id, "vertical");
  assert.equal(moved.id, weather.id);
  assert.equal(moved.zoneId, "vertical");
  assert.deepEqual(moved.layout, { mode: "vertical", shape: "oriented", unit: "px", width: 360, height: 640, valid: true, error: null });
  assert.equal(moved.config.profile, "visual");
  assert.notEqual(moved.config, originalConfig);
  assert.equal(moved.config.orientation, "vertical");
  assert.equal(model.getSnapshot().zones.find(zone => zone.id === "horizontal").empty, true);
  assert.deepEqual(model.getSnapshot().zones.find(zone => zone.id === "vertical").instanceIds, [weather.id]);
});

test("Console Sandbox rejects incompatible drops without mutating source state", () => {
  const model = createConsoleSandboxModel({ registry: createCatalogRegistry() });
  const sky = model.addToZone("sky", "square");
  const before = model.getInstance(sky.id);
  assert.throws(() => model.dropInstance(sky.id, "horizontal"), error => {
    assert.equal(error.code, "CONSOLE_SANDBOX_INVALID_DROP");
    assert.match(error.reason, /Sky can only be placed/);
    return true;
  });
  assert.deepEqual(model.getInstance(sky.id), before);
  assert.throws(() => model.addToZone("weather", "square"), /Only square widgets/);
});

test("Console Sandbox updates configuration/layout and preserves selection", () => {
  const model = createConsoleSandboxModel({ registry: createCatalogRegistry() });
  const instance = model.createInstance({ widget: "events", layout: { mode: "horizontal", unit: "px", width: 640, height: 360 } });
  const updated = model.updateInstance(instance.id, {
    config: { timeRange: "all" },
    layout: { mode: "vertical", width: 320, height: 640 },
  });
  assert.equal(updated.id, instance.id);
  assert.equal(updated.config.timeRange, "all");
  assert.equal(updated.config.orientation, "vertical");
  assert.equal(updated.layout.unit, "px");
  assert.deepEqual(model.getSnapshot().selectedId, instance.id);
});

test("Console Sandbox validates both size units and resolves percentages against the card", () => {
  const model = createConsoleSandboxModel({ registry: createCatalogRegistry() });
  assert.deepEqual(CONSOLE_SANDBOX_LAYOUT_UNITS, ["percent", "px"]);
  const weather = model.createInstance({ widget: "weather", layout: { unit: "percent", mode: "horizontal", width: 70, height: 40 } });
  assert.equal(weather.layout.valid, true);
  assert.deepEqual(resolveConsoleSandboxLayout(weather.layout, { width: 500, height: 281 }), {
    unit: "percent",
    width: 350,
    height: 112,
  });
  assert.throws(() => model.updateInstance(weather.id, { layout: { unit: "percent", mode: "horizontal", width: 40, height: 70 } }), /Horizontal widgets/);
  const sky = model.createInstance({ widget: "sky", layout: { unit: "percent", width: 100, height: 100 } });
  assert.deepEqual(resolveConsoleSandboxLayout(sky.layout, { width: 318, height: 178 }), {
    unit: "percent",
    width: 318,
    height: 318,
  });
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
  assert.deepEqual(CONSOLE_SANDBOX_VIEWPORTS, ["desktop", "mobile"]);
  const instance = model.createInstance({
    widget: "alerts",
    config: { profile: "visual" },
    layout: { mode: "vertical", unit: "px", width: 320, height: 640 },
  });
  const before = model.getSnapshot();
  model.setViewport("mobile");
  const after = model.getSnapshot();
  assert.equal(after.viewport, "mobile");
  assert.deepEqual(after.instances, before.instances);
  assert.equal(after.selectedId, instance.id);
  model.resetAll();
  assert.equal(model.getSnapshot().instances.length, 0);
  assert.equal(model.getSnapshot().selectedId, null);
  assert.throws(() => model.setViewport("narrow"), /Viewport/);
  model.destroy();
  assert.throws(() => model.createInstance({ widget: "alerts" }), /destroyed/);
});
