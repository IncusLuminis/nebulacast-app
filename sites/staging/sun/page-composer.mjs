import { createPlatformContext } from "../weather/core/context.js";
import { createNebulacast } from "../shared/widget-runtime.mjs";
import { createCatalogRegistry } from "../shared/widget-catalog.mjs";

export async function mountSunPage({ documentRef = globalThis.document, stateApi } = {}) {
  const root = documentRef?.getElementById?.("w-sun");
  if (!root) throw new Error("Sun/Moon page mount element not found: #w-sun");
  if (!stateApi) throw new TypeError("Sun/Moon page requires the weather state API");
  const context = createPlatformContext(stateApi);
  const runtime = createNebulacast({ context, registry: createCatalogRegistry() });
  const instance = await runtime.mount(root, { widget: "sun-moon", config: { orientation: "horizontal" } });
  return Object.freeze({ context, runtime, instance, destroy: () => { instance.destroy(); context.destroy?.(); } });
}

export default mountSunPage;
