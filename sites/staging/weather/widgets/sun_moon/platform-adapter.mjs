/**
 * Platform adapter for the legacy Sun/Moon widget.
 *
 * Rendering, SunCalc integration, custom events, and lifecycle behavior stay
 * in the legacy module. The adapter supplies its instance-local store facade.
 */

function createLegacyStoreFacade(context, config = {}) {
  const readState = () => {
    const snapshot = context.get();
    const observer = snapshot?.observer || {};

    return {
      location: {
        name: observer.name || "",
        lat: Number.isFinite(observer.lat) ? observer.lat : 0,
        lon: Number.isFinite(observer.lon) ? observer.lon : 0,
        tz: observer.timezone || "UTC",
      },
      time: snapshot?.time || { mode: "live", datetimeISO: null },
      // Profile is an explicit widget configuration value, not platform state.
      profile: config.profile || "default",
      range: config.range || "today",
      source: observer.source || "state",
    };
  };

  return {
    getState: readState,
    subscribe(listener) {
      return context.subscribe(() => listener(readState()));
    },
    setState(patch = {}) {
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
  };
}

function normalizeLegacyMount(mounted) {
  if (typeof mounted === "function") return { destroy: mounted };
  if (!mounted || typeof mounted !== "object") return {};
  return mounted;
}

/**
 * Mount the legacy Sun/Moon export through Platform Context.
 *
 * @param {Element} root
 * @param {{get: Function, subscribe: Function, update: Function}} context
 * @param {object} config
 * @param {object} host
 */
export async function mount(root, context, config = {}, host) {
  if (!context || typeof context.get !== "function" ||
      typeof context.subscribe !== "function" || typeof context.update !== "function") {
    throw new TypeError("Sun/Moon platform adapter requires Platform Context");
  }

  const module = await import("./sun_moon.js");
  if (typeof module.mountSunMoon !== "function") {
    throw new TypeError("Sun/Moon legacy module does not export mountSunMoon");
  }

  const facade = createLegacyStoreFacade(context, config);
  const mounted = normalizeLegacyMount(await module.mountSunMoon(root, facade, config, host));
  let destroyed = false;

  return {
    update(patch) {
      if (!destroyed) return mounted.update?.(patch);
      return undefined;
    },
    resize(size) {
      if (!destroyed) return mounted.resize?.(size);
      return undefined;
    },
    refresh() {
      if (!destroyed) return mounted.refresh?.();
      return undefined;
    },
    destroy() {
      if (destroyed) return undefined;
      destroyed = true;
      return mounted.destroy?.();
    },
  };
}
