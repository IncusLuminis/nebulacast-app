import { test, expect } from "@playwright/test";

test("public widgets offer a JavaScript snippet alongside the current embed", async ({ page }) => {
  await page.goto("/embed/?src=/sky/&title=Sky", { waitUntil: "domcontentloaded" });
  await page.locator("#ctrl-w").fill("1");
  await page.locator("#ctrl-w").blur();
  await page.getByRole("button", { name: /embed code/i }).click();
  await expect(page.getByRole("tab", { name: "JavaScript" })).toBeVisible();

  await page.getByRole("tab", { name: "JavaScript" }).click();
  await expect(page.locator("#share-code")).toContainText("https://staging.nebulacast.app/widgets/runtime/index.mjs");
  await expect(page.locator("#share-code")).toContainText('"widget":"sky"');
  await expect(page.locator("#share-code")).toContainText('"mode":"square"');
  await expect(page.locator("#share-code")).toContainText('"width":160');
  await expect(page.locator("#share-hint")).toContainText("iframe isolation");
});

test("widgets without a public JavaScript contract retain their current embed only", async ({ page }) => {
  await page.goto("/embed/?src=/helio/&title=Space%20Weather", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /embed code/i }).click();
  await expect(page.getByRole("tab", { name: "JavaScript" })).toBeHidden();
  await expect(page.locator("#share-code")).toContainText("HelioWidget.mount");
});
