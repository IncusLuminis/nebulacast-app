import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createWidgetRegistry } from "../sites/staging/shared/widget-registry.mjs";
import { createNebulacast } from "../sites/staging/shared/widget-runtime.mjs";
import { widgetCatalog } from "../sites/staging/shared/widget-catalog.mjs";

class FakeElement {
  constructor(documentRef, tagName = "div") {
    this.ownerDocument = documentRef;
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentElement = null;
    this.attributes = new Map();
    this.listeners = new Map();
    this.style = {};
    this.dataset = {};
    this.textContent = "";
    this.innerText = "";
    this.value = "";
    this.classList = {
      values: new Set(),
      add: (...values) => values.forEach(value => this.classList.values.add(value)),
      remove: (...values) => values.forEach(value => this.classList.values.delete(value)),
      contains: value => this.classList.values.has(value),
    };
  }
  set id(value) { this.setAttribute("id", value); }
  get id() { return this.getAttribute("id") || ""; }
  set className(value) { this.classList.values = new Set(String(value).split(/\s+/).filter(Boolean)); }
  get className() { return [...this.classList.values].join(" "); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }
  appendChild(child) { child.parentElement = this; this.children.push(child); return child; }
  removeChild(child) { this.children = this.children.filter(item => item !== child); child.parentElement = null; return child; }
  remove() { this.parentElement?.removeChild(this); }
  addEventListener(type, listener) { const set = this.listeners.get(type) || new Set(); set.add(listener); this.listeners.set(type, set); }
  removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); }
  dispatchEvent(event) { for (const listener of [...(this.listeners.get(event.type) || [])]) listener(event); return true; }
  click() { this.dispatchEvent({ type: "click", target: this }); }
  set innerHTML(value) {
    this._innerHTML = String(value);
    this.children = [];
    for (const role of this._innerHTML.matchAll(/data-role="([^"]+)"/g)) {
      const child = new FakeElement(this.ownerDocument);
      child.setAttribute("data-role", role[1]);
      this.appendChild(child);
    }
    if (this._innerHTML.includes("nrw-content") || this._innerHTML.includes("nrc-content")) {
      const content = new FakeElement(this.ownerDocument);
      content.className = this._innerHTML.includes("nrw-content") ? "nrw-content" : "nrc-content";
      this.appendChild(content);
    }
  }
  get innerHTML() {
    if (this._innerHTML !== undefined) return this._innerHTML;
    return String(this.textContent || "").replace(/[&<>"']/g, value => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[value]));
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  querySelectorAll(selector) {
    const matches = [];
    const visit = node => {
      for (const child of node.children) {
        if (matchesSelector(child, selector)) matches.push(child);
        visit(child);
      }
    };
    visit(this);
    return matches;
  }
  cloneNode() { const copy = new FakeElement(this.ownerDocument, this.tagName); copy.textContent = this.textContent; copy._innerHTML = this.innerHTML; return copy; }
}

function matchesSelector(node, selector) {
  const role = selector.match(/^\[data-role="([^"]+)"\]$/);
  if (role) return node.getAttribute("data-role") === role[1];
  const id = selector.match(/^\[id="([^"]+)"\]$/);
  if (id) return node.id === id[1];
  if (selector === "a.more") return node.tagName === "A" && node.classList.contains("more");
  if (selector.startsWith(".")) return node.classList.contains(selector.slice(1));
  return node.tagName.toLowerCase() === selector.toLowerCase();
}

class FakeDocument {
  constructor() {
    this.defaultView = { location: { origin: "https://example.test" } };
    this.roots = [];
    this.createElement = tagName => new FakeElement(this, tagName);
    this.createTextNode = value => { const node = new FakeElement(this, "span"); node.textContent = String(value); return node; };
  }
  querySelector(selector) { return this.roots.flatMap(root => [root, ...root.querySelectorAll(selector)]).find(node => matchesSelector(node, selector)) || null; }
}

class FakeXmlNode extends FakeElement {
  constructor(documentRef, tagName, value = "") { super(documentRef, tagName); this.textContent = value; this.innerText = value; }
  querySelector(selector) { if (this.tagName.toLowerCase() === selector.toLowerCase()) return this; return super.querySelector(selector); }
}

class FakeDomParser {
  parseFromString(source, _mime) {
    const documentRef = globalThis.document;
    const feed = new FakeXmlNode(documentRef, "rss");
    if (String(source).includes("INVALID_RSS")) {
      feed.appendChild(new FakeXmlNode(documentRef, "parsererror", "Invalid RSS"));
      return feed;
    }
    for (const match of String(source).matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
      const item = new FakeXmlNode(documentRef, "item");
      for (const field of ["title", "link", "pubDate", "category", "description"]) {
        const found = match[1].match(new RegExp(`<${field}[^>]*>([\\s\\S]*?)</${field}>`, "i"));
        if (found) item.appendChild(new FakeXmlNode(documentRef, field, found[1].replace(/^<!\[CDATA\[|\]\]>$/g, "")));
      }
      feed.appendChild(item);
    }
    return feed;
  }
}

function makeRoot(documentRef, id) {
  const root = new FakeElement(documentRef, "section");
  root.id = id;
  documentRef.roots.push(root);
  return root;
}

function makeContext() {
  let state = { observer: { name: "Warsaw", lat: 52, lon: 21 }, time: { mode: "live" } };
  let subscriptions = 0;
  const listeners = new Set();
  return {
    get: () => structuredClone(state),
    subscribe(listener) { subscriptions += 1; listeners.add(listener); return () => listeners.delete(listener); },
    update(patch) { state = { ...state, ...structuredClone(patch) }; for (const listener of listeners) listener(structuredClone(state)); return structuredClone(state); },
    get subscriptions() { return subscriptions; },
  };
}

function makeFetch(routes) {
  const calls = [];
  const fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    const route = Object.entries(routes).find(([prefix]) => String(url).startsWith(prefix))?.[1];
    if (typeof route === "function") return route(url, options);
    if (route instanceof Error) throw route;
    if (route === undefined) return { ok: false, status: 404, text: async () => "", json: async () => ({}) };
    return {
      ok: true,
      status: 200,
      text: async () => String(route),
      json: async () => route,
    };
  };
  fetch.calls = calls;
  return fetch;
}

function rss(items) {
  return `<rss><channel>${items.map(item => `<item><title>${item.title}</title><link>${item.link || "https://example.test/item"}</link><pubDate>${item.date}</pubDate><category>${item.category}</category><description><![CDATA[${item.description || ""}]]></description></item>`).join("")}</channel></rss>`;
}

const today = new Date();
const tomorrow = new Date(today); tomorrow.setUTCDate(today.getUTCDate() + 1); tomorrow.setUTCHours(12, 0, 0, 0);
const later = new Date(tomorrow); later.setUTCDate(tomorrow.getUTCDate() + 1);

let documentRef;
let originalGlobals;

before(async () => {
  originalGlobals = { document: globalThis.document, localStorage: globalThis.localStorage, fetch: globalThis.fetch, DOMParser: globalThis.DOMParser };
  documentRef = new FakeDocument();
  globalThis.document = documentRef;
  globalThis.DOMParser = FakeDomParser;
  const values = new Map();
  globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)) };
  const source = await readFile(new URL("../frontend/assets/js/widget_runtime.js", import.meta.url), "utf8");
  (0, eval)(source);
});

after(() => {
  for (const [key, value] of Object.entries(originalGlobals)) {
    if (value === undefined) delete globalThis[key];
    else globalThis[key] = value;
  }
});

test("catalog and adapters expose exactly the non-aware News and Events types", async () => {
  assert.deepEqual(widgetCatalog.filter(item => item.type === "news").length, 1);
  assert.deepEqual(widgetCatalog.filter(item => item.type === "events").length, 1);
  for (const type of ["news", "events"]) {
    const definition = widgetCatalog.find(item => item.type === type);
    assert.deepEqual(definition.capabilities, { observerAware: false, timeAware: false, multiInstance: true });
    assert.equal(typeof (await definition.loader()).mount, "function");
  }
  const [newsAdapter, eventsAdapter] = await Promise.all([widgetCatalog.find(item => item.type === "news").loader(), widgetCatalog.find(item => item.type === "events").loader()]);
  assert.equal(typeof newsAdapter.mount, "function");
  assert.equal(typeof eventsAdapter.mount, "function");
});

test("News mounts two isolated instances, preserves filters/sort/maxItems, and has a root-scoped lifecycle", async () => {
  const fetch = makeFetch({ "/news/rss.xml": rss([
    { title: "Older Science", category: "Science", date: "2026-01-01T00:00:00Z" },
    { title: "Newest News", category: "News", date: "2026-02-01T00:00:00Z" },
  ]) });
  const context = makeContext();
  const runtime = createNebulacast({ context, registry: createWidgetRegistry([widgetCatalog.find(item => item.type === "news")]) });
  const firstRoot = makeRoot(documentRef, "news-one");
  const secondRoot = makeRoot(documentRef, "news-two");
  const first = await runtime.mount(firstRoot, { widget: "news", config: { maxItems: 1, fetch } });
  const second = await runtime.mount(secondRoot, { widget: "news", config: { maxItems: 2, fetch } });
  assert.equal(firstRoot.querySelector('[data-role="status"]').textContent, "Loading...");
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(firstRoot.querySelector('[data-role="list"]').children.length, 1);
  assert.equal(secondRoot.querySelector('[data-role="list"]').children.length, 2);
  assert.match(secondRoot.querySelector('[data-role="list"]').children[0].innerHTML, /Newest News/);
  const fetchCount = fetch.calls.length;
  context.update({ observer: { name: "Gdansk" }, time: { mode: "fixed" } });
  assert.equal(fetch.calls.length, fetchCount);
  firstRoot.querySelector('[data-role="filters"]').children.find(button => button.textContent === "Science").click();
  assert.equal(firstRoot.querySelector('[data-role="list"]').children.length, 1);
  first.update({ maxItems: 2 });
  assert.equal(first.config.maxItems, 2);
  await first.refresh();
  assert.equal(fetch.calls.length, fetchCount + 1);
  first.resize({ width: 320 });
  first.destroy(); first.destroy();
  assert.equal(secondRoot.querySelector('[data-role="list"]').children.length, 2);
  second.destroy();
  assert.equal(runtime.unmount(firstRoot), undefined);
  assert.equal(fetch.calls[0].url.startsWith("/news/rss.xml?ts="), true);
});

test("Events uses only daily_signal JSON, keeps future/category behavior, and isolates lifecycle", async () => {
  const fetch = makeFetch({ "/calendar/daily_signal.json": { items: [
    { title: "Later", category: "METEORS", published_at: later.toISOString(), url: "https://example.test/later", summary: "later" },
    { title: "Tomorrow", category: "ECLIPSES", published_at: tomorrow.toISOString(), url: "https://example.test/tomorrow", summary: "tomorrow" },
    { title: "Past", category: "METEORS", published_at: "2020-01-01T00:00:00Z", url: "https://example.test/past" },
  ] } });
  const context = makeContext();
  const runtime = createNebulacast({ context, registry: createWidgetRegistry([widgetCatalog.find(item => item.type === "events")]) });
  const firstRoot = makeRoot(documentRef, "events-one");
  const secondRoot = makeRoot(documentRef, "events-two");
  const first = await runtime.mount(firstRoot, { widget: "events", config: { maxItems: 1, fetch } });
  const second = await runtime.mount(secondRoot, { widget: "events", config: { maxItems: 2, fetch } });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(firstRoot.querySelector('[data-role="list"]').children.length, 1);
  assert.equal(secondRoot.querySelector('[data-role="list"]').children.length, 2);
  const calls = fetch.calls.length;
  context.update({ observer: { name: "Ignored" }, time: { mode: "fixed" } });
  assert.equal(fetch.calls.length, calls);
  secondRoot.querySelector('[data-role="filters"]').children[1].click();
  assert.equal(secondRoot.querySelector('[data-role="list"]').children.length, 1);
  second.update({ maxItems: 1 });
  assert.equal(second.config.maxItems, 1);
  await second.refresh();
  assert.equal(fetch.calls.at(-1).url, "/calendar/daily_signal.json");
  first.destroy(); first.destroy(); second.destroy();
});

test("News timeout creates a fresh controller for the proxy fallback", async () => {
  const fetch = makeFetch({
    "/news/rss.xml": (_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () => {
        const error = new Error("aborted");
        error.name = "AbortError";
        reject(error);
      }, { once: true });
    }),
    "https://api.allorigins.win/raw?url=": rss([{ title: "Proxy result", category: "News", date: "2026-02-01T00:00:00Z" }]),
  });
  const root = makeRoot(documentRef, "news-timeout");
  const runtime = createNebulacast({ context: makeContext(), registry: createWidgetRegistry([widgetCatalog.find(item => item.type === "news")]) });
  const instance = await runtime.mount(root, { widget: "news", config: { fetch, fetchTimeout: 1 } });
  await new Promise(resolve => setTimeout(resolve, 100));
  assert.equal(fetch.calls.length, 2);
  const signals = fetch.calls.map(call => call.options.signal);
  assert.equal(signals[0].aborted, true);
  assert.notStrictEqual(signals[0], signals[1]);
  assert.equal(signals[1].aborted, false);
  assert.match(root.querySelector('[data-role="list"]').children[0].innerHTML, /Proxy result/);
  instance.destroy();
});

test("News invalid direct XML falls back to proxy and renders the proxy item", async () => {
  const fetch = makeFetch({
    "/news/rss.xml": "INVALID_RSS",
    "https://api.allorigins.win/raw?url=": rss([{ title: "Parsed through proxy", category: "Science", date: "2026-02-02T00:00:00Z" }]),
  });
  const root = makeRoot(documentRef, "news-invalid-xml");
  const runtime = createNebulacast({ context: makeContext(), registry: createWidgetRegistry([widgetCatalog.find(item => item.type === "news")]) });
  const instance = await runtime.mount(root, { widget: "news", config: { fetch } });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(fetch.calls.length, 2);
  assert.equal(fetch.calls[0].url.startsWith("/news/rss.xml?ts="), true);
  assert.match(fetch.calls[1].url, /^https:\/\/api\.allorigins\.win\/raw\?url=/);
  assert.match(root.querySelector('[data-role="list"]').children[0].innerHTML, /Parsed through proxy/);
  instance.destroy();
});

test("News and Events scope loading/error messages and retain legacy facades", async () => {
  const newsRoot = makeRoot(documentRef, "legacy-news");
  const eventsRoot = makeRoot(documentRef, "error-events");
  const legacyEventsRoot = makeRoot(documentRef, "legacy-events");
  const failing = makeFetch({ "/calendar/daily_signal.json": { items: [] } });
  const legacy = globalThis.runNewsWidget({ rootId: "legacy-news", fetch: makeFetch({ "/news/rss.xml": rss([]) }) });
  const events = await widgetCatalog.find(item => item.type === "events").loader().then(module => module.mount(eventsRoot, makeContext(), { fetch: failing }));
  const legacyEvents = globalThis.runCalendarWidget({ rootId: "legacy-events", fetch: makeFetch({ "/calendar/daily_signal.json": { items: [] } }) });
  assert.equal(typeof legacy.update, "function");
  assert.equal(typeof legacyEvents.update, "function");
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.match(newsRoot.querySelector('[data-role="list"]').innerHTML, /No items found in RSS feed/);
  assert.match(eventsRoot.querySelector('[data-role="list"]').innerHTML, /Failed to load calendar/);
  events.destroy(); events.destroy(); legacy.destroy(); legacyEvents.destroy();
});

test("source boundaries keep canonical APIs root-scoped and adapters delegation-only", async () => {
  const runtimeSource = await readFile(new URL("../frontend/assets/js/widget_runtime.js", import.meta.url), "utf8");
  const newsAdapter = await readFile(new URL("../sites/staging/news/platform-adapter.mjs", import.meta.url), "utf8");
  const eventsAdapter = await readFile(new URL("../sites/staging/calendar/platform-adapter.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(runtimeSource, /document\.getElementById/);
  assert.match(runtimeSource, /\/news\/rss\.xml/);
  assert.match(runtimeSource, /\/calendar\/daily_signal\.json/);
  assert.match(runtimeSource, /30000/);
  assert.match(runtimeSource, /15000/);
  for (const adapter of [newsAdapter, eventsAdapter]) {
    assert.doesNotMatch(adapter, /fetch|DOMParser|innerHTML|querySelector/);
    assert.match(adapter, /NebulacastWidgetRuntime/);
  }
  assert.doesNotMatch(await readFile(new URL("../sites/staging/news/widget.js", import.meta.url), "utf8"), /mountNewsWidget/);
  assert.doesNotMatch(await readFile(new URL("../sites/staging/calendar/widget.js", import.meta.url), "utf8"), /mountCalendarWidget/);
});
