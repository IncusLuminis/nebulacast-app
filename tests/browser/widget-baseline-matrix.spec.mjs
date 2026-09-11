import { test, expect } from "@playwright/test";

const weatherFixture = {
  ok: true,
  source: "baseline-fixture",
  generated_at: "2026-09-11T00:00:00Z",
  location: { name: "Warsaw", lat: 52.2297, lon: 21.0122, tz: "Europe/Warsaw" },
  horizon_hours: 4,
  profiles: ["balanced", "visual", "broadband", "planetary"],
  default_profile: "balanced",
  hours: [0, 1, 2, 3].map(offset => ({
    time: `2026-09-11T${String(offset).padStart(2, "0")}:00:00Z`, score: 72 - offset,
    sun_alt_deg: -20, moon_alt_deg: 12 + offset, cloud_total: 10, cloud_low: 5,
    cloud_mid: 5, cloud_high: 5, temp_c: 16, wind_m_s: 2, visibility_m: 20000,
    precip_mm: 0, precip_prob: 0, pressure_hpa: 1012, seeing: 2, transparency: 2,
    humidity_pct: 60, gate: "OPEN",
  })),
};

const skyFixtures = {
  "stars.json": { stars: [] }, "constellations.json": { constellations: [] },
  "milkyway.json": { points: [] }, "objects_today.json": { items: [] },
  "alerts_now.json": { items: [] }, "sun_moon.json": { frames: [] },
  "dso_messier.json": { items: [] }, "planets.json": { items: [] },
  "ranking.json": { items: [] },
};

const newsFixture = "<rss><channel><item><title>Baseline News</title><link>https://example.test/news</link><pubDate>2026-09-11T00:00:00Z</pubDate><category>Science</category><description>Baseline item</description></item></channel></rss>";
const calendarFixture = { items: [{ title: "Baseline Meteor", category: "METEORS", published_at: "2099-01-01", url: "https://example.test/meteor", summary: "Baseline event" }] };

function json(route, body, status = 200) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

async function skyRoutes(page, broken = null) {
  await page.route("**/sky/data/*.json", route => {
    const name = new URL(route.request().url()).pathname.split("/").pop();
    return name === broken ? json(route, { error: "baseline fixture failure" }, 503) : json(route, skyFixtures[name] || {});
  });
}

async function consoleRoutes(page, failure = false) {
  await page.route("**/api/**", route => failure
    ? json(route, { error: "baseline fixture failure" }, 503)
    : json(route, route.request().url().includes("observer-weather") ? {} : weatherFixture));
  await page.route("**/news/rss.xml**", route => route.fulfill({ status: 200, contentType: "application/rss+xml", body: newsFixture }));
  await page.route("**/calendar/daily_signal.json", route => json(route, calendarFixture));
  await skyRoutes(page);
}

async function weatherRoutes(page, failure = false) {
  const handler = route => failure ? json(route, { error: "baseline fixture failure" }, 503) : json(route, weatherFixture);
  await page.route("**/api/astro-weather**", handler);
  await page.route("**/weather.json", handler);
  await page.route("**/sky/data/sun_moon.json", route => json(route, { frames: [] }));
}

async function newsRoutes(page, failure = false) {
  await page.route("**/news/rss.xml**", route => failure
    ? route.fulfill({ status: 503, contentType: "application/json", body: "{}" })
    : route.fulfill({ status: 200, contentType: "application/rss+xml", body: newsFixture }));
  await page.route("https://api.allorigins.win/**", route => route.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
}

async function calendarRoutes(page, failure = false) {
  await page.route("**/calendar/daily_signal.json", route => failure
    ? json(route, { error: "baseline fixture failure" }, 503)
    : json(route, calendarFixture));
}

test.describe("Issue #67 public route matrix", () => {
  test("/index.html Console: route, normal shell, resize, time and API error", async ({ page, context }) => {
    await consoleRoutes(page);
    await page.goto("/index.html", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#console-hero")).toHaveAttribute("data-nc-widget", "hero", { timeout: 15_000 });
    await page.setViewportSize({ width: 720, height: 900 });
    await page.evaluate(() => window.dispatchEvent(new Event("resize")));
    await expect(page.locator("#console-hero")).toBeVisible();
    await expect(page.locator("#cb-time")).toHaveText("LIVE");
    await page.locator("#cb-next-hour").click();
    await expect(page.locator("#cb-time")).not.toHaveText("LIVE");
    const failed = await context.newPage();
    await consoleRoutes(failed, true);
    await failed.goto("/index.html", { waitUntil: "domcontentloaded" });
    await expect(failed.locator("#console-hero")).toHaveAttribute("data-nc-state", "ready", { timeout: 15_000 });
    await expect(failed.locator("#w-weather")).toContainText(/Failed to load weather|API error|Invalid JSON/, { timeout: 15_000 });
    await failed.close();
  });

  test("/weather/ Weather: route, normal load, resize, observer and API error", async ({ page, context }) => {
    await weatherRoutes(page);
    await page.goto("/weather/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#w-location .loc-status-content")).toContainText("Warsaw", { timeout: 15_000 });
    await expect(page.locator("#w-weather #poc-weather")).toBeVisible({ timeout: 15_000 });
    await page.setViewportSize({ width: 390, height: 760 });
    await page.evaluate(() => window.dispatchEvent(new Event("resize")));
    await page.locator("#w-location .loc-input").fill("50.0755, 14.4378");
    await expect(page.locator("#w-location .loc-status-content")).toContainText("50.0755", { timeout: 5_000 });
    const failed = await context.newPage();
    await weatherRoutes(failed, true);
    await failed.goto("/weather/", { waitUntil: "domcontentloaded" });
    await expect(failed.locator("#w-weather")).toContainText(/Failed to load weather|API error|Invalid JSON/, { timeout: 15_000 });
    await failed.close();
  });

  test("/sky/ standalone Sky: route, normal load, resize, query observer/time and data error", async ({ page, context }) => {
    await skyRoutes(page);
    await page.goto("/sky/?lat=40.7128&lon=-74.0060&datetime=2026-09-12T01:00:00Z", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#skyMount canvas.sky-canvas")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("#skyMount .sky-status")).toContainText("lat 40.71°", { timeout: 15_000 });
    await page.setViewportSize({ width: 390, height: 700 });
    await page.evaluate(() => window.dispatchEvent(new Event("resize")));
    await expect(page.locator("#skyMount canvas.sky-canvas")).toBeVisible();
    const failed = await context.newPage();
    await skyRoutes(failed, "stars.json");
    await failed.goto("/sky/", { waitUntil: "domcontentloaded" });
    await expect(failed.locator("#skyMount .sky-status")).toHaveText("Failed to load sky data", { timeout: 15_000 });
    await failed.close();
  });

  test("/news/ News: route, normal load, resize/filter and RSS error", async ({ page, context }) => {
    await newsRoutes(page);
    await page.goto("/news/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#nrw-root-page [data-role=list] .nrw-card")).toHaveCount(1, { timeout: 15_000 });
    await page.setViewportSize({ width: 390, height: 700 });
    await expect(page.locator("#nrw-root-page .nrw-filter").first()).toBeVisible();
    await page.locator("#nrw-root-page .nrw-filter").filter({ hasText: "Science" }).click();
    await expect(page.locator("#nrw-root-page [data-role=list]")).toContainText("Baseline News");
    const failed = await context.newPage();
    await newsRoutes(failed, true);
    await failed.goto("/news/", { waitUntil: "domcontentloaded" });
    await expect(failed.locator("#nrw-root-page .nrw-error")).toContainText("RSS fetch failed", { timeout: 15_000 });
    await failed.close();
  });

  test("/calendar/ Calendar: route, normal load, resize/filter and data error", async ({ page, context }) => {
    await calendarRoutes(page);
    await page.goto("/calendar/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#nrc-root-page [data-role=list] .nrc-card")).toHaveCount(1, { timeout: 15_000 });
    await page.setViewportSize({ width: 390, height: 700 });
    await expect(page.locator("#nrc-root-page .nrc-filter").first()).toBeVisible();
    await page.locator("#nrc-root-page .nrc-filter").filter({ hasText: "METEORS" }).click();
    await expect(page.locator("#nrc-root-page [data-role=list]")).toContainText("Baseline Meteor");
    const failed = await context.newPage();
    await calendarRoutes(failed, true);
    await failed.goto("/calendar/", { waitUntil: "domcontentloaded" });
    await expect(failed.locator("#nrc-root-page [data-role=list]")).toContainText("Failed to load calendar", { timeout: 15_000 });
    await failed.close();
  });
});
