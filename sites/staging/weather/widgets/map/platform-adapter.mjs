/**
 * Platform adapter for the legacy Map widget.
 *
 * The legacy module keeps its iframe and lifecycle flags in module scope. A
 * unique query on each import gives every platform instance its own module
 * namespace without changing the legacy source or the authoritative iframe
 * route that it loads.
 */

function isObject(value) {
  return value !== null && typeof value === "object";
}

function requireContext(context) {
  if (!isObject(context) || typeof context.get !== "function" ||
      typeof context.subscribe !== "function") {
    throw new TypeError("Map platform adapter requires Platform Context");
  }
}

function createLegacyStoreFacade(context, config = {}) {
  let disposed = false;

  function readState() {
    const snapshot = context.get() || {};
    const observer = snapshot.observer || {};

    return {
      location: {
        name: observer.name || "",
        lat: Number.isFinite(observer.lat) ? observer.lat : 0,
        lon: Number.isFinite(observer.lon) ? observer.lon : 0,
        tz: observer.timezone || observer.tz || "UTC",
      },
      time: snapshot.time || { mode: "live", datetimeISO: null },
      // These values preserve the legacy store shape; map-specific config is
      // still instance-local and never written back to Platform Context.
      profile: config.profile || "default",
      range: config.range || "today",
      source: observer.source || snapshot.source || "platform-context",
    };
  }

  return {
    getState: readState,
    subscribe(listener) {
      if (typeof listener !== "function") {
        throw new TypeError("Map legacy subscriber must be a function");
      }
      return context.subscribe(() => {
        if (!disposed) listener(readState());
      });
    },
    setState(patch = {}) {
      if (typeof context.update !== "function") {
        throw new TypeError("Map legacy store update requires Platform Context.update()");
      }

      const next = {};
      if (patch.location) {
        next.observer = {
          name: patch.location.name,
          lat: patch.location.lat,
          lon: patch.location.lon,
          timezone: patch.location.tz,
          source: patch.source,
        };
      }
      if (patch.time) next.time = patch.time;
      return context.update(next);
    },
    dispose() {
      disposed = true;
    },
  };
}

function normalizeLegacyMount(mounted) {
  if (typeof mounted === "function") return { destroy: mounted };
  if (!mounted || typeof mounted !== "object") return {};
  if (typeof mounted.destroy === "function") return mounted;
  if (typeof mounted.unmount === "function") {
    return { ...mounted, destroy: mounted.unmount.bind(mounted) };
  }
  return mounted;
}

let nextLegacyModuleInstance = 0;

function loadLegacyMapModule() {
  const instance = ++nextLegacyModuleInstance;
  return import(`./map.js?platform-instance=${instance}`);
}

/**
 * Mount the legacy Map export through Platform Context.
 *
 * @param {Element} root
 * @param {{get: Function, subscribe: Function, update?: Function}} context
 * @param {object} config
 * @param {object} host
 */
export async function mount(root, context, config = {}, host) {
  requireContext(context);

  const module = await loadLegacyMapModule();
  if (typeof module.mountMap !== "function") {
    throw new TypeError("Map legacy module does not export mountMap");
  }

  const facade = createLegacyStoreFacade(context, config);
  let mounted;
  try {
    mounted = normalizeLegacyMount(await module.mountMap(root, facade, config, host));
  } catch (error) {
    facade.dispose();
    throw error;
  }

  let destroyed = false;
  return {
    update(patch) {
      if (destroyed) return undefined;
      return mounted.update?.(patch);
    },
    resize(size) {
      if (destroyed) return undefined;
      return mounted.resize?.(size);
    },
    refresh() {
      if (destroyed) return undefined;
      return mounted.refresh?.();
    },
    destroy() {
      if (destroyed) return undefined;
      destroyed = true;
      facade.dispose();
      return mounted.destroy?.();
    },
  };
}
