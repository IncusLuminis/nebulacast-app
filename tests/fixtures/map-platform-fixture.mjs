/**
 * Deterministic browser/context helpers for the Map platform tests.
 *
 * The fixture models only the legacy mount boundary: a root that creates the
 * map iframe, an iframe load event/postMessage surface, and Platform Context.
 * It does not reimplement map-poc.html or Leaflet.
 */

function createClassList() {
  const values = new Set();
  return {
    add(...names) { names.forEach(name => values.add(name)); },
    remove(...names) { names.forEach(name => values.delete(name)); },
    contains(name) { return values.has(name); },
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
  const attributes = new Map();
  const events = createEventHub();
  const children = [];
  const node = {
    ownerDocument: documentRef,
    tagName: String(tagName).toUpperCase(),
    classList: createClassList(),
    style: {},
    dataset: {},
    children,
    parentElement: null,
    clientWidth: 640,
    clientHeight: 480,
    set id(value) { this.setAttribute("id", value); },
    get id() { return this.getAttribute("id") || ""; },
    set className(value) {
      this.classList = createClassList();
      for (const name of String(value).split(/\s+/).filter(Boolean)) this.classList.add(name);
    },
    get className() { return this.classList.toString(); },
    setAttribute(name, value) { attributes.set(name, String(value)); },
    getAttribute(name) { return attributes.get(name) ?? null; },
    removeAttribute(name) { attributes.delete(name); },
    appendChild(child) {
      child.parentElement = this;
      children.push(child);
      return child;
    },
    removeChild(child) {
      const index = children.indexOf(child);
      if (index >= 0) children.splice(index, 1);
      child.parentElement = null;
      return child;
    },
    replaceChildren(...next) {
      children.length = 0;
      next.forEach(child => this.appendChild(child));
    },
    querySelector(selector) {
      if ((selector.startsWith("#") && this.id === selector.slice(1)) ||
          (selector.startsWith(".") && this.classList.contains(selector.slice(1)))) {
        return this;
      }
      for (const child of children) {
        const match = child.querySelector(selector);
        if (match) return match;
      }
      return null;
    },
    contains(candidate) {
      return candidate === this || children.some(child => child.contains(candidate));
    },
    ...events,
  };
  return node;
}

function createDocument() {
  const documentRef = {
    readyState: "complete",
    createElement(tagName) { return createNode(documentRef, tagName); },
    addEventListener() {},
    removeEventListener() {},
  };
  return documentRef;
}

function createIframe(documentRef, messages) {
  const iframe = createNode(documentRef, "iframe");
  iframe.id = "mapIframe";
  iframe.contentWindow = {
    postMessage(message, targetOrigin) {
      messages.push({ message: structuredClone(message), targetOrigin });
    },
  };
  iframe.setAttribute("src", "./map-poc.html");
  iframe.triggerLoad = () => iframe.dispatchEvent({ type: "load", target: iframe });
  return iframe;
}

export function createMapRoot(name = "map", { width = 640, height = 480 } = {}, ownerDocument = null) {
  const documentRef = ownerDocument || createDocument();
  const messages = [];
  const root = createNode(documentRef, "section");
  root.name = name;
  root.clientWidth = width;
  root.clientHeight = height;
  let markup = "";
  Object.defineProperty(root, "innerHTML", {
    get() { return markup; },
    set(value) {
      markup = String(value);
      root.replaceChildren();
      if (markup.includes('id="mapIframe"')) {
        const container = documentRef.createElement("div");
        container.className = "widget-map-container";
        root.appendChild(container);
        container.appendChild(createIframe(documentRef, messages));
      }
    },
  });
  root.getIframe = () => root.querySelector("#mapIframe");
  root.getPostedMessages = () => structuredClone(messages);
  return root;
}

export function createMapWindow() {
  const events = createEventHub();
  const mapWindow = {
    location: { origin: "https://example.test", pathname: "/weather/" },
    navigator: {},
    self: null,
    top: null,
    ...events,
  };
  mapWindow.self = mapWindow;
  mapWindow.top = mapWindow;
  return mapWindow;
}

/** Install globals required by the unchanged legacy map.js mount boundary. */
export function installMapGlobals(mapWindow = createMapWindow(), documentRef = createDocument()) {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  globalThis.window = mapWindow;
  globalThis.document = documentRef;
  return {
    window: mapWindow,
    document: documentRef,
    restore() {
      if (previousWindow === undefined) delete globalThis.window;
      else globalThis.window = previousWindow;
      if (previousDocument === undefined) delete globalThis.document;
      else globalThis.document = previousDocument;
    },
  };
}

export function createMapContext(initial = {}) {
  let snapshot = structuredClone({
    observer: {
      name: "Warsaw",
      lat: 52.2297,
      lon: 21.0122,
      timezone: "Europe/Warsaw",
      source: "fixture",
      ...(initial.observer || {}),
    },
    time: { mode: "live", datetimeISO: null, ...(initial.time || {}) },
    locale: "en",
    theme: "light",
    ...initial,
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

export function flush() {
  return new Promise(resolve => setTimeout(resolve, 0));
}
