import { createNebulacast } from "../shared/widget-runtime.mjs";
import { createCatalogRegistry, widgetCatalog } from "../shared/widget-catalog.mjs";

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

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function optionValues(definition, key) {
  const values = definition?.supportedOptions?.[key];
  return Array.isArray(values) ? values.filter(value => typeof value === "string") : [];
}

/**
 * Keep Showcase configuration inside the immutable catalog allow-list.
 * Widget-specific URLs, loaders, and markup never enter this boundary.
 */
export function sanitizeGalleryConfig(definition, requested = {}) {
  const source = isObject(requested) ? requested : {};
  const config = {};
  for (const key of Object.keys(definition?.supportedOptions || {})) {
    const allowed = optionValues(definition, key);
    if (!allowed.length) continue;
    const requestedValue = source[key];
    const defaultValue = definition.defaults?.[key];
    config[key] = allowed.includes(requestedValue)
      ? requestedValue
      : (allowed.includes(defaultValue) ? defaultValue : allowed[0]);
  }
  return config;
}

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
    return sanitizeGalleryConfig(definition, requested);
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

    const config = readCardConfig(cardState, definition);
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
      const allowed = optionValues(definition, key);
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

    const cardState = { card, controls, status, previewRoot, close };
    cards.set(sourceDefinition.type, cardState);
    previewButton.addEventListener("click", () => { void openPreview(sourceDefinition.type); });
    close.addEventListener("click", () => { void closePreview(sourceDefinition.type); });
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
    getSnapshot: () => snapshotOf(cards, instances, errors),
  });
}

export { STANDALONE_LINKS };
export { LEGACY_STANDALONE_LINKS };
export default createShowcaseGallery;
