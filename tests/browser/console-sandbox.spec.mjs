import { test, expect } from "@playwright/test";

test("Console Sandbox assembles independent Runtime widgets and preserves host layout controls", async ({ page }) => {
  await page.route("**/sky/data/alerts_now.json", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ items: [{ id: "sandbox-alert", group: "risk", title: "Sandbox fixture" }] }),
  }));
  await page.goto("/console-sandbox/", { waitUntil: "domcontentloaded" });

  await expect(page.locator('[aria-label="Widget palette"]')).toBeVisible();
  await page.locator('[data-sandbox-control="widget"]').selectOption("alerts");
  await page.locator('[data-sandbox-action="add"]').click();
  await expect(page.locator('[data-sandbox-instance="console-sandbox-1"] [data-role="runtime-root"][data-nc-widget="alerts"]')).toHaveCount(1);
  await expect(page.locator('[data-sandbox-instance="console-sandbox-1"] .console-sandbox-card-status')).toHaveText("State: ready");
  await expect(page.locator('link[data-nc-sandbox-stylesheet="alerts"]')).toHaveCount(1);

  await page.locator('[data-sandbox-action="add"]').click();
  await expect(page.locator('[data-role="runtime-root"][data-nc-widget="alerts"]')).toHaveCount(2);
  await expect(page.locator('link[data-nc-sandbox-stylesheet="alerts"]')).toHaveCount(1);
  const ids = await page.locator("article[data-sandbox-instance]").evaluateAll(nodes => nodes.map(node => node.dataset.sandboxInstance));
  expect(new Set(ids).size).toBe(2);

  await page.locator('[data-sandbox-action="select"]').first().click();
  await page.locator('[data-sandbox-layout="width"]').fill("700");
  await page.locator('[data-sandbox-layout="height"]').fill("300");
  await page.locator('[data-sandbox-action="apply"]').click();
  await expect(page.locator('article[data-sandbox-instance="console-sandbox-1"] [data-role="runtime-root"]')).toHaveCSS("width", "700px");
  await expect(page.locator('article[data-sandbox-instance="console-sandbox-1"] [data-role="runtime-root"][data-nc-widget="alerts"]')).toHaveCount(1);

  await page.locator('[data-sandbox-action="reset-all"]').click();
  await expect(page.locator('[data-role="canvas"]')).toContainText("Add a widget to start building");
  await expect(page.locator('link[data-nc-sandbox-stylesheet="alerts"]')).toHaveCount(0);
});

test("widget presentation styles do not overwrite Sandbox chrome", async ({ page }) => {
  await page.goto("/console-sandbox/", { waitUntil: "domcontentloaded" });
  const chromeBefore = await page.locator("body").evaluate(body => {
    const header = document.querySelector(".nc-console-sandbox-page-header");
    const style = getComputedStyle(body);
    const headerStyle = getComputedStyle(header);
    return { backgroundImage: style.backgroundImage, fontFamily: style.fontFamily, headerBorder: headerStyle.borderBottomColor };
  });

  await page.locator('[data-sandbox-control="widget"]').selectOption("alerts");
  await page.locator('[data-sandbox-action="add"]').click();
  await expect(page.locator('[data-role="runtime-root"][data-nc-widget="alerts"]')).toHaveCount(1);
  const chromeAfter = await page.locator("body").evaluate(body => {
    const header = document.querySelector(".nc-console-sandbox-page-header");
    const style = getComputedStyle(body);
    const headerStyle = getComputedStyle(header);
    return { backgroundImage: style.backgroundImage, fontFamily: style.fontFamily, headerBorder: headerStyle.borderBottomColor };
  });
  expect(chromeAfter).toEqual(chromeBefore);

  await page.locator('[data-sandbox-action="reset-all"]').click();
  await page.locator('[data-sandbox-control="widget"]').selectOption("sky");
  await page.locator('[data-sandbox-action="add"]').click();
  await expect(page.locator('[data-role="runtime-root"][data-nc-widget="sky"]')).toHaveCount(1);
  const chromeAfterSky = await page.locator("body").evaluate(body => {
    const header = document.querySelector(".nc-console-sandbox-page-header");
    const style = getComputedStyle(body);
    const headerStyle = getComputedStyle(header);
    return { backgroundImage: style.backgroundImage, fontFamily: style.fontFamily, headerBorder: headerStyle.borderBottomColor };
  });
  expect(chromeAfterSky).toEqual(chromeBefore);
});

test("Console Sandbox keeps Sky square-only and exposes narrow canvas mode", async ({ page }) => {
  await page.goto("/console-sandbox/", { waitUntil: "domcontentloaded" });
  await page.locator('[data-sandbox-control="widget"]').selectOption("sky");
  await page.locator('[data-sandbox-action="add"]').click();
  await expect(page.locator('[data-sandbox-layout="mode"]')).toHaveValue("square");
  await page.locator('[data-sandbox-layout="width"]').fill("400");
  await page.locator('[data-sandbox-layout="height"]').fill("401");
  await page.locator('[data-sandbox-action="apply"]').click();
  await expect(page.locator('[data-role="inspector-status"]')).toContainText("square");
  await page.locator('[data-sandbox-control="viewport"]').selectOption("narrow");
  await expect(page.locator('[data-role="canvas"]')).toHaveAttribute("data-viewport", "narrow");
});

test("Console Sandbox keeps narrow Sky and oriented previews inside their cards", async ({ page }) => {
  await page.route("**/sky/data/alerts_now.json", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ items: [{ id: "sandbox-alert", group: "risk", title: "Sandbox fixture" }] }),
  }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/console-sandbox/", { waitUntil: "domcontentloaded" });

  for (const fixture of [
    { widget: "sky", mode: "square", width: "400", height: "400", square: true },
    { widget: "alerts", mode: "vertical", width: "320", height: "640", square: false },
  ]) {
    await page.locator('[data-sandbox-control="widget"]').selectOption(fixture.widget);
    await page.locator('[data-sandbox-action="add"]').click();
    await expect(page.locator(`[data-role="runtime-root"][data-nc-widget="${fixture.widget}"]`).last()).toHaveCount(1);
    await page.locator('[data-sandbox-layout="mode"]').selectOption(fixture.mode);
    await page.locator('[data-sandbox-layout="width"]').fill(fixture.width);
    await page.locator('[data-sandbox-layout="height"]').fill(fixture.height);
    await page.locator('[data-sandbox-action="apply"]').click();
    await page.locator('[data-sandbox-control="viewport"]').selectOption("narrow");

    const geometry = await page.locator(`article[data-sandbox-widget="${fixture.widget}"]`).last().locator('[data-role="runtime-root"]').evaluate(root => {
      const card = root.closest(".console-sandbox-card");
      const canvas = root.closest(".console-sandbox-canvas");
      const cardRect = card.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      const cardStyle = getComputedStyle(card);
      const cardContentLeft = cardRect.left + card.clientLeft + parseFloat(cardStyle.paddingLeft);
      const cardContentRight = cardRect.left + card.clientLeft + card.clientWidth - parseFloat(cardStyle.paddingRight);
      const canvasStyle = getComputedStyle(canvas);
      const canvasContentRight = canvasRect.left + canvas.clientLeft + canvas.clientWidth - parseFloat(canvasStyle.paddingRight);
      return {
        rootWidth: rootRect.width,
        rootHeight: rootRect.height,
        rootLeft: rootRect.left,
        rootRight: rootRect.right,
        cardContentLeft,
        cardContentRight,
        canvasContentRight,
        cardScrollWidth: card.scrollWidth,
        cardClientWidth: card.clientWidth,
        canvasScrollWidth: canvas.scrollWidth,
        canvasClientWidth: canvas.clientWidth,
      };
    });

    expect(geometry.rootWidth, `${fixture.widget}: narrow root width`).toBeGreaterThan(0);
    expect(geometry.rootRight, `${fixture.widget}: root right edge`).toBeLessThanOrEqual(geometry.cardContentRight + 0.5);
    expect(geometry.rootRight, `${fixture.widget}: canvas right edge`).toBeLessThanOrEqual(geometry.canvasContentRight + 0.5);
    expect(geometry.rootLeft, `${fixture.widget}: root left edge`).toBeGreaterThanOrEqual(geometry.cardContentLeft - 0.5);
    expect(geometry.cardScrollWidth, `${fixture.widget}: card horizontal overflow`).toBeLessThanOrEqual(geometry.cardClientWidth);
    expect(geometry.canvasScrollWidth, `${fixture.widget}: canvas horizontal overflow`).toBeLessThanOrEqual(geometry.canvasClientWidth);
    if (fixture.square) expect(Math.abs(geometry.rootWidth - geometry.rootHeight), "sky: narrow root remains square").toBeLessThanOrEqual(0.5);
    else expect(await page.locator('[data-sandbox-layout="mode"]').inputValue(), `${fixture.widget}: narrow mode`).toBe("vertical");

    await page.locator('[data-sandbox-action="reset-all"]').click();
  }
});

test("Console Sandbox returns focus after remove and reset-all", async ({ page }) => {
  await page.goto("/console-sandbox/", { waitUntil: "domcontentloaded" });
  await page.locator('[data-sandbox-action="add"]').click();
  await page.locator('[data-sandbox-action="add"]').click();
  const secondId = await page.locator('[data-role="instance-list"] [data-sandbox-action="select"]').nth(1).getAttribute("data-sandbox-instance");
  await page.locator('article[data-sandbox-instance="console-sandbox-1"] [data-sandbox-action="remove"]').click();
  await expect(page.locator(`[data-role="instance-list"] [data-sandbox-action="select"][data-sandbox-instance="${secondId}"]`)).toBeFocused();
  await page.locator('[data-sandbox-action="reset-all"]').click();
  await expect(page.locator('[data-sandbox-action="add"]')).toBeFocused();
});
