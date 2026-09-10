import { createCatalogRegistry } from "../../shared/widget-catalog.mjs";
import { createNebulacast } from "../../shared/widget-runtime.mjs";
import { normalizeJavascriptEmbedInput } from "../../shared/widget-config.mjs";

const DATA_ASSET_KEYS = Object.freeze(["dataUrl", "jsonUrl", "rssUrl", "iconBase"]);

function defaultContext() {
  return Object.freeze({
    get: () => Object.freeze({ observer: Object.freeze({}), time: Object.freeze({ mode: "live", datetimeISO: null }) }),
    subscribe: () => () => {},
  });
}

function stylesheetPath(definition) {
  const href = definition?.standaloneStylesheet;
  if (typeof href !== "string" || !/^\/(?!\/)[^<>\s?#]+$/.test(href)) {
    throw new TypeError(`Catalog stylesheet is not safe for ${definition?.type || "widget"}`);
  }
  return href;
}

function resolveDataAssets(definition, config) {
  if (!config.baseUrl) return { ...config };
  const prefix = config.baseUrl === "/" ? "" : config.baseUrl.replace(/\/$/, "");
  const resolved = { ...config };
  for (const key of DATA_ASSET_KEYS) {
    const path = definition.defaults?.[key];
    if (typeof path === "string" && path.startsWith("/")) resolved[key] = `${prefix}${path}`;
  }
  return resolved;
}

/** Create an isolated public JavaScript embed API backed by the common Runtime. */
export function createJavascriptEmbedRuntime({
  registry = createCatalogRegistry(),
  context = defaultContext(),
  runtime = null,
  documentRef = globalThis.document,
  windowRef = documentRef?.defaultView || (typeof window !== "undefined" ? window : null),
} = {}) {
  const widgetRuntime = runtime || createNebulacast({ context, registry });
  const instances = new Map();
  const pendingRoots = new Set();
  const stylesheetRefs = new Map();
  let destroyed = false;

  function acquireStylesheet(definition) {
    const href = stylesheetPath(definition);
    const existing = stylesheetRefs.get(definition.type);
    if (existing) {
      existing.refs += 1;
      return { type: definition.type };
    }
    if (!documentRef?.head?.appendChild || typeof documentRef.createElement !== "function") {
      throw new TypeError("JavaScript embed requires a document head");
    }
    const link = documentRef.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.setAttribute?.("data-nc-embed-stylesheet", definition.type);
    documentRef.head.appendChild(link);
    stylesheetRefs.set(definition.type, { link, refs: 1 });
    return { type: definition.type };
  }

  function releaseStylesheet(record) {
    if (!record || record.stylesheetReleased) return;
    const reference = stylesheetRefs.get(record.stylesheetType);
    if (reference) {
      reference.refs -= 1;
      if (reference.refs === 0) {
        reference.link.remove?.();
        stylesheetRefs.delete(record.stylesheetType);
      }
    }
    record.stylesheetReleased = true;
  }

  async function mount(root, specification = {}) {
    if (destroyed) throw new Error("JavaScript embed runtime is destroyed");
    if (!root || typeof root.setAttribute !== "function") throw new TypeError("JavaScript embed requires a root element");
    if (instances.has(root) || pendingRoots.has(root)) throw new Error("A widget is already mounted on this root");
    pendingRoots.add(root);
    let record;
    try {
      const normalized = normalizeJavascriptEmbedInput(registry, specification);
      const definition = registry.get(normalized.widget);
      acquireStylesheet(definition);
      record = { instance: null, stylesheetType: definition.type, stylesheetReleased: false };
      const config = resolveDataAssets(definition, normalized.config);
      record.instance = await widgetRuntime.mount(root, { widget: normalized.widget, config });
      if (destroyed) {
        await record.instance?.destroy?.();
        releaseStylesheet(record);
        return null;
      }
      instances.set(root, record);
      return Object.freeze({
        id: record.instance?.id,
        type: record.instance?.type || normalized.widget,
        root,
        get config() { return record.instance?.config || config; },
        update: (...args) => record.instance?.update?.(...args),
        resize: (...args) => record.instance?.resize?.(...args),
        refresh: (...args) => record.instance?.refresh?.(...args),
        destroy: () => unmount(root),
      });
    } catch (error) {
      if (record) releaseStylesheet(record);
      throw error;
    } finally {
      pendingRoots.delete(root);
    }
  }

  function unmount(root) {
    const record = instances.get(root);
    if (!record) return undefined;
    instances.delete(root);
    let result;
    try {
      result = record.instance?.destroy?.();
    } finally {
      if (!result || typeof result.then !== "function") releaseStylesheet(record);
    }
    if (result && typeof result.then === "function") return result.finally(() => releaseStylesheet(record));
    return result;
  }

  async function destroy() {
    if (destroyed) return;
    destroyed = true;
    windowRef?.removeEventListener?.("pagehide", onPageHide);
    await Promise.all([...instances.keys()].map(root => Promise.resolve(unmount(root))));
  }

  function onPageHide() { void destroy(); }
  windowRef?.addEventListener?.("pagehide", onPageHide, { once: true });

  return Object.freeze({
    mount,
    unmount,
    destroy,
    getInstance: root => instances.get(root)?.instance || null,
  });
}

const publicRuntime = createJavascriptEmbedRuntime();

export const mount = publicRuntime.mount;
export const unmount = publicRuntime.unmount;
export default Object.freeze({ mount, unmount });
