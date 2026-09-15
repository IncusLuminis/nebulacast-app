import test from "node:test";
import assert from "node:assert/strict";
import { createCatalogRegistry, widgetCatalog } from "../sites/staging/shared/widget-catalog.mjs";
import {
  getWidgetLabInspectorMetadata,
  normalizeWidgetLabInspector,
} from "../sites/staging/showcase/widget-lab-inspector.mjs";

test("every Registry definition exposes exactly one public shape contract", () => {
  const registry = createCatalogRegistry();
  assert.equal(widgetCatalog.length, 13);
  for (const definition of widgetCatalog) {
    const metadata = getWidgetLabInspectorMetadata(registry, definition.type);
    assert.deepEqual(metadata.modes, definition.type === "sky" ? ["square"] : ["horizontal", "vertical"]);
    assert.equal(metadata.options.orientation, undefined);
  }
});

test("inspector keeps host layout separate and derives Runtime orientation", () => {
  const registry = createCatalogRegistry();
  const vertical = normalizeWidgetLabInspector(registry, "weather", {
    mode: "vertical",
    width: 360,
    height: 640,
    options: { profile: "visual" },
  });
  assert.equal(vertical.layout.valid, true);
  assert.equal(vertical.layout.mode, "vertical");
  assert.equal(vertical.config.config.orientation, "vertical");
  assert.equal(vertical.config.config.profile, "visual");

  const sky = normalizeWidgetLabInspector(registry, "sky", {
    mode: "square",
    width: 400,
    height: 400,
  });
  assert.equal(sky.layout.valid, true);
  assert.equal(sky.config.config.orientation, "auto");
  assert.match(normalizeWidgetLabInspector(registry, "sky", {
    mode: "square", width: 400, height: 401,
  }).layout.error, /square/);
});

test("auto is not a public inspector mode", () => {
  const registry = createCatalogRegistry();
  const result = normalizeWidgetLabInspector(registry, "weather", {
    mode: "auto", width: 640, height: 360,
  });
  assert.equal(result.layout.valid, false);
  assert.match(result.layout.error, /Mode/);
});
