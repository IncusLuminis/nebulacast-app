import { createWidgetConfig, normalizeWidgetConfig } from "../shared/widget-config.mjs";
import {
  WIDGET_LAB_LAYOUT,
  validateWidgetLabLayout,
} from "../showcase/widget-lab-model.mjs";

export const CONSOLE_SANDBOX_VIEWPORTS = Object.freeze(["desktop", "narrow"]);
export const CONSOLE_SANDBOX_DEFAULT_VIEWPORT = "desktop";
export const CONSOLE_SANDBOX_STATES = Object.freeze(["idle", "invalid", "loading", "ready", "error", "timeout", "destroyed"]);

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
    return { mode: "square", width: 400, height: 400 };
  }
  return { mode: "horizontal", width: 640, height: 360 };
}

function freezeConfig(config) {
  return Object.freeze({ ...config });
}

function normalizeCard(registry, widget, config = {}, layout = {}, limits = WIDGET_LAB_LAYOUT) {
  const definition = definitionFor(registry, widget);
  const normalizedLayout = validateWidgetLabLayout(
    definition,
    { ...defaultLayout(definition), ...(isObject(layout) ? layout : {}) },
    limits,
  );
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
 * It owns palette metadata, card identity/order/selection, validated host
 * layouts, and normalized widget config. Runtime mounting is deliberately
 * handled by the page layer in the next delivery story.
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

  function createInstance({ widget, config = {}, layout = {} } = {}) {
    assertLive(destroyed);
    const normalized = normalizeCard(registry, widget, config, layout, limits);
    const record = {
      id: `console-sandbox-${++nextId}`,
      widget: normalized.definition.type,
      config: normalized.config,
      layout: normalized.layout,
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
    const next = normalizeCard(
      registry,
      record.widget,
      { ...record.config, ...(isObject(config) ? config : {}) },
      { ...record.layout, ...(isObject(layout) ? layout : {}) },
      limits,
    );
    record.config = next.config;
    record.layout = next.layout;
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
    updateInstance,
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
    getDefinition: widget => definitionFor(registry, widget),
    getInstance: id => snapshotCard(records.find(item => item.id === id)),
    getSnapshot,
  });
}

export { normalizeWidgetConfig };
export default createConsoleSandboxModel;
