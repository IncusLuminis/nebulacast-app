import { test, expect } from "@playwright/test";

test("Helio, Calendar, and Sun routes mount registered Runtime widgets", async ({ page }) => {
  await page.route("**/calendar/daily_signal.json", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ items: [{ title: "Runtime event", category: "METEORS", published_at: "2099-01-02T12:00:00Z", url: "https://example.test/event", summary: "Runtime fixture" }] }),
  }));
  await page.route("**/sky/data/sun_moon.json", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ schema: "sun_moon.v2", frames: [] }),
  }));

  await page.goto("/helio/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#w-helio")).toHaveAttribute("data-nc-widget", "space-weather");
  await expect(page.locator("#w-helio")).toHaveAttribute("data-nc-orientation", "horizontal");
  await expect(page.locator("#page-error")).toBeHidden();

  await page.goto("/calendar/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#nrc-root-page")).toHaveAttribute("data-nc-widget", "events");
  await expect(page.locator("#nrc-root-page [data-role=list] .nrc-card")).toHaveCount(1);
  await expect(page.locator("#nrc-root-page")).toHaveAttribute("data-nc-orientation", "horizontal");

  await page.goto("/sun/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#w-sun")).toHaveAttribute("data-nc-widget", "sun-moon");
  await expect(page.locator("#w-sun")).toHaveAttribute("data-nc-orientation", "horizontal");
});
