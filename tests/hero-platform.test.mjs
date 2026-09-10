import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createNebulacast } from "../sites/staging/shared/widget-runtime.mjs";
import { createWidgetRegistry } from "../sites/staging/shared/widget-registry.mjs";
import { widgetCatalog } from "../sites/staging/shared/widget-catalog.mjs";
import { heroData, FakeDocument, makeContext, makeFetch, makeRoot } from "./fixtures/hero-platform-fixture.mjs";

const definition = widgetCatalog.find(item => item.type === "hero");

function timers() {
  const intervals = new Set();
  return {
    setInterval(callback) { intervals.add(callback); return callback; },
    clearInterval(callback) { intervals.delete(callback); },
    setTimeout() { return {}; },
    clearTimeout() {},
    get intervals() { return intervals; },
  };
}

function runtime(context) {
  return createNebulacast({ context, registry: createWidgetRegistry([definition]) });
}

function delayedWeatherFetch(weather) {
  return makeFetch({
    "/api/observer-weather": () => new Promise(resolve => setTimeout(() => resolve({ ok: true, status: 200, json: async () => weather }), 0)),
    "/data/helio_now.json": heroData.sw,
    "/sky/data/sun_moon.json": heroData.sunMoon,
  });
}

function hostState(root) {
  return { setState(state) { root.setAttribute("data-test-state", state); } };
}

test("Hero is registered once with canonical defaults and observer/time capabilities", async () => {
  assert.equal(widgetCatalog.filter(item => item.type === "hero").length, 1);
  assert.deepEqual(definition.defaults, { orientation: "auto", theme: "inherit", density: "normal" });
  assert.deepEqual(definition.capabilities, { observerAware: true, timeAware: true, multiInstance: true });
  assert.equal(typeof (await definition.loader()).mount, "function");
});

test("Hero mounts through Runtime, keeps two roots independent, and emits launcher actions", async () => {
  const documentRef = new FakeDocument();
  const firstTimers = timers();
  const secondTimers = timers();
  const firstContext = makeContext();
  const secondContext = makeContext({ observer: { name: "Gdansk", lat: 54, lon: 18, timezone: "Europe/Warsaw" } });
  const firstRoot = makeRoot(documentRef, "hero-one");
  const secondRoot = makeRoot(documentRef, "hero-two");
  const firstActions = [];
  firstRoot.addEventListener("nc:hero-action", event => firstActions.push(event.detail));
  const first = await runtime(firstContext).mount(firstRoot, { widget: "hero", config: { data: heroData, ...firstTimers } });
  const second = await runtime(secondContext).mount(secondRoot, { widget: "hero", config: { data: { ...heroData, wx: { ...heroData.wx, moon: { moon_up_now: false } }, sw: { ...heroData.sw, metrics: { kp_latest: 7.2 } } }, ...secondTimers } });
  await new Promise(resolve => setTimeout(resolve, 0));

  assert.equal(firstRoot.getAttribute("data-nc-widget"), "hero");
  assert.equal(firstRoot.getAttribute("data-nc-state"), "ready");
  assert.match(firstRoot.innerHTML, /8\.1/);
  assert.match(secondRoot.innerHTML, /7\.2/);
  assert.match(firstRoot.innerHTML, /↑up/);
  assert.match(secondRoot.innerHTML, /↓below/);
  assert.notEqual(firstRoot, secondRoot);
  assert.equal(firstRoot.getAttribute("data-nc-state"), "ready");
  assert.equal(secondRoot.getAttribute("data-nc-state"), "ready");
  assert.equal(firstContext.subscriptionCount, 1);
  assert.equal(secondContext.subscriptionCount, 1);

  firstRoot.dispatchEvent({ type: "click", target: firstRoot.querySelector('.hero-card[data-panel="matrix"]') });
  assert.deepEqual(firstActions.at(-1), { action: "toggle-panel", panel: "matrix" });
  firstRoot.dispatchEvent({ type: "click", target: firstRoot.querySelector("#nqi-info-btn") });
  assert.equal(firstActions.at(-1).action, "nqi-info");

  first.destroy(); second.destroy();
});

test("Hero handles loading/error locally and cleans clock, context, observer, and fetch lifecycle", async () => {
  const documentRef = new FakeDocument();
  const pendingTimers = timers();
  let release;
  const pendingFetch = makeFetch({ "/api/observer-weather": () => new Promise(resolve => { release = resolve; }) });
  const pendingContext = makeContext();
  const pendingRoot = makeRoot(documentRef, "hero-loading");
  const pending = await runtime(pendingContext).mount(pendingRoot, { widget: "hero", config: { fetch: pendingFetch, ...pendingTimers } });
  assert.match(pendingRoot.querySelector('[data-role="status"]').textContent, /Loading/);
  pending.destroy();
  release?.({ ok: false, json: async () => ({}) });
  assert.equal(pendingTimers.intervals.size, 0);
  assert.equal(pendingContext.subscriptionCount, 0);
  assert.equal(pendingRoot.getAttribute("data-nc-widget"), null);

  const errorTimers = timers();
  const errorRoot = makeRoot(documentRef, "hero-error");
  const error = await runtime(makeContext()).mount(errorRoot, { widget: "hero", config: { fetch: makeFetch({ "/api/observer-weather": new Error("network down"), "/data/helio_now.json": new Error("network down"), "/sky/data/sun_moon.json": new Error("network down") }), ...errorTimers } });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(errorRoot.getAttribute("data-nc-state"), "error");
  assert.match(errorRoot.querySelector('[data-role="status"]').textContent, /Failed to load conditions/);
  error.destroy();

  const degradedData = { wx: { hourly: [], decision: { best_tonight: null } }, sw: heroData.sw, sunMoon: heroData.sunMoon };
  const degradedRoot = makeRoot(documentRef, "hero-degraded");
  const degraded = await runtime(makeContext()).mount(degradedRoot, { widget: "hero", config: { fetch: delayedWeatherFetch(degradedData.wx), ...timers() } });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(degradedRoot.getAttribute("data-nc-state"), "degraded");
  degraded.destroy();

  const rateLimitedRoot = makeRoot(documentRef, "hero-rate-limited");
  const rateLimited = await runtime(makeContext()).mount(rateLimitedRoot, { widget: "hero", config: { fetch: delayedWeatherFetch({ ok: true, source: "rate-limited", hours: [] }), ...timers() } });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(rateLimitedRoot.getAttribute("data-nc-state"), "degraded");
  rateLimited.destroy();
});

test("Hero updates only for a changed observer, ignores time-only changes, and remounts cleanly", async () => {
  const documentRef = new FakeDocument();
  const fetch = makeFetch({
    "/api/observer-weather": heroData.wx,
    "/data/helio_now.json": heroData.sw,
    "/sky/data/sun_moon.json": heroData.sunMoon,
    "/api/sun-moon": heroData.sunMoon,
  });
  const context = makeContext();
  const root = makeRoot(documentRef, "hero-remount");
  const timerSet = timers();
  const runtimeRef = runtime(context);
  const instance = await runtimeRef.mount(root, { widget: "hero", config: { fetch, ...timerSet } });
  await new Promise(resolve => setTimeout(resolve, 0));
  const initialCalls = fetch.calls.length;
  context.update({ time: { mode: "fixed", datetimeISO: "2026-09-10T20:00:00Z" } });
  assert.equal(fetch.calls.length, initialCalls);
  context.update({ observer: { name: "Gdansk", lat: 54, lon: 18, timezone: "Europe/Warsaw" } });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(fetch.calls.length, initialCalls + 3);
  instance.destroy();
  const remounted = await runtimeRef.mount(root, { widget: "hero", config: { data: heroData, ...timers() } });
  assert.equal(root.getAttribute("data-nc-widget"), "hero");
  assert.equal(root.getAttribute("data-nc-state"), "ready");
  remounted.destroy();
});

test("Hero source and adapter keep the Console and DOM boundaries explicit", async () => {
  const widgetSource = await readFile(new URL("../sites/staging/hero/widget.js", import.meta.url), "utf8");
  const adapterSource = await readFile(new URL("../sites/staging/hero/platform-adapter.mjs", import.meta.url), "utf8");
  const consoleSource = await readFile(new URL("../sites/staging/index.html", import.meta.url), "utf8");
  assert.doesNotMatch(widgetSource, /window\._dbHeroData|document\.(?:getElementById|querySelector(?:All)?)/);
  assert.match(widgetSource, /moon_up_now/);
  assert.match(widgetSource, /↑up/);
  assert.match(widgetSource, /↓below/);
  assert.doesNotMatch(adapterSource, /fetch|innerHTML|querySelector|document/);
  assert.doesNotMatch(consoleSource, /function\s+loadHero|loadHero\(|window\._dbHeroData/);
  assert.doesNotMatch(consoleSource, /document\.querySelectorAll\(['"]\.hero-card/);
  assert.match(consoleSource, /heroInstance\?\.update\?\.\(\{ activePanels:/);
  assert.match(consoleSource, /heroInstance = instance; _dbAfterHeroRender\(\)/);
  assert.match(consoleSource, /mountConsoleHero\(\)/);
  assert.match(consoleSource, /nc:hero-action/);
});
