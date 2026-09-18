import { createWidgetRegistry } from "../../sites/staging/shared/widget-registry.mjs";
import { createNebulacast } from "../../sites/staging/shared/widget-runtime.mjs";
import { createFakeContext, createFakeRoot } from "./widget-runtime-fixture.mjs";
import {
  createDeterministicWidgetDefinition,
  LIFECYCLE_FOUNDATION_TYPE,
  LIFECYCLE_FIXTURE_TYPE,
} from "./widget-lifecycle-fixture.mjs";
import { createBrokenWidgetDefinition } from "./widget-lifecycle-broken-fixture.mjs";

export const RESOURCE_KINDS = Object.freeze([
  "timers",
  "observers",
  "listeners",
  "subscriptions",
  "requests",
]);

export function createResourceLedger() {
  const active = new Map(RESOURCE_KINDS.map(kind => [kind, new Set()]));

  return {
    acquire(kind, owner) {
      if (!active.has(kind)) throw new TypeError(`Unknown resource kind: ${kind}`);
      const token = { kind, owner, released: false };
      active.get(kind).add(token);
      return () => {
        if (token.released) return;
        token.released = true;
        active.get(kind).delete(token);
      };
    },
    snapshot() {
      return Object.fromEntries(RESOURCE_KINDS.map(kind => [kind, active.get(kind).size]));
    },
    total() {
      return RESOURCE_KINDS.reduce((total, kind) => total + active.get(kind).size, 0);
    },
  };
}

function lifecycleError(instanceOrType, phase, error) {
  const type = typeof instanceOrType === "string" ? instanceOrType : instanceOrType.type;
  const wrapped = new Error(`[widget:${type}] ${phase}: ${error.message}`, { cause: error });
  wrapped.widgetType = type;
  wrapped.lifecyclePhase = phase;
  return wrapped;
}

export function createWidgetLifecycleHarness({
  includeBroken = false,
  context: suppliedContext,
  definitions: suppliedDefinitions,
  ledger: suppliedLedger,
  rootFactory = createFakeRoot,
} = {}) {
  const ledger = suppliedLedger || createResourceLedger();
  const events = [];
  const context = suppliedContext || createFakeContext({
    observer: { name: "Harness observer", lat: 52.2297, lon: 21.0122, timezone: "Europe/Warsaw" },
    time: { mode: "live", datetimeISO: "2026-09-09T12:00:00Z" },
  });
  const definitions = suppliedDefinitions ? [...suppliedDefinitions] : [
    createDeterministicWidgetDefinition({ ledger, events, type: LIFECYCLE_FIXTURE_TYPE }),
    createDeterministicWidgetDefinition({ ledger, events, type: LIFECYCLE_FOUNDATION_TYPE }),
  ];
  if (includeBroken) definitions.push(createBrokenWidgetDefinition({ ledger, events }));
  const runtime = createNebulacast({
    context,
    registry: createWidgetRegistry(definitions),
  });
  const roots = {
    one: rootFactory("harness-one"),
    two: rootFactory("harness-two"),
    foundationOne: rootFactory("harness-foundation-one"),
    foundationTwo: rootFactory("harness-foundation-two"),
    sibling: rootFactory("harness-sibling"),
    foundationSibling: rootFactory("harness-foundation-sibling"),
    broken: rootFactory("harness-broken"),
  };

  async function mount(root, specification = {}) {
    const widget = specification.widget || LIFECYCLE_FIXTURE_TYPE;
    try {
      return await runtime.mount(root, { ...specification, widget });
    } catch (error) {
      throw lifecycleError(widget, "mount", error);
    }
  }

  function call(instance, phase, ...args) {
    try {
      const result = instance[phase](...args);
      if (result && typeof result.then === "function") {
        return result.catch(error => { throw lifecycleError(instance, phase, error); });
      }
      return result;
    } catch (error) {
      throw lifecycleError(instance, phase, error);
    }
  }

  return Object.freeze({
    context,
    events,
    ledger,
    roots,
    runtime,
    mount,
    update: (instance, patch) => call(instance, "update", patch),
    resize: (instance, ...args) => call(instance, "resize", ...args),
    refresh: (instance, ...args) => call(instance, "refresh", ...args),
    destroy: instance => call(instance, "destroy"),
  });
}
