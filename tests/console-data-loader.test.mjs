import test from "node:test";
import assert from "node:assert/strict";
import { loadConsoleData } from "../sites/staging/console/data-loader.mjs";

function mockFetch(routes) {
  return async (url) => {
    const value = routes[url];
    return { ok: value !== undefined, async json() { return value; } };
  };
}

test("loads location-aware data and rejects an incompatible ephemeris payload", async () => {
  const fetchImpl = mockFetch({
    "/weather.json": { hourly: [{ timestamp_utc: "2026-09-08T00:00:00Z" }] },
    "/data/helio_now.json": { metrics: {} },
    "/api/sun-moon?lat=48&lon=2&days=7&step_min=10": { schema: "sun_moon.v1" },
    "/data/observer_weather_now.json": { hourly: [] },
  });
  const result = await loadConsoleData({
    location: { lat: 48, lon: 2 }, isDefaultSite: () => false,
    observerWeatherUrl: "/weather.json", fetchImpl,
  });
  assert.equal(result.wx.hourly.length, 1);
  assert.equal(result.sw.metrics !== undefined, true);
  assert.equal(result.sunMoon, null);
});

test("keeps static sun/moon data only for the default site", async () => {
  const fetchImpl = mockFetch({
    "/weather.json": { hourly: [] },
    "/data/helio_now.json": {},
    "/sky/data/sun_moon.json": { schema: "sun_moon.v2", ownership: { kind: "static" } },
  });
  const result = await loadConsoleData({
    location: { lat: 52, lon: 21 }, isDefaultSite: loc => loc.lat === 52,
    observerWeatherUrl: "/weather.json", fetchImpl,
  });
  assert.equal(result.sunMoon.schema, "sun_moon.v2");
});

test("does not fall back to the Warsaw weather snapshot for another observer", async () => {
  const requested = [];
  const fetchImpl = async url => {
    requested.push(url);
    const routes = {
      "/data/helio_now.json": {},
      "/api/sun-moon?lat=54&lon=18&days=7&step_min=10": { schema: "sun_moon.v2", frames: [] },
      "/data/observer_weather_now.json": { hourly: [{ observer: "Warsaw" }] },
    };
    const value = routes[url];
    return { ok: value !== undefined && url !== "/api/observer-weather?lat=54&lon=18&tz=Europe%2FWarsaw&bortle=5", async json() { return value; } };
  };
  const result = await loadConsoleData({
    location: { lat: 54, lon: 18, tz: "Europe/Warsaw" }, isDefaultSite: () => false,
    observerWeatherUrl: "/api/observer-weather?lat=54&lon=18&tz=Europe%2FWarsaw&bortle=5", fetchImpl,
  });
  assert.equal(result.wx, null);
  assert.equal(requested.includes("/data/observer_weather_now.json"), false);
});
