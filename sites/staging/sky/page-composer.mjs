import { createNebulacast } from "../shared/widget-runtime.mjs";
import { createCatalogRegistry } from "../shared/widget-catalog.mjs";
import { buildStandaloneSkyConfig, createStandaloneSkyContext } from "./standalone-config.mjs";

export async function mountSkyPage({ documentRef = globalThis.document, search = globalThis.location?.search || "" } = {}) {
  const root = documentRef?.getElementById?.("skyMount");
  if (!root) throw new Error("Sky page mount element not found: #skyMount");
  const routeConfig = buildStandaloneSkyConfig(search);
  const context = createStandaloneSkyContext(routeConfig);
  const runtime = createNebulacast({ context, registry: createCatalogRegistry() });
  const instance = await runtime.mount(root, {
    widget: "sky",
    config: {
      ...routeConfig,
      orientation: "horizontal",
      options: {
        showSunMoon: true,
        showMilkyWay: true,
        showGridEq: true,
        showConstellations: true,
        showObjects: true,
        showAlerts: true,
      },
    },
  });
  return Object.freeze({ context, runtime, instance, destroy: () => instance.destroy() });
}

export default mountSkyPage;
