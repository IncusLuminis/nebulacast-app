import { test, expect } from "@playwright/test";

// Run with `npm run test:browser -- tests/browser/widget-host.spec.mjs` after
// installing the repository's declared Playwright dev dependency. The current
// lightweight checkout may not include node_modules, so this contract remains
// separate from the pure Node unit coverage.
test("widget host exercises registered types and independent lifecycle", async ({ page }) => {
  const diagnostics = [];
  page.on("console", message => {
    if (message.type() === "error") diagnostics.push(`console: ${message.text()}`);
  });
  page.on("pageerror", error => diagnostics.push(`pageerror: ${error.message}`));

  await page.goto("/widget-host/", { waitUntil: "domcontentloaded" });
  const astro = page.locator('[data-widget="astro"]');
  const sunMoon = page.locator('[data-widget="sun-moon"]');

  try {
    await expect(astro).toHaveClass(/nc-widget/);
    await expect(sunMoon).toHaveClass(/nc-widget/);
    await expect(astro).toHaveAttribute("data-nc-widget", "astro");
    await expect(sunMoon).toHaveAttribute("data-nc-widget", "sun-moon");
    await expect(astro).toHaveAttribute("data-nc-state", "ready");
    await expect(sunMoon).toHaveAttribute("data-nc-state", "ready");
    await expect(astro).toHaveAttribute("data-nc-orientation", "horizontal");
    await expect(sunMoon).toHaveAttribute("data-nc-orientation", "vertical");

    const sentinel = page.getByText("Outside widget sentinel");
    await expect(sentinel).not.toHaveClass(/nc-widget/);
    await expect(sentinel).not.toHaveAttribute("data-nc-widget");
    await expect(sentinel).toHaveCSS("color", "rgb(18, 52, 86)");
    await expect(sentinel).toHaveCSS("padding-top", "3px");
    const containedStyle = await astro.evaluate(root => {
      const style = getComputedStyle(root);
      return {
        backgroundColor: style.backgroundColor,
        color: style.color,
        shellPadding: style.getPropertyValue("--nc-widget-padding").trim(),
      };
    });
    expect(containedStyle).toEqual({
      backgroundColor: "rgb(11, 13, 18)",
      color: "rgb(230, 230, 230)",
      shellPadding: "0.5rem",
    });

    await page.getByRole("button", { name: "Destroy Astro" }).click();
    await expect(astro).not.toHaveClass(/nc-widget/);
    await expect(sunMoon).toHaveClass(/nc-widget/);

    await page.getByRole("button", { name: "Unmount Sun & Moon" }).click();
    await expect(sunMoon).not.toHaveClass(/nc-widget/);

    await page.getByRole("button", { name: "Remount both" }).click();
    await expect(astro).toHaveAttribute("data-nc-state", "ready");
    await expect(sunMoon).toHaveAttribute("data-nc-state", "ready");
    await expect(page.locator("#status")).toContainText("astro, sun-moon");

    const stateControl = page.getByLabel("Astro state");
    const applyState = page.getByRole("button", { name: "Apply Astro state" });
    for (const state of ["loading", "ready", "empty", "stale", "degraded", "error"]) {
      await stateControl.selectOption(state);
      await applyState.click();
      await expect(astro).toHaveAttribute("data-nc-state", state);
      await expect(page.locator("#status")).toContainText(`astro state: ${state}`);
    }

    await page.getByRole("button", { name: "Simulate mount failure" }).click();
    await expect(sunMoon).toHaveAttribute("data-nc-state", "error");
    await expect(page.locator("#status")).toContainText("Expected mount failure");
  } catch (error) {
    error.message += `\nBrowser diagnostics:\n${diagnostics.join("\n") || "none"}`;
    throw error;
  }
});
