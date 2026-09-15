import test from "node:test";
import assert from "node:assert/strict";
import { createCatalogRegistry } from "../sites/staging/shared/widget-catalog.mjs";
import { createWidgetLabOutputs } from "../sites/staging/showcase/widget-lab-output.mjs";

const registry = createCatalogRegistry();

function instance(widget, layout, config = {}) {
  return { widget, layout, config };
}

test("outputs carry the selected dimensions and public mode", () => {
  const weather = createWidgetLabOutputs(registry, instance("weather", {
    mode: "vertical", width: 360, height: 640,
  }, { orientation: "vertical", profile: "visual" }));
  assert.match(weather.javascript, /\/widgets\/runtime\/index\.mjs/);
  assert.match(weather.javascript, /"layout":\{"height":640,"mode":"vertical","width":360\}/);
  assert.match(weather.iframe, /orientation=vertical/);
  assert.match(weather.iframe, /width="360" height="640"/);

  const sky = createWidgetLabOutputs(registry, instance("sky", {
    mode: "square", width: 400, height: 400,
  }));
  assert.match(sky.javascript, /"widget":"sky"/);
  assert.match(sky.javascript, /"mode":"square"/);
  assert.match(sky.iframe, /widget=sky/);
  assert.match(sky.iframe, /width="400" height="400"/);
});

test("unsupported capabilities are explicit and never receive fake snippets", () => {
  const output = createWidgetLabOutputs(registry, instance("space-weather", {
    mode: "horizontal", width: 640, height: 360,
  }));
  assert.deepEqual(output, { javascript: null, iframe: null });
});
