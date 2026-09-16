import { createNebulacast } from "../shared/widget-runtime.mjs";
import { createCatalogRegistry } from "../shared/widget-catalog.mjs";
import { getWidgetOptionValues } from "../shared/widget-config.mjs";
import { createStylesheetLoader } from "../shared/widget-stylesheet-loader.mjs";
import {
  CONSOLE_SANDBOX_LAYOUT_UNITS,
  resolveConsoleSandboxLayout,
  createConsoleSandboxModel,
} from "./console-sandbox-model.mjs";

function text(documentRef, tagName, className, value) {
  const node = documentRef.createElement(tagName);
  if (className) node.className = className;
  if (value !== undefined) node.textContent = String(value);
  return node;
}

function button(documentRef, label, action, className = "sandbox-button") {
  const node = text(documentRef, "button", className, label);
  node.type = "button";
  node.dataset.sandboxAction = action;
  return node;
}

function label(documentRef, caption, control) {
  const node = documentRef.createElement("label");
  node.className = "sandbox-field";
  const title = text(documentRef, "span", "sandbox-field-label", caption);
  node.append(title, control);
  return node;
}

function optionList(documentRef, values, selected) {
  const select = documentRef.createElement("select");
  for (const value of values) {
    const option = documentRef.createElement("option");
    option.value = value;
    option.textContent = String(value).replace(/[-_]/g, " ");
    select.appendChild(option);
  }
  select.value = selected;
  return select;
}

function dimensionInput(documentRef, value, unit) {
  const input = documentRef.createElement("input");
  input.type = "number";
  input.min = unit === "percent" ? "1" : "160";
  input.max = unit === "percent" ? "100" : "1600";
  input.step = "1";
  input.value = String(value);
  return input;
}

function dimensionBounds(unit) {
  return unit === "percent" ? { min: 1, max: 100 } : { min: 160, max: 1600 };
}

const PALETTE_ICONS = Object.freeze({
  hero: "⌂",
  astro: "✦",
  "sun-moon": "☼",
  weather: "☁",
  "observing-window": "◷",
  "solar-activity": "☀",
  map: "⌖",
  location: "⌾",
  sky: "◉",
  news: "☷",
  events: "◫",
  alerts: "⚠",
  "space-weather": "◌",
});

const PALETTE_SHORT_TITLES = Object.freeze({
  "sun-moon": "Sun/Moon",
  "observing-window": "Observing",
  "solar-activity": "Solar",
  "space-weather": "Space Wx",
  alerts: "Alerts",
});

function paletteIcon(type) {
  return PALETTE_ICONS[type] || "◇";
}

function paletteShortTitle(definition) {
  return PALETTE_SHORT_TITLES[definition.type] || definition.title || definition.type;
}

/** Render the in-memory Console Sandbox composition experience. */
export function createConsoleSandbox({
  root,
  registry = createCatalogRegistry(),
  context = null,
  runtime = null,
  timeoutMs = 15000,
  documentRef = root?.ownerDocument || globalThis.document,
} = {}) {
  if (!root || typeof root.appendChild !== "function") throw new TypeError("Console Sandbox requires a root element");
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new TypeError("Console Sandbox timeout must be positive");
  const widgetRuntime = runtime || (context ? createNebulacast({ context, registry }) : null);
  const stylesheetLoader = createStylesheetLoader({ documentRef, timeoutMs });
  const mounted = new Map();
  let runtimeQueue = Promise.resolve();
  const model = createConsoleSandboxModel({ registry, onChange: render });
  const palette = model.getPalette();
  let selectedWidget = palette[0]?.type || "";
  let activeZoneId = "horizontal";
  let destroyed = false;
  let focusAfterRenderId = null;
  let focusAfterRenderFallback = null;
  let activeDrop = null;
  let dropMessage = null;

  const shell = text(documentRef, "div", "console-sandbox-shell");
  const controlsColumn = text(documentRef, "div", "console-sandbox-controls");
  const paletteRegion = text(documentRef, "aside", "console-sandbox-panel");
  paletteRegion.setAttribute("aria-label", "Widget palette");
  paletteRegion.appendChild(text(documentRef, "h2", "console-sandbox-heading", "Widget palette"));
  const paletteGrid = text(documentRef, "div", "console-sandbox-palette-grid");
  paletteGrid.dataset.role = "palette-grid";
  paletteGrid.setAttribute("role", "toolbar");
  paletteGrid.setAttribute("aria-label", "Registered widgets");
  for (const definition of palette) {
    const paletteItem = button(documentRef, "", "palette-select", "console-sandbox-palette-item");
    const icon = text(documentRef, "span", "console-sandbox-palette-icon", paletteIcon(definition.type));
    icon.setAttribute("aria-hidden", "true");
    const title = text(documentRef, "span", "console-sandbox-palette-title", paletteShortTitle(definition));
    paletteItem.append(icon, title);
    paletteItem.id = `console-sandbox-palette-${definition.type}`;
    paletteItem.dataset.sandboxWidget = definition.type;
    paletteItem.draggable = true;
    paletteItem.tabIndex = definition.type === selectedWidget ? 0 : -1;
    paletteItem.setAttribute("aria-pressed", String(definition.type === selectedWidget));
    paletteItem.setAttribute("aria-label", `Select ${definition.title || definition.type} widget`);
    paletteItem.setAttribute("title", definition.description || definition.title || definition.type);
    paletteGrid.appendChild(paletteItem);
  }
  paletteRegion.appendChild(paletteGrid);
  const paletteDescription = text(documentRef, "p", "console-sandbox-description");
  paletteDescription.setAttribute("data-role", "palette-description");
  paletteDescription.id = "console-sandbox-palette-description";
  paletteRegion.appendChild(paletteDescription);
  const addButton = button(documentRef, "Add to Canvas", "add", "sandbox-button sandbox-button-primary");
  addButton.setAttribute("aria-describedby", "console-sandbox-palette-description");
  paletteRegion.appendChild(addButton);
  const instanceList = text(documentRef, "div", "console-sandbox-instance-list");
  instanceList.dataset.role = "instance-list";

  const compositionRegion = text(documentRef, "section", "console-sandbox-panel console-sandbox-composition");
  compositionRegion.setAttribute("aria-label", "Composition");
  compositionRegion.appendChild(text(documentRef, "h2", "console-sandbox-heading", "Composition"));
  compositionRegion.appendChild(instanceList);

  const canvasRegion = text(documentRef, "section", "console-sandbox-panel console-sandbox-canvas-region");
  canvasRegion.setAttribute("aria-label", "Composition canvas");
  const canvasHeader = text(documentRef, "div", "console-sandbox-region-header");
  canvasHeader.appendChild(text(documentRef, "h2", "console-sandbox-heading", "Composition canvas"));
  const viewportSelect = optionList(documentRef, ["desktop", "mobile"], "desktop");
  viewportSelect.dataset.sandboxControl = "viewport";
  viewportSelect.setAttribute("aria-label", "Canvas viewport");
  viewportSelect.addEventListener("change", () => model.setViewport(viewportSelect.value));
  canvasHeader.appendChild(label(documentRef, "Viewport", viewportSelect));
  canvasRegion.appendChild(canvasHeader);
  const canvasStatus = text(documentRef, "p", "console-sandbox-status");
  canvasStatus.setAttribute("aria-live", "polite");
  canvasStatus.dataset.role = "canvas-status";
  canvasRegion.appendChild(canvasStatus);
  const canvas = text(documentRef, "div", "console-sandbox-canvas");
  canvas.dataset.role = "canvas";
  canvasRegion.appendChild(canvas);

  const inspectorRegion = text(documentRef, "section", "console-sandbox-panel console-sandbox-inspector");
  inspectorRegion.setAttribute("aria-label", "Selected widget inspector");
  inspectorRegion.appendChild(text(documentRef, "h2", "console-sandbox-heading", "Inspector"));
  const inspector = text(documentRef, "form", "console-sandbox-form");
  inspector.dataset.role = "inspector";
  function applyInspector(event) {
    event.preventDefault();
    const instance = selectedInstance();
    if (!instance) return;
    try {
      const config = {};
      for (const control of inspector.querySelectorAll("[data-sandbox-config]")) config[control.dataset.sandboxConfig] = control.value;
      const layout = {};
      for (const control of inspector.querySelectorAll("[data-sandbox-layout]")) layout[control.dataset.sandboxLayout] = control.value;
      model.updateInstance(instance.id, { config, layout });
    } catch (error) {
      inspectorStatus.textContent = error.message;
    }
  }
  inspector.addEventListener("submit", applyInspector);
  inspectorRegion.appendChild(inspector);
  const inspectorActions = text(documentRef, "div", "console-sandbox-actions");
  const applyButton = button(documentRef, "Apply", "apply", "sandbox-button sandbox-button-primary");
  applyButton.type = "submit";
  // The action row intentionally sits below the two fieldsets, outside the
  // form grid, so keep an explicit click path for keyboard and pointer users.
  applyButton.addEventListener("click", applyInspector);
  inspectorActions.appendChild(applyButton);
  inspectorRegion.appendChild(inspectorActions);
  const inspectorStatus = text(documentRef, "p", "console-sandbox-status");
  inspectorStatus.setAttribute("aria-live", "polite");
  inspectorStatus.dataset.role = "inspector-status";
  inspectorRegion.appendChild(inspectorStatus);
  const resetAll = button(documentRef, "Reset all", "reset-all");
  resetAll.className = "sandbox-button sandbox-button-danger";
  controlsColumn.append(paletteRegion, inspectorRegion, compositionRegion, resetAll);
  shell.append(controlsColumn, canvasRegion);
  root.textContent = "";
  root.appendChild(shell);

  function snapshot() {
    return model.getSnapshot();
  }

  function selectedInstance() {
    const state = snapshot();
    return state.instances.find(instance => instance.id === state.selectedId) || null;
  }

  function palettePayload(widget = selectedWidget) {
    return { kind: "palette", widget };
  }

  function instancePayload(instanceId) {
    return { kind: "instance", instanceId };
  }

  function payloadFromTransfer(event) {
    if (activeDrop) return activeDrop;
    const raw = event.dataTransfer?.getData?.("application/x-nebulacast-sandbox") || event.dataTransfer?.getData?.("text/plain");
    if (!raw) return null;
    try {
      const payload = JSON.parse(raw);
      return payload?.kind === "palette" || payload?.kind === "instance" ? payload : null;
    } catch (_) {
      return null;
    }
  }

  function payloadWidget(payload) {
    if (!payload) return null;
    if (payload.kind === "palette") return payload.widget;
    return snapshot().instances.find(instance => instance.id === payload.instanceId)?.widget || null;
  }

  function dropCheck(payload, zoneId) {
    const widget = payloadWidget(payload);
    if (!widget) return { valid: false, reason: "Select a widget before placing it" };
    const instance = payload.kind === "instance"
      ? snapshot().instances.find(item => item.id === payload.instanceId)
      : null;
    return model.validateDrop({ widget, layout: instance?.layout, zoneId });
  }

  function setDropMessage(message, error = false) {
    dropMessage = message ? { message, error } : null;
    canvasStatus.textContent = message || "";
    canvasStatus.dataset.error = String(error);
  }

  function clearDropIndicators() {
    canvas.querySelectorAll("[data-drop-zone]").forEach(zone => {
      delete zone.dataset.dropValid;
      delete zone.dataset.dropActive;
    });
  }

  function previewDrop(zone, payload) {
    if (!zone || !payload) return false;
    const verdict = dropCheck(payload, zone.dataset.dropZone);
    zone.dataset.dropActive = "true";
    zone.dataset.dropValid = String(verdict.valid);
    zone.querySelector("[data-role=drop-reason]")?.replaceChildren(documentRef.createTextNode(
      verdict.valid ? "Release to place here" : verdict.reason,
    ));
    if (!verdict.valid) setDropMessage(`Cannot place widget: ${verdict.reason}`, true);
    return verdict.valid;
  }

  function clearActiveDrop() {
    activeDrop = null;
    clearDropIndicators();
    if (!dropMessage) canvas.querySelectorAll("[data-role=drop-reason]").forEach(reason => {
      reason.textContent = reason.dataset.defaultText || "Drop a compatible widget here.";
    });
  }

  function applyDrop(zoneId, payload) {
    const verdict = dropCheck(payload, zoneId);
    if (!verdict.valid) {
      setDropMessage(`Cannot place widget: ${verdict.reason}`, true);
      const zone = canvas.querySelector(`[data-drop-zone="${zoneId}"]`);
      if (zone) {
        zone.dataset.dropValid = "false";
        zone.querySelector("[data-role=drop-reason]")?.replaceChildren(documentRef.createTextNode(verdict.reason));
      }
      return false;
    }
    try {
      activeZoneId = zoneId;
      updateActiveZoneUI();
      if (payload.kind === "palette") {
        requestFocusAfterRender(null, "palette-add");
        model.addToZone(payload.widget, zoneId);
      } else {
        requestFocusAfterRender(payload.instanceId);
        model.dropInstance(payload.instanceId, zoneId);
      }
      setDropMessage(null);
      return true;
    } catch (error) {
      setDropMessage(`Cannot place widget: ${error.message}`, true);
      return false;
    }
  }

  function requestFocusAfterRender(instanceId = null, fallback = "palette-add") {
    focusAfterRenderId = instanceId;
    focusAfterRenderFallback = fallback;
  }

  function focusReplacementFor(instanceId) {
    const instances = snapshot().instances;
    const index = instances.findIndex(instance => instance.id === instanceId);
    return instances[index + 1]?.id || instances[index - 1]?.id || null;
  }

  function restoreFocusAfterRender() {
    if (!focusAfterRenderId && !focusAfterRenderFallback) return;
    const instanceId = focusAfterRenderId;
    const fallback = focusAfterRenderFallback;
    focusAfterRenderId = null;
    focusAfterRenderFallback = null;
    const target = instanceId
      ? instanceList.querySelector(`[data-sandbox-action="select"][data-sandbox-instance="${instanceId}"]`)
      : null;
    (target || (fallback === "palette-add" ? addButton : null))?.focus?.();
  }

  function renderPaletteDescription() {
    const definition = registry.get(selectedWidget);
    paletteDescription.textContent = definition?.description || "Choose a registered widget.";
    paletteGrid.querySelectorAll("[data-sandbox-widget]").forEach(item => {
      const selected = item.dataset.sandboxWidget === selectedWidget;
      item.dataset.selected = String(selected);
      item.tabIndex = selected ? 0 : -1;
      item.setAttribute("aria-pressed", String(selected));
    });
    const verdict = activeZoneId
      ? model.validateDrop({ widget: selectedWidget, zoneId: activeZoneId })
      : { valid: false, reason: "Select a placeholder before adding a widget" };
    addButton.disabled = !verdict.valid;
    addButton.dataset.compatible = String(verdict.valid);
    addButton.title = verdict.valid ? "Add the selected widget to the active placeholder" : verdict.reason;
  }

  function updateActiveZoneUI() {
    const state = snapshot();
    const activeZone = state.zones.find(zone => zone.id === activeZoneId);
    canvas.querySelectorAll("[data-drop-zone]").forEach(zone => {
      const selected = zone.dataset.dropZone === activeZoneId;
      zone.dataset.active = String(selected);
      const zoneDefinition = state.zones.find(item => item.id === zone.dataset.dropZone);
      if (zoneDefinition) {
        zone.setAttribute("aria-label", `${zoneDefinition.label} placeholder, ${zoneDefinition.mode} orientation${selected ? ", selected" : ""}`);
      }
    });
    renderPaletteDescription();
    if (activeZone) {
      canvasStatus.textContent = `Selected ${activeZone.label} placeholder (${activeZone.mode} orientation).`;
      canvasStatus.dataset.error = "false";
    }
  }

  function selectActiveZone(zoneId) {
    if (!snapshot().zones.some(zone => zone.id === zoneId)) return;
    activeZoneId = zoneId;
    updateActiveZoneUI();
  }

  function renderInstanceList(state) {
    instanceList.textContent = "";
    if (!state.instances.length) {
      instanceList.appendChild(text(documentRef, "p", "console-sandbox-empty", "No widgets added yet."));
      return;
    }
    for (const instance of state.instances) {
      const row = text(documentRef, "div", "console-sandbox-instance");
      row.dataset.sandboxInstance = instance.id;
      if (instance.id === state.selectedId) row.dataset.selected = "true";
      const select = button(documentRef, `${instance.widget} · ${instance.id}`, "select", "sandbox-instance-select");
      select.dataset.sandboxInstance = instance.id;
      row.appendChild(select);
      row.appendChild(text(documentRef, "span", "console-sandbox-instance-meta", `${instance.layout.mode} · ${instance.layout.width}${instance.layout.unit}×${instance.layout.height}${instance.layout.unit}`));
      instanceList.appendChild(row);
    }
  }

  function renderCanvas(state) {
    canvas.dataset.viewport = state.viewport;
    canvas.textContent = "";
    function sizeRuntimeRoot(card, instance) {
      const frame = card.querySelector(".console-sandbox-preview-frame");
      const runtimeRoot = card.querySelector('[data-role="runtime-root"]');
      if (!frame || !runtimeRoot) return;
      const frameRect = frame.getBoundingClientRect();
      const resolved = resolveConsoleSandboxLayout(instance.layout, {
        width: frameRect.width,
        height: frameRect.height,
      });
      const renderedWidth = Math.min(resolved.width, frameRect.width || resolved.width);
      const renderedHeight = instance.layout.shape === "square"
        ? renderedWidth
        : Math.min(resolved.height, frameRect.height || resolved.height);
      runtimeRoot.style.width = `${renderedWidth}px`;
      runtimeRoot.style.height = `${renderedHeight}px`;
      runtimeRoot.dataset.sandboxRenderedWidth = String(Math.round(renderedWidth));
      runtimeRoot.dataset.sandboxRenderedHeight = String(Math.round(renderedHeight));
    }
    for (const zone of state.zones) {
      const zoneNode = text(documentRef, "section", "console-sandbox-drop-zone");
      zoneNode.dataset.dropZone = zone.id;
      zoneNode.dataset.dropMode = zone.mode;
      zoneNode.dataset.active = String(zone.id === activeZoneId);
      zoneNode.setAttribute("role", "group");
      zoneNode.setAttribute("tabindex", "0");
      zoneNode.setAttribute("aria-label", `${zone.label} placeholder, ${zone.mode} orientation${zone.id === activeZoneId ? ", selected" : ""}`);
      const zoneHeader = text(documentRef, "div", "console-sandbox-drop-zone-header");
      zoneHeader.appendChild(text(documentRef, "h3", "console-sandbox-drop-zone-title", zone.label));
      zoneHeader.appendChild(text(documentRef, "span", "console-sandbox-drop-zone-mode", zone.mode));
      zoneNode.appendChild(zoneHeader);
      zoneNode.appendChild(text(documentRef, "p", "console-sandbox-drop-zone-description", zone.description));
      const reason = text(documentRef, "p", "console-sandbox-drop-reason", "Drop a compatible widget here.");
      reason.dataset.role = "drop-reason";
      reason.dataset.defaultText = "Drop a compatible widget here.";
      reason.id = `console-sandbox-drop-reason-${zone.id}`;
      reason.setAttribute("aria-live", "polite");
      zoneNode.setAttribute("aria-describedby", reason.id);
      zoneNode.appendChild(reason);
      const zoneActions = text(documentRef, "div", "console-sandbox-drop-zone-actions");
      const selected = state.instances.find(instance => instance.id === state.selectedId);
      const moveZone = button(documentRef, selected ? `Move selected here` : "Move selected here", "move-selected-to-zone", "sandbox-button");
      moveZone.dataset.sandboxZone = zone.id;
      // Keep the action available for an explicit keyboard/pointer attempt so
      // incompatible moves produce the same readable validation message as a
      // rejected drag. Palette Add to Canvas remains gated by compatibility.
      moveZone.disabled = !selected;
      zoneActions.append(moveZone);
      zoneNode.appendChild(zoneActions);
      const zoneCards = text(documentRef, "div", "console-sandbox-drop-zone-cards");
      for (const instance of state.instances.filter(item => item.zoneId === zone.id)) {
        const card = text(documentRef, "article", "console-sandbox-card");
        card.dataset.sandboxInstance = instance.id;
        card.dataset.sandboxWidget = instance.widget;
        card.setAttribute("role", "group");
        card.setAttribute("aria-label", `${instance.widget} ${instance.id}`);
        card.setAttribute("tabindex", "0");
        card.draggable = true;
        card.setAttribute("aria-grabbed", "false");
        if (instance.id === state.selectedId) card.dataset.selected = "true";
        card.appendChild(text(documentRef, "h3", "console-sandbox-card-title", `${instance.widget} · ${instance.id}`));
        card.appendChild(text(documentRef, "p", "console-sandbox-card-meta", `${instance.layout.mode} · ${instance.layout.width}${instance.layout.unit}×${instance.layout.height}${instance.layout.unit}`));
        const previewFrame = text(documentRef, "div", "console-sandbox-preview-frame");
        previewFrame.dataset.sandboxMode = instance.layout.mode;
        previewFrame.dataset.sandboxUnit = instance.layout.unit;
        previewFrame.style.aspectRatio = instance.layout.mode === "square"
          ? "1 / 1"
          : instance.layout.mode === "vertical" ? "9 / 16" : "16 / 9";
        card.appendChild(previewFrame);
        const runtimeRoot = text(documentRef, "div", "console-sandbox-runtime-root", "Runtime preview will mount here.");
        runtimeRoot.dataset.role = "runtime-root";
        runtimeRoot.dataset.sandboxInstance = instance.id;
        runtimeRoot.dataset.sandboxWidget = instance.widget;
        runtimeRoot.dataset.sandboxUnit = instance.layout.unit;
        previewFrame.appendChild(runtimeRoot);
        const stateText = instance.error || `State: ${instance.state}`;
        card.appendChild(text(documentRef, "p", "console-sandbox-card-status", stateText));
        const actions = text(documentRef, "div", "console-sandbox-actions");
        const select = button(documentRef, "Select", "select", "sandbox-button");
        select.dataset.sandboxInstance = instance.id;
        select.setAttribute("aria-pressed", String(instance.id === state.selectedId));
        if (instance.id === state.selectedId) select.setAttribute("aria-current", "true");
        if (instance.state === "error" || instance.state === "timeout") {
          const retry = button(documentRef, "Retry", "retry", "sandbox-button");
          retry.dataset.sandboxInstance = instance.id;
          actions.appendChild(retry);
        }
        const remove = button(documentRef, "Remove", "remove", "sandbox-button sandbox-button-danger");
        remove.dataset.sandboxInstance = instance.id;
        actions.prepend(select);
        actions.appendChild(remove);
        card.appendChild(actions);
        zoneCards.appendChild(card);
      }
      if (!zone.instanceIds.length) zoneCards.appendChild(text(documentRef, "p", "console-sandbox-empty", "This zone is empty."));
      zoneNode.appendChild(zoneCards);
      canvas.appendChild(zoneNode);
      for (const instance of state.instances.filter(item => item.zoneId === zone.id)) {
        sizeRuntimeRoot(zoneNode.querySelector(`article[data-sandbox-instance="${instance.id}"]`), instance);
      }
    }
  }

  function renderInspector(state) {
    inspector.textContent = "";
    const instance = state.instances.find(item => item.id === state.selectedId);
    if (!instance) {
      inspector.appendChild(text(documentRef, "p", "console-sandbox-empty", "Select or add a widget to configure it."));
      inspectorStatus.textContent = "No widget selected.";
      return;
    }
    const definition = registry.get(instance.widget);
    inspector.appendChild(text(documentRef, "p", "console-sandbox-selection", `Selected: ${definition?.title || instance.widget} · ${instance.id}`));
    const options = text(documentRef, "fieldset", "console-sandbox-fieldset");
    options.appendChild(text(documentRef, "legend", "console-sandbox-legend", "Widget parameters"));
    for (const key of Object.keys(definition?.supportedOptions || {})) {
      if (key === "orientation") continue;
      const values = getWidgetOptionValues(registry, instance.widget, key);
      if (!values.length) continue;
      const control = optionList(documentRef, values, instance.config[key]);
      control.dataset.sandboxConfig = key;
      control.setAttribute("aria-label", key);
      options.appendChild(label(documentRef, key, control));
    }
    inspector.appendChild(options);
    const container = text(documentRef, "fieldset", "console-sandbox-fieldset");
    container.appendChild(text(documentRef, "legend", "console-sandbox-legend", "Container"));
    const unit = optionList(documentRef, CONSOLE_SANDBOX_LAYOUT_UNITS, instance.layout.unit);
    unit.dataset.sandboxLayout = "unit";
    unit.setAttribute("aria-label", "Size units");
    container.appendChild(label(documentRef, "Units", unit));
    const modes = definition?.userModes || (definition?.shape === "square" ? ["square"] : ["horizontal", "vertical"]);
    const mode = optionList(documentRef, modes, instance.layout.mode);
    mode.dataset.sandboxLayout = "mode";
    mode.setAttribute("aria-label", "Layout mode");
    container.appendChild(label(documentRef, "Mode", mode));
    const width = dimensionInput(documentRef, instance.layout.width, instance.layout.unit);
    width.dataset.sandboxLayout = "width";
    width.setAttribute("aria-label", "Width");
    container.appendChild(label(documentRef, "Width", width));
    const height = dimensionInput(documentRef, instance.layout.height, instance.layout.unit);
    height.dataset.sandboxLayout = "height";
    height.setAttribute("aria-label", "Height");
    container.appendChild(label(documentRef, "Height", height));
    unit.addEventListener("change", () => {
      const bounds = dimensionBounds(unit.value);
      for (const input of [width, height]) {
        input.min = String(bounds.min);
        input.max = String(bounds.max);
      }
    });
    if (definition?.shape === "square" || definition?.type === "sky") {
      width.addEventListener("input", () => { height.value = width.value; });
      height.addEventListener("input", () => { width.value = height.value; });
    }
    inspector.appendChild(container);
    inspectorStatus.textContent = instance.error || `State: ${instance.state}`;
    inspectorStatus.dataset.layoutValid = String(instance.layout.valid);
  }

  function render(state = snapshot()) {
    if (destroyed) return;
    renderPaletteDescription();
    renderInstanceList(state);
    renderCanvas(state);
    updateActiveZoneUI();
    renderInspector(state);
    if (dropMessage) {
      canvasStatus.textContent = dropMessage.message;
      canvasStatus.dataset.error = String(dropMessage.error);
    } else {
      canvasStatus.textContent = state.instances.length ? `${state.instances.length} widget${state.instances.length === 1 ? "" : "s"} in composition.` : "Empty composition.";
      canvasStatus.dataset.error = "false";
    }
    restoreFocusAfterRender();
    queueRuntimeSync(state);
  }

  function instanceSignature(instance) {
    return JSON.stringify({ widget: instance.widget, config: instance.config, layout: instance.layout });
  }

  function runtimeRootFor(id) {
    return canvas.querySelector?.(`[data-role="runtime-root"][data-sandbox-instance="${id}"]`) || null;
  }

  function updateCardStatus(id, state, error = null) {
    const card = canvas.querySelector?.(`article[data-sandbox-instance="${id}"]`);
    const status = card?.querySelector?.(".console-sandbox-card-status");
    if (!status) return;
    status.textContent = error || `State: ${state}`;
    status.dataset.error = error ? "true" : "false";
  }

  async function disposeMounted(id, record) {
    mounted.delete(id);
    try {
      await record?.instance?.destroy?.();
    } finally {
      record?.stylesheet?.release?.();
    }
  }

  async function syncRuntime(state) {
    if (!widgetRuntime || destroyed) return;
    const desired = new Map(state.instances.map(instance => [instance.id, instance]));
    for (const [id, record] of [...mounted]) {
      const instance = desired.get(id);
      const root = runtimeRootFor(id);
      if (!instance || !root || root !== record.root || instanceSignature(instance) !== record.signature) {
        await disposeMounted(id, record);
      }
    }
    for (const instance of state.instances) {
      if (!instance.layout.valid) {
        updateCardStatus(instance.id, instance.state, instance.error);
        continue;
      }
      const root = runtimeRootFor(instance.id);
      if (!root || mounted.has(instance.id)) continue;
      const signature = instanceSignature(instance);
      updateCardStatus(instance.id, "loading");
      let mountPromise = null;
      let stylesheet = null;
      try {
        model.setRuntimeState(instance.id, "loading");
        stylesheet = await stylesheetLoader.load(registry.get(instance.widget), { attributeName: "data-nc-sandbox-stylesheet" });
        const currentAfterStyles = model.getInstance(instance.id);
        if (!currentAfterStyles || instanceSignature(currentAfterStyles) !== signature || runtimeRootFor(instance.id) !== root) {
          stylesheet.release();
          continue;
        }
        mountPromise = Promise.resolve().then(() => widgetRuntime.mount(root, { widget: instance.widget, config: instance.config }));
        let timer;
        const mountedInstance = await Promise.race([
          mountPromise,
          new Promise((_, reject) => {
            timer = setTimeout(() => reject(Object.assign(new Error(`${instance.widget} preview timed out`), { code: "CONSOLE_SANDBOX_TIMEOUT" })), timeoutMs);
          }),
        ]).finally(() => clearTimeout(timer));
        const current = model.getInstance(instance.id);
        if (!current || instanceSignature(current) !== signature || runtimeRootFor(instance.id) !== root) {
          await mountedInstance?.destroy?.();
          continue;
        }
        mounted.set(instance.id, { root, signature, instance: mountedInstance, stylesheet });
        stylesheet = null;
        model.setRuntimeState(instance.id, "ready");
        updateCardStatus(instance.id, "ready");
      } catch (error) {
        stylesheet?.release?.();
        if (error?.code === "CONSOLE_SANDBOX_TIMEOUT") {
          model.setRuntimeState(instance.id, "timeout", error);
          updateCardStatus(instance.id, "timeout", error.message);
          // A loader that resolves after the timeout must not become an
          // orphaned live Runtime instance.
          mountPromise?.then(lateInstance => lateInstance?.destroy?.()).catch(() => {});
        } else {
          model.setRuntimeState(instance.id, "error", error);
          updateCardStatus(instance.id, "error", error.message);
        }
      }
    }
  }

  function queueRuntimeSync(state) {
    if (!widgetRuntime) return;
    runtimeQueue = runtimeQueue.catch(() => undefined).then(() => syncRuntime(state));
  }

  function dragPayloadForSource(source) {
    if (source.matches?.("[data-sandbox-instance]")) return instancePayload(source.dataset.sandboxInstance);
    if (source.matches?.("[data-sandbox-widget]")) return palettePayload(source.dataset.sandboxWidget);
    return null;
  }

  function markDragSource(payload, dragging) {
    if (payload?.kind === "instance") {
      const source = canvas.querySelector(`[data-sandbox-instance="${payload.instanceId}"]`);
      if (source) source.dataset.dragging = String(dragging);
    } else if (payload?.kind === "palette") {
      const source = paletteGrid.querySelector(`[data-sandbox-widget="${payload.widget}"]`);
      if (source) source.dataset.dragging = String(dragging);
    }
  }

  function zoneAtPoint(event) {
    return documentRef.elementFromPoint?.(event.clientX, event.clientY)?.closest?.("[data-drop-zone]") || null;
  }

  function beginPointerDrag(event, payload) {
    if (event.pointerType === "mouse" || !payload) return;
    activeDrop = payload;
    markDragSource(payload, true);
    setDropMessage(`Dragging ${payloadWidget(payload)}. Choose a compatible drop zone.`, false);
    event.preventDefault();
  }

  shell.addEventListener("pointerdown", event => {
    const source = event.target.closest?.("[draggable=true]");
    if (source) beginPointerDrag(event, dragPayloadForSource(source));
  });
  const movePointerDrag = event => {
    if (!activeDrop || event.pointerType === "mouse") return;
    const zone = zoneAtPoint(event);
    if (zone) previewDrop(zone, activeDrop);
    event.preventDefault();
  };
  documentRef.addEventListener("pointermove", movePointerDrag, { passive: false });
  const finishPointerDrag = event => {
    if (!activeDrop || event.pointerType === "mouse") return;
    const payload = activeDrop;
    const zone = zoneAtPoint(event);
    if (zone) applyDrop(zone.dataset.dropZone, payload);
    markDragSource(payload, false);
    clearActiveDrop();
  };
  documentRef.addEventListener("pointerup", finishPointerDrag);
  documentRef.addEventListener("pointercancel", event => {
    if (!activeDrop || event.pointerType === "mouse") return;
    markDragSource(activeDrop, false);
    clearActiveDrop();
  });

  shell.addEventListener("click", event => {
    const action = event.target.closest?.("[data-sandbox-action]");
    const zone = event.target.closest?.("[data-drop-zone]");
    if (!action && zone && !event.target.closest?.("button, input, select")) {
      selectActiveZone(zone.dataset.dropZone);
      return;
    }
    if (!action) return;
    try {
      const instanceId = action.dataset.sandboxInstance;
      switch (action.dataset.sandboxAction) {
        case "add": if (!addButton.disabled) applyDrop(activeZoneId, palettePayload(selectedWidget)); break;
        case "palette-select":
          selectedWidget = action.dataset.sandboxWidget;
          renderPaletteDescription();
          break;
        case "add-to-zone": applyDrop(action.dataset.sandboxZone, palettePayload(selectedWidget)); break;
        case "move-selected-to-zone":
          if (selectedInstance()) applyDrop(action.dataset.sandboxZone, instancePayload(selectedInstance().id));
          break;
        case "select": requestFocusAfterRender(instanceId); model.select(instanceId); break;
        case "remove": requestFocusAfterRender(focusReplacementFor(instanceId)); model.remove(instanceId); break;
        case "retry": requestFocusAfterRender(instanceId); model.retryInstance(instanceId); break;
        case "reset-card": if (selectedInstance()) { requestFocusAfterRender(focusReplacementFor(selectedInstance().id)); model.resetCard(selectedInstance().id); } break;
        case "reset-all": requestFocusAfterRender(null); model.resetAll(); break;
        case "apply": break;
        default: break;
      }
    } catch (error) {
      inspectorStatus.textContent = error.message;
    }
  });

  shell.addEventListener("dragstart", event => {
    const source = event.target.closest?.("[draggable=true]");
    const payload = dragPayloadForSource(source);
    if (!payload) return;
    activeDrop = payload;
    markDragSource(payload, true);
    event.dataTransfer?.setData?.("application/x-nebulacast-sandbox", JSON.stringify(payload));
    event.dataTransfer?.setData?.("text/plain", JSON.stringify(payload));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
  });
  shell.addEventListener("dragend", event => {
    const payload = activeDrop || dragPayloadForSource(event.target.closest?.("[draggable=true]"));
    markDragSource(payload, false);
    clearActiveDrop();
  });
  shell.addEventListener("dragover", event => {
    const zone = event.target.closest?.("[data-drop-zone]");
    if (!zone) return;
    const payload = payloadFromTransfer(event);
    if (!payload) return;
    previewDrop(zone, payload);
    event.preventDefault();
    // Keep the browser's drop gesture alive for an invalid target too. The
    // drop handler then reports the readable reason without touching source
    // state or Runtime; a `none` effect would suppress `drop` in some UAs.
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  });
  shell.addEventListener("drop", event => {
    const zone = event.target.closest?.("[data-drop-zone]");
    const payload = payloadFromTransfer(event);
    if (!zone || !payload) return;
    event.preventDefault();
    applyDrop(zone.dataset.dropZone, payload);
    markDragSource(payload, false);
    clearActiveDrop();
  });
  shell.addEventListener("keydown", event => {
    const zone = event.target.closest?.("[data-drop-zone]");
    if (zone && event.target === zone && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      selectActiveZone(zone.dataset.dropZone);
      return;
    }
    if (event.target.closest?.("[data-role=palette-grid]")) {
      const items = [...paletteGrid.querySelectorAll("[data-sandbox-widget]")];
      const currentIndex = Math.max(0, items.findIndex(item => item.dataset.sandboxWidget === selectedWidget));
      const columns = Math.max(1, getComputedStyle(paletteGrid).gridTemplateColumns.split(" ").filter(Boolean).length);
      let nextIndex = currentIndex;
      if (event.key === "ArrowRight") nextIndex = Math.min(items.length - 1, currentIndex + 1);
      else if (event.key === "ArrowLeft") nextIndex = Math.max(0, currentIndex - 1);
      else if (event.key === "ArrowDown") nextIndex = Math.min(items.length - 1, currentIndex + columns);
      else if (event.key === "ArrowUp") nextIndex = Math.max(0, currentIndex - columns);
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = items.length - 1;
      else nextIndex = currentIndex;
      if (nextIndex !== currentIndex || ["Home", "End"].includes(event.key)) {
        event.preventDefault();
        const item = items[nextIndex];
        selectedWidget = item.dataset.sandboxWidget;
        renderPaletteDescription();
        item.focus();
      }
      return;
    }
    const card = event.target.closest?.(".console-sandbox-card[data-sandbox-instance]");
    if (!card) return;
    const payload = instancePayload(card.dataset.sandboxInstance);
    if (event.key === "Enter") {
      event.preventDefault();
      requestFocusAfterRender(payload.instanceId);
      model.select(payload.instanceId);
    } else if (event.key === " ") {
      event.preventDefault();
      activeDrop = payload;
      model.select(payload.instanceId);
      setDropMessage(`Moving ${payloadWidget(payload)}. Use a drop-zone button or Escape to cancel.`, false);
      canvas.querySelector("[data-drop-zone] [data-sandbox-action=move-selected-to-zone]")?.focus?.();
    } else if (event.key === "Escape" && activeDrop) {
      event.preventDefault();
      clearActiveDrop();
      setDropMessage(null);
      card.focus();
    }
  });

  render();
  return Object.freeze({
    model,
    mount() { render(); return Promise.resolve(model.getSnapshot()); },
    destroy() {
      destroyed = true;
      if (activeDrop) markDragSource(activeDrop, false);
      clearActiveDrop();
      documentRef.removeEventListener("pointermove", movePointerDrag);
      documentRef.removeEventListener("pointerup", finishPointerDrag);
      model.destroy();
      runtimeQueue = runtimeQueue.then(async () => {
        for (const [id, record] of [...mounted]) await disposeMounted(id, record);
      }).catch(() => undefined);
      root.textContent = "";
    },
  });
}

export default createConsoleSandbox;
