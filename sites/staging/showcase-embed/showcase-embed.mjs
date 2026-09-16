import { createCatalogRegistry, widgetCatalog } from "../shared/widget-catalog.mjs";
import {
  buildIframeEmbedSnippet,
  createWidgetConfig,
  getWidgetOptionValues,
  JAVASCRIPT_EMBED_MODULE_PATH,
  normalizeJavascriptEmbedLayout,
  serializeJavascriptEmbedSpecification,
} from "../shared/widget-config.mjs";
import { mount as publicMount, unmount as publicUnmount } from "../widgets/runtime/index.mjs";

const EMBED_CAPABILITY_KEYS = Object.freeze(["javascriptEmbed", "divEmbed", "standaloneHost"]);
const LAYOUT_LIMITS = Object.freeze({ min: 160, max: 1600 });

function labelFor(value) {
  return String(value).replace(/[-_]/g, " ").replace(/\b\w/g, character => character.toUpperCase());
}

function appendText(documentRef, tagName, className, text) {
  const element = documentRef.createElement(tagName);
  if (className) element.className = className;
  element.textContent = String(text ?? "");
  return element;
}

/** Return only catalog definitions with an explicitly registered embed surface. */
export function getEmbedCatalog(catalog = widgetCatalog) {
  if (!Array.isArray(catalog)) throw new TypeError("Embed catalog requires an array");
  return catalog.filter(definition => EMBED_CAPABILITY_KEYS.some(key => definition?.[key] === true));
}

function defaultMode(definition) {
  if (definition.shape === "square") return "square";
  return definition.userModes?.includes(definition.defaults?.orientation)
    ? definition.defaults.orientation
    : "horizontal";
}

function defaultDimensions(mode) {
  if (mode === "square") return { width: 400, height: 400 };
  return mode === "vertical" ? { width: 360, height: 640 } : { width: 640, height: 360 };
}

function isJavascriptMountable(definition) {
  return definition?.javascriptEmbed === true || definition?.divEmbed === true;
}

function copyFallback(documentRef, text) {
  const textarea = documentRef.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  (documentRef.body || documentRef.documentElement).appendChild(textarea);
  textarea.select?.();
  let copied = false;
  try { copied = documentRef.execCommand?.("copy") === true; } catch (_) {}
  textarea.remove?.();
  return copied;
}

function createSelect(documentRef, values, selected, label) {
  const select = documentRef.createElement("select");
  select.setAttribute("aria-label", label);
  for (const value of values) {
    const option = documentRef.createElement("option");
    option.value = value;
    option.textContent = labelFor(value);
    option.selected = value === selected;
    select.appendChild(option);
  }
  return select;
}

export function createShowcaseEmbedPage({ root, catalog = widgetCatalog, registry = createCatalogRegistry(), documentRef = root?.ownerDocument || globalThis.document } = {}) {
  if (!root || typeof root.appendChild !== "function") throw new TypeError("Embed test page requires a root element");
  if (!registry || typeof registry.get !== "function") throw new TypeError("Embed test page requires a Widget Registry");

  const embedCatalog = getEmbedCatalog(catalog);
  const state = { selected: null, instance: null, pending: null, destroyed: false };

  const lab = documentRef.createElement("div");
  lab.className = "embed-lab";
  const sidebar = documentRef.createElement("aside");
  sidebar.className = "embed-sidebar";
  const catalogPanel = documentRef.createElement("section");
  catalogPanel.className = "embed-panel";
  const catalogHeading = appendText(documentRef, "h2", "", "Embed catalog");
  catalogPanel.appendChild(catalogHeading);
  const catalogList = documentRef.createElement("div");
  catalogList.className = "embed-catalog";
  catalogList.setAttribute("role", "list");
  catalogPanel.appendChild(catalogList);
  const inspectorPanel = documentRef.createElement("section");
  inspectorPanel.className = "embed-panel";
  inspectorPanel.appendChild(appendText(documentRef, "h2", "", "Embed inspector"));
  const inspector = documentRef.createElement("div");
  inspector.className = "embed-inspector";
  inspectorPanel.appendChild(inspector);
  sidebar.append(catalogPanel, inspectorPanel);

  const workspace = documentRef.createElement("section");
  workspace.className = "embed-workspace";
  const previewPanel = documentRef.createElement("section");
  previewPanel.className = "embed-panel embed-preview-panel";
  const previewHeading = documentRef.createElement("div");
  previewHeading.className = "embed-preview-heading";
  previewHeading.appendChild(appendText(documentRef, "h2", "", "Public div embed preview"));
  const previewNote = appendText(documentRef, "p", "", "Mounted through /widgets/runtime/index.mjs");
  previewHeading.appendChild(previewNote);
  previewPanel.appendChild(previewHeading);
  const previewFrame = documentRef.createElement("div");
  previewFrame.className = "embed-preview-frame";
  previewFrame.setAttribute("data-role", "embed-preview-frame");
  const previewRoot = documentRef.createElement("div");
  previewRoot.className = "embed-preview-root";
  previewRoot.id = "embed-preview-root";
  previewFrame.appendChild(previewRoot);
  previewPanel.appendChild(previewFrame);
  workspace.appendChild(previewPanel);

  const outputs = documentRef.createElement("div");
  outputs.className = "embed-outputs";
  const javascriptOutput = createOutputPanel("JavaScript div snippet", "javascript-snippet", "Copy JavaScript");
  const iframeOutput = createOutputPanel("Iframe HTML snippet", "iframe-snippet", "Copy HTML");
  outputs.append(javascriptOutput.panel, iframeOutput.panel);
  workspace.appendChild(outputs);
  lab.append(sidebar, workspace);
  root.replaceChildren(lab);

  function createOutputPanel(title, role, buttonText) {
    const panel = documentRef.createElement("section");
    panel.className = "embed-panel embed-output";
    panel.appendChild(appendText(documentRef, "h2", "", title));
    const code = documentRef.createElement("pre");
    code.setAttribute("data-role", role);
    code.textContent = "Select a widget to generate a safe snippet.";
    panel.appendChild(code);
    const actions = documentRef.createElement("div");
    actions.className = "embed-output-actions";
    const button = documentRef.createElement("button");
    button.type = "button";
    button.className = "embed-button";
    button.setAttribute("data-showcase-embed-action", `copy-${role.replace("-snippet", "")}`);
    button.textContent = buttonText;
    actions.appendChild(button);
    const status = appendText(documentRef, "span", "embed-copy-status", "Ready to copy");
    status.setAttribute("data-role", `${role}-copy-status`);
    status.setAttribute("aria-live", "polite");
    actions.appendChild(status);
    panel.appendChild(actions);
    return { panel, code, button, status };
  }

  function addField(parent, labelText, control) {
    const field = documentRef.createElement("label");
    field.className = "embed-field";
    field.appendChild(appendText(documentRef, "span", "", labelText));
    field.appendChild(control);
    parent.appendChild(field);
    return field;
  }

  function currentDefinition() {
    return state.selected ? registry.get(state.selected) : null;
  }

  function currentLayout() {
    const mode = inspector.querySelector('[data-role="layout-mode"]')?.value;
    const width = inspector.querySelector('[data-role="layout-width"]')?.value;
    const height = inspector.querySelector('[data-role="layout-height"]')?.value;
    try {
      return { valid: true, value: normalizeJavascriptEmbedLayout(registry, state.selected, { mode, width, height }), error: "" };
    } catch (error) {
      return { valid: false, value: null, error: error instanceof Error ? error.message : String(error) };
    }
  }

  function readConfig(definition) {
    const requested = {};
    for (const select of inspector.querySelectorAll("[data-role='widget-option']")) requested[select.dataset.option] = select.value;
    return createWidgetConfig(registry, definition.type, requested);
  }

  function setStatus(message, status = "idle") {
    const element = inspector.querySelector('[data-role="embed-status"]');
    if (element) {
      element.textContent = message;
      element.dataset.state = status;
    }
  }

  function updateOutputs(definition, configExport, layoutState) {
    if (!layoutState.valid || !isJavascriptMountable(definition)) {
      javascriptOutput.code.textContent = layoutState.error || "JavaScript div embed unavailable for this registered widget.";
      iframeOutput.code.textContent = definition.standaloneHost === true
        ? (layoutState.error || "Iframe dimensions are invalid.")
        : "Iframe HTML unavailable: this widget is not registered with standaloneHost.";
      return;
    }
    const specification = {
      widget: definition.type,
      config: configExport.config,
      layout: layoutState.value,
    };
    const serialized = serializeJavascriptEmbedSpecification(registry, specification);
    javascriptOutput.code.textContent = `import { mount } from "${JAVASCRIPT_EMBED_MODULE_PATH}";\n\nconst root = document.querySelector("#widget-root");\nconst instance = await mount(root, ${serialized});`;
    iframeOutput.code.textContent = definition.standaloneHost === true
      ? buildIframeEmbedSnippet(registry, configExport, { origin: documentRef.defaultView?.location?.origin || "", title: definition.title || definition.type, layout: layoutState.value })
      : "Iframe HTML unavailable: this widget is not registered with standaloneHost.";
  }

  function updateInspector() {
    const definition = currentDefinition();
    if (!definition) return;
    const layoutState = currentLayout();
    const configExport = readConfig(definition);
    inspector.querySelector('[data-role="layout-status"]').textContent = layoutState.valid
      ? `${labelFor(layoutState.value.mode)} · ${layoutState.value.width} × ${layoutState.value.height}`
      : layoutState.error;
    inspector.querySelector('[data-role="layout-status"]').dataset.valid = String(layoutState.valid);
    const previewButton = inspector.querySelector('[data-showcase-embed-action="preview"]');
    previewButton.disabled = !layoutState.valid || !isJavascriptMountable(definition);
    updateOutputs(definition, configExport, layoutState);
    state.configExport = configExport;
    state.layoutState = layoutState;
    if (state.instance) setStatus("Configuration changed — reset or preview again.", "idle");
  }

  async function destroyPreview(message = "Preview destroyed") {
    if (state.pending) await state.pending.catch(() => undefined);
    try { await publicUnmount(previewRoot); } catch (_) {}
    state.instance = null;
    state.pending = null;
    previewRoot.replaceChildren();
    if (message) setStatus(message, "idle");
  }

  async function preview() {
    const definition = currentDefinition();
    const layoutState = currentLayout();
    if (!definition || !layoutState.valid || !isJavascriptMountable(definition)) return;
    await destroyPreview("");
    previewRoot.replaceChildren();
    setStatus("Loading public embed…", "loading");
    const pending = publicMount(previewRoot, {
      widget: definition.type,
      config: state.configExport.config,
      layout: layoutState.value,
    });
    state.pending = pending;
    try {
      state.instance = await pending;
      setStatus("Embed ready", "ready");
    } catch (error) {
      previewRoot.replaceChildren();
      setStatus(`Embed error: ${error instanceof Error ? error.message : String(error)}`, "error");
    } finally {
      if (state.pending === pending) state.pending = null;
    }
  }

  async function reset() {
    const definition = currentDefinition();
    if (!definition) return;
    await destroyPreview("Preview reset");
    const mode = defaultMode(definition);
    const dimensions = defaultDimensions(mode);
    inspector.querySelector('[data-role="layout-mode"]').value = mode;
    inspector.querySelector('[data-role="layout-width"]').value = String(dimensions.width);
    inspector.querySelector('[data-role="layout-height"]').value = String(dimensions.height);
    for (const select of inspector.querySelectorAll("[data-role='widget-option']")) select.value = definition.defaults?.[select.dataset.option] ?? select.options[0]?.value;
    updateInspector();
  }

  async function copyOutput(output) {
    const text = output.code.textContent;
    const navigatorRef = documentRef.defaultView?.navigator;
    let copied = false;
    try {
      if (typeof navigatorRef?.clipboard?.writeText === "function") {
        try { await navigatorRef.clipboard.writeText(text); copied = true; } catch (_) {}
      }
      if (!copied) copied = copyFallback(documentRef, text);
    } catch (_) {}
    output.status.textContent = copied ? "Copied" : "Copy unavailable — select the snippet";
  }

  function renderInspector(definition) {
    inspector.replaceChildren();
    const description = appendText(documentRef, "p", "", definition.description || "No description provided.");
    inspector.appendChild(description);
    const capabilities = documentRef.createElement("div");
    capabilities.className = "embed-capabilities";
    for (const key of EMBED_CAPABILITY_KEYS.filter(item => definition[item] === true)) {
      capabilities.appendChild(appendText(documentRef, "span", "embed-capability", key));
    }
    inspector.appendChild(capabilities);

    const layoutFieldset = documentRef.createElement("fieldset");
    layoutFieldset.className = "embed-fieldset";
    layoutFieldset.appendChild(appendText(documentRef, "legend", "", "Host container"));
    const modes = definition.shape === "square" ? ["square"] : (definition.userModes || ["horizontal", "vertical"]);
    const modeSelect = createSelect(documentRef, modes, defaultMode(definition), "Embed form factor");
    modeSelect.dataset.role = "layout-mode";
    addField(layoutFieldset, "Form factor", modeSelect);
    const dims = defaultDimensions(defaultMode(definition));
    const dimensionGrid = documentRef.createElement("div");
    dimensionGrid.className = "embed-dimensions";
    const widthInput = documentRef.createElement("input");
    widthInput.type = "number"; widthInput.min = String(LAYOUT_LIMITS.min); widthInput.max = String(LAYOUT_LIMITS.max); widthInput.step = "1"; widthInput.value = String(dims.width); widthInput.dataset.role = "layout-width"; widthInput.setAttribute("aria-label", "Embed width in pixels");
    const heightInput = documentRef.createElement("input");
    heightInput.type = "number"; heightInput.min = String(LAYOUT_LIMITS.min); heightInput.max = String(LAYOUT_LIMITS.max); heightInput.step = "1"; heightInput.value = String(dims.height); heightInput.dataset.role = "layout-height"; heightInput.setAttribute("aria-label", "Embed height in pixels");
    addField(dimensionGrid, "Width (px)", widthInput);
    addField(dimensionGrid, "Height (px)", heightInput);
    layoutFieldset.appendChild(dimensionGrid);
    layoutFieldset.appendChild(appendText(documentRef, "p", "embed-layout-status", "Checking dimensions"));
    layoutFieldset.lastElementChild.dataset.role = "layout-status";
    inspector.appendChild(layoutFieldset);

    const optionsFieldset = documentRef.createElement("fieldset");
    optionsFieldset.className = "embed-fieldset";
    optionsFieldset.appendChild(appendText(documentRef, "legend", "", "Widget config options"));
    for (const key of Object.keys(definition.supportedOptions || {})) {
      const values = getWidgetOptionValues(registry, definition.type, key);
      if (!values.length) continue;
      const select = createSelect(documentRef, values, definition.defaults?.[key] ?? values[0], `${labelFor(key)} option`);
      select.dataset.role = "widget-option";
      select.dataset.option = key;
      addField(optionsFieldset, labelFor(key), select);
    }
    inspector.appendChild(optionsFieldset);

    const actions = documentRef.createElement("div");
    actions.className = "embed-actions";
    const previewButton = documentRef.createElement("button");
    previewButton.type = "button"; previewButton.className = "embed-button embed-button-primary"; previewButton.dataset.showcaseEmbedAction = "preview"; previewButton.textContent = "Mount preview";
    const resetButton = documentRef.createElement("button");
    resetButton.type = "button"; resetButton.className = "embed-button embed-button-danger"; resetButton.dataset.showcaseEmbedAction = "reset"; resetButton.textContent = "Reset / destroy";
    actions.append(previewButton, resetButton);
    inspector.appendChild(actions);
    const status = appendText(documentRef, "p", "embed-status", "Preview idle");
    status.dataset.role = "embed-status"; status.dataset.state = "idle"; status.setAttribute("aria-live", "polite");
    inspector.appendChild(status);

    inspector.querySelectorAll("select, input").forEach(control => control.addEventListener("input", updateInspector));
    inspector.querySelectorAll("select, input").forEach(control => control.addEventListener("change", updateInspector));
    previewButton.addEventListener("click", () => void preview());
    resetButton.addEventListener("click", () => void reset());
    updateInspector();
  }

  function selectWidget(type) {
    const definition = embedCatalog.find(item => item.type === type);
    if (!definition) return;
    void destroyPreview("");
    state.selected = type;
    catalogList.querySelectorAll("[data-showcase-embed-widget]").forEach(button => {
      button.dataset.selected = String(button.dataset.showcaseEmbedWidget === type);
    });
    renderInspector(definition);
    previewRoot.replaceChildren(appendText(documentRef, "div", "embed-preview-placeholder", "Select Mount preview to run the public JavaScript embed."));
    javascriptOutput.status.textContent = "Ready to copy";
    iframeOutput.status.textContent = "Ready to copy";
  }

  for (const definition of embedCatalog) {
    const button = documentRef.createElement("button");
    button.type = "button";
    button.className = "embed-catalog-button";
    button.dataset.showcaseEmbedWidget = definition.type;
    button.dataset.selected = "false";
    button.setAttribute("role", "listitem");
    button.append(appendText(documentRef, "span", "embed-catalog-name", definition.title || definition.type), appendText(documentRef, "span", "embed-catalog-type", definition.type));
    button.addEventListener("click", () => selectWidget(definition.type));
    catalogList.appendChild(button);
  }
  if (!embedCatalog.length) catalogList.appendChild(appendText(documentRef, "p", "embed-empty", "No registered embed surfaces are available."));

  javascriptOutput.button.addEventListener("click", () => void copyOutput(javascriptOutput));
  iframeOutput.button.addEventListener("click", () => void copyOutput(iframeOutput));
  state.selected = embedCatalog[0]?.type || null;
  if (state.selected) selectWidget(state.selected);
  else previewRoot.appendChild(appendText(documentRef, "div", "embed-preview-placeholder", "No embed-capable widgets are registered."));

  return Object.freeze({
    getCatalog: () => [...embedCatalog],
    getSelected: () => state.selected,
    destroy: async () => {
      state.destroyed = true;
      await destroyPreview("");
      root.replaceChildren();
    },
  });
}

if (typeof document !== "undefined") {
  const pageRoot = document.getElementById("showcase-embed");
  if (pageRoot) createShowcaseEmbedPage({ root: pageRoot });
}
