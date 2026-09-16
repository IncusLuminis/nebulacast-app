import { createCatalogRegistry, widgetCatalog } from "../shared/widget-catalog.mjs";

export const PUBLIC_EMBED = definition => definition?.javascriptEmbed === true && definition?.divEmbed === true;

function labelFor(value) {
  return String(value).replace(/[-_]/g, " ").replace(/\b\w/g, character => character.toUpperCase());
}

function text(documentRef, tagName, className, value) {
  const node = documentRef.createElement(tagName);
  if (className) node.className = className;
  node.textContent = String(value ?? "");
  return node;
}

export function buildShowcaseEmbedUrl(widget, mode) {
  return `/showcase-javascript/embed.html?${new URLSearchParams({ widget, mode })}`;
}

export function createShowcaseGallery({ root, catalog = widgetCatalog, registry = createCatalogRegistry(), documentRef = root?.ownerDocument || globalThis.document } = {}) {
  if (!root || typeof root.appendChild !== "function") throw new TypeError("Showcase Gallery requires a root element");
  if (!Array.isArray(catalog)) throw new TypeError("Showcase Gallery requires a widget catalog");
  if (!registry || typeof registry.get !== "function") throw new TypeError("Showcase Gallery requires a widget registry");
  let mounted = false;
  let destroyed = false;

  function renderCard(source) {
    const definition = { ...(registry.get(source.type) || {}), ...source };
    const card = documentRef.createElement("article");
    card.className = "card gallery-card";
    card.setAttribute("data-widget-type", definition.type);
    const top = documentRef.createElement("div");
    top.className = "card-top";
    top.appendChild(text(documentRef, "span", "card-name", definition.title || labelFor(definition.type)));
    top.appendChild(text(documentRef, "span", "card-type", definition.type));
    card.appendChild(top);
    card.appendChild(text(documentRef, "p", "card-desc", definition.description || "No description provided."));
    const meta = documentRef.createElement("div");
    meta.className = "card-meta gallery-meta";
    meta.appendChild(text(documentRef, "span", "meta-version", `Version ${definition.version}`));
    meta.appendChild(text(documentRef, "span", "meta-shape", definition.shape === "square" ? "Square widget" : "Horizontal / vertical widget"));
    card.appendChild(meta);

    const fieldset = documentRef.createElement("fieldset");
    fieldset.className = "gallery-mode-controls";
    fieldset.appendChild(text(documentRef, "legend", "", "Form factor"));
    const mode = documentRef.createElement("select");
    mode.setAttribute("data-gallery-mode", "");
    mode.setAttribute("aria-label", `${definition.title || definition.type} form factor`);
    const modes = definition.shape === "square" ? ["square"] : ["horizontal", "vertical"];
    const defaultMode = definition.shape === "square" ? "square" : (definition.defaults?.orientation === "vertical" ? "vertical" : "horizontal");
    for (const value of modes) {
      const option = documentRef.createElement("option");
      option.value = value;
      option.textContent = labelFor(value);
      option.selected = value === defaultMode;
      mode.appendChild(option);
    }
    mode.value = defaultMode;
    fieldset.appendChild(mode);
    card.appendChild(fieldset);

    const actions = documentRef.createElement("div");
    actions.className = "card-links";
    const embed = documentRef.createElement("button");
    embed.type = "button";
    embed.className = "card-link demo";
    embed.setAttribute("data-gallery-action", "embed");
    embed.textContent = "Embed";
    const canEmbed = definition.standaloneHost === true || PUBLIC_EMBED(definition);
    embed.disabled = !canEmbed;
    if (canEmbed) {
      const updateUrl = () => embed.setAttribute("data-embed-url", buildShowcaseEmbedUrl(definition.type, mode.value));
      updateUrl();
      mode.addEventListener("change", updateUrl);
      embed.addEventListener("click", () => {
        const location = documentRef.defaultView?.location;
        if (location) location.href = buildShowcaseEmbedUrl(definition.type, mode.value);
      });
    } else {
      embed.setAttribute("data-embed-unavailable", "true");
      embed.title = "This widget is not available for public embedding yet";
    }
    actions.appendChild(embed);
    card.appendChild(actions);
    if (!canEmbed) {
      const unavailable = text(documentRef, "p", "gallery-unavailable", "Embed unavailable for this widget.");
      unavailable.setAttribute("data-role", "embed-unavailable");
      card.appendChild(unavailable);
    }
    return card;
  }

  function mount() {
    if (destroyed) return Promise.reject(new Error("Showcase Gallery is destroyed"));
    if (mounted) return Promise.resolve();
    root.textContent = "";
    const group = documentRef.createElement("section");
    group.className = "group gallery-group";
    group.appendChild(text(documentRef, "div", "group-label", "Widgets"));
    const cards = documentRef.createElement("div");
    cards.className = "cards";
    for (const definition of catalog) if (definition?.type) cards.appendChild(renderCard(definition));
    group.appendChild(cards);
    root.appendChild(group);
    mounted = true;
    const timestamp = documentRef.getElementById?.("footer-ts");
    if (timestamp) timestamp.textContent = "Catalog loaded";
    return Promise.resolve();
  }

  function destroy() { if (!destroyed) { destroyed = true; root.textContent = ""; mounted = false; } }
  return Object.freeze({ mount, destroy });
}

export default createShowcaseGallery;
