/**
 * Platform adapter for the explicit Sky mount.
 *
 * The query-qualified import keeps the legacy self-bootstrap out of Runtime
 * mounts. Rendering and data loading remain owned by sky/widget.js.
 */

function requireContext(context) {
  if (!context || typeof context.get !== "function" || typeof context.subscribe !== "function") {
    throw new TypeError("Sky platform adapter requires Platform Context");
  }
}

let skyModulePromise;

function loadSkyModule() {
  if (!skyModulePromise) skyModulePromise = import("./widget.js?platform=1");
  return skyModulePromise;
}

export async function mount(root, context, config = {}, host) {
  requireContext(context);
  const module = await loadSkyModule();
  if (typeof module.mountSky !== "function") {
    throw new TypeError("Sky legacy module does not export mountSky");
  }
  return module.mountSky(root, context, config, host);
}
