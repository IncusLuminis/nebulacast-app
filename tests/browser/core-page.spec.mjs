import { test, expect } from "@playwright/test";

test("core staging page reaches the weather console shell", async ({ page }) => {
  const diagnostics = [];
  page.on("console", message => {
    if (message.type() === "error") diagnostics.push(`console: ${message.text()}`);
  });
  page.on("pageerror", error => diagnostics.push(`pageerror: ${error.message}`));
  await page.route("**/api/**", route => route.fulfill({
    status: 503,
    contentType: "application/json",
    body: JSON.stringify({ error: "smoke test provider unavailable" }),
  }));

  await page.goto("/index.html", { waitUntil: "domcontentloaded" });
  const shell = page.locator("#console-hero");
  try {
    await expect(shell).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("body")).toContainText("Nebulacast", { timeout: 5_000 });
  } catch (error) {
    error.message += `\nBrowser diagnostics:\n${diagnostics.join("\n") || "none"}`;
    throw error;
  }
});

test("legacy map URL redirects to the supported map route", async ({ page }) => {
  await page.goto("/weather/map1.html", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/weather\/map-poc\.html$/);
});
