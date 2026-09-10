export const WIDGET_CONFIG_SCHEMA = "widget-config.v1";
export const STANDALONE_WIDGET_QUERY_KEYS = Object.freeze(["widget", "orientation", "theme", "density"]);

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

function allowedValues(definition, key) {
  const values = definition?.supportedOptions?.[key];
  if (!Array.isArray(values)) return [];
  return values.filter(safeString);
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
