export class GalleryElement {
  constructor(documentRef, tagName = "div") {
    this.ownerDocument = documentRef;
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentElement = null;
    this.attributes = new Map();
    this.listeners = new Map();
    this.classList = {
      values: new Set(),
      add: (...values) => values.forEach(value => this.classList.values.add(value)),
      remove: (...values) => values.forEach(value => this.classList.values.delete(value)),
      contains: value => this.classList.values.has(value),
    };
    this.style = {};
    this.selected = false;
    this.disabled = false;
    this.hidden = false;
    this.value = "";
    this._textContent = "";
  }

  set className(value) {
    this.classList.values = new Set(String(value).split(/\s+/).filter(Boolean));
  }

  get className() { return [...this.classList.values].join(" "); }

  set textContent(value) {
    this._textContent = String(value ?? "");
    this.children = [];
  }

  get textContent() { return this._textContent; }

  select() { this.selected = true; }

  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }

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

  remove() { this.parentElement?.removeChild(this); }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); }

  dispatchEvent(event) {
    for (const listener of [...(this.listeners.get(event.type) || [])]) listener(event);
    return true;
  }

  click() {
    if (!this.disabled) this.dispatchEvent({ type: "click", target: this });
  }

  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }

  querySelectorAll(selector) {
    const matches = [];
    const match = node => {
      const attribute = selector.match(/^\[([^=]+)(?:=["']?([^\]"']+)["']?)?\]$/);
      if (attribute) return attribute[2] === undefined
        ? node.getAttribute(attribute[1]) !== null
        : node.getAttribute(attribute[1]) === attribute[2];
      if (selector.startsWith(".")) return node.classList.contains(selector.slice(1));
      return node.tagName.toLowerCase() === selector.toLowerCase();
    };
    const visit = node => {
      for (const child of node.children) {
        if (match(child)) matches.push(child);
        visit(child);
      }
    };
    visit(this);
    return matches;
  }
}

export class GalleryDocument {
  constructor() {
    this.defaultView = { CustomEvent: class CustomEvent { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } }, navigator: {} };
    this.elementsById = new Map();
    this.createElement = tagName => new GalleryElement(this, tagName);
    this.body = this.createElement("body");
    this.execCommand = () => false;
  }

  getElementById(id) { return this.elementsById.get(id) || null; }

  register(id, element) {
    element.setAttribute("id", id);
    this.elementsById.set(id, element);
    return element;
  }
}

export function createGalleryRoot(documentRef = new GalleryDocument()) {
  const root = documentRef.createElement("main");
  root.ownerDocument = documentRef;
  return { documentRef, root };
}

export function createGalleryRuntime({ failures = new Set() } = {}) {
  const calls = [];
  let nextId = 0;
  return {
    calls,
    async mount(root, specification) {
      calls.push({ type: "mount", root, specification });
      if (failures.has(specification.widget)) throw new Error(`${specification.widget} preview failed`);
      root.setAttribute("data-nc-widget", specification.widget);
      root.setAttribute("data-nc-state", "ready");
      let alive = true;
      const instance = {
        id: `gallery-${++nextId}`,
        destroy() {
          if (!alive) return;
          alive = false;
          calls.push({ type: "destroy", root, id: instance.id });
          root.removeAttribute("data-nc-widget");
          root.removeAttribute("data-nc-state");
        },
      };
      return instance;
    },
  };
}

export function createGalleryContext() {
  const listeners = new Set();
  let state = { observer: { name: "Warsaw", lat: 52.2297, lon: 21.0122, timezone: "Europe/Warsaw" }, time: { mode: "live", datetimeISO: null } };
  return {
    get: () => structuredClone(state),
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    update(patch = {}) { state = { ...state, ...structuredClone(patch) }; for (const listener of listeners) listener(state); return state; },
  };
}
