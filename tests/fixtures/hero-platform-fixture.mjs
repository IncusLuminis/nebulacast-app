export class FakeEventTarget {
  constructor(documentRef, tagName = "div") {
    this.ownerDocument = documentRef;
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentElement = null;
    this.listeners = new Map();
    this.attributes = new Map();
    this.style = {};
    this.dataset = {};
    this.clientWidth = 640;
    this.textContent = "";
    this.classList = {
      values: new Set(),
      add: (...values) => values.forEach(value => this.classList.values.add(value)),
      remove: (...values) => values.forEach(value => this.classList.values.delete(value)),
      contains: value => this.classList.values.has(value),
      toggle: (value, force) => {
        const next = force === undefined ? !this.classList.values.has(value) : Boolean(force);
        if (next) this.classList.values.add(value); else this.classList.values.delete(value);
        return next;
      },
    };
  }
  set id(value) { this.setAttribute("id", value); }
  get id() { return this.getAttribute("id") || ""; }
  set className(value) { this.classList.values = new Set(String(value).split(/\s+/).filter(Boolean)); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); if (name === "data-panel") this.dataset.panel = String(value); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }
  appendChild(child) { child.parentElement = this; this.children.push(child); return child; }
  removeChild(child) { this.children = this.children.filter(item => item !== child); child.parentElement = null; return child; }
  addEventListener(type, listener) { const listeners = this.listeners.get(type) || new Set(); listeners.add(listener); this.listeners.set(type, listeners); }
  removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); }
  dispatchEvent(event) { for (const listener of [...(this.listeners.get(event.type) || [])]) listener(event); return true; }
  click() { this.dispatchEvent({ type: "click", target: this }); }
  closest(selector) {
    let node = this;
    while (node) { if (matchesSelector(node, selector)) return node; node = node.parentElement; }
    return null;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  querySelectorAll(selector) {
    const matches = [];
    const visit = node => { for (const child of node.children) { if (matchesSelector(child, selector)) matches.push(child); visit(child); } };
    visit(this);
    return matches;
  }
  getBoundingClientRect() { return { left: 10, bottom: 30, width: 40, top: 10 }; }
  get innerHTML() { return this._innerHTML || ""; }
  set innerHTML(value) {
    this._innerHTML = String(value);
    this.children = [];
    if (this._innerHTML.includes("hero-skeleton")) {
      const status = new FakeEventTarget(this.ownerDocument); status.className = "hero-skeleton"; status.setAttribute("data-role", "status"); status.textContent = this._innerHTML.replace(/<[^>]+>/g, ""); this.appendChild(status); return;
    }
    for (const match of this._innerHTML.matchAll(/<div class="hero-card" data-panel="([^"]+)"/g)) {
      const card = new FakeEventTarget(this.ownerDocument); card.className = "hero-card"; card.setAttribute("data-panel", match[1]); this.appendChild(card);
    }
    for (const match of this._innerHTML.matchAll(/data-role="(clock-date|clock-time)"/g)) { const element = new FakeEventTarget(this.ownerDocument); element.setAttribute("data-role", match[1]); this.children[0]?.appendChild(element); }
    if (this._innerHTML.includes("nqi-info-btn")) { const button = new FakeEventTarget(this.ownerDocument, "button"); button.id = "nqi-info-btn"; this.children[1]?.appendChild(button); }
    for (const match of this._innerHTML.matchAll(/class="nop-profile-btn[^>]*data-profile="([^"]+)"/g)) { const button = new FakeEventTarget(this.ownerDocument, "button"); button.className = "nop-profile-btn"; button.dataset.profile = match[1]; this.children[1]?.appendChild(button); }
    if (this._innerHTML.includes("nop-moon-canvas")) { const canvas = new FakeCanvas(this.ownerDocument); canvas.id = "nop-moon-canvas"; this.children[3]?.appendChild(canvas); }
  }
}

class FakeCanvas extends FakeEventTarget {
  constructor(documentRef) { super(documentRef, "canvas"); this.width = 72; this.height = 72; this.complete = true; this.naturalWidth = 1; }
  getContext() { return { clearRect() {}, save() {}, restore() {}, beginPath() {}, arc() {}, clip() {}, drawImage() {}, ellipse() {}, moveTo() {}, closePath() {}, fill() {} }; }
}

function matchesSelector(node, selector) {
  const role = selector.match(/^\[data-role=(?:"([^"]+)"|'([^']+)'|([^\]]+))\]$/); if (role) return node.getAttribute("data-role") === (role[1] || role[2] || role[3]);
  const id = selector.match(/^#(.+)$/); if (id) return node.id === id[1];
  if (selector === ".hero-card[data-panel]") return node.classList.contains("hero-card") && Boolean(node.dataset.panel);
  const panel = selector.match(/^\.hero-card\[data-panel=(?:"([^"]+)"|'([^']+)')\]$/); if (panel) return node.classList.contains("hero-card") && node.dataset.panel === (panel[1] || panel[2]);
  if (selector.startsWith(".")) return node.classList.contains(selector.slice(1));
  return node.tagName.toLowerCase() === selector.toLowerCase();
}

export class FakeDocument {
  constructor() {
    const documentRef = this;
    this.defaultView = {
      CustomEvent: class CustomEvent { constructor(type, init = {}) { this.type = type; this.detail = init.detail; this.bubbles = init.bubbles; } },
      Image: class Image { constructor() { this.complete = true; this.naturalWidth = 1; } },
      requestAnimationFrame(callback) { callback(); return 1; },
      getComputedStyle() { return { fontSize: "20px" }; },
    };
    this.createElement = tagName => tagName === "canvas" ? new FakeCanvas(documentRef) : new FakeEventTarget(documentRef, tagName);
  }
}

export function makeRoot(documentRef, id) { const root = new FakeEventTarget(documentRef, "section"); root.id = id; return root; }

export function makeContext(initial = {}) {
  let state = { observer: { name: "Warsaw", lat: 52, lon: 21, timezone: "Europe/Warsaw" }, time: { mode: "live", datetimeISO: null }, ...initial };
  const listeners = new Set();
  return {
    get: () => structuredClone(state),
    getObserver: () => structuredClone(state.observer),
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    update(patch) { state = { ...state, ...structuredClone(patch), observer: { ...state.observer, ...structuredClone(patch.observer || {}) }, time: { ...state.time, ...structuredClone(patch.time || {}) } }; for (const listener of [...listeners]) listener(structuredClone(state)); },
    get subscriptionCount() { return listeners.size; },
  };
}

export function makeFetch(routes) {
  const calls = [];
  const fetch = (url, options = {}) => {
    calls.push({ url: String(url), options });
    const route = Object.entries(routes).find(([prefix]) => String(url).startsWith(prefix))?.[1];
    if (typeof route === "function") return Promise.resolve().then(() => route(url, options));
    if (route instanceof Error) return Promise.reject(route);
    if (route === undefined) return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    return Promise.resolve({ ok: true, status: 200, json: async () => route });
  };
  fetch.calls = calls;
  return fetch;
}

export const heroData = Object.freeze({
  wx: { hourly: [{ timestamp_utc: "2999-01-01T20:00:00Z", night: true, cloud: { total_percent: 20 }, air: { temperature_c: 8, dewpoint_c: 3, pressure_hpa: 1012 }, wind: { speed_mps: 2 } }], decision: { best_tonight: { start: "2999-01-01T20:00:00Z", end: "2999-01-01T22:00:00Z" }, mode_scores: { balanced: 80 }, pressure: { trend_label: "steady" } }, night_summary: { nqi: { balanced: { value: 8.1, class: "good" } }, avg_score: { balanced: 80 } }, moon: { moon_up_now: true } },
  sw: { metrics: { kp_latest: 3.2 }, scales: { r_scale: "R0", s_scale: "S0" }, summary: { status: "quiet", label: "Quiet" }, forecast: { kp_max_next_24h: 4.1, trend: "rising" } },
  sunMoon: { schema: "sun_moon.v2", frames: [] },
});
