/**
 * Legacy Location entrypoint.
 *
 * The platform adapter owns the Location controller and lifecycle. This file
 * keeps the historical mountLocation(root, storeApi) API used by /weather/
 * and the vertical compatibility host, translating their store shape into
 * Platform Context instead of maintaining a second implementation.
 */

import { createLocationController } from "./platform-adapter.mjs";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function createLegacyContext(storeApi) {
  if (!isObject(storeApi) || typeof storeApi.getState !== "function" ||
      typeof storeApi.subscribe !== "function" || typeof storeApi.setState !== "function") {
    throw new TypeError("mountLocation requires the legacy store API");
  }

  return {
    get() {
      const state = storeApi.getState() || {};
      const location = state.location || {};
      return {
        ...state,
        observer: {
          name: location.name || "",
          lat: Number(location.lat),
          lon: Number(location.lon),
          timezone: location.tz || location.timezone || "UTC",
          source: state.source || "legacy-store",
        },
      };
    },
    subscribe(listener) {
      return storeApi.subscribe(() => listener());
    },
    update(patch = {}) {
      const next = {};
      if (isObject(patch.observer)) {
        next.location = {
          name: patch.observer.name || "",
          lat: patch.observer.lat,
          lon: patch.observer.lon,
          tz: patch.observer.timezone || patch.observer.tz || "UTC",
        };
        if (patch.observer.source) next.source = patch.observer.source;
      }
      if (isObject(patch.time)) next.time = patch.time;
      return storeApi.setState(next);
    },
  };
}

export function mountLocation(rootEl, storeApi) {
  const controller = createLocationController(rootEl, createLegacyContext(storeApi), {
    window: globalThis.window,
    navigator: globalThis.navigator,
  });
  const mounted = controller.mount();
  const dispose = () => mounted.destroy();
  dispose.elements = rootEl;
  return dispose;
}
