import { test, expect } from "@playwright/test";

function observingWindowPayload() {
  const start = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const hours = Array.from({ length: 4 }, (_, index) => {
    const timestamp = new Date(start.getTime() + index * 60 * 60 * 1000).toISOString();
    return {
      timestamp_utc: timestamp,
      night: true,
      cloud: { total_percent: 20 + index * 5 },
      air: { temperature_c: 12 - index, dewpoint_c: 8 },
      wind: { speed_mps: 2 + index },
      pressure_hpa: 1015 - index,
    };
  });
  return {
    ok: true,
    source: "browser-fixture",
    hourly: hours,
    decision: { best_tonight: { start: hours[0].timestamp_utc, end: hours[2].timestamp_utc } },
  };
}

test("Dashboard Best observing window is a root-scoped Runtime widget", async ({ page }) => {
  const payload = observingWindowPayload();
  await page.route("**/api/observer-weather**", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(payload),
  }));
  await page.route("**/sky/data/sun_moon.json", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ schema: "sun_moon.v2", frames: [] }),
  }));
  await page.route("**/data/helio_now.json", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({}),
  }));

  await page.goto("/", { waitUntil: "domcontentloaded" });
  const windowRoot = page.locator("#dbp-window-body");
  await expect(windowRoot).toHaveAttribute("data-nc-widget", "observing-window");
  await expect(windowRoot).toHaveAttribute("data-nc-state", "ready", { timeout: 15_000 });
  await expect(windowRoot.locator(".dbp-window-chart .nop-bar")).toHaveCount(4);
  await page.locator("#console-hero .hero-card[data-panel=window]").click();
  await expect(page.locator("#dbp-window")).toBeVisible();
  await expect(windowRoot.locator(".dbp-window-chip[data-wmetric=cloud]")).toHaveClass(/dbp-window-chip/);
  await windowRoot.locator(".dbp-window-chip[data-wmetric=cloud]").click();
  await expect(windowRoot.locator(".dbp-window-chip[data-wmetric=cloud]")).toHaveClass(/is-active/);
  await expect(page.locator("#dbp-window-body")).not.toHaveAttribute("data-inline-renderer", /.*/);
});
