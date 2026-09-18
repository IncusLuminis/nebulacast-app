import test from "node:test";
import assert from "node:assert/strict";
import { createCatalogRegistry } from "../sites/staging/shared/widget-catalog.mjs";
import {
  createWidgetLabModel,
  validateWidgetLabLayout,
} from "../sites/staging/showcase/widget-lab-model.mjs";

function createRootFactory() {
  const roots = new Map();
  return {
    roots,
    rootForInstance(instance) {
      const root = roots.get(instance.id) || { id: instance.id };
      roots.set(instance.id, root);
      return root;
    },
  };
}

function createRuntime({ failures = new Set(), calls = [] } = {}) {
  let nextId = 0;
  return {
    calls,
    async mount(root, specification) {
      calls.push({ type: "mount", root, specification });
      if (failures.has(specification.widget)) throw new Error(`${specification.widget} failed`);
      let alive = true;
      const instance = {
        id: `runtime-${++nextId}`,
        async destroy() {
          if (!alive) return;
          alive = false;
          calls.push({ type: "destroy", root, id: instance.id });
        },
      };
      return instance;
    },
  };
}

test("Widget Lab validates square and strict oriented rectangles", () => {
  const registry = createCatalogRegistry();
  const sky = registry.get("sky");
  const weather = registry.get("weather");

  assert.deepEqual(validateWidgetLabLayout(sky, { mode: "square", width: 400, height: 400 }).valid, true);
  assert.match(validateWidgetLabLayout(sky, { mode: "horizontal", width: 400, height: 400 }).error, /Mode|square/);
  assert.match(validateWidgetLabLayout(sky, { mode: "square", width: 400, height: 401 }).error, /square/);
  assert.equal(validateWidgetLabLayout(weather, { mode: "horizontal", width: 600, height: 300 }).valid, true);
  assert.match(validateWidgetLabLayout(weather, { mode: "horizontal", width: 300, height: 300 }).error, /greater/);
  assert.match(validateWidgetLabLayout(weather, { mode: "vertical", width: 600, height: 300 }).error, /greater/);
});

test("Widget Lab keeps same-type instances isolated and remounts on update", async () => {
  const factory = createRootFactory();
  const runtime = createRuntime();
  const model = createWidgetLabModel({
    registry: createCatalogRegistry(),
    runtime,
    rootForInstance: factory.rootForInstance,
  });
  const first = model.createInstance({ widget: "weather", config: { profile: "balanced" }, layout: { mode: "horizontal", width: 600, height: 300 } });
  const second = model.createInstance({ widget: "weather", config: { profile: "visual" }, layout: { mode: "vertical", width: 300, height: 600 } });

  assert.notEqual(first.id, second.id);
  assert.equal(model.getSnapshot().selectedId, second.id);
  await model.openPreview(first.id);
  await model.openPreview(second.id);
  assert.equal(model.getInstance(first.id).state, "ready");
  assert.equal(model.getInstance(second.id).state, "ready");
  assert.equal(runtime.calls.filter(call => call.type === "mount").length, 2);
  assert.notEqual(runtime.calls[0].root, runtime.calls[1].root);
  assert.equal(model.getInstance(first.id).config.profile, "balanced");
  assert.equal(model.getInstance(second.id).config.profile, "visual");

  await model.update(first.id, { config: { profile: "broadband" }, layout: { width: 700, height: 320 } });
  assert.equal(model.getInstance(first.id).state, "ready");
  assert.equal(model.getInstance(first.id).config.profile, "broadband");
  assert.equal(model.getInstance(first.id).layout.width, 700);
  assert.equal(runtime.calls.filter(call => call.type === "destroy").length, 1);
  assert.equal(model.getInstance(second.id).state, "ready");
});

test("invalid layout never invokes Runtime and leaves a readable idle error", async () => {
  const factory = createRootFactory();
  const runtime = createRuntime();
  const model = createWidgetLabModel({ registry: createCatalogRegistry(), runtime, rootForInstance: factory.rootForInstance });
  const instance = model.createInstance({ widget: "sky", layout: { mode: "square", width: 400, height: 401 } });
  const result = await model.mount(instance.id);
  assert.equal(result.state, "idle");
  assert.equal(result.layout.valid, false);
  assert.match(result.error, /square/);
  assert.equal(runtime.calls.length, 0);
});

test("failed mounts stay local and retry can recover", async () => {
  const factory = createRootFactory();
  const failures = new Set(["alerts"]);
  const runtime = createRuntime({ failures });
  const model = createWidgetLabModel({ registry: createCatalogRegistry(), runtime, rootForInstance: factory.rootForInstance });
  const alerts = model.createInstance({ widget: "alerts", layout: { mode: "horizontal", width: 600, height: 300 } });
  const weather = model.createInstance({ widget: "weather", layout: { mode: "vertical", width: 300, height: 600 } });
  await model.openPreview(alerts.id);
  await model.openPreview(weather.id);
  assert.equal(model.getInstance(alerts.id).state, "error");
  assert.equal(model.getInstance(weather.id).state, "ready");
  failures.delete("alerts");
  await model.retry(alerts.id);
  assert.equal(model.getInstance(alerts.id).state, "ready");
});

test("destroy/reset invalidates a pending mount and destroys a late result", async () => {
  const factory = createRootFactory();
  let resolveMount;
  let lateDestroyCount = 0;
  const runtime = {
    async mount() {
      return new Promise(resolve => { resolveMount = resolve; });
    },
  };
  const model = createWidgetLabModel({ registry: createCatalogRegistry(), runtime, rootForInstance: factory.rootForInstance, timeoutMs: 1000 });
  const instance = model.createInstance({ widget: "weather", layout: { mode: "horizontal", width: 600, height: 300 } });
  const pending = model.openPreview(instance.id);
  await new Promise(resolve => setTimeout(resolve, 0));
  await model.destroyInstance(instance.id);
  assert.equal(model.getInstance(instance.id).state, "destroyed");
  resolveMount({ destroy() { lateDestroyCount += 1; } });
  await pending;
  assert.equal(lateDestroyCount, 1);
  await model.reset(instance.id);
  assert.equal(model.getInstance(instance.id), null);
});

test("hung mount becomes timeout without blocking reset-all", async () => {
  const factory = createRootFactory();
  const runtime = { mount: () => new Promise(() => {}) };
  const model = createWidgetLabModel({ registry: createCatalogRegistry(), runtime, rootForInstance: factory.rootForInstance, timeoutMs: 5 });
  model.createInstance({ widget: "weather", layout: { mode: "horizontal", width: 600, height: 300 } });
  const id = model.getSnapshot().selectedId;
  await model.openPreview(id);
  assert.equal(model.getInstance(id).state, "timeout");
  await model.resetAll();
  assert.equal(model.getInstances().size, 0);
});
