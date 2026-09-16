import { test, expect } from "@playwright/test";

test("experimental showcase mirrors the card catalog and opens staging entry points", async ({ page }) => {
  await page.goto("/showcase-javascript/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Widget Showcase", level: 1 })).toBeVisible();
  await expect(page.locator('[data-showcase-group="observation"] [data-widget-title]')).toHaveCount(6);
  await expect(page.locator('[data-showcase-group="events"] [data-widget-title]')).toHaveCount(3);
  const sky = page.locator('[data-widget-title="Sky"]');
  await expect(sky.locator('[data-showcase-action="standalone"]')).toHaveAttribute("href", "https://staging.nebulacast.app/sky/");
  await expect(sky.locator('[data-showcase-action="embed"]')).toHaveAttribute("href", "/embed/?src=%2Fsky%2F&title=Sky");
  await expect(sky.locator("input, select, button")).toHaveCount(0);
});
