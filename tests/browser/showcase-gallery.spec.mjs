import { test, expect } from "@playwright/test";

test("Showcase builds cards from catalog and mounts previews only on action", async ({ page }) => {
  const requests = [];
  page.on("request", request => requests.push(request.url()));
  await page.goto("/showcase/", { waitUntil: "domcontentloaded" });

  const cards = page.locator("[data-widget-type]");
  await expect(cards).toHaveCount(10);
  await expect(page.locator('[data-widget-type="hero"] .card-name')).toHaveText("Hero");
  await expect(page.locator('[data-widget-type="hero"] .meta-version')).toHaveText("Version 1");
  await expect(page.locator('[data-widget-type="hero"] [data-gallery-action="preview"]')).toBeEnabled();
  await expect(page.locator('[data-widget-type="map"] [data-gallery-action="preview"]')).toBeDisabled();
  expect(requests.some(url => /observer-weather|astro-weather|alerts_now|sun_moon|widget_runtime/.test(url))).toBeFalsy();

  await page.locator('[data-widget-type="hero"] [data-gallery-action="preview"]').click();
  await expect(page.locator('[data-widget-type="hero"] .gallery-preview-root')).toHaveAttribute("data-nc-widget", "hero");
  await expect(page.locator('[data-widget-type="hero"]')).toHaveAttribute("data-gallery-state", /ready|error/);
  await page.locator('[data-widget-type="hero"] [data-gallery-action="preview"]').click();
  await expect(page.locator('[data-widget-type="hero"] .gallery-preview-root[data-nc-widget="hero"]')).toHaveCount(1);
  await page.locator('[data-widget-type="hero"] [data-gallery-action="close"]').click();
  await expect(page.locator('[data-widget-type="hero"] .gallery-preview-root')).not.toHaveAttribute("data-nc-widget", "hero");
});
