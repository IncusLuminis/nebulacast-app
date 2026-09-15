import { createNebulacast } from "../shared/widget-runtime.mjs";
import { createCatalogRegistry, widgetCatalog } from "../shared/widget-catalog.mjs";
import { getWidgetOptionValues } from "../shared/widget-config.mjs";
import { createWidgetLabModel } from "./widget-lab-model.mjs";
import { getWidgetLabInspectorMetadata } from "./widget-lab-inspector.mjs";

function appendText(documentRef, tagName, className, text) {
  const element = documentRef.createElement(tagName);
  if (className) element.className = className;
  element.textContent = String(text ?? "");
  return element;
}

function labelFor(value) {
  return String(value).replace(/[-_]/g, " ").replace(/\b\w/g, character => character.toUpperCase());
}

function element(documentRef, tagName, className, role, text) {
  const node = appendText(documentRef, tagName, className, text);
  if (role) node.setAttribute("data-role", role);
  return node;
}

/**
 * Render the multi-instance Widget Lab. The catalog and Registry remain the
 * only source for widget definitions; the model owns all Runtime lifecycles.
 */
export function createWidgetLab({
  root,
  context,
  catalog = widgetCatalog,
  registry = createCatalogRegistry(),
  runtime = null,
  documentRef = root?.ownerDocument || globalThis.document,
} = {}) {
  if (!root || typeof root.appendChild !== "function") throw new TypeError("Widget Lab requires a root element");
  const widgetRuntime = runtime || createNebulacast({ context, registry });
  const previewRoots = new Map();
  const controls = new Map();
  let selectedWidget = catalog[0]?.type || "";
  let mounted = false;
  let destroyed = false;

  const shell = documentRef.createElement("div");
  shell.className = "widget-lab-shell";
  const catalogRegion = documentRef.createElement("aside");
  catalogRegion.className = "widget-lab-catalog";
  catalogRegion.setAttribute("aria-label", "Widget catalog");
  catalogRegion.appendChild(element(documentRef, "h2", "widget-lab-heading", "catalog-heading", "Widget catalog"));
  const widgetSelect = documentRef.createElement("select");
  widgetSelect.setAttribute("data-lab-control", "widget");
  widgetSelect.setAttribute("aria-label", "Widget");
  for (const definition of catalog) {
    const option = documentRef.createElement("option");
    option.value = definition.type;
    option.textContent = definition.title || labelFor(definition.type);
    widgetSelect.appendChild(option);
  }
  widgetSelect.value = selectedWidget;
  catalogRegion.appendChild(widgetSelect);
  const catalogDescription = element(documentRef, "p", "widget-lab-description", "catalog-description");
  catalogRegion.appendChild(catalogDescription);
  const createButton = documentRef.createElement("button");
  createButton.type = "button";
  createButton.className = "widget-lab-button widget-lab-button-primary";
  createButton.setAttribute("data-lab-action", "create");
  createButton.textContent = "Create preview";
  catalogRegion.appendChild(createButton);
  const instanceHeading = element(documentRef, "h3", "widget-lab-subheading", "instance-heading", "Instances");
  catalogRegion.appendChild(instanceHeading);
  const instanceList = documentRef.createElement("div");
  instanceList.className = "widget-lab-instance-list";
  instanceList.setAttribute("data-role", "instance-list");
  catalogRegion.appendChild(instanceList);
  const resetAllButton = documentRef.createElement("button");
  resetAllButton.type = "button";
  resetAllButton.className = "widget-lab-button";
  resetAllButton.setAttribute("data-lab-action", "reset-all");
  resetAllButton.textContent = "Reset all";
  catalogRegion.appendChild(resetAllButton);

  const inspectorRegion = documentRef.createElement("section");
  inspectorRegion.className = "widget-lab-inspector";
  inspectorRegion.setAttribute("aria-label", "Widget inspector");
  inspectorRegion.appendChild(element(documentRef, "h2", "widget-lab-heading", "inspector-heading", "Inspector"));
  const inspectorForm = documentRef.createElement("form");
  inspectorForm.className = "widget-lab-form";
  inspectorForm.setAttribute("data-role", "inspector");
  inspectorRegion.appendChild(inspectorForm);
  const inspectorStatus = element(documentRef, "p", "widget-lab-status", "inspector-status");
  inspectorStatus.setAttribute("aria-live", "polite");
  inspectorRegion.appendChild(inspectorStatus);
  const applyButton = documentRef.createElement("button");
  applyButton.type = "submit";
  applyButton.className = "widget-lab-button widget-lab-button-primary";
  applyButton.setAttribute("data-lab-action", "apply");
  applyButton.textContent = "Apply to selected";
  inspectorRegion.appendChild(applyButton);

  const stage = documentRef.createElement("dialog");
  stage.className = "widget-lab-stage";
  stage.setAttribute("data-role", "preview-stage");
  stage.setAttribute("aria-labelledby", "widget-lab-stage-heading");
  const stageHeader = documentRef.createElement("header");
  stageHeader.className = "widget-lab-stage-header";
  const stageHeading = element(documentRef, "h2", "widget-lab-heading", "stage-heading", "Preview Stage");
  stageHeading.setAttribute("id", "widget-lab-stage-heading");
  stageHeader.appendChild(stageHeading);
  const stageFields = documentRef.createElement("div");
  stageFields.className = "widget-lab-stage-fields";
  const stageControls = {};
  for (const key of ["mode", "width", "height"]) {
    const label = documentRef.createElement("label");
    label.className = "widget-lab-stage-field";
    label.appendChild(appendText(documentRef, "span", "widget-lab-field-label", labelFor(key)));
    const control = key === "mode" ? documentRef.createElement("select") : documentRef.createElement("input");
    if (key !== "mode") {
      control.type = "number";
      control.min = "160";
      control.max = "1600";
      control.step = "1";
    }
    control.setAttribute("data-lab-stage-control", key);
    label.appendChild(control);
    stageFields.appendChild(label);
    stageControls[key] = control;
  }
  stageHeader.appendChild(stageFields);
  const closeButton = documentRef.createElement("button");
  closeButton.type = "button";
  closeButton.className = "widget-lab-button";
  closeButton.setAttribute("data-lab-action", "close-stage");
  closeButton.textContent = "Close";
  const addStageButton = documentRef.createElement("button");
  addStageButton.type = "button";
  addStageButton.className = "widget-lab-button widget-lab-button-primary";
  addStageButton.setAttribute("data-lab-action", "create-stage-instance");
  addStageButton.textContent = "Add instance";
  const applyStageButton = documentRef.createElement("button");
  applyStageButton.type = "button";
  applyStageButton.className = "widget-lab-button widget-lab-button-primary";
  applyStageButton.setAttribute("data-lab-action", "apply-stage");
  applyStageButton.textContent = "Apply";
  stageHeader.appendChild(addStageButton);
  stageHeader.appendChild(applyStageButton);
  stageHeader.appendChild(closeButton);
  stage.appendChild(stageHeader);
  const stageStatus = element(documentRef, "p", "widget-lab-status", "stage-status");
  stageStatus.setAttribute("aria-live", "polite");
  stage.appendChild(stageStatus);
  const stagePreviews = documentRef.createElement("div");
  stagePreviews.className = "widget-lab-stage-previews";
  stagePreviews.setAttribute("data-role", "stage-previews");
  stage.appendChild(stagePreviews);
  const stageHint = element(documentRef, "p", "widget-lab-stage-hint", "stage-hint", "Close keeps instances mounted. Use Reset or Destroy to release them.");
  stage.appendChild(stageHint);

  shell.appendChild(catalogRegion);
  shell.appendChild(inspectorRegion);
  shell.appendChild(stage);
  root.textContent = "";
  root.appendChild(shell);

  function selectedDefinition() {
    return registry.get(selectedWidget);
  }

  function openStage() {
    if (typeof stage.showModal === "function") {
      try { if (!stage.open) stage.showModal(); } catch (_) { stage.setAttribute("open", ""); }
    } else {
      stage.setAttribute("open", "");
    }
  }

  function closeStage() {
    if (typeof stage.close === "function") stage.close();
    else stage.removeAttribute("open");
  }

  function inspectorOptions() {
    const definition = selectedDefinition();
    const metadata = getWidgetLabInspectorMetadata(registry, selectedWidget);
    const next = new Map();
    for (const [key] of Object.entries(definition?.supportedOptions || {})) {
      if (key === "orientation") continue;
      const values = getWidgetOptionValues(registry, selectedWidget, key);
      if (!values.length) continue;
      next.set(key, values);
    }
    return { definition, metadata, options: next };
  }

  function syncStageControls(instance) {
    if (!instance) return;
    const definition = registry.get(instance.widget);
    const modes = definition?.userModes || (definition?.shape === "square" ? ["square"] : ["horizontal", "vertical"]);
    stageControls.mode.textContent = "";
    for (const value of modes) {
      const option = documentRef.createElement("option");
      option.value = value;
      option.textContent = labelFor(value);
      stageControls.mode.appendChild(option);
    }
    stageControls.mode.value = instance.layout.mode;
    stageControls.width.value = String(instance.layout.width);
    stageControls.height.value = String(instance.layout.height);
  }

  function renderInspector(instance = null) {
    const { definition, metadata, options } = inspectorOptions();
    inspectorForm.textContent = "";
    catalogDescription.textContent = definition?.description || "";
    const modeLabel = documentRef.createElement("label");
    modeLabel.className = "widget-lab-field";
    modeLabel.appendChild(appendText(documentRef, "span", "widget-lab-field-label", "Container mode"));
    const mode = documentRef.createElement("select");
    mode.setAttribute("data-lab-control", "mode");
    for (const value of metadata.modes) {
      const option = documentRef.createElement("option");
      option.value = value;
      option.textContent = labelFor(value);
      mode.appendChild(option);
    }
    mode.value = instance?.layout.mode || metadata.modes[0];
    modeLabel.appendChild(mode);
    inspectorForm.appendChild(modeLabel);
    controls.set("mode", mode);
    for (const key of ["width", "height"]) {
      const label = documentRef.createElement("label");
      label.className = "widget-lab-field";
      label.appendChild(appendText(documentRef, "span", "widget-lab-field-label", labelFor(key)));
      const input = documentRef.createElement("input");
      input.type = "number";
      input.min = "160";
      input.max = "1600";
      input.step = "1";
      const fallback = instance?.layout[key] || (metadata.shape === "square" ? 400 : (key === "width" ? 640 : 360));
      input.value = String(fallback);
      input.setAttribute("data-lab-control", key);
      input.setAttribute("aria-label", `${labelFor(key)} of preview container`);
      label.appendChild(input);
      inspectorForm.appendChild(label);
      controls.set(key, input);
    }
    for (const [key, values] of options) {
      const label = documentRef.createElement("label");
      label.className = "widget-lab-field";
      label.appendChild(appendText(documentRef, "span", "widget-lab-field-label", labelFor(key)));
      const select = documentRef.createElement("select");
      select.setAttribute("data-lab-option", key);
      for (const value of values) {
        const option = documentRef.createElement("option");
        option.value = value;
        option.textContent = value;
        if (value === (instance?.config[key] ?? definition.defaults?.[key])) option.selected = true;
        select.appendChild(option);
      }
      select.value = instance?.config[key] ?? definition.defaults?.[key] ?? values[0];
      label.appendChild(select);
      inspectorForm.appendChild(label);
      controls.set(key, select);
    }
    inspectorStatus.textContent = instance
      ? `${instance.id} · ${labelFor(instance.state)}${instance.error ? `: ${instance.error}` : ""}`
      : "Create an instance to open the Preview Stage.";
  }

  function collectInput() {
    const config = {};
    for (const [key, control] of controls) {
      if (key === "mode" || key === "width" || key === "height") continue;
      config[key] = control.value;
    }
    return {
      config,
      layout: {
        mode: controls.get("mode")?.value,
        width: controls.get("width")?.value,
        height: controls.get("height")?.value,
      },
    };
  }

  function renderInstances(snapshot) {
    instanceList.textContent = "";
    stagePreviews.textContent = "";
    for (const instance of snapshot.instances.values()) {
      const item = documentRef.createElement("div");
      item.className = "widget-lab-instance";
      item.setAttribute("data-lab-instance", instance.id);
      const select = documentRef.createElement("button");
      select.type = "button";
      select.className = "widget-lab-instance-select";
      select.textContent = `${instance.id} · ${instance.widget} · ${instance.state}`;
      select.setAttribute("data-lab-action", "select-instance");
      select.addEventListener("click", () => {
        model.select(instance.id);
        selectedWidget = instance.widget;
        widgetSelect.value = selectedWidget;
        renderInspector(model.getInstance(instance.id));
        openStage();
        void model.openPreview(instance.id);
      });
      item.appendChild(select);
      const destroy = documentRef.createElement("button");
      destroy.type = "button";
      destroy.className = "widget-lab-button";
      destroy.setAttribute("data-lab-action", "destroy-instance");
      destroy.textContent = "Destroy";
      destroy.addEventListener("click", async () => {
        await model.reset(instance.id);
        previewRoots.delete(instance.id);
      });
      item.appendChild(destroy);
      instanceList.appendChild(item);
      if (instance.preview === "open") {
        const frame = documentRef.createElement("section");
        frame.className = "widget-lab-preview-frame";
        frame.setAttribute("data-lab-preview-instance", instance.id);
        frame.appendChild(appendText(documentRef, "h3", "widget-lab-preview-title", `${instance.widget} · ${instance.id}`));
        const previewRoot = previewRoots.get(instance.id);
        if (previewRoot) {
          previewRoot.style.width = `${instance.layout.width}px`;
          previewRoot.style.height = `${instance.layout.height}px`;
          previewRoot.setAttribute("data-nc-shape", instance.layout.shape);
          frame.appendChild(previewRoot);
        }
        stagePreviews.appendChild(frame);
      }
    }
    syncStageControls(snapshot.selectedId ? snapshot.instances.get(snapshot.selectedId) : null);
    stageStatus.textContent = snapshot.instances.size ? `${snapshot.instances.size} instance${snapshot.instances.size === 1 ? "" : "s"}` : "No preview instances yet.";
  }

  const model = createWidgetLabModel({
    registry,
    runtime: widgetRuntime,
    rootForInstance: instance => previewRoots.get(instance.id),
    onChange: snapshot => {
      renderInstances(snapshot);
      const selected = snapshot.selectedId ? snapshot.instances.get(snapshot.selectedId) : null;
      if (selected && selected.widget === selectedWidget) renderInspector(selected);
    },
  });

  widgetSelect.addEventListener("change", () => {
    selectedWidget = widgetSelect.value;
    renderInspector();
  });
  async function createInstanceFromInspector() {
    const input = collectInput();
    const instance = model.createInstance({ widget: selectedWidget, config: input.config, layout: input.layout });
    const previewRoot = documentRef.createElement("div");
    previewRoot.className = "widget-lab-preview-root";
    previewRoots.set(instance.id, previewRoot);
    model.select(instance.id);
    openStage();
    await model.openPreview(instance.id);
  }
  createButton.addEventListener("click", createInstanceFromInspector);
  addStageButton.addEventListener("click", createInstanceFromInspector);
  function collectConfigOptions() {
    const config = {};
    for (const [key, control] of controls) {
      if (key === "mode" || key === "width" || key === "height") continue;
      config[key] = control.value;
    }
    return config;
  }
  async function applySelectedFromInspector(input = collectInput()) {
    const selectedId = model.getSnapshot().selectedId;
    if (!selectedId) return;
    await model.update(selectedId, input);
  }
  inspectorForm.addEventListener("submit", async event => {
    event.preventDefault();
    await applySelectedFromInspector();
  });
  applyStageButton.addEventListener("click", () => void applySelectedFromInspector({
    config: collectConfigOptions(),
    layout: {
      mode: stageControls.mode.value,
      width: stageControls.width.value,
      height: stageControls.height.value,
    },
  }));
  closeButton.addEventListener("click", () => {
    const selectedId = model.getSnapshot().selectedId;
    if (selectedId) model.closePreview(selectedId);
    closeStage();
  });
  resetAllButton.addEventListener("click", async () => {
    await model.resetAll();
    previewRoots.clear();
    closeStage();
  });

  function mount() {
    if (destroyed) return Promise.reject(new Error("Widget Lab is destroyed"));
    if (mounted) return Promise.resolve(model.getSnapshot());
    renderInspector();
    renderInstances(model.getSnapshot());
    mounted = true;
    return Promise.resolve(model.getSnapshot());
  }

  async function destroy() {
    if (destroyed) return;
    destroyed = true;
    await model.destroy();
    previewRoots.clear();
    root.textContent = "";
    mounted = false;
  }

  return Object.freeze({
    mount,
    destroy,
    model,
    getSnapshot: model.getSnapshot,
  });
}

export default createWidgetLab;
