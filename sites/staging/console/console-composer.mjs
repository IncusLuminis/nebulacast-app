import { createNebulacast } from "../shared/widget-runtime.mjs";
import { createCatalogRegistry } from "../shared/widget-catalog.mjs";
import { consoleConfig } from "./console-config.mjs";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sameValue(left, right, seen = new Set()) {
  if (Object.is(left, right)) return true;
  if (typeof left !== typeof right || left === null || right === null) return false;
  if (typeof left !== "object") return false;
  if (seen.has(left)) return true;
  seen.add(left);
  const leftKeys = Object.keys(left), rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every(key => Object.prototype.hasOwnProperty.call(right, key) && sameValue(left[key], right[key], seen));
}

function slotsFrom(config) {
  const slots = Array.isArray(config) ? config : config?.slots;
  if (!Array.isArray(slots)) throw new TypeError("Console Composer config requires a slots array");
  return slots.map(slot => {
    if (!isObject(slot) || typeof slot.id !== "string" || typeof slot.selector !== "string" || typeof slot.widget !== "string") {
      throw new TypeError("Console Composer slots require id, selector, and widget");
    }
    return { ...slot, config: isObject(slot.config) ? slot.config : {} };
  });
}

function errorFor(message) {
  return message instanceof Error ? message : new Error(String(message));
}

/**
 * Reconcile declarative Console slots against the shared Widget Runtime.
 * The composer owns slot membership; widget instances own their roots.
 */
export function createConsoleComposer({
  context,
  runtime = null,
  registry = createCatalogRegistry(),
  documentRef = globalThis.document,
  config = consoleConfig,
  resolveRoot = selector => documentRef?.querySelector?.(selector) || null,
  resolveConfig = null,
  configOverrides = {},
  resolveAutoOrientation,
} = {}) {
  const widgetRuntime = runtime || createNebulacast({ context, registry, resolveAutoOrientation });
  let desiredConfig = config;
  let destroyed = false;
  let operation = Promise.resolve();
  const records = new Map();
  const errors = new Map();

  function slotConfig(slot) {
    const resolved = typeof resolveConfig === "function" ? resolveConfig(slot, slot.config) : {};
    return { ...slot.config, ...(configOverrides[slot.id] || {}), ...(resolved || {}) };
  }

  async function dispose(record) {
    try {
      await record.instance?.destroy?.();
    } catch (error) {
      errors.set(record.id, errorFor(error));
    }
  }

  async function reconcile(nextConfig) {
    const slots = slotsFrom(nextConfig);
    const desiredIds = new Set(slots.map(slot => slot.id));

    for (const [id, record] of records) {
      if (!desiredIds.has(id)) {
        await dispose(record);
        records.delete(id);
        errors.delete(id);
      }
    }
    for (const id of errors.keys()) {
      if (!desiredIds.has(id)) errors.delete(id);
    }

    for (const slot of slots) {
      const root = resolveRoot(slot.selector, slot);
      const effectiveConfig = slotConfig(slot);
      const previous = records.get(slot.id);
      if (previous && previous.root === root && previous.widget === slot.widget && sameValue(previous.config, effectiveConfig)) continue;
      if (previous) {
        await dispose(previous);
        records.delete(slot.id);
      }
      if (!root) {
        errors.set(slot.id, errorFor(`Console slot root not found: ${slot.selector}`));
        continue;
      }
      try {
        const instance = await widgetRuntime.mount(root, { widget: slot.widget, config: effectiveConfig });
        records.set(slot.id, { id: slot.id, selector: slot.selector, widget: slot.widget, root, config: effectiveConfig, instance });
        errors.delete(slot.id);
      } catch (error) {
        errors.set(slot.id, errorFor(error));
      }
    }

    return snapshot();
  }

  function enqueue(work) {
    operation = operation.catch(() => undefined).then(work);
    return operation;
  }

  function snapshot() {
    return {
      instances: new Map([...records].map(([id, record]) => [id, record.instance])),
      errors: new Map(errors),
      slots: slotsFrom(desiredConfig),
    };
  }

  return Object.freeze({
    mount(nextConfig = desiredConfig) {
      if (destroyed) return Promise.reject(new Error("Console Composer is destroyed"));
      desiredConfig = nextConfig;
      return enqueue(() => reconcile(desiredConfig));
    },
    destroy() {
      if (destroyed) return operation;
      destroyed = true;
      return enqueue(async () => {
        for (const record of records.values()) await dispose(record);
        records.clear();
      });
    },
    getInstance(id) {
      return records.get(id)?.instance;
    },
    getInstances() {
      return new Map([...records].map(([id, record]) => [id, record.instance]));
    },
    getErrors() {
      return new Map(errors);
    },
    getSnapshot: snapshot,
  });
}

export const mountConsole = createConsoleComposer;

export default createConsoleComposer;
