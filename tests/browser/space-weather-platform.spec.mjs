import { test, expect } from "@playwright/test";

test("Space Weather mounts two independent Runtime instances and supports destroy/remount", async ({ page }) => {
  const diagnostics = [];
  page.on("console", message => { if (message.type() === "error") diagnostics.push(`console: ${message.text()}`); });
  page.on("pageerror", error => diagnostics.push(`pageerror: ${error.message}`));
  await page.goto("/widget-host/space-weather.html", { waitUntil: "domcontentloaded" });

  try {
    await expect(page.locator("#space-weather-wide")).toHaveAttribute("data-nc-widget", "space-weather");
    await expect(page.locator("#space-weather-narrow")).toHaveAttribute("data-nc-widget", "space-weather");
    await expect(page.locator("#space-weather-wide")).toHaveAttribute("data-nc-orientation", "horizontal");
    await expect(page.locator("#space-weather-narrow")).toHaveAttribute("data-nc-orientation", "vertical");
    await expect(page.locator("#space-weather-wide")).toHaveAttribute("data-nc-state", "ready");
    await expect(page.locator("#space-weather-narrow")).toHaveAttribute("data-nc-state", "ready");
    await expect(page.locator("#space-weather-sentinel")).toHaveText("Outside Space Weather widget sentinel");
    expect(await page.evaluate(() => window.HelioWidget === undefined)).toBeTruthy();

    await page.evaluate(() => window.spaceWeatherHost.destroy("wide"));
    await expect(page.locator("#space-weather-wide")).not.toHaveAttribute("data-nc-widget", "space-weather");
    await expect(page.locator("#space-weather-narrow")).toHaveAttribute("data-nc-widget", "space-weather");
    await page.evaluate(() => window.spaceWeatherHost.remount("wide"));
    await expect(page.locator("#space-weather-wide")).toHaveAttribute("data-nc-widget", "space-weather");
  } catch (error) {
    error.message += `\nBrowser diagnostics:\n${diagnostics.join("\n") || "none"}`;
    throw error;
  }
});
