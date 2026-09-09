import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import {
  createResizeObserverMock,
  createWeatherBrowserFixture,
  createWeatherContext,
  createWeatherFetchMock,
  createWeatherPayload,
  createWeatherRoot,
} from "./fixtures/weather-platform-fixture.mjs";

let widgetCatalog;
let createNebulacast;
let sharedFixture;

function installBrowserGlobals(fixture) {
  sharedFixture = fixture;
  Object.assign(globalThis, {
    window: fixture.window,
    document: fixture.document,
    localStorage: fixture.localStorage,
    fetch: fixture.fetch,
    ResizeObserver: fixture.ResizeObserver,
  });
}

function makeRuntime(context) {
  return createNebulacast({
    context,
    resolveAutoOrientation: ({ root }) => root.clientWidth < 520 ? "vertical" : "horizontal",
  });
}

function waitForAsyncWork() {
  return new Promise(resolve => setTimeout(resolve, 25));
}

before(async () => {
  const fixture = createWeatherBrowserFixture({
    context: createWeatherContext({ observer: { lat: 0, lon: 0 } }),
    fetch: createWeatherFetchMock({ "/sky/data/sun_moon.json": { frames: [] } }),
  });
  installBrowserGlobals(fixture);
  ({ widgetCatalog } = await import("../sites/staging/shared/widget-catalog.mjs"));
  ({ createNebulacast } = await import("../sites/staging/shared/widget-runtime.mjs"));
});

after(() => {
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.localStorage;
  delete globalThis.fetch;
  delete globalThis.ResizeObserver;
});

test("catalog registers Weather as a lazy multi-instance platform widget", async () => {
  const definition = widgetCatalog.find(item => item.type === "weather");
  assert.ok(definition);
  assert.deepEqual(definition.capabilities, {
    observerAware: true,
    timeAware: true,
    multiInstance: true,
    embed: true,
  });
  assert.equal(typeof definition.loader, "function");
  const module = await definition.loader();
  assert.equal(typeof module.mount, "function");
});

test("two Weather instances keep explicit config, context, requests, orientation and lifecycle independent", async () => {
  const calls = [];
  const fetch = createWeatherFetchMock({
    "/sky/data/sun_moon.json": { frames: [] },
    "/api/astro-weather": url => {
      const parsed = new URL(url, "https://example.test");
      const payload = createWeatherPayload({
        lat: Number(parsed.searchParams.get("lat")),
        lon: Number(parsed.searchParams.get("lon")),
        name: parsed.searchParams.get("name"),
      });
      calls.push(parsed);
      return payload;
    },
  });
  const fixture = createWeatherBrowserFixture({ fetch });
  installBrowserGlobals(fixture);
  const firstContext = createWeatherContext({ observer: { name: "Warsaw", lat: 52.2297, lon: 21.0122 } });
  const secondContext = createWeatherContext({ observer: { name: "Boston", lat: 42.3601, lon: -71.0589 } });
  const firstRoot = createWeatherRoot("wide", { width: 720 }, fixture.document);
  const secondRoot = createWeatherRoot("narrow", { width: 360 }, fixture.document);
  const firstRuntime = makeRuntime(firstContext);
  const secondRuntime = makeRuntime(secondContext);

  const [first, second] = await Promise.all([
    firstRuntime.mount(firstRoot, { widget: "weather", config: { orientation: "auto", profile: "visual", range: "7d" } }),
    secondRuntime.mount(secondRoot, { widget: "weather", config: { orientation: "auto", profile: "planetary", range: "48h" } }),
  ]);
  await waitForAsyncWork();

  assert.equal(first.config.orientation, "horizontal");
  assert.equal(second.config.orientation, "vertical");
  assert.equal(first.config.profile, "visual");
  assert.equal(second.config.profile, "planetary");
  assert.equal(first.config.range, "7d");
  assert.equal(second.config.range, "48h");
  assert.equal(firstRoot.dataset.ncWeatherOrientation, "horizontal");
  assert.equal(secondRoot.dataset.ncWeatherOrientation, "vertical");
  const firstRootKeydownListeners = firstRoot.listenerCount("keydown");
  assert.equal(fixture.document.listenerCount("keydown"), 0);
  assert.equal(firstRoot.classList.contains("nc-weather-platform-horizontal"), true);
  assert.equal(secondRoot.classList.contains("nc-weather-platform-vertical"), true);
  assert.equal(fixture.document.listenerCount("DOMContentLoaded"), 0);
  assert.equal(fixture.document.listenerCount("keydown"), 0);
  assert.equal(fixture.document.listenerCount("click"), 0);
  assert.equal(fixture.window.listenerCount("resize"), 0);

  assert.equal(calls.length, 2);
  assert.deepEqual(calls.map(request => ({
    lat: request.searchParams.get("lat"),
    lon: request.searchParams.get("lon"),
    tz: request.searchParams.get("tz"),
    hours: request.searchParams.get("hours"),
    profile: request.searchParams.get("profile"),
    name: request.searchParams.get("name"),
  })), [
    { lat: "52.2297", lon: "21.0122", tz: "Europe/Warsaw", hours: "72", profile: "visual", name: "Warsaw" },
    { lat: "42.3601", lon: "-71.0589", tz: "Europe/Warsaw", hours: "72", profile: "planetary", name: "Boston" },
  ]);

  first.update({ profile: "balanced" });
  assert.equal(first.config.profile, "balanced");
  assert.equal(second.config.profile, "planetary");
  firstContext.update({ observer: { name: "Krakow", lat: 50.0647, lon: 19.945 } });
  await waitForAsyncWork();
  assert.equal(calls.some(request => request.searchParams.get("name") === "Krakow"), true);

  const observers = fixture.ResizeObserver.instances;
  assert.equal(observers.length, 2);
  first.destroy();
  first.destroy();
  assert.equal(observers[0].disconnected, true);
  assert.equal(observers[1].disconnected, false);
  assert.equal(secondRoot.getAttribute("data-nc-widget"), "weather");
  second.destroy();
  assert.equal(observers[1].disconnected, true);
  assert.equal(fixture.document.listenerCount("visibilitychange"), 0);
  assert.equal(fixture.document.listenerCount("DOMContentLoaded"), 0);
  assert.equal(fixture.document.listenerCount("keydown"), 0);
  assert.equal(fixture.document.listenerCount("click"), 0);
  assert.equal(fixture.window.listenerCount("resize"), 0);
  assert.equal(firstRoot.listenerCount("keydown"), 0);
  assert.equal(secondRoot.listenerCount("keydown"), 0);
});

test("platform ResizeObserver switches rendered layout and isolates transient storage", async t => {
  const fixture = createWeatherBrowserFixture({
    fetch: createWeatherFetchMock({ "/api/astro-weather": createWeatherPayload() }),
  });
  installBrowserGlobals(fixture);
  fixture.localStorage.setItem("nc-weather-vertical-tab", "observing");
  const firstRoot = createWeatherRoot("responsive-first", { width: 720 }, fixture.document);
  const secondRoot = createWeatherRoot("responsive-second", { width: 360 }, fixture.document);
  const firstRuntime = createNebulacast({ context: createWeatherContext() });
  const secondRuntime = createNebulacast({ context: createWeatherContext() });
  let first;
  let second;
  t.after(() => {
    first?.destroy();
    second?.destroy();
  });

  [first, second] = await Promise.all([
    firstRuntime.mount(firstRoot, { widget: "weather", config: { orientation: "auto" } }),
    secondRuntime.mount(secondRoot, { widget: "weather", config: { orientation: "auto" } }),
  ]);
  await waitForAsyncWork();

  assert.match(firstRoot.innerHTML, /class="card" id="poc-weather"/);
  assert.match(secondRoot.innerHTML, /class="card weather-vertical" id="poc-weather"/);
  assert.equal(firstRoot.dataset.ncWeatherOrientation, "horizontal");
  assert.equal(secondRoot.dataset.ncWeatherOrientation, "vertical");
  const firstRootKeydownListeners = firstRoot.listenerCount("keydown");
  const secondRootKeydownListeners = secondRoot.listenerCount("keydown");

  const firstTabs = firstRoot.querySelectorAll(".htab[data-hmode]");
  const secondTabs = secondRoot.querySelectorAll(".htab[data-hmode]");
  firstTabs[2].dispatchEvent({ type: "click", target: firstTabs[2] });
  assert.equal(firstTabs[2].getAttribute("data-active"), "true");
  assert.equal(secondTabs[0].getAttribute("data-active"), "true");
  assert.equal(secondTabs[2].getAttribute("data-active"), null);
  assert.equal(fixture.localStorage.getItem("nc-weather-vertical-tab"), "observing");

  const observer = fixture.ResizeObserver.instances[0];
  firstRoot.clientWidth = 360;
  observer.trigger(360);
  assert.match(firstRoot.innerHTML, /class="card weather-vertical" id="poc-weather"/);
  assert.equal(firstRoot.dataset.ncWeatherOrientation, "vertical");
  assert.equal(firstRoot.listenerCount("keydown"), firstRootKeydownListeners);
  assert.equal(secondRoot.dataset.ncWeatherOrientation, "vertical");
  assert.equal(secondRoot.listenerCount("keydown"), secondRootKeydownListeners);

  firstRoot.clientWidth = 720;
  observer.trigger(720);
  assert.match(firstRoot.innerHTML, /class="card" id="poc-weather"/);
  assert.doesNotMatch(firstRoot.innerHTML, /weather-vertical/);
  assert.equal(firstRoot.dataset.ncWeatherOrientation, "horizontal");
  assert.equal(firstRoot.listenerCount("keydown"), firstRootKeydownListeners);
  assert.equal(secondRoot.listenerCount("keydown"), secondRootKeydownListeners);

});

test("Weather aborts pending requests and permits destroy/remount", async () => {
  let aborted = 0;
  const pendingFetch = async (_url, options = {}) => await new Promise((_resolve, reject) => {
    const onAbort = () => {
      aborted += 1;
      const error = new Error("aborted");
      error.name = "AbortError";
      reject(error);
    };
    if (options.signal?.aborted) onAbort();
    else options.signal?.addEventListener("abort", onAbort, { once: true });
  });
  const fixture = createWeatherBrowserFixture({
    context: createWeatherContext({ observer: { name: "Pending", lat: 52.2297, lon: 21.0122 } }),
    fetch: pendingFetch,
  });
  installBrowserGlobals(fixture);
  const runtime = makeRuntime(fixture.context);
  const root = createWeatherRoot("pending", { width: 720 }, fixture.document);
  const instance = await runtime.mount(root, { widget: "weather", config: { orientation: "horizontal", profile: "balanced" } });
  instance.destroy();
  await waitForAsyncWork();
  assert.ok(aborted >= 1);
  assert.equal(fixture.ResizeObserver.instances[0].disconnected, true);

  const remounted = await runtime.mount(root, { widget: "weather", config: { orientation: "horizontal", profile: "balanced" } });
  remounted.destroy();
});

test("legacy mountWeather remains callable and disposer-compatible", async () => {
  const fixture = createWeatherBrowserFixture({
    context: createWeatherContext({ observer: { lat: 0, lon: 0 } }),
    fetch: createWeatherFetchMock({ "/sky/data/sun_moon.json": { frames: [] } }),
  });
  installBrowserGlobals(fixture);
  const { mountWeather } = await import("../sites/staging/weather/widgets/weather/weather.js");
  const root = createWeatherRoot("legacy", { width: 720 }, fixture.document);
  const storeApi = {
    getState: () => ({ location: { name: "Legacy", lat: 0, lon: 0, tz: "UTC" }, profile: "balanced" }),
    subscribe: () => () => {},
  };
  const dispose = mountWeather(root, storeApi, { layout: "default" });
  assert.equal(typeof dispose, "function");
  assert.equal(typeof dispose.unmount, "function");
  dispose();
  dispose();
  assert.equal(fixture.ResizeObserver.instances[0].disconnected, true);
});
