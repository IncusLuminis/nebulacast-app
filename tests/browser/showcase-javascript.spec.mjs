import { test, expect } from "@playwright/test";

test("copied Showcase keeps cards, standalone/iframe output, and adds JavaScript guidance", async ({ page }) => {
  await page.goto("/showcase-javascript/", { waitUntil: "domcontentloaded" });

  const cards = page.locator("[data-widget-type]");
  await expect(cards).toHaveCount(13);
  const alerts = page.locator('[data-widget-type="alerts"]');
  await expect(alerts.locator('[data-gallery-action="open-host"]')).toHaveAttribute("href", "/widgets/widget.html?widget=alerts&orientation=horizontal&theme=inherit&density=normal");
  await expect(alerts.locator('[data-role="iframe-snippet"]')).toContainText("<iframe");
  await expect(alerts.locator('[data-role="javascript-embed-snippet"]')).toContainText('from "/widgets/runtime/index.mjs"');
  await expect(alerts.locator('[data-role="javascript-embed-snippet"]')).toContainText('"widget":"alerts"');
  await expect(alerts.locator('[data-role="javascript-embed-output"]')).toContainText("responsive sizing");
  await expect(alerts.locator('[data-role="javascript-embed-output"]')).toContainText("iframe");
  await expect(page.locator('[data-widget-type="hero"] [data-role="javascript-embed-unavailable"]')).toContainText("JavaScript embed unavailable");

  await alerts.locator('[data-gallery-layout-mode]').selectOption("vertical");
  await alerts.locator('[data-gallery-option="theme"]').selectOption("dark");
  await expect(alerts.locator('[data-role="javascript-embed-snippet"]')).toContainText('"mode":"vertical"');
  await expect(alerts.locator('[data-role="javascript-embed-snippet"]')).toContainText('"theme":"dark"');
});

test("copied Showcase still previews cards only when requested and keeps Sky square", async ({ page }) => {
  await page.route("**/sky/data/alerts_now.json", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ items: [{ id: "showcase-javascript-alert", group: "risk", title: "Showcase fixture" }] }),
  }));
  await page.goto("/showcase-javascript/", { waitUntil: "domcontentloaded" });

  const hero = page.locator('[data-widget-type="hero"]');
  await expect(hero.locator('[data-gallery-action="preview"]')).toBeEnabled();
  await expect(page.locator('[data-widget-type="map"] [data-gallery-action="preview"]')).toBeDisabled();
  await hero.locator('[data-gallery-action="preview"]').click();
  await expect(hero.locator('.gallery-preview-root')).toHaveAttribute("data-nc-widget", "hero");
  await hero.locator('[data-gallery-action="close"]').click();
  await expect(hero.locator('.gallery-preview-root')).not.toHaveAttribute("data-nc-widget", "hero");

  const sky = page.locator('[data-widget-type="sky"]');
  await expect(sky.locator('[data-gallery-layout-mode]')).toHaveValue("square");
  await expect(sky.locator('[data-gallery-layout-mode] option')).toHaveText(["Square"]);
  await expect(sky.locator('[data-role="javascript-embed-snippet"]')).toContainText('"widget":"sky"');
});
