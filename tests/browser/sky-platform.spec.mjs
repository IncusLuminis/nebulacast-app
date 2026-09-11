import { test, expect } from "@playwright/test";

const quietOptions = {
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
const quietUI = { components: { sideToolbar: false, bottomToolbar: false, popover: false, modal: false, player: false } };

test("Sky browser path preserves layout, data loading, context updates, and instance isolation", async ({ page }) => {
  const dataRequests = [];
  const fixtures = {
    "stars.json": { stars: [] },
    "constellations.json": { constellations: [] },
    "milkyway.json": { points: [] },
    "objects_today.json": { items: [] },
    "alerts_now.json": { items: [] },
    "sun_moon.json": { frames: [] },
    "dso_messier.json": { items: [] },
    "planets.json": { items: [] },
    "ranking.json": { items: [] },
  };
  page.on("request", request => {
    if (request.url().includes("/sky/data/")) dataRequests.push(new URL(request.url()).pathname);
  });
  await page.route("**/sky/data/*.json", route => {
    const name = new URL(route.request().url()).pathname.split("/").pop();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(fixtures[name] || {}),
    });
  });

  await page.goto("/widget-host/", { waitUntil: "domcontentloaded" });
  await page.evaluate(async ({ quietOptions: options, quietUI: ui }) => {
    const { createCatalogRegistry } = await import("/shared/widget-catalog.mjs");
    const { createNebulacast } = await import("/shared/widget-runtime.mjs");
    let current = {
      observer: { name: "Warsaw", lat: 52.2297, lon: 21.0122, timezone: "Europe/Warsaw" },
      time: { mode: "live", datetimeISO: "2026-09-10T19:00:00Z" },
    };
    const listeners = new Set();
    const context = {
      get: () => structuredClone(current),
      subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
      update(patch = {}) {
        current = {
          ...current,
          ...structuredClone(patch),
          observer: patch.observer ? { ...current.observer, ...structuredClone(patch.observer) } : current.observer,
          time: patch.time ? { ...current.time, ...structuredClone(patch.time) } : current.time,
        };
        const next = structuredClone(current);
        for (const listener of [...listeners]) listener(next);
      },
    };
    const runtime = createNebulacast({
      context,
      resolveAutoOrientation: ({ root }) => root.getBoundingClientRect().width < 520 ? "vertical" : "horizontal",
    });
    const firstRoot = document.createElement("section");
    const secondRoot = document.createElement("section");
    firstRoot.id = "sky-browser-one";
    secondRoot.id = "sky-browser-two";
    for (const root of [firstRoot, secondRoot]) {
      root.style.height = "360px";
      root.style.border = "1px solid transparent";
    }
    firstRoot.style.width = "720px";
    secondRoot.style.width = "360px";
    document.body.append(firstRoot, secondRoot);

    const first = await runtime.mount(firstRoot, { widget: "sky", config: { orientation: "auto", options, ui } });
    const second = await runtime.mount(secondRoot, { widget: "sky", config: { orientation: "auto", options, ui } });
    window.__skyBrowserContract = { context, runtime, firstRoot, secondRoot, first, second, options, ui };
  }, { quietOptions, quietUI });

  const first = page.locator("#sky-browser-one");
  const second = page.locator("#sky-browser-two");
  await expect(first).toHaveAttribute("data-nc-orientation", "horizontal");
  await expect(second).toHaveAttribute("data-nc-orientation", "vertical");
  await expect(first.locator("canvas.sky-canvas")).toBeVisible();
  await expect(second.locator("canvas.sky-canvas")).toBeVisible();
  await expect(first.locator(".sky-status")).toContainText("lat 52.23°");
  await expect(second.locator(".sky-status")).toContainText("stars");
  await expect.poll(() => dataRequests.filter(path => path.endsWith("/ranking.json")).length).toBeGreaterThan(0);

  await page.evaluate(() => {
    const contract = window.__skyBrowserContract;
    contract.context.update({
      observer: { name: "Prague", lat: 50.0755, lon: 14.4378, timezone: "Europe/Prague" },
      time: { datetimeISO: "2026-09-11T19:00:00Z" },
    });
    contract.secondRoot.style.width = "720px";
    contract.second.update({ orientation: "auto" });
    contract.second.resize();
  });
  await expect(second).toHaveAttribute("data-nc-orientation", "horizontal");
  await expect(first.locator(".sky-status")).toContainText("lat 50.08°");
  await expect(second.locator(".sky-status")).toContainText("lon 14.44°");

  await page.evaluate(() => {
    const contract = window.__skyBrowserContract;
    contract.first.destroy();
    contract.first.destroy();
  });
  await expect(first).not.toHaveAttribute("data-nc-widget");
  await expect(second).toHaveAttribute("data-nc-widget", "sky");

  await page.evaluate(async () => {
    const contract = window.__skyBrowserContract;
    contract.first = await contract.runtime.mount(contract.firstRoot, {
      widget: "sky",
      config: { orientation: "vertical", options: contract.options, ui: contract.ui },
    });
  });
  await expect(first).toHaveAttribute("data-nc-orientation", "vertical");
  await expect(first.locator("canvas.sky-canvas")).toBeVisible();

  await page.evaluate(() => {
    const contract = window.__skyBrowserContract;
    contract.first.destroy();
    contract.second.destroy();
  });
  await expect(first).not.toHaveAttribute("data-nc-widget");
  await expect(second).not.toHaveAttribute("data-nc-widget");
});
