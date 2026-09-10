import { createWidgetRegistry } from "./widget-registry.mjs";

const commonCapabilities = Object.freeze({
  observerAware: true,
  timeAware: true,
  multiInstance: true,
});

export const widgetCatalog = Object.freeze([
  Object.freeze({
    type: "astro",
    version: 1,
    defaults: Object.freeze({ orientation: "auto", theme: "inherit", density: "normal" }),
    capabilities: commonCapabilities,
    loader: () => import("../weather/widgets/astro/platform-adapter.mjs"),
  }),
  Object.freeze({
    type: "sun-moon",
    version: 1,
    defaults: Object.freeze({ orientation: "auto", theme: "inherit", density: "normal" }),
    capabilities: commonCapabilities,
    loader: () => import("../weather/widgets/sun_moon/platform-adapter.mjs"),
  }),
  Object.freeze({
    type: "weather",
    version: 1,
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
    defaults: Object.freeze({ orientation: "auto", theme: "inherit", density: "normal" }),
    capabilities: commonCapabilities,
    loader: () => import("../sky/platform-adapter.mjs"),
  }),
  Object.freeze({
    type: "news",
    version: 1,
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
    defaults: Object.freeze({
      orientation: "auto",
      theme: "inherit",
      density: "normal",
      jsonUrl: "/calendar/daily_signal.json",
      rssUrl: "/alerts/rss.xml",
      maxItems: 20,
      filters: Object.freeze(["All", "METEORS", "ECLIPSES", "CONJUNCTIONS", "OCCULTATIONS", "COMETS"]),
      iconBase: "/assets/icons/alerts",
    }),
    capabilities: Object.freeze({ observerAware: false, timeAware: false, multiInstance: true }),
    loader: () => import("../calendar/platform-adapter.mjs"),
  }),
]);

export function createCatalogRegistry() {
  return createWidgetRegistry(widgetCatalog);
}

export const widgetRegistry = createCatalogRegistry();
