import { test, expect } from "@playwright/test";

test("Console Composer mounts declared platform roots and preserves Hero launcher behavior", async ({ page }) => {
  const diagnostics = [];
  page.on("console", message => { if (message.type() === "error") diagnostics.push(`console: ${message.text()}`); });
  page.on("pageerror", error => diagnostics.push(`pageerror: ${error.message}`));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  try {
    for (const selector of ["#console-hero", "#w-location", "#w-weather", "#w-weather-matrix", "#w-sun", "#w-sunmoon-panel", "#skyMount", "#db-sky-root", "#fs-sky", "#nrc-main", "#nrw-main", "#dbp-helio-body"]) {
      await expect(page.locator(selector)).toHaveAttribute("data-nc-widget", /.+/, { timeout: 15_000 });
    }
    await expect(page.locator("#console-hero")).toHaveAttribute("data-nc-widget", "hero");
    await expect(page.locator("#skyMount")).toHaveAttribute("data-nc-widget", "sky");
    await expect(page.locator("#db-sky-root")).toHaveAttribute("data-nc-widget", "sky");
    await expect(page.locator("#db-sky-root")).toHaveAttribute("data-nc-shape", "square");
    await expect(page.locator("#db-sky-root canvas.sky-canvas")).toHaveCount(1);
    await expect(page.locator("#db-map-iframe")).toHaveCount(1);
    const square = await page.locator("#db-anchor-sky").evaluate(element => {
      const rect = element.getBoundingClientRect();
      return { width: Math.round(rect.width), height: Math.round(rect.height) };
    });
    expect(square.width).toBeGreaterThan(0);
    expect(square.width).toBe(square.height);
    await expect(page.locator("#dbp-helio-body")).toHaveAttribute("data-nc-widget", "space-weather");
    await expect(page.locator("#console-hero .hero-card[data-panel]")).toHaveCount(7);
    await page.locator('#console-hero .hero-card[data-panel="matrix"]').click();
    await expect(page.locator("#dbp-matrix")).toBeVisible();
    await expect(page.locator("#nrw-main [data-role=filters]")).toHaveCount(1);
  } catch (error) {
    error.message += `\nBrowser diagnostics:\n${diagnostics.join("\n") || "none"}`;
    throw error;
  }
});
