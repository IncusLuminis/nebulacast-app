import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createNebulacast } from "../sites/staging/shared/widget-runtime.mjs";
import { createWidgetRegistry } from "../sites/staging/shared/widget-registry.mjs";
import { widgetCatalog } from "../sites/staging/shared/widget-catalog.mjs";
import {
  createMapContext,
  createMapRoot,
  createMapWindow,
  flush,
  installMapGlobals,
} from "./fixtures/map-platform-fixture.mjs";

const mapDefinition = widgetCatalog.find(definition => definition.type === "map");

function createMapRuntime(context, { loader = mapDefinition?.loader } = {}) {
  return createNebulacast({
    context,
    registry: createWidgetRegistry([{ ...mapDefinition, loader }]),
  });
}

function lastLocationMessage(root) {
  const messages = root.getPostedMessages();
  return messages.filter(entry => entry.message.type === "update-location").at(-1);
}

test("catalog registers exactly one lazy Map path backed by the real adapter", async () => {
  assert.ok(mapDefinition);
  assert.equal(widgetCatalog.filter(definition => definition.type === "map").length, 1);
  assert.deepEqual(mapDefinition.defaults, {
    orientation: "auto",
    theme: "inherit",
    density: "normal",
  });
  assert.deepEqual(mapDefinition.capabilities, {
    observerAware: true,
    timeAware: true,
    multiInstance: true,
    embed: true,
  });
  assert.equal(typeof mapDefinition.loader, "function");

  const adapter = await mapDefinition.loader();
  assert.equal(typeof adapter.mount, "function");

  const catalogSource = await readFile(new URL("../sites/staging/shared/widget-catalog.mjs", import.meta.url), "utf8");
  const adapterSource = await readFile(new URL("../sites/staging/weather/widgets/map/platform-adapter.mjs", import.meta.url), "utf8");
  assert.equal((catalogSource.match(/widgets\/map\/platform-adapter\.mjs/g) || []).length, 1);
  assert.match(adapterSource, /import\(`\.\/map\.js\?platform-instance=\$\{instance\}`\)/);
  assert.doesNotMatch(catalogSource, /map2\.js/);
  assert.doesNotMatch(adapterSource, /map2\.js/);
});

test("real Runtime and catalog Map adapter isolate two loaded iframe instances", async t => {
  const globals = installMapGlobals(createMapWindow());
  t.after(() => globals.restore());

  const context = createMapContext({
    observer: { name: "Warsaw", lat: 52.2297, lon: 21.0122 },
  });
  const firstRoot = createMapRoot("map-one");
  const secondRoot = createMapRoot("map-two");
  let loads = 0;
  const runtime = createMapRuntime(context, {
    loader: () => {
      loads += 1;
      return mapDefinition.loader();
    },
  });
  assert.equal(loads, 0);
  const first = await runtime.mount(firstRoot, {
    widget: "map",
    config: { orientation: "horizontal", theme: "dark", density: "compact", profile: "visual" },
  });
  const second = await runtime.mount(secondRoot, {
    widget: "map",
    config: { orientation: "vertical", theme: "light", density: "comfortable", profile: "planetary" },
  });
  assert.equal(loads, 1);

  assert.deepEqual(Object.keys(first).sort(), ["config", "destroy", "id", "refresh", "resize", "root", "type", "update"]);
  for (const method of ["update", "resize", "refresh", "destroy"]) {
    assert.equal(typeof first[method], "function");
    assert.equal(typeof second[method], "function");
  }
  assert.notEqual(first.id, second.id);
  assert.strictEqual(first.root, firstRoot);
  assert.strictEqual(second.root, secondRoot);
  assert.equal(first.config.profile, "visual");
  assert.equal(second.config.profile, "planetary");
  assert.equal(firstRoot.getAttribute("data-nc-orientation"), "horizontal");
  assert.equal(secondRoot.getAttribute("data-nc-orientation"), "vertical");
  assert.notStrictEqual(firstRoot.getIframe(), secondRoot.getIframe());
  assert.equal(firstRoot.getIframe().getAttribute("src"), "./map-poc.html");
  assert.equal(secondRoot.getIframe().getAttribute("src"), "./map-poc.html");
  assert.equal(firstRoot.getPostedMessages().length, 0);
  assert.equal(secondRoot.getPostedMessages().length, 0);

  firstRoot.getIframe().triggerLoad();
  assert.deepEqual(lastLocationMessage(firstRoot), {
    message: {
      type: "update-location",
      location: { name: "Warsaw", lat: 52.2297, lon: 21.0122 },
    },
    targetOrigin: "*",
  });
  assert.equal(secondRoot.getPostedMessages().length, 0);

  secondRoot.getIframe().triggerLoad();
  assert.deepEqual(lastLocationMessage(secondRoot), lastLocationMessage(firstRoot));
  assert.equal(globals.window.listenerCount("message"), 2);

  context.update({ observer: {
    name: "Prague", lat: 50.0755, lon: 14.4378, timezone: "Europe/Prague",
  } });
  await flush();
  assert.deepEqual(lastLocationMessage(firstRoot).message.location, {
    name: "Prague", lat: 50.0755, lon: 14.4378,
  });
  assert.deepEqual(lastLocationMessage(secondRoot).message.location, {
    name: "Prague", lat: 50.0755, lon: 14.4378,
  });

  first.update({ profile: "balanced" });
  first.resize({ width: 320, height: 180 });
  first.refresh();
  assert.equal(first.config.profile, "balanced");
  assert.equal(second.config.profile, "planetary");

  const firstMessageCount = firstRoot.getPostedMessages().length;
  first.destroy();
  first.destroy();
  assert.equal(firstRoot.getAttribute("data-nc-widget"), null);
  assert.equal(globals.window.listenerCount("message"), 1);
  context.update({ observer: {
    name: "Gdansk", lat: 54.352, lon: 18.6466, timezone: "Europe/Warsaw",
  } });
  assert.equal(firstRoot.getPostedMessages().length, firstMessageCount);
  assert.deepEqual(lastLocationMessage(secondRoot).message.location, {
    name: "Gdansk", lat: 54.352, lon: 18.6466,
  });

  const remounted = await runtime.mount(firstRoot, {
    widget: "map",
    config: { orientation: "horizontal", theme: "dark", density: "compact", profile: "remounted" },
  });
  assert.notEqual(remounted.id, first.id);
  assert.notStrictEqual(remounted.root.getIframe(), second.root.getIframe());
  remounted.root.getIframe().triggerLoad();
  assert.deepEqual(lastLocationMessage(firstRoot).message.location, {
    name: "Gdansk", lat: 54.352, lon: 18.6466,
  });
  remounted.destroy();
  remounted.destroy();
  second.destroy();
  assert.equal(globals.window.listenerCount("message"), 0);
  assert.equal(secondRoot.getAttribute("data-nc-widget"), null);
});

test("weather map entrypoint and compatibility routes preserve the supported path", async () => {
  const mapPoc = await readFile(new URL("../sites/staging/weather/map-poc.html", import.meta.url), "utf8");
  const map1 = await readFile(new URL("../sites/staging/weather/map1.html", import.meta.url), "utf8");
  const standalone = await readFile(new URL("../sites/staging/map/index.html", import.meta.url), "utf8");

  assert.match(mapPoc, /addEventListener\("message"/);
  assert.match(mapPoc, /event\.data\.type === "update-location"/);
  assert.doesNotMatch(mapPoc, /http-equiv=["']refresh/i);
  assert.match(map1, /http-equiv="refresh"[^>]+map-poc\.html/);
  assert.match(map1, /target\.search\s*=\s*window\.location\.search/);
  assert.match(standalone, /src="\/weather\/map-poc\.html"/);
  assert.doesNotMatch(standalone, /map1\.html|map2\.js/);
});

test("Map adapter accepts an explicit compatibility URL for a Runtime-owned host", async t => {
  const globals = installMapGlobals(createMapWindow());
  t.after(() => globals.restore());
  const context = createMapContext({ observer: { name: "Warsaw", lat: 52.2297, lon: 21.0122 } });
  const root = createMapRoot("dashboard-map");
  const runtime = createMapRuntime(context);
  const instance = await runtime.mount(root, { widget: "map", config: { mapUrl: "/weather/map-poc.html" } });
  assert.equal(root.getIframe().getAttribute("src"), "/weather/map-poc.html");
  instance.destroy();
});
