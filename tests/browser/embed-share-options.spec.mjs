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
  await expect(page.getByRole("tablist", { name: "Embed code type" })).toBeHidden();
  await expect(page.getByRole("tab", { name: "JavaScript" })).toBeHidden();
  await expect(page.locator("#share-code")).toContainText("HelioWidget.mount");
});

test("Calendar retains its Current embed alongside JavaScript and identifies itself correctly", async ({ page }) => {
  await page.goto("/embed/?src=/calendar/&title=Calendar", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /embed code/i }).click();
  await expect(page.getByRole("tab", { name: "Current embed" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "JavaScript" })).toBeVisible();
  await expect(page.locator("#share-code")).toContainText("Nebulacast · Calendar widget");
  await expect(page.locator("#share-code")).toContainText('class="nrc-title">Calendar');
  await expect(page.locator("#share-code")).not.toContainText("Sky Alerts");
});

test("Hero switches its iframe preview and generated code between orientations", async ({ page }) => {
  await page.goto("/embed/?src=/hero/?orientation=horizontal&title=Hero", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#hero-orientation-control")).toBeVisible();
  await page.locator("#hero-orientation").selectOption("vertical");
  await expect(page.locator("#embed-iframe")).toHaveAttribute("src", "/hero/?orientation=vertical");
  await page.getByRole("button", { name: /embed code/i }).click();
  await expect(page.locator("#share-code")).toContainText("/hero/?orientation=vertical");
  await expect(page.locator("#share-code")).toContainText("<iframe");
  await expect(page.locator("#share-tab-javascript")).toBeHidden();
});
