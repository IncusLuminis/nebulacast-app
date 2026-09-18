/**
 * Small DOM/context helpers reserved for the astronomy adapter tests.
 * They intentionally do not stand in for the legacy browser dependencies.
 */

function createClassList() {
  const values = new Set();
  return {
    add(...names) { names.forEach(name => values.add(name)); },
    remove(...names) { names.forEach(name => values.delete(name)); },
    contains(name) { return values.has(name); },
  };
}

function createNode() {
  const listeners = new Map();
  return {
    classList: createClassList(),
    dataset: {},
    style: {},
    children: [],
    textContent: "",
    value: "",
    appendChild(child) { this.children.push(child); return child; },
    addEventListener(type, listener) {
      const entries = listeners.get(type) || [];
      entries.push(listener);
      listeners.set(type, entries);
    },
    removeEventListener(type, listener) {
      const entries = listeners.get(type) || [];
      listeners.set(type, entries.filter(entry => entry !== listener));
    },
    dispatchEvent(event) {
      for (const listener of listeners.get(event.type) || []) listener(event);
      return true;
    },
    getContext() { return null; },
  };
}

export function createAstronomyRoot() {
  const nodes = new Map();
  const root = createNode();

  root.querySelector = selector => nodes.get(selector) || null;
  root.querySelectorAll = selector => {
    const node = nodes.get(selector);
    return node ? [node] : [];
  };
  root.setAttribute = (name, value) => {
    root[name] = String(value);
  };
  root.getAttribute = name => root[name] ?? null;
  Object.defineProperty(root, "innerHTML", {
    get() { return root._innerHTML || ""; },
    set(value) {
      root._innerHTML = String(value);
      nodes.clear();
      if (root._innerHTML.includes("widget-location-info")) {
        nodes.set(".widget-location-info", createNode());
        nodes.set(".widget-profile-info", createNode());
      }
      if (root._innerHTML.includes("data-role=\"day-controls\"")) {
        nodes.set("[data-role=day-controls]", createNode());
        nodes.set("[data-role=tooltip]", createNode());
        nodes.set("[data-role=hour-line]", createNode());
        nodes.set("[data-role=summary-sunrise]", createNode());
        nodes.set("[data-role=summary-sunset]", createNode());
        nodes.set("[data-role=summary-daylength]", createNode());
        nodes.set("[data-role=summary-moon]", createNode());
        nodes.set("[data-role=canvas]", createNode());
      }
    },
  });

  return root;
}

export function createAstronomyRuntimeRoot(name) {
  const domRoot = createAstronomyRoot();
  const attributes = new Map();
  return {
    name,
    classList: domRoot.classList,
    querySelector: selector => domRoot.querySelector(selector),
    querySelectorAll: selector => domRoot.querySelectorAll(selector),
    setAttribute(attribute, value) { attributes.set(attribute, String(value)); },
    removeAttribute(attribute) { attributes.delete(attribute); },
    getAttribute(attribute) { return attributes.get(attribute) ?? null; },
    get innerHTML() { return domRoot.innerHTML; },
    set innerHTML(value) { domRoot.innerHTML = value; },
  };
}

export function createPlatformContext(initial = {}) {
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

  return {
    get() { return structuredClone(snapshot); },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    update(patch = {}) {
      snapshot = {
        ...snapshot,
        ...patch,
        observer: patch.observer ? { ...snapshot.observer, ...patch.observer } : snapshot.observer,
        time: patch.time ? { ...snapshot.time, ...patch.time } : snapshot.time,
      };
      const next = structuredClone(snapshot);
      for (const listener of listeners) listener(next);
      return next;
    },
  };
}

export function createTrackedContext(ledger, initial = {}) {
  const context = createPlatformContext(initial);
  return {
    get: context.get,
    subscribe(listener) {
      const release = ledger.acquire("subscriptions");
      const unsubscribe = context.subscribe(listener);
      let active = true;
      return () => {
        if (!active) return;
        active = false;
        release();
        unsubscribe();
      };
    },
    update: context.update,
  };
}

export function createEventTarget() {
  return createNode();
}

export function installSunMoonEnvironment(ledger, events) {
  const names = ["window", "document", "CustomEvent", "ResizeObserver", "setInterval", "clearInterval"];
  const descriptors = new Map(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const date = value => new Date(`2026-09-${String(value).padStart(2, "0")}T06:00:00Z`);
  const times = {
    sunrise: date(9),
    sunset: date(9),
    solarNoon: date(9),
    dawn: date(9),
    dusk: date(9),
    nauticalDawn: date(9),
    nauticalDusk: date(9),
    night: date(9),
    nightEnd: date(9),
  };

  globalThis.window = {
    devicePixelRatio: 1,
    SunCalc: {
      getPosition: () => ({ altitude: 0.1, azimuth: 0.2 }),
      getMoonPosition: () => ({ altitude: 0.2, azimuth: 0.3 }),
      getTimes: () => ({ ...times }),
      getMoonTimes: () => ({}),
    },
    dispatchEvent(event) {
      events.push(event);
      return true;
    },
  };
  globalThis.document = { createElement: () => createEventTarget() };
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
    }
  };
  globalThis.setInterval = () => {
    const release = ledger.acquire("timers");
    return { release };
  };
  globalThis.clearInterval = handle => handle?.release?.();
  globalThis.ResizeObserver = class ResizeObserver {
    constructor() { this.release = ledger.acquire("observers"); }
    observe() {}
    disconnect() {
      this.release?.();
      this.release = null;
    }
  };

  return () => {
    for (const [name, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  };
}

export function createResourceLedger() {
  const active = { timers: 0, observers: 0, subscriptions: 0 };
  return {
    acquire(kind) {
      active[kind] += 1;
      let released = false;
      return () => {
        if (!released) {
          released = true;
          active[kind] -= 1;
        }
      };
    },
    snapshot() { return { ...active }; },
  };
}
