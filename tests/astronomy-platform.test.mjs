import test from "node:test";
import assert from "node:assert/strict";

import { createLunarSnapshot } from "../sites/staging/shared/lunar.mjs";
import { mountAstro } from "../sites/staging/weather/widgets/astro/astro.js";
import { mountSunMoon } from "../sites/staging/weather/widgets/sun_moon/sun_moon.js";
import { createCatalogRegistry } from "../sites/staging/shared/widget-catalog.mjs";
import { createNebulacast } from "../sites/staging/shared/widget-runtime.mjs";
import {
  createAstronomyRoot,
  createEventTarget,
  createPlatformContext,
  createResourceLedger,
} from "./fixtures/astronomy-platform-fixture.mjs";

const INITIAL_STATE = {
  observer: {
    name: "Warsaw",
    lat: 52.2297,
    lon: 21.0122,
    timezone: "Europe/Warsaw",
    source: "fixture",
  },
  time: { mode: "manual", datetimeISO: "2026-09-09T12:00:00Z" },
  locale: "en",
  theme: "light",
};

function createRuntimeRoot(name) {
  const domRoot = createAstronomyRoot();
  const attributes = new Map();
  return {
    name,
    classList: domRoot.classList,
    querySelector: selector => domRoot.querySelector(selector),
    querySelectorAll: selector => domRoot.querySelectorAll(selector),
    setAttribute(name, value) { attributes.set(name, String(value)); },
    removeAttribute(name) { attributes.delete(name); },
    getAttribute(name) { return attributes.get(name) ?? null; },
    get innerHTML() { return domRoot.innerHTML; },
    set innerHTML(value) { domRoot.innerHTML = value; },
  };
}

function createTrackedContext(ledger) {
  const context = createPlatformContext(INITIAL_STATE);
  return {
    get: context.get,
    subscribe(listener) {
      const release = ledger.acquire("subscriptions");
      const unsubscribe = context.subscribe(listener);
      let active = true;
      return () => {
        if (!active) return;
        active = false;
        release();
        unsubscribe();
      };
    },
    update: context.update,
  };
}

function installSunMoonEnvironment(ledger, events) {
  const names = ["window", "document", "CustomEvent", "ResizeObserver", "setInterval", "clearInterval"];
  const descriptors = new Map(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const date = value => new Date(`2026-09-${String(value).padStart(2, "0")}T06:00:00Z`);
  const times = {
    sunrise: date(9),
    sunset: date(9),
    solarNoon: date(9),
    dawn: date(9),
    dusk: date(9),
    nauticalDawn: date(9),
    nauticalDusk: date(9),
    night: date(9),
    nightEnd: date(9),
  };

  globalThis.window = {
    devicePixelRatio: 1,
    SunCalc: {
      getPosition: () => ({ altitude: 0.1, azimuth: 0.2 }),
      getMoonPosition: () => ({ altitude: 0.2, azimuth: 0.3 }),
      getTimes: () => ({ ...times }),
      getMoonTimes: () => ({}),
    },
    dispatchEvent(event) {
      events.push(event);
      return true;
    },
  };
  globalThis.document = { createElement: () => createEventTarget() };
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
    }
  };
  globalThis.setInterval = () => {
    const release = ledger.acquire("timers");
    return { release };
  };
  globalThis.clearInterval = handle => handle?.release?.();
  globalThis.ResizeObserver = class ResizeObserver {
    constructor() { this.release = ledger.acquire("observers"); }
    observe() {}
    disconnect() {
      this.release?.();
      this.release = null;
    }
  };

  return () => {
    for (const [name, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  };
}

function createRuntime(context) {
  return createNebulacast({
    context,
    registry: createCatalogRegistry(),
  });
}

test("catalog lazily registers platform adapters and legacy exports remain callable", async () => {
  const registry = createCatalogRegistry();
  const definitions = registry.list();
  const astro = registry.get("astro");
  const sunMoon = registry.get("sun-moon");

  const definitionTypes = definitions.map(definition => definition.type);
  assert.deepEqual(definitionTypes, ["hero", "astro", "sun-moon", "weather", "observing-window", "map", "location", "sky", "news", "events", "alerts", "space-weather"]);
  assert.equal(definitionTypes.filter(type => type === "hero").length, 1);
  assert.equal(typeof astro.loader, "function");
  assert.equal(typeof sunMoon.loader, "function");
  const [astroModule, sunMoonModule] = await Promise.all([astro.loader(), sunMoon.loader()]);
  assert.equal(typeof astroModule.mount, "function");
  assert.equal(typeof sunMoonModule.mount, "function");
  assert.equal(typeof mountAstro, "function");
  assert.equal(typeof mountSunMoon, "function");
});

test("Astro and Sun/Moon reject an incomplete Platform Context before mounting", async () => {
  const complete = createPlatformContext(INITIAL_STATE);
  const incomplete = {
    get: complete.get,
    subscribe: complete.subscribe,
  };
  const runtime = createNebulacast({
    context: incomplete,
    registry: createCatalogRegistry(),
  });

  await assert.rejects(
    runtime.mount(createRuntimeRoot("astro-incomplete-context"), { widget: "astro" }),
    /Astro platform adapter requires Platform Context/,
  );

  const ledger = createResourceLedger();
  const events = [];
  const restore = installSunMoonEnvironment(ledger, events);
  try {
    await assert.rejects(
      runtime.mount(createRuntimeRoot("sun-moon-incomplete-context"), { widget: "sun-moon" }),
      /Sun\/Moon platform adapter requires Platform Context/,
    );
  } finally {
    restore();
  }
});

test("Astro uses explicit context/config and keeps same-type lifecycle ownership independent", async () => {
  const ledger = createResourceLedger();
  const context = createTrackedContext(ledger);
  const runtime = createRuntime(context);
  const firstRoot = createRuntimeRoot("astro-one");
  const secondRoot = createRuntimeRoot("astro-two");

  const first = await runtime.mount(firstRoot, {
    widget: "astro",
    config: { orientation: "horizontal", theme: "dark", density: "compact", profile: "visual", range: "today" },
  });
  const second = await runtime.mount(secondRoot, {
    widget: "astro",
    config: { orientation: "vertical", theme: "light", density: "comfortable", profile: "default" },
  });

  assert.notEqual(first.id, second.id);
  assert.equal(first.config.profile, "visual");
  assert.equal(firstRoot.getAttribute("data-nc-orientation"), "horizontal");
  assert.equal(secondRoot.getAttribute("data-nc-orientation"), "vertical");
  assert.deepEqual(ledger.snapshot(), { timers: 0, observers: 0, subscriptions: 2 });

  first.update({ orientation: "vertical" });
  assert.equal(firstRoot.getAttribute("data-nc-orientation"), "vertical");
  assert.equal(secondRoot.getAttribute("data-nc-orientation"), "vertical");
  context.update({ observer: { name: "Prague", timezone: "Europe/Prague" } });
  assert.equal(firstRoot.querySelector(".widget-location-info").textContent, "Location: Prague");
  assert.equal(secondRoot.querySelector(".widget-location-info").textContent, "Location: Prague");

  first.destroy();
  assert.equal(firstRoot.getAttribute("data-nc-widget"), null);
  assert.equal(secondRoot.getAttribute("data-nc-widget"), "astro");
  assert.deepEqual(ledger.snapshot(), { timers: 0, observers: 0, subscriptions: 1 });
  context.update({ observer: { name: "Gdansk" } });
  assert.equal(firstRoot.querySelector(".widget-location-info").textContent, "Location: Prague");
  assert.equal(secondRoot.querySelector(".widget-location-info").textContent, "Location: Gdansk");

  const remounted = await runtime.mount(firstRoot, {
    widget: "astro",
    config: { orientation: "horizontal", theme: "dark", density: "compact" },
  });
  assert.notEqual(remounted.id, first.id);
  remounted.destroy();
  second.destroy();
  second.destroy();
  assert.deepEqual(ledger.snapshot(), { timers: 0, observers: 0, subscriptions: 0 });
});

test("Sun/Moon uses the real catalog adapter with isolated resources and contracts", async () => {
  const ledger = createResourceLedger();
  const events = [];
  const restore = installSunMoonEnvironment(ledger, events);
  try {
    const context = createTrackedContext(ledger);
    const runtime = createRuntime(context);
    const firstRoot = createRuntimeRoot("sun-moon-one");
    const secondRoot = createRuntimeRoot("sun-moon-two");
    const first = await runtime.mount(firstRoot, {
      widget: "sun-moon",
      config: { orientation: "horizontal", theme: "dark", density: "compact", range: "today" },
    });
    const second = await runtime.mount(secondRoot, {
      widget: "sun-moon",
      config: { orientation: "vertical", theme: "light", density: "comfortable" },
    });

    assert.notEqual(first.id, second.id);
    assert.equal(firstRoot.getAttribute("data-nc-orientation"), "horizontal");
    assert.equal(secondRoot.getAttribute("data-nc-orientation"), "vertical");
    assert.deepEqual(ledger.snapshot(), { timers: 2, observers: 2, subscriptions: 2 });
    assert.ok(events.some(event => event.type === "nc:sun-times" && event.detail.type === "sun:times"));
    assert.match(firstRoot.querySelector("[data-role=hour-line]").textContent, /illum\. \d+%/);
    // This lightweight canvas mock intentionally has no setAttribute method;
    // the real DOM still receives aria-label through the optional method call.
    assert.equal(typeof firstRoot.querySelector("[data-role=canvas]").setAttribute, "undefined");

    const snapshot = createLunarSnapshot({
      instant: new Date("2026-09-09T12:00:00Z"),
      location: INITIAL_STATE.observer,
    });
    assert.equal(snapshot.schema_version, "lunar-snapshot.v1");
    assert.equal(snapshot.lunar.illuminated_percent, snapshot.lunar.illuminated_fraction * 100);
    assert.ok(Object.isFrozen(snapshot));

    first.update({ orientation: "vertical" });
    assert.equal(firstRoot.getAttribute("data-nc-orientation"), "vertical");
    assert.equal(secondRoot.getAttribute("data-nc-orientation"), "vertical");
    const eventCount = events.length;
    context.update({ observer: { name: "Prague", timezone: "Europe/Prague" } });
    assert.ok(events.length > eventCount);

    first.destroy();
    first.destroy();
    assert.deepEqual(ledger.snapshot(), { timers: 1, observers: 1, subscriptions: 1 });
    assert.equal(secondRoot.getAttribute("data-nc-widget"), "sun-moon");
    const remounted = await runtime.mount(firstRoot, {
      widget: "sun-moon",
      config: { orientation: "horizontal", theme: "dark", density: "compact" },
    });
    assert.notEqual(remounted.id, first.id);
    assert.deepEqual(ledger.snapshot(), { timers: 2, observers: 2, subscriptions: 2 });
    remounted.destroy();
    second.destroy();
    assert.deepEqual(ledger.snapshot(), { timers: 0, observers: 0, subscriptions: 0 });
  } finally {
    restore();
  }
});
