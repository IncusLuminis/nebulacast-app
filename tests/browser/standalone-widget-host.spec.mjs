import { test, expect } from "@playwright/test";

const alertPayload = { items: [{ id: "canary-1", group: "risk", title: "Canary alert", note: "Standalone host" }] };
const eventsPayload = { items: [{ title: "Meteor canary", category: "METEORS", published_at: "2099-01-02T12:00:00Z", url: "https://example.test/meteor", summary: "Standalone event" }] };
const weatherPayload = {
  ok: true,
  source: "fixture",
  generated_at: "2099-01-01T00:00:00Z",
  location: { name: "Warsaw", lat: 52.2297, lon: 21.0122, tz: "Europe/Warsaw" },
  horizon_hours: 1,
  profiles: ["balanced"],
  default_profile: "balanced",
  hours: [],
};

test("standalone widget host mounts the allow-listed Weather widget", async ({ page }) => {
  await page.route("**/api/astro-weather*", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(weatherPayload),
  }));
  await page.goto("/widgets/widget.html?widget=weather", { waitUntil: "domcontentloaded" });

  const root = page.locator("#widget-root");
  await expect(root).toHaveAttribute("data-nc-widget", "weather");
  await expect(root).toHaveAttribute("data-nc-orientation", "auto");
  await expect(root).toHaveAttribute("data-nc-theme", "inherit");
  await expect(root).toHaveAttribute("data-nc-density", "normal");
  await expect(page.locator('link[href="/weather/widgets/weather/weather.css"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Destroy widget" }).click();
  await expect(root).not.toHaveAttribute("data-nc-widget");
  await expect(page.locator("#host-status")).toHaveText("Widget destroyed.");
});

test("standalone widget host mounts Events with catalog defaults and cleans up on pagehide", async ({ page }) => {
  await page.route("**/calendar/daily_signal.json", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(eventsPayload),
  }));
  await page.goto("/widgets/widget.html?widget=events", { waitUntil: "domcontentloaded" });

  const root = page.locator("#widget-root");
  await expect(root).toHaveAttribute("data-nc-widget", "events");
  await expect(root).toHaveAttribute("data-nc-state", "ready");
  await expect(root).toHaveAttribute("data-nc-orientation", "auto");
  await expect(root).toHaveAttribute("data-nc-theme", "inherit");
  await expect(root).toHaveAttribute("data-nc-density", "normal");
  await expect(root.locator('[data-role="filters"] .nrc-filter')).toHaveCount(6);
  await expect(root.locator('[data-role="list"] .nrc-card')).toHaveCount(1);
  await expect(page.locator('link[href="/assets/css/widget_calendar.css"]')).toHaveCount(1);

  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  await expect(root).not.toHaveAttribute("data-nc-widget");
  await expect(page.locator("#host-status")).toHaveText("Widget destroyed.");
});

test("standalone widget host mounts only the Alerts canary and cleans up explicitly", async ({ page }) => {
  const requests = [];
  page.on("request", request => requests.push(request.url()));
  await page.route("**/sky/data/alerts_now.json", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(alertPayload),
  }));
  await page.goto("/widgets/widget.html?widget=alerts&orientation=vertical&theme=dark&density=compact", { waitUntil: "domcontentloaded" });

  const root = page.locator("#widget-root");
  await expect(root).toHaveAttribute("data-nc-widget", "alerts");
  await expect(root).toHaveAttribute("data-nc-orientation", "vertical");
  await expect(root).toHaveAttribute("data-nc-theme", "dark");
  await expect(root).toHaveAttribute("data-nc-density", "compact");
  await expect(root).toHaveAttribute("data-nc-state", "ready");
  await expect(root.locator('[data-role="item"]')).toHaveCount(1);
  await expect(page.locator('link[href="/alerts/widget.css"]')).toHaveCount(1);
  expect(requests.some(url => url.includes("hero/platform-adapter") || url.includes("weather/widgets"))).toBeFalsy();

  await page.getByRole("button", { name: "Destroy widget" }).click();
  await expect(root).not.toHaveAttribute("data-nc-widget");
  await expect(page.locator("#host-status")).toHaveText("Widget destroyed.");
});

test("invalid or non-standalone query shows a visible error without loading another widget", async ({ page }) => {
  const requests = [];
  page.on("request", request => requests.push(request.url()));
  await page.goto("/widgets/widget.html?widget=weather&dataUrl=https://evil.example", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#host-status")).toContainText("Unsupported standalone widget parameter");
  await expect(page.locator("#host-status")).toHaveAttribute("data-state", "error");
  await expect(page.locator("#widget-root")).not.toHaveAttribute("data-nc-widget");
  expect(requests.some(url => url.includes("weather/platform-adapter") || url.includes("weather/widgets"))).toBeFalsy();
});
