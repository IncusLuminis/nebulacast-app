/**
 * Small Platform Context adapter for the existing weather store.
 *
 * This module deliberately has no page-integration dependency.
 * The raw store remains available as context.storeApi for compatibility.
 */

const THEMES = new Set(["auto", "dark", "light"]);

function deepFreeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

function cloneContext(state, options) {
  const location = state?.location || {};
  const time = state?.time || {};
  return deepFreeze({
    observer: {
      name: location.name ?? null,
      lat: location.lat ?? null,
      lon: location.lon ?? null,
      timezone: location.tz ?? null,
      source: state?.source ?? null,
    },
    time: {
      mode: time.mode ?? "live",
      datetimeISO: time.datetimeISO ?? null,
    },
    locale: options.locale,
    theme: options.theme,
  });
}

function sameContext(a, b) {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertStoreApi(storeApi) {
  if (!isObject(storeApi) || typeof storeApi.getState !== "function" || typeof storeApi.subscribe !== "function") {
    throw new TypeError("createPlatformContext requires a storeApi with getState() and subscribe()");
  }
}

function createOptions(options = {}) {
  const locale = options.locale ?? "en";
  const theme = options.theme ?? "auto";
  if (typeof locale !== "string") throw new TypeError("Platform Context locale must be a string");
  if (!THEMES.has(theme)) throw new TypeError("Platform Context theme must be auto, dark, or light");
  return { locale, theme };
}

function storePatchFromContextPatch(patch) {
  if (!isObject(patch)) return null;
  const storePatch = {};
  let hasStorePatch = false;

  if (isObject(patch.observer)) {
    const observer = patch.observer;
    const location = {};
    for (const key of ["name", "lat", "lon"]) {
      if (Object.prototype.hasOwnProperty.call(observer, key)) location[key] = observer[key];
    }
    if (Object.prototype.hasOwnProperty.call(observer, "timezone")) {
      location.tz = observer.timezone;
    }
    if (Object.keys(location).length) {
      storePatch.location = location;
      hasStorePatch = true;
    }
    if (Object.prototype.hasOwnProperty.call(observer, "source")) {
      storePatch.source = observer.source;
      hasStorePatch = true;
    }
  }

  if (isObject(patch.time)) {
    const time = {};
    for (const key of ["mode", "datetimeISO"]) {
      if (Object.prototype.hasOwnProperty.call(patch.time, key)) time[key] = patch.time[key];
    }
    if (Object.keys(time).length) {
      storePatch.time = time;
      hasStorePatch = true;
    }
  }

  return hasStorePatch ? storePatch : null;
}

/**
 * Adapt the current weather store to the initial Platform Context contract.
 * @param {{getState: Function, subscribe: Function, setState?: Function}} storeApi
 * @param {{locale?: string, theme?: "auto"|"dark"|"light"}} options
 */
export function createPlatformContext(storeApi, options = {}) {
  assertStoreApi(storeApi);
  const contextOptions = createOptions(options);
  const listeners = new Set();
  let current = cloneContext(storeApi.getState(), contextOptions);

  const publish = state => {
    const next = cloneContext(state, contextOptions);
    if (sameContext(current, next)) return current;
    current = next;
    for (const listener of [...listeners]) listener(current);
    return current;
  };

  const rawUnsubscribe = storeApi.subscribe(state => publish(state));

  const context = {
    // Compatibility escape hatch: existing widgets can continue using the raw store.
    storeApi,

    get() {
      return current;
    },

    getObserver() {
      return current.observer;
    },

    subscribe(listener) {
      if (typeof listener !== "function") throw new TypeError("Platform Context listener must be a function");
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    update(patch = {}) {
      if (!isObject(patch)) return current;

      if (Object.prototype.hasOwnProperty.call(patch, "locale") && typeof patch.locale === "string") {
        contextOptions.locale = patch.locale;
      }
      if (Object.prototype.hasOwnProperty.call(patch, "theme") && THEMES.has(patch.theme)) {
        contextOptions.theme = patch.theme;
      }

      const storePatch = storePatchFromContextPatch(patch);
      if (storePatch) {
        if (typeof storeApi.setState !== "function") {
          throw new TypeError("Platform Context update requires storeApi.setState()");
        }
        storeApi.setState(storePatch);
        return publish(storeApi.getState());
      }

      return publish(storeApi.getState());
    },

    destroy() {
      listeners.clear();
      rawUnsubscribe?.();
    },
  };

  return context;
}
