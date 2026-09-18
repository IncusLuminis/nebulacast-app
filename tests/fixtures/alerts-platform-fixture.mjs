export class FakeElement {
  constructor(documentRef, tagName = "div") {
    this.ownerDocument = documentRef;
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentElement = null;
    this.attributes = new Map();
    this.listeners = new Map();
    this.style = {};
    this.clientWidth = 640;
    this.textContent = "";
    this.innerText = "";
    this.value = "";
    this.classList = {
      values: new Set(),
      add: (...values) => values.forEach(value => this.classList.values.add(value)),
      remove: (...values) => values.forEach(value => this.classList.values.delete(value)),
      toggle: (value, force) => {
        const next = force === undefined ? !this.classList.values.has(value) : force;
        if (next) this.classList.values.add(value); else this.classList.values.delete(value);
        return next;
      },
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
  click() { this.dispatchEvent({ type: "click", target: this }); }

  set innerHTML(value) {
    this._innerHTML = String(value);
    this.children = [];
    if (this._innerHTML.includes("nc-alerts-root")) {
      const widget = new FakeElement(this.ownerDocument);
      widget.className = "nc-alerts-root";
      const toggle = new FakeElement(this.ownerDocument);
      toggle.setAttribute("data-role", "toggle");
      const chevron = new FakeElement(this.ownerDocument);
      chevron.className = "nc-alerts-chevron";
      toggle.appendChild(chevron);
      const body = new FakeElement(this.ownerDocument);
      body.setAttribute("data-role", "body");
      const status = new FakeElement(this.ownerDocument);
      status.setAttribute("data-role", "status");
      const list = new FakeElement(this.ownerDocument);
      list.setAttribute("data-role", "list");
      const count = new FakeElement(this.ownerDocument);
      count.setAttribute("data-role", "count");
      body.appendChild(status);
      body.appendChild(list);
      widget.appendChild(toggle);
      widget.appendChild(body);
      widget.appendChild(count);
      this.appendChild(widget);
    } else if (this.getAttribute("data-role") === "list") {
      const itemCount = [...this._innerHTML.matchAll(/class="nc-alert-item /g)].length;
      for (let index = 0; index < itemCount; index += 1) {
        const item = new FakeElement(this.ownerDocument);
        item.className = "nc-alert-item";
        this.appendChild(item);
      }
    }
  }
  get innerHTML() { return this._innerHTML ?? this.textContent; }

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
}

function matchesSelector(node, selector) {
  const role = selector.match(/^\[data-role="([^"]+)"\]$/);
  if (role) return node.getAttribute("data-role") === role[1];
  if (selector.startsWith(".")) return node.classList.contains(selector.slice(1));
  return node.tagName.toLowerCase() === selector.toLowerCase();
}

export class FakeDocument {
  constructor() {
    this.defaultView = { location: { origin: "https://example.test" } };
    this.createElement = tagName => new FakeElement(this, tagName);
  }
}

export function makeRoot(documentRef, name) {
  const root = new FakeElement(documentRef, "section");
  root.id = name;
  return root;
}

export function makeContext() {
  let subscriptions = 0;
  const state = { observer: { name: "Warsaw", lat: 52, lon: 21 }, time: { mode: "live" } };
  return {
    get: () => structuredClone(state),
    subscribe() { subscriptions += 1; return () => {}; },
    get subscriptions() { return subscriptions; },
  };
}

export function makeFetch(routes) {
  const calls = [];
  const fetch = (url, options = {}) => {
    calls.push({ url: String(url), options });
    let route = routes[String(url)];
    if (Array.isArray(route)) route = route.length ? route.shift() : undefined;
    if (typeof route === "function") return Promise.resolve().then(() => route(url, options));
    if (route instanceof Error) return Promise.reject(route);
    if (route === undefined) return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    return Promise.resolve({ ok: true, status: 200, json: async () => route });
  };
  fetch.calls = calls;
  return fetch;
}

export const alertData = Object.freeze({
  items: Object.freeze([
    Object.freeze({ id: "risk-1", group: "risk", title: "Risk title", note: "Risk note", updated_utc: "2026-09-10T10:00:00Z", meta: Object.freeze({ ip: 0.000377, ps: -0.93 }) }),
    Object.freeze({ id: "neo-1", group: "neo", title: "NEO title", note: "Close approach", updated_utc: "2026-09-10T09:00:00Z", meta: Object.freeze({ dist_ld: 2.5 }) }),
    Object.freeze({ id: "transient-1", group: "transient", title: "Transient title", note: "Transient note", mag: 18.2, updated_utc: "2026-09-10T08:00:00Z" }),
  ]),
});
