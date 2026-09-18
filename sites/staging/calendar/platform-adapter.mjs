import "../assets/js/widget_runtime.js";

export function mount(root, _context, config, _host) {
  const runtime = globalThis.NebulacastWidgetRuntime;
  if (!runtime || typeof runtime.mountCalendarWidget !== "function") {
    throw new TypeError("Events canonical runtime is unavailable");
  }
  return runtime.mountCalendarWidget(root, config);
}
