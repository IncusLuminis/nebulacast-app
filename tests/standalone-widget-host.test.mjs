import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createWidgetRegistry } from "../sites/staging/shared/widget-registry.mjs";
import { widgetCatalog } from "../sites/staging/shared/widget-catalog.mjs";
import { parseStandaloneWidgetQuery, serializeWidgetConfig } from "../sites/staging/shared/widget-config.mjs";
import { createStandaloneWidgetHost } from "../sites/staging/widgets/widget-host.mjs";
import { FakeDocument, makeContext, makeRoot } from "./fixtures/alerts-platform-fixture.mjs";

const registry = createWidgetRegistry(widgetCatalog);

function createWindow(search = "") {
  const listeners = new Map();
  return {
    location: { search },
    navigator: {},
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type, listener) { if (listeners.get(type) === listener) listeners.delete(type); },
    dispatchEvent(event) { listeners.get(event.type)?.(event); },
  };
}

function createHostFixture(search = "") {
  const documentRef = new FakeDocument();
  const root = makeRoot(documentRef, "widget-root");
  const status = makeRoot(documentRef, "host-status");
  const destroyButton = makeRoot(documentRef, "destroy-widget");
  destroyButton.disabled = true;
  documentRef.getElementById = id => ({ "widget-root": root, "host-status": status, "destroy-widget": destroyButton })[id] || null;
  const windowRef = createWindow(search);
  documentRef.defaultView = windowRef;
  const calls = [];
  const runtime = {
    calls,
    async mount(mountRoot, specification) {
      calls.push({ type: "mount", mountRoot, specification });
      mountRoot.setAttribute("data-nc-widget", specification.widget);
      mountRoot.setAttribute("data-nc-state", "ready");
      mountRoot.setAttribute("data-nc-orientation", specification.config.orientation);
      mountRoot.setAttribute("data-nc-theme", specification.config.theme);
      mountRoot.setAttribute("data-nc-density", specification.config.density);
      let alive = true;
      return {
        destroy() {
          if (!alive) return;
          alive = false;
          calls.push({ type: "destroy", mountRoot });
          mountRoot.removeAttribute("data-nc-widget");
          mountRoot.removeAttribute("data-nc-state");
        },
      };
    },
  };
  return { documentRef, root, status, destroyButton, windowRef, runtime };
}

test("standalone query parser only accepts Alerts and bounded common options", () => {
  assert.equal(widgetCatalog.filter(definition => definition.standaloneHost === true).length, 1);
  assert.equal(widgetCatalog.find(definition => definition.type === "alerts").standaloneHost, true);
  const config = parseStandaloneWidgetQuery(registry, "?widget=alerts&orientation=vertical&theme=dark&density=compact");
  assert.deepEqual(config.config, { density: "compact", orientation: "vertical", theme: "dark" });
  assert.equal(serializeWidgetConfig(config), '{"schema":"widget-config.v1","widget":"alerts","version":1,"config":{"density":"compact","orientation":"vertical","theme":"dark"}}');
  assert.deepEqual(parseStandaloneWidgetQuery(registry, "?widget=alerts").config, { density: "normal", orientation: "auto", theme: "inherit" });
  for (const query of ["", "?widget=hero", "?widget=alerts&profile=visual", "?widget=alerts&theme=<script>", "?widget=alerts&url=https://evil.example"]) {
    assert.throws(() => parseStandaloneWidgetQuery(registry, query));
  }
});

test("host mounts once, exposes Runtime metadata, and destroys on explicit/pagehide lifecycle", async () => {
  const fixture = createHostFixture("?widget=alerts&orientation=horizontal");
  const host = createStandaloneWidgetHost({ ...fixture, context: makeContext(), registry });
  const first = await host.mount();
  const second = await host.mount();
  assert.strictEqual(first, second);
  assert.equal(fixture.runtime.calls.filter(call => call.type === "mount").length, 1);
  assert.equal(fixture.root.getAttribute("data-nc-widget"), "alerts");
  assert.equal(fixture.root.getAttribute("data-nc-state"), "ready");
  assert.equal(fixture.root.getAttribute("data-nc-orientation"), "horizontal");
  assert.equal(fixture.destroyButton.disabled, false);
  assert.equal(host.getConfig().serialized, '{"schema":"widget-config.v1","widget":"alerts","version":1,"config":{"density":"normal","orientation":"horizontal","theme":"inherit"}}');
  await host.destroy();
  assert.equal(fixture.runtime.calls.filter(call => call.type === "destroy").length, 1);
  assert.equal(fixture.root.getAttribute("data-nc-widget"), null);
  await host.destroy();

  const secondFixture = createHostFixture("?widget=alerts");
  const secondHost = createStandaloneWidgetHost({ ...secondFixture, context: makeContext(), registry });
  await secondHost.mount();
  secondFixture.windowRef.dispatchEvent({ type: "pagehide" });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(secondFixture.runtime.calls.filter(call => call.type === "destroy").length, 1);
});

test("invalid standalone configuration is visible and never reaches Runtime", async () => {
  const fixture = createHostFixture("?widget=weather&dataUrl=https://evil.example");
  const host = createStandaloneWidgetHost({ ...fixture, context: makeContext(), registry });
  assert.equal(await host.mount(), null);
  assert.equal(fixture.runtime.calls.length, 0);
  assert.equal(fixture.status.getAttribute("data-state"), "error");
  assert.match(fixture.status.textContent, /Unsupported standalone widget parameter/);
});

test("standalone host has no Console navigation, iframe, or message bridge", async () => {
  const source = await readFile(new URL("../sites/staging/widgets/widget-host.mjs", import.meta.url), "utf8");
  const html = await readFile(new URL("../sites/staging/widgets/widget.html", import.meta.url), "utf8");
  assert.doesNotMatch(source, /iframe|postMessage|Console|location\.(?:href|assign|replace)/i);
  assert.doesNotMatch(html, /iframe|postMessage|Console|nav/i);
});
