import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { widgetCatalog } from "../../sites/staging/shared/widget-catalog.mjs";

const HELIO_FIXTURE = Object.freeze({
  ...JSON.parse(readFileSync(new URL("../../sites/staging/data/helio_now.json", import.meta.url), "utf8")),
  updated_utc: "2099-01-01T00:00:00Z",
});

const WEATHER_FIXTURE = {
  ok: true,
  source: "sandbox-parity-fixture",
  generated_at: "2099-01-01T00:00:00Z",
  location: { name: "Warsaw", lat: 52.2297, lon: 21.0122, tz: "Europe/Warsaw" },
  horizon_hours: 4,
  profiles: ["balanced", "visual", "broadband", "planetary"],
  default_profile: "balanced",
  decision: {
    best_tonight: { start: "2099-01-01T01:00:00Z", end: "2099-01-01T03:00:00Z" },
    best_window_2h: { start: "2099-01-01T01:00:00Z", end: "2099-01-01T03:00:00Z" },
  },
  hourly: Array.from({ length: 4 }, (_, index) => ({
    timestamp_utc: `2099-01-01T0${index}:00:00Z`,
    time: `2099-01-01T0${index}:00:00Z`,
    night: true,
    score: 72 - index,
    gate: "OPEN",
    cloud: { total_percent: 10 + index, low_percent: 5, mid_percent: 3, high_percent: 2 },
    wind: { speed_mps: 2, gust_mps: 3, direction_deg: 180 },
    precip: { probability_percent: 0, mm: 0 },
    air: { temperature_c: 16, dewpoint_c: 8, humidity_percent: 60, pressure_hpa: 1012, visibility_m: 20000 },
    astro: { seeing: "excellent", transparency: "excellent", seeing_raw: 2, transparency_raw: 2 },
  })),
};

const SUN_MOON_FIXTURE = { schema: "sun_moon.v2", frames: [] };
const NEWS_FIXTURE = "<rss><channel><item><title>Parity News</title><link>https://example.test/news</link><pubDate>2099-01-01T00:00:00Z</pubDate><category>Science</category><description>Deterministic parity item</description></item></channel></rss>";
const EVENTS_FIXTURE = { items: [{ title: "Parity Event", category: "METEORS", published_at: "2099-01-01T00:00:00Z", url: "https://example.test/event", summary: "Deterministic parity event" }] };
const ALERTS_FIXTURE = { items: [{ id: "parity-alert", group: "risk", title: "Deterministic parity alert", published_at: "2099-01-01T00:00:00Z" }] };

const SKY_FIXTURES = Object.freeze({
  "stars.json": { stars: [] },
  "constellations.json": { constellations: [] },
  "milkyway.json": { points: [] },
  "objects_today.json": { items: [] },
  "alerts_now.json": ALERTS_FIXTURE,
  "sun_moon.json": SUN_MOON_FIXTURE,
  "dso_messier.json": { items: [] },
  "planets.json": { items: [] },
  "ranking.json": { items: [] },
});

/**
 * The matrix is deliberately explicit: a catalog change must update this
 * approved-route contract instead of silently reducing parity coverage.
 * `probe` is a stable widget-owned element used for computed presentation
 * checks; it is not a pixel-snapshot baseline.
 */
const PARITY_MATRIX = Object.freeze([
  { type: "hero", route: "/", routeRoot: "#console-hero", probe: ".hero-card", routeMode: "horizontal", stylesheets: ["/hero/widget.css"], ownedProperties: ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "borderRadius"], overflowBaseline: { sandbox: { desktop: { horizontal: 4, vertical: 0 } } } },
  { type: "astro", route: "/weather/", routeRoot: "#w-astro", probe: ".widget-card", routeMode: "horizontal", stylesheets: ["/weather/assets/weather.css", "/weather/widgets/astro/astro.css"], ownedProperties: ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "borderRadius"] },
  { type: "sun-moon", route: "/sun/", routeRoot: "#w-sun", probe: ".sunmoon-card", routeMode: "horizontal", stylesheets: ["/weather/assets/weather.css", "/weather/widgets/sun_moon/sun_moon.css"], ownedProperties: ["fontSize", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "borderRadius", "boxSizing"] },
  { type: "weather", route: "/weather/", routeRoot: "#w-weather", probe: "#poc-weather", routeMode: "horizontal", narrowMode: "vertical", stylesheets: ["/weather/widgets/weather/weather.css"], ownedProperties: ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "borderRadius"] },
  { type: "observing-window", route: "/", routeRoot: "#dbp-window-body", probe: null, routeMode: "horizontal", stylesheets: [], ownedProperties: [] },
  { type: "solar-activity", route: "/", routeRoot: "#dbp-solar-body", probe: null, routeMode: "horizontal", stylesheets: [], ownedProperties: [] },
  { type: "map", route: "/map/", routeRoot: "#mapRoot", probe: ".widget-map-container", routeMode: "horizontal", stylesheets: ["/weather/assets/weather.css", "/weather/widgets/map/map.css"], ownedProperties: [] },
  { type: "location", route: "/weather/", routeRoot: "#w-location", probe: ".loc-action-bar", routeMode: "horizontal", narrowMode: "vertical", stylesheets: ["/weather/assets/weather.css", "/weather/widgets/location/location.css"], ownedProperties: ["display", "gap", "marginTop", "marginBottom", "flexWrap"] },
  { type: "sky", route: "/sky/", routeRoot: "#skyMount", probe: ".sky-root", routeMode: "square", narrowMode: "square", stylesheets: ["/sky/assets/sky.css"], ownedProperties: ["position"] },
  { type: "news", route: "/news/", routeRoot: "#nrw-root-page", probe: ".nrw-root", routeMode: "horizontal", stylesheets: ["/assets/css/widget_news.css"], ownedProperties: ["fontFamily", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "marginTop", "marginRight", "marginBottom", "marginLeft"] },
  { type: "events", route: "/calendar/", routeRoot: "#nrc-root-page", probe: ".nrc-root", routeMode: "horizontal", stylesheets: ["/assets/css/widget_calendar.css"], ownedProperties: ["fontFamily", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "marginTop", "marginRight", "marginBottom", "marginLeft"] },
  { type: "alerts", route: "/", routeRoot: "#fs-sky", probe: ".nc-alerts-root", routeMode: "horizontal", stylesheets: ["/alerts/widget.css"], ownedProperties: ["fontFamily", "fontSize", "lineHeight", "minWidth"] },
  { type: "space-weather", route: "/helio/", routeRoot: "#w-helio", probe: null, routeMode: "horizontal", stylesheets: [], ownedProperties: [] },
]);

// The legacy Map page currently owns its HTML shell and does not advertise
// the Registry manifest links. Keep this gap explicit: a new or changed gap
// must fail the gate and be reviewed before staging.
const APPROVED_ROUTE_STYLE_GAPS = Object.freeze({
  map: Object.freeze(["/weather/assets/weather.css", "/weather/widgets/map/map.css"]),
});

function json(route, body, status = 200) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

function sunCalcShim() {
  return `globalThis.SunCalc = {
    getPosition: () => ({ altitude: 0.1, azimuth: 0.2 }),
    getMoonPosition: () => ({ altitude: 0.2, azimuth: 0.3 }),
    getTimes: value => Object.fromEntries([
      "sunrise", "sunset", "solarNoon", "dawn", "dusk", "nauticalDawn", "nauticalDusk", "night", "nightEnd",
    ].map(key => [key, new Date(new Date(value).getTime() + 3600000)])),
    getMoonTimes: () => ({ rise: new Date(Date.now() + 3600000), set: new Date(Date.now() + 7200000) }),
  };`;
}

async function installParityFixtures(page) {
  await page.addInitScript({ content: sunCalcShim() });
  await page.route("**/api/**", route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/sun-moon")) return json(route, SUN_MOON_FIXTURE);
    if (path.endsWith("/geocode")) return json(route, { results: [] });
    if (path.endsWith("/revgeo")) return json(route, { name: "Warsaw", country: "Poland", timezone: "Europe/Warsaw" });
    return json(route, WEATHER_FIXTURE);
  });
  await page.route("**/sky/data/*.json", route => {
    const name = new URL(route.request().url()).pathname.split("/").pop();
    return json(route, SKY_FIXTURES[name] || {});
  });
  await page.route("**/news/rss.xml**", route => route.fulfill({ status: 200, contentType: "application/rss+xml", body: NEWS_FIXTURE }));
  await page.route("**/alerts/rss.xml**", route => route.fulfill({ status: 200, contentType: "application/rss+xml", body: NEWS_FIXTURE }));
  await page.route("**/calendar/daily_signal.json", route => json(route, EVENTS_FIXTURE));
  await page.route("**/data/helio_now.json", route => json(route, HELIO_FIXTURE));
  await page.route("**/map-poc.html", route => route.fulfill({
    status: 200,
    contentType: "text/html",
    body: "<!doctype html><html><body><p>Deterministic map parity fixture</p></body></html>",
  }));
  // Public Sun/Moon pages may request the optional CDN script. The init shim
  // is authoritative; serving the same local shim avoids an external network
  // dependency in the gate.
  await page.route("**/cdn.jsdelivr.net/npm/suncalc@1.9.0/suncalc.js", route => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: sunCalcShim(),
  }));
}

function diagnosticsFor(page) {
  const diagnostics = { console: [], page: [], stylesheet: [] };
  page.on("console", message => {
    if (message.type() === "error") diagnostics.console.push(message.text());
  });
  page.on("pageerror", error => diagnostics.page.push(error.message));
  page.on("requestfailed", request => {
    if (request.resourceType() === "stylesheet") diagnostics.stylesheet.push(`${request.url()} — ${request.failure()?.errorText || "request failed"}`);
  });
  return diagnostics;
}

async function assertNoDiagnostics(page, diagnostics, label) {
  expect(diagnostics.console, `${label}: console errors`).toEqual([]);
  expect(diagnostics.page, `${label}: page errors`).toEqual([]);
  expect(diagnostics.stylesheet, `${label}: stylesheet request failures`).toEqual([]);
  const failedStylesheets = await page.evaluate(() => [...document.styleSheets].filter(sheet => {
    try { return !sheet.cssRules; } catch (_) { return true; }
  }).map(sheet => sheet.href || "inline stylesheet"));
  expect(failedStylesheets, `${label}: unreadable stylesheets`).toEqual([]);
}

async function presentationSignature(locator, probeSelector) {
  return locator.evaluate((root, selector) => {
    const probe = !selector || root.matches(selector) ? root : root.querySelector(selector);
    if (!probe) throw new Error(`Parity probe not found: ${selector}`);
    const style = getComputedStyle(probe);
    const rect = probe.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const properties = Object.fromEntries([
      "fontFamily", "fontSize", "lineHeight", "paddingTop", "paddingRight",
      "paddingBottom", "paddingLeft", "borderRadius", "boxSizing", "overflowX", "overflowY",
      "display", "gap", "marginTop", "marginRight", "marginBottom", "marginLeft", "flexWrap", "minWidth", "position",
      "borderTopWidth", "borderTopStyle", "height",
    ].map(key => [key, style[key]]));
    return {
      properties,
      probe: { width: Math.round(rect.width), height: Math.round(rect.height) },
      root: {
        width: Math.round(rootRect.width),
        height: Math.round(rootRect.height),
        clientWidth: root.clientWidth,
        scrollWidth: root.scrollWidth,
        clientHeight: root.clientHeight,
        scrollHeight: root.scrollHeight,
        overflowX: getComputedStyle(root).overflowX,
        overflowY: getComputedStyle(root).overflowY,
      },
    };
  }, probeSelector);
}

function comparableSignature(signature, ownedProperties) {
  return Object.fromEntries(ownedProperties.map(key => [key, signature.properties[key]]));
}

function assertOverflowBaseline(signature, entry, viewport, surface = "sandbox") {
  const actual = {
    horizontal: signature.root.scrollWidth - signature.root.clientWidth,
    vertical: signature.root.scrollHeight - signature.root.clientHeight,
  };
  const baseline = entry.overflowBaseline?.[surface]?.[viewport];
  if (baseline) {
    expect(actual, `${entry.type}: ${surface} ${viewport} approved overflow baseline`).toEqual({
      horizontal: baseline.horizontal,
      vertical: baseline.vertical,
    });
    return;
  }
  if (actual.horizontal > 0) {
    expect(["auto", "scroll", "hidden", "clip"], `${entry.type}: ${surface} ${viewport} horizontal overflow must be intentional`).toContain(signature.root.overflowX);
  }
  if (actual.vertical > 0) {
    expect(["auto", "scroll", "hidden", "clip"], `${entry.type}: ${surface} ${viewport} vertical overflow must be intentional`).toContain(signature.root.overflowY);
  }
}

async function assertMobileRootFitsCard(root, entry) {
  const geometry = await root.evaluate(element => {
    const card = element.closest(".console-sandbox-card");
    const canvas = element.closest(".console-sandbox-canvas");
    const cardRect = card.getBoundingClientRect();
    const rootRect = element.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const cardStyle = getComputedStyle(card);
    const canvasStyle = getComputedStyle(canvas);
    return {
      rootWidth: rootRect.width,
      rootHeight: rootRect.height,
      rootLeft: rootRect.left,
      rootRight: rootRect.right,
      cardContentLeft: cardRect.left + card.clientLeft + parseFloat(cardStyle.paddingLeft),
      cardContentRight: cardRect.left + card.clientLeft + card.clientWidth - parseFloat(cardStyle.paddingRight),
      canvasContentRight: canvasRect.left + canvas.clientLeft + canvas.clientWidth - parseFloat(canvasStyle.paddingRight),
      cardScrollWidth: card.scrollWidth,
      cardClientWidth: card.clientWidth,
      canvasScrollWidth: canvas.scrollWidth,
      canvasClientWidth: canvas.clientWidth,
    };
  });
  expect(geometry.rootWidth, `${entry.type}: mobile root rendered`).toBeGreaterThan(0);
  expect(geometry.rootRight, `${entry.type}: mobile root fits card`).toBeLessThanOrEqual(geometry.cardContentRight + 0.5);
  expect(geometry.rootRight, `${entry.type}: mobile root fits canvas`).toBeLessThanOrEqual(geometry.canvasContentRight + 0.5);
  expect(geometry.rootLeft, `${entry.type}: mobile root starts inside card`).toBeGreaterThanOrEqual(geometry.cardContentLeft - 0.5);
  expect(geometry.cardScrollWidth, `${entry.type}: mobile card horizontal overflow`).toBeLessThanOrEqual(geometry.cardClientWidth);
  expect(geometry.canvasScrollWidth, `${entry.type}: mobile canvas horizontal overflow`).toBeLessThanOrEqual(geometry.canvasClientWidth);
  if (entry.type === "sky") expect(Math.abs(geometry.rootWidth - geometry.rootHeight), "sky: mobile root remains square").toBeLessThanOrEqual(0.5);
}

async function exposeRouteRoot(root) {
  await root.evaluate(element => {
    let current = element;
    while (current && current !== document.body) {
      const style = getComputedStyle(current);
      if (style.display === "none") current.style.display = "block";
      current = current.parentElement;
    }
  });
}

async function waitForReady(page, root, type) {
  await expect(root, `${type}: route root exists`).toHaveCount(1, { timeout: 5_000 });
  if (await root.getAttribute("data-nc-widget")) {
    await expect(root, `${type}: route root type`).toHaveAttribute("data-nc-widget", type, { timeout: 5_000 });
    await expect(root, `${type}: route root ready`).toHaveAttribute("data-nc-state", "ready", { timeout: 5_000 });
  } else {
    await expect(root, `${type}: legacy route root visible`).toBeVisible({ timeout: 5_000 });
  }
}

async function addSandboxWidget(page, entry, mode) {
  await page.locator(`[data-sandbox-widget="${entry.type}"]`).click();
  const zoneId = mode === "square" ? "square" : mode;
  await page.locator(`[data-drop-zone="${zoneId}"]`).click();
  await page.locator('[data-sandbox-action="add"]').click();
  const instance = page.locator("article[data-sandbox-instance]").last();
  const root = instance.locator('[data-role="runtime-root"]');
  await expect(root).toHaveAttribute("data-nc-widget", entry.type, { timeout: 5_000 });
  await expect(root).toHaveAttribute("data-nc-state", "ready", { timeout: 5_000 });
  const layoutMode = page.locator('[data-sandbox-layout="mode"]');
  if (await layoutMode.inputValue() !== mode) {
    await layoutMode.selectOption(mode);
    if (mode === "vertical") {
      await page.locator('[data-sandbox-layout="unit"]').selectOption("px");
      await page.locator('[data-sandbox-layout="width"]').fill("320");
      await page.locator('[data-sandbox-layout="height"]').fill("640");
    }
    await page.locator('[data-sandbox-action="apply"]').click();
    await expect(root).toHaveAttribute("data-nc-state", "ready", { timeout: 5_000 });
  }
  await expect(layoutMode).toHaveValue(mode);
  if (mode !== "square") await expect(root).toHaveAttribute("data-nc-orientation", mode);
  return { instance, root };
}

test("Sandbox visual parity gate covers every Registry entry and stylesheet manifest", async ({ page }) => {
  const diagnostics = diagnosticsFor(page);
  await installParityFixtures(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/console-sandbox/", { waitUntil: "domcontentloaded" });

  const catalogTypes = widgetCatalog.map(definition => definition.type);
  expect(PARITY_MATRIX.map(entry => entry.type)).toEqual(catalogTypes);
  for (const entry of PARITY_MATRIX) {
    const definition = widgetCatalog.find(item => item.type === entry.type);
    expect(definition, `${entry.type}: catalog definition`).toBeTruthy();
    expect(definition.stylesheets, `${entry.type}: explicit stylesheet source`).toEqual(entry.stylesheets);
    const { root } = await addSandboxWidget(page, entry, entry.routeMode);
    const links = await page.locator(`link[data-nc-sandbox-stylesheet="${entry.type}"]`).evaluateAll(nodes => nodes.map(node => new URL(node.href).pathname));
    expect([...new Set(links)], `${entry.type}: loaded stylesheet source`).toEqual(entry.stylesheets);
    const signature = await presentationSignature(root, entry.probe);
    expect(signature.probe.width, `${entry.type}: probe width`).toBeGreaterThan(0);
    expect(signature.probe.height, `${entry.type}: probe height`).toBeGreaterThan(0);
    assertOverflowBaseline(signature, entry, "desktop");
    const pageGeometry = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(pageGeometry.scrollWidth, `${entry.type}: desktop page horizontal overflow`).toBeLessThanOrEqual(pageGeometry.clientWidth);
    await page.locator('[data-sandbox-action="reset-all"]').click();
    await expect(page.locator("article[data-sandbox-instance]")).toHaveCount(0);
  }
  await assertNoDiagnostics(page, diagnostics, "Sandbox desktop catalog matrix");
});

test("Sandbox mobile parity keeps oriented modes, Sky square-only, and no page overflow", async ({ page }) => {
  const diagnostics = diagnosticsFor(page);
  await installParityFixtures(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/console-sandbox/", { waitUntil: "domcontentloaded" });
  await page.locator('[data-sandbox-control="viewport"]').selectOption("mobile");

  for (const entry of PARITY_MATRIX) {
    const { root } = await addSandboxWidget(page, entry, entry.narrowMode || (entry.type === "sky" ? "square" : "vertical"));
    const signature = await presentationSignature(root, entry.probe);
    expect(signature.probe.width, `${entry.type}: mobile probe width`).toBeGreaterThan(0);
    expect(signature.probe.height, `${entry.type}: mobile probe height`).toBeGreaterThan(0);
    const pageGeometry = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(pageGeometry.scrollWidth, `${entry.type}: mobile page horizontal overflow`).toBeLessThanOrEqual(pageGeometry.clientWidth);
    assertOverflowBaseline(signature, entry, "mobile");
    if (entry.type === "sky") {
      const size = await root.evaluate(element => ({ width: element.clientWidth, height: element.clientHeight }));
      expect(size.width).toBe(size.height);
      expect(size.width).toBeGreaterThan(0);
    }
    await assertMobileRootFitsCard(root, entry);
    await page.locator('[data-sandbox-action="reset-all"]').click();
  }
  await assertNoDiagnostics(page, diagnostics, "Sandbox mobile catalog matrix");
});

test("Sandbox probes match approved staging route presentation and source contract", async ({ browser }) => {
  test.setTimeout(90_000);
  const sandboxPage = await browser.newPage();
  const sandboxDiagnostics = diagnosticsFor(sandboxPage);
  await installParityFixtures(sandboxPage);
  await sandboxPage.setViewportSize({ width: 1440, height: 1000 });
  await sandboxPage.goto("/console-sandbox/", { waitUntil: "domcontentloaded" });

  // One approved route page per unique route keeps the gate bounded and avoids
  // repeatedly booting the full Console for entries sharing a route.
  const entriesByRoute = new Map();
  for (const entry of PARITY_MATRIX) {
    const entries = entriesByRoute.get(entry.route) || [];
    entries.push(entry);
    entriesByRoute.set(entry.route, entries);
  }
  const routePages = [];
  try {
    for (const [route, entries] of entriesByRoute) {
      const routePage = await browser.newPage();
      routePages.push({ page: routePage, diagnostics: diagnosticsFor(routePage), entries });
      await installParityFixtures(routePage);
      await routePage.setViewportSize({ width: 1440, height: 1000 });
      await routePage.goto(route, { waitUntil: "domcontentloaded" });
      for (const entry of entries) {
        const sandbox = await addSandboxWidget(sandboxPage, entry, entry.routeMode);
        const routeRoot = routePage.locator(entry.routeRoot);
        await waitForReady(routePage, routeRoot, entry.type);
        await exposeRouteRoot(routeRoot);
        const routeSignature = await presentationSignature(routeRoot, entry.probe);
        const sandboxSignature = await presentationSignature(sandbox.root, entry.probe);
        expect(sandboxSignature.probe.width, `${entry.type}: Sandbox probe rendered`).toBeGreaterThan(0);
        expect(routeSignature.probe.width, `${entry.type}: approved route probe rendered`).toBeGreaterThan(0);
        if (entry.type === "sky") {
          expect(sandboxSignature.probe.width).toBe(sandboxSignature.probe.height);
        }
        // Compare only properties explicitly owned by the catalog manifest's
        // widget probe. Generic route resets (for example base.css box-sizing)
        // are intentionally outside this parity contract.
        const sandboxPresentation = comparableSignature(sandboxSignature, entry.ownedProperties);
        const routePresentation = comparableSignature(routeSignature, entry.ownedProperties);
        expect(sandboxPresentation, `${entry.type}: Sandbox presentation parity`).toEqual(routePresentation);
        assertOverflowBaseline(sandboxSignature, entry, "desktop", "sandbox");
        assertOverflowBaseline(routeSignature, entry, "desktop", "route");
        const [sandboxPageGeometry, routePageGeometry] = await Promise.all([
          sandboxPage.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth })),
          routePage.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth })),
        ]);
        expect(sandboxPageGeometry.scrollWidth, `${entry.type}: Sandbox page horizontal overflow`).toBeLessThanOrEqual(sandboxPageGeometry.clientWidth);
        expect(routePageGeometry.scrollWidth, `${entry.type}: approved route page horizontal overflow`).toBeLessThanOrEqual(routePageGeometry.clientWidth);
        const routeStyles = await routePage.locator('link[rel="stylesheet"]').evaluateAll(nodes => nodes.map(node => new URL(node.href).pathname));
        const missingRouteStylesheets = entry.stylesheets.filter(stylesheet => !routeStyles.includes(stylesheet));
        expect(missingRouteStylesheets, `${entry.type}: approved route stylesheet gaps`).toEqual(APPROVED_ROUTE_STYLE_GAPS[entry.type] || []);
        await sandboxPage.locator('[data-sandbox-action="reset-all"]').click();
      }
    }
  } finally {
    await assertNoDiagnostics(sandboxPage, sandboxDiagnostics, "Sandbox route parity matrix");
    for (const { page: routePage, diagnostics, entries } of routePages) {
      await assertNoDiagnostics(routePage, diagnostics, `${entries.map(entry => entry.type).join(",")} approved route`);
      await routePage.close();
    }
    await sandboxPage.close();
  }
});
