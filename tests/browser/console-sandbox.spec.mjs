import { test, expect } from "@playwright/test";

async function selectWidget(page, widget) {
  await page.locator(`[data-sandbox-widget="${widget}"]`).click();
}

test("Console Sandbox assembles independent Runtime widgets and preserves host layout controls", async ({ page }) => {
  await page.route("**/sky/data/alerts_now.json", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ items: [{ id: "sandbox-alert", group: "risk", title: "Sandbox fixture" }] }),
  }));
  await page.goto("/console-sandbox/", { waitUntil: "domcontentloaded" });

  await expect(page.locator('[aria-label="Widget palette"]')).toBeVisible();
  await selectWidget(page, "alerts");
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
  await page.locator('[data-sandbox-layout="unit"]').selectOption("px");
  await page.locator('[data-sandbox-layout="width"]').fill("600");
  await page.locator('[data-sandbox-layout="height"]').fill("300");
  await page.locator('[data-sandbox-action="apply"]').click();
  await expect(page.locator('article[data-sandbox-instance="console-sandbox-1"] [data-role="runtime-root"]')).toHaveCSS("width", "600px");
  await expect(page.locator('article[data-sandbox-instance="console-sandbox-1"] [data-role="runtime-root"][data-nc-widget="alerts"]')).toHaveCount(1);

  await page.locator('[data-sandbox-action="reset-all"]').click();
  await expect(page.locator('[data-drop-zone] .console-sandbox-empty')).toHaveCount(3);
  await expect(page.locator('link[data-nc-sandbox-stylesheet="alerts"]')).toHaveCount(0);
});

test("Console Sandbox palette is a deterministic accessible Registry tile grid", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/console-sandbox/", { waitUntil: "domcontentloaded" });

  await expect(page.locator('[data-sandbox-control="widget"]')).toHaveCount(0);
  const tiles = page.locator('[data-role="palette-grid"] [data-sandbox-widget]');
  await expect(tiles).toHaveCount(13);
  await expect(tiles.evaluateAll(nodes => nodes.map(node => node.dataset.sandboxWidget))).resolves.toEqual([
    "hero", "astro", "sun-moon", "weather", "observing-window", "solar-activity", "map",
    "location", "sky", "news", "events", "alerts", "space-weather",
  ]);
  const rowCounts = await tiles.evaluateAll(nodes => {
    const rows = new Map();
    for (const node of nodes) {
      const top = Math.round(node.getBoundingClientRect().top);
      rows.set(top, (rows.get(top) || 0) + 1);
    }
    return [...rows.values()];
  });
  expect(rowCounts).toEqual([5, 5, 3]);
  await expect(tiles.first()).toHaveAttribute("aria-label", "Select Hero widget");
  await expect(tiles.first().locator(".console-sandbox-palette-icon")).toHaveAttribute("aria-hidden", "true");
  await expect(tiles.first().locator(".console-sandbox-palette-title")).toHaveText("Hero");
  await expect(tiles.first()).toHaveAttribute("aria-pressed", "true");
  await expect(tiles.nth(1)).toHaveAttribute("tabindex", "-1");

  await tiles.first().focus();
  await tiles.first().press("ArrowRight");
  await expect(tiles.nth(1)).toBeFocused();
  await expect(tiles.nth(1)).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[data-role="palette-description"]')).toContainText("Location-aware astronomy");
  await tiles.nth(1).press("End");
  await expect(tiles.last()).toBeFocused();
  await tiles.last().press("Home");
  await expect(tiles.first()).toBeFocused();
});

test("Console Sandbox uses the full desktop canvas and a bounded mobile phone frame", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/console-sandbox/", { waitUntil: "domcontentloaded" });
  const viewport = page.locator('[data-sandbox-control="viewport"]');
  await expect(viewport.locator("option")).toHaveText(["desktop", "mobile"]);
  await expect(viewport).toHaveValue("desktop");

  const desktopGeometry = await page.locator('[data-role="canvas"]').evaluate(canvas => {
    const region = canvas.closest(".console-sandbox-canvas-region");
    const regionStyle = getComputedStyle(region);
    return {
      canvasWidth: canvas.getBoundingClientRect().width,
      contentWidth: region.clientWidth - parseFloat(regionStyle.paddingLeft) - parseFloat(regionStyle.paddingRight),
      maxWidth: getComputedStyle(canvas).maxWidth,
    };
  });
  expect(desktopGeometry.canvasWidth).toBeGreaterThan(600);
  expect(desktopGeometry.canvasWidth).toBeCloseTo(desktopGeometry.contentWidth, 0);
  expect(desktopGeometry.maxWidth).toBe("none");

  await viewport.selectOption("mobile");
  const mobileGeometry = await page.locator('[data-role="canvas"]').evaluate(canvas => {
    const style = getComputedStyle(canvas);
    const rect = canvas.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      ratio: rect.width / rect.height,
      maxWidth: style.maxWidth,
      borderWidth: style.borderTopWidth,
      borderRadius: style.borderTopLeftRadius,
      overflow: style.overflow,
    };
  });
  expect(mobileGeometry.width).toBeLessThanOrEqual(390);
  expect(mobileGeometry.ratio).toBeCloseTo(9 / 19.5, 2);
  expect(mobileGeometry.borderWidth).toBe("2px");
  expect(mobileGeometry.borderRadius).toBe("24px");
  expect(mobileGeometry.overflow).toBe("auto");
});

test("Console Sandbox viewport switching preserves instance identity, layout, config, and orientation", async ({ page }) => {
  await page.goto("/console-sandbox/", { waitUntil: "domcontentloaded" });
  await selectWidget(page, "weather");
  await page.locator('[data-drop-zone="horizontal"]').click();
  await page.locator('[data-sandbox-action="add"]').click();
  const card = page.locator('article[data-sandbox-instance="console-sandbox-1"]');
  await page.locator('[data-sandbox-config="profile"]').selectOption("visual");
  await page.locator('[data-sandbox-layout="unit"]').selectOption("px");
  await page.locator('[data-sandbox-layout="width"]').fill("640");
  await page.locator('[data-sandbox-layout="height"]').fill("360");
  await page.locator('[data-sandbox-action="apply"]').click();

  const before = await card.evaluate(node => ({
    id: node.dataset.sandboxInstance,
    meta: node.querySelector(".console-sandbox-card-meta").textContent,
    profile: document.querySelector('[data-sandbox-config="profile"]').value,
    mode: document.querySelector('[data-sandbox-layout="mode"]').value,
    orientation: node.querySelector('[data-role="runtime-root"]').dataset.ncOrientation,
  }));
  await page.locator('[data-sandbox-control="viewport"]').selectOption("mobile");
  await expect(card).toHaveCount(1);
  await page.locator('[data-sandbox-control="viewport"]').selectOption("desktop");
  const after = await card.evaluate(node => ({
    id: node.dataset.sandboxInstance,
    meta: node.querySelector(".console-sandbox-card-meta").textContent,
    profile: document.querySelector('[data-sandbox-config="profile"]').value,
    mode: document.querySelector('[data-sandbox-layout="mode"]').value,
    orientation: node.querySelector('[data-role="runtime-root"]').dataset.ncOrientation,
  }));
  expect(after).toEqual(before);
});

test("Console Sandbox selects an active compatible placeholder for Add to Canvas", async ({ page }) => {
  await page.goto("/console-sandbox/", { waitUntil: "domcontentloaded" });
  const add = page.locator('[data-sandbox-action="add"]');
  const horizontal = page.locator('[data-drop-zone="horizontal"]');
  const vertical = page.locator('[data-drop-zone="vertical"]');
  const square = page.locator('[data-drop-zone="square"]');

  await expect(horizontal).toHaveAttribute("data-active", "true");
  await expect(horizontal).toHaveAttribute("aria-label", /horizontal orientation, selected/);
  await expect(add).toBeEnabled();
  await selectWidget(page, "sky");
  await expect(add).toBeDisabled();
  await expect(add).toHaveAttribute("title", /Sky can only be placed/);
  await square.click();
  await expect(square).toHaveAttribute("data-active", "true");
  await expect(square).toHaveAttribute("aria-label", /square orientation, selected/);
  await expect(add).toBeEnabled();
  await add.click();
  await expect(square.locator('article[data-sandbox-widget="sky"]')).toHaveCount(1);

  await selectWidget(page, "weather");
  await vertical.focus();
  await vertical.press("Enter");
  await expect(vertical).toHaveAttribute("data-active", "true");
  await expect(add).toBeEnabled();
  await expect(page.locator('[data-role="canvas-status"]')).toContainText("vertical orientation");
});

test("Console Sandbox keeps controls left and the full Composition Canvas right", async ({ page }) => {
  await page.goto("/console-sandbox/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".console-sandbox-shell")).toHaveCount(1);
  expect(await page.locator(".console-sandbox-shell").evaluate(shell => [...shell.children].map(node => node.className))).toEqual([
    "console-sandbox-controls",
    "console-sandbox-panel console-sandbox-canvas-region",
  ]);
  expect(await page.locator(".console-sandbox-controls").evaluate(column => [...column.children].map(node => node.className))).toEqual([
    "console-sandbox-panel",
    "console-sandbox-panel console-sandbox-inspector",
    "console-sandbox-panel console-sandbox-composition",
    "sandbox-button sandbox-button-danger",
  ]);
  await expect(page.locator(".console-sandbox-composition .console-sandbox-instance-list")).toHaveCount(1);
  await expect(page.locator(".console-sandbox-canvas-region .console-sandbox-composition")).toHaveCount(0);
  await selectWidget(page, "alerts");
  await page.locator('[data-sandbox-action="add"]').click();
  await expect(page.locator('[data-sandbox-layout="unit"]')).toHaveValue("percent");
  await expect(page.locator('[data-sandbox-layout="width"]')).toHaveValue("100");
  await expect(page.locator('[data-sandbox-layout="height"]')).toHaveValue("100");
  await expect(page.locator('.console-sandbox-inspector [data-sandbox-action="apply"]')).toHaveCount(1);
  await expect(page.locator('.console-sandbox-inspector [data-sandbox-action="reset-card"]')).toHaveCount(0);
  await expect(page.locator('.console-sandbox-inspector [data-sandbox-action="move-left"], .console-sandbox-inspector [data-sandbox-action="move-right"]')).toHaveCount(0);

  const dimensions = await page.locator('article[data-sandbox-instance="console-sandbox-1"] [data-role="runtime-root"]').evaluate(root => {
    const frame = root.closest(".console-sandbox-preview-frame");
    const frameRect = frame.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    return {
      frameWidth: frameRect.width,
      frameHeight: frameRect.height,
      rootWidth: rootRect.width,
      rootHeight: rootRect.height,
      renderedWidth: Number(root.dataset.sandboxRenderedWidth),
      renderedHeight: Number(root.dataset.sandboxRenderedHeight),
    };
  });
  expect(dimensions.frameWidth).toBeGreaterThan(0);
  expect(dimensions.frameHeight).toBeGreaterThan(0);
  expect(dimensions.rootWidth).toBeGreaterThan(0);
  expect(dimensions.rootHeight).toBeGreaterThan(0);
  expect(dimensions.renderedWidth).toBe(Math.round(dimensions.rootWidth));
  expect(dimensions.renderedHeight).toBe(Math.round(dimensions.rootHeight));

  const desktopLayout = await page.locator(".console-sandbox-shell").evaluate(shell => {
    const rect = node => {
      const value = node.getBoundingClientRect();
      return { left: value.left, top: value.top, width: value.width, height: value.height };
    };
    return {
      shell: rect(shell),
      children: [...shell.children].map(rect),
      canvasRegion: rect(shell.querySelector(".console-sandbox-canvas-region")),
      canvas: rect(shell.querySelector('[data-role="canvas"]')),
    };
  });
  expect(desktopLayout.children[0].left).toBeLessThan(desktopLayout.children[1].left);
  expect(desktopLayout.children[0].top).toBeCloseTo(desktopLayout.children[1].top, 0);
  expect(desktopLayout.canvasRegion.width).toBeGreaterThan(desktopLayout.children[0].width);
  const canvasRegionStyle = await page.locator(".console-sandbox-canvas-region").evaluate(region => {
    const style = getComputedStyle(region);
    return {
      contentWidth: region.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
    };
  });
  expect(desktopLayout.canvas.width).toBeCloseTo(canvasRegionStyle.contentWidth, 0);
  expect(desktopLayout.canvas.width).toBeGreaterThan(900);

  await page.setViewportSize({ width: 600, height: 1000 });
  const mobileLayout = await page.locator(".console-sandbox-shell").evaluate(shell => {
    const rect = node => {
      const value = node.getBoundingClientRect();
      return { left: value.left, top: value.top, width: value.width, bottom: value.bottom };
    };
    return {
      shell: rect(shell),
      controls: rect(shell.querySelector(".console-sandbox-controls")),
      canvasRegion: rect(shell.querySelector(".console-sandbox-canvas-region")),
    };
  });
  expect(mobileLayout.controls.left).toBeCloseTo(mobileLayout.canvasRegion.left, 0);
  expect(mobileLayout.canvasRegion.top).toBeGreaterThanOrEqual(mobileLayout.controls.bottom - 0.5);
  expect(mobileLayout.controls.width).toBeCloseTo(mobileLayout.canvasRegion.width, 0);

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('[data-sandbox-layout="unit"]').selectOption("px");
  await page.locator('[data-sandbox-action="apply"]').click();
  await expect(page.locator('[data-role="inspector-status"]')).toContainText("between 160 and 1600");
  await page.locator('[data-sandbox-layout="width"]').fill("600");
  await page.locator('[data-sandbox-layout="height"]').fill("300");
  await page.locator('[data-sandbox-action="apply"]').click();
  await expect(page.locator('[data-role="runtime-root"]')).toHaveAttribute("data-sandbox-unit", "px");
  await expect(page.locator('[data-role="runtime-root"]')).toHaveAttribute("data-sandbox-rendered-width", "600");
});

test("Console Sandbox keeps the square placeholder and Sky preview geometrically square", async ({ page }) => {
  const measureSquare = async () => page.locator('[data-drop-zone="square"]').evaluate(zone => {
    const zoneRect = zone.getBoundingClientRect();
    const root = zone.querySelector('[data-role="runtime-root"]');
    const rootRect = root?.getBoundingClientRect() || null;
    return {
      zone: { width: zoneRect.width, height: zoneRect.height },
      root: rootRect && { width: rootRect.width, height: rootRect.height },
    };
  });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/console-sandbox/", { waitUntil: "domcontentloaded" });
  const emptyDesktop = await measureSquare();
  expect(Math.abs(emptyDesktop.zone.width - emptyDesktop.zone.height), "desktop square placeholder").toBeLessThanOrEqual(0.5);

  await selectWidget(page, "sky");
  await page.locator('[data-drop-zone="square"]').click();
  await page.locator('[data-sandbox-action="add"]').click();
  await expect(page.locator('[data-role="runtime-root"][data-nc-widget="sky"]')).toHaveCount(1);
  const desktopSky = await measureSquare();
  expect(desktopSky.root).not.toBeNull();
  expect(Math.abs(desktopSky.root.width - desktopSky.root.height), "desktop Sky preview").toBeLessThanOrEqual(0.5);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(100);
  const mobileSky = await measureSquare();
  expect(Math.abs(mobileSky.zone.width - mobileSky.zone.height), "mobile square placeholder").toBeLessThanOrEqual(0.5);
  expect(mobileSky.root).not.toBeNull();
  expect(Math.abs(mobileSky.root.width - mobileSky.root.height), "mobile Sky preview").toBeLessThanOrEqual(0.5);
});

test("widget presentation styles do not overwrite Sandbox chrome", async ({ page }) => {
  await page.goto("/console-sandbox/", { waitUntil: "domcontentloaded" });
  const chromeBefore = await page.locator("body").evaluate(body => {
    const header = document.querySelector(".nc-console-sandbox-page-header");
    const style = getComputedStyle(body);
    const headerStyle = getComputedStyle(header);
    return { backgroundImage: style.backgroundImage, fontFamily: style.fontFamily, headerBorder: headerStyle.borderBottomColor };
  });

  await selectWidget(page, "alerts");
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
  await selectWidget(page, "sky");
  await page.locator('[data-drop-zone="square"]').click();
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

test("Console Sandbox keeps Sky square-only and exposes desktop/mobile canvas modes", async ({ page }) => {
  await page.goto("/console-sandbox/", { waitUntil: "domcontentloaded" });
  await selectWidget(page, "sky");
  await page.locator('[data-drop-zone="square"]').click();
  await page.locator('[data-sandbox-action="add"]').click();
  await expect(page.locator('[data-sandbox-layout="mode"]')).toHaveValue("square");
  await page.locator('[data-sandbox-layout="unit"]').selectOption("px");
  await page.locator('[data-sandbox-layout="width"]').fill("400");
  await page.locator('[data-sandbox-layout="height"]').fill("401");
  await expect(page.locator('[data-sandbox-layout="width"]')).toHaveValue("401");
  await expect(page.locator('[data-sandbox-layout="height"]')).toHaveValue("401");
  await page.locator('[data-sandbox-action="apply"]').click();
  await expect(page.locator('[data-role="inspector-status"]')).toContainText("State: idle");
  await expect(page.locator('[data-sandbox-control="viewport"] option')).toHaveText(["desktop", "mobile"]);
  await page.locator('[data-sandbox-control="viewport"]').selectOption("mobile");
  await expect(page.locator('[data-role="canvas"]')).toHaveAttribute("data-viewport", "mobile");
});

test("Console Sandbox keeps mobile Sky and oriented previews inside their cards", async ({ page }) => {
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
    await selectWidget(page, fixture.widget);
    await page.locator(`[data-drop-zone="${fixture.mode}"]`).click();
    await page.locator('[data-sandbox-action="add"]').click();
    await expect(page.locator(`[data-role="runtime-root"][data-nc-widget="${fixture.widget}"]`).last()).toHaveCount(1);
    await page.locator('[data-sandbox-layout="mode"]').selectOption(fixture.mode);
    await page.locator('[data-sandbox-layout="unit"]').selectOption("px");
    await page.locator('[data-sandbox-layout="width"]').fill(fixture.width);
    await page.locator('[data-sandbox-layout="height"]').fill(fixture.height);
    await page.locator('[data-sandbox-action="apply"]').click();
    await page.locator('[data-sandbox-control="viewport"]').selectOption("mobile");

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

    expect(geometry.rootWidth, `${fixture.widget}: mobile root width`).toBeGreaterThan(0);
    expect(geometry.rootRight, `${fixture.widget}: root right edge`).toBeLessThanOrEqual(geometry.cardContentRight + 0.5);
    expect(geometry.rootRight, `${fixture.widget}: canvas right edge`).toBeLessThanOrEqual(geometry.canvasContentRight + 0.5);
    expect(geometry.rootLeft, `${fixture.widget}: mobile root left edge`).toBeGreaterThanOrEqual(geometry.cardContentLeft - 0.5);
    expect(geometry.cardScrollWidth, `${fixture.widget}: card horizontal overflow`).toBeLessThanOrEqual(geometry.cardClientWidth);
    expect(geometry.canvasScrollWidth, `${fixture.widget}: canvas horizontal overflow`).toBeLessThanOrEqual(geometry.canvasClientWidth);
    if (fixture.square) expect(Math.abs(geometry.rootWidth - geometry.rootHeight), "sky: mobile root remains square").toBeLessThanOrEqual(0.5);
    else expect(await page.locator('[data-sandbox-layout="mode"]').inputValue(), `${fixture.widget}: mobile mode`).toBe("vertical");

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

test("Console Sandbox moves palette and existing widgets between labelled zones", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/console-sandbox/", { waitUntil: "domcontentloaded" });
  await selectWidget(page, "weather");
  await page.locator('[data-sandbox-widget="weather"]').dragTo(page.locator('[data-drop-zone="horizontal"]'));
  const card = page.locator('article[data-sandbox-instance="console-sandbox-1"]');
  await expect(card).toHaveCount(1);
  await card.locator('[data-sandbox-action="select"]').click();
  await page.locator('[data-sandbox-config="profile"]').selectOption("visual");
  await page.locator('[data-sandbox-action="apply"]').click();

  await card.dragTo(page.locator('[data-drop-zone="vertical"]'));
  await expect(page.locator('[data-drop-zone="vertical"] article[data-sandbox-instance="console-sandbox-1"]')).toHaveCount(1);
  await expect(page.locator('[data-sandbox-layout="mode"]')).toHaveValue("vertical");
  await expect(page.locator('[data-sandbox-config="profile"]')).toHaveValue("visual");
  await expect(page.locator('[data-drop-zone="horizontal"] .console-sandbox-empty')).toHaveText("This zone is empty.");

  await selectWidget(page, "sky");
  await page.locator('[data-drop-zone="square"]').click();
  await page.locator('[data-sandbox-action="add"]').click();
  await page.locator('[data-drop-zone="horizontal"]').click();
  await page.locator('[data-drop-zone="horizontal"] [data-sandbox-action="move-selected-to-zone"]').click();
  await expect(page.locator('[data-role="canvas-status"]')).toContainText("Sky can only be placed");
  await expect(page.locator('[data-drop-zone="horizontal"] article[data-sandbox-widget="sky"]')).toHaveCount(0);
  await expect(page.locator('[data-drop-zone="vertical"] article[data-sandbox-instance="console-sandbox-1"]')).toHaveCount(1);
});

test("Console Sandbox provides keyboard and touch-compatible zone actions", async ({ page }) => {
  await page.goto("/console-sandbox/", { waitUntil: "domcontentloaded" });
  await selectWidget(page, "weather");
  await page.locator('[data-sandbox-action="add"]').click();
  const card = page.locator('article[data-sandbox-instance="console-sandbox-1"]');
  await card.focus();
  await card.press("Space");
  await expect(page.locator('[data-sandbox-action="move-selected-to-zone"]').first()).toBeFocused();
  await page.locator('[data-drop-zone="vertical"] [data-sandbox-action="move-selected-to-zone"]').click();
  await expect(page.locator('[data-drop-zone="vertical"] article[data-sandbox-instance="console-sandbox-1"]')).toHaveCount(1);

  const touchContext = await page.context().browser()?.newContext({ hasTouch: true, viewport: { width: 390, height: 844 } });
  if (touchContext) {
    const touchPage = await touchContext.newPage();
    await touchPage.goto("/console-sandbox/", { waitUntil: "domcontentloaded" });
    await selectWidget(touchPage, "sky");
    await touchPage.locator('[data-drop-zone="square"]').tap();
    await touchPage.locator('[data-sandbox-action="add"]').tap();
    await expect(touchPage.locator('[data-drop-zone="square"] article[data-sandbox-widget="sky"]')).toHaveCount(1);
    await touchContext.close();
  }
});
