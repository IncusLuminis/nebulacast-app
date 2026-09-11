import { test, expect } from "@playwright/test";

function weatherPayload(url) {
  const request = new URL(url);
  const hours = [0, 1, 2, 3].map(offset => ({
    time: `2026-09-09T${String(offset).padStart(2, "0")}:00:00Z`,
    score: 72 - offset,
    sun_alt_deg: -20,
    moon_alt_deg: 12 + offset,
    cloud_total: 10,
    cloud_low: 5,
    cloud_mid: 5,
    cloud_high: 5,
    temp_c: 16,
    wind_m_s: 2,
    visibility_m: 20000,
    precip_mm: 0,
    precip_prob: 0,
    pressure_hpa: 1012,
    seeing: 2,
    transparency: 2,
    humidity_pct: 60,
    gate: "OPEN",
  }));
  return {
    ok: true,
    source: "fixture",
    generated_at: "2026-09-09T00:00:00Z",
    location: { name: request.searchParams.get("name") || "Warsaw", lat: 52.2297, lon: 21.0122, tz: "Europe/Warsaw" },
    horizon_hours: hours.length,
    profiles: ["balanced", "visual", "broadband", "planetary"],
    default_profile: "balanced",
    hours,
  };
}

test("standalone host loads only the selected widget module", async ({ page }) => {
  const requests = [];
  page.on("request", request => requests.push(new URL(request.url()).pathname));

  await page.goto("/widgets/widget.html?widget=events", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#host-status")).toHaveAttribute("data-state", "mounted");
  await expect(page.locator("#widget-root")).toHaveAttribute("data-nc-widget", "events");

  const moduleRequests = requests.filter(path => path.endsWith(".mjs") || path.endsWith(".js"));
  expect(moduleRequests).toContain("/calendar/platform-adapter.mjs");
  expect(moduleRequests).not.toContain("/sky/widget.js");
  expect(moduleRequests).not.toContain("/weather/widgets/weather/platform-adapter.mjs");
  expect(requests).not.toContain("/api/astro-weather");
});

test("hidden and destroyed Weather instances stop recurring work", async ({ page }) => {
  await page.addInitScript(() => {
    const nativeSetInterval = window.setInterval.bind(window);
    const nativeClearInterval = window.clearInterval.bind(window);
    const probe = {
      activeIntervals: new Map(),
      allIntervalCallbacks: [],
      activeResizeObservers: new Set(),
      activeListeners: new Set(),
    };
    window.__ncLifecycleProbe = probe;
    window.setInterval = (callback, delay, ...args) => {
      const id = nativeSetInterval(callback, delay, ...args);
      probe.activeIntervals.set(id, { callback, delay });
      probe.allIntervalCallbacks.push(callback);
      return id;
    };
    window.clearInterval = id => {
      probe.activeIntervals.delete(id);
      return nativeClearInterval(id);
    };

    const nativeAdd = EventTarget.prototype.addEventListener;
    const nativeRemove = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      if (type === "visibilitychange") probe.activeListeners.add({ target: this, type, listener, options });
      return nativeAdd.call(this, type, listener, options);
    };
    EventTarget.prototype.removeEventListener = function(type, listener, options) {
      if (type === "visibilitychange") {
        for (const entry of probe.activeListeners) {
          if (entry.target === this && entry.type === type && entry.listener === listener) probe.activeListeners.delete(entry);
        }
      }
      return nativeRemove.call(this, type, listener, options);
    };

    const NativeResizeObserver = window.ResizeObserver;
    if (NativeResizeObserver) {
      window.ResizeObserver = class extends NativeResizeObserver {
        constructor(callback) {
          super(callback);
          probe.activeResizeObservers.add(this);
        }
        disconnect() {
          probe.activeResizeObservers.delete(this);
          return super.disconnect();
        }
      };
    }
  });

  const weatherRequests = [];
  await page.route("**/api/astro-weather**", route => {
    weatherRequests.push(route.request().url());
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(weatherPayload(route.request().url())) });
  });
  await page.route("**/sky/data/sun_moon.json", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ frames: [] }),
  }));

  await page.goto("/widget-host/weather.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.weatherHost));
  await expect.poll(() => weatherRequests.length).toBe(2);
  await expect.poll(() => page.evaluate(() => {
    const probe = window.__ncLifecycleProbe;
    return {
      observers: probe.activeResizeObservers.size,
      listeners: probe.activeListeners.size,
      refreshIntervals: [...probe.activeIntervals.values()].filter(entry => entry.delay === 300000).length,
    };
  })).toEqual({ observers: 2, listeners: 2, refreshIntervals: 2 });

  const requestCountBeforeHidden = weatherRequests.length;
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => page.evaluate(() => [...window.__ncLifecycleProbe.activeIntervals.values()]
    .filter(entry => entry.delay === 300000).length)).toBe(0);
  await page.evaluate(() => window.__ncLifecycleProbe.allIntervalCallbacks.forEach(callback => callback()));
  await expect.poll(() => weatherRequests.length).toBe(requestCountBeforeHidden);

  await page.evaluate(() => window.weatherHost.destroy("wide"));
  await page.evaluate(() => window.weatherHost.destroy("narrow"));
  await expect.poll(() => page.evaluate(() => ({
    observers: window.__ncLifecycleProbe.activeResizeObservers.size,
    listeners: window.__ncLifecycleProbe.activeListeners.size,
    intervals: window.__ncLifecycleProbe.activeIntervals.size,
  }))).toEqual({ observers: 0, listeners: 0, intervals: 0 });
  await page.evaluate(() => window.__ncLifecycleProbe.allIntervalCallbacks.forEach(callback => callback()));
  await expect.poll(() => weatherRequests.length).toBe(requestCountBeforeHidden);
});

test("two Weather instances remount without duplicating owned resources or state", async ({ page }) => {
  await page.addInitScript(() => {
    const nativeSetInterval = window.setInterval.bind(window);
    const nativeClearInterval = window.clearInterval.bind(window);
    const probe = { activeIntervals: new Map(), activeResizeObservers: new Set(), activeListeners: new Set() };
    window.__ncLifecycleProbe = probe;
    window.setInterval = (callback, delay, ...args) => {
      const id = nativeSetInterval(callback, delay, ...args);
      probe.activeIntervals.set(id, delay);
      return id;
    };
    window.clearInterval = id => { probe.activeIntervals.delete(id); return nativeClearInterval(id); };
    const nativeAdd = EventTarget.prototype.addEventListener;
    const nativeRemove = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      if (type === "visibilitychange") probe.activeListeners.add({ target: this, type, listener });
      return nativeAdd.call(this, type, listener, options);
    };
    EventTarget.prototype.removeEventListener = function(type, listener, options) {
      if (type === "visibilitychange") for (const entry of probe.activeListeners) {
        if (entry.target === this && entry.type === type && entry.listener === listener) probe.activeListeners.delete(entry);
      }
      return nativeRemove.call(this, type, listener, options);
    };
    const NativeResizeObserver = window.ResizeObserver;
    if (NativeResizeObserver) window.ResizeObserver = class extends NativeResizeObserver {
      constructor(callback) { super(callback); probe.activeResizeObservers.add(this); }
      disconnect() { probe.activeResizeObservers.delete(this); return super.disconnect(); }
    };
  });
  const requests = [];
  await page.route("**/api/astro-weather**", route => {
    requests.push(route.request().url());
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(weatherPayload(route.request().url())) });
  });
  await page.route("**/sky/data/sun_moon.json", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ frames: [] }) }));
  await page.goto("/widget-host/weather.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.weatherHost));
  await expect.poll(() => requests.length).toBe(2);

  const profiles = await page.evaluate(() => Object.values(window.weatherHost.instances).map(instance => instance.config.profile));
  expect(profiles).toEqual(["visual", "planetary"]);
  await expect.poll(() => page.evaluate(() => ({
    observers: window.__ncLifecycleProbe.activeResizeObservers.size,
    listeners: window.__ncLifecycleProbe.activeListeners.size,
    refreshIntervals: [...window.__ncLifecycleProbe.activeIntervals.values()].filter(delay => delay === 300000).length,
  }))).toEqual({ observers: 2, listeners: 2, refreshIntervals: 2 });

  await page.evaluate(() => window.weatherHost.destroy("wide"));
  await expect.poll(() => page.evaluate(() => ({
    observers: window.__ncLifecycleProbe.activeResizeObservers.size,
    listeners: window.__ncLifecycleProbe.activeListeners.size,
  }))).toEqual({ observers: 1, listeners: 1 });
  await page.evaluate(() => window.weatherHost.remount("wide"));
  await expect.poll(() => page.evaluate(() => ({
    observers: window.__ncLifecycleProbe.activeResizeObservers.size,
    listeners: window.__ncLifecycleProbe.activeListeners.size,
  }))).toEqual({ observers: 2, listeners: 2 });
  expect(await page.evaluate(() => Object.values(window.weatherHost.instances).map(instance => instance.config.profile))).toEqual(["visual", "planetary"]);

  await page.evaluate(() => {
    window.weatherHost.destroy("wide");
    window.weatherHost.destroy("narrow");
  });
  await expect.poll(() => page.evaluate(() => ({
    observers: window.__ncLifecycleProbe.activeResizeObservers.size,
    listeners: window.__ncLifecycleProbe.activeListeners.size,
    intervals: window.__ncLifecycleProbe.activeIntervals.size,
  }))).toEqual({ observers: 0, listeners: 0, intervals: 0 });
});
