/** Small lifecycle helper shared by mounted widgets. */
export function createLifecycle({ onError } = {}) {
  if (onError !== undefined && typeof onError !== "function") {
    throw new TypeError("createLifecycle onError must be a function");
  }
  const cleanups = new Set();
  let disposed = false;
  return {
    add(cleanup) {
      if (typeof cleanup !== "function") return cleanup;
      if (disposed) { cleanup(); return cleanup; }
      cleanups.add(cleanup);
      return cleanup;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      const hookErrors = [];
      try {
        for (const cleanup of cleanups) {
          try { cleanup(); } catch (error) {
            console.warn("[widget] dispose failed", error);
            if (onError) {
              try { onError({ error, phase: "dispose" }); } catch (hookError) { hookErrors.push(hookError); }
            }
          }
        }
      } finally {
        cleanups.clear();
      }
      if (hookErrors.length === 1) throw hookErrors[0];
      if (hookErrors.length > 1) throw new AggregateError(hookErrors, "Widget cleanup reporting failed");
    }
  };
}
