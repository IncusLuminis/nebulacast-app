import {
  buildIframeEmbedSnippet,
  createWidgetConfig,
  JAVASCRIPT_EMBED_MODULE_PATH,
  serializeJavascriptEmbedSpecification,
} from "../shared/widget-config.mjs";

function layoutOf(instance) {
  return {
    mode: instance.layout.mode,
    width: instance.layout.width,
    height: instance.layout.height,
  };
}

/** Build the two public outputs for one normalized Widget Lab instance. */
export function createWidgetLabOutputs(registry, instance) {
  if (!instance || !registry?.get) return Object.freeze({ javascript: null, iframe: null });
  if (instance.layout?.valid === false) return Object.freeze({ javascript: null, iframe: null });
  const definition = registry.get(instance.widget);
  if (!definition) throw new Error(`Unknown widget type: ${instance.widget}`);
  const configExport = createWidgetConfig(registry, instance.widget, instance.config);
  const layout = layoutOf(instance);
  const outputs = { javascript: null, iframe: null };
  if (definition.divEmbed === true) {
    const specification = serializeJavascriptEmbedSpecification(registry, {
      widget: instance.widget,
      config: configExport.config,
      layout,
    });
    outputs.javascript = `import { mount } from "${JAVASCRIPT_EMBED_MODULE_PATH}";\n\nconst root = document.querySelector("#widget-root");\nmount(root, ${specification});`;
  }
  if (definition.standaloneHost === true) {
    outputs.iframe = buildIframeEmbedSnippet(registry, configExport, {
      title: definition.title || definition.type,
      layout,
    });
  }
  return Object.freeze(outputs);
}

export default createWidgetLabOutputs;
