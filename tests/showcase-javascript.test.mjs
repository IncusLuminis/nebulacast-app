import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { widgetCatalog } from "../sites/staging/shared/widget-catalog.mjs";
import { createShowcaseGallery, PUBLIC_EMBED, buildShowcaseEmbedUrl } from "../sites/staging/showcase-javascript/showcase.mjs";
import { createGalleryContext, createGalleryRoot } from "./fixtures/showcase-gallery-fixture.mjs";

test("Showcase copy is a minimal catalog and leaves the original page untouched", async () => {
  const source = await readFile(new URL("../sites/staging/showcase-javascript/index.html", import.meta.url), "utf8");
  const original = await readFile(new URL("../sites/staging/showcase/index.html", import.meta.url), "utf8");
  assert.match(source, /showcase-javascript\/showcase\.mjs/);
  assert.doesNotMatch(source, /Console|Standalone|Widget config|widget-lab-stage/);
  assert.match(original, /widget-lab-stage/);
});

test("catalog cards expose only form factor and Embed navigation", async () => {
  const { documentRef, root } = createGalleryRoot();
  await createShowcaseGallery({ root, documentRef, context: createGalleryContext() }).mount();
  assert.equal(root.querySelectorAll("[data-widget-type]").length, 13);
  const alerts = root.querySelector('[data-widget-type="alerts"]');
  assert.ok(alerts.querySelector('[data-gallery-mode]'));
  assert.equal(alerts.querySelectorAll("input").length, 0);
  assert.equal(alerts.querySelectorAll("select").length, 1);
  assert.equal(alerts.querySelector('[data-gallery-action="embed"]').textContent, "Embed");
  assert.equal(alerts.querySelector('[data-role="config-output"]'), null);
  assert.equal(alerts.querySelector('[data-gallery-action="preview"]'), null);
  assert.equal(alerts.querySelector('[data-gallery-action="open-host"]'), null);
  assert.equal(buildShowcaseEmbedUrl("alerts", "vertical"), "/showcase-javascript/embed.html?widget=alerts&mode=vertical");
  assert.equal(PUBLIC_EMBED(widgetCatalog.find(item => item.type === "alerts")), true);
  const sky = root.querySelector('[data-widget-type="sky"]');
  assert.deepEqual(sky.querySelector('[data-gallery-mode]').querySelectorAll("option").map(option => option.value), ["square"]);
});

test("Embed is unavailable for catalog entries without a public host contract", async () => {
  const { documentRef, root } = createGalleryRoot();
  await createShowcaseGallery({ root, documentRef, context: createGalleryContext() }).mount();
  const hero = root.querySelector('[data-widget-type="hero"]');
  assert.equal(hero.querySelector('[data-gallery-action="embed"]').disabled, true);
  assert.equal(hero.querySelector('[data-role="embed-unavailable"]').textContent, "Embed unavailable for this widget.");
});
