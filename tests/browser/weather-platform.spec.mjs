import { test, expect } from "@playwright/test";

function weatherPayload(url) {
  const request = new URL(url);
  const lat = Number(request.searchParams.get("lat"));
  const lon = Number(request.searchParams.get("lon"));
  const name = request.searchParams.get("name") || "Fixture";
  const hours = [0, 1, 2, 3].map(offset => ({
    time: `2026-09-09T${String(offset).padStart(2, "0")}:00:00Z`,
    score: 72 - offset,
    sun_alt_deg: -20,
    moon_alt_deg: 12 + offset,
    cloud_total: 10 + offset,
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
    location: { name, lat, lon, tz: request.searchParams.get("tz") || "Europe/Warsaw" },
    horizon_hours: hours.length,
    profiles: ["balanced", "visual", "broadband", "planetary"],
    default_profile: "balanced",
    hours,
  };
}

test("Weather platform fixture preserves independent roots and lifecycle", async ({ page }) => {
  const consoleErrors = [];
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", error => consoleErrors.push(error.message));
  await page.route("**/api/astro-weather**", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(weatherPayload(route.request().url())),
  }));
  await page.route("**/sky/data/sun_moon.json**", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ frames: [] }),
  }));

  await page.goto("/widget-host/weather.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.weatherHost));

  await expect(page.locator("#weather-wide")).toHaveAttribute("data-nc-orientation", "horizontal");
  await expect(page.locator("#weather-narrow")).toHaveAttribute("data-nc-orientation", "vertical");
  await expect(page.locator("#weather-wide")).toHaveAttribute("data-nc-widget", "weather");
  await expect(page.locator("#weather-narrow")).toHaveAttribute("data-nc-widget", "weather");
  await expect(page.locator("#weather-sentinel")).toHaveText("Outside weather widget sentinel");

  const profiles = await page.evaluate(() => Object.values(window.weatherHost.instances).map(instance => instance.config.profile));
  expect(profiles).toEqual(["visual", "planetary"]);

  await page.evaluate(() => window.weatherHost.destroy("wide"));
  await expect(page.locator("#weather-wide")).not.toHaveAttribute("data-nc-widget", "weather");
  await expect(page.locator("#weather-narrow")).toHaveAttribute("data-nc-widget", "weather");

  await page.evaluate(() => window.weatherHost.remount("wide"));
  await expect(page.locator("#weather-wide")).toHaveAttribute("data-nc-widget", "weather");
  expect(consoleErrors).toEqual([]);
});
