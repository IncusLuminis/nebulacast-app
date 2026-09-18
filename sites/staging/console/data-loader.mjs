import { normalizeLocation } from "../shared/request-registry.mjs";

/** Load the root console's data sources with explicit, testable inputs. */
async function readJson(fetchImpl, url, options = {}) {
  const response = await fetchImpl(url, options);
  return response.ok ? response.json() : null;
}

export async function loadConsoleData({ location, isDefaultSite, observerWeatherUrl, fetchImpl = fetch, requestRegistry = null, signal = null }) {
  const locationKey = normalizeLocation(location) ?? "default";
  const load = async requestSignal => {
  const sunMoonUrl = isDefaultSite(location)
    ? "/sky/data/sun_moon.json"
    : `/api/sun-moon?lat=${location.lat}&lon=${location.lon}&days=7&step_min=10`;

  const [wxPrimary, sw, sunMoon] = await Promise.all([
    readJson(fetchImpl, observerWeatherUrl, { cache: "no-store", signal: requestSignal }),
    readJson(fetchImpl, "/data/helio_now.json", { signal: requestSignal }),
    readJson(fetchImpl, sunMoonUrl, { cache: "no-store", signal: requestSignal }),
  ]);
  // The generated snapshot belongs to the default Warsaw site.  Never use it
  // to mask a failed observer-specific request for another context.
  const wx = wxPrimary ?? (isDefaultSite(location)
    ? await readJson(fetchImpl, "/data/observer_weather_now.json", { signal: requestSignal })
    : null);

  let validatedSunMoon = sunMoon;
  if (validatedSunMoon && validatedSunMoon.schema !== "sun_moon.v2") {
    console.error("[ephemeris] Unsupported sun/moon schema", {
      expected: "sun_moon.v2",
      actual: validatedSunMoon.schema ?? validatedSunMoon.version,
      source: sunMoonUrl,
    });
    validatedSunMoon = null;
  }
  if (validatedSunMoon?.ownership?.kind === "static" && !isDefaultSite(location)) {
    validatedSunMoon = null;
  }
  return { wx, sw, sunMoon: validatedSunMoon };
  };
  return requestRegistry ? requestRegistry.getOrCreate(locationKey, load) : load(signal || new AbortController().signal);
}
