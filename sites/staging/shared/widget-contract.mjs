export const REQUESTED_ORIENTATIONS = Object.freeze(["auto", "horizontal", "vertical"]);
// Backward-compatible name for the requested configuration values.
export const ORIENTATIONS = REQUESTED_ORIENTATIONS;
export const RESOLVED_ORIENTATIONS = Object.freeze(["horizontal", "vertical"]);
export const THEMES = Object.freeze(["inherit", "auto", "dark", "light"]);
export const DENSITIES = Object.freeze(["compact", "normal", "comfortable"]);
export const STATES = Object.freeze(["loading", "ready", "empty", "stale", "degraded", "error"]);

const REQUESTED_ORIENTATION_SET = new Set(REQUESTED_ORIENTATIONS);
const RESOLVED_ORIENTATION_SET = new Set(RESOLVED_ORIENTATIONS);
const THEME_SET = new Set(THEMES);
const DENSITY_SET = new Set(DENSITIES);
const STATE_SET = new Set(STATES);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function deepFreeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

function assertValue(name, value, values) {
  if (!values.has(value)) throw new TypeError(`${name} must be one of: ${[...values].join(", ")}`);
}

function resolveOrientation(orientation, root, config, resolver) {
  if (orientation !== "auto" || resolver === undefined) return orientation;
  if (typeof resolver !== "function") throw new TypeError("resolveAutoOrientation must be a function");
  const resolved = resolver({ root, config });
  assertValue("resolved orientation", resolved, RESOLVED_ORIENTATION_SET);
  return resolved;
}

/**
 * Normalize common widget configuration. Widget-specific keys are preserved.
 * Auto orientation is resolved only when an injector is supplied; no default
 * viewport/container breakpoint is defined here.
 */
export function normalizeWidgetConfig(config = {}, { root = null, resolveAutoOrientation } = {}) {
  if (!isObject(config)) throw new TypeError("Widget config must be an object");
  if (Object.prototype.hasOwnProperty.call(config, "mount")) {
    throw new TypeError("Widget config cannot provide an arbitrary mount function");
  }

  const normalized = {
    ...config,
    orientation: config.orientation ?? "auto",
    theme: config.theme ?? "inherit",
    density: config.density ?? "normal",
  };
  assertValue("orientation", normalized.orientation, REQUESTED_ORIENTATION_SET);
  assertValue("theme", normalized.theme, THEME_SET);
  assertValue("density", normalized.density, DENSITY_SET);
  normalized.orientation = resolveOrientation(normalized.orientation, root, normalized, resolveAutoOrientation);
  return deepFreeze(normalized);
}

function canHostMetadata(root) {
  return isObject(root) && root.classList && typeof root.classList.add === "function" &&
    typeof root.classList.remove === "function" && typeof root.setAttribute === "function" &&
    typeof root.removeAttribute === "function";
}

function metadataFrom(config, id, type) {
  return deepFreeze({
    id,
    type,
    orientation: config.orientation,
    theme: config.theme,
    density: config.density,
  });
}

/**
 * Attach runtime-owned host metadata and state to a supplied root.
 * The host never changes children or parent-page selectors.
 */
export function createWidgetHost(root, { id, type, config, state = "loading" } = {}) {
  if (!canHostMetadata(root)) throw new TypeError("Widget root must support class and attribute metadata");
  if (typeof id !== "string" || !id) throw new TypeError("Widget host id must be a non-empty string");
  if (typeof type !== "string" || !type) throw new TypeError("Widget host type must be a non-empty string");
  if (!isObject(config)) throw new TypeError("Widget host config must be an object");
  assertValue("widget state", state, STATE_SET);

  let metadata = metadataFrom(config, id, type);
  let currentState = state;
  const ownedAttributes = [
    "data-nc-widget",
    "data-nc-widget-id",
    "data-nc-orientation",
    "data-nc-theme",
    "data-nc-density",
    "data-nc-state",
  ];

  function applyMetadata() {
    root.classList.add("nc-widget");
    root.setAttribute("data-nc-widget", metadata.type);
    root.setAttribute("data-nc-widget-id", metadata.id);
    root.setAttribute("data-nc-orientation", metadata.orientation);
    root.setAttribute("data-nc-theme", metadata.theme);
    root.setAttribute("data-nc-density", metadata.density);
    root.setAttribute("data-nc-state", currentState);
  }

  applyMetadata();

  return {
    root,
    getMetadata() {
      return metadata;
    },
    getState() {
      return currentState;
    },
    setState(nextState) {
      assertValue("widget state", nextState, STATE_SET);
      currentState = nextState;
      root.setAttribute("data-nc-state", currentState);
      return currentState;
    },
    setConfig(nextConfig) {
      if (!isObject(nextConfig)) throw new TypeError("Widget host config must be an object");
      metadata = metadataFrom(nextConfig, metadata.id, metadata.type);
      applyMetadata();
      return metadata;
    },
    destroy() {
      for (const attribute of ownedAttributes) root.removeAttribute(attribute);
      root.classList.remove("nc-widget");
    },
  };
}
