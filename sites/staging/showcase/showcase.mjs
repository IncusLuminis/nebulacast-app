import { createNebulacast } from "../shared/widget-runtime.mjs";
import { createCatalogRegistry, widgetCatalog } from "../shared/widget-catalog.mjs";
import {
  buildStandaloneWidgetUrl,
  buildIframeEmbedSnippet,
  createWidgetConfig,
  getWidgetOptionValues,
  JAVASCRIPT_EMBED_CONFIG_KEYS,
  JAVASCRIPT_EMBED_MODULE_PATH,
  serializeJavascriptEmbedSpecification,
  serializeWidgetConfig,
} from "../shared/widget-config.mjs";

const STANDALONE_LINKS = Object.freeze({
  hero: Object.freeze({ href: "/", label: "Console" }),
  astro: Object.freeze({ href: "/weather/", label: "Standalone" }),
  "sun-moon": Object.freeze({ href: "/sun/", label: "Standalone" }),
  weather: Object.freeze({ href: "/weather/", label: "Standalone" }),
  map: Object.freeze({ href: "/map/", label: "Standalone" }),
  location: Object.freeze({ href: "/weather/", label: "Standalone" }),
  sky: Object.freeze({ href: "/sky/", label: "Standalone" }),
  news: Object.freeze({ href: "/news/", label: "Standalone" }),
  events: Object.freeze({ href: "/calendar/", label: "Standalone" }),
  alerts: Object.freeze({ href: "/sky/alerts.html", label: "Standalone" }),
});

const LEGACY_STANDALONE_LINKS = Object.freeze([
  Object.freeze({ id: "conditions", href: "/weather/weather-vertical.html", label: "Conditions" }),
  Object.freeze({ id: "space-weather", href: "/helio/", label: "Space Weather" }),
  Object.freeze({ id: "best-objects", href: "/sky/objects.html", label: "Best Objects" }),
]);

function labelFor(value) {
  return String(value).replace(/[-_]/g, " ").replace(/\b\w/g, character => character.toUpperCase());
}

function appendText(documentRef, tagName, className, text) {
  const element = documentRef.createElement(tagName);
  if (className) element.className = className;
  element.textContent = String(text ?? "");
  return element;
}

function snapshotOf(cards, instances, errors) {
  return {
    cards: new Map(cards),
    instances: new Map(instances),
    errors: new Map(errors),
  };
}

/**
 * Render the registry catalog as an intentionally lazy Showcase gallery.
 * Cards are catalog metadata; previews are the only path that calls Runtime.mount().
 */
export function createShowcaseGallery({
  root,
  context,
  catalog = widgetCatalog,
  registry = createCatalogRegistry(),
  runtime = null,
  documentRef = root?.ownerDocument || globalThis.document,
  resolveAutoOrientation,
} = {}) {
  if (!root || typeof root.appendChild !== "function") {
    throw new TypeError("Showcase Gallery requires a root element");
  }
  if (!Array.isArray(catalog)) throw new TypeError("Showcase Gallery requires a widget catalog");
  if (!registry || typeof registry.get !== "function") throw new TypeError("Showcase Gallery requires a widget registry");

  const widgetRuntime = runtime || createNebulacast({ context, registry, resolveAutoOrientation });
  const cards = new Map();
  const instances = new Map();
  const pending = new Map();
  const errors = new Map();
  let mounted = false;
  let destroyed = false;

  function setCardState(cardState, state, message = "") {
    cardState.card.setAttribute("data-gallery-state", state);
    cardState.status.textContent = message;
    cardState.close.hidden = state === "idle" || state === "loading";
  }

  function readCardConfig(cardState, definition) {
    const requested = {};
    for (const [key, control] of cardState.controls) requested[key] = control.value;
    return createWidgetConfig(registry, definition.type, requested);
  }

  function updateCardConfig(cardState, definition) {
    cardState.configExport = readCardConfig(cardState, definition);
    cardState.serializedConfig = serializeWidgetConfig(cardState.configExport);
    cardState.configOutput.textContent = cardState.serializedConfig;
    if (cardState.hostOutput) {
      const url = buildStandaloneWidgetUrl(registry, cardState.configExport);
      cardState.iframeUrl = url;
      cardState.iframeSnippet = buildIframeEmbedSnippet(registry, cardState.configExport, {
        title: definition.title || definition.type,
      });
      cardState.hostOutput.iframeUrlOutput.textContent = url;
      cardState.hostOutput.iframeSnippetOutput.textContent = cardState.iframeSnippet;
      cardState.hostOutput.openHost.href = url;
    }
    if (cardState.javascriptOutput) {
      const serializedSpecification = serializeJavascriptEmbedSpecification(registry, {
        widget: definition.type,
        config: Object.fromEntries(JAVASCRIPT_EMBED_CONFIG_KEYS
          .filter(key => cardState.configExport.config[key] !== undefined)
          .map(key => [key, cardState.configExport.config[key]])),
      });
      cardState.javascriptSnippet = `import { mount } from "${JAVASCRIPT_EMBED_MODULE_PATH}";\n\nconst root = document.querySelector("#widget-root");\nmount(root, ${serializedSpecification});`;
      cardState.javascriptOutput.snippet.textContent = cardState.javascriptSnippet;
    }
    cardState.copyStatus.textContent = "Ready to copy";
  }

  function fallbackCopy(text) {
    const textarea = documentRef.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    const container = documentRef.body || root;
    container.appendChild(textarea);
    textarea.select?.();
    let copied = false;
    try { copied = documentRef.execCommand?.("copy") === true; } catch (_) {}
    if (typeof textarea.remove === "function") textarea.remove();
    else container.removeChild?.(textarea);
    return copied;
  }

  async function copyConfig(type) {
    const cardState = cards.get(type);
    if (!cardState) return false;
    const text = cardState.serializedConfig;
    const navigatorRef = documentRef.defaultView?.navigator || (typeof navigator !== "undefined" ? navigator : null);
    try {
      if (typeof navigatorRef?.clipboard?.writeText === "function") {
        try {
          await navigatorRef.clipboard.writeText(text);
          cardState.copyStatus.textContent = "Copied config";
          return true;
        } catch (_) {}
      }
      if (fallbackCopy(text)) {
        cardState.copyStatus.textContent = "Copied config (fallback)";
        return true;
      }
    } catch (_) {}
    cardState.copyStatus.textContent = "Copy unavailable — select the config text";
    return false;
  }

  async function copyStandaloneOutput(type, kind) {
    const cardState = cards.get(type);
    if (!cardState?.hostOutput) return false;
    const text = kind === "html" ? cardState.iframeSnippet : cardState.iframeUrl;
    const label = kind === "html" ? "Copied HTML" : "Copied URL";
    const fallbackLabel = kind === "html" ? "Copied HTML (fallback)" : "Copied URL (fallback)";
    const navigatorRef = documentRef.defaultView?.navigator || (typeof navigator !== "undefined" ? navigator : null);
    try {
      if (typeof navigatorRef?.clipboard?.writeText === "function") {
        try {
          await navigatorRef.clipboard.writeText(text);
          cardState.hostOutput.outputCopyStatus.textContent = label;
          return true;
        } catch (_) {}
      }
      if (fallbackCopy(text)) {
        cardState.hostOutput.outputCopyStatus.textContent = fallbackLabel;
        return true;
      }
    } catch (_) {}
    cardState.hostOutput.outputCopyStatus.textContent = "Copy unavailable — select the output text";
    return false;
  }

  async function copyJavascriptSnippet(type) {
    const cardState = cards.get(type);
    if (!cardState?.javascriptOutput) return false;
    const navigatorRef = documentRef.defaultView?.navigator || (typeof navigator !== "undefined" ? navigator : null);
    try {
      if (typeof navigatorRef?.clipboard?.writeText === "function") {
        try {
          await navigatorRef.clipboard.writeText(cardState.javascriptSnippet);
          cardState.javascriptOutput.status.textContent = "Copied JavaScript";
          return true;
        } catch (_) {}
      }
      if (fallbackCopy(cardState.javascriptSnippet)) {
        cardState.javascriptOutput.status.textContent = "Copied JavaScript (fallback)";
        return true;
      }
    } catch (_) {}
    cardState.javascriptOutput.status.textContent = "Copy unavailable — select the JavaScript text";
    return false;
  }

  async function closePreview(type) {
    const waiting = pending.get(type);
    if (waiting) {
      const instance = await waiting.catch(() => null);
      if (instance && instances.get(type) === instance) return closePreview(type);
    }
    const instance = instances.get(type);
    if (!instance) return;
    try {
      await instance.destroy?.();
      errors.delete(type);
    } catch (error) {
      errors.set(type, error instanceof Error ? error : new Error(String(error)));
    } finally {
      instances.delete(type);
      const cardState = cards.get(type);
      if (cardState) {
        cardState.previewRoot.textContent = "";
        setCardState(cardState, "idle", "Preview closed");
      }
    }
  }

  function openPreview(type) {
    if (destroyed) return Promise.reject(new Error("Showcase Gallery is destroyed"));
    const cardState = cards.get(type);
    const catalogDefinition = catalog.find(definition => definition.type === type);
    const definition = registry.get(type);
    if (!cardState || !catalogDefinition || !definition?.galleryPreview || !catalogDefinition.galleryPreview) {
      return Promise.resolve(null);
    }
    if (instances.has(type)) return Promise.resolve(instances.get(type));
    if (pending.has(type)) return pending.get(type);

    const config = cardState.configExport.config;
    cardState.previewRoot.textContent = "";
    setCardState(cardState, "loading", "Loading preview…");
    const request = (async () => {
      try {
        const instance = await widgetRuntime.mount(cardState.previewRoot, {
          widget: definition.type,
          config,
        });
        if (destroyed) {
          await instance?.destroy?.();
          return null;
        }
        instances.set(type, instance);
        errors.delete(type);
        setCardState(cardState, "ready", "Preview ready");
        return instance;
      } catch (error) {
        const normalized = error instanceof Error ? error : new Error(String(error));
        errors.set(type, normalized);
        setCardState(cardState, "error", `Preview unavailable: ${normalized.message}`);
        return null;
      } finally {
        pending.delete(type);
      }
    })();
    pending.set(type, request);
    return request;
  }

  function renderCard(sourceDefinition) {
    const definition = registry.get(sourceDefinition.type) || sourceDefinition;
    const card = documentRef.createElement("article");
    card.className = "card gallery-card";
    card.setAttribute("data-widget-type", sourceDefinition.type);
    card.setAttribute("data-gallery-preview", definition.galleryPreview === true ? "true" : "false");

    const top = documentRef.createElement("div");
    top.className = "card-top";
    top.appendChild(appendText(documentRef, "span", "card-name", definition.title || sourceDefinition.type));
    top.appendChild(appendText(documentRef, "span", "card-type", sourceDefinition.type));
    card.appendChild(top);
    card.appendChild(appendText(documentRef, "p", "card-desc", definition.description || "No description provided."));

    const meta = documentRef.createElement("div");
    meta.className = "card-meta gallery-meta";
    meta.appendChild(appendText(documentRef, "span", "meta-version", `Version ${definition.version}`));
    for (const [capability, enabled] of Object.entries(definition.capabilities || {})) {
      meta.appendChild(appendText(documentRef, "span", "meta-capability", `${labelFor(capability)}: ${enabled ? "yes" : "no"}`));
    }
    card.appendChild(meta);

    const options = documentRef.createElement("div");
    options.className = "gallery-options";
    const controls = new Map();
    for (const [key] of Object.entries(definition.supportedOptions || {})) {
      const allowed = getWidgetOptionValues(registry, definition.type, key);
      if (!allowed.length) continue;
      const label = documentRef.createElement("label");
      label.className = "gallery-option";
      label.appendChild(appendText(documentRef, "span", "gallery-option-name", labelFor(key)));
      const select = documentRef.createElement("select");
      select.setAttribute("data-gallery-option", key);
      for (const value of allowed) {
        const option = documentRef.createElement("option");
        option.value = value;
        option.textContent = value;
        if (value === definition.defaults?.[key]) option.selected = true;
        select.appendChild(option);
      }
      controls.set(key, select);
      label.appendChild(select);
      options.appendChild(label);
    }
    card.appendChild(options);

    const configBlock = documentRef.createElement("div");
    configBlock.className = "gallery-config-block";
    const configLabel = appendText(documentRef, "div", "gallery-config-label", "Widget config");
    configLabel.setAttribute("data-role", "config-label");
    configBlock.appendChild(configLabel);
    const configOutput = documentRef.createElement("pre");
    configOutput.className = "gallery-config-output";
    configOutput.setAttribute("data-role", "config-output");
    configBlock.appendChild(configOutput);
    const copyButton = documentRef.createElement("button");
    copyButton.type = "button";
    copyButton.className = "card-link gallery-copy-button";
    copyButton.setAttribute("data-gallery-action", "copy-config");
    copyButton.setAttribute("aria-label", `Copy ${definition.type} widget config`);
    copyButton.textContent = "Copy config";
    configBlock.appendChild(copyButton);
    const copyStatus = appendText(documentRef, "span", "gallery-copy-status", "Ready to copy");
    copyStatus.setAttribute("data-role", "copy-status");
    copyStatus.setAttribute("aria-live", "polite");
    configBlock.appendChild(copyStatus);
    card.appendChild(configBlock);

    const hostOutput = definition.standaloneHost === true;
    let hostOutputState = null;
    const outputBlock = documentRef.createElement("div");
    outputBlock.className = "gallery-embed-output";
    if (hostOutput) {
      outputBlock.setAttribute("data-role", "iframe-output");
      outputBlock.appendChild(appendText(documentRef, "div", "gallery-output-label", "Standalone iframe output"));
      const urlOutput = documentRef.createElement("code");
      urlOutput.className = "gallery-iframe-url";
      urlOutput.setAttribute("data-role", "iframe-url");
      outputBlock.appendChild(urlOutput);
      const snippetOutput = documentRef.createElement("pre");
      snippetOutput.className = "gallery-iframe-snippet";
      snippetOutput.setAttribute("data-role", "iframe-snippet");
      outputBlock.appendChild(snippetOutput);
      const outputActions = documentRef.createElement("div");
      outputActions.className = "gallery-output-actions";
      const copyUrlButton = documentRef.createElement("button");
      copyUrlButton.type = "button";
      copyUrlButton.className = "card-link gallery-copy-output-button";
      copyUrlButton.setAttribute("data-gallery-action", "copy-iframe-url");
      copyUrlButton.textContent = "Copy URL";
      outputActions.appendChild(copyUrlButton);
      const copyHtmlButton = documentRef.createElement("button");
      copyHtmlButton.type = "button";
      copyHtmlButton.className = "card-link gallery-copy-output-button";
      copyHtmlButton.setAttribute("data-gallery-action", "copy-iframe-html");
      copyHtmlButton.textContent = "Copy HTML";
      outputActions.appendChild(copyHtmlButton);
      const openHost = documentRef.createElement("a");
      openHost.className = "card-link";
      openHost.setAttribute("data-gallery-action", "open-host");
      openHost.target = "_blank";
      openHost.rel = "noopener";
      openHost.textContent = "↗ Open host";
      outputActions.appendChild(openHost);
      outputBlock.appendChild(outputActions);
      const outputCopyStatus = appendText(documentRef, "span", "gallery-output-copy-status", "Ready to copy");
      outputCopyStatus.setAttribute("data-role", "iframe-copy-status");
      outputCopyStatus.setAttribute("aria-live", "polite");
      outputBlock.appendChild(outputCopyStatus);
      card.appendChild(outputBlock);
      hostOutputState = {
        outputBlock,
        iframeUrlOutput: urlOutput,
        iframeSnippetOutput: snippetOutput,
        openHost,
        outputCopyStatus,
        copyUrlButton,
        copyHtmlButton,
      };
    } else {
      outputBlock.appendChild(appendText(documentRef, "span", "gallery-output-unavailable", "Iframe output unavailable"));
      outputBlock.setAttribute("data-role", "iframe-unavailable");
      card.appendChild(outputBlock);
    }

    const javascriptEmbed = definition.javascriptEmbed === true;
    let javascriptOutputState = null;
    const javascriptOutputBlock = documentRef.createElement("div");
    javascriptOutputBlock.className = "gallery-javascript-output";
    if (javascriptEmbed) {
      javascriptOutputBlock.setAttribute("data-role", "javascript-embed-output");
      javascriptOutputBlock.appendChild(appendText(documentRef, "div", "gallery-output-label", "JavaScript embed"));
      const javascriptSnippet = documentRef.createElement("pre");
      javascriptSnippet.className = "gallery-javascript-snippet";
      javascriptSnippet.setAttribute("data-role", "javascript-embed-snippet");
      javascriptOutputBlock.appendChild(javascriptSnippet);
      const copyJavascript = documentRef.createElement("button");
      copyJavascript.type = "button";
      copyJavascript.className = "card-link gallery-copy-output-button";
      copyJavascript.setAttribute("data-gallery-action", "copy-javascript-embed");
      copyJavascript.textContent = "Copy JavaScript";
      javascriptOutputBlock.appendChild(copyJavascript);
      const javascriptStatus = appendText(documentRef, "span", "gallery-javascript-copy-status", "Ready to copy");
      javascriptStatus.setAttribute("data-role", "javascript-embed-copy-status");
      javascriptStatus.setAttribute("aria-live", "polite");
      javascriptOutputBlock.appendChild(javascriptStatus);
      card.appendChild(javascriptOutputBlock);
      javascriptOutputState = { snippet: javascriptSnippet, copy: copyJavascript, status: javascriptStatus };
    } else {
      javascriptOutputBlock.appendChild(appendText(documentRef, "span", "gallery-output-unavailable", "JavaScript embed unavailable"));
      javascriptOutputBlock.setAttribute("data-role", "javascript-embed-unavailable");
      card.appendChild(javascriptOutputBlock);
    }

    const links = documentRef.createElement("div");
    links.className = "card-links";
    const standalone = STANDALONE_LINKS[sourceDefinition.type];
    if (standalone) {
      const link = documentRef.createElement("a");
      link.className = "card-link";
      link.href = standalone.href;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = `↗ ${standalone.label}`;
      links.appendChild(link);
    }
    const previewButton = documentRef.createElement("button");
    previewButton.type = "button";
    previewButton.className = "card-link demo gallery-preview-button";
    previewButton.setAttribute("data-gallery-action", "preview");
    previewButton.textContent = "▶ Preview";
    previewButton.disabled = definition.galleryPreview !== true;
    if (previewButton.disabled) previewButton.title = "Preview is not enabled for this widget";
    links.appendChild(previewButton);
    card.appendChild(links);

    const status = appendText(documentRef, "p", "gallery-status", definition.galleryPreview === true ? "Preview idle" : "Preview not enabled");
    status.setAttribute("data-role", "gallery-status");
    card.appendChild(status);
    const preview = documentRef.createElement("div");
    preview.className = "gallery-preview";
    preview.setAttribute("data-role", "gallery-preview");
    const previewRoot = documentRef.createElement("div");
    previewRoot.className = "gallery-preview-root";
    previewRoot.setAttribute("data-role", "preview-root");
    preview.appendChild(previewRoot);
    const close = documentRef.createElement("button");
    close.type = "button";
    close.className = "card-link gallery-close-button";
    close.setAttribute("data-gallery-action", "close");
    close.textContent = "× Close";
    close.hidden = true;
    preview.appendChild(close);
    card.appendChild(preview);

    const cardState = { card, controls, status, previewRoot, close, configOutput, copyStatus, hostOutput: hostOutputState, javascriptOutput: javascriptOutputState, javascriptSnippet: "", configExport: null, serializedConfig: "" };
    cards.set(sourceDefinition.type, cardState);
    updateCardConfig(cardState, definition);
    for (const control of controls.values()) {
      control.addEventListener("change", () => {
        updateCardConfig(cardState, definition);
        if (instances.has(sourceDefinition.type)) void closePreview(sourceDefinition.type);
      });
    }
    previewButton.addEventListener("click", () => { void openPreview(sourceDefinition.type); });
    close.addEventListener("click", () => { void closePreview(sourceDefinition.type); });
    copyButton.addEventListener("click", () => { void copyConfig(sourceDefinition.type); });
    cardState.hostOutput?.copyUrlButton.addEventListener("click", () => { void copyStandaloneOutput(sourceDefinition.type, "url"); });
    cardState.hostOutput?.copyHtmlButton.addEventListener("click", () => { void copyStandaloneOutput(sourceDefinition.type, "html"); });
    cardState.javascriptOutput?.copy.addEventListener("click", () => { void copyJavascriptSnippet(sourceDefinition.type); });
    return card;
  }

  function renderLegacyLinks() {
    const section = documentRef.createElement("section");
    section.className = "group gallery-legacy-group";
    section.appendChild(appendText(documentRef, "div", "group-label", "Legacy standalone entry points"));
    const links = documentRef.createElement("div");
    links.className = "card-links gallery-legacy-links";
    for (const entry of LEGACY_STANDALONE_LINKS) {
      const link = documentRef.createElement("a");
      link.className = "card-link";
      link.setAttribute("data-gallery-legacy-link", entry.id);
      link.setAttribute("href", entry.href);
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = `↗ ${entry.label}`;
      links.appendChild(link);
    }
    section.appendChild(links);
    return section;
  }

  function mount() {
    if (destroyed) return Promise.reject(new Error("Showcase Gallery is destroyed"));
    if (mounted) return Promise.resolve(snapshotOf(cards, instances, errors));
    cards.clear();
    root.textContent = "";
    const groups = new Map();
    for (const sourceDefinition of catalog) {
      if (!sourceDefinition || typeof sourceDefinition.type !== "string") continue;
      const groupName = sourceDefinition.galleryGroup || "Widgets";
      if (!groups.has(groupName)) groups.set(groupName, []);
      groups.get(groupName).push(sourceDefinition);
    }
    for (const [groupName, definitions] of groups) {
      const group = documentRef.createElement("section");
      group.className = "group gallery-group";
      group.appendChild(appendText(documentRef, "div", "group-label", groupName));
      const cardGrid = documentRef.createElement("div");
      cardGrid.className = "cards";
      for (const definition of definitions) cardGrid.appendChild(renderCard(definition));
      group.appendChild(cardGrid);
      root.appendChild(group);
    }
    root.appendChild(renderLegacyLinks());
    mounted = true;
    const timestamp = documentRef.getElementById?.("footer-ts");
    if (timestamp) timestamp.textContent = `Catalog loaded ${new Date().toLocaleString("en-GB", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}`;
    return Promise.resolve(snapshotOf(cards, instances, errors));
  }

  async function destroy() {
    if (destroyed) return;
    destroyed = true;
    await Promise.all([...cards.keys()].map(type => closePreview(type)));
    root.textContent = "";
    cards.clear();
    mounted = false;
  }

  return Object.freeze({
    mount,
    openPreview,
    closePreview,
    destroy,
    getInstance: type => instances.get(type),
    getInstances: () => new Map(instances),
    getErrors: () => new Map(errors),
    getConfig: type => cards.get(type)?.configExport,
    getSerializedConfig: type => cards.get(type)?.serializedConfig,
    copyConfig,
    getSnapshot: () => snapshotOf(cards, instances, errors),
  });
}

export { STANDALONE_LINKS };
export { LEGACY_STANDALONE_LINKS };
export default createShowcaseGallery;
