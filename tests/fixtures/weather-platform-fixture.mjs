/**
 * Deterministic browser/context helpers for the Weather platform tests.
 *
 * The fixture deliberately provides only the browser surface needed to load
 * the legacy module in a controlled test. It does not reimplement Weather
 * rendering or its production data contracts.
 */

function createClassList() {
  const values = new Set();
  return {
    add(...names) { names.forEach(name => values.add(name)); },
    remove(...names) { names.forEach(name => values.delete(name)); },
    contains(name) { return values.has(name); },
    toggle(name, force) {
      const next = force === undefined ? !values.has(name) : force;
      next ? values.add(name) : values.delete(name);
      return next;
    },
    toString() { return [...values].join(" "); },
  };
}

function createEventHub() {
  const listeners = new Map();
  return {
    addEventListener(type, listener) {
      const entries = listeners.get(type) || new Set();
      entries.add(listener);
      listeners.set(type, entries);
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener);
    },
    dispatchEvent(event) {
      for (const listener of [...(listeners.get(event.type) || [])]) listener(event);
      return true;
    },
    listenerCount(type) { return listeners.get(type)?.size || 0; },
  };
}

function createNode(documentRef, tagName = "div") {
  const events = createEventHub();
  const attributes = new Map();
  const classes = createClassList();
  const children = [];
  const queried = new Map();
  const node = {
    ownerDocument: documentRef,
    tagName: String(tagName).toUpperCase(),
    classList: classes,
    style: {},
    dataset: {},
    children,
    parentElement: null,
    firstChild: null,
    textContent: "",
    value: "",
    disabled: false,
    clientWidth: 640,
    clientHeight: 480,
    name: "",
    set id(value) { this.setAttribute("id", value); },
    get id() { return this.getAttribute("id") || ""; },
    set className(value) {
      for (const existing of classes.toString().split(/\s+/).filter(Boolean)) classes.remove(existing);
      for (const name of String(value).split(/\s+/).filter(Boolean)) classes.add(name);
    },
    get className() { return classes.toString(); },
    setAttribute(name, value) { attributes.set(name, String(value)); },
    getAttribute(name) { return attributes.get(name) ?? null; },
    removeAttribute(name) { attributes.delete(name); },
    appendChild(child) {
      child.parentElement = this;
      children.push(child);
      this.firstChild ||= child;
      return child;
    },
    insertBefore(child, before) {
      child.parentElement = this;
      const index = before ? children.indexOf(before) : -1;
      if (index < 0) children.push(child);
      else children.splice(index, 0, child);
      this.firstChild ||= child;
      return child;
    },
    removeChild(child) {
      const index = children.indexOf(child);
      if (index >= 0) children.splice(index, 1);
      child.parentElement = null;
      this.firstChild = children[0] || null;
      return child;
    },
    replaceChildren(...next) {
      children.length = 0;
      this.firstChild = null;
      next.forEach(child => this.appendChild(child));
    },
    querySelector(selector) {
      if (selector === "#poc-weather" && this._containsWeatherMarkup) return this;
      if (!queried.has(selector)) queried.set(selector, createNode(documentRef));
      return queried.get(selector);
    },
    querySelectorAll(selector) {
      if (selector === ".htab[data-hmode]") {
        if (!queried.has(selector)) {
          queried.set(selector, ["observing", "matrix", "weather"].map(mode => {
            const button = createNode(documentRef, "button");
            button.dataset.hmode = mode;
            return button;
          }));
        }
        return queried.get(selector);
      }
      return [];
    },
    closest() { return this; },
    contains(candidate) { return candidate === this || children.includes(candidate); },
    getBoundingClientRect() { return { left: 0, top: 0, right: this.clientWidth, bottom: this.clientHeight, width: this.clientWidth, height: this.clientHeight }; },
    getContext() { return null; },
    ...events,
  };
  return node;
}

function createDocument() {
  const events = createEventHub();
  const localStorageData = new Map();
  const documentRef = {
    readyState: "complete",
    hidden: false,
    body: null,
    head: null,
    createElement(tagName) { return createNode(documentRef, tagName); },
    getElementById(id) {
      if (!this._ids.has(id)) {
        const node = createNode(documentRef);
        node.id = id;
        this._ids.set(id, node);
      }
      return this._ids.get(id);
    },
    querySelector() { return null; },
    addEventListener: events.addEventListener,
    removeEventListener: events.removeEventListener,
    dispatchEvent: events.dispatchEvent,
    listenerCount: events.listenerCount,
    _ids: new Map(),
    _localStorage: {
      getItem(key) { return localStorageData.get(key) ?? null; },
      setItem(key, value) { localStorageData.set(key, String(value)); },
      removeItem(key) { localStorageData.delete(key); },
      clear() { localStorageData.clear(); },
    },
  };
  documentRef.body = createNode(documentRef, "body");
  documentRef.head = createNode(documentRef, "head");
  return documentRef;
}

export function createWeatherRoot(name = "weather", { width = 640, height = 480 } = {}, ownerDocument = null) {
  const documentRef = ownerDocument || createDocument();
  const root = documentRef.createElement("section");
  root.name = name;
  root.clientWidth = width;
  root.clientHeight = height;
  let html = "";
  Object.defineProperty(root, "innerHTML", {
    get() { return html; },
    set(value) {
      html = String(value);
      root._containsWeatherMarkup = html.includes("id=\"poc-weather\"");
    },
  });
  return root;
}

export function createWeatherContext(initial = {}) {
  const { observer: initialObserver = {}, time: initialTime = {}, ...initialRest } = initial;
  let snapshot = structuredClone({
    observer: {
      name: "Warsaw",
      lat: 52.2297,
      lon: 21.0122,
      timezone: "Europe/Warsaw",
      source: "fixture",
      ...initialObserver,
    },
    time: { mode: "live", datetimeISO: null, ...initialTime },
    locale: "en",
    theme: "light",
    ...initialRest,
  });
  const listeners = new Set();
  const updates = [];
  return {
    get() { return structuredClone(snapshot); },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    update(patch = {}) {
      updates.push(structuredClone(patch));
      snapshot = {
        ...snapshot,
        ...structuredClone(patch),
        observer: patch.observer ? { ...snapshot.observer, ...structuredClone(patch.observer) } : snapshot.observer,
        time: patch.time ? { ...snapshot.time, ...structuredClone(patch.time) } : snapshot.time,
      };
      const next = structuredClone(snapshot);
      for (const listener of [...listeners]) listener(next);
      return next;
    },
    getUpdateLog() { return structuredClone(updates); },
  };
}

function createResponse(value, { status = 200, statusText = "OK", url = "" } = {}) {
  const body = structuredClone(value);
  const headers = new Map([["content-type", "application/json"]]);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    url,
    headers: { get(name) { return headers.get(String(name).toLowerCase()) || null; } },
    async json() { return structuredClone(body); },
    async text() { return JSON.stringify(body); },
    clone() { return createResponse(body, { status, statusText, url }); },
  };
}

export function createWeatherFetchMock(routes = {}) {
  const calls = [];
  const fetch = async (url, options = {}) => {
    const request = { url: String(url), options };
    calls.push(request);
    if (options.signal?.aborted) {
      const error = new Error("The operation was aborted");
      error.name = "AbortError";
      throw error;
    }
    const route = Object.entries(routes).find(([prefix]) => String(url).startsWith(prefix))?.[1];
    const result = typeof route === "function" ? await route(url, options) : route;
    if (result && typeof result === "object" && ("body" in result || "status" in result)) {
      return createResponse(result.body ?? {}, result);
    }
    return createResponse(result ?? { hours: [] }, { url: String(url) });
  };
  fetch.calls = calls;
  return fetch;
}

export function createResizeObserverMock() {
  const instances = [];
  class FixtureResizeObserver {
    constructor(callback) {
      this.callback = callback;
      this.observed = new Set();
      this.disconnected = false;
      instances.push(this);
    }
    observe(target) { this.observed.add(target); }
    disconnect() { this.disconnected = true; this.observed.clear(); }
    trigger(width) {
      if (!this.disconnected) this.callback([{ target: [...this.observed][0], contentRect: { width } }]);
    }
  }
  FixtureResizeObserver.instances = instances;
  return FixtureResizeObserver;
}

export function createWeatherPayload({ lat = 52.2297, lon = 21.0122, name = "Warsaw" } = {}) {
  const hours = [0, 1, 2, 3].map(offset => ({
    time: `2026-09-09T${String(offset).padStart(2, "0")}:00:00Z`,
    score: 72 - offset,
    sun_alt_deg: -20,
    moon_alt_deg: 12 + offset,
    cloud_total: 10 + offset,
    cloud_low: 5,
    cloud_mid: 5,
    cloud_high: 5,
    temp_c: 16,
    wind_m_s: 2,
    visibility_m: 20000,
    precip_mm: 0,
    precip_prob: 0,
    pressure_hpa: 1012,
    seeing: 2,
    transparency: 2,
    humidity_pct: 60,
    gate: "OPEN",
  }));
  return {
    ok: true,
    source: "fixture",
    generated_at: "2026-09-09T00:00:00Z",
    location: { name, lat, lon, tz: "Europe/Warsaw" },
    horizon_hours: hours.length,
    profiles: ["balanced", "visual", "broadband", "planetary"],
    default_profile: "balanced",
    hours,
  };
}

export function createWeatherBrowserFixture({ context, fetch, root } = {}) {
  const documentRef = root?.ownerDocument || createDocument();
  const eventHub = createEventHub();
  const windowRef = {
    document: documentRef,
    location: { origin: "https://example.test", pathname: "/weather/", search: "" },
    navigator: {},
    innerWidth: 1280,
    innerHeight: 800,
    devicePixelRatio: 1,
    self: null,
    top: null,
    SunCalc: { getTimes() { return {}; } },
    __WEATHER_POC_CONFIG: {},
    ...eventHub,
  };
  windowRef.self = windowRef;
  windowRef.top = windowRef;
  return {
    context: context || createWeatherContext(),
    fetch: fetch || createWeatherFetchMock(),
    root: root || createWeatherRoot("weather", {}, documentRef),
    window: windowRef,
    document: documentRef,
    localStorage: documentRef._localStorage,
    ResizeObserver: createResizeObserverMock(),
  };
}
