import { test, expect } from "@playwright/test";

const alertPayload = { items: [{ id: "canary-1", group: "risk", title: "Canary alert", note: "Standalone host" }] };

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
