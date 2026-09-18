import { test, expect } from "@playwright/test";

// Future runner: `npm run test:browser -- tests/browser/location-platform.spec.mjs`.
// The Node contract suite is the required deterministic validation when
// Playwright or its browser binaries are unavailable.
test("Location platform adapter uses the public Runtime contract", async ({ page }) => {
  const diagnostics = [];
  page.on("console", message => {
    if (message.type() === "error") diagnostics.push(`console: ${message.text()}`);
  });
  page.on("pageerror", error => diagnostics.push(`pageerror: ${error.message}`));
  await page.goto("/widget-host/", { waitUntil: "domcontentloaded" });

  try {
    await page.evaluate(async () => {
      const { createCatalogRegistry } = await import("/shared/widget-catalog.mjs");
      const { createNebulacast } = await import("/shared/widget-runtime.mjs");

      function createContext(initial) {
        let current = structuredClone(initial);
        const listeners = new Set();
        return {
          get: () => structuredClone(current),
          getObserver: () => structuredClone(current.observer || {}),
          subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
          },
          update(patch) {
            if (patch.observer) current.observer = { ...(current.observer || {}), ...structuredClone(patch.observer) };
            if (patch.time) current.time = { ...(current.time || {}), ...structuredClone(patch.time) };
            const next = structuredClone(current);
            for (const listener of [...listeners]) listener(next);
            return next;
          },
        };
      }

      const fetchMock = async url => ({
        ok: true,
        json: async () => url.startsWith("/api/astro-weather") ? { ok: true } : {},
      });
      const copied = [];
      const context = createContext({
        observer: { name: "Warsaw", lat: 52.2297, lon: 21.0122, timezone: "Europe/Warsaw", source: "url" },
        time: { mode: "live", datetimeISO: null },
      });
      const registry = createCatalogRegistry();
      const runtime = createNebulacast({
        context,
        registry,
        resolveAutoOrientation: ({ root }) => root.dataset.orientation || "horizontal",
      });
      const firstRoot = document.createElement("section");
      const secondRoot = document.createElement("section");
      firstRoot.setAttribute("role", "region");
      firstRoot.setAttribute("aria-label", "First Location");
      secondRoot.setAttribute("role", "region");
      secondRoot.setAttribute("aria-label", "Second Location");
      firstRoot.dataset.orientation = "horizontal";
      secondRoot.dataset.orientation = "vertical";
      const sentinel = document.createElement("p");
      sentinel.textContent = "Outside Location sentinel";
      sentinel.style.color = "rgb(18, 52, 86)";
      document.body.append(firstRoot, secondRoot, sentinel);

      const config = root => ({
        fetch: fetchMock,
        checkAPIStatus: false,
        window,
        navigator,
        clipboard: { writeText: async url => copied.push(url) },
        urlParams: { profile: "visual", range: "48h" },
        orientation: root === firstRoot ? "auto" : "vertical",
      });
      const first = await runtime.mount(firstRoot, { widget: "location", config: config(firstRoot) });
      const second = await runtime.mount(secondRoot, { widget: "location", config: config(secondRoot) });
      const hostContext = createContext({ time: { mode: "live" } });
      const hostRoot = document.createElement("section");
      hostRoot.setAttribute("role", "region");
      hostRoot.setAttribute("aria-label", "Host Context Location");
      document.body.append(hostRoot);
      const hostRender = snapshot => {
        const observer = snapshot.observer || {};
        hostRoot.textContent = observer.name
          ? `Host context: ${observer.name} · ${observer.timezone || "UTC"}`
          : "Host context: No location selected";
      };
      hostRender(hostContext.get());
      const hostUnsubscribe = hostContext.subscribe(hostRender);
      window.__locationContract = {
        context,
        first,
        second,
        firstRoot,
        secondRoot,
        hostContext,
        hostRoot,
        hostUnsubscribe,
        copied,
        runtime,
        fetchMock,
        firstConfig: config(firstRoot),
      };
    });

    const first = page.getByRole("region", { name: "First Location" });
    const second = page.getByRole("region", { name: "Second Location" });
    const host = page.getByRole("region", { name: "Host Context Location" });
    await expect(first).toHaveAttribute("data-nc-widget", "location");
    await expect(second).toHaveAttribute("data-nc-widget", "location");
    await expect(first).toHaveAttribute("data-nc-orientation", "horizontal");
    await expect(second).toHaveAttribute("data-nc-orientation", "vertical");
    await expect(first).toContainText("Warsaw");
    await expect(host).toContainText("No location selected");

    await page.evaluate(() => {
      const contract = window.__locationContract;
      contract.first.resize({ width: 320, height: 180 });
      contract.context.update({ observer: {
        name: "Prague", lat: 50.0755, lon: 14.4378, timezone: "Europe/Prague", source: "host",
      } });
      contract.hostContext.update({ observer: {
        name: "Host supplied", lat: 51.1079, lon: 17.0385, timezone: "Europe/Warsaw", source: "host",
      } });
    });
    await expect(first).toContainText("Prague");
    await expect(second).toContainText("Prague");
    await expect(host).toContainText("Host supplied");

    const sentinel = page.getByText("Outside Location sentinel", { exact: true });
    await expect(sentinel).not.toHaveClass(/nc-widget/);
    await expect(sentinel).not.toHaveAttribute("data-nc-widget");
    await expect(sentinel).toHaveCSS("color", "rgb(18, 52, 86)");

    await page.evaluate(() => {
      const contract = window.__locationContract;
      contract.firstRoot.querySelector(".loc-share-button").click();
    });
    await expect.poll(() => page.evaluate(() => window.__locationContract.copied[0] || "")).toMatch(/lat=50\.0755/);
    await expect.poll(() => page.evaluate(() => window.__locationContract.copied[0] || "")).toMatch(/tz=Europe%2FPrague/);
    await expect.poll(() => page.evaluate(() => window.__locationContract.copied[0] || "")).toMatch(/profile=visual/);

    await page.evaluate(() => window.__locationContract.first.destroy());
    await expect(first).not.toHaveAttribute("data-nc-widget");
    await expect(second).toHaveAttribute("data-nc-widget", "location");
    await page.evaluate(async () => {
      const contract = window.__locationContract;
      contract.remounted = await contract.runtime.mount(contract.firstRoot, {
        widget: "location",
        config: contract.firstConfig,
      });
    });
    await expect(first).toHaveAttribute("data-nc-widget", "location");
    await expect(first).toHaveAttribute("data-nc-state", "ready");
    await page.evaluate(() => {
      const contract = window.__locationContract;
      contract.remounted.destroy();
      contract.second.destroy();
      contract.hostUnsubscribe();
      contract.hostRoot.remove();
      contract.firstRoot.remove();
      contract.secondRoot.remove();
    });
  } catch (error) {
    error.message += `\nBrowser diagnostics:\n${diagnostics.join("\n") || "none"}`;
    throw error;
  }
});
