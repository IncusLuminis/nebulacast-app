const EVENT_FILTERS = Object.freeze(["All", "METEORS", "ECLIPSES", "CONJUNCTIONS", "OCCULTATIONS", "COMETS"]);
const NEWS_FILTERS = Object.freeze(["All", "News", "Science", "Videos", "Images", "Nebulacast"]);

const slots = [
  { id: "hero", selector: "#console-hero", widget: "hero", config: {} },
  { id: "location", selector: "#w-location", widget: "location", config: {} },
  { id: "weather", selector: "#w-weather", widget: "weather", config: {
    orientation: "horizontal",
    mode: "observing",
  } },
  { id: "weather-matrix", selector: "#w-weather-matrix", widget: "weather", config: {
    orientation: "horizontal",
    mode: "matrix",
  } },
  { id: "sun", selector: "#w-sun", widget: "sun-moon", config: {} },
  { id: "sunmoon-panel", selector: "#w-sunmoon-panel", widget: "sun-moon", config: {} },
  { id: "sky", selector: "#skyMount", widget: "sky", config: {
    options: {
      showSunMoon: true,
      showMilkyWay: true,
      showGridEq: true,
      showConstellations: true,
      showObjects: true,
      showAlerts: true,
    },
  } },
  { id: "dashboard-sky", selector: "#db-sky-root", widget: "sky", config: {
    // The dashboard anchor owns a square box; orientation stays internal to
    // the existing Sky renderer and is never exposed as a user mode here.
    orientation: "horizontal",
  } },
  { id: "alerts", selector: "#fs-sky", widget: "alerts", config: { orientation: "vertical", maxItems: 20 } },
  { id: "events", selector: "#nrc-main", widget: "events", config: {
    jsonUrl: "/calendar/daily_signal.json",
    rssUrl: "/alerts/rss.xml",
    maxItems: 25,
    filters: EVENT_FILTERS,
    iconBase: "/assets/icons/alerts",
  } },
  { id: "sidebar-events", selector: "#fs-cal", widget: "events", config: {
    maxItems: 8,
    filters: EVENT_FILTERS,
    iconBase: "/assets/icons/alerts",
  } },
  { id: "news", selector: "#nrw-main", widget: "news", config: {
    rssUrl: "/news/rss.xml",
    maxItems: 15,
    parseMax: 300,
    filters: NEWS_FILTERS,
  } },
  { id: "sidebar-news", selector: "#fs-news", widget: "news", config: {
    maxItems: 8,
    parseMax: 300,
    filters: NEWS_FILTERS,
  } },
  { id: "dashboard-space-weather", selector: "#dbp-helio-body", widget: "space-weather", config: {
    orientation: "horizontal",
  } },
  { id: "dashboard-observing-window", selector: "#dbp-window-body", widget: "observing-window", config: {
    orientation: "horizontal",
  } },
  { id: "dashboard-map", selector: "#db-map-root", widget: "map", config: {
    orientation: "horizontal",
    mapUrl: "/weather/map-poc.html",
  } },
];

export const consoleConfig = Object.freeze({
  version: 1,
  slots: Object.freeze(slots.map(slot => Object.freeze({
    ...slot,
    config: Object.freeze({ ...slot.config }),
  }))),
});

export const CONSOLE_CONFIG = consoleConfig;
export const consoleSlots = consoleConfig.slots;

export default consoleConfig;
