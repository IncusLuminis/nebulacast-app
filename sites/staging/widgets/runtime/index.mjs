import { createCatalogRegistry } from "../../shared/widget-catalog.mjs";
import { createNebulacast } from "../../shared/widget-runtime.mjs";
import { createStylesheetLoader } from "../../shared/widget-stylesheet-loader.mjs";
import {
  JAVASCRIPT_EMBED_API_VERSION,
  normalizeJavascriptEmbedInput,
} from "../../shared/widget-config.mjs";

const DATA_ASSET_KEYS = Object.freeze(["dataUrl", "jsonUrl", "rssUrl", "iconBase"]);

function defaultContext() {
  let current = {
    observer: {
      name: "Warsaw",
      lat: 52.2297,
      lon: 21.0122,
      timezone: "Europe/Warsaw",
      source: "javascript-embed",
    },
    time: { mode: "live", datetimeISO: null },
  };
  const listeners = new Set();
  const snapshot = () => structuredClone(current);
  return {
    get: snapshot,
    getObserver: () => structuredClone(current.observer),
    subscribe(listener) {
      if (typeof listener !== "function") throw new TypeError("JavaScript embed subscriber must be a function");
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    update(patch = {}) {
      if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
        throw new TypeError("JavaScript embed context update must be an object");
      }
      current = {
        ...current,
        ...structuredClone(patch),
        observer: { ...current.observer, ...(patch.observer || {}) },
        time: { ...current.time, ...(patch.time || {}) },
      };
      const next = snapshot();
      for (const listener of [...listeners]) listener(next);
      return next;
    },
  };
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

/** Apply the normalized caller-owned host rectangle to an embed root. */
export function applyEmbedLayout(root, layout) {
  if (!layout) return;
  const suffix = layout.unit === "percent" ? "%" : "px";
  if (root.style) {
    root.style.width = `${layout.width}${suffix}`;
    root.style.height = `${layout.height}${suffix}`;
  }
  root.setAttribute("data-nc-embed-mode", layout.mode);
  root.setAttribute("data-nc-embed-unit", layout.unit || "px");
  root.setAttribute("data-nc-embed-width", layout.width);
  root.setAttribute("data-nc-embed-height", layout.height);
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
  const stylesheetLoader = createStylesheetLoader({ documentRef });
  let destroyed = false;

  function acquireStylesheet(definition) {
    return stylesheetLoader.acquire(definition, { attributeName: "data-nc-embed-stylesheet" });
  }

  function releaseStylesheet(record) {
    if (!record || record.stylesheetReleased) return;
    record.stylesheet?.release?.();
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
      const stylesheet = acquireStylesheet(definition);
      record = { instance: null, stylesheet, stylesheetReleased: false };
      const config = resolveDataAssets(definition, {
        ...normalized.config,
        ...(normalized.layout ? { orientation: normalized.layout.mode === "square" ? "auto" : normalized.layout.mode } : {}),
      });
      applyEmbedLayout(root, normalized.layout);
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
        layout: normalized.layout,
        get config() { return record.instance?.config || config; },
        update: (patch, ...args) => record.instance?.update?.(normalizeUpdate(normalized.widget, patch), ...args),
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

  function normalizeUpdate(type, patch) {
    if (patch === undefined) return undefined;
    if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
      throw new TypeError("JavaScript embed update must be a configuration object");
    }
    const normalized = normalizeJavascriptEmbedInput(registry, { widget: type, config: patch });
    return Object.freeze(Object.fromEntries(Object.keys(patch).map(key => [key, normalized.config[key]])));
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
    apiVersion: JAVASCRIPT_EMBED_API_VERSION,
  });
}

const publicRuntime = createJavascriptEmbedRuntime();

export const mount = publicRuntime.mount;
export const unmount = publicRuntime.unmount;
export const apiVersion = JAVASCRIPT_EMBED_API_VERSION;
export default Object.freeze({ apiVersion, mount, unmount });
