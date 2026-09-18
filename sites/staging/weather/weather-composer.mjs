import { createNebulacast } from "../shared/widget-runtime.mjs";
import { createCatalogRegistry } from "../shared/widget-catalog.mjs";

const EAGER_SLOTS = Object.freeze([
  Object.freeze({ id: "location", selector: "#w-location", widget: "location", config: {} }),
  Object.freeze({ id: "weather", selector: "#w-weather", widget: "weather", config: { orientation: "horizontal" } }),
  Object.freeze({ id: "sun", selector: "#w-sun", widget: "sun-moon", config: { orientation: "horizontal" } }),
  Object.freeze({ id: "astro", selector: "#w-astro", widget: "astro", config: { orientation: "horizontal" } }),
  Object.freeze({ id: "map", selector: "#w-map", widget: "map", config: { orientation: "horizontal", mapUrl: "/weather/map-poc.html" } }),
]);

const SKY_SLOT = Object.freeze({
  id: "sky",
  selector: "#skyMount",
  widget: "sky",
  // Sky is square by host layout; public Sky modes remain square-only.
  config: Object.freeze({ orientation: "horizontal", options: {
    showSunMoon: true,
    showMilkyWay: true,
    showGridEq: true,
    showConstellations: true,
    showObjects: true,
    showAlerts: true,
  } }),
});

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function errorFor(value) {
  return value instanceof Error ? value : new Error(String(value));
}

function sameConfig(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function assertContext(context) {
  if (!isObject(context) || typeof context.get !== "function" ||
      typeof context.subscribe !== "function" || typeof context.update !== "function") {
    throw new TypeError("Weather page composer requires Platform Context");
  }
}

/**
 * Compose the modular Weather page from the shared Registry and Runtime.
 * The page owns only tab visibility and compatibility persistence; widget
 * roots, data, and lifecycle remain owned by Runtime instances.
 */
export function createWeatherPageComposer({
  context,
  runtime = null,
  registry = createCatalogRegistry(),
  documentRef = globalThis.document,
  storage = globalThis.localStorage,
} = {}) {
  assertContext(context);
  const widgetRuntime = runtime || createNebulacast({ context, registry });
  const records = new Map();
  const errors = new Map();
  let destroyed = false;
  let operation = Promise.resolve();
  let selectedTab = "weather";

  function resolveRoot(selector) {
    return documentRef?.querySelector?.(selector) || null;
  }

  function slots() {
    return [...EAGER_SLOTS, ...(records.has("sky") ? [SKY_SLOT] : [])];
  }

  function snapshot() {
    return {
      selectedTab,
      instances: new Map([...records].map(([id, record]) => [id, record.instance])),
      errors: new Map(errors),
      slots: slots(),
    };
  }

  function enqueue(work) {
    operation = operation.catch(() => undefined).then(work);
    return operation;
  }

  async function mountSlot(slotRef) {
    const root = resolveRoot(slotRef.selector);
    if (!root) {
      errors.set(slotRef.id, errorFor(`Weather slot root not found: ${slotRef.selector}`));
      return;
    }
    const previous = records.get(slotRef.id);
    if (previous && previous.root === root && previous.widget === slotRef.widget && sameConfig(previous.config, slotRef.config)) return;
    if (previous) {
      await previous.instance?.destroy?.();
      records.delete(slotRef.id);
    }
    try {
      const instance = await widgetRuntime.mount(root, { widget: slotRef.widget, config: slotRef.config });
      records.set(slotRef.id, { ...slotRef, root, instance });
      errors.delete(slotRef.id);
    } catch (error) {
      errors.set(slotRef.id, errorFor(error));
    }
  }

  async function mount() {
    if (destroyed) throw new Error("Weather page composer is destroyed");
    return enqueue(async () => {
      for (const slotRef of EAGER_SLOTS) await mountSlot(slotRef);
      const saved = storage?.getItem?.("nc-weather-tab");
      if (["weather", "map", "sun", "sky"].includes(saved)) await selectTabInternal(saved);
      return snapshot();
    });
  }

  async function ensureSky() {
    if (!records.has("sky")) await mountSlot(SKY_SLOT);
  }

  async function selectTabInternal(tab) {
    const target = ["weather", "map", "sun", "sky"].includes(tab) ? tab : "weather";
    if (target === "sky") await ensureSky();
    selectedTab = target;
    documentRef?.querySelectorAll?.(".widget-tab")?.forEach(element => {
      element.classList.toggle("active", element.dataset.tab === target);
    });
    documentRef?.querySelectorAll?.(".widget-tab-content")?.forEach(element => {
      element.classList.toggle("active", element.id === `w-${target}`);
    });
    try { storage?.setItem?.("nc-weather-tab", target); } catch (_) {}
    return snapshot();
  }

  function selectTab(tab) {
    if (destroyed) return Promise.reject(new Error("Weather page composer is destroyed"));
    return enqueue(() => selectTabInternal(tab));
  }

  function bindTabs() {
    documentRef?.querySelectorAll?.(".widget-tab")?.forEach(element => {
      element.addEventListener("click", () => { void selectTab(element.dataset.tab); });
    });
  }

  function destroy() {
    if (destroyed) return operation;
    destroyed = true;
    return enqueue(async () => {
      for (const record of records.values()) await record.instance?.destroy?.();
      records.clear();
      errors.clear();
    });
  }

  bindTabs();
  return Object.freeze({
    mount,
    selectTab,
    ensureSky,
    destroy,
    getSnapshot: snapshot,
    getInstance: id => records.get(id)?.instance,
    getErrors: () => new Map(errors),
  });
}

export { EAGER_SLOTS, SKY_SLOT };
export default createWeatherPageComposer;
