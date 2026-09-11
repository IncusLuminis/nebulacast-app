import { createWidgetRegistry } from "./widget-registry.mjs";

const commonCapabilities = Object.freeze({
  observerAware: true,
  timeAware: true,
  multiInstance: true,
});

const COMMON_SUPPORTED_OPTIONS = Object.freeze({
  orientation: Object.freeze(["auto", "horizontal", "vertical"]),
  theme: Object.freeze(["inherit", "auto", "dark", "light"]),
  density: Object.freeze(["compact", "normal", "comfortable"]),
});
const WEATHER_SUPPORTED_OPTIONS = Object.freeze({
  ...COMMON_SUPPORTED_OPTIONS,
  profile: Object.freeze(["balanced", "visual", "broadband", "planetary"]),
  range: Object.freeze(["today", "48h", "7d"]),
});
const ASTRO_SUPPORTED_OPTIONS = Object.freeze({
  ...COMMON_SUPPORTED_OPTIONS,
  profile: Object.freeze(["default", "visual", "broadband", "planetary"]),
  range: Object.freeze(["today", "48h", "7d"]),
});
const EVENTS_SUPPORTED_OPTIONS = Object.freeze({
  ...COMMON_SUPPORTED_OPTIONS,
  timeRange: Object.freeze(["upcoming", "all"]),
});
const SPACE_WEATHER_SUPPORTED_OPTIONS = Object.freeze({
  orientation: Object.freeze(["horizontal", "vertical"]),
  theme: Object.freeze(["inherit", "auto", "dark", "light"]),
  density: Object.freeze(["compact", "normal", "comfortable"]),
});

function galleryMetadata(title, description, supportedOptions = COMMON_SUPPORTED_OPTIONS, galleryPreview = false) {
  return Object.freeze({ title, description, supportedOptions, galleryPreview });
}

export const widgetCatalog = Object.freeze([
  Object.freeze({
    type: "hero",
    version: 1,
    ...galleryMetadata("Hero", "Console hero strip with NQI, weather, Sun/Moon, Kp, clock, and panel launchers.", COMMON_SUPPORTED_OPTIONS, true),
    defaults: Object.freeze({ orientation: "auto", theme: "inherit", density: "normal" }),
    capabilities: commonCapabilities,
    loader: () => import("../hero/platform-adapter.mjs"),
  }),
  Object.freeze({
    type: "astro",
    version: 1,
    ...galleryMetadata("Astronomy", "Location-aware astronomy conditions and observing windows.", ASTRO_SUPPORTED_OPTIONS, true),
    defaults: Object.freeze({ orientation: "auto", theme: "inherit", density: "normal" }),
    capabilities: commonCapabilities,
    loader: () => import("../weather/widgets/astro/platform-adapter.mjs"),
  }),
  Object.freeze({
    type: "sun-moon",
    version: 1,
    ...galleryMetadata("Sun & Moon", "Sun altitude, twilight bands, Moon phase, and daily ephemeris.", COMMON_SUPPORTED_OPTIONS, true),
    defaults: Object.freeze({ orientation: "auto", theme: "inherit", density: "normal" }),
    capabilities: commonCapabilities,
    loader: () => import("../weather/widgets/sun_moon/platform-adapter.mjs"),
  }),
  Object.freeze({
    type: "weather",
    version: 1,
    standaloneHost: true,
    javascriptEmbed: true,
    standaloneStylesheet: "/weather/widgets/weather/weather.css",
    ...galleryMetadata("Weather", "Observer conditions with forecast profiles, hourly quality, and atmospheric parameters.", WEATHER_SUPPORTED_OPTIONS, true),
    defaults: Object.freeze({
      orientation: "auto",
      theme: "inherit",
      density: "normal",
      profile: "balanced",
      range: "7d",
    }),
    capabilities: Object.freeze({
      observerAware: true,
      timeAware: true,
      multiInstance: true,
      embed: true,
    }),
    loader: () => import("../weather/widgets/weather/platform-adapter.mjs"),
  }),
  Object.freeze({
    type: "map",
    version: 1,
    ...galleryMetadata("Cloud Map", "Interactive cloud, radar, wind, and terrain map.", COMMON_SUPPORTED_OPTIONS, false),
    defaults: Object.freeze({ orientation: "auto", theme: "inherit", density: "normal" }),
    capabilities: Object.freeze({
      observerAware: true,
      timeAware: true,
      multiInstance: true,
      embed: true,
    }),
    loader: () => import("../weather/widgets/map/platform-adapter.mjs"),
  }),
  Object.freeze({
    type: "location",
    version: 1,
    ...galleryMetadata("Location", "Root-scoped observer location search and selection control.", COMMON_SUPPORTED_OPTIONS, true),
    defaults: Object.freeze({ orientation: "auto", theme: "inherit", density: "normal" }),
    capabilities: Object.freeze({ observerAware: true, timeAware: false, multiInstance: true, embed: true }),
    loader: async () => ({
      mount(root, context, config, host) {
        return import("../weather/widgets/location/platform-adapter.mjs")
          .then(module => module.mountLocationPlatform(root, context, config, host));
      },
    }),
  }),
  Object.freeze({
    type: "sky",
    version: 1,
    ...galleryMetadata("Sky", "Canvas sky chart with stars, objects, planets, and alert overlays.", COMMON_SUPPORTED_OPTIONS, false),
    defaults: Object.freeze({ orientation: "auto", theme: "inherit", density: "normal" }),
    capabilities: commonCapabilities,
    loader: () => import("../sky/platform-adapter.mjs"),
  }),
  Object.freeze({
    type: "news",
    version: 1,
    ...galleryMetadata("News", "RSS astronomy and space news feed with category filters.", COMMON_SUPPORTED_OPTIONS, false),
    defaults: Object.freeze({
      orientation: "auto",
      theme: "inherit",
      density: "normal",
      rssUrl: "/news/rss.xml",
      maxItems: 12,
      parseMax: 300,
      filters: Object.freeze(["All", "News", "Science", "Videos", "Images", "Nebulacast"]),
    }),
    capabilities: Object.freeze({ observerAware: false, timeAware: false, multiInstance: true }),
    loader: () => import("../news/platform-adapter.mjs"),
  }),
  Object.freeze({
    type: "events",
    version: 1,
    standaloneHost: true,
    standaloneStylesheet: "/assets/css/widget_calendar.css",
    javascriptEmbed: true,
    ...galleryMetadata("Calendar", "Upcoming meteors, eclipses, conjunctions, occultations, and comets.", EVENTS_SUPPORTED_OPTIONS, false),
    defaults: Object.freeze({
      orientation: "auto",
      theme: "inherit",
      density: "normal",
      jsonUrl: "/calendar/daily_signal.json",
      rssUrl: "/alerts/rss.xml",
      maxItems: 20,
      timeRange: "upcoming",
      filters: Object.freeze(["All", "METEORS", "ECLIPSES", "CONJUNCTIONS", "OCCULTATIONS", "COMETS"]),
      iconBase: "/assets/icons/alerts",
    }),
    capabilities: Object.freeze({ observerAware: false, timeAware: false, multiInstance: true }),
    loader: () => import("../calendar/platform-adapter.mjs"),
  }),
  Object.freeze({
    type: "alerts",
    version: 1,
    standaloneHost: true,
    standaloneStylesheet: "/alerts/widget.css",
    javascriptEmbed: true,
    ...galleryMetadata("Sky Alerts", "Live space-event alerts grouped by risk, NEO, transient, and related types.", COMMON_SUPPORTED_OPTIONS, true),
    defaults: Object.freeze({
      orientation: "auto",
      theme: "inherit",
      density: "normal",
      dataUrl: "/sky/data/alerts_now.json",
      maxItems: 20,
    }),
    capabilities: Object.freeze({ observerAware: false, timeAware: false, multiInstance: true, embed: true }),
    loader: () => import("../alerts/platform-adapter.mjs"),
  }),
  Object.freeze({
    type: "space-weather",
    version: 1,
    shape: "oriented",
    userModes: Object.freeze(["horizontal", "vertical"]),
    ...galleryMetadata("Space Weather", "Solar, geomagnetic, aurora, and satellite-impact conditions.", SPACE_WEATHER_SUPPORTED_OPTIONS, true),
    defaults: Object.freeze({ orientation: "horizontal", theme: "inherit", density: "normal" }),
    capabilities: Object.freeze({ observerAware: false, timeAware: false, multiInstance: true, embed: false }),
    loader: () => import("../helio/platform-adapter.mjs"),
  }),
]);

export function createCatalogRegistry() {
  return createWidgetRegistry(widgetCatalog);
}

export const widgetRegistry = createCatalogRegistry();
