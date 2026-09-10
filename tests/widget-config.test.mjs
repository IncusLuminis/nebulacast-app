import test from "node:test";
import assert from "node:assert/strict";
import { createWidgetRegistry } from "../sites/staging/shared/widget-registry.mjs";
import { widgetCatalog } from "../sites/staging/shared/widget-catalog.mjs";
import {
  WIDGET_CONFIG_SCHEMA,
  buildStandaloneWidgetUrl,
  createWidgetConfig,
  exportWidgetConfig,
  normalizeWidgetConfig,
  serializeWidgetConfig,
} from "../sites/staging/shared/widget-config.mjs";

const registry = createWidgetRegistry(widgetCatalog);

test("widget-config.v1 exports only registered allow-listed options and is read-only", () => {
  const exported = createWidgetConfig(registry, "weather", {
    orientation: "vertical",
    theme: "dark",
    profile: "visual",
    range: "48h",
    dataUrl: "/not-allowed",
    loader: () => {},
    html: "<script>bad</script>",
  });
  assert.deepEqual(exported, {
    schema: WIDGET_CONFIG_SCHEMA,
    widget: "weather",
    version: 1,
    config: { density: "normal", orientation: "vertical", profile: "visual", range: "48h", theme: "dark" },
  });
  assert.equal(Object.isFrozen(exported), true);
  assert.equal(Object.isFrozen(exported.config), true);
  assert.equal(Object.keys(exported.config).includes("loader"), false);
});

test("serialization is byte-stable and normalized values match the Runtime allow-list", () => {
  const first = exportWidgetConfig(registry, "hero", { theme: "dark", orientation: "horizontal" });
  const second = exportWidgetConfig(registry, "hero", { orientation: "horizontal", theme: "dark" });
  assert.equal(first, second);
  assert.equal(first, '{"schema":"widget-config.v1","widget":"hero","version":1,"config":{"density":"normal","orientation":"horizontal","theme":"dark"}}');
  assert.deepEqual(normalizeWidgetConfig(registry, "weather", { profile: "unknown", range: "not-real", url: "https://evil.example" }), {
    density: "normal", orientation: "auto", profile: "balanced", range: "7d", theme: "inherit",
  });
});

test("serializer rejects unsafe or extra export fields", () => {
  assert.throws(() => serializeWidgetConfig({ schema: WIDGET_CONFIG_SCHEMA, widget: "hero", version: 1, config: { injected: "<div>" } }), /unsafe/);
  assert.throws(() => serializeWidgetConfig({ schema: WIDGET_CONFIG_SCHEMA, widget: "hero", version: 1, config: { loader: "not-a-function" } }), /forbidden/);
  assert.throws(() => serializeWidgetConfig({ schema: WIDGET_CONFIG_SCHEMA, widget: "hero", version: 1, config: {}, loader: "bad" }), /unsupported field/);
  assert.throws(() => createWidgetConfig(registry, "not-registered", {}), /Unknown widget type/);
});

test("standalone host URL is deterministic, encoded, and limited to host config", () => {
  const alertsUrl = buildStandaloneWidgetUrl(registry, "alerts", {
    orientation: "vertical",
    theme: "dark",
    density: "compact",
  });
  assert.equal(alertsUrl, "/widgets/widget.html?widget=alerts&orientation=vertical&theme=dark&density=compact");
  assert.equal(buildStandaloneWidgetUrl(registry, { widget: "events", orientation: "vertical" }), "/widgets/widget.html?widget=events&orientation=vertical&theme=inherit&density=normal");
  assert.equal(buildStandaloneWidgetUrl(registry, createWidgetConfig(registry, "events")), "/widgets/widget.html?widget=events&orientation=auto&theme=inherit&density=normal");

  const encodedRegistry = createWidgetRegistry([{
    type: "events",
    version: 1,
    standaloneHost: true,
    supportedOptions: {
      orientation: ["auto", "wide layout", "vertical"],
      theme: ["inherit", "dark"],
      density: ["normal", "compact"],
    },
    defaults: { orientation: "auto", theme: "inherit", density: "normal" },
    capabilities: {},
    loader: () => ({ mount() {} }),
  }]);
  assert.equal(buildStandaloneWidgetUrl(encodedRegistry, "events", { orientation: "wide layout" }), "/widgets/widget.html?widget=events&orientation=wide+layout&theme=inherit&density=normal");

  assert.throws(() => buildStandaloneWidgetUrl(registry, "news"), /not allowed/);
  assert.throws(() => buildStandaloneWidgetUrl(registry, "alerts", { dataUrl: "/evil" }), /unsupported field/);
  assert.throws(() => buildStandaloneWidgetUrl(registry, { widget: "alerts", html: "<iframe>" }), /unsupported field/);
  assert.throws(() => buildStandaloneWidgetUrl(registry, "alerts", { theme: "<script>" }), /Invalid theme/);
  assert.throws(() => buildStandaloneWidgetUrl(registry, {
    schema: WIDGET_CONFIG_SCHEMA,
    widget: "alerts",
    version: 1,
    config: { orientation: "auto", theme: "inherit", density: "normal", html: "<iframe>" },
  }), /unsupported field/);
});
