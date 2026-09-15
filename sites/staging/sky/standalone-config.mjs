const DEFAULT_LAT = 52.2297;
const DEFAULT_LON = 21.0122;

export function buildStandaloneSkyConfig(search = "") {
  const params = new URLSearchParams(search);
  const lat = parseFloat(params.get("lat") ?? "");
  const lon = parseFloat(params.get("lon") ?? "");
  return {
    baseUrl: "/sky",
    mountId: "skyMount",
    lat: Number.isFinite(lat) && lat >= -90 && lat <= 90 ? lat : DEFAULT_LAT,
    lon: Number.isFinite(lon) && lon >= -180 && lon <= 180 ? lon : DEFAULT_LON,
    datetimeISO: params.get("datetime") || null,
  };
}

export function createStandaloneSkyContext(config) {
  let snapshot = {
    observer: { name: config.name ?? null, lat: config.lat, lon: config.lon, timezone: config.timezone ?? null },
    time: { mode: config.datetimeISO ? "manual" : "live", datetimeISO: config.datetimeISO ?? null },
    locale: config.locale ?? "en",
    theme: config.theme ?? "light",
  };
  const listeners = new Set();
  return {
    get() { return structuredClone(snapshot); },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    update(patch = {}) {
      snapshot = {
        ...snapshot,
        ...patch,
        observer: patch.observer ? { ...snapshot.observer, ...patch.observer } : snapshot.observer,
        time: patch.time ? { ...snapshot.time, ...patch.time } : snapshot.time,
      };
      for (const listener of [...listeners]) listener(structuredClone(snapshot));
      return structuredClone(snapshot);
    },
  };
}
