import { mountWeather } from "./weather.js";

export function mountWeatherVertical(rootEl, storeApi) {
  return mountWeather(rootEl, storeApi, { layout: "vertical" });
}

/**
 * Embed-ready API for external sites (e.g. nebulacast.com).
 * Usage:
 *   WeatherWidget.mount({ mountId: "weatherVerticalMount", layout: "vertical", lat: 52.2297, lon: 21.0122, timezone: "Europe/Warsaw" });
 */
export const WeatherWidget = {
  mount(options) {
    const mountId = options?.mountId;
    if (!mountId) {
      console.error("[WeatherWidget] mountId is required");
      return null;
    }
    const rootEl = document.getElementById(mountId);
    if (!rootEl) {
      console.error("[WeatherWidget] Element not found:", mountId);
      return null;
    }
    let location = {
      lat: options.lat ?? 52.2297,
      lon: options.lon ?? 21.0122,
      tz: options.timezone ?? "Europe/Warsaw",
      name: options.name ?? "Weather"
    };
    if (options.lat == null && options.lon == null) {
      try {
        const stored = localStorage.getItem("nc-weather-location");
        if (stored) {
          const loc = JSON.parse(stored);
          if (loc && typeof loc.lat === "number" && typeof loc.lon === "number") {
            location = { ...location, ...loc };
          }
        }
      } catch (e) {}
    }
    let state = { location, profile: "balanced", range: "today", source: "user" };
    const subscribers = new Set();
    const storeApi = {
      getState: () => JSON.parse(JSON.stringify(state)),
      setState: (partial) => {
        if (partial?.location) state.location = { ...state.location, ...partial.location };
        if (partial?.profile !== undefined) state.profile = partial.profile;
        if (partial?.range !== undefined) state.range = partial.range;
        subscribers.forEach((fn) => fn(storeApi.getState()));
      },
      subscribe: (fn) => {
        subscribers.add(fn);
        return () => subscribers.delete(fn);
      }
    };
    const layout = options.layout === "vertical" ? "vertical" : "default";
    return mountWeather(rootEl, storeApi, { layout });
  }
};
