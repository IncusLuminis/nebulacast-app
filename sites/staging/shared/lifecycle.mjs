/** Small lifecycle helper shared by mounted widgets. */
export function createLifecycle() {
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
      for (const cleanup of cleanups) {
        try { cleanup(); } catch (error) { console.warn("[widget] dispose failed", error); }
      }
      cleanups.clear();
    }
  };
}
