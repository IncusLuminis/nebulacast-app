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

export function createEventTarget() {
  return createNode();
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
