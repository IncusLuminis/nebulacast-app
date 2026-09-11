import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { consoleConfig } from "../sites/staging/console/console-config.mjs";
import { createConsoleComposer } from "../sites/staging/console/console-composer.mjs";
import { createComposerRuntime, ComposerDocument, ComposerRoot, slot } from "./fixtures/console-composer-fixture.mjs";

const expectedSlots = [
  ["hero", "#console-hero", "hero"],
  ["location", "#w-location", "location"],
  ["weather", "#w-weather", "weather"],
  ["weather-matrix", "#w-weather-matrix", "weather"],
  ["sun", "#w-sun", "sun-moon"],
  ["sunmoon-panel", "#w-sunmoon-panel", "sun-moon"],
  ["sky", "#skyMount", "sky"],
  ["alerts", "#fs-sky", "alerts"],
  ["events", "#nrc-main", "events"],
  ["sidebar-events", "#fs-cal", "events"],
  ["news", "#nrw-main", "news"],
  ["sidebar-news", "#fs-news", "news"],
];

test("Console config declares the platform-managed roots and preserves configs", () => {
  assert.deepEqual(consoleConfig.slots.map(({ id, selector, widget }) => [id, selector, widget]), expectedSlots);
  assert.deepEqual(consoleConfig.slots.find(slotRef => slotRef.id === "alerts").config, { orientation: "vertical", maxItems: 20 });
  assert.equal(consoleConfig.slots.find(slotRef => slotRef.id === "events").config.maxItems, 25);
  assert.equal(consoleConfig.slots.find(slotRef => slotRef.id === "news").config.parseMax, 300);
  assert.equal(consoleConfig.slots.find(slotRef => slotRef.id === "sidebar-events").config.maxItems, 8);
  assert.equal(consoleConfig.slots.find(slotRef => slotRef.id === "sidebar-news").config.parseMax, 300);
});

test("Composer mounts through the supplied Runtime, is idempotent, and isolates roots", async () => {
  const roots = Object.fromEntries(expectedSlots.map(([id, selector]) => [selector, new ComposerRoot(id)]));
  const documentRef = new ComposerDocument(roots);
  const runtime = createComposerRuntime();
  const composer = createConsoleComposer({ runtime, documentRef, config: { slots: [slot("hero", "#console-hero", "hero", { source: "console" }), slot("alerts", "#fs-sky", "alerts")] } });
  const first = await composer.mount();
  await composer.mount();
  assert.equal(runtime.calls.filter(call => call.type === "mount").length, 2);
  assert.equal(first.instances.size, 2);
  assert.equal(roots["#console-hero"].getAttribute("data-nc-widget"), "hero");
  assert.equal(roots["#fs-sky"].getAttribute("data-nc-widget"), "alerts");
  assert.equal(composer.getErrors().size, 0);
  await composer.destroy();
  assert.equal(runtime.calls.filter(call => call.type === "destroy").length, 2);
  assert.equal(composer.getInstances().size, 0);
});

test("Composer destroys removed/replaced slots and keeps one widget failure local", async () => {
  const oldHero = new ComposerRoot("hero-old");
  const newHero = new ComposerRoot("hero-new");
  const alertsRoot = new ComposerRoot("alerts");
  const documentRef = new ComposerDocument({ "#hero": oldHero, "#hero-new": newHero, "#alerts": alertsRoot });
  const runtime = createComposerRuntime({ failures: new Set(["alerts"]) });
  const composer = createConsoleComposer({ runtime, documentRef, config: { slots: [slot("hero", "#hero", "hero"), slot("alerts", "#alerts", "alerts")] } });
  await composer.mount();
  assert.equal(composer.getInstances().size, 1);
  assert.equal(composer.getErrors().has("alerts"), true);
  await composer.mount({ slots: [slot("hero", "#hero-new", "hero")] });
  assert.equal(oldHero.destroyed, true);
  assert.equal(newHero.getAttribute("data-nc-widget"), "hero");
  assert.equal(composer.getErrors().size, 0);
  await composer.destroy();
});

test("Composer wiring keeps shared Runtime/catalog and Console Hero boundary intact", async () => {
  const composerSource = await readFile(new URL("../sites/staging/console/console-composer.mjs", import.meta.url), "utf8");
  const indexSource = await readFile(new URL("../sites/staging/index.html", import.meta.url), "utf8");
  assert.match(composerSource, /createNebulacast/);
  assert.match(composerSource, /createCatalogRegistry/);
  assert.doesNotMatch(indexSource, /mountWidget\("(?:location|weather|weather-matrix|sun|sunmoon-panel|sky)"/);
  assert.doesNotMatch(indexSource, /window\.run(?:News|Calendar)Widget/);
  assert.doesNotMatch(indexSource, /load(?:SwxAlerts|CalendarEvents|NewsItems)\s*\(/);
  assert.doesNotMatch(indexSource, /initSkyIfNeeded|legacy-bootstrap\.mjs|window\.__(?:skyWidget|SKY_CONFIG)/);
  assert.match(indexSource, /function getConsoleSkyFilters\(\)/);
  assert.match(indexSource, /slot\.id === 'sky'[\s\S]*getConsoleSkyFilters\(\)/);
  assert.match(indexSource, /let _stormTab = 'G';/);
  assert.match(indexSource, /href="\/favicon\.svg"/);
  assert.match(indexSource, /getInstance\('sky'\)\?\.update/);
  assert.match(indexSource, /getInstance\('sky'\)\?\.resize/);
  assert.match(indexSource, /nc:hero-data/);
  assert.match(indexSource, /nc:hero-action/);
});
