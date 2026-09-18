import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createWeatherPageComposer, EAGER_SLOTS, SKY_SLOT } from "../sites/staging/weather/weather-composer.mjs";

function createClassList() {
  const values = new Set();
  return {
    add(name) { values.add(name); },
    remove(name) { values.delete(name); },
    toggle(name, force) { if (force) values.add(name); else values.delete(name); },
    contains(name) { return values.has(name); },
  };
}

function createDocument() {
  const tabs = ["weather", "map", "sun", "sky"].map(tab => ({
    dataset: { tab },
    classList: createClassList(),
    listeners: new Map(),
    addEventListener(type, listener) { this.listeners.set(type, listener); },
  }));
  const contents = ["weather", "map", "sun", "astro", "sky"].map(id => ({
    id: `w-${id}`,
    classList: createClassList(),
  }));
  const roots = new Map([...EAGER_SLOTS, SKY_SLOT].map(slot => [slot.selector, {
    selector: slot.selector,
    classList: createClassList(),
    attributes: new Map(),
    setAttribute(name, value) { this.attributes.set(name, value); },
    removeAttribute(name) { this.attributes.delete(name); },
  }]));
  return {
    querySelector(selector) { return roots.get(selector) || null; },
    querySelectorAll(selector) {
      if (selector === ".widget-tab") return tabs;
      if (selector === ".widget-tab-content") return contents;
      return [];
    },
    tabs,
    contents,
  };
}

function createStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
  };
}

function createContext() {
  return { get() { return {}; }, subscribe() { return () => {}; }, update() {} };
}

test("Weather page composer mounts registered widgets and lazy-loads square Sky once", async () => {
  const documentRef = createDocument();
  const calls = [];
  const runtime = {
    async mount(root, specification) {
      calls.push({ root, specification });
      return { destroy() { calls.push({ type: "destroy", root }); } };
    },
  };
  const composer = createWeatherPageComposer({ context: createContext(), runtime, documentRef, storage: createStorage() });
  const first = await composer.mount();
  assert.equal(first.instances.size, 5);
  assert.deepEqual(calls.slice(0, 5).map(call => call.specification.widget), ["location", "weather", "sun-moon", "astro", "map"]);
  assert.equal(calls[1].specification.config.orientation, "horizontal");
  assert.equal(calls[4].specification.config.mapUrl, "/weather/map-poc.html");

  await composer.selectTab("sky");
  await composer.selectTab("sky");
  assert.equal(composer.getSnapshot().instances.size, 6);
  assert.equal(calls.filter(call => call.specification?.widget === "sky").length, 1);
  assert.equal(calls.find(call => call.specification?.widget === "sky").specification.config.orientation, "horizontal");
  assert.equal(documentRef.contents.find(content => content.id === "w-sky").classList.contains("active"), true);

  await composer.selectTab("map");
  assert.equal(documentRef.contents.find(content => content.id === "w-map").classList.contains("active"), true);
  await composer.destroy();
  assert.equal(composer.getSnapshot().instances.size, 0);
  assert.equal(calls.filter(call => call.type === "destroy").length, 6);
});

test("Weather page composer isolates a missing slot and retains sibling mounts", async () => {
  const documentRef = createDocument();
  const missingRoot = documentRef.querySelector("#w-astro");
  documentRef.querySelector = selector => selector === "#w-astro" ? null : [...EAGER_SLOTS, SKY_SLOT].map(slot => [slot.selector, {
    classList: createClassList(), setAttribute() {}, removeAttribute() {},
  }]).find(([key]) => key === selector)?.[1] || null;
  const composer = createWeatherPageComposer({
    context: createContext(),
    runtime: { mount: async () => ({ destroy() {} }) },
    documentRef,
    storage: createStorage(),
  });
  const snapshot = await composer.mount();
  assert.equal(missingRoot !== null, true);
  assert.equal(snapshot.instances.size, 4);
  assert.match(snapshot.errors.get("astro").message, /root not found/);
  await composer.destroy();
});

test("Weather host delegates widget ownership and Sky compatibility to the composer", async () => {
  const source = await readFile(new URL("../sites/staging/weather/index.html", import.meta.url), "utf8");
  assert.match(source, /createWeatherPageComposer/);
  assert.match(source, /id="skyMount" data-nc-shape="square"/);
  assert.doesNotMatch(source, /mount(?:Location|Weather|Map|SunMoon|Astro)\(/);
  assert.doesNotMatch(source, /legacy-bootstrap|SKY_CONFIG|__skyWidget/);
});
