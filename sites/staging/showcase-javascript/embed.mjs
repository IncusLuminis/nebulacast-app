import { createCatalogRegistry, widgetCatalog } from "../shared/widget-catalog.mjs";
import {
  buildIframeEmbedSnippet,
  createWidgetConfig,
  getWidgetOptionValues,
  JAVASCRIPT_EMBED_MODULE_PATH,
  normalizeJavascriptEmbedLayout,
  serializeJavascriptEmbedSpecification,
} from "../shared/widget-config.mjs";
import { createJavascriptEmbedRuntime } from "../widgets/runtime/index.mjs";

function text(documentRef, tagName, className, value) {
  const node = documentRef.createElement(tagName);
  if (className) node.className = className;
  node.textContent = String(value ?? "");
  return node;
}

function labelFor(value) {
  return String(value).replace(/[-_]/g, " ").replace(/\b\w/g, character => character.toUpperCase());
}

function publicEmbed(definition) {
  return definition?.javascriptEmbed === true && definition?.divEmbed === true;
}

function defaultMode(definition, requested) {
  const modes = definition?.shape === "square" ? ["square"] : ["horizontal", "vertical"];
  return modes.includes(requested) ? requested : modes[0];
}

function defaultDimensions(mode) {
  if (mode === "square") return { width: 400, height: 400 };
  return mode === "vertical" ? { width: 360, height: 640 } : { width: 640, height: 360 };
}

function copyFallback(documentRef, value) {
  const input = documentRef.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  (documentRef.body || documentRef.documentElement).appendChild(input);
  input.select?.();
  let copied = false;
  try { copied = documentRef.execCommand?.("copy") === true; } catch (_) {}
  input.remove?.();
  return copied;
}

function control(documentRef, type, role, label, values = []) {
  const field = documentRef.createElement("label");
  field.className = "sandbox-field";
  field.appendChild(text(documentRef, "span", "sandbox-field-label", label));
  const input = documentRef.createElement(type);
  input.dataset.role = role;
  if (type === "select") {
    for (const value of values) {
      const option = documentRef.createElement("option");
      option.value = value;
      option.textContent = labelFor(value);
      input.appendChild(option);
    }
  }
  field.appendChild(input);
  return { field, input };
}

export function createEmbedSandbox({ root, catalog = widgetCatalog, registry = createCatalogRegistry(), documentRef = root?.ownerDocument || globalThis.document } = {}) {
  if (!root || typeof root.appendChild !== "function") throw new TypeError("Embed Sandbox requires a root element");
  const params = new URLSearchParams(documentRef.defaultView?.location?.search || "");
  const widget = params.get("widget");
  const definition = catalog.find(item => item?.type === widget) || registry.get(widget);
  let publicRuntime = null;
  let mountedInstance = null;
  let mounted = false;
  let destroyed = false;

  function unavailable(message) {
    root.replaceChildren(text(documentRef, "p", "sandbox-error", message));
    return Object.freeze({ mount: () => Promise.resolve(), destroy: async () => {} });
  }

  if (!definition || !registry.get(widget)) {
    return unavailable("This widget could not be found in the Showcase catalog.");
  }

  const host = documentRef.createElement("div");
  host.className = "sandbox-layout";
  const controls = documentRef.createElement("section");
  controls.className = "sandbox-controls";
  const heading = text(documentRef, "h2", "sandbox-widget-title", definition.title || widget);
  heading.dataset.role = "sandbox-widget-title";
  controls.appendChild(heading);
  controls.appendChild(text(documentRef, "p", "sandbox-widget-description", definition.description || ""));

  const form = documentRef.createElement("form");
  form.className = "sandbox-form";
  const mode = control(documentRef, "select", "layout-mode", "Form factor", definition.shape === "square" ? ["square"] : ["horizontal", "vertical"]);
  mode.input.value = defaultMode(definition, params.get("mode"));
  form.appendChild(mode.field);
  const unit = control(documentRef, "select", "layout-unit", "Units", ["px", "percent"]);
  unit.input.value = "px";
  form.appendChild(unit.field);
  const dimensions = defaultDimensions(mode.input.value);
  const width = control(documentRef, "input", "layout-width", "Width");
  width.input.type = "number"; width.input.min = "1"; width.input.max = "1600"; width.input.step = "1"; width.input.value = dimensions.width;
  const height = control(documentRef, "input", "layout-height", "Height");
  height.input.type = "number"; height.input.min = "1"; height.input.max = "1600"; height.input.step = "1"; height.input.value = dimensions.height;
  form.append(width.field, height.field);

  const options = [];
  for (const key of Object.keys(definition.supportedOptions || {})) {
    const values = getWidgetOptionValues(registry, widget, key);
    if (!values.length || key === "orientation") continue;
    const option = control(documentRef, "select", `widget-option-${key}`, labelFor(key), values);
    option.input.dataset.option = key;
    option.input.value = definition.defaults?.[key] ?? values[0];
    options.push(option.input);
    form.appendChild(option.field);
  }
  const status = text(documentRef, "p", "sandbox-status", "Set the host rectangle, then preview the widget.");
  status.dataset.role = "sandbox-status";
  status.setAttribute("aria-live", "polite");
  const previewButton = documentRef.createElement("button");
  previewButton.type = "submit";
  previewButton.className = "card-link demo";
  previewButton.dataset.role = "preview-widget";
  previewButton.textContent = "Preview widget";
  const resetButton = documentRef.createElement("button");
  resetButton.type = "button";
  resetButton.className = "card-link";
  resetButton.dataset.role = "reset-sandbox";
  resetButton.textContent = "Reset";
  const actions = documentRef.createElement("div");
  actions.className = "sandbox-actions";
  actions.append(previewButton, resetButton);
  form.append(actions);
  controls.append(form, status);

  const workspace = documentRef.createElement("section");
  workspace.className = "sandbox-workspace";
  const previewPanel = documentRef.createElement("section");
  previewPanel.className = "sandbox-panel";
  previewPanel.appendChild(text(documentRef, "h2", "", "Live preview"));
  const previewFrame = documentRef.createElement("div");
  previewFrame.className = "sandbox-preview-frame";
  const previewRoot = documentRef.createElement("div");
  previewRoot.className = "sandbox-preview-root";
  previewRoot.dataset.role = "preview-root";
  previewFrame.appendChild(previewRoot);
  previewPanel.appendChild(previewFrame);
  workspace.appendChild(previewPanel);

  const outputs = documentRef.createElement("section");
  outputs.className = "sandbox-outputs";
  const outputStatus = text(documentRef, "p", "sandbox-status", "Configure the sandbox to generate embed code.");
  outputStatus.dataset.role = "output-status";
  outputStatus.setAttribute("aria-live", "polite");
  const explanation = text(documentRef, "p", "sandbox-explanation", "JavaScript is usually best when the widget should be responsive inside your page and participate in same-page update or destroy controls. iframe is the simplest choice when you want an isolated, cross-origin-friendly embed with minimal host integration.");
  explanation.dataset.role = "embed-choice-explanation";
  const javascriptPanel = documentRef.createElement("section");
  javascriptPanel.className = "sandbox-panel";
  javascriptPanel.dataset.role = "javascript-output";
  javascriptPanel.appendChild(text(documentRef, "h2", "", "JavaScript <div> embed"));
  const javascriptCode = documentRef.createElement("pre");
  javascriptCode.dataset.role = "javascript-snippet";
  const copyJavascript = documentRef.createElement("button");
  copyJavascript.type = "button"; copyJavascript.className = "card-link"; copyJavascript.dataset.role = "copy-javascript"; copyJavascript.textContent = "Copy JavaScript";
  javascriptPanel.append(javascriptCode, copyJavascript);
  const iframePanel = documentRef.createElement("section");
  iframePanel.className = "sandbox-panel";
  iframePanel.dataset.role = "iframe-output";
  iframePanel.appendChild(text(documentRef, "h2", "", "iframe HTML embed"));
  const iframeCode = documentRef.createElement("pre");
  iframeCode.dataset.role = "iframe-snippet";
  const copyIframe = documentRef.createElement("button");
  copyIframe.type = "button"; copyIframe.className = "card-link"; copyIframe.dataset.role = "copy-iframe"; copyIframe.textContent = "Copy iframe";
  iframePanel.append(iframeCode, copyIframe);
  outputs.append(explanation, javascriptPanel, iframePanel, outputStatus);
  host.append(controls, workspace, outputs);
  root.replaceChildren(host);
  javascriptPanel.hidden = !publicEmbed(definition);

  function readConfig() {
    const requested = {};
    for (const input of options) requested[input.dataset.option] = input.value;
    requested.orientation = mode.input.value === "square" ? "auto" : mode.input.value;
    return createWidgetConfig(registry, widget, requested);
  }

  function readLayout() {
    return normalizeJavascriptEmbedLayout(registry, widget, {
      mode: mode.input.value,
      unit: unit.input.value,
      width: Number(width.input.value),
      height: Number(height.input.value),
    });
  }

  function updateOutput() {
    let layout;
    try { layout = readLayout(); } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      javascriptCode.textContent = message;
      iframeCode.textContent = message;
      outputStatus.textContent = message;
      previewButton.disabled = true;
      return null;
    }
    previewButton.disabled = !publicEmbed(definition);
    const config = readConfig();
    if (publicEmbed(definition)) {
      const specification = serializeJavascriptEmbedSpecification(registry, { widget, config: config.config, layout });
      javascriptCode.textContent = `import { mount } from "${JAVASCRIPT_EMBED_MODULE_PATH}";\n\nconst instance = await mount(document.querySelector("#widget-root"), ${specification});`;
    } else {
      javascriptCode.textContent = "JavaScript div embed unavailable for this widget.";
    }
    if (definition.standaloneHost === true) {
      iframeCode.textContent = buildIframeEmbedSnippet(registry, config, { title: definition.title || widget, layout });
    } else {
      iframeCode.textContent = "iframe HTML embed unavailable for this widget.";
    }
    outputStatus.textContent = "Embed code ready.";
    return { config, layout };
  }

  async function unmountPreview(message = "Preview reset.") {
    if (publicRuntime && mountedInstance) await publicRuntime.unmount(previewRoot);
    mountedInstance = null;
    previewRoot.replaceChildren();
    status.textContent = message;
  }

  async function preview() {
    const current = updateOutput();
    if (!current) return;
    await unmountPreview("Loading preview…");
    if (!publicEmbed(definition)) {
      status.textContent = "Preview unavailable: this widget is not enabled for public JavaScript embedding.";
      return;
    }
    publicRuntime ||= createJavascriptEmbedRuntime({ registry, documentRef });
    try {
      mountedInstance = await publicRuntime.mount(previewRoot, { widget, config: current.config.config, layout: current.layout });
      status.textContent = "Preview ready.";
    } catch (error) {
      status.textContent = `Preview unavailable: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  function resetControls() {
    mode.input.value = defaultMode(definition, params.get("mode"));
    const next = defaultDimensions(mode.input.value);
    width.input.value = next.width; height.input.value = next.height; unit.input.value = "px";
    for (const input of options) input.value = definition.defaults?.[input.dataset.option] ?? input.options[0]?.value;
  }

  form.addEventListener("submit", event => { event.preventDefault(); void preview(); });
  resetButton.addEventListener("click", () => { void unmountPreview(); resetControls(); updateOutput(); });
  for (const input of [mode.input, unit.input, width.input, height.input, ...options]) input.addEventListener("change", updateOutput);
  copyJavascript.addEventListener("click", async () => { const value = javascriptCode.textContent; const copied = await navigator.clipboard?.writeText?.(value).then(() => true).catch(() => false) || copyFallback(documentRef, value); outputStatus.textContent = copied ? "JavaScript copied." : "Copy unavailable — select the code."; });
  copyIframe.addEventListener("click", async () => { const value = iframeCode.textContent; const copied = await navigator.clipboard?.writeText?.(value).then(() => true).catch(() => false) || copyFallback(documentRef, value); outputStatus.textContent = copied ? "iframe copied." : "Copy unavailable — select the code."; });
  documentRef.defaultView?.addEventListener?.("pagehide", () => { void publicRuntime?.destroy?.(); }, { once: true });

  return Object.freeze({
    mount() {
      if (destroyed || mounted) return Promise.resolve();
      mounted = true;
      updateOutput();
      return Promise.resolve();
    },
    destroy: async () => { destroyed = true; await unmountPreview("Sandbox destroyed."); await publicRuntime?.destroy?.(); },
  });
}

export default createEmbedSandbox;
