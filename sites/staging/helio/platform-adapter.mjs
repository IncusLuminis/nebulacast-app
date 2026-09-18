/**
 * Platform adapter for the authoritative Helio widget.
 *
 * The ESM bundle is built from helio/src/helio.widget.ts. The legacy IIFE
 * remains available for /helio/ and existing window.HelioWidget consumers;
 * this adapter never reads that global.
 */

import { HelioWidget } from "./dist/helio.widget.mjs";

const DATA_URL = "/data/helio_now.json";
const REFRESH_MS = 10 * 60 * 1000;

function observerFrom(context) {
  const observer = context?.get?.()?.observer || {};
  return {
    lat: Number.isFinite(observer.lat) ? observer.lat : undefined,
    lon: Number.isFinite(observer.lon) ? observer.lon : undefined,
    locationName: typeof observer.name === "string" ? observer.name : undefined,
  };
}

function requireContext(context) {
  if (!context || typeof context.get !== "function" || typeof context.subscribe !== "function") {
    throw new TypeError("Space Weather platform adapter requires Platform Context");
  }
}

export function mount(root, context, config = {}, host) {
  requireContext(context);
  if (!root || typeof root.appendChild !== "function") {
    throw new TypeError("Space Weather platform adapter requires a root element");
  }

  const observer = observerFrom(context);
  const instance = HelioWidget.mount(root, {
    ...observer,
    dataUrl: DATA_URL,
    refreshMs: REFRESH_MS,
  });
  let disposed = false;
  const unsubscribe = context.subscribe(next => {
    if (disposed || typeof instance.updateLocation !== "function") return;
    const nextObserver = next?.observer || {};
    instance.updateLocation(
      Number.isFinite(nextObserver.lat) ? nextObserver.lat : undefined,
      Number.isFinite(nextObserver.lon) ? nextObserver.lon : undefined,
      typeof nextObserver.name === "string" ? nextObserver.name : undefined,
    );
  });

  return {
    update() {
      return undefined;
    },
    destroy() {
      if (disposed) return;
      disposed = true;
      unsubscribe?.();
      instance.destroy?.();
    },
  };
}

export default { mount };
