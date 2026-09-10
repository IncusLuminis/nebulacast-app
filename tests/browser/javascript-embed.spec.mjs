import { test, expect } from "@playwright/test";

const alertsPayload = { items: [{ id: "embed-alert", group: "risk", title: "Embed alert" }] };
const eventsPayload = { items: [{ title: "Embed meteor", category: "METEORS", published_at: "2099-01-02T12:00:00Z", url: "https://example.test/meteor", summary: "Embed event" }] };

test("JavaScript embed canary mounts Alerts and Events in fixed/responsive/narrow roots", async ({ page }) => {
  await page.route("**/sky/data/alerts_now.json", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(alertsPayload),
  }));
  await page.route("**/calendar/daily_signal.json", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(eventsPayload),
  }));
  await page.goto("/embed/javascript-canary.html", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#embed-alerts-fixed")).toHaveAttribute("data-nc-widget", "alerts");
  await expect(page.locator("#embed-events-responsive")).toHaveAttribute("data-nc-widget", "events");
  await expect(page.locator("#embed-alerts-narrow")).toHaveAttribute("data-nc-widget", "alerts");
  await expect(page.locator("#embed-alerts-fixed")).toHaveAttribute("data-nc-state", "ready");
  await expect(page.locator("#embed-events-responsive")).toHaveAttribute("data-nc-state", "ready");
  await expect(page.locator("#embed-alerts-narrow")).toHaveAttribute("data-nc-orientation", "vertical");
  await expect(page.locator("#embed-alerts-fixed [data-role='item']")).toHaveCount(1);
  await expect(page.locator("#embed-events-responsive [data-role='list'] .nrc-card")).toHaveCount(1);
  await expect(page.locator('link[data-nc-embed-stylesheet="alerts"]')).toHaveCount(1);
  await expect(page.locator('link[data-nc-embed-stylesheet="events"]')).toHaveCount(1);
  await expect(page.locator(".embed-fixed")).toHaveCount(1);
  await expect(page.locator(".embed-responsive")).toHaveCount(1);
  await expect(page.locator(".embed-narrow")).toHaveCount(1);
  await expect(page.locator("iframe")).toHaveCount(0);
});
