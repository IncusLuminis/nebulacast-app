import { test, expect } from "@playwright/test";

const alertsPayload = { items: [{ id: "embed-alert", group: "risk", title: "Embed alert" }] };
const eventsPayload = { items: [{ title: "Embed meteor", category: "METEORS", published_at: "2099-01-02T12:00:00Z", url: "https://example.test/meteor", summary: "Embed event" }] };

test("JavaScript embed canary mounts Alerts and Events in fixed/responsive/narrow roots", async ({ page }) => {
  await page.route("**/sky/data/alerts_now.json", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(alertsPayload),
  }));
  await page.route("**/calendar/daily_signal.json", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(eventsPayload),
  }));
  await page.goto("/embed/javascript-canary.html", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#embed-alerts-fixed")).toHaveAttribute("data-nc-widget", "alerts");
  await expect(page.locator("#embed-events-responsive")).toHaveAttribute("data-nc-widget", "events");
  await expect(page.locator("#embed-alerts-narrow")).toHaveAttribute("data-nc-widget", "alerts");
  await expect(page.locator("#embed-alerts-fixed")).toHaveAttribute("data-nc-state", "ready");
  await expect(page.locator("#embed-events-responsive")).toHaveAttribute("data-nc-state", "ready");
  await expect(page.locator("#embed-alerts-narrow")).toHaveAttribute("data-nc-orientation", "vertical");
  await expect(page.locator("#embed-alerts-fixed [data-role='item']")).toHaveCount(1);
  await expect(page.locator("#embed-events-responsive [data-role='list'] .nrc-card")).toHaveCount(1);
  await expect(page.locator('link[data-nc-embed-stylesheet="alerts"]')).toHaveCount(1);
  await expect(page.locator('link[data-nc-embed-stylesheet="events"]')).toHaveCount(1);
  await expect(page.locator(".embed-fixed")).toHaveCount(1);
  await expect(page.locator(".embed-responsive")).toHaveCount(1);
  await expect(page.locator(".embed-narrow")).toHaveCount(1);
  await expect(page.locator("iframe")).toHaveCount(0);
});

test("external-style v1 fixture imports, mounts, updates, and destroys Weather safely", async ({ page }) => {
  const weatherRequests = [];
  await page.route("**/api/astro-weather*", route => {
    weatherRequests.push(route.request().url());
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        source: "fixture",
        generated_at: "2099-01-01T00:00:00Z",
        location: { name: "Warsaw", lat: 52.2297, lon: 21.0122, tz: "Europe/Warsaw" },
        horizon_hours: 1,
        profiles: ["balanced", "visual"],
        default_profile: "balanced",
        hours: [],
      }),
    });
  });
  await page.goto("/embed/javascript-weather-canary.html", { waitUntil: "domcontentloaded" });

  const root = page.locator("#weather-root");
  await expect(page.locator("#invalid-status")).toContainText("Invalid config rejected");
  await expect(root).toHaveAttribute("data-nc-widget", "weather");
  await expect(root).toHaveAttribute("data-nc-orientation", "vertical");
  await expect(page.locator('link[data-nc-embed-stylesheet="weather"]')).toHaveCount(1);
  await expect.poll(() => weatherRequests.length).toBeGreaterThan(0);
  expect(weatherRequests[0]).toContain("profile=balanced");

  await page.getByRole("button", { name: "Update profile" }).click();
  await expect(page.locator("#embed-status")).toHaveText("Weather updated.");
  await expect.poll(() => weatherRequests.some(url => url.includes("profile=visual"))).toBeTruthy();

  await page.getByRole("button", { name: "Destroy widget" }).click();
  await expect(root).not.toHaveAttribute("data-nc-widget");
  await expect(page.locator('link[data-nc-embed-stylesheet="weather"]')).toHaveCount(0);
  await expect(page.locator("#embed-status")).toHaveText("Weather destroyed.");
});

test("JavaScript embed rejects malicious HTML, executable values, and arbitrary modules", async ({ page }) => {
  await page.goto("/embed/javascript-canary.html", { waitUntil: "domcontentloaded" });
  const rejected = await page.evaluate(async () => {
    const { mount } = await import("/widgets/runtime/index.mjs");
    const root = document.createElement("div");
    document.body.append(root);
    const specifications = [
      { widget: "weather", config: { html: "<img src=x onerror=alert(1)>" } },
      { widget: "weather", config: { onMount: "alert(1)" } },
      { widget: "weather", config: { loader: "https://evil.example/widget.mjs" } },
      { widget: "weather", config: { moduleUrl: "https://evil.example/widget.mjs" } },
    ];
    return Promise.all(specifications.map(async specification => {
      try {
        await mount(root, specification);
        return false;
      } catch (_) {
        return true;
      }
    }));
  });
  expect(rejected).toEqual([true, true, true, true]);
  await expect(page.locator("body")).not.toContainText("evil.example");
});
