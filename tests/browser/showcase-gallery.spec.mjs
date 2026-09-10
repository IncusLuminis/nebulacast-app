import { test, expect } from "@playwright/test";

test("Showcase generates bounded standalone output and opens the corresponding host", async ({ page, context }) => {
  await page.goto("/showcase/", { waitUntil: "domcontentloaded" });

  const alerts = page.locator('[data-widget-type="alerts"]');
  const events = page.locator('[data-widget-type="events"]');
  await expect(alerts.locator('[data-role="iframe-url"]')).toHaveText("/widgets/widget.html?widget=alerts&orientation=auto&theme=inherit&density=normal");
  await expect(events.locator('[data-role="iframe-url"]')).toHaveText("/widgets/widget.html?widget=events&orientation=auto&theme=inherit&density=normal");
  await expect(alerts.locator('[data-role="iframe-snippet"]')).toHaveText('<iframe src="/widgets/widget.html?widget=alerts&amp;orientation=auto&amp;theme=inherit&amp;density=normal" title="Sky Alerts" loading="lazy"></iframe>');
  await expect(page.locator('[data-widget-type="hero"] [data-role="iframe-unavailable"]')).toHaveText("Iframe output unavailable");

  await alerts.locator('[data-gallery-option="orientation"]').selectOption("vertical");
  await alerts.locator('[data-gallery-option="theme"]').selectOption("dark");
  const generatedUrl = "/widgets/widget.html?widget=alerts&orientation=vertical&theme=dark&density=normal";
  await expect(alerts.locator('[data-role="iframe-url"]')).toHaveText(generatedUrl);
  await expect(alerts.locator('[data-role="iframe-snippet"]')).toHaveText(`<iframe src="${generatedUrl.replaceAll("&", "&amp;")}" title="Sky Alerts" loading="lazy"></iframe>`);
  await expect(alerts.locator('[data-gallery-action="open-host"]')).toHaveAttribute("href", generatedUrl);
  await expect(alerts.locator('[data-role="javascript-embed-snippet"]')).toContainText('from "/widgets/runtime/index.mjs"');
  await expect(alerts.locator('[data-role="javascript-embed-snippet"]')).toContainText('"widget":"alerts"');
  await expect(events.locator('[data-role="javascript-embed-snippet"]')).toContainText('"widget":"events"');
  await expect(page.locator('[data-widget-type="hero"] [data-role="javascript-embed-unavailable"]')).toContainText("JavaScript embed unavailable");

  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    document.execCommand = () => true;
  });
  await alerts.locator('[data-gallery-action="copy-iframe-url"]').click();
  await expect(alerts.locator('[data-role="iframe-copy-status"]')).toHaveText("Copied URL (fallback)");
  await alerts.locator('[data-gallery-action="copy-javascript-embed"]').click();
  await expect(alerts.locator('[data-role="javascript-embed-copy-status"]')).toHaveText("Copied JavaScript (fallback)");

  const hostPage = await context.newPage();
  await hostPage.route("**/sky/data/alerts_now.json", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ items: [{ id: "gallery-alert", group: "risk", title: "Gallery host" }] }),
  }));
  await hostPage.goto(generatedUrl, { waitUntil: "domcontentloaded" });
  await expect(hostPage.locator("#widget-root")).toHaveAttribute("data-nc-widget", "alerts");
  await expect(hostPage.locator("#widget-root")).toHaveAttribute("data-nc-orientation", "vertical");
  await hostPage.close();
});

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
  const heroConfig = page.locator('[data-widget-type="hero"] [data-role="config-output"]');
  await expect(heroConfig).toHaveText('{"schema":"widget-config.v1","widget":"hero","version":1,"config":{"density":"normal","orientation":"auto","theme":"inherit"}}');
  await page.locator('[data-widget-type="hero"] [data-gallery-option="theme"]').selectOption("dark");
  await expect(heroConfig).toHaveText('{"schema":"widget-config.v1","widget":"hero","version":1,"config":{"density":"normal","orientation":"auto","theme":"dark"}}');
  expect(requests.some(url => /observer-weather|astro-weather|alerts_now|sun_moon|widget_runtime/.test(url))).toBeFalsy();

  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    document.execCommand = () => true;
  });
  await page.locator('[data-widget-type="hero"] [data-gallery-action="copy-config"]').click();
  await expect(page.locator('[data-widget-type="hero"] [data-role="copy-status"]')).toHaveText("Copied config (fallback)");

  await page.locator('[data-widget-type="hero"] [data-gallery-action="preview"]').click();
  await expect(page.locator('[data-widget-type="hero"] .gallery-preview-root')).toHaveAttribute("data-nc-widget", "hero");
  await expect(page.locator('[data-widget-type="hero"] .gallery-preview-root')).toHaveAttribute("data-nc-theme", "dark");
  await expect(page.locator('[data-widget-type="hero"]')).toHaveAttribute("data-gallery-state", /ready|error/);
  await page.locator('[data-widget-type="hero"] [data-gallery-action="preview"]').click();
  await expect(page.locator('[data-widget-type="hero"] .gallery-preview-root[data-nc-widget="hero"]')).toHaveCount(1);
  await page.locator('[data-widget-type="hero"] [data-gallery-action="close"]').click();
  await expect(page.locator('[data-widget-type="hero"] .gallery-preview-root')).not.toHaveAttribute("data-nc-widget", "hero");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-widget-type="hero"] [data-role="config-output"]')).toHaveText('{"schema":"widget-config.v1","widget":"hero","version":1,"config":{"density":"normal","orientation":"auto","theme":"inherit"}}');
});
