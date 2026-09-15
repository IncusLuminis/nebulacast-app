import { test, expect } from "@playwright/test";

test("Weather route is composed by Runtime and keeps Sky square", async ({ page }) => {
  const legacyRequests = [];
  page.on("request", request => {
    if (request.url().includes("legacy-bootstrap") || request.url().includes("/weather/widgets/") && request.url().endsWith("widget.js")) {
      legacyRequests.push(request.url());
    }
  });
  await page.goto("/weather/?embed=1", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#w-location")).toHaveAttribute("data-nc-widget", "location");
  await expect(page.locator("#w-weather")).toHaveAttribute("data-nc-widget", "weather");
  await expect(page.locator("#w-sun")).toHaveAttribute("data-nc-widget", "sun-moon");
  await expect(page.locator("#w-astro")).toHaveAttribute("data-nc-widget", "astro");
  await expect(page.locator("#w-map")).toHaveAttribute("data-nc-widget", "map");
  await expect(page.locator("#w-location")).toBeHidden();
  await expect(page.locator("#w-weather")).toBeVisible();

  await page.locator('.widget-tab[data-tab="sky"]').click();
  await expect(page.locator("#skyMount")).toHaveAttribute("data-nc-widget", "sky", { timeout: 15_000 });
  await expect(page.locator("#skyMount")).toHaveAttribute("data-nc-shape", "square");
  await expect(page.locator("#w-sky")).toBeVisible();
  const dimensions = await page.locator("#skyMount").evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { width: Math.round(rect.width), height: Math.round(rect.height) };
  });
  expect(dimensions.width).toBeGreaterThan(0);
  expect(dimensions.width).toBe(dimensions.height);
  expect(legacyRequests).toEqual([]);
});
