import { createLocationController } from "../../sites/staging/weather/widgets/location/platform-adapter.mjs";

class FakeClassList {
  #values = new Set();
  add(...values) { values.forEach(value => this.#values.add(value)); }
  remove(...values) { values.forEach(value => this.#values.delete(value)); }
  contains(value) { return this.#values.has(value); }
  toggle(value, force) {
    const next = force === undefined ? !this.#values.has(value) : force;
    next ? this.#values.add(value) : this.#values.delete(value);
    return next;
  }
  toString() { return [...this.#values].join(" "); }
}

class FakeElement {
  constructor(documentRef, tagName = "div") {
    this.ownerDocument = documentRef;
    this.tagName = tagName.toUpperCase();
    this.classList = new FakeClassList();
    this.attributes = new Map();
    this.listeners = new Map();
    this.children = [];
    this.parentElement = null;
    this.style = {};
    this.dataset = {};
    this.value = "";
    this.disabled = false;
    this.textContent = "";
    this._innerHTML = "";
  }

  set id(value) { this.setAttribute("id", value); }
  get id() { return this.getAttribute("id") || ""; }

  set className(value) {
    this.classList = new FakeClassList();
    for (const item of String(value).split(/\s+/).filter(Boolean)) this.classList.add(item);
  }
  get className() { return this.classList.toString(); }

  set innerHTML(value) {
    this._innerHTML = String(value);
    this.children = [];
    if (this._innerHTML.includes("loc-action-bar")) this.#buildLocationMarkup();
  }
  get innerHTML() { return this._innerHTML; }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }
  removeChild(child) {
    this.children = this.children.filter(item => item !== child);
    child.parentElement = null;
    return child;
  }
  replaceChildren(...children) {
    this.children = [];
    children.forEach(child => this.appendChild(child));
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(listener);
  }
  removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); }
  dispatchEvent(event) {
    const next = typeof event === "string" ? { type: event } : event;
    if (!next.target) next.target = this;
    for (const listener of [...(this.listeners.get(next.type) || [])]) listener(next);
    return true;
  }
  click() { this.dispatchEvent({ type: "click", target: this }); }
  contains(node) { return node === this || this.children.some(child => child.contains(node)); }
  querySelector(selector) {
    return this.#walk().find(element => matchesSelector(element, selector)) || null;
  }
  #walk() {
    return this.children.flatMap(child => [child, ...child.#walk()]);
  }
  #buildLocationMarkup() {
    const bar = this.ownerDocument.createElement("div");
    bar.className = "loc-action-bar";
    const wrapper = this.ownerDocument.createElement("div");
    wrapper.className = "loc-input-wrapper";
    const input = this.ownerDocument.createElement("input");
    input.className = "loc-input";
    const dropdown = this.ownerDocument.createElement("div");
    dropdown.className = "loc-dd";
    wrapper.appendChild(input);
    wrapper.appendChild(dropdown);
    const geo = this.ownerDocument.createElement("button");
    geo.className = "loc-geo-button";
    const share = this.ownerDocument.createElement("button");
    share.className = "loc-share-button";
    bar.appendChild(wrapper);
    bar.appendChild(geo);
    bar.appendChild(share);
    const status = this.ownerDocument.createElement("div");
    status.className = "loc-status-line";
    const statusContent = this.ownerDocument.createElement("span");
    statusContent.className = "loc-status-content";
    status.appendChild(statusContent);
    this.appendChild(bar);
    this.appendChild(status);
  }
}

function matchesSelector(element, selector) {
  if (selector.startsWith(".")) return element.classList.contains(selector.slice(1));
  if (selector.startsWith("#")) return element.id === selector.slice(1);
  return element.tagName.toLowerCase() === selector.toLowerCase();
}

class FakeDocument {
  constructor() {
    this.defaultView = {
      location: { origin: "https://example.test", pathname: "/weather/" },
      navigator: {},
      document: this,
    };
  }
  createElement(tagName) { return new FakeElement(this, tagName); }
  addEventListener() {}
  removeEventListener() {}
}

export function createLocationRoot(name) {
  const documentRef = new FakeDocument();
  const root = documentRef.createElement("section");
  root.name = name;
  return root;
}

export function createLocationContext(initial = {}) {
  let current = structuredClone(initial);
  const listeners = new Set();
  return {
    get: () => structuredClone(current),
    getObserver: () => structuredClone(current.observer || {}),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    update(patch) {
      if (patch.observer) current.observer = { ...(current.observer || {}), ...structuredClone(patch.observer) };
      if (patch.time) current.time = { ...(current.time || {}), ...structuredClone(patch.time) };
      const next = structuredClone(current);
      for (const listener of [...listeners]) listener(next);
      return next;
    },
  };
}

export function createLocationDefinition() {
  return {
    type: "location",
    version: 1,
    defaults: { orientation: "auto", theme: "inherit", density: "normal" },
    capabilities: { observerAware: true, timeAware: true, multiInstance: true, embed: true },
    loader: async () => ({ mount: (root, context, config, host) =>
      createLocationController(root, context, config, host).mount() }),
  };
}

export function createFetchMock(routes = {}) {
  const calls = [];
  const fetch = async (url, options = {}) => {
    calls.push({ url, options });
    if (options.signal?.aborted) return { ok: false, json: async () => ({}) };
    const route = Object.entries(routes).find(([prefix]) => url.startsWith(prefix))?.[1];
    const value = typeof route === "function" ? await route(url, options) : route;
    return { ok: value !== undefined, json: async () => value ?? {} };
  };
  fetch.calls = calls;
  return fetch;
}

export function createGeolocationMock() {
  let success;
  let failure;
  return {
    geolocation: {
      getCurrentPosition(onSuccess, onFailure) {
        success = onSuccess;
        failure = onFailure;
      },
    },
    resolve(position) { return success?.(position); },
    reject(error = new Error("denied")) { return failure?.(error); },
  };
}

export function flush() {
  return new Promise(resolve => setTimeout(resolve, 0));
}
