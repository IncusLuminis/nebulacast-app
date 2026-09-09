function createClassList() {
  const values = new Set();
  return {
    add(...names) { names.forEach(name => values.add(name)); },
    remove(...names) { names.forEach(name => values.delete(name)); },
    contains(name) { return values.has(name); },
    toggle(name, force) {
      const next = force === undefined ? !values.has(name) : !!force;
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
    removeEventListener(type, listener) { listeners.get(type)?.delete(listener); },
    dispatchEvent(event) {
      if (!event.target) event.target = this;
      for (const listener of [...(listeners.get(event.type) || [])]) listener(event);
      return true;
    },
    listenerCount(type) { return listeners.get(type)?.size || 0; },
  };
}

function createCanvasContext(operations = null) {
  const state = { globalAlpha: 1 };
  return new Proxy(state, {
    get(target, property) {
      if (property === "measureText") return () => ({ width: 0 });
      if (property === "createLinearGradient" || property === "createRadialGradient") {
        return () => ({ addColorStop() {} });
      }
      if (property in target) return target[property];
      return () => {};
    },
    set(target, property, value) {
      target[property] = value;
      if (property === "strokeStyle" && value === "rgba(255,255,180,0.95)") {
        operations?.push("highlight-stroke");
      }
      return true;
    },
  });
}

function matchesSelector(node, selector) {
  if (selector === "svg") return node.tagName === "SVG";
  if (selector === "canvas.sky-canvas") return node.tagName === "CANVAS" && node.classList.contains("sky-canvas");
  if (selector.startsWith(".")) return node.classList.contains(selector.slice(1));
  if (selector.startsWith("#")) return node.id === selector.slice(1);
  const dataRole = selector.match(/^\[data-role="([^"]+)"\]$/);
  return dataRole ? node.getAttribute("data-role") === dataRole[1] : node.tagName === selector.toUpperCase();
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
    get parentNode() { return this.parentElement; },
    firstChild: null,
    textContent: "",
    value: "",
    clientWidth: 640,
    clientHeight: 480,
    width: 0,
    height: 0,
    set id(value) { this.setAttribute("id", value); },
    get id() { return this.getAttribute("id") || ""; },
    set className(value) {
      this.classList = createClassList();
      for (const name of String(value).split(/\s+/).filter(Boolean)) this.classList.add(name);
    },
    get className() { return this.classList.toString(); },
    setAttribute(name, value) {
      attributes.set(name, String(value));
      if (name.startsWith("data-")) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = String(value);
    },
    getAttribute(name) { return attributes.get(name) ?? null; },
    removeAttribute(name) { attributes.delete(name); },
    appendChild(child) {
      child.parentElement = this;
      children.push(child);
      this.firstChild ||= child;
      child.connectedCallback?.();
      return child;
    },
    append(...next) { next.forEach(child => this.appendChild(child)); },
    removeChild(child) {
      const index = children.indexOf(child);
      if (index >= 0) children.splice(index, 1);
      child.parentElement = null;
      this.firstChild = children[0] || null;
      child.disconnectedCallback?.();
      return child;
    },
    remove() { this.parentElement?.removeChild(this); },
    replaceChildren(...next) {
      for (const child of [...children]) this.removeChild(child);
      next.forEach(child => this.appendChild(child));
    },
    querySelector(selector) {
      if (matchesSelector(this, selector)) return this;
      for (const child of children) {
        const match = child.querySelector(selector);
        if (match) return match;
      }
      return null;
    },
    querySelectorAll(selector) {
      const found = [];
      const visit = current => {
        if (matchesSelector(current, selector)) found.push(current);
        current.children.forEach(visit);
      };
      visit(this);
      return found;
    },
    contains(candidate) { return candidate === this || children.some(child => child.contains(candidate)); },
    getBoundingClientRect() {
      return { left: 0, top: 0, right: this.clientWidth, bottom: this.clientHeight, width: this.clientWidth, height: this.clientHeight };
    },
    getContext() { return createCanvasContext(documentRef.canvasOperations); },
    attachShadow() {
      this.shadowRoot = createNode(documentRef, "shadow-root");
      return this.shadowRoot;
    },
    ...events,
  };

  let markup = "";
  Object.defineProperty(node, "innerHTML", {
    get() { return markup; },
    set(value) {
      markup = String(value);
      if (markup.includes("sky-canvas-wrap")) {
        node.replaceChildren();
        const wrap = createNode(documentRef, "div");
        wrap.className = "sky-canvas-wrap";
        const canvas = createNode(documentRef, "canvas");
        canvas.className = "sky-canvas";
        const status = createNode(documentRef, "div");
        status.className = "sky-status";
        status.setAttribute("data-role", "status");
        wrap.appendChild(canvas);
        node.appendChild(wrap);
        node.appendChild(status);
      } else if (markup.includes("<svg")) {
        node.replaceChildren(createNode(documentRef, "svg"));
      }
    },
  });
  return node;
}

function createBrowserFixture(routes = {}) {
  const customElementConstructors = new Map();
  const customElements = {
    define(name, constructor) { customElementConstructors.set(name, constructor); },
    get(name) { return customElementConstructors.get(name); },
  };
  const documentEvents = createEventHub();
  const documentRef = {
    readyState: "complete",
    fullscreenElement: null,
    documentElement: { clientWidth: 1280, clientHeight: 720 },
    canvasOperations: [],
    createElement(tagName) {
      const Constructor = customElementConstructors.get(String(tagName).toLowerCase());
      const element = Constructor ? new Constructor() : createNode(documentRef, tagName);
      element.ownerDocument = documentRef;
      return element;
    },
    createTextNode(text) { const node = createNode(documentRef, "text"); node.textContent = String(text); return node; },
    addEventListener: documentEvents.addEventListener,
    removeEventListener: documentEvents.removeEventListener,
    dispatchEvent: documentEvents.dispatchEvent,
    listenerCount: documentEvents.listenerCount,
    getElementById() { return null; },
    exitFullscreen() { this.fullscreenElement = null; this.dispatchEvent({ type: "fullscreenchange" }); return Promise.resolve(); },
  };
  documentRef.body = createNode(documentRef, "body");
  documentRef.head = createNode(documentRef, "head");

  const windowEvents = createEventHub();
  let rafId = 0;
  const rafs = new Map();
  const windowRef = {
    location: { origin: "https://example.test", pathname: "/" },
    devicePixelRatio: 1,
    innerWidth: 1280,
    innerHeight: 720,
    customElements,
    addEventListener: windowEvents.addEventListener,
    removeEventListener: windowEvents.removeEventListener,
    dispatchEvent: windowEvents.dispatchEvent,
    listenerCount: windowEvents.listenerCount,
    requestAnimationFrame(callback) {
      const id = ++rafId;
      const timer = setTimeout(() => { rafs.delete(id); callback(Date.now()); }, 0);
      rafs.set(id, timer);
      return id;
    },
    cancelAnimationFrame(id) { clearTimeout(rafs.get(id)); rafs.delete(id); },
  };
  windowRef.self = windowRef;
  windowRef.top = windowRef;

  const fetch = async url => {
    const entry = Object.entries(routes).find(([prefix]) => String(url).startsWith(prefix));
    const value = entry ? (typeof entry[1] === "function" ? await entry[1](url) : entry[1]) : {};
    return { ok: true, status: 200, async json() { return structuredClone(value); } };
  };

  class FakeNode {}
  class FakeElement extends FakeNode {}
  class FakeHTMLElement extends FakeElement {
    constructor() { super(); Object.assign(this, createNode(documentRef, "div")); }
  }

  return {
    window: windowRef,
    document: documentRef,
    canvasOperations: documentRef.canvasOperations,
    customElements,
    fetch,
    Node: FakeNode,
    Element: FakeElement,
    HTMLElement: FakeHTMLElement,
  };
}

export function createSkyBrowserFixture(routes = {}) {
  return createBrowserFixture({
    "/sky/data/stars.json": { stars: [] },
    "/sky/data/constellations.json": { constellations: [] },
    "/sky/data/milkyway.json": { points: [] },
    "/sky/data/objects_today.json": { items: [] },
    "/sky/data/alerts_now.json": { items: [] },
    "/sky/data/sun_moon.json": { frames: [] },
    "/sky/data/planets.json": { items: [] },
    "/sky/data/dso_messier.json": { items: [] },
    "/sky/data/ranking.json": { items: [] },
    ...routes,
  });
}

export function installSkyBrowserGlobals(fixture) {
  const previous = new Map();
  const globals = {
    window: fixture.window,
    document: fixture.document,
    customElements: fixture.customElements,
    Node: fixture.Node,
    Element: fixture.Element,
    HTMLElement: fixture.HTMLElement,
    fetch: fixture.fetch,
    requestAnimationFrame: fixture.window.requestAnimationFrame,
    cancelAnimationFrame: fixture.window.cancelAnimationFrame,
  };
  for (const [key, value] of Object.entries(globals)) {
    previous.set(key, globalThis[key]);
    globalThis[key] = value;
  }
  return () => {
    for (const [key, value] of previous) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  };
}

export function createSkyRoot(name, { width = 640, height = 480 } = {}, ownerDocument) {
  const root = createNode(ownerDocument, "section");
  root.name = name;
  root.clientWidth = width;
  root.clientHeight = height;
  return root;
}

export function createSkyContext(initial = {}) {
  let snapshot = structuredClone({
    observer: { name: "Warsaw", lat: 52.2297, lon: 21.0122, timezone: "Europe/Warsaw", ...initial.observer },
    time: { mode: "live", datetimeISO: null, ...initial.time },
    locale: "en",
    theme: "light",
    ...initial,
  });
  const listeners = new Set();
  return {
    get() { return structuredClone(snapshot); },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    update(patch = {}) {
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
    listenerCount() { return listeners.size; },
  };
}

export function flush() {
  return new Promise(resolve => setTimeout(resolve, 0));
}
