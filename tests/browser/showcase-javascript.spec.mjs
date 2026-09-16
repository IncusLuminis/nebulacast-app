import { test, expect } from "@playwright/test";

test("Showcase cards only choose a form factor and navigate Embed to a single-widget sandbox", async ({ page }) => {
  await page.goto("/showcase-javascript/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("[data-widget-type]")).toHaveCount(13);
  const alerts = page.locator('[data-widget-type="alerts"]');
  await expect(alerts.locator("select")).toHaveCount(1);
  await expect(alerts.locator("input")).toHaveCount(0);
  await expect(alerts.locator('[data-gallery-action="embed"]')).toBeVisible();
  await expect(alerts.locator('[data-gallery-action="preview"]')).toHaveCount(0);
  await expect(alerts.locator('[data-gallery-action="open-host"]')).toHaveCount(0);
  await alerts.locator("select").selectOption("vertical");
  await alerts.locator('[data-gallery-action="embed"]').click();
  await expect(page).toHaveURL(/\/showcase-javascript\/embed\.html\?widget=alerts&mode=vertical/);
});

test("Embed sandbox shows only the selected widget with JS and iframe outputs", async ({ page }) => {
  await page.goto("/showcase-javascript/embed.html?widget=alerts&mode=vertical", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-role="sandbox-widget-title"]')).toHaveText("Sky Alerts");
  await expect(page.locator('[data-role="layout-mode"]')).toHaveValue("vertical");
  await expect(page.locator('[data-role="layout-width"]')).toBeVisible();
  await expect(page.locator('[data-role="layout-height"]')).toBeVisible();
  await expect(page.locator('[data-role="javascript-snippet"]')).toContainText("/widgets/runtime/index.mjs");
  await expect(page.locator('[data-role="iframe-snippet"]')).toContainText("<iframe");
  await expect(page.locator('[data-role="embed-choice-explanation"]')).toContainText("responsive");
  await expect(page.locator('[data-role="embed-choice-explanation"]')).toContainText("isolated");
});

test("Sky sandbox remains square and unsupported widgets do not get false embed code", async ({ page }) => {
  await page.goto("/showcase-javascript/embed.html?widget=sky&mode=horizontal", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-role="layout-mode"]')).toHaveValue("square");
  await expect(page.locator('[data-role="javascript-snippet"]')).toContainText('"mode":"square"');
  await page.goto("/showcase-javascript/embed.html?widget=hero&mode=horizontal", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-role="javascript-snippet"]')).toContainText("unavailable");
  await expect(page.locator('[data-role="iframe-snippet"]')).toContainText("unavailable");
  await expect(page.locator('[data-role="javascript-output"]')).toBeHidden();
  await expect(page.locator('[data-role="preview-widget"]')).toBeDisabled();
});
