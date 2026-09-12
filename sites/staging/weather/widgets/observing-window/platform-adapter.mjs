/** Platform adapter for the Dashboard Best observing window widget. */

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireContext(context) {
  if (!isObject(context) || typeof context.get !== "function" ||
      typeof context.subscribe !== "function" || typeof context.update !== "function") {
    throw new TypeError("Observing Window platform adapter requires Platform Context");
  }
}

function createContextFacade(context) {
  let disposed = false;
  return {
    get: () => context.get(),
    subscribe(listener) {
      if (typeof listener !== "function") throw new TypeError("Observing Window subscriber must be a function");
      const unsubscribe = context.subscribe(state => { if (!disposed) listener(state); });
      return () => unsubscribe?.();
    },
    dispose() { disposed = true; },
  };
}

export async function mount(root, context, config = {}, host) {
  requireContext(context);
  const module = await import("./observing-window.js");
  if (typeof module.mountObservingWindow !== "function") {
    throw new TypeError("Observing Window implementation does not export mountObservingWindow");
  }

  const configRef = { ...config };
  const facade = createContextFacade(context);
  let mounted;
  try {
    mounted = await module.mountObservingWindow(root, facade, configRef, host);
  } catch (error) {
    facade.dispose();
    throw error;
  }
  let destroyed = false;
  const destroy = () => {
    if (destroyed) return undefined;
    destroyed = true;
    facade.dispose();
    return mounted?.destroy?.();
  };

  return {
    update(patch) {
      if (destroyed) return undefined;
      if (isObject(patch)) Object.assign(configRef, patch);
      return mounted?.update?.(patch);
    },
    resize(size) {
      if (!destroyed) return mounted?.resize?.(size);
      return undefined;
    },
    refresh() {
      if (!destroyed) return mounted?.refresh?.();
      return undefined;
    },
    destroy,
    unmount: destroy,
  };
}
