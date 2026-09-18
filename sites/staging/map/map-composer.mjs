import { createNebulacast } from "../shared/widget-runtime.mjs";
import { createCatalogRegistry } from "../shared/widget-catalog.mjs";

function bounded(value, min, max, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

function createMapRouteContext(search = "") {
  const params = new URLSearchParams(search);
  let snapshot = {
    observer: {
      name: params.get("name") || "Warsaw",
      lat: bounded(params.get("lat"), -90, 90, 52.2297),
      lon: bounded(params.get("lon"), -180, 180, 21.0122),
      timezone: params.get("tz") || "Europe/Warsaw",
      source: "url",
    },
    time: { mode: "live", datetimeISO: null },
  };
  const listeners = new Set();
  return {
    get() { return structuredClone(snapshot); },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    update(patch = {}) {
      snapshot = { ...snapshot, ...patch, observer: patch.observer ? { ...snapshot.observer, ...patch.observer } : snapshot.observer };
      for (const listener of [...listeners]) listener(structuredClone(snapshot));
      return structuredClone(snapshot);
    },
  };
}

export async function mountMapPage({ documentRef = globalThis.document, search = globalThis.location?.search || "" } = {}) {
  const root = documentRef?.getElementById?.("mapRoot");
  if (!root) throw new Error("Map page mount element not found: #mapRoot");
  const context = createMapRouteContext(search);
  const runtime = createNebulacast({ context, registry: createCatalogRegistry() });
  const observer = context.get().observer;
  const mapParams = new URLSearchParams({
    name: observer.name,
    lat: String(observer.lat),
    lon: String(observer.lon),
    tz: observer.timezone,
  });
  const instance = await runtime.mount(root, {
    widget: "map",
    config: { orientation: "horizontal", mapUrl: `/weather/map-poc.html?${mapParams.toString()}` },
  });
  return Object.freeze({ context, runtime, instance, destroy: () => instance.destroy() });
}

export default mountMapPage;
