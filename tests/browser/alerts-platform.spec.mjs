import { test, expect } from "@playwright/test";

test("Alerts host mounts independent Runtime instances and supports destroy/remount", async ({ page }) => {
  const diagnostics = [];
  page.on("console", message => {
    if (message.type() === "error") diagnostics.push(`console: ${message.text()}`);
  });
  page.on("pageerror", error => diagnostics.push(`pageerror: ${error.message}`));

  await page.goto("/widget-host/alerts.html", { waitUntil: "domcontentloaded" });
  const first = page.locator("#alerts-one");
  const second = page.locator("#alerts-two");
  try {
    await expect(first).toHaveAttribute("data-nc-widget", "alerts");
    await expect(second).toHaveAttribute("data-nc-widget", "alerts");
    await expect(first).toHaveAttribute("data-nc-state", "ready");
    await expect(second).toHaveAttribute("data-nc-state", "ready");
    await expect(first).toHaveAttribute("data-nc-orientation", "vertical");
    await expect(second).toHaveAttribute("data-nc-orientation", "horizontal");
    await expect(first.locator('[data-role="item"]')).toHaveCount(4);
    await expect(second.locator('[data-role="item"]')).toHaveCount(1);
    await expect(first.locator('[data-role="item"]').first()).toContainText("RISK");
    await expect(first.locator('[data-role="item"]').first()).toContainText("29075");
    expect(await page.evaluate(() => window.alertsHost.subscriptionCount)).toBe(0);

    await page.evaluate(() => window.alertsHost.destroy("one"));
    await expect(first).not.toHaveAttribute("data-nc-widget");
    await expect(second).toHaveAttribute("data-nc-widget", "alerts");
    await page.evaluate(() => window.alertsHost.remount("one"));
    await expect(first).toHaveAttribute("data-nc-state", "ready");

    await page.evaluate(() => window.alertsHost.updateGroups("one", ["risk"]));
    await expect(first.locator('[data-role="item"]')).toHaveCount(4);
    await expect(second.locator('[data-role="item"]')).toHaveCount(1);
  } catch (error) {
    error.message += `\nBrowser diagnostics:\n${diagnostics.join("\n") || "none"}`;
    throw error;
  }
});
