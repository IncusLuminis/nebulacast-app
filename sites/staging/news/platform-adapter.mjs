import "../assets/js/widget_runtime.js";

export function mount(root, _context, config, _host) {
  const runtime = globalThis.NebulacastWidgetRuntime;
  if (!runtime || typeof runtime.mountNewsWidget !== "function") {
    throw new TypeError("News canonical runtime is unavailable");
  }
  return runtime.mountNewsWidget(root, config);
}
