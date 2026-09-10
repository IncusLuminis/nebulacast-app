import { test, expect } from "@playwright/test";

test("real catalog Map adapter keeps iframe, observer, lifecycle, and route boundaries", async ({ page }) => {
  const importedMap2 = [];
  page.on("request", request => {
    if (request.url().includes("map2.js")) importedMap2.push(request.url());
  });
  await page.route("**/widget-host/map-poc.html", route => route.fulfill({
    status: 200,
    contentType: "text/html",
    body: `<!doctype html><html><body><output id="map-message"></output><script>
      addEventListener("message", event => {
        if (event.data?.type === "update-location") {
          document.querySelector("#map-message").textContent = JSON.stringify(event.data);
          parent.postMessage({ type: "map-test-message", message: event.data }, "*");
        }
      });
    <\/script></body></html>`,
  }));
  await page.goto("/widget-host/", { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => {
    const { createCatalogRegistry } = await import("/shared/widget-catalog.mjs");
    const { createNebulacast } = await import("/shared/widget-runtime.mjs");
    let current = {
      observer: { name: "Warsaw", lat: 52.2297, lon: 21.0122, timezone: "Europe/Warsaw", source: "fixture" },
      time: { mode: "live", datetimeISO: null },
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
        };
        const next = structuredClone(current);
        for (const listener of [...listeners]) listener(next);
        return next;
      },
    };
    const runtime = createNebulacast({ context, registry: createCatalogRegistry() });
    const firstRoot = document.createElement("section");
    const secondRoot = document.createElement("section");
    firstRoot.dataset.testId = "map-one";
    secondRoot.dataset.testId = "map-two";
    document.body.append(firstRoot, secondRoot);
    const sentinel = document.createElement("p");
    sentinel.dataset.testId = "map-sentinel";
    sentinel.textContent = "Outside map sentinel";
    sentinel.style.color = "rgb(18, 52, 86)";
    document.body.append(sentinel);

    const first = await runtime.mount(firstRoot, {
      widget: "map",
      config: { orientation: "horizontal", theme: "dark", density: "compact", profile: "visual" },
    });
    const second = await runtime.mount(secondRoot, {
      widget: "map",
      config: { orientation: "vertical", theme: "light", density: "comfortable", profile: "planetary" },
    });
    window.__mapPlatform = { context, runtime, firstRoot, secondRoot, first, second };
  });

  const firstRoot = page.locator('[data-test-id="map-one"]');
  const secondRoot = page.locator('[data-test-id="map-two"]');
  await expect(firstRoot).toHaveAttribute("data-nc-widget", "map");
  await expect(secondRoot).toHaveAttribute("data-nc-widget", "map");
  await expect(firstRoot).toHaveAttribute("data-nc-orientation", "horizontal");
  await expect(secondRoot).toHaveAttribute("data-nc-orientation", "vertical");
  await expect(firstRoot.locator("iframe")).toHaveAttribute("src", "./map-poc.html");
  await expect(secondRoot.locator("iframe")).toHaveAttribute("src", "./map-poc.html");
  await expect.poll(() => page.evaluate(() => ({
    first: document.querySelector('[data-test-id="map-one"] iframe')?.contentDocument?.querySelector("#map-message")?.textContent || "",
    second: document.querySelector('[data-test-id="map-two"] iframe')?.contentDocument?.querySelector("#map-message")?.textContent || "",
  }))).toEqual({
    first: '{"type":"update-location","location":{"name":"Warsaw","lat":52.2297,"lon":21.0122}}',
    second: '{"type":"update-location","location":{"name":"Warsaw","lat":52.2297,"lon":21.0122}}',
  });

  await page.evaluate(() => {
    const contract = window.__mapPlatform;
    contract.first.update({ profile: "balanced" });
    contract.first.resize({ width: 320, height: 180 });
    contract.first.refresh();
    contract.context.update({ observer: {
      name: "Prague", lat: 50.0755, lon: 14.4378, timezone: "Europe/Prague", source: "host",
    } });
  });
  await expect.poll(() => page.evaluate(() => ({
    first: document.querySelector('[data-test-id="map-one"] iframe')?.contentDocument?.querySelector("#map-message")?.textContent || "",
    second: document.querySelector('[data-test-id="map-two"] iframe')?.contentDocument?.querySelector("#map-message")?.textContent || "",
    profile: window.__mapPlatform.first.config.profile,
    secondProfile: window.__mapPlatform.second.config.profile,
  }))).toEqual({
    first: '{"type":"update-location","location":{"name":"Prague","lat":50.0755,"lon":14.4378}}',
    second: '{"type":"update-location","location":{"name":"Prague","lat":50.0755,"lon":14.4378}}',
    profile: "balanced",
    secondProfile: "planetary",
  });

  const sentinel = page.locator('[data-test-id="map-sentinel"]');
  await expect(sentinel).toHaveText("Outside map sentinel");
  await expect(sentinel).not.toHaveAttribute("data-nc-widget");
  await expect(sentinel).toHaveCSS("color", "rgb(18, 52, 86)");

  await page.evaluate(() => {
    const contract = window.__mapPlatform;
    contract.first.destroy();
    contract.first.destroy();
    contract.context.update({ observer: {
      name: "Gdansk", lat: 54.352, lon: 18.6466, timezone: "Europe/Warsaw", source: "host",
    } });
  });
  await expect(firstRoot).not.toHaveAttribute("data-nc-widget");
  await expect(secondRoot).toHaveAttribute("data-nc-widget", "map");
  await expect.poll(() => page.evaluate(() => document
    .querySelector('[data-test-id="map-two"] iframe')?.contentDocument?.querySelector("#map-message")?.textContent || "")).toBe(
    '{"type":"update-location","location":{"name":"Gdansk","lat":54.352,"lon":18.6466}}',
  );

  await page.evaluate(async () => {
    const contract = window.__mapPlatform;
    contract.first = await contract.runtime.mount(contract.firstRoot, {
      widget: "map",
      config: { orientation: "horizontal", theme: "dark", density: "compact", profile: "remounted" },
    });
  });
  await expect(firstRoot).toHaveAttribute("data-nc-widget", "map");
  await expect.poll(() => page.evaluate(() => document
    .querySelector('[data-test-id="map-one"] iframe')?.contentDocument?.querySelector("#map-message")?.textContent || "")).toBe(
    '{"type":"update-location","location":{"name":"Gdansk","lat":54.352,"lon":18.6466}}',
  );

  await page.evaluate(() => {
    const contract = window.__mapPlatform;
    contract.first.destroy();
    contract.second.destroy();
  });
  await expect(firstRoot).not.toHaveAttribute("data-nc-widget");
  await expect(secondRoot).not.toHaveAttribute("data-nc-widget");
  expect(importedMap2).toEqual([]);
});

test("map route sources are statically compatible with the browser entrypoint", async ({ request }) => {
  const mapPoc = await request.get("/weather/map-poc.html");
  const map1 = await request.get("/weather/map1.html?lat=50.0755&lon=14.4378");
  const standalone = await request.get("/map/");
  expect(mapPoc.ok()).toBeTruthy();
  expect(map1.ok()).toBeTruthy();
  expect(standalone.ok()).toBeTruthy();
  expect(await mapPoc.text()).toContain('event.data.type === "update-location"');
  expect(await map1.text()).toContain("target.search = window.location.search");
  expect(await standalone.text()).toContain('src="/weather/map-poc.html"');
});
