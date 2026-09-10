import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { widgetCatalog } from "../sites/staging/shared/widget-catalog.mjs";
import { createShowcaseGallery, LEGACY_STANDALONE_LINKS, sanitizeGalleryConfig } from "../sites/staging/showcase/showcase.mjs";
import { createGalleryContext, createGalleryRoot, createGalleryRuntime } from "./fixtures/showcase-gallery-fixture.mjs";

test("catalog exposes immutable Showcase metadata without changing widget contracts", () => {
  assert.equal(widgetCatalog.length, 10);
  for (const definition of widgetCatalog) {
    assert.equal(typeof definition.title, "string");
    assert.equal(typeof definition.description, "string");
    assert.equal(typeof definition.galleryPreview, "boolean");
    assert.equal(Object.isFrozen(definition), true);
    assert.equal(Object.isFrozen(definition.supportedOptions), true);
    assert.equal(typeof definition.loader, "function");
  }
  const weather = widgetCatalog.find(definition => definition.type === "weather");
  assert.deepEqual(weather.supportedOptions.profile, ["balanced", "visual", "broadband", "planetary"]);
  assert.equal(Object.isFrozen(weather.supportedOptions.profile), true);
});

test("Showcase renders every catalog definition and does not lazy-load previews on mount", async () => {
  const { documentRef, root } = createGalleryRoot();
  const runtime = createGalleryRuntime();
  const gallery = createShowcaseGallery({ root, documentRef, context: createGalleryContext(), runtime });
  const snapshot = await gallery.mount();
  assert.equal(root.querySelectorAll("[data-widget-type]").length, widgetCatalog.length);
  assert.equal(runtime.calls.length, 0);
  assert.equal(snapshot.instances.size, 0);
  assert.equal(root.querySelector('[data-widget-type="hero"]').getAttribute("data-gallery-preview"), "true");
  assert.equal(root.querySelector('[data-widget-type="map"]').getAttribute("data-gallery-preview"), "false");
});

test("Showcase preserves the legacy standalone entry points in an allow-listed supplemental section", async () => {
  const { documentRef, root } = createGalleryRoot();
  const gallery = createShowcaseGallery({ root, documentRef, context: createGalleryContext(), runtime: createGalleryRuntime() });
  await gallery.mount();
  assert.equal(Object.isFrozen(LEGACY_STANDALONE_LINKS), true);
  assert.deepEqual(LEGACY_STANDALONE_LINKS.map(entry => [entry.label, entry.href]), [
    ["Conditions", "/weather/weather-vertical.html"],
    ["Space Weather", "/helio/"],
    ["Best Objects", "/sky/objects.html"],
  ]);
  for (const entry of LEGACY_STANDALONE_LINKS) {
    const link = root.querySelector(`[data-gallery-legacy-link="${entry.id}"]`);
    assert.ok(link);
    assert.equal(link.getAttribute("href"), entry.href);
    assert.equal(link.textContent, `↗ ${entry.label}`);
  }
});

test("preview uses registry metadata, sanitizes config, is idempotent, and closes cleanly", async () => {
  const { documentRef, root } = createGalleryRoot();
  const runtime = createGalleryRuntime();
  const gallery = createShowcaseGallery({ root, documentRef, context: createGalleryContext(), runtime });
  await gallery.mount();
  const heroCard = root.querySelector('[data-widget-type="hero"]');
  const orientation = heroCard.querySelector('[data-gallery-option="orientation"]');
  orientation.value = "not-allowed";
  const first = await gallery.openPreview("hero");
  const second = await gallery.openPreview("hero");
  assert.strictEqual(first, second);
  assert.equal(runtime.calls.filter(call => call.type === "mount").length, 1);
  assert.deepEqual(runtime.calls[0].specification.config, { orientation: "auto", theme: "inherit", density: "normal" });
  await gallery.closePreview("hero");
  assert.equal(runtime.calls.filter(call => call.type === "destroy").length, 1);
  assert.equal(gallery.getInstances().size, 0);
  assert.deepEqual(sanitizeGalleryConfig(widgetCatalog.find(definition => definition.type === "weather"), { profile: "visual", url: "/evil", loader: () => {} }), {
    orientation: "auto", theme: "inherit", density: "normal", profile: "visual", range: "7d",
  });
});

test("one preview failure stays local and gallery destroy releases remaining instances", async () => {
  const { documentRef, root } = createGalleryRoot();
  const runtime = createGalleryRuntime({ failures: new Set(["alerts"]) });
  const gallery = createShowcaseGallery({ root, documentRef, context: createGalleryContext(), runtime });
  await gallery.mount();
  const [hero, alerts] = await Promise.all([gallery.openPreview("hero"), gallery.openPreview("alerts")]);
  assert.ok(hero);
  assert.equal(alerts, null);
  assert.equal(gallery.getErrors().has("alerts"), true);
  assert.equal(gallery.getInstances().size, 1);
  await gallery.destroy();
  assert.equal(gallery.getInstances().size, 0);
  assert.equal(runtime.calls.filter(call => call.type === "destroy").length, 1);
});

test("Showcase shell is declarative and loads the gallery module and stylesheet", async () => {
  const source = await readFile(new URL("../sites/staging/showcase/index.html", import.meta.url), "utf8");
  assert.match(source, /showcase\.mjs/);
  assert.match(source, /showcase\.css/);
  assert.doesNotMatch(source, /class="card"/);
  assert.doesNotMatch(source, /fresh-(?:weather|map|sky|helio|objects|alerts|news|calendar)/);
});
