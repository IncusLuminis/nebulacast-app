import { createNebulacast } from "../shared/widget-runtime.mjs";
import { createCatalogRegistry } from "../shared/widget-catalog.mjs";

const DEFAULT_OBSERVER = Object.freeze({
  name: "Warsaw",
  lat: 52.2297,
  lon: 21.0122,
  timezone: "Europe/Warsaw",
  source: "hero-standalone",
});

function orientationFromSearch(search = "") {
  const requested = new URLSearchParams(search).get("orientation");
  return requested === "vertical" ? "vertical" : "horizontal";
}

function createHeroContext() {
  const snapshot = {
    observer: { ...DEFAULT_OBSERVER },
    time: { mode: "live", datetimeISO: null },
  };
  return Object.freeze({
    get: () => structuredClone(snapshot),
    getObserver: () => structuredClone(snapshot.observer),
    subscribe: () => () => {},
    update: () => structuredClone(snapshot),
  });
}

export async function mountHeroPage({ documentRef = globalThis.document, search = globalThis.location?.search || "" } = {}) {
  const root = documentRef?.getElementById?.("heroRoot");
  if (!root) throw new Error("Hero page mount element not found: #heroRoot");
  const context = createHeroContext();
  const runtime = createNebulacast({ context, registry: createCatalogRegistry() });
  const instance = await runtime.mount(root, {
    widget: "hero",
    config: { orientation: orientationFromSearch(search) },
  });
  return Object.freeze({ context, runtime, instance, destroy: () => instance.destroy() });
}

export { orientationFromSearch };
export default mountHeroPage;
