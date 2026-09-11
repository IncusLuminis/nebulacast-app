import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { widgetCatalog } from "../sites/staging/shared/widget-catalog.mjs";

const definition = widgetCatalog.find(item => item.type === "space-weather");

test("Space Weather is registered as an oriented multi-instance Runtime widget", async () => {
  assert.ok(definition);
  assert.equal(definition.version, 1);
  assert.equal(definition.shape, "oriented");
  assert.deepEqual(definition.userModes, ["horizontal", "vertical"]);
  assert.deepEqual(definition.supportedOptions.orientation, ["horizontal", "vertical"]);
  assert.deepEqual(definition.defaults, {
    orientation: "horizontal",
    theme: "inherit",
    density: "normal",
  });
  assert.deepEqual(definition.capabilities, {
    observerAware: false,
    timeAware: false,
    multiInstance: true,
    embed: false,
  });
  assert.equal(typeof (await definition.loader()).mount, "function");
});

test("Space Weather adapter delegates to the ESM bundle and preserves the data contract", async () => {
  const adapterSource = await readFile(new URL("../sites/staging/helio/platform-adapter.mjs", import.meta.url), "utf8");
  const source = await readFile(new URL("../sites/staging/helio/src/helio.widget.ts", import.meta.url), "utf8");
  const esmBundle = await readFile(new URL("../sites/staging/helio/dist/helio.widget.mjs", import.meta.url), "utf8");
  const legacyBundle = await readFile(new URL("../sites/staging/helio/dist/helio.widget.js", import.meta.url), "utf8");

  assert.match(adapterSource, /from "\.\/dist\/helio\.widget\.mjs"/);
  assert.match(adapterSource, /\/data\/helio_now\.json/);
  assert.doesNotMatch(adapterSource, /window\.HelioWidget\s*=/);
  assert.match(source, /AbortController/);
  assert.match(source, /removeEventListener\("click", this\.clickHandler\)/);
  assert.match(source, /HELIO_LEGACY_GLOBAL/);
  assert.doesNotMatch(esmBundle, /window\.HelioWidget\s*=/);
  assert.match(legacyBundle, /window\.HelioWidget\s*=/);
});
