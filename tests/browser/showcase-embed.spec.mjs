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

test("filters the catalog, mounts Events through the public embed runtime, and exposes snippets/copy controls", async ({ page }) => {
  await page.goto("/showcase-embed/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("[data-showcase-embed-widget]")).toHaveCount(4);
  await expect(page.locator("[data-showcase-embed-widget='hero']")).toHaveCount(0);
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

test("keeps Sky square-only and validates the public host dimensions", async ({ page }) => {
  await page.goto("/showcase-embed/", { waitUntil: "domcontentloaded" });
  await page.locator("[data-showcase-embed-widget='sky']").click();

  const mode = page.locator("[data-role='layout-mode']");
  const width = page.locator("[data-role='layout-width']");
  const height = page.locator("[data-role='layout-height']");
  await expect(mode).toHaveValue("square");
  await expect(mode.locator("option")).toHaveCount(1);
  await width.fill("500");
  await height.fill("400");
  await expect(page.locator("[data-role='layout-status']")).toHaveAttribute("data-valid", "false");
  await expect(page.getByRole("button", { name: "Mount preview" })).toBeDisabled();
  await height.fill("500");
  await expect(page.locator("[data-role='layout-status']")).toHaveAttribute("data-valid", "true");
  await page.getByRole("button", { name: "Mount preview" }).click();
  const preview = page.locator("#embed-preview-root");
  await expect(preview).toHaveAttribute("data-nc-widget", "sky");
  await expect(preview).toHaveAttribute("data-nc-embed-mode", "square");
  await expect(preview).toHaveAttribute("data-nc-embed-width", "500");
  await expect(preview).toHaveAttribute("data-nc-embed-height", "500");
});
