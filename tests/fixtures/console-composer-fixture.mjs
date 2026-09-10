export class ComposerRoot {
  constructor(id) {
    this.id = id;
    this.attributes = new Map();
    this.classes = new Set();
    this.destroyed = false;
    this.classList = {
      add: value => this.classes.add(value),
      remove: value => this.classes.delete(value),
      contains: value => this.classes.has(value),
    };
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  removeAttribute(name) { this.attributes.delete(name); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
}

export class ComposerDocument {
  constructor(roots = {}) {
    this.roots = new Map(Object.entries(roots));
  }
  querySelector(selector) { return this.roots.get(selector) || null; }
  set(selector, root) { this.roots.set(selector, root); }
  delete(selector) { this.roots.delete(selector); }
}

export function createComposerRuntime({ failures = new Set() } = {}) {
  const calls = [];
  let nextId = 0;
  return {
    calls,
    async mount(root, specification) {
      calls.push({ type: "mount", root, specification });
      if (failures.has(specification.widget)) throw new Error(`${specification.widget} failed`);
      root.setAttribute("data-nc-widget", specification.widget);
      root.setAttribute("data-nc-state", "ready");
      const id = `fixture-${++nextId}`;
      let alive = true;
      return {
        id,
        update() {},
        destroy() {
          if (!alive) return;
          alive = false;
          root.destroyed = true;
          root.removeAttribute("data-nc-widget");
          root.removeAttribute("data-nc-state");
          calls.push({ type: "destroy", root, id });
        },
      };
    },
  };
}

export function slot(id, selector, widget, config = {}) {
  return { id, selector, widget, config };
}
