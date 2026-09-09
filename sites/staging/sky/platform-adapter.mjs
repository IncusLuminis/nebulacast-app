/**
 * Platform adapter for the explicit Sky mount.
 *
 * Rendering and data loading remain owned by sky/widget.js. Legacy standalone
 * bootstrap is a separate compatibility entrypoint.
 */

function requireContext(context) {
  if (!context || typeof context.get !== "function" || typeof context.subscribe !== "function") {
    throw new TypeError("Sky platform adapter requires Platform Context");
  }
}

let skyModulePromise;

function loadSkyModule() {
  if (!skyModulePromise) skyModulePromise = import("./widget.js");
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
