import test from "node:test";
import assert from "node:assert/strict";
import { createWidgetRegistry } from "../sites/staging/shared/widget-registry.mjs";
import { createNebulacast } from "../sites/staging/shared/widget-runtime.mjs";
import { widgetCatalog } from "../sites/staging/shared/widget-catalog.mjs";
import {
  createFetchMock,
  createGeolocationMock,
  createLocationContext,
  createLocationRoot,
  flush,
} from "./fixtures/location-platform-fixture.mjs";

const locationDefinition = widgetCatalog.find(definition => definition.type === "location");

function createRuntime(context, extra = {}) {
  return createNebulacast({
    context,
    registry: createWidgetRegistry([locationDefinition]),
    ...extra,
  });
}

function baseContext() {
  return createLocationContext({
    observer: {
      name: "Warsaw",
      lat: 52.2297,
      lon: 21.0122,
      timezone: "Europe/Warsaw",
      source: "url",
    },
    time: { mode: "live", datetimeISO: null },
  });
}

function adapterConfig(root, fetch, extra = {}) {
  return {
    checkAPIStatus: false,
    searchDebounceMs: 0,
    fetch,
    window: root.ownerDocument.defaultView,
    navigator: root.ownerDocument.defaultView.navigator,
    ...extra,
  };
}

test("catalog registers a lazy Location platform adapter with embedding and multi-instance capability", () => {
  assert.ok(locationDefinition);
  assert.deepEqual(locationDefinition.defaults, { orientation: "auto", theme: "inherit", density: "normal" });
  assert.deepEqual(locationDefinition.capabilities, {
    observerAware: true,
    timeAware: false,
    multiInstance: true,
    embed: true,
  });
  assert.equal(typeof locationDefinition.loader, "function");
});

test("mounts through real Runtime and supports search/select, coordinates, geolocation, timezone, and URL params", async () => {
  const context = baseContext();
  const root = createLocationRoot("location-one");
  const geo = createGeolocationMock();
  const copied = [];
  const fetch = createFetchMock({
    "/api/geocode": { results: [{ name: "Prague", country: "Czech Republic", lat: 50.0755, lon: 14.4378, tz: "Europe/Prague" }] },
    "/api/revgeo": { name: "Gdansk" },
    "/api/timezone": { timezone: "Europe/Warsaw" },
  });
  const runtime = createRuntime(context);
  const instance = await runtime.mount(root, {
    widget: "location",
    config: adapterConfig(root, fetch, {
      navigator: geo,
      clipboard: { writeText: async url => copied.push(url) },
      urlParams: () => ({ profile: "visual", range: "48h" }),
    }),
  });

  assert.equal(instance.type, "location");
  assert.equal(root.classList.contains("nc-widget"), true);
  assert.equal(root.classList.contains("nc-location-platform"), true);
  const input = root.querySelector(".loc-input");
  const dropdown = root.querySelector(".loc-dd");
  input.value = "Prague";
  input.dispatchEvent({ type: "input" });
  await flush();
  await flush();
  assert.equal(dropdown.classList.contains("show"), true);
  dropdown.querySelector(".loc-dd-item").click();
  await flush();
  assert.equal(context.get().observer.name, "Prague");
  assert.equal(context.get().observer.timezone, "Europe/Prague");
  assert.equal(context.get().observer.source, "user");

  input.value = "91, 181";
  input.dispatchEvent({ type: "input" });
  await flush();
  assert.equal(context.get().observer.lat, 90);
  assert.equal(context.get().observer.lon, 180);
  assert.equal(context.get().observer.timezone, "Europe/Warsaw");

  root.querySelector(".loc-geo-button").click();
  await geo.resolve({ coords: { latitude: 54.352, longitude: 18.6466 } });
  await flush();
  assert.equal(context.get().observer.name, "Gdansk");
  assert.equal(context.get().observer.source, "geolocate");
  assert.equal(context.get().observer.timezone, "Europe/Warsaw");

  root.querySelector(".loc-share-button").click();
  await flush();
  assert.match(copied[0], /lat=54\.3520/);
  assert.match(copied[0], /lon=18\.6466/);
  assert.match(copied[0], /tz=Europe%2FWarsaw/);
  assert.match(copied[0], /profile=visual/);
  assert.match(copied[0], /range=48h/);
  instance.destroy();
});

test("host consumes Platform Context without runtime.mount or a Location instance", () => {
  const context = createLocationContext({ time: { mode: "live" } });
  const hostReads = [];
  const unsubscribe = context.subscribe(snapshot => hostReads.push(snapshot));

  assert.deepEqual(context.get(), { time: { mode: "live" } });
  const snapshot = context.update({ observer: {
    name: "Host supplied",
    lat: 51.1079,
    lon: 17.0385,
    timezone: "Europe/Warsaw",
    source: "host",
  } });
  assert.equal(snapshot.observer.name, "Host supplied");
  assert.equal(context.get().observer.timezone, "Europe/Warsaw");
  assert.equal(hostReads.length, 1);
  assert.equal(hostReads[0].observer.source, "host");

  unsubscribe();
  context.update({ observer: { name: "Ignored after unsubscribe" } });
  assert.equal(hostReads.length, 1);
});

test("keeps two Location instances isolated, then destroys and remounts one root", async () => {
  const context = baseContext();
  const fetch = createFetchMock();
  const runtime = createRuntime(context);
  const firstRoot = createLocationRoot("first");
  const secondRoot = createLocationRoot("second");
  const first = await runtime.mount(firstRoot, { widget: "location", config: adapterConfig(firstRoot, fetch) });
  const second = await runtime.mount(secondRoot, { widget: "location", config: adapterConfig(secondRoot, fetch) });
  assert.notEqual(first.id, second.id);
  assert.equal(firstRoot.classList.contains("nc-location-platform"), true);
  assert.equal(secondRoot.classList.contains("nc-location-platform"), true);

  first.update({ observer: { name: "Updated host", lat: 1, lon: 2, timezone: "UTC", source: "user" } });
  assert.match(firstRoot.querySelector(".loc-status-content").textContent, /Updated host/);
  assert.match(secondRoot.querySelector(".loc-status-content").textContent, /Updated host/);
  first.destroy();
  assert.equal(firstRoot.classList.contains("nc-widget"), false);
  assert.equal(firstRoot.classList.contains("nc-location-platform"), false);
  assert.equal(secondRoot.classList.contains("nc-widget"), true);
  assert.equal(secondRoot.classList.contains("nc-location-platform"), true);

  const remounted = await runtime.mount(firstRoot, { widget: "location", config: adapterConfig(firstRoot, fetch) });
  assert.notEqual(remounted.id, first.id);
  remounted.destroy();
  second.destroy();
});

test("contains failed requests and sibling mount failures without affecting a good Location instance", async () => {
  const context = baseContext();
  const fetch = createFetchMock();
  const runtime = createRuntime(context);
  const goodRoot = createLocationRoot("good");
  const good = await runtime.mount(goodRoot, { widget: "location", config: adapterConfig(goodRoot, fetch) });
  const input = goodRoot.querySelector(".loc-input");
  input.value = "Unknown place";
  input.dispatchEvent({ type: "input" });
  await flush();
  await flush();
  assert.equal(goodRoot.querySelector(".loc-dd").classList.contains("show"), false);
  assert.equal(good.type, "location");

  const badRoot = {
    classList: { add() {}, remove() {} },
    setAttribute() {},
    removeAttribute() {},
    querySelector() { throw new Error("intentional sibling adapter failure"); },
  };
  await assert.rejects(
    runtime.mount(badRoot, { widget: "location", config: adapterConfig(goodRoot, fetch) }),
    /intentional sibling adapter failure/,
  );
  assert.equal(goodRoot.classList.contains("nc-widget"), true);
  good.destroy();

  let resolvePendingFetch;
  const pendingFetch = new Promise(resolve => { resolvePendingFetch = resolve; });
  const pending = createLocationRoot("pending");
  const pendingRuntime = createRuntime(baseContext());
  const pendingInstance = await pendingRuntime.mount(pending, {
    widget: "location",
    config: adapterConfig(pending, async () => ({ ok: true, json: () => pendingFetch })),
  });
  const pendingInput = pending.querySelector(".loc-input");
  pendingInput.value = "Delayed place";
  pendingInput.dispatchEvent({ type: "input" });
  await flush();
  pendingInstance.destroy();
  resolvePendingFetch({ results: [{ name: "Late", lat: 1, lon: 2 }] });
  await flush();
  assert.equal(pending.querySelector(".loc-dd").classList.contains("show"), false);
});
