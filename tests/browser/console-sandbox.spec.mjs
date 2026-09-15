import { test, expect } from "@playwright/test";

test("Console Sandbox assembles independent Runtime widgets and preserves host layout controls", async ({ page }) => {
  await page.route("**/sky/data/alerts_now.json", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ items: [{ id: "sandbox-alert", group: "risk", title: "Sandbox fixture" }] }),
  }));
  await page.goto("/console-sandbox/", { waitUntil: "domcontentloaded" });

  await expect(page.locator('[aria-label="Widget palette"]')).toBeVisible();
  await page.locator('[data-sandbox-control="widget"]').selectOption("alerts");
  await page.locator('[data-sandbox-action="add"]').click();
  await expect(page.locator('[data-sandbox-instance="console-sandbox-1"] [data-role="runtime-root"][data-nc-widget="alerts"]')).toHaveCount(1);
  await expect(page.locator('[data-sandbox-instance="console-sandbox-1"] .console-sandbox-card-status')).toHaveText("State: ready");

  await page.locator('[data-sandbox-action="add"]').click();
  await expect(page.locator('[data-role="runtime-root"][data-nc-widget="alerts"]')).toHaveCount(2);
  const ids = await page.locator("article[data-sandbox-instance]").evaluateAll(nodes => nodes.map(node => node.dataset.sandboxInstance));
  expect(new Set(ids).size).toBe(2);

  await page.locator('[data-sandbox-action="select"]').first().click();
  await page.locator('[data-sandbox-layout="width"]').fill("700");
  await page.locator('[data-sandbox-layout="height"]').fill("300");
  await page.locator('[data-sandbox-action="apply"]').click();
  await expect(page.locator('article[data-sandbox-instance="console-sandbox-1"] [data-role="runtime-root"]')).toHaveCSS("width", "700px");
  await expect(page.locator('article[data-sandbox-instance="console-sandbox-1"] [data-role="runtime-root"][data-nc-widget="alerts"]')).toHaveCount(1);

  await page.locator('[data-sandbox-action="reset-all"]').click();
  await expect(page.locator('[data-role="canvas"]')).toContainText("Add a widget to start building");
});

test("Console Sandbox keeps Sky square-only and exposes narrow canvas mode", async ({ page }) => {
  await page.goto("/console-sandbox/", { waitUntil: "domcontentloaded" });
  await page.locator('[data-sandbox-control="widget"]').selectOption("sky");
  await page.locator('[data-sandbox-action="add"]').click();
  await expect(page.locator('[data-sandbox-layout="mode"]')).toHaveValue("square");
  await page.locator('[data-sandbox-layout="width"]').fill("400");
  await page.locator('[data-sandbox-layout="height"]').fill("401");
  await page.locator('[data-sandbox-action="apply"]').click();
  await expect(page.locator('[data-role="inspector-status"]')).toContainText("square");
  await page.locator('[data-sandbox-control="viewport"]').selectOption("narrow");
  await expect(page.locator('[data-role="canvas"]')).toHaveAttribute("data-viewport", "narrow");
});

test("Console Sandbox returns focus after remove and reset-all", async ({ page }) => {
  await page.goto("/console-sandbox/", { waitUntil: "domcontentloaded" });
  await page.locator('[data-sandbox-action="add"]').click();
  await page.locator('[data-sandbox-action="add"]').click();
  const secondId = await page.locator('[data-role="instance-list"] [data-sandbox-action="select"]').nth(1).getAttribute("data-sandbox-instance");
  await page.locator('article[data-sandbox-instance="console-sandbox-1"] [data-sandbox-action="remove"]').click();
  await expect(page.locator(`[data-role="instance-list"] [data-sandbox-action="select"][data-sandbox-instance="${secondId}"]`)).toBeFocused();
  await page.locator('[data-sandbox-action="reset-all"]').click();
  await expect(page.locator('[data-sandbox-action="add"]')).toBeFocused();
});
