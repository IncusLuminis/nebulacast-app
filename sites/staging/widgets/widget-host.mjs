import { createCatalogRegistry } from "../shared/widget-catalog.mjs";
import { createNebulacast } from "../shared/widget-runtime.mjs";
import { parseStandaloneWidgetQuery, serializeWidgetConfig } from "../shared/widget-config.mjs";

function defaultContext() {
  return Object.freeze({
    get: () => Object.freeze({ observer: Object.freeze({}), time: Object.freeze({ mode: "live", datetimeISO: null }) }),
    subscribe: () => () => {},
  });
}

function normalizeError(error) {
  return error instanceof Error ? error : new Error(String(error));
}

function standaloneStylesheet(definition) {
  const href = definition?.standaloneStylesheet;
  if (href === undefined) return null;
  if (typeof href !== "string" || !/^\/(?!\/)[^<>\s?#]+$/.test(href)) {
    throw new TypeError(`Invalid standalone stylesheet for ${definition?.type || "widget"}`);
  }
  return href;
}

/** A bounded standalone host for catalog definitions explicitly marked standaloneHost. */
export function createStandaloneWidgetHost({
  root,
  status,
  destroyButton,
  context = defaultContext(),
  registry = createCatalogRegistry(),
  runtime = null,
  documentRef = root?.ownerDocument || globalThis.document,
  windowRef = documentRef?.defaultView || (typeof window !== "undefined" ? window : null),
  search = windowRef?.location?.search || "",
} = {}) {
  if (!root || typeof root.setAttribute !== "function") throw new TypeError("Standalone host requires a root element");
  if (!status || typeof status.textContent === "undefined") throw new TypeError("Standalone host requires a status element");
  const widgetRuntime = runtime || createNebulacast({ context, registry });
  let instance = null;
  let pending = null;
  let stylesheetLink = null;
  let destroyed = false;

  function setStatus(message, state = "idle") {
    status.textContent = message;
    status.setAttribute?.("data-state", state);
  }

  function disableDestroy(disabled) {
    if (destroyButton) destroyButton.disabled = disabled;
  }

  async function destroy() {
    if (destroyed) return;
    destroyed = true;
    windowRef?.removeEventListener?.("pagehide", onPageHide);
    if (pending) await pending.catch(() => null);
    try {
      await instance?.destroy?.();
    } finally {
      stylesheetLink?.remove?.();
      stylesheetLink = null;
      instance = null;
      pending = null;
      disableDestroy(true);
      setStatus("Widget destroyed.", "destroyed");
    }
  }

  function onPageHide() { void destroy(); }

  async function mount(nextSearch = search) {
    if (destroyed) throw new Error("Standalone host is destroyed");
    if (instance) return instance;
    if (pending) return pending;
    let widgetConfig;
    let definition;
    try {
      widgetConfig = parseStandaloneWidgetQuery(registry, nextSearch);
      definition = registry.get(widgetConfig.widget);
      const href = standaloneStylesheet(definition);
      if (href && documentRef?.head?.appendChild && typeof documentRef.createElement === "function") {
        const link = documentRef.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.setAttribute?.("data-nc-standalone-stylesheet", widgetConfig.widget);
        documentRef.head.appendChild(link);
        stylesheetLink = link;
      }
    } catch (error) {
      const normalized = normalizeError(error);
      setStatus(`Unable to mount widget: ${normalized.message}`, "error");
      disableDestroy(true);
      return null;
    }

    root.textContent = "";
    setStatus(`Loading ${widgetConfig.widget}…`, "loading");
    pending = (async () => {
      try {
        const mounted = await widgetRuntime.mount(root, {
          widget: widgetConfig.widget,
          config: widgetConfig.config,
        });
        if (destroyed) {
          await mounted?.destroy?.();
          return null;
        }
        instance = mounted;
        disableDestroy(false);
        setStatus(`${widgetConfig.widget} mounted.`, "mounted");
        return mounted;
      } catch (error) {
        stylesheetLink?.remove?.();
        stylesheetLink = null;
        const normalized = normalizeError(error);
        setStatus(`Unable to mount widget: ${normalized.message}`, "error");
        disableDestroy(true);
        return null;
      } finally {
        pending = null;
      }
    })();
    return pending;
  }

  destroyButton?.addEventListener?.("click", () => { void destroy(); });
  windowRef?.addEventListener?.("pagehide", onPageHide, { once: true });

  return Object.freeze({
    mount,
    destroy,
    getInstance: () => instance,
    getConfig: nextSearch => {
      try {
        const config = parseStandaloneWidgetQuery(registry, nextSearch ?? search);
        return Object.freeze({ ...config, serialized: serializeWidgetConfig(config) });
      } catch (_) {
        return null;
      }
    },
  });
}

export default createStandaloneWidgetHost;
