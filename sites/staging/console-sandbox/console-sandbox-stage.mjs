import { createNebulacast } from "../shared/widget-runtime.mjs";
import { createCatalogRegistry, widgetCatalog } from "../shared/widget-catalog.mjs";
import { getWidgetOptionValues } from "../shared/widget-config.mjs";
import { createConsoleSandboxModel } from "./console-sandbox-model.mjs";

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

function dimensionInput(documentRef, value) {
  const input = documentRef.createElement("input");
  input.type = "number";
  input.min = "160";
  input.max = "1600";
  input.step = "1";
  input.value = String(value);
  return input;
}

/** Render the in-memory Console Sandbox composition experience. */
export function createConsoleSandbox({
  root,
  catalog = widgetCatalog,
  registry = createCatalogRegistry(),
  context = null,
  runtime = null,
  documentRef = root?.ownerDocument || globalThis.document,
} = {}) {
  if (!root || typeof root.appendChild !== "function") throw new TypeError("Console Sandbox requires a root element");
  const widgetRuntime = runtime || (context ? createNebulacast({ context, registry }) : null);
  const mounted = new Map();
  let runtimeQueue = Promise.resolve();
  const model = createConsoleSandboxModel({ registry, onChange: render });
  let selectedWidget = catalog[0]?.type || registry.list()[0]?.type || "";
  let destroyed = false;

  const shell = text(documentRef, "div", "console-sandbox-shell");
  const paletteRegion = text(documentRef, "aside", "console-sandbox-panel");
  paletteRegion.setAttribute("aria-label", "Widget palette");
  paletteRegion.appendChild(text(documentRef, "h2", "console-sandbox-heading", "Widget palette"));
  const paletteSelect = documentRef.createElement("select");
  paletteSelect.setAttribute("data-sandbox-control", "widget");
  paletteSelect.setAttribute("aria-label", "Widget to add");
  for (const definition of catalog) {
    const option = documentRef.createElement("option");
    option.value = definition.type;
    option.textContent = definition.title || definition.type;
    paletteSelect.appendChild(option);
  }
  paletteSelect.value = selectedWidget;
  paletteSelect.addEventListener("change", () => {
    selectedWidget = paletteSelect.value;
    renderPaletteDescription();
  });
  paletteRegion.appendChild(paletteSelect);
  const paletteDescription = text(documentRef, "p", "console-sandbox-description");
  paletteDescription.setAttribute("data-role", "palette-description");
  paletteRegion.appendChild(paletteDescription);
  paletteRegion.appendChild(button(documentRef, "Add to canvas", "add", "sandbox-button sandbox-button-primary"));
  paletteRegion.appendChild(text(documentRef, "h3", "console-sandbox-subheading", "Composition"));
  const instanceList = text(documentRef, "div", "console-sandbox-instance-list");
  instanceList.dataset.role = "instance-list";
  paletteRegion.appendChild(instanceList);

  const canvasRegion = text(documentRef, "section", "console-sandbox-panel console-sandbox-canvas-region");
  canvasRegion.setAttribute("aria-label", "Composition canvas");
  const canvasHeader = text(documentRef, "div", "console-sandbox-region-header");
  canvasHeader.appendChild(text(documentRef, "h2", "console-sandbox-heading", "Composition canvas"));
  const viewportSelect = optionList(documentRef, ["desktop", "narrow"], "desktop");
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
  applyButton.addEventListener("click", applyInspector);
  inspectorActions.appendChild(applyButton);
  inspectorActions.appendChild(button(documentRef, "Move left", "move-left"));
  inspectorActions.appendChild(button(documentRef, "Move right", "move-right"));
  inspectorActions.appendChild(button(documentRef, "Reset card", "reset-card"));
  inspectorRegion.appendChild(inspectorActions);
  const inspectorStatus = text(documentRef, "p", "console-sandbox-status");
  inspectorStatus.setAttribute("aria-live", "polite");
  inspectorStatus.dataset.role = "inspector-status";
  inspectorRegion.appendChild(inspectorStatus);
  const resetAll = button(documentRef, "Reset all", "reset-all");
  resetAll.className = "sandbox-button sandbox-button-danger";
  shell.append(paletteRegion, canvasRegion, inspectorRegion, resetAll);
  root.textContent = "";
  root.appendChild(shell);

  function snapshot() {
    return model.getSnapshot();
  }

  function selectedInstance() {
    const state = snapshot();
    return state.instances.find(instance => instance.id === state.selectedId) || null;
  }

  function renderPaletteDescription() {
    const definition = registry.get(selectedWidget);
    paletteDescription.textContent = definition?.description || "Choose a registered widget.";
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
      row.appendChild(text(documentRef, "span", "console-sandbox-instance-meta", `${instance.layout.mode} · ${instance.layout.width}×${instance.layout.height}`));
      instanceList.appendChild(row);
    }
  }

  function renderCanvas(state) {
    canvas.dataset.viewport = state.viewport;
    canvas.textContent = "";
    if (!state.instances.length) {
      canvas.appendChild(text(documentRef, "p", "console-sandbox-empty", "Add a widget to start building your temporary Console."));
      return;
    }
    for (const instance of state.instances) {
      const card = text(documentRef, "article", "console-sandbox-card");
      card.dataset.sandboxInstance = instance.id;
      if (instance.id === state.selectedId) card.dataset.selected = "true";
      card.appendChild(text(documentRef, "h3", "console-sandbox-card-title", `${instance.widget} · ${instance.id}`));
      card.appendChild(text(documentRef, "p", "console-sandbox-card-meta", `${instance.layout.mode} · ${instance.layout.width}×${instance.layout.height}`));
      const runtimeRoot = text(documentRef, "div", "console-sandbox-runtime-root", "Runtime preview will mount here.");
      runtimeRoot.dataset.role = "runtime-root";
      runtimeRoot.dataset.sandboxInstance = instance.id;
      runtimeRoot.style.width = `${instance.layout.width}px`;
      runtimeRoot.style.height = `${instance.layout.height}px`;
      card.appendChild(runtimeRoot);
      const stateText = instance.error || `State: ${instance.state}`;
      card.appendChild(text(documentRef, "p", "console-sandbox-card-status", stateText));
      const actions = text(documentRef, "div", "console-sandbox-actions");
      const select = button(documentRef, "Select", "select", "sandbox-button");
      select.dataset.sandboxInstance = instance.id;
      const remove = button(documentRef, "Remove", "remove", "sandbox-button sandbox-button-danger");
      remove.dataset.sandboxInstance = instance.id;
      actions.append(select, remove);
      card.appendChild(actions);
      canvas.appendChild(card);
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
    const modes = definition?.userModes || (definition?.shape === "square" ? ["square"] : ["horizontal", "vertical"]);
    const mode = optionList(documentRef, modes, instance.layout.mode);
    mode.dataset.sandboxLayout = "mode";
    mode.setAttribute("aria-label", "Layout mode");
    container.appendChild(label(documentRef, "Mode", mode));
    const width = dimensionInput(documentRef, instance.layout.width);
    width.dataset.sandboxLayout = "width";
    width.setAttribute("aria-label", "Width");
    container.appendChild(label(documentRef, "Width", width));
    const height = dimensionInput(documentRef, instance.layout.height);
    height.dataset.sandboxLayout = "height";
    height.setAttribute("aria-label", "Height");
    container.appendChild(label(documentRef, "Height", height));
    inspector.appendChild(container);
    inspectorStatus.textContent = instance.error || `State: ${instance.state}`;
    inspectorStatus.dataset.layoutValid = String(instance.layout.valid);
  }

  function render(state = snapshot()) {
    if (destroyed) return;
    renderPaletteDescription();
    renderInstanceList(state);
    renderCanvas(state);
    renderInspector(state);
    canvasStatus.textContent = state.instances.length ? `${state.instances.length} widget${state.instances.length === 1 ? "" : "s"} in composition.` : "Empty composition.";
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
    await record?.instance?.destroy?.();
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
      try {
        model.setRuntimeState(instance.id, "loading");
        const mountedInstance = await widgetRuntime.mount(root, { widget: instance.widget, config: instance.config });
        const current = model.getInstance(instance.id);
        if (!current || instanceSignature(current) !== signature || runtimeRootFor(instance.id) !== root) {
          await mountedInstance?.destroy?.();
          continue;
        }
        mounted.set(instance.id, { root, signature, instance: mountedInstance });
        model.setRuntimeState(instance.id, "ready");
        updateCardStatus(instance.id, "ready");
      } catch (error) {
        model.setRuntimeState(instance.id, "error", error);
        updateCardStatus(instance.id, "error", error.message);
      }
    }
  }

  function queueRuntimeSync(state) {
    if (!widgetRuntime) return;
    runtimeQueue = runtimeQueue.catch(() => undefined).then(() => syncRuntime(state));
  }

  shell.addEventListener("click", event => {
    const action = event.target.closest?.("[data-sandbox-action]");
    if (!action) return;
    try {
      const instanceId = action.dataset.sandboxInstance;
      switch (action.dataset.sandboxAction) {
        case "add": model.createInstance({ widget: selectedWidget }); break;
        case "select": model.select(instanceId); break;
        case "remove": model.remove(instanceId); break;
        case "move-left": if (selectedInstance()) model.move(selectedInstance().id, -1); break;
        case "move-right": if (selectedInstance()) model.move(selectedInstance().id, 1); break;
        case "reset-card": if (selectedInstance()) model.resetCard(selectedInstance().id); break;
        case "reset-all": model.resetAll(); break;
        case "apply": break;
        default: break;
      }
    } catch (error) {
      inspectorStatus.textContent = error.message;
    }
  });

  render();
  return Object.freeze({
    model,
    mount() { render(); return Promise.resolve(model.getSnapshot()); },
    destroy() {
      destroyed = true;
      model.destroy();
      runtimeQueue = runtimeQueue.then(async () => {
        for (const [id, record] of [...mounted]) await disposeMounted(id, record);
      }).catch(() => undefined);
      root.textContent = "";
    },
  });
}

export default createConsoleSandbox;
