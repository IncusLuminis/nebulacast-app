import { createNebulacast } from "../shared/widget-runtime.mjs";
import { createCatalogRegistry } from "../shared/widget-catalog.mjs";

function createRouteContext(search = "") {
  const params = new URLSearchParams(search);
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  const snapshot = {
    observer: {
      name: params.get("name") || "Warsaw",
      lat: Number.isFinite(lat) && lat >= -90 && lat <= 90 ? lat : 52.2297,
      lon: Number.isFinite(lon) && lon >= -180 && lon <= 180 ? lon : 21.0122,
      timezone: params.get("tz") || "Europe/Warsaw",
      source: "url",
    },
    time: { mode: "live", datetimeISO: null },
  };
  return {
    get() { return structuredClone(snapshot); },
    subscribe() { return () => {}; },
    update() { return structuredClone(snapshot); },
  };
}

export async function mountHelioPage({ documentRef = globalThis.document, search = globalThis.location?.search || "" } = {}) {
  const root = documentRef?.getElementById?.("w-helio");
  if (!root) throw new Error("Space Weather page mount element not found: #w-helio");
  const context = createRouteContext(search);
  const runtime = createNebulacast({ context, registry: createCatalogRegistry() });
  const instance = await runtime.mount(root, { widget: "space-weather", config: { orientation: "horizontal" } });
  return Object.freeze({ context, runtime, instance, destroy: () => instance.destroy() });
}

export default mountHelioPage;
