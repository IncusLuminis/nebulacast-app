import { test, expect } from "@playwright/test";

const alertsPayload = { items: [{ id: "showcase-embed-alert", group: "risk", title: "Embed alert" }] };
const eventsPayload = { items: [{ title: "Embed meteor", category: "METEORS", published_at: "2099-01-02T12:00:00Z", url: "https://example.test/meteor", summary: "Embed event" }] };

test.beforeEach(async ({ page }) => {
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
});

test("shows the complete catalog, marks unsupported entries, mounts Events, and exposes snippets/copy controls", async ({ page }) => {
  await page.goto("/showcase-embed/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("[data-showcase-embed-widget]")).toHaveCount(13);
  await expect(page.locator("[data-showcase-embed-widget='hero']")).toHaveAttribute("data-embed-available", "false");
  await expect(page.locator("[data-showcase-embed-widget='hero'] .embed-catalog-status")).toContainText("embed unavailable");
  await expect(page.locator("[data-showcase-embed-widget='events']")).toBeVisible();
  await expect(page.locator("[data-role='javascript-snippet']")).toContainText("/widgets/runtime/index.mjs");
  await expect(page.locator("[data-role='iframe-snippet']")).toContainText("<iframe");
  await expect(page.locator("[data-showcase-embed-action='copy-javascript']")).toBeVisible();
  await expect(page.locator("[data-showcase-embed-action='copy-iframe']")).toBeVisible();

  await page.locator("[data-showcase-embed-widget='events']").click();
  await page.getByRole("button", { name: "Mount preview" }).click();
  const preview = page.locator("#embed-preview-root");
  await expect(preview).toHaveAttribute("data-nc-widget", "events");
  await expect(preview).toHaveAttribute("data-nc-state", "ready");
  await expect(preview.locator("[data-role='list'] .nrc-card")).toHaveCount(1);
  await expect(page.locator("[data-role='embed-status']")).toHaveText("Embed ready");
  await expect(page.locator("[data-role='javascript-snippet']")).toContainText('"widget":"events"');
  await expect(page.locator("[data-role='iframe-snippet']")).toContainText("widget=events");

  await page.getByRole("button", { name: "Reset / destroy" }).click();
  await expect(preview).not.toHaveAttribute("data-nc-widget");
  await expect(page.locator("[data-role='embed-status']")).toHaveText("Preview reset");
});

test("keeps unsupported catalog entries informative without preview or snippets", async ({ page }) => {
  await page.goto("/showcase-embed/", { waitUntil: "domcontentloaded" });
  await page.locator("[data-showcase-embed-widget='hero']").click();

  await expect(page.getByRole("button", { name: "Mount preview" })).toBeDisabled();
  await expect(page.locator("[data-role='embed-status']")).toContainText("Preview unavailable");
  await expect(page.locator("[data-role='javascript-snippet']")).toContainText("JavaScript div embed unavailable");
  await expect(page.locator("[data-role='iframe-snippet']")).toContainText("Iframe HTML unavailable");
});

test("swaps dimensions when changing orientation and fills the percent preview root", async ({ page }) => {
  await page.goto("/showcase-embed/", { waitUntil: "domcontentloaded" });
  await page.locator("[data-showcase-embed-widget='weather']").click();

  const mode = page.locator("[data-role='layout-mode']");
  const unit = page.locator("[data-role='layout-unit']");
  const width = page.locator("[data-role='layout-width']");
  const height = page.locator("[data-role='layout-height']");
  await expect(unit).toHaveValue("percent");
  await expect(width).toHaveValue("100");
  await expect(height).toHaveValue("56");
  await mode.selectOption("vertical");
  await expect(width).toHaveValue("56");
  await expect(height).toHaveValue("100");
  await expect(page.locator("[data-role='layout-status']")).toContainText("Vertical");
  await expect(page.locator("[data-role='layout-status']")).toContainText("56% × 100%");

  await page.route("**/api/astro-weather*", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, source: "fixture", generated_at: "2099-01-01T00:00:00Z", location: { name: "Warsaw", lat: 52.2297, lon: 21.0122, tz: "Europe/Warsaw" }, horizon_hours: 1, profiles: ["balanced"], default_profile: "balanced", hours: [] }),
  }));
  await page.getByRole("button", { name: "Mount preview" }).click();
  const preview = page.locator("#embed-preview-root");
  await expect(preview).toHaveAttribute("data-nc-widget", "weather");
  await expect.poll(() => preview.evaluate(node => ({ width: node.style.width, height: node.style.height }))).toEqual({ width: "56%", height: "100%" });
  await expect(page.locator("[data-role='javascript-snippet']")).toContainText('"unit":"percent"');
  await expect(page.locator("[data-role='iframe-snippet']")).toContainText('width="56%" height="100%"');
});

test("keeps Sky square-only and validates the public host dimensions", async ({ page }) => {
  await page.goto("/showcase-embed/", { waitUntil: "domcontentloaded" });
  await page.locator("[data-showcase-embed-widget='sky']").click();

  const mode = page.locator("[data-role='layout-mode']");
  await page.locator("[data-role='layout-unit']").selectOption("px");
  const width = page.locator("[data-role='layout-width']");
  const height = page.locator("[data-role='layout-height']");
  await expect(mode).toHaveValue("square");
  await expect(mode.locator("option")).toHaveCount(1);
  await width.fill("500");
  await expect(height).toHaveValue("500");
  await expect(page.locator("[data-role='layout-status']")).toHaveAttribute("data-valid", "true");
  await page.getByRole("button", { name: "Mount preview" }).click();
  const preview = page.locator("#embed-preview-root");
  await expect(preview).toHaveAttribute("data-nc-widget", "sky");
  await expect(preview).toHaveAttribute("data-nc-embed-mode", "square");
  await expect(preview).toHaveAttribute("data-nc-embed-width", "500");
  await expect(preview).toHaveAttribute("data-nc-embed-height", "500");
});
