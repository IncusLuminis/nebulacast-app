function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function requireContext(context) {
  if (!isObject(context) || typeof context.get !== "function" ||
      typeof context.subscribe !== "function" || typeof context.update !== "function") {
    throw new TypeError("Solar Activity platform adapter requires Platform Context");
  }
}
export async function mount(root, context, config = {}, host) {
  requireContext(context);
  const module = await import("./solar-activity.js");
  const mounted = await module.mountSolarActivity(root, context, { ...config }, host);
  let destroyed = false;
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    mounted.destroy?.();
  };
  return {
    update(patch) { return destroyed ? undefined : mounted.update?.(patch); },
    resize(size) { return destroyed ? undefined : mounted.resize?.(size); },
    refresh() { return destroyed ? undefined : mounted.refresh?.(); },
    destroy,
    unmount: destroy,
  };
}
