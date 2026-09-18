import { widgetRegistry as defaultRegistry } from "./widget-catalog.mjs";
import { createWidgetHost, normalizeWidgetConfig } from "./widget-contract.mjs";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeModule(module, type) {
  if (!isObject(module) || typeof module.mount !== "function") {
    throw new TypeError(`Widget loader for ${type} must resolve to { mount() }`);
  }
  return module;
}

function normalizeMountedApi(value, type) {
  if (typeof value === "function") return { destroy: value };
  if (value === undefined || value === null) return {};
  if (!isObject(value)) throw new TypeError(`Widget ${type} mount() must return a disposer or control object`);
  for (const method of ["update", "resize", "refresh", "destroy"]) {
    if (value[method] !== undefined && typeof value[method] !== "function") {
      throw new TypeError(`Widget ${type} control ${method} must be a function`);
    }
  }
  return value;
}

function assertContext(context) {
  if (!isObject(context) || typeof context.get !== "function" || typeof context.subscribe !== "function") {
    throw new TypeError("createNebulacast requires a Platform Context");
  }
}

export function createNebulacast({ context, registry = defaultRegistry, resolveAutoOrientation } = {}) {
  assertContext(context);
  if (!registry || typeof registry.get !== "function" || typeof registry.list !== "function") {
    throw new TypeError("createNebulacast requires a widget registry");
  }

  const instancesByRoot = new Map();
  const pendingRoots = new Set();
  const loadingByType = new Map();
  let nextId = 0;

  function load(definition) {
    if (!loadingByType.has(definition.type)) {
      const loading = Promise.resolve()
        .then(() => definition.loader())
        .then(module => normalizeModule(module, definition.type))
        .catch(error => {
          // A failed lazy load must not poison retries for a later mount.
          if (loadingByType.get(definition.type) === loading) loadingByType.delete(definition.type);
          throw error;
        });
      loadingByType.set(definition.type, loading);
    }
    return loadingByType.get(definition.type);
  }

  async function mount(root, specification = {}) {
    if (!isObject(root)) throw new TypeError("Widget root must be an object");
    if (!isObject(specification)) throw new TypeError("Widget specification must be an object");
    if (Object.prototype.hasOwnProperty.call(specification, "mount")) {
      throw new TypeError("Widget specification cannot provide an arbitrary mount function");
    }
    if (instancesByRoot.has(root) || pendingRoots.has(root)) {
      throw new Error("A widget is already mounted on this root");
    }

    const type = specification.widget;
    const definition = registry.get(type);
    if (!definition) throw new Error(`Unknown widget type: ${type}`);
    pendingRoots.add(root);
    const id = `widget-${++nextId}`;
    let host;
    try {
      const suppliedConfig = specification.config === undefined ? {} : specification.config;
      if (!isObject(suppliedConfig)) normalizeWidgetConfig(suppliedConfig);
      const requestedOrientation = ({ ...definition.defaults, ...suppliedConfig }).orientation ?? "auto";
      let config = normalizeWidgetConfig(
        { ...definition.defaults, ...suppliedConfig },
        { root, resolveAutoOrientation },
      );
      host = createWidgetHost(root, { id, type, config, state: "loading", requestedOrientation });
      const module = await load(definition);
      const mounted = normalizeMountedApi(await module.mount(root, context, config, host), type);
      let destroyed = false;
      // A widget may own an asynchronous loading lifecycle after mount. Keep
      // its state (loading/stale/degraded/error) when it has already changed
      // the host; default to ready only for widgets without one.
      if (host.getState() === "loading" && !host.hasManagedState?.()) host.setState("ready");

      const instance = {
        id,
        type,
        root,
        get config() {
          return config;
        },
        update(...args) {
          if (destroyed) return undefined;
          if (args[0] !== undefined) {
            if (!isObject(args[0])) normalizeWidgetConfig(args[0]);
            const nextConfig = normalizeWidgetConfig(
              { ...config, ...args[0] },
              { root, resolveAutoOrientation },
            );
            if (Object.prototype.hasOwnProperty.call(args[0], "orientation")) {
              host.setRequestedOrientation?.(args[0].orientation);
            }
            config = nextConfig;
            host.setConfig(config);
          }
          return mounted.update?.(...args);
        },
        resize(...args) {
          if (destroyed) return undefined;
          return mounted.resize?.(...args);
        },
        refresh(...args) {
          if (destroyed) return undefined;
          return mounted.refresh?.(...args);
        },
        destroy() {
          if (destroyed) return;
          destroyed = true;
          instancesByRoot.delete(root);
          try {
            return mounted.destroy?.();
          } finally {
            host.destroy();
          }
        },
      };

      instancesByRoot.set(root, instance);
      return Object.freeze(instance);
    } catch (error) {
      try { host?.setState("error"); } catch (_) {}
      throw error;
    } finally {
      pendingRoots.delete(root);
    }
  }

  function unmount(root) {
    const instance = instancesByRoot.get(root);
    if (!instance) return undefined;
    instance.destroy();
    return instance;
  }

  return Object.freeze({
    mount,
    unmount,
    getWidgets() {
      return registry.list();
    },
  });
}
