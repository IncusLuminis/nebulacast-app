import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createWidgetRegistry } from "../sites/staging/shared/widget-registry.mjs";
import { createNebulacast } from "../sites/staging/shared/widget-runtime.mjs";
import { widgetCatalog } from "../sites/staging/shared/widget-catalog.mjs";
import {
  FakeDocument,
  alertData,
  makeContext,
  makeFetch,
  makeRoot,
} from "./fixtures/alerts-platform-fixture.mjs";

const alertsDefinition = widgetCatalog.find(definition => definition.type === "alerts");

function makeRuntime(documentRef, fetch, resolveAutoOrientation) {
  return createNebulacast({
    context: makeContext(),
    registry: createWidgetRegistry([{ ...alertsDefinition, loader: () => import("../sites/staging/alerts/platform-adapter.mjs") }]),
    resolveAutoOrientation,
  });
}

test("Alerts is registered once with the requested Runtime capabilities and defaults", async () => {
  assert.equal(widgetCatalog.filter(definition => definition.type === "alerts").length, 1);
  assert.deepEqual(alertsDefinition.defaults, {
    orientation: "auto",
    theme: "inherit",
    density: "normal",
    dataUrl: "/sky/data/alerts_now.json",
    maxItems: 20,
  });
  assert.deepEqual(alertsDefinition.capabilities, {
    observerAware: false,
    timeAware: false,
    multiInstance: true,
    embed: true,
  });
  assert.equal(typeof (await alertsDefinition.loader()).mount, "function");
});

test("two Alerts instances are root-scoped, independent, and preserve item fields", async () => {
  const documentRef = new FakeDocument();
  const fetch = makeFetch({ "/sky/data/alerts_now.json": alertData });
  const context = makeContext();
  const runtime = createNebulacast({
    context,
    registry: createWidgetRegistry([alertsDefinition]),
    resolveAutoOrientation: ({ root }) => root.clientWidth < 520 ? "vertical" : "horizontal",
  });
  const firstRoot = makeRoot(documentRef, "alerts-one");
  const secondRoot = makeRoot(documentRef, "alerts-two");
  firstRoot.clientWidth = 400;
  const first = await runtime.mount(firstRoot, { widget: "alerts", config: { fetch, orientation: "auto", groups: ["risk", "neo"], maxItems: 2 } });
  const second = await runtime.mount(secondRoot, { widget: "alerts", config: { fetch, orientation: "horizontal", groups: ["transient"], maxItems: 1 } });
  await new Promise(resolve => setTimeout(resolve, 0));

  assert.equal(fetch.calls.length, 2);
  assert.equal(firstRoot.getAttribute("data-nc-orientation"), "vertical");
  assert.equal(secondRoot.getAttribute("data-nc-orientation"), "horizontal");
  assert.equal(firstRoot.querySelector('[data-role="list"]').children.length, 2);
  assert.equal(secondRoot.querySelector('[data-role="list"]').children.length, 1);
  assert.match(firstRoot.querySelector('[data-role="list"]').innerHTML, /Risk title/);
  assert.match(firstRoot.querySelector('[data-role="list"]').innerHTML, /Risk note/);
  assert.match(firstRoot.querySelector('[data-role="list"]').innerHTML, /IP 3\.77e-4/);
  assert.match(firstRoot.querySelector('[data-role="list"]').innerHTML, /datetime="2026-09-10T10:00:00Z"/);
  assert.match(secondRoot.querySelector('[data-role="list"]').innerHTML, /Transient title/);
  assert.equal(context.subscriptions, 0);

  first.update({ groups: ["risk"], maxItems: 1 });
  assert.equal(firstRoot.querySelector('[data-role="list"]').children.length, 1);
  assert.equal(secondRoot.querySelector('[data-role="list"]').children.length, 1);
  first.destroy();
  first.destroy();
  assert.equal(runtime.unmount(firstRoot), undefined);
  second.destroy();
});

test("Alerts handles loading, empty, error, stale-on-error, timeout, and in-flight refresh", async () => {
  const documentRef = new FakeDocument();
  const fetch = makeFetch({ "/sky/data/alerts_now.json": [alertData, new Error("network down")] });
  const context = makeContext();
  const runtime = createNebulacast({ context, registry: createWidgetRegistry([alertsDefinition]) });
  const root = makeRoot(documentRef, "alerts-stale");
  const instance = await runtime.mount(root, { widget: "alerts", config: { fetch } });
  await instance.refresh();
  assert.equal(root.getAttribute("data-nc-state"), "ready");
  await instance.refresh();
  assert.equal(root.getAttribute("data-nc-state"), "stale");
  assert.match(root.querySelector('[data-role="status"]').textContent, /stale alerts/);
  assert.equal(root.querySelector('[data-role="list"]').children.length, 3);

  const emptyRoot = makeRoot(documentRef, "alerts-empty");
  const empty = await runtime.mount(emptyRoot, { widget: "alerts", config: { fetch: makeFetch({ "/sky/data/alerts_now.json": { items: [] } }) } });
  await empty.refresh();
  assert.equal(emptyRoot.getAttribute("data-nc-state"), "empty");
  assert.match(emptyRoot.querySelector('[data-role="status"]').textContent, /No active alerts/);

  const degradedRoot = makeRoot(documentRef, "alerts-degraded");
  const degradedPayload = { items: [...alertData.items, null] };
  const degraded = await runtime.mount(degradedRoot, { widget: "alerts", config: { fetch: makeFetch({ "/sky/data/alerts_now.json": degradedPayload }) } });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(degradedRoot.getAttribute("data-nc-state"), "degraded");
  assert.equal(degradedRoot.querySelector('[data-role="list"]').children.length, alertData.items.length);

  let release;
  const pendingFetch = makeFetch({ "/sky/data/alerts_now.json": () => new Promise(resolve => { release = resolve; }) });
  const pendingRoot = makeRoot(documentRef, "alerts-pending");
  const pending = await runtime.mount(pendingRoot, { widget: "alerts", config: { fetch: pendingFetch } });
  await Promise.resolve();
  assert.equal(pendingRoot.querySelector('[data-role="status"]').textContent, "Loading…");
  assert.equal(pendingFetch.calls.length, 1);
  const refreshOne = pending.refresh();
  const refreshTwo = pending.refresh();
  assert.strictEqual(refreshOne, refreshTwo);
  release({ ok: true, json: async () => alertData });
  await refreshOne;
  assert.equal(pendingRoot.getAttribute("data-nc-state"), "ready");

  const timeoutFetch = makeFetch({ "/sky/data/alerts_now.json": (_url, options) => new Promise((resolve, reject) => {
    options.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })), { once: true });
    void resolve;
  }) });
  const timeoutRoot = makeRoot(documentRef, "alerts-timeout");
  const timeout = await runtime.mount(timeoutRoot, { widget: "alerts", config: { fetch: timeoutFetch, fetchTimeout: 1 } });
  await timeout.refresh();
  assert.equal(timeoutRoot.getAttribute("data-nc-state"), "error");
  assert.equal(timeoutFetch.calls[0].options.signal.aborted, true);

  root.querySelector('[data-role="toggle"]').click();
  assert.equal(root.querySelector('[data-role="body"]').style.display, "none");
  root.querySelector('[data-role="toggle"]').click();
  instance.destroy();
  empty.destroy();
  degraded.destroy();
  pending.destroy();
  timeout.destroy();
});

test("Alerts source boundaries keep the canonical widget local and adapter delegation-only", async () => {
  const widgetSource = await readFile(new URL("../sites/staging/alerts/widget.js", import.meta.url), "utf8");
  const adapterSource = await readFile(new URL("../sites/staging/alerts/platform-adapter.mjs", import.meta.url), "utf8");
  const consoleSource = await readFile(new URL("../sites/staging/index.html", import.meta.url), "utf8");
  const consoleConfigSource = await readFile(new URL("../sites/staging/console/console-config.mjs", import.meta.url), "utf8");
  const stylesheet = await readFile(new URL("../sites/staging/alerts/widget.css", import.meta.url), "utf8");
  assert.doesNotMatch(widgetSource, /document\.getElementById|document\.querySelector|window\./);
  assert.match(widgetSource, /\/sky\/data\/alerts_now\.json/);
  assert.match(widgetSource, /AbortController/);
  assert.match(widgetSource, /inFlight/);
  assert.doesNotMatch(adapterSource, /fetch|innerHTML|querySelector|document/);
  assert.match(adapterSource, /mountAlerts/);
  assert.match(consoleConfigSource, /id: "alerts"[\s\S]*orientation: "vertical"/);
  assert.match(consoleSource, /groups: getSkyAlertGroups\(\)/);
  assert.match(stylesheet, /max-height:\s*230px/);
  assert.match(stylesheet, /overflow-y:\s*auto/);
});
