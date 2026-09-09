import { test, expect } from "@playwright/test";

// Future browser validation for the real catalog adapters. The runner is kept
// separate from the deterministic Node contract suite and is intentionally not
// invoked by the current Coder step.
test("real Astro and Sun/Moon surfaces keep public platform boundaries", async ({ page }) => {
  await page.goto("/widget-host/", { waitUntil: "domcontentloaded" });

  await page.evaluate(async () => {
    window.SunCalc = {
      getPosition: () => ({ altitude: 0.1, azimuth: 0.2 }),
      getMoonPosition: () => ({ altitude: 0.2, azimuth: 0.3 }),
      getTimes: date => Object.fromEntries([
        "sunrise", "sunset", "solarNoon", "dawn", "dusk",
        "nauticalDawn", "nauticalDusk", "night", "nightEnd",
      ].map(key => [key, new Date(date.getTime() + 3600000)])),
      getMoonTimes: () => ({}),
    };

    const { createCatalogRegistry } = await import("/shared/widget-catalog.mjs");
    const { createNebulacast } = await import("/shared/widget-runtime.mjs");
    let current = {
      observer: {
        name: "Warsaw",
        lat: 52.2297,
        lon: 21.0122,
        timezone: "Europe/Warsaw",
        source: "fixture",
      },
      time: { mode: "manual", datetimeISO: "2026-09-09T12:00:00Z" },
    };
    const listeners = new Set();
    const context = {
      get: () => structuredClone(current),
      subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      update(patch) {
        current = {
          ...current,
          ...patch,
          observer: patch.observer ? { ...current.observer, ...patch.observer } : current.observer,
          time: patch.time ? { ...current.time, ...patch.time } : current.time,
        };
        const next = structuredClone(current);
        for (const listener of [...listeners]) listener(next);
        return next;
      },
    };
    const runtime = createNebulacast({
      context,
      registry: createCatalogRegistry(),
      resolveAutoOrientation: ({ root }) => root.dataset.autoOrientation,
    });
    const roots = {};
    for (const [id, type, orientation] of [
      ["astro-one", "astro", "horizontal"],
      ["astro-two", "astro", "vertical"],
      ["sun-moon-one", "sun-moon", "horizontal"],
      ["sun-moon-two", "sun-moon", "vertical"],
    ]) {
      const root = document.createElement("section");
      root.dataset.testId = id;
      root.dataset.autoOrientation = orientation;
      root.setAttribute("aria-label", id);
      document.body.append(root);
      roots[id] = root;
    }
    const sentinel = document.createElement("p");
    sentinel.dataset.testId = "outside-sentinel";
    sentinel.textContent = "Outside astronomy sentinel";
    sentinel.style.color = "rgb(18, 52, 86)";
    document.body.append(sentinel);

    const sunTimes = [];
    const onSunTimes = event => sunTimes.push(event.detail);
    window.addEventListener("nc:sun-times", onSunTimes);
    const instances = {
      astroOne: await runtime.mount(roots["astro-one"], {
        widget: "astro",
        config: { orientation: "auto", theme: "dark", density: "compact", profile: "visual" },
      }),
      astroTwo: await runtime.mount(roots["astro-two"], {
        widget: "astro",
        config: { orientation: "vertical", theme: "light", density: "comfortable" },
      }),
      sunMoonOne: await runtime.mount(roots["sun-moon-one"], {
        widget: "sun-moon",
        config: { orientation: "auto", theme: "dark", density: "compact" },
      }),
      sunMoonTwo: await runtime.mount(roots["sun-moon-two"], {
        widget: "sun-moon",
        config: { orientation: "vertical", theme: "light", density: "comfortable" },
      }),
    };
    window.__astronomyPlatform = { context, runtime, roots, instances, sunTimes, onSunTimes };
  });

  const astroOne = page.locator('[data-test-id="astro-one"]');
  const astroTwo = page.locator('[data-test-id="astro-two"]');
  const sunMoonOne = page.locator('[data-test-id="sun-moon-one"]');
  const sunMoonTwo = page.locator('[data-test-id="sun-moon-two"]');
  await expect(astroOne).toHaveAttribute("data-nc-widget", "astro");
  await expect(astroOne).toHaveAttribute("data-nc-orientation", "horizontal");
  await expect(astroOne).toHaveAttribute("data-nc-theme", "dark");
  await expect(astroOne).toHaveAttribute("data-nc-density", "compact");
  await expect(astroTwo).toHaveAttribute("data-nc-orientation", "vertical");
  await expect(sunMoonOne).toHaveAttribute("data-nc-widget", "sun-moon");
  await expect(sunMoonOne).toHaveAttribute("data-nc-orientation", "horizontal");
  await expect(sunMoonTwo).toHaveAttribute("data-nc-orientation", "vertical");

  await page.evaluate(() => {
    const contract = window.__astronomyPlatform;
    contract.instances.astroOne.resize({ width: 320, height: 180 });
    contract.instances.sunMoonOne.resize({ width: 320, height: 180 });
    contract.instances.astroOne.update({ orientation: "vertical" });
    contract.context.update({ observer: {
      name: "Prague",
      lat: 50.0755,
      lon: 14.4378,
      timezone: "Europe/Prague",
      source: "host",
    } });
  });
  await expect(astroOne).toHaveAttribute("data-nc-orientation", "vertical");
  await expect(astroTwo).toContainText("Prague");
  await expect(astroOne).toContainText("Prague");
  await expect.poll(() => page.evaluate(() => window.__astronomyPlatform.sunTimes.length)).toBeGreaterThan(0);
  await expect(page.locator('[data-test-id="outside-sentinel"]')).toHaveText("Outside astronomy sentinel");
  await expect(page.locator('[data-test-id="outside-sentinel"]')).not.toHaveAttribute("data-nc-widget");

  await page.evaluate(() => window.__astronomyPlatform.instances.astroOne.destroy());
  await expect(astroOne).not.toHaveAttribute("data-nc-widget");
  await expect(astroTwo).toHaveAttribute("data-nc-widget", "astro");
  await expect(sunMoonOne).toHaveAttribute("data-nc-widget", "sun-moon");

  await page.evaluate(async () => {
    const contract = window.__astronomyPlatform;
    contract.instances.astroOne = await contract.runtime.mount(contract.roots["astro-one"], {
      widget: "astro",
      config: { orientation: "horizontal", theme: "dark", density: "compact" },
    });
  });
  await expect(astroOne).toHaveAttribute("data-nc-widget", "astro");
  await expect(astroOne).toHaveAttribute("data-nc-orientation", "horizontal");

  await page.evaluate(() => {
    const contract = window.__astronomyPlatform;
    for (const instance of Object.values(contract.instances)) instance.destroy();
    window.removeEventListener("nc:sun-times", contract.onSunTimes);
  });
});
