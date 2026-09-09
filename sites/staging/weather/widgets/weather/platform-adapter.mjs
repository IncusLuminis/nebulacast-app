/**
 * Platform adapter for the legacy Weather widget.
 *
 * This is intentionally a thin bridge for Story #74 atomic step 1. The
 * legacy module remains responsible for rendering and its existing browser
 * behavior. This adapter only translates Platform Context into the legacy
 * store shape and translates the legacy disposer into Runtime.destroy().
 *
 * The platform import is kept separate from the legacy module import. Weather
 * uses the import-time flag to omit its legacy document/window compatibility
 * handlers; the instance mount installs only root-scoped handlers instead.
 */

function isObject(value) {
  return value !== null && typeof value === "object";
}

function requireContext(context) {
  if (!isObject(context) || typeof context.get !== "function" ||
      typeof context.subscribe !== "function" || typeof context.update !== "function") {
    throw new TypeError("Weather platform adapter requires Platform Context");
  }
}

function createLegacyStoreFacade(context, configRef = {}) {
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
      locale: snapshot.locale || "en",
      theme: snapshot.theme || "inherit",
      // These are explicit Weather config values, never shared Platform state.
      profile: configRef.profile || "balanced",
      range: configRef.range || "7d",
      source: observer.source || "platform-context",
    };
  }

  return {
    getState: readState,
    subscribe(listener) {
      if (typeof listener !== "function") {
        throw new TypeError("Weather legacy subscriber must be a function");
      }
      return context.subscribe(() => {
        if (!disposed) listener(readState());
      });
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

const PLATFORM_IMPORT_FLAG = "__NC_WEATHER_PLATFORM_IMPORT__";
let weatherModulePromise;

function loadPlatformWeatherModule() {
  if (!weatherModulePromise) {
    const hadPreviousFlag = Object.prototype.hasOwnProperty.call(globalThis, PLATFORM_IMPORT_FLAG);
    const previousFlag = globalThis[PLATFORM_IMPORT_FLAG];
    globalThis[PLATFORM_IMPORT_FLAG] = true;
    weatherModulePromise = import("./weather.js?platform")
      .finally(() => {
        if (hadPreviousFlag) globalThis[PLATFORM_IMPORT_FLAG] = previousFlag;
        else delete globalThis[PLATFORM_IMPORT_FLAG];
      });
  }
  return weatherModulePromise;
}

/**
 * Mount Weather through Platform Context.
 *
 * @param {Element} root
 * @param {{get: Function, subscribe: Function, update: Function}} context
 * @param {object} config
 * @param {object} host
 */
export async function mount(root, context, config = {}, host) {
  requireContext(context);

  const module = await loadPlatformWeatherModule();
  if (typeof module.mountWeather !== "function") {
    throw new TypeError("Weather legacy module does not export mountWeather");
  }

  const configRef = { ...config };
  const facade = createLegacyStoreFacade(context, configRef);
  const explicitConfig = Object.freeze({
    ...configRef,
    // Legacy Weather understands layout; Runtime owns the requested
    // orientation and has already resolved auto when a resolver is supplied.
    layout: config.orientation === "vertical" ? "vertical" : "default",
  });

  let mounted;
  try {
    mounted = normalizeLegacyMount(await module.mountWeather(root, facade, explicitConfig, host));
  } catch (error) {
    facade.dispose();
    throw error;
  }

  let destroyed = false;
  return {
    update(patch) {
      if (destroyed) return undefined;
      if (patch && typeof patch === "object") Object.assign(configRef, patch);
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
