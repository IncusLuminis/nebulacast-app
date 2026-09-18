import { createWidgetConfig, getWidgetOptionValues } from "../shared/widget-config.mjs";
import { validateWidgetLabLayout } from "./widget-lab-model.mjs";

export const WIDGET_LAB_DIMENSION_PRESETS = Object.freeze({
  square: Object.freeze([{ width: 400, height: 400 }]),
  horizontal: Object.freeze([{ width: 640, height: 360 }, { width: 960, height: 540 }]),
  vertical: Object.freeze([{ width: 360, height: 640 }, { width: 540, height: 960 }]),
});

function freezeOptions(registry, definition) {
  return Object.freeze(Object.fromEntries(
    Object.keys(definition.supportedOptions || {})
      .filter(key => key !== "orientation")
      .map(key => [key, Object.freeze(getWidgetOptionValues(registry, definition.type, key))])
      .filter(([, values]) => values.length > 0),
  ));
}

/** Return the single Registry-derived public control contract for a widget. */
export function getWidgetLabInspectorMetadata(registry, widget) {
  const definition = registry?.get?.(widget);
  if (!definition) throw new Error(`Unknown widget type: ${widget}`);
  const expectedModes = definition.shape === "square" ? ["square"] : ["horizontal", "vertical"];
  if (definition.shape !== "square" && definition.shape !== "oriented") {
    throw new TypeError(`Widget ${widget} has an unsupported shape`);
  }
  if (JSON.stringify(definition.userModes) !== JSON.stringify(expectedModes)) {
    throw new TypeError(`Widget ${widget} has an invalid public mode contract`);
  }
  return Object.freeze({
    type: definition.type,
    title: definition.title,
    version: definition.version,
    shape: definition.shape,
    modes: Object.freeze([...definition.userModes]),
    options: freezeOptions(registry, definition),
  });
}

/**
 * Normalize inspector input while keeping host layout outside widget options.
 * The internal Runtime orientation is derived from mode; user-facing `auto`
 * is never accepted as a layout mode here.
 */
export function normalizeWidgetLabInspector(registry, widget, { mode, width, height, options = {} } = {}) {
  const metadata = getWidgetLabInspectorMetadata(registry, widget);
  const layout = validateWidgetLabLayout(registry.get(widget), { mode, width, height });
  const requested = { ...options, orientation: layout.mode === "square" ? "auto" : layout.mode };
  const config = createWidgetConfig(registry, widget, requested);
  return Object.freeze({
    widget,
    config,
    layout,
    metadata,
  });
}

export default getWidgetLabInspectorMetadata;
