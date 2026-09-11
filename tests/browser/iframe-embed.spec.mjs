import { test, expect } from "@playwright/test";

const weatherPayload = {
  ok: true,
  source: "fixture",
  generated_at: "2099-01-01T00:00:00Z",
  location: { name: "Warsaw", lat: 52.2297, lon: 21.0122, tz: "Europe/Warsaw" },
  horizon_hours: 1,
  profiles: ["balanced"],
  default_profile: "balanced",
  hours: [],
};

test("generic iframe output works in a foreign-style host and preserves same-origin observer APIs", async ({ page }) => {
  const weatherRequests = [];
  await page.route("**/api/astro-weather*", route => {
    weatherRequests.push(route.request().url());
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(weatherPayload),
    });
  });
  await page.goto("/embed/iframe-canary.html", { waitUntil: "domcontentloaded" });

  const valid = page.locator("#valid-weather");
  await expect(valid).toHaveAttribute("loading", "lazy");
  await expect(valid).toHaveAttribute("width", "100%");
  await expect(valid).toHaveAttribute("height", "600");
  await expect(valid.contentFrame().locator("#widget-root")).toHaveAttribute("data-nc-widget", "weather");
  await expect(valid.contentFrame().locator("#widget-root")).toHaveAttribute("data-nc-orientation", "vertical");
  await expect(valid.contentFrame().locator("#widget-root")).toHaveAttribute("data-nc-theme", "dark");
  await expect(valid.contentFrame().locator("#widget-root")).toHaveAttribute("data-nc-density", "compact");
  await expect.poll(() => weatherRequests.length).toBeGreaterThan(0);
  expect(weatherRequests.every(url => new URL(url).origin === "http://127.0.0.1:8080")).toBeTruthy();
  expect(weatherRequests.every(url => new URL(url).searchParams.get("lat") === "52.2297")).toBeTruthy();

  const invalid = page.locator("#invalid-weather");
  await expect(invalid.contentFrame().locator("#host-status")).toHaveAttribute("data-state", "error");
  await expect(invalid.contentFrame().locator("#host-status")).toContainText("Unsupported standalone widget parameter");
  await expect(invalid.contentFrame().locator("#widget-root")).not.toHaveAttribute("data-nc-widget");
  await expect(invalid.contentFrame().locator('link[data-nc-standalone-stylesheet]')).toHaveCount(0);
});
