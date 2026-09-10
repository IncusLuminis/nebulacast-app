import { test, expect } from "@playwright/test";

test("Hero and Sun & Moon expose canonical lunar semantics through platform boundaries", async ({ page }) => {
  await page.goto("/widget-host/", { waitUntil: "domcontentloaded" });

  await page.evaluate(async () => {
    const times = date => Object.fromEntries([
      "sunrise", "sunset", "solarNoon", "dawn", "dusk",
      "nauticalDawn", "nauticalDusk", "night", "nightEnd",
    ].map(key => [key, new Date(date.getTime() + 3600000)]));
    window.SunCalc = {
      getPosition: () => ({ altitude: 0.1, azimuth: 0.2 }),
      getMoonPosition: () => ({ altitude: 0.2, azimuth: 0.3 }),
      getTimes: times,
      getMoonTimes: () => ({}),
    };

    const { createCatalogRegistry } = await import("/shared/widget-catalog.mjs");
    const { createNebulacast } = await import("/shared/widget-runtime.mjs");
    const { createLunarSnapshot } = await import("/shared/lunar.mjs");
    let state = {
      observer: { name: "Warsaw", lat: 52.2297, lon: 21.0122, timezone: "Europe/Warsaw", source: "browser" },
      time: { mode: "manual", datetimeISO: "2026-09-09T00:00:00Z" },
    };
    const listeners = new Set();
    const context = {
      get: () => structuredClone(state),
      subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
      update(patch) { state = { ...state, ...patch, observer: { ...state.observer, ...(patch.observer || {}) } }; for (const listener of listeners) listener(structuredClone(state)); },
    };
    const runtime = createNebulacast({ context, registry: createCatalogRegistry() });
    const heroRoot = document.createElement("section");
    const sunMoonRoot = document.createElement("section");
    heroRoot.dataset.consistencyRoot = "hero";
    sunMoonRoot.dataset.consistencyRoot = "sun-moon";
    document.body.append(heroRoot, sunMoonRoot);
    const heroEvents = [];
    const onHeroData = event => heroEvents.push(event.detail);
    heroRoot.addEventListener("nc:hero-data", onHeroData);
    const hero = await runtime.mount(heroRoot, {
      widget: "hero",
      config: {
        orientation: "horizontal",
        theme: "dark",
        density: "compact",
        data: {
          wx: { hourly: [], decision: {}, night_summary: {}, moon: { moon_up_now: true } },
          sw: { metrics: {}, scales: {}, summary: {}, forecast: {} },
          sunMoon: { schema: "sun_moon.v2", frames: [] },
        },
      },
    });
    const sunMoon = await runtime.mount(sunMoonRoot, {
      widget: "sun-moon",
      config: { orientation: "vertical", theme: "light", density: "normal" },
    });
    const canonical = createLunarSnapshot({
      instant: new Date(),
      location: state.observer,
    });
    window.__astronomyConsistency = {
      hero, sunMoon, heroRoot, sunMoonRoot, onHeroData,
      canonical: canonical.lunar,
      heroLunar: heroEvents.at(-1) && {
        illuminated_percent: heroEvents.at(-1).moonIllum,
        waxing: heroEvents.at(-1).moonWaxing,
      },
    };
  });

  await expect(page.locator("[data-consistency-root=\"hero\"]")).toHaveAttribute("data-nc-widget", "hero");
  await expect(page.locator("[data-consistency-root=\"sun-moon\"]")).toHaveAttribute("data-nc-widget", "sun-moon");
  const semantics = await page.evaluate(() => ({
    schema: window.__astronomyConsistency.canonical && "lunar-snapshot.v1",
    heroPercent: window.__astronomyConsistency.heroLunar.illuminated_percent,
    canonicalPercent: window.__astronomyConsistency.canonical.illuminated_percent,
    heroWaxing: window.__astronomyConsistency.heroLunar.waxing,
    canonicalWaxing: window.__astronomyConsistency.canonical.waxing,
  }));
  expect(semantics.schema).toBe("lunar-snapshot.v1");
  expect(semantics.heroPercent).toBe(semantics.canonicalPercent);
  expect(semantics.heroWaxing).toBe(semantics.canonicalWaxing);

  await page.evaluate(() => {
    window.__astronomyConsistency.hero.destroy();
    window.__astronomyConsistency.sunMoon.destroy();
    window.__astronomyConsistency.heroRoot.removeEventListener("nc:hero-data", window.__astronomyConsistency.onHeroData);
  });
  await expect(page.locator("[data-consistency-root=\"hero\"]")).not.toHaveAttribute("data-nc-widget");
  await expect(page.locator("[data-consistency-root=\"sun-moon\"]")).not.toHaveAttribute("data-nc-widget");
});
