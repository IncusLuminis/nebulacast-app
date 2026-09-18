import { createNebulacast } from "../shared/widget-runtime.mjs";
import { createCatalogRegistry } from "../shared/widget-catalog.mjs";

function createRouteContext() {
  return {
    get() { return { observer: {}, time: { mode: "live", datetimeISO: null } }; },
    subscribe() { return () => {}; },
    update() { return this.get(); },
  };
}

export async function mountCalendarPage({ documentRef = globalThis.document } = {}) {
  const root = documentRef?.getElementById?.("nrc-root-page");
  if (!root) throw new Error("Calendar page mount element not found: #nrc-root-page");
  const context = createRouteContext();
  const runtime = createNebulacast({ context, registry: createCatalogRegistry() });
  const instance = await runtime.mount(root, {
    widget: "events",
    config: {
      jsonUrl: "/calendar/daily_signal.json",
      rssUrl: "/alerts/rss.xml",
      maxItems: 20,
      timeRange: "upcoming",
      filters: ["All", "METEORS", "ECLIPSES", "CONJUNCTIONS", "OCCULTATIONS", "COMETS"],
      iconBase: "/assets/icons/alerts",
      orientation: "horizontal",
    },
  });
  return Object.freeze({ context, runtime, instance, destroy: () => instance.destroy() });
}

export default mountCalendarPage;
