import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createWidgetRegistry } from "../sites/staging/shared/widget-registry.mjs";
import { widgetCatalog } from "../sites/staging/shared/widget-catalog.mjs";
import { createNebulacast } from "../sites/staging/shared/widget-runtime.mjs";
import { createFakeContext, createFakeDefinition, createFakeRoot } from "./fixtures/widget-runtime-fixture.mjs";

function createRuntime(definitions) {
  return createNebulacast({
    context: createFakeContext({ observer: { name: "Test" }, time: { mode: "live" } }),
    registry: createWidgetRegistry(definitions),
  });
}

test("catalog exposes Phase 1 platform adapter definitions", async () => {
  assert.deepEqual(widgetCatalog.map(definition => definition.type), ["astro", "sun-moon", "weather", "map", "location", "sky", "news", "events", "alerts"]);
  assert.equal(typeof widgetCatalog[0].loader, "function");
  assert.equal(widgetCatalog[0].capabilities.multiInstance, true);
  assert.equal(widgetCatalog[1].capabilities.multiInstance, true);
  const weather = widgetCatalog.find(definition => definition.type === "weather");
  assert.deepEqual(weather.capabilities, {
    observerAware: true,
    timeAware: true,
    multiInstance: true,
    embed: true,
  });
  const map = widgetCatalog.find(definition => definition.type === "map");
  assert.ok(map);
  assert.deepEqual(map.capabilities, {
    observerAware: true,
    timeAware: true,
    multiInstance: true,
    embed: true,
  });
  const [astroModule, sunMoonModule, weatherModule, mapModule] = await Promise.all([
    widgetCatalog[0].loader(),
    widgetCatalog[1].loader(),
    weather.loader(),
    map.loader(),
  ]);
  assert.equal(typeof astroModule.mount, "function");
  assert.equal(typeof sunMoonModule.mount, "function");
  assert.equal(typeof weatherModule.mount, "function");
  assert.equal(typeof mapModule.mount, "function");
  assert.notStrictEqual(astroModule, sunMoonModule);
  const location = widgetCatalog.find(definition => definition.type === "location");
  assert.equal(typeof location.loader, "function");
  assert.deepEqual(location.capabilities, {
    observerAware: true,
    timeAware: false,
    multiInstance: true,
    embed: true,
  });
  const sky = widgetCatalog.find(definition => definition.type === "sky");
  assert.ok(sky);
  assert.deepEqual(sky.capabilities, {
    observerAware: true,
    timeAware: true,
    multiInstance: true,
  });
  const skyModule = await sky.loader();
  assert.equal(typeof skyModule.mount, "function");
  const news = widgetCatalog.find(definition => definition.type === "news");
  const events = widgetCatalog.find(definition => definition.type === "events");
  assert.equal(widgetCatalog.filter(definition => definition.type === "news").length, 1);
  assert.equal(widgetCatalog.filter(definition => definition.type === "events").length, 1);
  assert.deepEqual(news.capabilities, { observerAware: false, timeAware: false, multiInstance: true });
  assert.deepEqual(events.capabilities, { observerAware: false, timeAware: false, multiInstance: true });
  assert.equal(typeof news.loader, "function");
  assert.equal(typeof events.loader, "function");
  assert.equal(typeof (await news.loader()).mount, "function");
  assert.equal(typeof (await events.loader()).mount, "function");
});

test("mount creates the public instance shape, merges immutable config, and caches lazy loading", async () => {
  let loads = 0;
  const calls = [];
  const lifecycleCalls = [];
  const definition = createFakeDefinition({
    type: "fake",
    defaults: { orientation: "auto" },
    loader: async () => {
      loads += 1;
      return {
        mount(root, context, config) {
          calls.push({ root, context, config });
          return {
            update: value => lifecycleCalls.push(["update", value]),
            resize: value => lifecycleCalls.push(["resize", value]),
            refresh: () => lifecycleCalls.push(["refresh"]),
            destroy: () => lifecycleCalls.push(["destroy"]),
          };
        },
      };
    },
  });
  const context = createFakeContext();
  const runtime = createNebulacast({ context, registry: createWidgetRegistry([definition]) });
  const firstRoot = createFakeRoot("one");
  const secondRoot = createFakeRoot("two");

  const first = await runtime.mount(firstRoot, { widget: "fake", config: { orientation: "vertical" } });
  const second = await runtime.mount(secondRoot, { widget: "fake" });

  assert.deepEqual(Object.keys(first).sort(), ["config", "destroy", "id", "refresh", "resize", "root", "type", "update"]);
  assert.equal(first.type, "fake");
  assert.strictEqual(first.root, firstRoot);
  assert.equal(first.config.orientation, "vertical");
  assert.equal(Object.isFrozen(first.config), true);
  assert.equal(loads, 1);
  assert.strictEqual(calls[0].context, context);
  first.update({ changed: true });
  first.resize(320);
  first.refresh();
  runtime.unmount(firstRoot);
  assert.deepEqual(lifecycleCalls.map(call => call[0]), ["update", "resize", "refresh", "destroy"]);
  assert.equal(second.type, "fake");
});

test("mounts with common host metadata and permits destroy then remount", async () => {
  const runtime = createNebulacast({
    context: createFakeContext(),
    registry: createWidgetRegistry([createFakeDefinition({
      loader: async () => ({ mount: () => () => {} }),
    })]),
    resolveAutoOrientation: ({ root }) => root.name === "first" ? "horizontal" : "vertical",
  });
  const root = createFakeRoot("first");

  const first = await runtime.mount(root, {
    widget: "fake",
    config: { orientation: "auto", theme: "dark", density: "compact" },
  });
  assert.equal(first.config.orientation, "horizontal");
  assert.equal(root.getAttribute("data-nc-state"), "ready");
  first.destroy();
  assert.equal(root.getAttribute("data-nc-widget"), null);

  const second = await runtime.mount(root, { widget: "fake", config: { orientation: "auto" } });
  assert.equal(second.config.orientation, "horizontal");
  assert.notEqual(second.id, first.id);
  second.destroy();
});

test("supports two simultaneous instances of one type with independent config, state, and style metadata", async () => {
  const runtime = createNebulacast({
    context: createFakeContext(),
    registry: createWidgetRegistry([createFakeDefinition({
      loader: async () => ({
        mount(_root, _context, _config, host) {
          return {
            update(patch = {}) {
              if (patch.state !== undefined) host.setState(patch.state);
            },
            destroy() {},
          };
        },
      }),
    })]),
  });
  const firstRoot = createFakeRoot("same-type-one");
  const secondRoot = createFakeRoot("same-type-two");
  const first = await runtime.mount(firstRoot, {
    widget: "fake",
    config: { orientation: "horizontal", theme: "dark", density: "compact" },
  });
  const second = await runtime.mount(secondRoot, {
    widget: "fake",
    config: { orientation: "vertical", theme: "light", density: "comfortable" },
  });

  assert.notEqual(first.id, second.id);
  assert.equal(firstRoot.getAttribute("data-nc-orientation"), "horizontal");
  assert.equal(firstRoot.getAttribute("data-nc-theme"), "dark");
  assert.equal(firstRoot.getAttribute("data-nc-density"), "compact");
  assert.equal(secondRoot.getAttribute("data-nc-orientation"), "vertical");
  assert.equal(secondRoot.getAttribute("data-nc-theme"), "light");
  assert.equal(secondRoot.getAttribute("data-nc-density"), "comfortable");

  first.update({ state: "empty" });
  second.update({ state: "degraded" });
  assert.equal(firstRoot.getAttribute("data-nc-state"), "empty");
  assert.equal(secondRoot.getAttribute("data-nc-state"), "degraded");
  first.destroy();
  assert.equal(firstRoot.getAttribute("data-nc-widget"), null);
  assert.equal(secondRoot.getAttribute("data-nc-widget"), "fake");
  assert.equal(secondRoot.getAttribute("data-nc-state"), "degraded");
  second.destroy();
});

test("normalizes a disposer-only mount result and makes destroy idempotent", async () => {
  let disposed = 0;
  const runtime = createRuntime([createFakeDefinition({
    loader: async () => ({ mount: () => () => { disposed += 1; } }),
  })]);
  const root = createFakeRoot("disposer");
  const instance = await runtime.mount(root, { widget: "fake" });
  instance.destroy();
  instance.destroy();
  assert.equal(disposed, 1);
  assert.equal(runtime.unmount(root), undefined);
});

test("rejects concurrent duplicate mounts before the first loader resolves", async () => {
  let resolveLoader;
  const loader = () => new Promise(resolve => { resolveLoader = resolve; });
  const runtime = createRuntime([createFakeDefinition({ loader })]);
  const root = createFakeRoot("concurrent");
  const first = runtime.mount(root, { widget: "fake" });
  await assert.rejects(runtime.mount(root, { widget: "fake" }), /already mounted/);

  resolveLoader({ mount: () => () => {} });
  const instance = await first;
  assert.equal(instance.root, root);
  instance.destroy();
  assert.equal(runtime.unmount(root), undefined);
});

test("releases a root reservation after loader failure so a retry can mount", async () => {
  let attempts = 0;
  const runtime = createRuntime([createFakeDefinition({
    loader: async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("loader failed");
      return { mount: () => () => {} };
    },
  })]);
  const root = createFakeRoot("retry");

  await assert.rejects(runtime.mount(root, { widget: "fake" }), /loader failed/);
  const instance = await runtime.mount(root, { widget: "fake" });
  assert.equal(instance.root, root);
  instance.destroy();
});

test("rejects unknown types and arbitrary mount functions", async () => {
  const runtime = createRuntime([]);
  await assert.rejects(runtime.mount(createFakeRoot("unknown"), { widget: "missing" }), /Unknown widget type/);
  assert.throws(() => createWidgetRegistry([createFakeDefinition({
    loader: async () => ({ mount() {} }),
    mount: () => {},
  })]), /arbitrary mount function/);

  const definition = createFakeDefinition({ loader: async () => ({ mount() {} }) });
  const runtimeWithDefinition = createRuntime([definition]);
  await assert.rejects(
    runtimeWithDefinition.mount(createFakeRoot("spec-mount"), { widget: "fake", mount: () => {} }),
    /arbitrary mount function/,
  );
  await assert.rejects(
    runtimeWithDefinition.mount(createFakeRoot("config-mount"), { widget: "fake", config: { mount: () => {} } }),
    /arbitrary mount function/,
  );
});

test("isolates a sibling mount error", async () => {
  let goodDestroyed = 0;
  const good = createFakeDefinition({
    type: "good",
    loader: async () => ({ mount: () => ({ destroy: () => { goodDestroyed += 1; } }) }),
  });
  const bad = createFakeDefinition({
    type: "bad",
    loader: async () => ({ mount: () => { throw new Error("bad sibling"); } }),
  });
  const runtime = createRuntime([good, bad]);
  const goodRoot = createFakeRoot("good");
  const goodInstance = await runtime.mount(goodRoot, { widget: "good" });
  await assert.rejects(runtime.mount(createFakeRoot("bad"), { widget: "bad" }), /bad sibling/);
  assert.equal(goodInstance.type, "good");
  runtime.unmount(goodRoot);
  assert.equal(goodDestroyed, 1);
});

test("runtime contains no polling, network, or domain-rendering behavior", async () => {
  const source = await readFile(new URL("../sites/staging/shared/widget-runtime.mjs", import.meta.url), "utf8");
  for (const forbidden of ["setInterval", "setTimeout", "fetch(", "innerHTML", "document.", "window."]) {
    assert.doesNotMatch(source, new RegExp(forbidden.replace("(", "\\(")));
  }
});
