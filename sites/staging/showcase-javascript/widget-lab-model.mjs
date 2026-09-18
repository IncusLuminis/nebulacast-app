import { createWidgetConfig } from "../shared/widget-config.mjs";

export const WIDGET_LAB_STATES = Object.freeze([
  "idle",
  "loading",
  "ready",
  "error",
  "timeout",
  "destroyed",
]);

export const WIDGET_LAB_LAYOUT = Object.freeze({
  minDimension: 160,
  maxDimension: 1600,
});

const STATE_SET = new Set(WIDGET_LAB_STATES);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function freezeSnapshot(instance) {
  return Object.freeze({
    id: instance.id,
    widget: instance.widget,
    config: Object.freeze({ ...instance.config }),
    runtimeConfig: Object.freeze({ ...instance.runtimeConfig }),
    layout: Object.freeze({ ...instance.layout }),
    preview: instance.preview,
    state: instance.state,
    error: instance.error,
  });
}

function normalizeDimension(value, key, limits) {
  const number = typeof value === "number" && Number.isFinite(value) ? value : Number(value);
  if (!Number.isInteger(number)) return { value: number, error: `${key} must be a finite integer` };
  if (number < limits.minDimension || number > limits.maxDimension) {
    return { value: number, error: `${key} must be between ${limits.minDimension} and ${limits.maxDimension}` };
  }
  return { value: number, error: null };
}

function shapeFor(definition) {
  if (definition?.shape === "square" || definition?.type === "sky") return "square";
  return "oriented";
}

function modesFor(definition) {
  return shapeFor(definition) === "square" ? ["square"] : ["horizontal", "vertical"];
}

/**
 * Validate the host-owned rectangle. The widget config is deliberately not
 * involved: layout is a Sandbox concern and never becomes an arbitrary
 * widget option.
 */
export function validateWidgetLabLayout(definition, requested = {}, limits = WIDGET_LAB_LAYOUT) {
  if (!isObject(requested)) throw new TypeError("Widget Lab layout must be an object");
  const shape = shapeFor(definition);
  const modes = modesFor(definition);
  const mode = requested.mode === undefined ? modes[0] : requested.mode;
  const widthResult = normalizeDimension(requested.width, "Width", limits);
  const heightResult = normalizeDimension(requested.height, "Height", limits);
  let error = modes.includes(mode) ? (widthResult.error || heightResult.error) : `Mode must be one of: ${modes.join(", ")}`;
  if (!error && shape === "square" && widthResult.value !== heightResult.value) {
    error = "Sky requires a square container: width must equal height";
  }
  if (!error && mode === "horizontal" && widthResult.value <= heightResult.value) {
    error = "Horizontal widgets require width greater than height";
  }
  if (!error && mode === "vertical" && heightResult.value <= widthResult.value) {
    error = "Vertical widgets require height greater than width";
  }
  return Object.freeze({
    mode,
    shape,
    width: widthResult.value,
    height: heightResult.value,
    valid: !error,
    error,
  });
}

function assertState(state) {
  if (!STATE_SET.has(state)) throw new TypeError(`Unknown Widget Lab state: ${state}`);
}

function assertRuntime(runtime) {
  if (!runtime || typeof runtime.mount !== "function") {
    throw new TypeError("Widget Lab requires a Widget Runtime");
  }
}

/**
 * Host-owned multi-instance lifecycle model for the Showcase Widget Lab.
 * Rendering controls and the Preview Stage are intentionally separate; this
 * module owns identities, validated layout, pending mounts, and cleanup.
 */
export function createWidgetLabModel({
  registry,
  runtime,
  rootForInstance,
  limits = WIDGET_LAB_LAYOUT,
  timeoutMs = 15000,
  onChange = () => {},
} = {}) {
  if (!registry || typeof registry.get !== "function") throw new TypeError("Widget Lab requires a Widget Registry");
  assertRuntime(runtime);
  if (typeof rootForInstance !== "function") throw new TypeError("Widget Lab requires rootForInstance(instance)");
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new TypeError("Widget Lab timeout must be positive");
  if (typeof onChange !== "function") throw new TypeError("Widget Lab onChange must be a function");

  const records = new Map();
  const pending = new Map();
  let nextId = 0;
  let selectedId = null;
  let destroyed = false;

  function emit() {
    onChange(getSnapshot());
  }

  function definitionFor(widget) {
    const definition = registry.get(widget);
    if (!definition) throw new Error(`Unknown widget type: ${widget}`);
    return definition;
  }

  function snapshot(record) {
    return record ? freezeSnapshot(record) : null;
  }

  function getSnapshot() {
    return Object.freeze({
      selectedId,
      instances: new Map([...records].map(([id, record]) => [id, snapshot(record)])),
    });
  }

  function getRecord(id) {
    const record = records.get(id);
    if (!record) throw new Error(`Unknown Widget Lab instance: ${id}`);
    return record;
  }

  function setState(record, state, error = null) {
    assertState(state);
    record.state = state;
    record.error = error ? (error instanceof Error ? error.message : String(error)) : null;
    emit();
  }

  function createInstance({ widget, config = {}, layout = {} } = {}) {
    if (destroyed) throw new Error("Widget Lab is destroyed");
    const definition = definitionFor(widget);
    const normalizedLayout = validateWidgetLabLayout(definition, layout, limits);
    const mode = normalizedLayout.mode;
    const normalizedConfig = createWidgetConfig(registry, widget, {
      ...config,
      // Runtime needs a requested orientation; the public model still keeps
      // layout/mode in its own field and never accepts arbitrary layout keys.
      orientation: mode === "square" ? "auto" : mode,
    });
    const record = {
      id: `sandbox-${++nextId}`,
      widget: definition.type,
      config: normalizedConfig.config,
      runtimeConfig: { ...normalizedConfig.config },
      layout: normalizedLayout,
      preview: "closed",
      state: "idle",
      error: normalizedLayout.valid ? null : normalizedLayout.error,
      runtimeInstance: null,
      generation: 0,
    };
    records.set(record.id, record);
    selectedId = record.id;
    emit();
    return snapshot(record);
  }

  async function destroyRuntime(record) {
    const instance = record.runtimeInstance;
    record.runtimeInstance = null;
    if (!instance) return;
    await instance.destroy?.();
  }

  async function mount(id, { force = false } = {}) {
    if (destroyed) throw new Error("Widget Lab is destroyed");
    const record = getRecord(id);
    if (!record.layout.valid) {
      setState(record, "idle", record.layout.error);
      return snapshot(record);
    }
    if (!force && record.state === "ready" && record.runtimeInstance) return snapshot(record);
    if (pending.has(id)) return pending.get(id);

    const generation = ++record.generation;
    await destroyRuntime(record);
    if (!records.has(id) || record.generation !== generation) return snapshot(record);
    setState(record, "loading");
    const root = rootForInstance(snapshot(record));
    if (!root || typeof root !== "object") throw new TypeError(`No preview root for ${id}`);
    const mountPromise = Promise.resolve().then(() => runtime.mount(root, {
      widget: record.widget,
      config: record.runtimeConfig,
    }));
    let timer;
    const request = Promise.race([
      mountPromise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(Object.assign(new Error(`Widget ${record.widget} preview timed out`), { code: "WIDGET_LAB_TIMEOUT" })), timeoutMs);
      }),
    ]).then(async instance => {
      if (!records.has(id) || record.generation !== generation || record.state === "destroyed") {
        await instance?.destroy?.();
        return snapshot(record);
      }
      record.runtimeInstance = instance || null;
      setState(record, "ready");
      return snapshot(record);
    }).catch(async error => {
      if (!records.has(id) || record.generation !== generation || record.state === "destroyed") {
        if (error?.code !== "WIDGET_LAB_TIMEOUT") return snapshot(record);
        mountPromise.then(instance => instance?.destroy?.()).catch(() => {});
        return snapshot(record);
      }
      if (error?.code === "WIDGET_LAB_TIMEOUT") {
        setState(record, "timeout", error);
        // A late loader result must never become an orphaned active instance.
        mountPromise.then(instance => instance?.destroy?.()).catch(() => {});
      } else {
        setState(record, "error", error);
      }
      return snapshot(record);
    }).finally(() => {
      clearTimeout(timer);
      if (pending.get(id) === request) pending.delete(id);
    });
    pending.set(id, request);
    return request;
  }

  async function openPreview(id) {
    const record = getRecord(id);
    record.preview = "open";
    emit();
    return mount(id);
  }

  function closePreview(id) {
    const record = getRecord(id);
    record.preview = "closed";
    emit();
    return snapshot(record);
  }

  async function update(id, { config, layout } = {}) {
    if (destroyed) throw new Error("Widget Lab is destroyed");
    const record = getRecord(id);
    const definition = definitionFor(record.widget);
    const nextLayout = validateWidgetLabLayout(definition, layout ? { ...record.layout, ...layout } : record.layout, limits);
    const nextConfig = createWidgetConfig(registry, record.widget, {
      ...record.config,
      ...(isObject(config) ? config : {}),
      orientation: nextLayout.mode === "square" ? "auto" : nextLayout.mode,
    });
    record.config = nextConfig.config;
    record.runtimeConfig = { ...nextConfig.config };
    record.layout = nextLayout;
    record.generation++;
    // Invalidate, but do not await, an old loader: a caller must be able to
    // repair or reset a hanging instance without waiting for its timeout.
    pending.delete(id);
    await destroyRuntime(record);
    setState(record, "idle", nextLayout.valid ? null : nextLayout.error);
    emit();
    if (record.preview === "open" && nextLayout.valid) return mount(id, { force: true });
    return snapshot(record);
  }

  async function retry(id) {
    return mount(id, { force: true });
  }

  async function destroyInstance(id) {
    const record = getRecord(id);
    record.generation++;
    pending.delete(id);
    await destroyRuntime(record);
    record.preview = "closed";
    setState(record, "destroyed");
    emit();
    return snapshot(record);
  }

  async function reset(id) {
    const record = getRecord(id);
    await destroyInstance(id);
    records.delete(id);
    if (selectedId === id) selectedId = records.keys().next().value || null;
    emit();
    return snapshot(record);
  }

  async function resetAll() {
    await Promise.all([...records.keys()].map(id => destroyInstance(id)));
    records.clear();
    selectedId = null;
    emit();
  }

  async function destroy() {
    if (destroyed) return;
    destroyed = true;
    await Promise.all([...records.keys()].map(id => destroyInstance(id)));
    records.clear();
    selectedId = null;
    pending.clear();
    emit();
  }

  return Object.freeze({
    createInstance,
    mount,
    openPreview,
    closePreview,
    update,
    retry,
    select(id) {
      getRecord(id);
      selectedId = id;
      emit();
      return snapshot(records.get(id));
    },
    destroyInstance,
    reset,
    resetAll,
    destroy,
    getInstance: id => snapshot(records.get(id)),
    getInstances: () => new Map([...records].map(([id, record]) => [id, snapshot(record)])),
    getSnapshot,
  });
}

export default createWidgetLabModel;
