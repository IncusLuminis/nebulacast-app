import { test, expect } from "@playwright/test";

// Future browser runner: `npm run test:browser -- tests/browser/widget-lifecycle.spec.mjs`.
// This remains a real Playwright spec even when the current checkout has no
// installed Playwright package or browser binaries; Node unit coverage is not
// replaced by this optional environment.
test("widget lifecycle fixture covers public mount, independent destroy and remount", async ({ page }) => {
  const diagnostics = [];
  page.on("console", message => {
    if (message.type() === "error") diagnostics.push(`console: ${message.text()}`);
  });
  page.on("pageerror", error => diagnostics.push(`pageerror: ${error.message}`));
  await page.goto("/widget-host/", { waitUntil: "domcontentloaded" });

  const astro = page.getByRole("region", { name: "Astro widget" });
  const sunMoon = page.getByRole("region", { name: "Sun & Moon widget" });
  try {
    await expect(astro).toHaveAttribute("data-nc-widget", "astro");
    await expect(sunMoon).toHaveAttribute("data-nc-widget", "sun-moon");
    await expect(astro).toHaveAttribute("data-nc-state", "ready");
    await expect(sunMoon).toHaveAttribute("data-nc-state", "ready");

    const shellStyle = await astro.evaluate(root => {
      const style = getComputedStyle(root);
      return {
        background: style.backgroundColor,
        color: style.color,
        paddingToken: style.getPropertyValue("--nc-widget-padding").trim(),
      };
    });
    expect(shellStyle).toEqual({
      background: "rgb(11, 13, 18)",
      color: "rgb(230, 230, 230)",
      paddingToken: "0.5rem",
    });
    const sentinel = page.getByText("Outside widget sentinel", { exact: true });
    await expect(sentinel).not.toHaveClass(/nc-widget/);
    await expect(sentinel).not.toHaveAttribute("data-nc-widget");
    await expect(sentinel).toHaveCSS("color", "rgb(18, 52, 86)");
    await expect(sentinel).toHaveCSS("padding-top", "3px");

    const stateControl = page.getByLabel("Astro state");
    const applyState = page.getByRole("button", { name: "Apply Astro state" });
    for (const state of ["loading", "ready", "empty", "stale", "degraded", "error"]) {
      await stateControl.selectOption(state);
      await applyState.click();
      await expect(astro).toHaveAttribute("data-nc-state", state);
    }

    await page.getByRole("button", { name: "Destroy Astro" }).click();
    await expect(astro).not.toHaveAttribute("data-nc-widget");
    await expect(sunMoon).toHaveAttribute("data-nc-widget", "sun-moon");
    await page.getByRole("button", { name: "Unmount Sun & Moon" }).click();
    await expect(sunMoon).not.toHaveAttribute("data-nc-widget");
    await page.getByRole("button", { name: "Remount both" }).click();
    await expect(astro).toHaveAttribute("data-nc-state", "ready");
    await expect(sunMoon).toHaveAttribute("data-nc-state", "ready");
  } catch (error) {
    error.message += `\nBrowser diagnostics:\n${diagnostics.join("\n") || "none"}`;
    throw error;
  }
});
