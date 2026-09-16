import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { widgetCatalog } from "../sites/staging/shared/widget-catalog.mjs";
import { createShowcaseGallery } from "../sites/staging/showcase-javascript/showcase.mjs";
import { createGalleryContext, createGalleryRoot, createGalleryRuntime } from "./fixtures/showcase-gallery-fixture.mjs";

test("the copied Showcase page keeps its card shell and does not alter the original page", async () => {
  const source = await readFile(new URL("../sites/staging/showcase-javascript/index.html", import.meta.url), "utf8");
  const original = await readFile(new URL("../sites/staging/showcase/index.html", import.meta.url), "utf8");
  assert.match(source, /widget-gallery/);
  assert.match(source, /showcase-javascript\/showcase\.mjs/);
  assert.doesNotMatch(source, /widget-lab-stage/);
  assert.match(original, /widget-lab-stage/);
});

test("the copied Showcase renders the complete catalog and exposes JavaScript only for four public widgets", async () => {
  const { documentRef, root } = createGalleryRoot();
  const gallery = createShowcaseGallery({ root, documentRef, context: createGalleryContext(), runtime: createGalleryRuntime() });
  await gallery.mount();
  assert.equal(root.querySelectorAll("[data-widget-type]").length, 13);
  const publicTypes = widgetCatalog.filter(definition => definition.javascriptEmbed === true).map(definition => definition.type);
  assert.deepEqual(publicTypes, ["weather", "sky", "events", "alerts"]);
  for (const type of publicTypes) {
    const card = root.querySelector(`[data-widget-type="${type}"]`);
    assert.ok(card.querySelector('[data-role="javascript-embed-snippet"]'));
    assert.match(card.querySelector('[data-role="javascript-embed-snippet"]').textContent, /\/widgets\/runtime\/index\.mjs/);
    assert.match(card.querySelector('.gallery-javascript-explanation').textContent, /responsive sizing/);
  }
  const hero = root.querySelector('[data-widget-type="hero"]');
  assert.equal(hero.querySelectorAll(".gallery-output-unavailable")[1].textContent, "JavaScript embed unavailable");
});

test("the copied Showcase preserves iframe output and Sky square dimensions", async () => {
  const { documentRef, root } = createGalleryRoot();
  const gallery = createShowcaseGallery({ root, documentRef, context: createGalleryContext(), runtime: createGalleryRuntime() });
  await gallery.mount();
  const alerts = root.querySelector('[data-widget-type="alerts"]');
  assert.match(alerts.querySelector('[data-role="iframe-snippet"]').textContent, /<iframe/);
  const sky = root.querySelector('[data-widget-type="sky"]');
  assert.equal(sky.querySelector('[data-gallery-layout-mode]').value, "square");
  assert.match(sky.querySelector('[data-role="javascript-embed-snippet"]').textContent, /"widget":"sky"/);
});

test("the copied Showcase requires both public JavaScript capability flags", async () => {
  const catalog = widgetCatalog.map(definition => definition.type === "weather"
    ? { ...definition, divEmbed: false }
    : definition);
  const { documentRef, root } = createGalleryRoot();
  const gallery = createShowcaseGallery({ root, catalog, documentRef, context: createGalleryContext(), runtime: createGalleryRuntime() });
  await gallery.mount();
  assert.equal(root.querySelector('[data-widget-type="weather"]')?.querySelector('[data-role="javascript-embed-output"]'), null);
});
