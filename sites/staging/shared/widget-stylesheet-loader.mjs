/**
 * Registry-derived stylesheet contract for widget hosts.
 *
 * Stylesheet values are intentionally root-relative paths only. Hosts never
 * accept a URL supplied by a widget configuration or a page query string.
 */

const SAFE_STYLESHEET_PATH = /^\/(?!\/)(?!\.\.?\/)(?!.*\/\.\.?\/)(?!.*[%?#<>\s])[^\\"']+\.css$/;

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stylesheetError(message, code = "WIDGET_STYLESHEET_LOAD_FAILED") {
  return Object.assign(new Error(message), { code });
}

export function normalizeStylesheetPath(path, widget = "widget") {
  if (typeof path !== "string" || !SAFE_STYLESHEET_PATH.test(path)) {
    throw new TypeError(`Catalog stylesheet path is not a safe same-origin path for ${widget}`);
  }
  return path;
}

/**
 * Return the explicit catalog manifest. The standalone field is retained as a
 * compatibility fallback for older custom definitions outside the catalog.
 */
export function getWidgetStylesheets(definition) {
  const widget = definition?.type || "widget";
  const manifest = Object.prototype.hasOwnProperty.call(definition || {}, "stylesheets")
    ? definition.stylesheets
    : definition?.standaloneStylesheet === undefined
      ? []
      : [definition.standaloneStylesheet];
  if (!Array.isArray(manifest)) {
    throw new TypeError(`Catalog stylesheet manifest must be an array for ${widget}`);
  }
  const paths = [];
  const seen = new Set();
  for (const path of manifest) {
    const normalized = normalizeStylesheetPath(path, widget);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      paths.push(normalized);
    }
  }
  return Object.freeze(paths);
}

function loadStylesheet(link, href, widget, timeoutMs) {
  let timer;
  let settled = false;
  let resolveReady;
  let rejectReady;
  const ready = new Promise((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });

  const finish = error => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    if (error) rejectReady(error);
    else resolveReady(link);
  };
  const onLoad = () => finish();
  const onError = () => finish(stylesheetError(`Stylesheet ${href} failed to load for ${widget}`));
  link.addEventListener?.("load", onLoad, { once: true });
  link.addEventListener?.("error", onError, { once: true });
  // Small DOM fakes and older host adapters may expose event properties only.
  link.onload = onLoad;
  link.onerror = onError;
  timer = setTimeout(() => finish(stylesheetError(`Stylesheet ${href} timed out for ${widget}`, "WIDGET_STYLESHEET_LOAD_TIMEOUT")), timeoutMs);
  return ready;
}

/**
 * Load catalog stylesheets with href-level deduplication and reference-counted
 * cleanup. `acquire()` inserts links immediately for legacy hosts; `load()`
 * additionally waits for every link and is used by the Sandbox before mount.
 */
export function createStylesheetLoader({
  documentRef = globalThis.document,
  timeoutMs = 5000,
} = {}) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new TypeError("Stylesheet loader timeout must be positive");
  const entries = new Map();

  function waitForEntry(entry, widget) {
    if (!entry.ready) entry.ready = loadStylesheet(entry.link, entry.href, widget, timeoutMs);
    return entry.ready;
  }

  function acquirePath(href, widget, attributeName) {
    let entry = entries.get(href);
    if (!entry) {
      if (!documentRef?.head?.appendChild || typeof documentRef.createElement !== "function") {
        throw new TypeError("Widget host requires a document head for catalog stylesheets");
      }
      const link = documentRef.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.setAttribute?.(attributeName, widget);
      entry = {
        href,
        link,
        refs: 0,
        ready: null,
      };
      entries.set(href, entry);
      documentRef.head.appendChild(link);
    }
    entry.refs += 1;
    let released = false;
    return Object.freeze({
      href,
      link: entry.link,
      wait: () => waitForEntry(entry, widget),
      release() {
        if (released) return;
        released = true;
        entry.refs -= 1;
        if (entry.refs === 0) {
          entry.link.remove?.();
          entries.delete(href);
        }
      },
    });
  }

  function acquire(definition, { attributeName = "data-nc-widget-stylesheet" } = {}) {
    if (!isObject(definition)) throw new TypeError("Stylesheet loader requires a widget definition");
    const paths = getWidgetStylesheets(definition);
    const handles = [];
    try {
      for (const href of paths) handles.push(acquirePath(href, definition.type, attributeName));
    } catch (error) {
      for (const handle of handles) handle.release();
      throw error;
    }
    let released = false;
    return Object.freeze({
      paths,
      wait: () => Promise.all(handles.map(handle => handle.wait())),
      release() {
        if (released) return;
        released = true;
        for (const handle of handles) handle.release();
      },
    });
  }

  async function load(definition, options) {
    const handle = acquire(definition, options);
    try {
      await handle.wait();
      return handle;
    } catch (error) {
      handle.release();
      throw error;
    }
  }

  return Object.freeze({ acquire, load });
}
