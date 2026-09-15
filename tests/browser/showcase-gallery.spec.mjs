import { test, expect } from "@playwright/test";

test("Widget Lab creates two independent Runtime previews and reopens the stage", async ({ page }) => {
  await page.route("**/sky/data/alerts_now.json", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ items: [{ id: "lab-alert", group: "risk", title: "Widget Lab fixture" }] }),
  }));
  await page.goto("/showcase/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("[data-role=inspector]")).toBeVisible();
  await page.locator('[data-lab-control="widget"]').selectOption("alerts");
  await expect(page.locator('[data-lab-control="mode"] option')).toHaveText(["Horizontal", "Vertical"]);
  await page.locator('[data-lab-action="create"]').click();
  await expect(page.locator('[data-role="preview-stage"]')).toBeVisible();
  await expect(page.locator('[data-lab-instance]')).toHaveCount(1);
  await expect(page.locator('[data-lab-preview-instance]')).toHaveCount(1);
  await expect(page.locator('[data-lab-preview-instance] [data-nc-widget="alerts"]')).toHaveCount(1);

  await page.locator('[data-lab-action="create-stage-instance"]').click();
  await expect(page.locator('[data-lab-instance]')).toHaveCount(2);
  await expect(page.locator('[data-lab-preview-instance]')).toHaveCount(2);
  const ids = await page.locator("[data-lab-instance]").evaluateAll(nodes => nodes.map(node => node.getAttribute("data-lab-instance")));
  expect(new Set(ids).size).toBe(2);

  await page.locator('[data-lab-stage-control="width"]').fill("700");
  await page.locator('[data-lab-stage-control="height"]').fill("300");
  await page.locator('[data-lab-action="apply-stage"]').click();
  await expect(page.locator('[data-lab-preview-instance]').last().locator(".widget-lab-preview-root")).toHaveCSS("width", "700px");

  await page.locator('[data-lab-action="close-stage"]').click();
  await expect(page.locator('[data-role="preview-stage"]')).not.toBeVisible();
  await expect(page.locator('[data-lab-instance]')).toHaveCount(2);
  await page.locator('[data-lab-action="select-instance"]').first().click();
  await expect(page.locator('[data-role="preview-stage"]')).toBeVisible();
  await expect(page.locator('[data-lab-preview-instance]')).toHaveCount(1);
});

test("Widget Lab enforces Sky square and oriented dimension rules", async ({ page }) => {
  await page.goto("/showcase/", { waitUntil: "domcontentloaded" });
  await page.locator('[data-lab-control="widget"]').selectOption("sky");
  await expect(page.locator('[data-lab-control="mode"]')).toHaveValue("square");
  await expect(page.locator('[data-lab-control="mode"] option')).toHaveText(["Square"]);
  await page.locator('[data-lab-control="width"]').fill("400");
  await page.locator('[data-lab-control="height"]').fill("401");
  await page.locator('[data-lab-action="create"]').click();
  await expect(page.locator('[data-lab-instance]')).toContainText("idle");
  await expect(page.locator('[data-role="inspector-status"]')).toContainText("square");
  await expect(page.locator('[data-role="stage-status"]')).toHaveText("1 instance");
});
