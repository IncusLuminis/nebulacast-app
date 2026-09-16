import { createWidgetConfig, normalizeWidgetConfig } from "../shared/widget-config.mjs";
import {
  WIDGET_LAB_LAYOUT,
  validateWidgetLabLayout,
} from "../showcase/widget-lab-model.mjs";

export const CONSOLE_SANDBOX_VIEWPORTS = Object.freeze(["desktop", "narrow"]);
export const CONSOLE_SANDBOX_DEFAULT_VIEWPORT = "desktop";
export const CONSOLE_SANDBOX_LAYOUT_UNITS = Object.freeze(["percent", "px"]);
export const CONSOLE_SANDBOX_DEFAULT_LAYOUT_UNIT = "percent";
export const CONSOLE_SANDBOX_STATES = Object.freeze(["idle", "invalid", "loading", "ready", "error", "timeout", "destroyed"]);
export const CONSOLE_SANDBOX_DROP_ZONES = Object.freeze([
  Object.freeze({ id: "horizontal", mode: "horizontal", label: "Horizontal", description: "Wide widgets: width greater than height." }),
  Object.freeze({ id: "vertical", mode: "vertical", label: "Vertical", description: "Tall widgets: height greater than width." }),
  Object.freeze({ id: "square", mode: "square", label: "Square", description: "Square-only widgets such as Sky." }),
]);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertRegistry(registry) {
  if (!registry || typeof registry.get !== "function" || typeof registry.list !== "function") {
    throw new TypeError("Console Sandbox requires a Widget Registry");
  }
}

function assertLive(destroyed) {
  if (destroyed) throw new Error("Console Sandbox is destroyed");
}

function assertState(state) {
  if (!CONSOLE_SANDBOX_STATES.includes(state)) throw new TypeError(`State must be one of: ${CONSOLE_SANDBOX_STATES.join(", ")}`);
}

function definitionFor(registry, widget) {
  const definition = registry.get(widget);
  if (!definition) throw new Error(`Unknown widget type: ${widget}`);
  return definition;
}

function defaultLayout(definition) {
  if (definition.shape === "square" || definition.type === "sky") {
    return { mode: "square", unit: CONSOLE_SANDBOX_DEFAULT_LAYOUT_UNIT, width: 100, height: 100 };
  }
  return { mode: "horizontal", unit: CONSOLE_SANDBOX_DEFAULT_LAYOUT_UNIT, width: 100, height: 100 };
}

function zoneForId(zoneId) {
  return CONSOLE_SANDBOX_DROP_ZONES.find(zone => zone.id === zoneId) || null;
}

function defaultZoneFor(definition) {
  return definition.shape === "square" || definition.type === "sky" ? "square" : "horizontal";
}

function convertLayout(layout, mode) {
  if (mode === "square") return { ...layout, mode };
  if (layout.mode === mode) return { ...layout, mode };
  return { ...layout, mode, width: layout.height, height: layout.width };
}

function layoutUnitFor(layout, fallback = CONSOLE_SANDBOX_DEFAULT_LAYOUT_UNIT) {
  if (isObject(layout) && layout.unit !== undefined) return layout.unit;
  // Existing callers passed bare pixel dimensions. Keep that API contract
  // while new/default layouts use percentages relative to the card.
  if (isObject(layout) && (layout.width !== undefined || layout.height !== undefined)) return "px";
  return fallback;
}

function layoutWithDefaults(definition, requested = {}) {
  const defaults = defaultLayout(definition);
  return {
    ...defaults,
    ...(isObject(requested) ? requested : {}),
    unit: layoutUnitFor(requested, defaults.unit),
  };
}

function normalizeSandboxLayout(definition, requested = {}, limits = WIDGET_LAB_LAYOUT) {
  if (!isObject(requested)) throw new TypeError("Console Sandbox layout must be an object");
  const shape = definition.shape === "square" || definition.type === "sky" ? "square" : "oriented";
  const defaults = defaultLayout(definition);
  const unit = layoutUnitFor(requested, defaults.unit);
  const mode = requested.mode === undefined ? defaults.mode : requested.mode;
  const width = requested.width === undefined ? defaults.width : Number(requested.width);
  const height = requested.height === undefined ? defaults.height : Number(requested.height);
  const min = unit === "px" ? limits.minDimension : 1;
  const max = unit === "px" ? limits.maxDimension : 100;
  let error = CONSOLE_SANDBOX_LAYOUT_UNITS.includes(unit) ? null : `Unit must be one of: ${CONSOLE_SANDBOX_LAYOUT_UNITS.join(", ")}`;
  if (!Number.isInteger(width) || !Number.isFinite(width)) error ||= "Width must be a finite integer";
  if (!Number.isInteger(height) || !Number.isFinite(height)) error ||= "Height must be a finite integer";
  if (!error && (width < min || width > max)) error = `Width must be between ${min} and ${max}${unit === "percent" ? "%" : ""}`;
  if (!error && (height < min || height > max)) error = `Height must be between ${min} and ${max}${unit === "percent" ? "%" : ""}`;
  if (!error && !["square", "horizontal", "vertical"].includes(mode)) error = "Mode must be square, horizontal, or vertical";
  if (!error && shape === "square" && width !== height) error = "Sky requires a square container: width must equal height";
  // 100%/100% is the explicit full-card preset. The selected oriented mode
  // supplies the card aspect ratio; all other percentages still validate the
  // requested orientation normally.
  const fullCard = unit === "percent" && width === 100 && height === 100;
  if (!error && shape !== "square" && mode === "horizontal" && width <= height && !fullCard) {
    error = "Horizontal widgets require width greater than height";
  }
  if (!error && shape !== "square" && mode === "vertical" && height <= width && !fullCard) {
    error = "Vertical widgets require height greater than width";
  }
  if (!error && shape === "square" && mode !== "square") error = "Sky can only use square mode";
  if (!error && shape !== "square" && mode === "square") error = "Only square widgets can use square mode";
  return Object.freeze({ mode, shape, unit, width, height, valid: !error, error: error || null });
}

/** Convert a validated unit-aware layout to pixels using the actual card
 * content box. Pixel layouts remain pixel-based; percentage layouts are never
 * resolved against the viewport. */
export function resolveConsoleSandboxLayout(layout, { width = 0, height = 0 } = {}) {
  if (!isObject(layout)) throw new TypeError("Console Sandbox layout must be an object");
  const unit = layout.unit || "px";
  const basisWidth = Math.max(0, Number(width) || 0);
  const basisHeight = Math.max(0, Number(height) || 0);
  const resolvedWidth = unit === "percent" ? Math.round(basisWidth * Number(layout.width) / 100) : Number(layout.width);
  const resolvedHeight = unit === "percent" ? Math.round(basisHeight * Number(layout.height) / 100) : Number(layout.height);
  const square = layout.shape === "square" || layout.mode === "square";
  return Object.freeze({
    unit,
    width: Number.isFinite(resolvedWidth) ? Math.max(0, resolvedWidth) : 0,
    height: square
      ? (Number.isFinite(resolvedWidth) ? Math.max(0, resolvedWidth) : 0)
      : (Number.isFinite(resolvedHeight) ? Math.max(0, resolvedHeight) : 0),
  });
}

function freezeConfig(config) {
  return Object.freeze({ ...config });
}

function normalizeCard(registry, widget, config = {}, layout = {}, limits = WIDGET_LAB_LAYOUT) {
  const definition = definitionFor(registry, widget);
  const normalizedLayout = normalizeSandboxLayout(definition, layoutWithDefaults(definition, layout), limits);
  const normalizedConfig = createWidgetConfig(registry, widget, {
    ...(isObject(config) ? config : {}),
    orientation: normalizedLayout.mode === "square" ? "auto" : normalizedLayout.mode,
  });
  return {
    definition,
    config: normalizedConfig.config,
    layout: normalizedLayout,
    state: normalizedLayout.valid ? "idle" : "invalid",
    error: normalizedLayout.valid ? null : normalizedLayout.error,
  };
}

function cardSnapshot(record, position) {
  return Object.freeze({
    id: record.id,
    widget: record.widget,
    config: freezeConfig(record.config),
    layout: Object.freeze({ ...record.layout }),
    zoneId: record.zoneId,
    position,
    state: record.state,
    error: record.error,
  });
}

function paletteEntry(definition) {
  return Object.freeze({
    type: definition.type,
    version: definition.version,
    title: definition.title || definition.type,
    description: definition.description || "",
    shape: definition.shape === "square" || definition.type === "sky" ? "square" : "oriented",
    userModes: Object.freeze([...(definition.userModes || [])]),
    supportedOptions: Object.freeze(Object.fromEntries(
      Object.entries(definition.supportedOptions || {}).map(([key, values]) => [key, Object.freeze([...(values || [])])]),
    )),
    capabilities: Object.freeze({ ...(definition.capabilities || {}) }),
  });
}

/**
 * Host-owned in-memory composition model for the Console Sandbox.
 * It owns palette metadata, drop-zone membership, card identity/order/
 * selection, validated host layouts, and normalized widget config. Runtime
 * mounting is deliberately handled by the page layer.
 */
export function createConsoleSandboxModel({
  registry,
  limits = WIDGET_LAB_LAYOUT,
  onChange = () => {},
} = {}) {
  assertRegistry(registry);
  if (!isObject(limits)) throw new TypeError("Console Sandbox limits must be an object");
  if (typeof onChange !== "function") throw new TypeError("Console Sandbox onChange must be a function");

  const palette = Object.freeze(registry.list().map(paletteEntry));
  const records = [];
  let nextId = 0;
  let selectedId = null;
  let viewport = CONSOLE_SANDBOX_DEFAULT_VIEWPORT;
  let destroyed = false;

  function snapshotCard(record, position = records.indexOf(record)) {
    return record ? cardSnapshot(record, position) : null;
  }

  function getSnapshot() {
    return Object.freeze({
      viewport,
      selectedId,
      palette,
      zones: Object.freeze(CONSOLE_SANDBOX_DROP_ZONES.map(zone => Object.freeze({
        ...zone,
        instanceIds: Object.freeze(records.filter(record => record.zoneId === zone.id).map(record => record.id)),
        empty: !records.some(record => record.zoneId === zone.id),
      }))),
      instances: Object.freeze(records.map((record, position) => snapshotCard(record, position))),
    });
  }

  function emit() {
    onChange(getSnapshot());
  }

  function recordFor(id) {
    const record = records.find(item => item.id === id);
    if (!record) throw new Error(`Unknown Console Sandbox instance: ${id}`);
    return record;
  }

  function validateDrop({ widget, layout = {}, zoneId } = {}) {
    const definition = definitionFor(registry, widget);
    const zone = zoneForId(zoneId);
    if (!zone) return Object.freeze({ valid: false, reason: `Unknown drop zone: ${zoneId}`, zoneId });
    const shape = definition.shape === "square" || definition.type === "sky" ? "square" : "oriented";
    if (shape === "square" && zone.mode !== "square") {
      return Object.freeze({ valid: false, reason: "Sky can only be placed in the square zone", zoneId, mode: zone.mode });
    }
    if (shape !== "square" && zone.mode === "square") {
      return Object.freeze({ valid: false, reason: "Only square widgets can be placed in the square zone", zoneId, mode: zone.mode });
    }
    const requested = convertLayout(layoutWithDefaults(definition, layout), zone.mode);
    const normalized = normalizeSandboxLayout(definition, requested, limits);
    return Object.freeze({
      valid: normalized.valid,
      reason: normalized.error,
      zoneId,
      mode: zone.mode,
      layout: normalized,
    });
  }

  function createInstance({ widget, config = {}, layout = {}, zoneId = null } = {}) {
    assertLive(destroyed);
    const definition = definitionFor(registry, widget);
    const requestedZoneId = zoneId || (zoneForId(layout.mode)?.id || defaultZoneFor(definition));
    const drop = validateDrop({ widget, layout, zoneId: requestedZoneId });
    if (!drop.valid && (!zoneForId(requestedZoneId) || (definition.shape === "square" || definition.type === "sky") !== (requestedZoneId === "square"))) {
      throw Object.assign(new Error(drop.reason), { code: "CONSOLE_SANDBOX_INVALID_DROP", reason: drop.reason });
    }
    const normalized = normalizeCard(registry, widget, config, drop.valid ? drop.layout : layout, limits);
    const record = {
      id: `console-sandbox-${++nextId}`,
      widget: normalized.definition.type,
      config: normalized.config,
      layout: normalized.layout,
      zoneId: requestedZoneId,
      state: normalized.state,
      error: normalized.error,
    };
    records.push(record);
    selectedId = record.id;
    emit();
    return snapshotCard(record);
  }

  function updateInstance(id, { config, layout } = {}) {
    assertLive(destroyed);
    const record = recordFor(id);
    const requestedLayout = {
      ...record.layout,
      ...(isObject(layout) ? layout : {}),
      ...(isObject(layout) && layout.unit === undefined && (layout.width !== undefined || layout.height !== undefined) ? { unit: "px" } : {}),
    };
    const nextZoneId = zoneForId(requestedLayout.mode)?.id || record.zoneId;
    const drop = validateDrop({ widget: record.widget, layout: requestedLayout, zoneId: nextZoneId });
    if (!drop.valid) throw Object.assign(new Error(drop.reason), { code: "CONSOLE_SANDBOX_INVALID_DROP", reason: drop.reason });
    const next = normalizeCard(
      registry,
      record.widget,
      { ...record.config, ...(isObject(config) ? config : {}) },
      drop.layout,
      limits,
    );
    record.config = next.config;
    record.layout = next.layout;
    record.zoneId = nextZoneId;
    record.state = next.state;
    record.error = next.error;
    emit();
    return snapshotCard(record);
  }

  function setRuntimeState(id, state, error = null) {
    assertLive(destroyed);
    assertState(state);
    const record = recordFor(id);
    record.state = state;
    record.error = error ? (error instanceof Error ? error.message : String(error)) : null;
    return snapshotCard(record);
  }

  function retryInstance(id) {
    assertLive(destroyed);
    const record = recordFor(id);
    record.state = record.layout.valid ? "idle" : "invalid";
    record.error = record.layout.valid ? null : record.layout.error;
    emit();
    return snapshotCard(record);
  }

  function select(id) {
    assertLive(destroyed);
    recordFor(id);
    selectedId = id;
    emit();
    return snapshotCard(recordFor(id));
  }

  function dropInstance(id, zoneId) {
    assertLive(destroyed);
    const record = recordFor(id);
    const drop = validateDrop({ widget: record.widget, layout: record.layout, zoneId });
    if (!drop.valid) throw Object.assign(new Error(drop.reason), {
      code: "CONSOLE_SANDBOX_INVALID_DROP",
      reason: drop.reason,
      sourceId: id,
      zoneId,
    });
    if (record.zoneId === zoneId && record.layout.mode === drop.mode) return snapshotCard(record);
    const next = normalizeCard(registry, record.widget, record.config, drop.layout, limits);
    record.layout = next.layout;
    record.config = next.config;
    record.zoneId = zoneId;
    record.state = next.state;
    record.error = next.error;
    selectedId = id;
    emit();
    return snapshotCard(record);
  }

  function addToZone(widget, zoneId, config = {}) {
    return createInstance({ widget, config, zoneId });
  }

  function move(id, delta) {
    assertLive(destroyed);
    const index = records.indexOf(recordFor(id));
    if (!Number.isInteger(delta)) throw new TypeError("Console Sandbox move delta must be an integer");
    const target = Math.max(0, Math.min(records.length - 1, index + delta));
    if (target !== index) {
      const [record] = records.splice(index, 1);
      records.splice(target, 0, record);
      emit();
    }
    return snapshotCard(records[target], target);
  }

  function remove(id) {
    assertLive(destroyed);
    const index = records.indexOf(recordFor(id));
    const [removed] = records.splice(index, 1);
    if (selectedId === id) selectedId = records[index]?.id || records[index - 1]?.id || null;
    emit();
    return snapshotCard(removed, index);
  }

  function resetCard(id) {
    return remove(id);
  }

  function resetAll() {
    assertLive(destroyed);
    records.splice(0, records.length);
    selectedId = null;
    emit();
    return getSnapshot();
  }

  function setViewport(nextViewport) {
    assertLive(destroyed);
    if (!CONSOLE_SANDBOX_VIEWPORTS.includes(nextViewport)) {
      throw new TypeError(`Viewport must be one of: ${CONSOLE_SANDBOX_VIEWPORTS.join(", ")}`);
    }
    viewport = nextViewport;
    emit();
    return getSnapshot();
  }

  function destroy() {
    if (destroyed) return;
    records.splice(0, records.length);
    selectedId = null;
    destroyed = true;
    emit();
  }

  return Object.freeze({
    createInstance,
    addToZone,
    updateInstance,
    validateDrop,
    dropInstance,
    setRuntimeState,
    retryInstance,
    select,
    move,
    remove,
    resetCard,
    resetAll,
    setViewport,
    destroy,
    getPalette: () => palette,
    getDropZones: () => CONSOLE_SANDBOX_DROP_ZONES,
    getDefinition: widget => definitionFor(registry, widget),
    getInstance: id => snapshotCard(records.find(item => item.id === id)),
    getSnapshot,
  });
}

export { normalizeWidgetConfig };
export default createConsoleSandboxModel;
