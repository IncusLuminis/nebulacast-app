import test from "node:test";
import assert from "node:assert/strict";
import { createNebulacast } from "../sites/staging/shared/widget-runtime.mjs";
import { widgetCatalog } from "../sites/staging/shared/widget-catalog.mjs";
import { loadRankingJson } from "../sites/staging/sky/widgets/widget.utils.js";
import {
  createSkyBrowserFixture,
  createSkyContext,
  createSkyRoot,
  flush,
  installSkyBrowserGlobals,
} from "./fixtures/sky-platform-fixture.mjs";

const quietSkyOptions = {
  showGridAz: false,
  showGridEq: false,
  showConstellations: false,
  showMeridian: false,
  showEquator: false,
  showEcliptic: false,
  showMilkyWay: false,
  showObjects: false,
  showAlerts: false,
  showMessier: false,
  showSunMoon: false,
  showPlanets: false,
};
const quietSkyUI = { components: { sideToolbar: false, bottomToolbar: false, popover: false, modal: false, player: false } };

test("Sky catalog preserves root-sized layouts, canvas output, and text status", async () => {
  const baseUrl = "/sky-platform-layout-regression";
  const fixture = createSkyBrowserFixture();
  const restore = installSkyBrowserGlobals(fixture);
  const context = createSkyContext();
  const runtime = createNebulacast({
    context,
    resolveAutoOrientation: ({ root }) => root.clientWidth < 520 ? "vertical" : "horizontal",
  });
  const cases = [
    { name: "auto-wide", width: 720, height: 360, orientation: "auto", resolved: "horizontal" },
    { name: "auto-narrow", width: 360, height: 480, orientation: "auto", resolved: "vertical" },
    { name: "explicit-horizontal", width: 280, height: 480, orientation: "horizontal", resolved: "horizontal" },
    { name: "explicit-vertical", width: 720, height: 300, orientation: "vertical", resolved: "vertical" },
  ];
  const instances = [];

  try {
    for (const scenario of cases) {
      const root = createSkyRoot(scenario.name, scenario, fixture.document);
      const instance = await runtime.mount(root, {
        widget: "sky",
        config: { baseUrl, orientation: scenario.orientation, options: quietSkyOptions, ui: quietSkyUI },
      });
      instances.push({ instance, root });

      const canvas = root.querySelector("canvas.sky-canvas");
      assert.equal(instance.config.orientation, scenario.resolved);
      assert.equal(root.getAttribute("data-nc-orientation"), scenario.resolved);
      assert.equal(canvas.width, scenario.width);
      assert.equal(canvas.height, scenario.height);
      assert.match(root.querySelector(".sky-status").textContent, /stars 0/);

      root.clientWidth = 400;
      root.clientHeight = 260;
      instance.resize();
      assert.equal(canvas.width, 400);
      assert.equal(canvas.height, 260);
    }
  } finally {
    for (const { instance } of instances) instance.destroy();
    restore();
  }
});

test("Sky catalog and ranking loader retain the registered data path", async () => {
  const definition = widgetCatalog.find(entry => entry.type === "sky");
  assert.ok(definition);
  assert.deepEqual(definition.defaults, { orientation: "auto", theme: "inherit", density: "normal" });
  assert.deepEqual(definition.supportedOptions.orientation, ["auto", "horizontal", "vertical"]);
  assert.deepEqual(definition.capabilities, { observerAware: true, timeAware: true, multiInstance: true });
  assert.equal(definition.galleryPreview, false);

  const baseUrl = "/sky-platform-ranking-regression";
  const fixture = createSkyBrowserFixture({
    [`${baseUrl}/data/ranking.json`]: {
      items: [
        { id: "first", group: "dso", score: 900 },
        { id: "second", group: "planets", score: 800 },
      ],
    },
  });
  const restore = installSkyBrowserGlobals(fixture);
  try {
    const ranking = await loadRankingJson(baseUrl);
    assert.deepEqual(ranking.items.map(item => item.id), ["first", "second"]);
  } finally {
    restore();
  }
});

test("Sky Runtime mounts two roots without legacy globals and cleans up for remount", async () => {
  const fixture = createSkyBrowserFixture();
  const restore = installSkyBrowserGlobals(fixture);
  Object.defineProperties(fixture.window, {
    SKY_CONFIG: { configurable: true, get() { throw new Error("Runtime read SKY_CONFIG"); } },
    __skyWidget: {
      configurable: true,
      get() { throw new Error("Runtime read __skyWidget"); },
      set() { throw new Error("Runtime write __skyWidget"); },
    },
  });

  const firstRoot = createSkyRoot("wide", { width: 720, height: 480 }, fixture.document);
  const secondRoot = createSkyRoot("narrow", { width: 360, height: 480 }, fixture.document);
  const firstContext = createSkyContext();
  const secondContext = createSkyContext({ observer: { name: "Boston", lat: 42.36, lon: -71.06 } });
  const runtime = createNebulacast({
    context: firstContext,
    resolveAutoOrientation: ({ root }) => root.clientWidth < 520 ? "vertical" : "horizontal",
  });
  const secondRuntime = createNebulacast({
    context: secondContext,
    resolveAutoOrientation: ({ root }) => root.clientWidth < 520 ? "vertical" : "horizontal",
  });

  let first;
  let second;
  try {
    [first, second] = await Promise.all([
      runtime.mount(firstRoot, { widget: "sky", config: { orientation: "auto", options: quietSkyOptions, ui: quietSkyUI } }),
      secondRuntime.mount(secondRoot, { widget: "sky", config: { orientation: "vertical", options: quietSkyOptions, ui: quietSkyUI } }),
    ]);
    await flush();

    assert.equal(first.config.orientation, "horizontal");
    assert.equal(second.config.orientation, "vertical");
    assert.equal(firstRoot.getAttribute("data-nc-orientation"), "horizontal");
    assert.equal(secondRoot.getAttribute("data-nc-orientation"), "vertical");
    assert.ok(firstRoot.querySelector(".sky-root"));
    assert.ok(secondRoot.querySelector("canvas.sky-canvas"));
    assert.equal(fixture.document.body.children.length, 0);
    assert.equal(fixture.document.head.children.length, 0);
    assert.equal(firstContext.listenerCount(), 1);
    assert.equal(secondContext.listenerCount(), 1);

    firstContext.update({
      observer: { name: "Krakow", lat: 50.0647, lon: 19.945 },
      time: { datetimeISO: "2026-09-09T19:00:00Z" },
    });
    const status = firstRoot.querySelector(".sky-status");
    assert.match(status.textContent, /lat 50\.06°/);
    assert.match(status.textContent, /2026-09-09 21:00/);

    first.update({ orientation: "vertical" });
    first.resize({ width: 320, height: 480 });
    first.refresh();
    assert.equal(firstRoot.getAttribute("data-nc-orientation"), "vertical");

    const firstId = first.id;
    first.destroy();
    first.destroy();
    assert.equal(firstRoot.querySelector(".sky-root"), null);
    assert.equal(firstContext.listenerCount(), 0);
    assert.equal(secondRoot.getAttribute("data-nc-widget"), "sky");

    const remounted = await runtime.mount(firstRoot, {
      widget: "sky",
      config: { orientation: "horizontal", options: quietSkyOptions, ui: quietSkyUI },
    });
    assert.notEqual(remounted.id, firstId);
    assert.equal(firstRoot.querySelector(".sky-root") !== null, true);
    assert.equal(firstContext.listenerCount(), 1);
    remounted.destroy();
    second.destroy();
    assert.equal(firstContext.listenerCount(), 0);
    assert.equal(secondContext.listenerCount(), 0);
  } finally {
    first?.destroy();
    second?.destroy();
    restore();
  }
});

test("Sky platform highlight is instance-local and does not consult the legacy matcher", async () => {
  const baseUrl = "/sky-platform-highlight-test";
  const fixture = createSkyBrowserFixture({
    [`${baseUrl}/data/objects_today.json`]: {
      items: [{
        id: "target",
        group: "dso",
        name_en: "Target",
        ra_deg: 0,
        dec_deg: 89,
        mag: 1,
      }],
    },
    [`${baseUrl}/data/ranking.json`]: { items: [] },
  });
  const restore = installSkyBrowserGlobals(fixture);
  let legacyMatcherCalls = 0;
  fixture.window.__skyIsHighlighted = () => {
    legacyMatcherCalls += 1;
    throw new Error("platform render must not use the legacy highlight matcher");
  };

  const root = createSkyRoot("highlight", { width: 640, height: 480 }, fixture.document);
  const context = createSkyContext();
  const runtime = createNebulacast({ context });
  const options = {
    ...quietSkyOptions,
    showObjects: true,
    maxObjects: 8,
    minAltObjectsDeg: 0,
  };
  let instance;
  try {
    instance = await runtime.mount(root, {
      widget: "sky",
      config: {
        baseUrl,
        options,
        ui: quietSkyUI,
      },
    });

    instance.update({ ui: { highlightId: "dso:target", highlightMs: 5000 } });

    assert.equal(legacyMatcherCalls, 0);
    assert.ok(fixture.canvasOperations.includes("highlight-stroke"));
  } finally {
    instance?.destroy();
    restore();
  }
});

test("Sky destroy cancels deferred fullscreen resize and player sync work", async () => {
  const fixture = createSkyBrowserFixture();
  class TestPlayer extends fixture.HTMLElement {
    setPlaying() {}
    setTime() {}
  }
  fixture.customElements.define("ui-player", TestPlayer);

  const pendingRafs = new Set();
  let cancelledRafs = 0;
  const requestAnimationFrame = fixture.window.requestAnimationFrame;
  const cancelAnimationFrame = fixture.window.cancelAnimationFrame;
  fixture.window.requestAnimationFrame = callback => {
    const id = requestAnimationFrame(callback);
    pendingRafs.add(id);
    return id;
  };
  fixture.window.cancelAnimationFrame = id => {
    if (pendingRafs.delete(id)) cancelledRafs += 1;
    return cancelAnimationFrame(id);
  };

  const realSetTimeout = globalThis.setTimeout;
  const realClearTimeout = globalThis.clearTimeout;
  const fullscreenTimers = new Set();
  let cancelledFullscreenTimers = 0;
  globalThis.setTimeout = (callback, delay, ...args) => {
    const id = realSetTimeout(callback, delay, ...args);
    if (delay === 100) fullscreenTimers.add(id);
    return id;
  };
  globalThis.clearTimeout = id => {
    if (fullscreenTimers.delete(id)) cancelledFullscreenTimers += 1;
    return realClearTimeout(id);
  };

  const restore = installSkyBrowserGlobals(fixture);
  const root = createSkyRoot("lifecycle", { width: 640, height: 480 }, fixture.document);
  const context = createSkyContext();
  const runtime = createNebulacast({ context });
  let instance;
  try {
    instance = await runtime.mount(root, {
      widget: "sky",
      config: {
        options: quietSkyOptions,
        ui: { components: { sideToolbar: false, bottomToolbar: false, popover: false, modal: false, player: true } },
      },
    });

    fixture.document.fullscreenElement = root;
    fixture.document.dispatchEvent({ type: "fullscreenchange" });
    assert.equal(fullscreenTimers.size, 1);
    assert.equal(pendingRafs.size, 1);

    instance.destroy();
    instance.destroy();

    assert.equal(cancelledFullscreenTimers, 1);
    assert.equal(cancelledRafs, 1);
    assert.equal(pendingRafs.size, 0);
    assert.equal(root.querySelector(".sky-root"), null);
  } finally {
    instance?.destroy();
    restore();
    globalThis.setTimeout = realSetTimeout;
    globalThis.clearTimeout = realClearTimeout;
  }
});

test("Sky repeated remount keeps context subscriptions and root-owned output isolated", async () => {
  const fixture = createSkyBrowserFixture();
  const restore = installSkyBrowserGlobals(fixture);
  const root = createSkyRoot("repeated-remount", { width: 640, height: 360 }, fixture.document);
  const context = createSkyContext();
  const runtime = createNebulacast({ context });
  const ids = new Set();

  try {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const instance = await runtime.mount(root, {
        widget: "sky",
        config: { orientation: "horizontal", options: quietSkyOptions, ui: quietSkyUI },
      });
      ids.add(instance.id);
      assert.equal(context.listenerCount(), 1);
      assert.ok(root.querySelector("canvas.sky-canvas"));

      context.update({ observer: { name: `Remount ${attempt}`, lat: 40 + attempt, lon: 20 + attempt } });
      assert.match(root.querySelector(".sky-status").textContent, new RegExp(`lat ${(40 + attempt).toFixed(2)}°`));

      instance.destroy();
      instance.destroy();
      assert.equal(context.listenerCount(), 0);
      assert.equal(root.querySelector(".sky-root"), null);
    }
  } finally {
    runtime.unmount(root)?.destroy();
    restore();
  }

  assert.equal(ids.size, 3);
});
