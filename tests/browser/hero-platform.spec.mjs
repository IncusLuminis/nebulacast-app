import { test, expect } from "@playwright/test";

test("Console Hero is mounted by the common Runtime and keeps launcher behavior scoped", async ({ page }) => {
  const diagnostics = [];
  page.on("console", message => { if (message.type() === "error") diagnostics.push(`console: ${message.text()}`); });
  page.on("pageerror", error => diagnostics.push(`pageerror: ${error.message}`));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const hero = page.locator("#console-hero");
  try {
    await expect(hero).toHaveAttribute("data-nc-widget", "hero");
    await expect(hero.locator(".hero-card[data-panel]")).toHaveCount(7);
    await expect(hero.locator("[data-role=clock-time]")).toBeVisible();
    await expect(hero).not.toContainText("Loading conditions…", { timeout: 10000 });
    expect(await page.evaluate(() => Object.prototype.hasOwnProperty.call(window, "_dbHeroData"))).toBe(false);

    await hero.locator('.hero-card[data-panel="matrix"]').click();
    await expect(page.locator("#dbp-matrix")).toBeVisible();
  } catch (error) {
    error.message += `\nBrowser diagnostics:\n${diagnostics.join("\n") || "none"}`;
    throw error;
  }
});
