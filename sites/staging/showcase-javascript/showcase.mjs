const STAGING_ORIGIN = "https://staging.nebulacast.app";

export const SHOWCASE_GROUPS = Object.freeze([
  Object.freeze({
    title: "Observation",
    cards: Object.freeze([
      Object.freeze({ title: "Observer", src: "/weather/", standalone: "/weather/", description: "Full observing suite: hourly quality score, forecast charts, profile modes, location selector, Sun/Moon panel, cloud map, and sky integration." }),
      Object.freeze({ title: "Conditions", src: "/weather/weather-vertical.html", standalone: "/weather/weather-vertical.html", description: "Simplified observing conditions panel: vertical forecast strip with hourly scores and key atmospheric parameters." }),
      Object.freeze({ title: "Cloud Map", src: "/map/", standalone: "/map/", description: "Interactive map with terrain, cloud cover, radar tiles, wind, isobars, and animated forecast layers via Leaflet.", status: "Updated 23h ago", statusTone: "warning" }),
      Object.freeze({ title: "Sun & Moon", src: "/sun/", standalone: "/sun/", description: "Sun altitude equation with civil/astronomical twilight bands and Moon phase. Covers today ±3 days." }),
      Object.freeze({ title: "Sky", src: "/sky/", standalone: "/sky/", description: "Real-time sky chart with stars, DSO objects, Milky Way, constellations, planets, and NEO/GCN alert overlays on a canvas renderer.", status: "Updated 2h ago", statusTone: "notice" }),
      Object.freeze({ title: "Space Weather", src: "/helio/", standalone: "/helio/", description: "Solar activity panel: Kp index, G/R/S scales, solar wind, CME tracking, aurora hint, and observer impact assessment.", status: "Updated 6h ago", statusTone: "notice" }),
    ]),
  }),
  Object.freeze({
    title: "Events",
    cards: Object.freeze([
      Object.freeze({ title: "Calendar", src: "/calendar/", standalone: "/calendar/", description: "Sky event calendar listing upcoming meteors, eclipses, conjunctions, occultations, and comets with filter controls." }),
      Object.freeze({ title: "Best Objects", src: "/sky/objects.html", standalone: "/sky/objects.html", description: "Ranked list of tonight's best observable objects: planets, DSOs, and calendar events scored by altitude, visibility window, and darkness quality." }),
      Object.freeze({ title: "Sky Alerts", src: "/sky/alerts.html", standalone: "/sky/alerts.html", description: "Live feed of significant space events: gamma-ray bursts, transients, NEOCP candidates, near-Earth objects, and planetary defense risk assessments. Sortable by type, date, or hazard score." }),
    ]),
  }),
]);

export function buildStandaloneUrl(route) {
  return new URL(route, STAGING_ORIGIN).href;
}

export function buildEmbedUrl(src, title) {
  const query = new URLSearchParams({ src, title });
  return `${STAGING_ORIGIN}/embed/?${query}`;
}

function createText(documentRef, tagName, className, value) {
  const element = documentRef.createElement(tagName);
  if (className) element.className = className;
  element.textContent = value;
  return element;
}

function createLink(documentRef, className, label, href, action) {
  const link = documentRef.createElement("a");
  link.className = className;
  link.setAttribute("href", href);
  link.setAttribute("target", "_blank");
  link.setAttribute("rel", "noopener");
  link.setAttribute("data-showcase-action", action);
  link.textContent = label;
  return link;
}

function renderCard(documentRef, definition) {
  const card = documentRef.createElement("article");
  card.className = "showcase-card";
  card.setAttribute("data-widget-title", definition.title);
  card.appendChild(createText(documentRef, "h2", "showcase-card-title", definition.title));
  card.appendChild(createText(documentRef, "p", "showcase-card-description", definition.description));
  const status = createText(documentRef, "p", "showcase-card-status", definition.status || "—");
  if (definition.statusTone) status.classList.add(`is-${definition.statusTone}`);
  status.setAttribute("data-status-tone", definition.statusTone || "none");
  card.appendChild(status);
  const actions = documentRef.createElement("div");
  actions.className = "showcase-card-actions";
  actions.appendChild(createLink(documentRef, "showcase-action showcase-action-standalone", "↗ Standalone", buildStandaloneUrl(definition.standalone), "standalone"));
  actions.appendChild(createLink(documentRef, "showcase-action showcase-action-embed", "◇ Embed", buildEmbedUrl(definition.src, definition.title), "embed"));
  card.appendChild(actions);
  return card;
}

export function createShowcaseGallery({ root, groups = SHOWCASE_GROUPS, documentRef = root?.ownerDocument || globalThis.document } = {}) {
  if (!root || typeof root.appendChild !== "function") throw new TypeError("Showcase Gallery requires a root element");
  if (!Array.isArray(groups)) throw new TypeError("Showcase Gallery requires gallery groups");
  let mounted = false;
  let destroyed = false;
  function mount() {
    if (destroyed) return Promise.reject(new Error("Showcase Gallery is destroyed"));
    if (mounted) return Promise.resolve();
    root.textContent = "";
    for (const groupDefinition of groups) {
      const group = documentRef.createElement("section");
      group.className = "showcase-group";
      group.setAttribute("data-showcase-group", groupDefinition.title.toLowerCase());
      group.appendChild(createText(documentRef, "h2", "showcase-group-title", groupDefinition.title));
      const cards = documentRef.createElement("div");
      cards.className = "showcase-cards";
      for (const cardDefinition of groupDefinition.cards || []) cards.appendChild(renderCard(documentRef, cardDefinition));
      group.appendChild(cards);
      root.appendChild(group);
    }
    mounted = true;
    return Promise.resolve();
  }
  function destroy() { destroyed = true; mounted = false; root.textContent = ""; }
  return Object.freeze({ mount, destroy });
}

export default createShowcaseGallery;
