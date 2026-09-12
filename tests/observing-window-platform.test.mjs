import test from "node:test";
import assert from "node:assert/strict";
import { createCatalogRegistry } from "../sites/staging/shared/widget-catalog.mjs";
import { createNebulacast } from "../sites/staging/shared/widget-runtime.mjs";

function classList() {
  const values = new Set();
  return {
    add(...names) { names.forEach(name => values.add(name)); },
    remove(...names) { names.forEach(name => values.delete(name)); },
    contains(name) { return values.has(name); },
  };
}

function matches(node, selector) {
  const parts = selector.trim().split(/\s+/);
  if (parts.length > 1) {
    if (!matches(node, parts.at(-1))) return false;
    let ancestor = node.parentElement;
    for (let index = parts.length - 2; index >= 0; index -= 1) {
      while (ancestor && !matches(ancestor, parts[index])) ancestor = ancestor.parentElement;
      if (!ancestor) return false;
      ancestor = ancestor.parentElement;
    }
    return true;
  }
  const attr = selector.match(/^\.([^\[]+)\[data-wmetric(?:="([^"]+)")?\]$/);
  if (attr) return node.classList.contains(attr[1]) && (attr[2] === undefined || node.dataset.wmetric === attr[2]);
  if (selector.startsWith(".")) return node.classList.contains(selector.slice(1));
  if (selector.startsWith("#")) return node.id === selector.slice(1);
  return false;
}

function createDocument() {
  const documentRef = {
    createElement(tagName) {
      const listeners = new Map();
      const node = {
        ownerDocument: documentRef,
        tagName: tagName.toUpperCase(),
        classList: classList(),
        dataset: {},
        style: {},
        children: [],
        parentElement: null,
        textContent: "",
        type: "",
        attributes: new Map(),
        set id(value) { this.setAttribute("id", value); },
        get id() { return this.getAttribute("id") || ""; },
        set className(value) { String(value).split(/\s+/).filter(Boolean).forEach(name => this.classList.add(name)); },
        setAttribute(name, value) { this.attributes.set(name, String(value)); },
        getAttribute(name) { return this.attributes.get(name) ?? null; },
        removeAttribute(name) { this.attributes.delete(name); },
        appendChild(child) { child.parentElement = this; this.children.push(child); return child; },
        replaceChildren(...children) { this.children = []; children.forEach(child => this.appendChild(child)); },
        addEventListener(type, listener) { const entries = listeners.get(type) || new Set(); entries.add(listener); listeners.set(type, entries); },
        removeEventListener(type, listener) { listeners.get(type)?.delete(listener); },
        dispatchEvent(event) {
          event.target ||= this;
          for (const listener of [...(listeners.get(event.type) || [])]) listener(event);
          this.parentElement?.dispatchEvent(event);
          return true;
        },
        closest(selector) {
          let current = this;
          while (current) {
            if (matches(current, selector)) return current;
            current = current.parentElement;
          }
          return null;
        },
        contains(candidate) {
          return candidate === this || this.children.some(child => child.contains(candidate));
        },
        querySelector(selector) { return this.querySelectorAll(selector)[0] || null; },
        querySelectorAll(selector) {
          const found = [];
          const visit = node => {
            for (const child of node.children) {
              if (matches(child, selector)) found.push(child);
              visit(child);
            }
          };
          visit(this);
          return found;
        },
      };
      return node;
    },
  };
  return documentRef;
}

function createRoot(documentRef, name) {
  const root = documentRef.createElement("section");
  root.name = name;
  root.clientWidth = 720;
  root.clientHeight = 240;
  return root;
}

function createContext(initial = {}) {
  let state = structuredClone({
    observer: { name: "Warsaw", lat: 52.2297, lon: 21.0122, timezone: "Europe/Warsaw", ...initial.observer },
    time: { mode: "manual", datetimeISO: "2026-09-10T18:00:00Z", ...initial.time },
    ...initial,
  });
  const listeners = new Set();
  return {
    get() { return structuredClone(state); },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    update(patch = {}) {
      state = { ...state, ...patch, observer: patch.observer ? { ...state.observer, ...patch.observer } : state.observer };
      for (const listener of [...listeners]) listener(structuredClone(state));
      return state;
    },
  };
}

function createResizeObserver() {
  const instances = [];
  class ResizeObserverMock {
    constructor(callback) { this.callback = callback; this.disconnected = false; instances.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  ResizeObserverMock.instances = instances;
  return ResizeObserverMock;
}

function createData() {
  return {
    wx: {
      hourly: [
        { timestamp_utc: "2026-09-10T19:00:00Z", night: true, cloud: { total_percent: 20 }, air: { temperature_c: 12, dewpoint_c: 8 }, wind: { speed_mps: 2 }, pressure_hpa: 1015 },
        { timestamp_utc: "2026-09-10T20:00:00Z", night: true, cloud: { total_percent: 30 }, air: { temperature_c: 11, dewpoint_c: 8 }, wind: { speed_mps: 3 }, pressure_hpa: 1014 },
        { timestamp_utc: "2026-09-10T22:00:00Z", night: false, cloud: { total_percent: 50 }, air: { temperature_c: 10, dewpoint_c: 8 }, wind: { speed_mps: 4 }, pressure_hpa: 1013 },
      ],
      decision: { best_tonight: { start: "2026-09-10T19:00:00Z", end: "2026-09-10T21:00:00Z" } },
    },
    sunMoon: { schema: "sun_moon.v2", frames: [{ t_utc: "2026-Sep-10 19:00Z", moon: { alt_deg: 15 } }] },
  };
}

function createRuntime(context) {
  return createNebulacast({ context, registry: createCatalogRegistry() });
}

test("Best observing window mounts through Platform Context and owns update/resize/destroy", async () => {
  const documentRef = createDocument();
  const context = createContext();
  const ResizeObserver = createResizeObserver();
  const root = createRoot(documentRef, "window");
  const instance = await createRuntime(context).mount(root, {
    widget: "observing-window",
    config: { orientation: "horizontal", data: createData(), ResizeObserver },
  });

  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(root.getAttribute("data-nc-widget"), "observing-window");
  assert.equal(root.getAttribute("data-nc-state"), "ready");
  assert.equal(root.querySelector(".dbp-window-time").textContent, "21:00 – 23:00");
  assert.equal(root.querySelectorAll(".dbp-window-chart .nop-bar").length, 2);
  assert.equal(root.querySelector(".dbp-window-chip[data-wmetric=\"moon\"]").classList.contains("is-active"), true);

  await instance.update({ metric: "cloud" });
  assert.equal(root.querySelector(".dbp-window-chip[data-wmetric=\"cloud\"]").classList.contains("is-active"), true);
  root.querySelector(".dbp-window-chip[data-wmetric=\"temp\"]").dispatchEvent({ type: "click" });
  assert.equal(root.querySelector(".dbp-window-chip[data-wmetric=\"temp\"]").classList.contains("is-active"), true);
  instance.resize({ width: 800, height: 240 });
  assert.equal(ResizeObserver.instances.length, 1);
  assert.equal(ResizeObserver.instances[0].disconnected, false);

  context.update({ observer: { timezone: "UTC" } });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(root.querySelector(".dbp-window-time").textContent, "19:00 – 21:00");
  instance.destroy();
  instance.destroy();
  assert.equal(ResizeObserver.instances[0].disconnected, true);
  assert.equal(root.getAttribute("data-nc-widget"), null);
});

test("Best observing window isolates a failed instance and reports degraded data", async () => {
  const documentRef = createDocument();
  const ResizeObserver = createResizeObserver();
  const goodRoot = createRoot(documentRef, "good");
  const failedRoot = createRoot(documentRef, "failed");
  const good = await createRuntime(createContext()).mount(goodRoot, {
    widget: "observing-window",
    config: { data: createData(), ResizeObserver },
  });
  const failed = await createRuntime(createContext()).mount(failedRoot, {
    widget: "observing-window",
    config: { data: Promise.reject(new Error("fixture failure")), ResizeObserver },
  });
  await new Promise(resolve => setTimeout(resolve, 0));

  assert.equal(goodRoot.getAttribute("data-nc-state"), "ready");
  assert.equal(failedRoot.getAttribute("data-nc-state"), "error");
  assert.match(failedRoot.querySelector(".dbp-window-sub").textContent, /fixture failure/);
  assert.equal(goodRoot.getAttribute("data-nc-widget"), "observing-window");
  good.destroy();
  failed.destroy();
});

test("Best observing window keeps the Sun/Moon frame enrichment and supports partial data", async () => {
  const documentRef = createDocument();
  const root = createRoot(documentRef, "partial");
  const context = createContext();
  const instance = await createRuntime(context).mount(root, {
    widget: "observing-window",
    config: { data: { sunMoon: createData().sunMoon } },
  });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(root.getAttribute("data-nc-state"), "degraded");
  assert.match(root.querySelector(".dbp-window-sub").textContent, /No weather data available/);
  instance.destroy();
});
