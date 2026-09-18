import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createWidgetRegistry } from "../sites/staging/shared/widget-registry.mjs";
import { widgetCatalog } from "../sites/staging/shared/widget-catalog.mjs";
import {
  JAVASCRIPT_EMBED_API_VERSION,
  buildIframeEmbedSnippet,
  normalizeJavascriptEmbedInput,
  normalizeJavascriptEmbedLayout,
  serializeJavascriptEmbedSpecification,
} from "../sites/staging/shared/widget-config.mjs";
import { applyEmbedLayout, createJavascriptEmbedRuntime } from "../sites/staging/widgets/runtime/index.mjs";

const registry = createWidgetRegistry(widgetCatalog);

function createWindow() {
  const listeners = new Map();
  return {
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type, listener) { if (listeners.get(type) === listener) listeners.delete(type); },
    dispatchEvent(event) { listeners.get(event.type)?.(event); },
  };
}

function createDocument() {
  const stylesheets = [];
  const documentRef = {
    stylesheets,
    head: {
      appendChild(link) {
        stylesheets.push(link);
        link.remove = () => {
          const index = stylesheets.indexOf(link);
          if (index !== -1) stylesheets.splice(index, 1);
        };
        return link;
      },
    },
    createElement(tagName) { return { tagName: tagName.toUpperCase(), attributes: new Map(), setAttribute(name, value) { this.attributes.set(name, String(value)); } }; },
  };
  documentRef.defaultView = createWindow();
  return documentRef;
}

function createRoot(name) {
  return {
    name,
    style: {},
    attributes: new Map(),
    setAttribute(key, value) { this.attributes.set(key, String(value)); },
    removeAttribute(key) { this.attributes.delete(key); },
    getAttribute(key) { return this.attributes.get(key) ?? null; },
  };
}

function createRuntime() {
  const calls = [];
  return {
    calls,
    async mount(root, specification) {
      calls.push({ root, specification });
      root.setAttribute("data-nc-widget", specification.widget);
      root.setAttribute("data-nc-state", "ready");
      root.setAttribute("data-nc-orientation", specification.config.orientation);
      let alive = true;
      return {
        id: `${specification.widget}-${calls.length}`,
        type: specification.widget,
        config: specification.config,
        update(patch) {
          calls.push({ type: "update", root, patch });
        },
        destroy() {
          if (!alive) return;
          alive = false;
          calls.push({ type: "destroy", root });
          root.removeAttribute("data-nc-widget");
          root.removeAttribute("data-nc-state");
          root.removeAttribute("data-nc-orientation");
        },
      };
    },
  };
}

test("only catalog javascriptEmbed opt-ins normalize through the bounded public config", async () => {
  assert.equal(JAVASCRIPT_EMBED_API_VERSION, 1);
  assert.deepEqual(widgetCatalog.filter(definition => definition.divEmbed === true).map(definition => definition.type), ["weather", "sky", "events", "alerts"]);
  const mismatchedRegistry = createWidgetRegistry(widgetCatalog.map(definition => definition.type === "weather"
    ? { ...definition, divEmbed: false }
    : definition));
  assert.throws(() => normalizeJavascriptEmbedInput(mismatchedRegistry, { widget: "weather" }), /not enabled/);
  const weather = normalizeJavascriptEmbedInput(registry, {
    widget: "weather",
    config: { orientation: "vertical", profile: "visual", range: "48h" },
  });
  assert.deepEqual(weather.config, {
    density: "normal", orientation: "vertical", profile: "visual", range: "48h", theme: "inherit",
  });
  const normalized = normalizeJavascriptEmbedInput(registry, {
    widget: "alerts",
    config: { theme: "dark", baseUrl: "https://cdn.example.test/nebulacast" },
  });
  assert.deepEqual(normalized, {
    widget: "alerts",
    config: { baseUrl: "https://cdn.example.test/nebulacast", density: "normal", orientation: "auto", theme: "dark" },
  });
  assert.equal(serializeJavascriptEmbedSpecification(registry, { widget: "events", config: { orientation: "vertical" } }), '{"config":{"density":"normal","orientation":"vertical","theme":"inherit","timeRange":"upcoming"},"widget":"events"}');

  for (const specification of [
    { widget: "news" },
    { widget: "weather", config: { moduleUrl: "/evil.mjs" } },
    { widget: "weather", config: { profile: "unsupported" } },
    { widget: "alerts", config: { dataUrl: "/evil.json" } },
    { widget: "events", config: { loader: () => {} } },
    { widget: "alerts", config: { html: "<script>bad</script>" } },
    { widget: "alerts", config: { moduleUrl: "/evil.mjs" } },
    { widget: "alerts", config: { baseUrl: "javascript:alert(1)" } },
    { widget: "alerts", config: { baseUrl: "//evil.example" } },
    { widget: "alerts", config: { baseUrl: "https://evil.example/loader.mjs" } },
  ]) {
    assert.throws(() => normalizeJavascriptEmbedInput(registry, specification));
  }
});

test("public div embed normalizes and validates host layout independently of widget config", () => {
  assert.deepEqual(normalizeJavascriptEmbedLayout(registry, "sky", { mode: "square", width: 400, height: 400 }), {
    mode: "square", width: 400, height: 400,
  });
  assert.deepEqual(normalizeJavascriptEmbedLayout(registry, "weather", { mode: "vertical", width: 360, height: 640 }), {
    mode: "vertical", width: 360, height: 640,
  });
  assert.throws(() => normalizeJavascriptEmbedLayout(registry, "sky", { mode: "horizontal", width: 400, height: 400 }), /mode/);
  assert.throws(() => normalizeJavascriptEmbedLayout(registry, "weather", { mode: "vertical", width: 640, height: 360 }), /greater/);
});

test("public percent layout accepts fill values, keeps Sky square, and serializes units", () => {
  assert.deepEqual(normalizeJavascriptEmbedLayout(registry, "weather", {
    mode: "horizontal", unit: "percent", width: 100, height: 100,
  }), { mode: "horizontal", unit: "percent", width: 100, height: 100 });
  assert.deepEqual(normalizeJavascriptEmbedLayout(registry, "sky", {
    mode: "square", unit: "percent", width: 100, height: 100,
  }), { mode: "square", unit: "percent", width: 100, height: 100 });
  assert.throws(() => normalizeJavascriptEmbedLayout(registry, "weather", { mode: "vertical", unit: "percent", width: 0, height: 100 }));
  assert.throws(() => normalizeJavascriptEmbedLayout(registry, "weather", { mode: "vertical", unit: "percent", width: 56, height: 101 }));
  assert.throws(() => normalizeJavascriptEmbedLayout(registry, "sky", { mode: "square", unit: "percent", width: 50, height: 51 }), /square/);
  assert.equal(
    serializeJavascriptEmbedSpecification(registry, { widget: "weather", config: { orientation: "vertical" }, layout: { mode: "vertical", unit: "percent", width: 56, height: 100 } }),
    '{"config":{"density":"normal","orientation":"vertical","profile":"balanced","range":"7d","theme":"inherit"},"layout":{"height":100,"mode":"vertical","unit":"percent","width":56},"widget":"weather"}',
  );
  assert.equal(
    buildIframeEmbedSnippet(registry, "weather", { layout: { mode: "horizontal", unit: "percent", width: 100, height: 56 } }),
    '<iframe src="/widgets/widget.html?widget=weather&amp;orientation=horizontal&amp;theme=inherit&amp;density=normal" title="Weather" width="100%" height="56%" loading="lazy" style="border:0;display:block"></iframe>',
  );
});

test("external embed configuration rejects HTML, executable values, and arbitrary modules", () => {
  const maliciousSpecifications = [
    { widget: "weather", config: { html: "<img src=x onerror=alert(1)>" } },
    { widget: "weather", config: { onMount: "alert(1)" } },
    { widget: "weather", config: { loader: "https://evil.example/widget.mjs" } },
    { widget: "weather", config: { module: "https://evil.example/widget.mjs" } },
    { widget: "weather", config: { moduleUrl: "https://evil.example/widget.mjs" } },
    { widget: "weather", config: { baseUrl: "javascript:alert(1)" } },
    { widget: "weather", config: { baseUrl: "https://evil.example/widget.mjs" } },
  ];

  for (const specification of maliciousSpecifications) {
    assert.throws(
      () => normalizeJavascriptEmbedInput(registry, specification),
      `${JSON.stringify(specification)} must be rejected`,
    );
  }
});

test("public API mounts two roots through the shared Runtime and unmounts their styles/disposers", async () => {
  const documentRef = createDocument();
  const runtime = createRuntime();
  const api = createJavascriptEmbedRuntime({ registry, runtime, documentRef });
  const alertsRoot = createRoot("alerts");
  const secondAlertsRoot = createRoot("alerts-second");
  const eventsRoot = createRoot("events");

  const alerts = await api.mount(alertsRoot, { widget: "alerts", config: { orientation: "vertical" } });
  const secondAlerts = await api.mount(secondAlertsRoot, { widget: "alerts", config: { orientation: "horizontal" } });
  const events = await api.mount(eventsRoot, { widget: "events", config: { theme: "dark" } });
  assert.equal(alertsRoot.getAttribute("data-nc-widget"), "alerts");
  assert.equal(secondAlertsRoot.getAttribute("data-nc-widget"), "alerts");
  assert.equal(eventsRoot.getAttribute("data-nc-widget"), "events");
  assert.equal(documentRef.stylesheets.length, 2);
  assert.deepEqual(documentRef.stylesheets.map(link => link.href), ["/alerts/widget.css", "/assets/css/widget_calendar.css"]);
  await assert.rejects(() => api.mount(alertsRoot, { widget: "alerts" }), /already mounted/);

  await api.unmount(alertsRoot);
  assert.equal(alertsRoot.getAttribute("data-nc-widget"), null);
  assert.equal(documentRef.stylesheets.length, 2);
  assert.equal(documentRef.stylesheets.filter(link => link.href === "/alerts/widget.css").length, 1);
  await alerts.destroy();
  assert.equal(runtime.calls.filter(call => call.type === "destroy").length, 1);

  await api.unmount(secondAlertsRoot);
  assert.equal(secondAlertsRoot.getAttribute("data-nc-widget"), null);
  assert.equal(documentRef.stylesheets.length, 1);
  await secondAlerts.destroy();

  documentRef.defaultView.dispatchEvent({ type: "pagehide" });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(eventsRoot.getAttribute("data-nc-widget"), null);
  assert.equal(documentRef.stylesheets.length, 0);
});

test("public API mounts the square Sky contract with caller-owned layout metadata", async () => {
  const documentRef = createDocument();
  const runtime = createRuntime();
  const api = createJavascriptEmbedRuntime({ registry, runtime, documentRef });
  const root = createRoot("sky");
  const sky = await api.mount(root, {
    widget: "sky",
    layout: { mode: "square", width: 400, height: 400 },
  });
  assert.equal(root.getAttribute("data-nc-embed-mode"), "square");
  assert.equal(root.getAttribute("data-nc-embed-width"), "400");
  assert.equal(root.getAttribute("data-nc-embed-height"), "400");
  assert.equal(runtime.calls[0].specification.config.orientation, "auto");
  assert.equal(documentRef.stylesheets[0].href, "/sky/assets/sky.css");
  await sky.destroy();
  assert.equal(documentRef.stylesheets.length, 0);
});

test("public runtime applies percent units to the caller-owned root", async () => {
  const root = createRoot("weather");
  applyEmbedLayout(root, { mode: "horizontal", unit: "percent", width: 100, height: 56 });
  assert.equal(root.style.width, "100%");
  assert.equal(root.style.height, "56%");
  assert.equal(root.getAttribute("data-nc-embed-unit"), "percent");
});

test("v1 public API mounts, updates, and destroys Weather while rejecting unsupported updates", async () => {
  const documentRef = createDocument();
  const runtime = createRuntime();
  const api = createJavascriptEmbedRuntime({ registry, runtime, documentRef });
  assert.equal(api.apiVersion, 1);
  const root = createRoot("weather");

  const weather = await api.mount(root, {
    widget: "weather",
    config: { orientation: "vertical", profile: "balanced", range: "7d" },
  });
  assert.equal(weather.type, "weather");
  assert.deepEqual(runtime.calls[0].specification.config, {
    density: "normal", orientation: "vertical", profile: "balanced", range: "7d", theme: "inherit",
  });

  await weather.update({ profile: "visual" });
  assert.deepEqual(runtime.calls.find(call => call.type === "update").patch, { profile: "visual" });
  assert.throws(() => weather.update({ moduleUrl: "/evil.mjs" }), /unsupported field/);
  assert.throws(() => weather.update({ range: "not-supported" }), /Invalid range/);

  await weather.destroy();
  assert.equal(root.getAttribute("data-nc-widget"), null);
  assert.equal(documentRef.stylesheets.length, 0);
});

test("baseUrl changes only catalog data/assets and never controls module resolution", async () => {
  const documentRef = createDocument();
  const runtime = createRuntime();
  const api = createJavascriptEmbedRuntime({ registry, runtime, documentRef });
  await api.mount(createRoot("events"), { widget: "events", baseUrl: "https://cdn.example.test/embed/" });
  const config = runtime.calls[0].specification.config;
  assert.equal(config.jsonUrl, "https://cdn.example.test/embed/calendar/daily_signal.json");
  assert.equal(config.rssUrl, "https://cdn.example.test/embed/alerts/rss.xml");
  assert.equal(config.iconBase, "https://cdn.example.test/embed/assets/icons/alerts");
  assert.equal(config.moduleUrl, undefined);
  assert.equal(runtime.calls.length, 1);
});

test("public embed source is registry/runtime based and has no arbitrary module or iframe bridge", async () => {
  const source = await readFile(new URL("../sites/staging/widgets/runtime/index.mjs", import.meta.url), "utf8");
  const demo = await readFile(new URL("../sites/staging/embed/javascript-canary.html", import.meta.url), "utf8");
  assert.match(source, /createCatalogRegistry/);
  assert.match(source, /createNebulacast/);
  assert.doesNotMatch(source, /import\(.*specification|postMessage|iframe|moduleUrl/);
  assert.doesNotMatch(demo, /iframe|postMessage|Console/);
});
