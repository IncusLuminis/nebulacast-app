export function createFakeContext(initial = {}) {
  let snapshot = structuredClone(initial);
  const listeners = new Set();
  return {
    get: () => structuredClone(snapshot),
    getObserver: () => structuredClone(snapshot.observer || {}),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    update(patch) {
      snapshot = { ...snapshot, ...structuredClone(patch) };
      const next = structuredClone(snapshot);
      for (const listener of [...listeners]) listener(next);
      return next;
    },
  };
}

export function createFakeRoot(name) {
  const attributes = new Map();
  const classes = new Set();
  return Object.freeze({
    name,
    classList: {
      add: value => classes.add(value),
      remove: value => classes.delete(value),
      contains: value => classes.has(value),
    },
    setAttribute: (key, value) => attributes.set(key, String(value)),
    removeAttribute: key => attributes.delete(key),
    getAttribute: key => attributes.get(key) ?? null,
  });
}

export function createFakeDefinition({ type = "fake", defaults = {}, loader, ...extra }) {
  return {
    type,
    version: 1,
    defaults,
    capabilities: { observerAware: false, timeAware: false, multiInstance: true },
    loader,
    ...extra,
  };
}
