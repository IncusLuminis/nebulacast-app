export const WIDGET_CONFIG_SCHEMA = "widget-config.v1";
export const STANDALONE_WIDGET_QUERY_KEYS = Object.freeze(["widget", "orientation", "theme", "density"]);
export const STANDALONE_WIDGET_HOST_PATH = "/widgets/widget.html";
export const IFRAME_EMBED_DEFAULTS = Object.freeze({
  width: "100%",
  height: "600",
  loading: "lazy",
});
export const JAVASCRIPT_EMBED_MODULE_PATH = "/widgets/runtime/index.mjs";
export const JAVASCRIPT_EMBED_CONFIG_KEYS = Object.freeze(["orientation", "theme", "density", "baseUrl"]);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function deepFreeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

function safeString(value) {
  return typeof value === "string" &&
    !/[<>]/.test(value) &&
    !/^(?:javascript:|data:|https?:\/\/|\/\/)/i.test(value);
}

function safeEmbedBaseUrl(value) {
  return typeof value === "string" && value.length > 0 && !/[<>\s?#]/.test(value) &&
    !/(?:^|\/)[^/]*\.(?:html?|m?js)(?:\/|$)/i.test(value) &&
    (/^\/(?!\/)/.test(value) || /^https?:\/\/[^/]+(?:\/[^/]*)*\/?$/i.test(value));
}

function safeIframeOrigin(value) {
  if (value === undefined) return "";
  if (typeof value !== "string" || !/^https?:\/\/[^/]+\/?$/i.test(value)) {
    throw new TypeError("Iframe embed origin must be an absolute HTTP(S) origin");
  }
  const origin = new URL(value).origin;
  if (origin === "null") throw new TypeError("Iframe embed origin must be an absolute HTTP(S) origin");
  return origin;
}

function escapeAttribute(value) {
  return String(value ?? "").replace(/[&<>\"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '\"': "&quot;",
    "'": "&#39;",
  }[character]));
}

function allowedValues(definition, key) {
  const values = definition?.supportedOptions?.[key];
  if (!Array.isArray(values)) return [];
  return values.filter(safeString);
}

function assertStandaloneFields(value, path = "standalone widget") {
  if (!isObject(value)) throw new TypeError(`${path} must be an object`);
  for (const key of Object.keys(value)) {
    if (!STANDALONE_WIDGET_QUERY_KEYS.slice(1).includes(key)) {
      throw new TypeError(`${path} contains an unsupported field: ${key}`);
    }
  }
}

function standaloneConfig(registry, widgetOrExport, requested) {
  let widget = widgetOrExport;
  let source = requested;
  if (isObject(widgetOrExport)) {
    const exportKeys = ["schema", "widget", "version", "config"];
    const hasExportShape = Object.prototype.hasOwnProperty.call(widgetOrExport, "schema") ||
      Object.prototype.hasOwnProperty.call(widgetOrExport, "version") ||
      Object.prototype.hasOwnProperty.call(widgetOrExport, "config");
    if (hasExportShape) {
      if (Object.keys(widgetOrExport).some(key => !exportKeys.includes(key)) ||
          widgetOrExport.schema !== WIDGET_CONFIG_SCHEMA ||
          !Number.isInteger(widgetOrExport.version) ||
          !isObject(widgetOrExport.config)) {
        throw new TypeError("Expected a widget-config.v1 standalone export");
      }
      widget = widgetOrExport.widget;
      const definition = definitionFrom(registry, widget);
      if (widgetOrExport.version !== definition.version) throw new TypeError("Standalone widget config version mismatch");
      const supported = new Set(Object.keys(definition.supportedOptions || {}));
      for (const key of Object.keys(widgetOrExport.config)) {
        if (!supported.has(key)) throw new TypeError(`standalone widget contains an unsupported field: ${key}`);
      }
      // The standalone URL exposes only the documented common host fields;
      // widget-specific catalog defaults remain valid in the versioned export
      // without becoming executable query parameters.
      source = Object.fromEntries(STANDALONE_WIDGET_QUERY_KEYS.slice(1)
        .filter(key => widgetOrExport.config[key] !== undefined)
        .map(key => [key, widgetOrExport.config[key]]));
    } else if (Object.prototype.hasOwnProperty.call(widgetOrExport, "widget")) {
      widget = widgetOrExport.widget;
      source = { ...widgetOrExport };
      delete source.widget;
    } else {
      throw new TypeError("Standalone widget input requires a widget type");
    }
  }
  const definition = definitionFrom(registry, widget);
  if (definition.standaloneHost !== true) throw new Error(`Widget ${widget} is not allowed in the standalone host`);
  const input = source === undefined ? {} : source;
  assertStandaloneFields(input);
  for (const key of STANDALONE_WIDGET_QUERY_KEYS.slice(1)) {
    if (input[key] !== undefined && !allowedValues(definition, key).includes(input[key])) {
      throw new TypeError(`Invalid ${key} for standalone widget ${widget}`);
    }
  }
  return createWidgetConfig(registry, widget, input);
}

export function getWidgetOptionValues(registry, widget, key) {
  return allowedValues(definitionFrom(registry, widget), key);
}

function definitionFrom(registry, widget) {
  if (registry && typeof registry.get === "function") {
    const definition = registry.get(widget);
    if (definition) return definition;
  }
  if (Array.isArray(registry)) {
    const definition = registry.find(item => item?.type === widget);
    if (definition) return definition;
  }
  throw new Error(`Unknown widget type: ${widget}`);
}

function assertWidgetName(widget) {
  if (typeof widget !== "string" || !/^[a-z][a-z0-9-]*$/.test(widget)) {
    throw new TypeError("Widget config requires a registered widget type");
  }
}

function assertSerializable(value, path = "config") {
  if (typeof value === "function" || typeof value === "symbol" || typeof value === "bigint") {
    throw new TypeError(`${path} contains a non-serializable value`);
  }
  if (typeof value === "string" && !safeString(value)) {
    throw new TypeError(`${path} contains an unsafe string`);
  }
  if (Array.isArray(value)) {
    value.forEach((child, index) => assertSerializable(child, `${path}[${index}]`));
    return;
  }
  if (isObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      if (/^(?:loader|mount|render|html|innerHTML|url|dataUrl|rssUrl|fetch|fetchImpl)$/i.test(key)) {
        throw new TypeError(`${path} contains a forbidden field`);
      }
      if (!/^[a-z][a-zA-Z0-9_-]*$/.test(key)) throw new TypeError(`${path} contains an invalid field`);
      assertSerializable(child, `${path}.${key}`);
    }
    return;
  }
  if (typeof value === "number" && !Number.isFinite(value)) throw new TypeError(`${path} contains a non-finite number`);
  if (value !== null && typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
    throw new TypeError(`${path} contains an unsupported value`);
  }
}

/**
 * Normalize a widget config using only the immutable supportedOptions metadata
 * of a definition held by a Widget Registry (or catalog array).
 */
export function normalizeWidgetConfig(registry, widget, requested = {}) {
  assertWidgetName(widget);
  const definition = definitionFrom(registry, widget);
  const source = isObject(requested) ? requested : {};
  const normalized = {};
  for (const key of Object.keys(definition.supportedOptions || {}).sort()) {
    const allowed = allowedValues(definition, key);
    if (!allowed.length) continue;
    const value = source[key];
    const fallback = definition.defaults?.[key];
    normalized[key] = allowed.includes(value)
      ? value
      : (allowed.includes(fallback) ? fallback : allowed[0]);
  }
  assertSerializable(normalized);
  return deepFreeze(normalized);
}

/** Create the read-only versioned export object from a registered widget. */
export function createWidgetConfig(registry, widget, requested = {}) {
  const definition = definitionFrom(registry, widget);
  const config = normalizeWidgetConfig(registry, widget, requested);
  return deepFreeze({
    schema: WIDGET_CONFIG_SCHEMA,
    widget: definition.type,
    version: definition.version,
    config,
  });
}

function stableValue(value) {
  if (Array.isArray(value)) return `[${value.map(stableValue).join(",")}]`;
  if (isObject(value)) {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableValue(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/** Serialize a widget-config.v1 object with stable top-level and config order. */
export function serializeWidgetConfig(value) {
  if (!isObject(value) || value.schema !== WIDGET_CONFIG_SCHEMA || typeof value.widget !== "string" ||
      !Number.isInteger(value.version) || !isObject(value.config)) {
    throw new TypeError("Expected a widget-config.v1 object");
  }
  const keys = Object.keys(value);
  if (keys.some(key => !["schema", "widget", "version", "config"].includes(key))) {
    throw new TypeError("Widget config export contains an unsupported field");
  }
  assertWidgetName(value.widget);
  assertSerializable(value.config);
  return `{"schema":${JSON.stringify(WIDGET_CONFIG_SCHEMA)},"widget":${JSON.stringify(value.widget)},"version":${JSON.stringify(value.version)},"config":${stableValue(value.config)}}`;
}

export function exportWidgetConfig(registry, widget, requested = {}) {
  return serializeWidgetConfig(createWidgetConfig(registry, widget, requested));
}

/** Build the deterministic URL for the bounded standalone host. */
export function buildStandaloneWidgetUrl(registry, widgetOrExport, requested = {}) {
  const configExport = standaloneConfig(registry, widgetOrExport, requested);
  const params = new URLSearchParams();
  params.set("widget", configExport.widget);
  for (const key of STANDALONE_WIDGET_QUERY_KEYS.slice(1)) params.set(key, configExport.config[key]);
  return `${STANDALONE_WIDGET_HOST_PATH}?${params.toString()}`;
}

/** Build safe copy/paste iframe markup for the generic standalone host. */
export function buildIframeEmbedSnippet(registry, widgetOrExport, options = {}) {
  if (!isObject(options)) throw new TypeError("Iframe embed options must be an object");
  for (const key of Object.keys(options)) {
    if (!["origin", "title"].includes(key)) {
      throw new TypeError(`Iframe embed options contain an unsupported field: ${key}`);
    }
  }
  const configExport = standaloneConfig(registry, widgetOrExport);
  const definition = definitionFrom(registry, configExport.widget);
  const origin = safeIframeOrigin(options.origin);
  const title = options.title === undefined ? (definition.title || definition.type) : options.title;
  if (!safeString(title)) throw new TypeError("Iframe embed title contains an unsafe string");
  const src = `${origin}${buildStandaloneWidgetUrl(registry, configExport)}`;
  return `<iframe src="${escapeAttribute(src)}" title="${escapeAttribute(title)}" width="${IFRAME_EMBED_DEFAULTS.width}" height="${IFRAME_EMBED_DEFAULTS.height}" loading="${IFRAME_EMBED_DEFAULTS.loading}" style="border:0;display:block"></iframe>`;
}

/** Normalize the public JavaScript embed specification without exposing loaders or data URLs. */
export function normalizeJavascriptEmbedInput(registry, specification = {}) {
  if (!isObject(specification)) throw new TypeError("JavaScript embed specification must be an object");
  for (const key of Object.keys(specification)) {
    if (!["widget", "config", "baseUrl"].includes(key)) {
      throw new TypeError(`JavaScript embed specification contains an unsupported field: ${key}`);
    }
  }
  const widget = specification.widget;
  const definition = definitionFrom(registry, widget);
  if (definition.javascriptEmbed !== true) throw new Error(`Widget ${widget} is not enabled for JavaScript embed`);
  const supplied = specification.config === undefined ? {} : specification.config;
  if (!isObject(supplied)) throw new TypeError("JavaScript embed config must be an object");
  for (const key of Object.keys(supplied)) {
    if (!JAVASCRIPT_EMBED_CONFIG_KEYS.includes(key)) {
      throw new TypeError(`JavaScript embed config contains an unsupported field: ${key}`);
    }
  }
  if (specification.baseUrl !== undefined && supplied.baseUrl !== undefined && specification.baseUrl !== supplied.baseUrl) {
    throw new TypeError("JavaScript embed baseUrl was provided twice");
  }
  const requested = { ...supplied };
  if (specification.baseUrl !== undefined) requested.baseUrl = specification.baseUrl;
  if (requested.baseUrl !== undefined && !safeEmbedBaseUrl(requested.baseUrl)) {
    throw new TypeError("JavaScript embed baseUrl must be a safe data/assets URL prefix");
  }
  const common = createWidgetConfig(registry, widget, Object.fromEntries(
    STANDALONE_WIDGET_QUERY_KEYS.slice(1)
      .filter(key => requested[key] !== undefined)
      .map(key => [key, requested[key]]),
  ));
  const config = Object.fromEntries(STANDALONE_WIDGET_QUERY_KEYS.slice(1)
    .filter(key => common.config[key] !== undefined)
    .map(key => [key, common.config[key]]));
  if (requested.baseUrl !== undefined) config.baseUrl = requested.baseUrl;
  return Object.freeze({ widget: common.widget, config: deepFreeze(config) });
}

/** Serialize the bounded JavaScript embed specification with stable key ordering. */
export function serializeJavascriptEmbedSpecification(registry, specification = {}) {
  const normalized = normalizeJavascriptEmbedInput(registry, specification);
  return stableValue({ widget: normalized.widget, config: normalized.config });
}

/** Parse the bounded standalone host query without ever evaluating a loader. */
export function parseStandaloneWidgetQuery(registry, search = "") {
  const params = search && typeof search.entries === "function"
    ? search
    : new URLSearchParams(String(search).replace(/^\?/, ""));
  const accepted = new Set(STANDALONE_WIDGET_QUERY_KEYS);
  const seen = new Set();
  for (const [key] of params.entries()) {
    if (!accepted.has(key)) throw new TypeError(`Unsupported standalone widget parameter: ${key}`);
    if (seen.has(key)) throw new TypeError(`Duplicate standalone widget parameter: ${key}`);
    seen.add(key);
  }
  if (!params.has("widget") || !params.get("widget")) throw new TypeError("Standalone widget parameter is required");
  const widget = params.get("widget");
  const definition = definitionFrom(registry, widget);
  if (definition.standaloneHost !== true) throw new Error(`Widget ${widget} is not allowed in the standalone host`);
  const requested = {};
  for (const key of ["orientation", "theme", "density"]) {
    if (!params.has(key)) continue;
    const value = params.get(key);
    if (!allowedValues(definition, key).includes(value)) {
      throw new TypeError(`Invalid ${key} for standalone widget ${widget}`);
    }
    requested[key] = value;
  }
  return createWidgetConfig(registry, widget, requested);
}
